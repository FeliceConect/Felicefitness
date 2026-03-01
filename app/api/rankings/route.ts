/* eslint-disable @typescript-eslint/ban-ts-comment */
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

// GET - List active rankings with user positions
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Nao autorizado' }, { status: 401 })
    }

    const supabaseAdmin = getAdminClient()
    const { searchParams } = new URL(request.url)
    const includeLeaderboard = searchParams.get('leaderboard') !== 'false'
    const limit = parseInt(searchParams.get('limit') || '20')

    // Get all active rankings
    const { data: rankings, error: rankError } = await supabaseAdmin
      .from('fitness_rankings')
      .select('*')
      .eq('is_active', true)
      .order('type', { ascending: true })

    if (rankError) {
      console.error('Erro ao buscar rankings:', rankError)
      return NextResponse.json({ success: false, error: 'Erro ao buscar rankings' }, { status: 500 })
    }

    // For each ranking, get user's position and optionally the leaderboard
    const rankingsWithData = await Promise.all((rankings || []).map(async (ranking) => {
      // Get all participants ordered by points
      const { data: participants } = await supabaseAdmin
        .from('fitness_ranking_participants')
        .select('user_id, total_points')
        .eq('ranking_id', ranking.id)
        .order('total_points', { ascending: false })

      const allParticipants = participants || []

      // Find user's position
      const userIndex = allParticipants.findIndex(p => p.user_id === user.id)
      const userPosition = userIndex >= 0 ? userIndex + 1 : null
      const userPoints = userIndex >= 0 ? allParticipants[userIndex].total_points : 0

      // Build leaderboard with display names
      let leaderboard = []
      if (includeLeaderboard) {
        const topParticipants = allParticipants.slice(0, limit)
        if (topParticipants.length > 0) {
          const userIds = topParticipants.map(p => p.user_id)
          const { data: profiles } = await supabaseAdmin
            .from('fitness_profiles')
            .select('id, nome, apelido_ranking, ranking_visivel, nivel, streak_atual')
            .in('id', userIds)

          const profileMap = {}
          for (const p of (profiles || [])) {
            profileMap[p.id] = p
          }

          leaderboard = topParticipants.map((p, index) => {
            const profile = profileMap[p.user_id]
            const isVisible = profile?.ranking_visivel !== false
            return {
              position: index + 1,
              user_id: p.user_id,
              display_name: isVisible
                ? (profile?.apelido_ranking || profile?.nome?.split(' ')[0] || `Atleta #${p.user_id.substring(0, 4)}`)
                : `Atleta #${p.user_id.substring(0, 4)}`,
              total_points: p.total_points,
              nivel: profile?.nivel || 1,
              streak: profile?.streak_atual || 0,
              is_current_user: p.user_id === user.id,
            }
          })
        }
      }

      return {
        ...ranking,
        user_position: userPosition,
        user_points: userPoints,
        total_participants: allParticipants.length,
        leaderboard,
      }
    }))

    // Also return legacy XP-based ranking data for backwards compatibility
    const { data: xpProfile } = await supabaseAdmin
      .from('fitness_profiles')
      .select('xp_total, nivel, streak_atual, apelido_ranking')
      .eq('id', user.id)
      .single()

    return NextResponse.json({
      success: true,
      rankings: rankingsWithData,
      userXP: {
        xp_total: xpProfile?.xp_total || 0,
        nivel: xpProfile?.nivel || 1,
        streak: xpProfile?.streak_atual || 0,
        apelido: xpProfile?.apelido_ranking || null,
      },
    })
  } catch (error) {
    console.error('Erro na API de rankings:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}

// POST - Create a new ranking (superadmin only)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Nao autorizado' }, { status: 401 })
    }

    const supabaseAdmin = getAdminClient()

    // Check superadmin
    const { data: profile } = await supabaseAdmin
      .from('fitness_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'super_admin') {
      return NextResponse.json({ success: false, error: 'Acesso restrito' }, { status: 403 })
    }

    const body = await request.json()
    const { name, type, category, start_date, end_date, description, point_rules, add_all_clients, selected_client_ids } = body

    if (!name || !type) {
      return NextResponse.json({ success: false, error: 'Nome e tipo sao obrigatorios' }, { status: 400 })
    }

    const { data: ranking, error: insertError } = await supabaseAdmin
      .from('fitness_rankings')
      .insert({
        name,
        type,
        category: category || null,
        start_date: start_date || null,
        end_date: end_date || null,
        description: description || null,
        point_rules: point_rules || {},
        is_active: true,
        created_by: user.id,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Erro ao criar ranking:', insertError)
      return NextResponse.json({ success: false, error: 'Erro ao criar ranking' }, { status: 500 })
    }

    // Add participants based on selection mode
    if (add_all_clients) {
      // Add ALL clients
      const { data: clients } = await supabaseAdmin
        .from('fitness_profiles')
        .select('id')
        .eq('role', 'client')

      if (clients && clients.length > 0) {
        const participants = clients.map(c => ({
          ranking_id: ranking.id,
          user_id: c.id,
          total_points: 0,
        }))

        await supabaseAdmin
          .from('fitness_ranking_participants')
          .insert(participants)
      }
    } else if (selected_client_ids && Array.isArray(selected_client_ids) && selected_client_ids.length > 0) {
      // Add only selected clients
      const participants = selected_client_ids.map((clientId: string) => ({
        ranking_id: ranking.id,
        user_id: clientId,
        total_points: 0,
      }))

      await supabaseAdmin
        .from('fitness_ranking_participants')
        .insert(participants)
    }

    return NextResponse.json({ success: true, ranking })
  } catch (error) {
    console.error('Erro na API de rankings:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}
