/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-unused-vars */
// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { sendPushToMultiple, validatePushConfig } from '@/lib/notifications/push'
import { getTodayDateSP, getDateOffsetSP } from '@/lib/utils/date'

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

/**
 * Weekly Recap — Runs every Sunday at 10am Brazil time (13h UTC)
 *
 * For each active client:
 * - Calculates weekly stats (workouts, points, streak, ranking position)
 * - Sends push notification with summary
 * - Saves recap data for dashboard display
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = getAdminClient()

    // Calculate week range (Mon-Sun em America/Sao_Paulo)
    // O cron dispara quando ainda é domingo no BRT.
    const weekEnd = getTodayDateSP()
    const weekStart = getDateOffsetSP(-6)

    // Get all active clients
    const { data: clients } = await db
      .from('fitness_profiles')
      .select('id, nome, streak_atual')
      .eq('role', 'client')

    if (!clients || clients.length === 0) {
      return NextResponse.json({ success: true, sent: 0, message: 'No clients' })
    }

    let sentCount = 0

    for (const client of clients) {
      try {
        // Get weekly workouts
        const { count: workoutCount } = await db
          .from('fitness_workouts')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', client.id)
          .eq('status', 'concluido')
          .gte('data', weekStart)
          .lte('data', weekEnd)

        // Get weekly points
        const { data: weekPoints } = await db
          .from('fitness_point_transactions')
          .select('points')
          .eq('user_id', client.id)
          .gte('created_at', weekStart + 'T00:00:00')
          .lte('created_at', weekEnd + 'T23:59:59')

        const totalPoints = (weekPoints || []).reduce((sum, p) => sum + p.points, 0)

        // Get ranking position (from first active ranking)
        let rankingPosition = null
        const { data: rankings } = await db
          .from('fitness_ranking_participants')
          .select('ranking_id, total_points')
          .eq('user_id', client.id)
          .order('total_points', { ascending: false })
          .limit(1)

        if (rankings && rankings.length > 0) {
          const { count: above } = await db
            .from('fitness_ranking_participants')
            .select('id', { count: 'exact', head: true })
            .eq('ranking_id', rankings[0].ranking_id)
            .gt('total_points', rankings[0].total_points)
          rankingPosition = (above || 0) + 1
        }

        // Skip users with zero activity
        if ((workoutCount || 0) === 0 && totalPoints === 0) continue

        // Build recap data
        const recapData = {
          user_id: client.id,
          week_start: weekStart,
          week_end: weekEnd,
          workouts: workoutCount || 0,
          points: totalPoints,
          streak: client.streak_atual || 0,
          ranking_position: rankingPosition,
          created_at: new Date().toISOString(),
        }

        // Save recap (upsert by user_id + week_start for idempotency)
        await db
          .from('fitness_weekly_recaps')
          .upsert(recapData, { onConflict: 'user_id,week_start' })
          .catch(() => {
            // Table might not exist yet, that's OK — push notification still goes out
          })

        // Send push notification
        if (validatePushConfig()) {
          const { data: subs } = await db
            .from('fitness_push_subscriptions')
            .select('*')
            .eq('user_id', client.id)
            .eq('active', true)

          if (subs && subs.length > 0) {
            const streakText = client.streak_atual > 0 ? ` | Streak: ${client.streak_atual} dias` : ''
            const rankText = rankingPosition ? ` | Ranking: #${rankingPosition}` : ''

            await sendPushToMultiple(subs, {
              title: '📊 Seu Recap Semanal',
              body: `${workoutCount || 0} treinos | +${totalPoints} pts${streakText}${rankText}`,
              icon: '/icons/icon-192.png',
              badge: '/icons/badge-72.png',
              data: {
                url: '/dashboard',
                type: 'weekly_recap',
              },
              tag: `weekly-recap-${weekStart}`,
            })
            sentCount++
          }
        }
      } catch {
        // Skip individual user errors
      }
    }

    return NextResponse.json({
      success: true,
      sent: sentCount,
      total_clients: clients.length,
      week: `${weekStart} — ${weekEnd}`,
    })
  } catch (error) {
    console.error('Weekly recap cron error:', error)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
