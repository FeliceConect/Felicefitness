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

// GET - List active challenges + user participation
export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
    }

    const db = getAdminClient()
    const today = new Date().toISOString().split('T')[0]

    // Get all active challenges (current or upcoming)
    const { data: challenges } = await db
      .from('fitness_challenges')
      .select('*')
      .eq('is_active', true)
      .gte('end_date', today)
      .order('start_date', { ascending: true })

    if (!challenges || challenges.length === 0) {
      return NextResponse.json({ success: true, challenges: [] })
    }

    // Get user participation across all challenges
    const challengeIds = challenges.map(c => c.id)
    const { data: participations } = await db
      .from('fitness_challenge_participants')
      .select('challenge_id, score, current_position')
      .eq('user_id', user.id)
      .in('challenge_id', challengeIds)

    const participationMap = {}
    for (const p of (participations || [])) {
      participationMap[p.challenge_id] = p
    }

    // Filter: show public challenges + private challenges where user is a participant
    const visible = challenges.filter(c => {
      if (!c.is_private) return true
      return !!participationMap[c.id]
    })

    // Get participant counts
    const enriched = await Promise.all(visible.map(async (c) => {
      const { count } = await db
        .from('fitness_challenge_participants')
        .select('id', { count: 'exact', head: true })
        .eq('challenge_id', c.id)

      return {
        ...c,
        participant_count: count || 0,
        is_joined: !!participationMap[c.id],
        user_score: participationMap[c.id]?.score || 0,
        user_position: participationMap[c.id]?.current_position || null,
        has_started: c.start_date <= today,
      }
    }))

    return NextResponse.json({ success: true, challenges: enriched })
  } catch (error) {
    console.error('Erro ao buscar desafios:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}

// POST - Create a challenge (superadmin only)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
    }

    const db = getAdminClient()

    // Check role
    const { data: profile } = await db
      .from('fitness_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'super_admin') {
      return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 })
    }

    const body = await request.json()
    const { title, description, challenge_type, scoring_category, start_date, end_date, is_private, invited_user_ids } = body

    if (!title || !start_date || !end_date) {
      return NextResponse.json({ success: false, error: 'Titulo e datas são obrigatórios' }, { status: 400 })
    }

    const { data: challenge, error: insertError } = await db
      .from('fitness_challenges')
      .insert({
        title,
        description: description || '',
        challenge_type: challenge_type || 'points',
        scoring_category: scoring_category || null,
        start_date,
        end_date,
        is_active: true,
        is_private: is_private || false,
        created_by: user.id,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Erro ao criar desafio:', insertError)
      return NextResponse.json({ success: false, error: 'Erro ao criar' }, { status: 500 })
    }

    // For private challenges, pre-add invited participants
    if (is_private && invited_user_ids && invited_user_ids.length > 0) {
      const participants = invited_user_ids.map((uid: string) => ({
        challenge_id: challenge.id,
        user_id: uid,
        score: 0,
      }))
      const { error: addError } = await db
        .from('fitness_challenge_participants')
        .insert(participants)

      if (addError) {
        console.error('Erro ao adicionar participantes:', addError)
      }
    }

    return NextResponse.json({ success: true, challenge })
  } catch (error) {
    console.error('Erro:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}
