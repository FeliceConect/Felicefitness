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

// GET - Challenge detail + leaderboard
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
    }

    const db = getAdminClient()
    const { id: challengeId } = await params

    // Get challenge
    const { data: challenge } = await db
      .from('fitness_challenges')
      .select('*')
      .eq('id', challengeId)
      .single()

    if (!challenge) {
      return NextResponse.json({ success: false, error: 'Desafio não encontrado' }, { status: 404 })
    }

    // Get leaderboard (top 50)
    const { data: participants } = await db
      .from('fitness_challenge_participants')
      .select('user_id, score, current_position, joined_at')
      .eq('challenge_id', challengeId)
      .order('score', { ascending: false })
      .limit(50)

    // Enrich with names + tier
    const userIds = (participants || []).map(p => p.user_id)
    const profileMap = {}
    if (userIds.length > 0) {
      const { data: profiles } = await db
        .from('fitness_profiles')
        .select('id, nome, display_name, apelido_ranking, status_tier')
        .in('id', userIds)

      for (const p of (profiles || [])) {
        profileMap[p.id] = {
          name: p.display_name || p.apelido_ranking || p.nome?.split(' ')[0] || 'Anônimo',
          tier: p.status_tier || 'bronze',
        }
      }
    }

    const leaderboard = (participants || []).map((p, idx) => ({
      position: idx + 1,
      user_id: p.user_id,
      name: profileMap[p.user_id]?.name || 'Anônimo',
      tier: profileMap[p.user_id]?.tier || 'bronze',
      score: p.score,
      is_self: p.user_id === user.id,
    }))

    // User's participation
    const userEntry = leaderboard.find(e => e.is_self)

    return NextResponse.json({
      success: true,
      challenge,
      leaderboard,
      user_position: userEntry?.position || null,
      user_score: userEntry?.score || 0,
      is_joined: !!userEntry,
    })
  } catch (error) {
    console.error('Erro:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}

// POST - Join a challenge
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
    }

    const db = getAdminClient()
    const { id: challengeId } = await params

    // Check challenge exists and is active
    const { data: challenge } = await db
      .from('fitness_challenges')
      .select('id, is_active, end_date')
      .eq('id', challengeId)
      .single()

    if (!challenge || !challenge.is_active) {
      return NextResponse.json({ success: false, error: 'Desafio não disponível' }, { status: 404 })
    }

    const today = new Date().toISOString().split('T')[0]
    if (challenge.end_date < today) {
      return NextResponse.json({ success: false, error: 'Desafio já encerrou' }, { status: 400 })
    }

    // Check if already joined
    const { data: existing } = await db
      .from('fitness_challenge_participants')
      .select('id')
      .eq('challenge_id', challengeId)
      .eq('user_id', user.id)
      .limit(1)

    if (existing && existing.length > 0) {
      return NextResponse.json({ success: true, message: 'Já está participando!' })
    }

    // Join
    const { error: joinError } = await db
      .from('fitness_challenge_participants')
      .insert({
        challenge_id: challengeId,
        user_id: user.id,
        score: 0,
      })

    if (joinError) {
      console.error('Erro ao participar:', joinError)
      return NextResponse.json({ success: false, error: 'Erro ao participar: ' + joinError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Participação confirmada!' })
  } catch (error) {
    console.error('Erro:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}
