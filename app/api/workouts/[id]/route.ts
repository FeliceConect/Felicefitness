/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { getTodayDateSP } from '@/lib/utils/date'

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// DELETE - Apaga um treino. Só permite se for do dia atual (BR).
// Reverte os pts já creditados:
//   • workout completo (15 pts, reason='Treino completo')
//   • PRs (10 pts cada, reason='Personal Record')
//   • Cardios no treino (3-10 pts cada, reason começa com 'Cardio')
// Depois apaga workout (cascateia exercises + sets + activities).
//
// Nota: o usuário pode RE-criar o treino e ganhar os pts novamente.
// Treinos do passado NÃO podem ser apagados (ficam histórico imutável).
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params
    const supabaseAdmin = getAdminClient()

    // Carrega o treino pra validar dono e data
    const { data: workout } = await supabaseAdmin
      .from('fitness_workouts')
      .select('id, user_id, data')
      .eq('id', id)
      .single()

    if (!workout) {
      return NextResponse.json({ success: false, error: 'Treino não encontrado' }, { status: 404 })
    }
    if (workout.user_id !== user.id) {
      return NextResponse.json({ success: false, error: 'Sem permissão' }, { status: 403 })
    }
    if (workout.data !== getTodayDateSP()) {
      return NextResponse.json(
        { success: false, error: 'Só é possível apagar treinos do dia atual' },
        { status: 403 }
      )
    }

    // Coleta IDs dos sets do treino (pra encontrar transações de PR/cardio)
    const { data: weList } = await supabaseAdmin
      .from('fitness_workout_exercises')
      .select('id')
      .eq('workout_id', id)

    const weIds = (weList || []).map((we: { id: string }) => we.id)

    let setIds: string[] = []
    if (weIds.length > 0) {
      const { data: sets } = await supabaseAdmin
        .from('fitness_exercise_sets')
        .select('id')
        .in('workout_exercise_id', weIds)
      setIds = (sets || []).map((s: { id: string }) => s.id)
    }

    // ────────────────────────────────────────────────
    // Reversão de pontos — soma TUDO que foi creditado
    // ────────────────────────────────────────────────
    let totalPointsReverted = 0

    // 1) workout_completed (reference_id = workout.id)
    const { data: workoutTx } = await supabaseAdmin
      .from('fitness_point_transactions')
      .select('points')
      .eq('user_id', user.id)
      .eq('reference_id', id)
      .eq('reason', 'Treino completo')

    for (const t of (workoutTx || [])) {
      totalPointsReverted += t.points || 0
    }
    if (workoutTx && workoutTx.length > 0) {
      await supabaseAdmin
        .from('fitness_point_transactions')
        .delete()
        .eq('user_id', user.id)
        .eq('reference_id', id)
        .eq('reason', 'Treino completo')
    }

    // 2) PRs (reference_id = set.id)
    if (setIds.length > 0) {
      const { data: prTx } = await supabaseAdmin
        .from('fitness_point_transactions')
        .select('points')
        .eq('user_id', user.id)
        .eq('reason', 'Personal Record')
        .in('reference_id', setIds)

      for (const t of (prTx || [])) {
        totalPointsReverted += t.points || 0
      }
      if (prTx && prTx.length > 0) {
        await supabaseAdmin
          .from('fitness_point_transactions')
          .delete()
          .eq('user_id', user.id)
          .eq('reason', 'Personal Record')
          .in('reference_id', setIds)
      }
    }

    // 3) Cardios no treino (reference_id = workout_exercise.id; reason começa com 'Cardio')
    if (weIds.length > 0) {
      const { data: cardioTx } = await supabaseAdmin
        .from('fitness_point_transactions')
        .select('points')
        .eq('user_id', user.id)
        .like('reason', 'Cardio%')
        .in('reference_id', weIds)

      for (const t of (cardioTx || [])) {
        totalPointsReverted += t.points || 0
      }
      if (cardioTx && cardioTx.length > 0) {
        await supabaseAdmin
          .from('fitness_point_transactions')
          .delete()
          .eq('user_id', user.id)
          .like('reason', 'Cardio%')
          .in('reference_id', weIds)
      }
    }

    // Reverte do leaderboard
    if (totalPointsReverted > 0) {
      await supabaseAdmin.rpc('fitness_award_points_to_user', {
        p_user_id: user.id,
        p_delta: -totalPointsReverted,
        p_allowed_ranking_categories: null,
      })
    }

    // Apaga PRs (fitness_personal_records) deste treino
    await supabaseAdmin
      .from('fitness_personal_records')
      .delete()
      .eq('workout_id', id)
      .eq('user_id', user.id)

    // Apaga o treino. exercises + sets cascateiam via FK ON DELETE CASCADE.
    const { error: deleteError } = await supabaseAdmin
      .from('fitness_workouts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Erro ao apagar treino:', deleteError)
      return NextResponse.json({ success: false, error: 'Erro ao apagar treino' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      points_reverted: totalPointsReverted,
    })
  } catch (error) {
    console.error('Erro na API de workouts/[id]:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}
