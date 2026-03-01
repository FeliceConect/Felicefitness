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

// GET - Get specific ranking with full leaderboard
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Nao autorizado' }, { status: 401 })
    }

    const supabaseAdmin = getAdminClient()
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get ranking
    const { data: ranking, error: rankError } = await supabaseAdmin
      .from('fitness_rankings')
      .select('*')
      .eq('id', id)
      .single()

    if (rankError || !ranking) {
      return NextResponse.json({ success: false, error: 'Ranking nao encontrado' }, { status: 404 })
    }

    // Get participants ordered by points
    const { data: participants, count } = await supabaseAdmin
      .from('fitness_ranking_participants')
      .select('user_id, total_points, joined_at', { count: 'exact' })
      .eq('ranking_id', id)
      .order('total_points', { ascending: false })
      .range(offset, offset + limit - 1)

    // Get profiles for display names
    const userIds = (participants || []).map(p => p.user_id)
    let profiles = []
    if (userIds.length > 0) {
      const { data } = await supabaseAdmin
        .from('fitness_profiles')
        .select('id, nome, apelido_ranking, ranking_visivel, nivel, streak_atual')
        .in('id', userIds)
      profiles = data || []
    }

    const profileMap = {}
    for (const p of profiles) {
      profileMap[p.id] = p
    }

    // Build leaderboard
    const leaderboard = (participants || []).map((p, index) => {
      const profile = profileMap[p.user_id]
      const isVisible = profile?.ranking_visivel !== false
      return {
        position: offset + index + 1,
        user_id: p.user_id,
        display_name: isVisible
          ? (profile?.apelido_ranking || profile?.nome?.split(' ')[0] || `Atleta #${p.user_id.substring(0, 4)}`)
          : `Atleta #${p.user_id.substring(0, 4)}`,
        total_points: p.total_points,
        nivel: profile?.nivel || 1,
        streak: profile?.streak_atual || 0,
        is_current_user: p.user_id === user.id,
        joined_at: p.joined_at,
      }
    })

    // Find user's position (search full list if not in current page)
    let userPosition = null
    let userPoints = 0
    const userInPage = leaderboard.find(l => l.is_current_user)
    if (userInPage) {
      userPosition = userInPage.position
      userPoints = userInPage.total_points
    } else {
      // Count how many have more points than user
      const { data: userPart } = await supabaseAdmin
        .from('fitness_ranking_participants')
        .select('total_points')
        .eq('ranking_id', id)
        .eq('user_id', user.id)
        .single()

      if (userPart) {
        userPoints = userPart.total_points
        const { count: above } = await supabaseAdmin
          .from('fitness_ranking_participants')
          .select('id', { count: 'exact', head: true })
          .eq('ranking_id', id)
          .gt('total_points', userPart.total_points)

        userPosition = (above || 0) + 1
      }
    }

    return NextResponse.json({
      success: true,
      ranking,
      leaderboard,
      total_participants: count || 0,
      user_position: userPosition,
      user_points: userPoints,
      has_more: (participants || []).length === limit,
    })
  } catch (error) {
    console.error('Erro na API de ranking:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}

// PATCH - Update ranking (superadmin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Nao autorizado' }, { status: 401 })
    }

    const supabaseAdmin = getAdminClient()
    const { data: profile } = await supabaseAdmin
      .from('fitness_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'super_admin') {
      return NextResponse.json({ success: false, error: 'Acesso restrito' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const updates = {}

    if (body.name !== undefined) updates.name = body.name
    if (body.description !== undefined) updates.description = body.description
    if (body.is_active !== undefined) updates.is_active = body.is_active
    if (body.start_date !== undefined) updates.start_date = body.start_date
    if (body.end_date !== undefined) updates.end_date = body.end_date
    if (body.point_rules !== undefined) updates.point_rules = body.point_rules

    const { data: ranking, error: updateError } = await supabaseAdmin
      .from('fitness_rankings')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Erro ao atualizar ranking:', updateError)
      return NextResponse.json({ success: false, error: 'Erro ao atualizar' }, { status: 500 })
    }

    return NextResponse.json({ success: true, ranking })
  } catch (error) {
    console.error('Erro na API de ranking:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}

// DELETE - Deactivate ranking (superadmin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Nao autorizado' }, { status: 401 })
    }

    const supabaseAdmin = getAdminClient()
    const { data: profile } = await supabaseAdmin
      .from('fitness_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'super_admin') {
      return NextResponse.json({ success: false, error: 'Acesso restrito' }, { status: 403 })
    }

    const { id } = await params
    const { error } = await supabaseAdmin
      .from('fitness_rankings')
      .update({ is_active: false })
      .eq('id', id)

    if (error) {
      console.error('Erro ao desativar ranking:', error)
      return NextResponse.json({ success: false, error: 'Erro ao desativar' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Ranking desativado' })
  } catch (error) {
    console.error('Erro na API de ranking:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}
