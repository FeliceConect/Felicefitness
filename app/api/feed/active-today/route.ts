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

// GET - List users who posted today (for stories-style avatars)
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
    // Convert back to UTC for the query
    const diffMs = now.getTime() - spOffset.getTime()
    const todayStartUTC = new Date(todayStart.getTime() + diffMs)

    // Get distinct users who posted today
    const { data: posts, error } = await supabaseAdmin
      .from('fitness_community_posts')
      .select('user_id, post_type, created_at')
      .eq('is_visible', true)
      .gte('created_at', todayStartUTC.toISOString())
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar posts ativos:', error)
      return NextResponse.json({ success: false, error: 'Erro ao buscar dados' }, { status: 500 })
    }

    // Deduplicate by user, keep most recent post info
    const userMap = new Map()
    for (const post of (posts || [])) {
      if (!userMap.has(post.user_id)) {
        userMap.set(post.user_id, {
          user_id: post.user_id,
          last_post_type: post.post_type,
          post_count: 1,
        })
      } else {
        userMap.get(post.user_id).post_count++
      }
    }

    const userIds = [...userMap.keys()]
    if (userIds.length === 0) {
      return NextResponse.json({ success: true, active_users: [] })
    }

    // Fetch profile info
    const { data: profiles } = await supabaseAdmin
      .from('fitness_profiles')
      .select('id, nome, display_name, apelido_ranking, role, status_tier, foto_url')
      .in('id', userIds)

    const profileMap = new Map()
    for (const p of (profiles || [])) {
      profileMap.set(p.id, p)
    }

    const activeUsers = userIds.map(uid => {
      const info = userMap.get(uid)
      const profile = profileMap.get(uid)
      const displayName = profile?.display_name || profile?.apelido_ranking || profile?.nome?.split(' ')[0] || 'Anônimo'
      return {
        user_id: uid,
        name: displayName,
        initial: displayName.charAt(0).toUpperCase(),
        role: profile?.role || 'client',
        tier: profile?.status_tier || 'bronze',
        foto_url: profile?.foto_url || null,
        last_post_type: info.last_post_type,
        post_count: info.post_count,
        is_self: uid === user.id,
      }
    })

    // Sort: professionals first, then by post count
    const ROLE_PRIORITY: Record<string, number> = {
      super_admin: 0, admin: 1, nutritionist: 2, trainer: 3, coach: 4, client: 5,
    }
    activeUsers.sort((a, b) => {
      const rA = ROLE_PRIORITY[a.role] ?? 5
      const rB = ROLE_PRIORITY[b.role] ?? 5
      if (rA !== rB) return rA - rB
      return b.post_count - a.post_count
    })

    return NextResponse.json({ success: true, active_users: activeUsers })
  } catch (error) {
    console.error('Erro na API active-today:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}
