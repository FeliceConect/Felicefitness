/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-unused-vars */
// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

/**
 * GET - Fetch current week's recap data for the logged-in user.
 * Calculates on-the-fly (no dependency on cron having run).
 */
export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
    }

    const db = getAdminClient()

    // Calculate week range (Monday to Sunday)
    const now = new Date()
    const day = now.getDay() // 0=Sun, 1=Mon...
    const diffToMonday = day === 0 ? 6 : day - 1
    const monday = new Date(now)
    monday.setDate(now.getDate() - diffToMonday)
    const weekStart = monday.toISOString().split('T')[0]
    const weekEnd = now.toISOString().split('T')[0]

    // Workouts this week
    const { count: workoutCount } = await db
      .from('fitness_workouts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'concluido')
      .gte('data', weekStart)
      .lte('data', weekEnd)

    // Points this week
    const { data: weekPoints } = await db
      .from('fitness_point_transactions')
      .select('points, category')
      .eq('user_id', user.id)
      .gte('created_at', weekStart + 'T00:00:00')
      .lte('created_at', weekEnd + 'T23:59:59')

    const totalPoints = (weekPoints || []).reduce((sum, p) => sum + p.points, 0)

    // Points by category
    const byCategory: Record<string, number> = {}
    for (const p of (weekPoints || [])) {
      byCategory[p.category] = (byCategory[p.category] || 0) + p.points
    }

    // Streak
    const { data: profile } = await db
      .from('fitness_profiles')
      .select('streak_atual, maior_streak, xp_total')
      .eq('id', user.id)
      .single()

    // Ranking position — try multi-ranking first, fall back to legacy XP ranking
    let rankingPosition = null
    const { data: rankings } = await db
      .from('fitness_ranking_participants')
      .select('ranking_id, total_points')
      .eq('user_id', user.id)
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

    // Fallback: legacy XP-based position
    if (!rankingPosition) {
      const { count: aboveXp } = await db
        .from('fitness_profiles')
        .select('id', { count: 'exact', head: true })
        .gt('xp_total', profile?.xp_total || 0)
      if (aboveXp !== null) {
        rankingPosition = aboveXp + 1
      }
    }

    return NextResponse.json({
      success: true,
      recap: {
        week_start: weekStart,
        week_end: weekEnd,
        workouts: workoutCount || 0,
        points: totalPoints,
        points_by_category: byCategory,
        streak: profile?.streak_atual || 0,
        best_streak: profile?.maior_streak || 0,
        ranking_position: rankingPosition,
      },
    })
  } catch (error) {
    console.error('Recap API error:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}
