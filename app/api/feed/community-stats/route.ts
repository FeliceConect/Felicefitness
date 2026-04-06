/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// GET - Community stats for the live bar
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
    }

    const supabaseAdmin = getAdminClient()

    // Get start of today in São Paulo timezone
    const now = new Date()
    const spOffset = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
    const todayStart = new Date(spOffset)
    todayStart.setHours(0, 0, 0, 0)
    const diffMs = now.getTime() - spOffset.getTime()
    const todayStartUTC = new Date(todayStart.getTime() + diffMs)

    // Get start of week (Monday) in São Paulo timezone
    const weekStart = new Date(spOffset)
    const dayOfWeek = weekStart.getDay()
    weekStart.setDate(weekStart.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1))
    weekStart.setHours(0, 0, 0, 0)
    const weekStartUTC = new Date(weekStart.getTime() + diffMs)

    // Active users today (distinct user_ids who posted)
    const { data: todayPosts } = await supabaseAdmin
      .from('fitness_community_posts')
      .select('user_id')
      .eq('is_visible', true)
      .gte('created_at', todayStartUTC.toISOString())

    const activeToday = new Set((todayPosts || []).map(p => p.user_id)).size

    // Check if current user posted today
    const userPostedToday = (todayPosts || []).some(p => p.user_id === user.id)

    // Posts this week
    const { count: postsWeek } = await supabaseAdmin
      .from('fitness_community_posts')
      .select('*', { count: 'exact', head: true })
      .eq('is_visible', true)
      .gte('created_at', weekStartUTC.toISOString())

    // Workouts this week
    const { count: workoutsWeek } = await supabaseAdmin
      .from('fitness_community_posts')
      .select('*', { count: 'exact', head: true })
      .eq('is_visible', true)
      .eq('post_type', 'workout')
      .gte('created_at', weekStartUTC.toISOString())

    // Reactions this week
    const { count: reactionsWeek } = await supabaseAdmin
      .from('fitness_community_reactions')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', weekStartUTC.toISOString())

    return NextResponse.json({
      success: true,
      stats: {
        active_today: activeToday,
        posts_week: postsWeek || 0,
        workouts_week: workoutsWeek || 0,
        reactions_week: reactionsWeek || 0,
        user_posted_today: userPostedToday,
      },
    })
  } catch (error) {
    console.error('Erro na API community-stats:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}
