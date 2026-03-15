import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { notifyStreakRisk } from '@/lib/notifications/social'

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

/**
 * Streak Risk Alert — Runs daily at 20h Brazil time (23h UTC)
 *
 * Finds users who have a streak >= 2 but haven't logged any activity today.
 * Sends push notification warning them their streak is at risk.
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = getAdminClient()

    // Get today's date in Brazil timezone
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })

    // Find users with streak >= 2 who haven't done anything today
    // Check: no workout, no water log, no meal, no check-in today
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profiles } = await (db as any)
      .from('fitness_profiles')
      .select('id, streak_atual')
      .gte('streak_atual', 2)
      .eq('role', 'client')

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ success: true, notified: 0, message: 'No at-risk streaks' })
    }

    let notifiedCount = 0

    for (const profile of profiles) {
      // Check if user had any activity today
      const [workouts, water, meals, checkins] = await Promise.all([
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (db as any).from('fitness_workouts').select('id', { count: 'exact', head: true }).eq('user_id', profile.id).eq('data', today),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (db as any).from('fitness_water_logs').select('id', { count: 'exact', head: true }).eq('user_id', profile.id).gte('created_at', today + 'T00:00:00'),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (db as any).from('fitness_meals').select('id', { count: 'exact', head: true }).eq('user_id', profile.id).eq('data', today),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (db as any).from('fitness_wellness_checkins').select('id', { count: 'exact', head: true }).eq('user_id', profile.id).eq('data', today),
      ])

      const hasActivity = (workouts.count || 0) > 0 || (water.count || 0) > 0 || (meals.count || 0) > 0 || (checkins.count || 0) > 0

      if (!hasActivity) {
        await notifyStreakRisk(profile.id, profile.streak_atual)
        notifiedCount++
      }
    }

    return NextResponse.json({
      success: true,
      notified: notifiedCount,
      total_checked: profiles.length,
    })
  } catch (error) {
    console.error('Streak alert cron error:', error)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
