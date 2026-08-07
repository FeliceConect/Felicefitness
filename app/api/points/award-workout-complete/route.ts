/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import {
  awardPointsServer,
  CARDIO_INTENSITY_ACTION,
} from '@/lib/services/points-server'

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// Ordem das intensidades, para escolher o cardio mais forte do treino.
type CardioIntensityKey = 'leve' | 'moderado' | 'intenso' | 'muito_intenso'
const CARDIO_INTENSITY_PRIORITY: Record<CardioIntensityKey, number> = {
  leve: 1,
  moderado: 2,
  intenso: 3,
  muito_intenso: 4,
}

interface RequestBody {
  workoutId: string
}

// POST - Consolida em uma round-trip o award de pontos pós-treino.
//
// TUDO é derivado DO BANCO a partir do workoutId (nunca do corpo da
// requisição), depois de verificar a posse do treino:
//   • workout_completed (15)  — pelo próprio workoutId
//   • PR (3 cada)             — sets com is_pr=true (o trigger autoritativo do
//                               banco decide is_pr); awardPointsServer ainda
//                               reconfere histórico real + posse do set
//   • cardio (3-10 cada)      — exercícios com cardio_intensity gravada
//
// Streak (7=15, 30=50) NÃO é creditado aqui: é decidido pelo trigger
// fn_auto_award_streak quando streak_atual REAL do perfil cruza o limiar.
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const body = (await request.json()) as RequestBody
    const workoutId = body?.workoutId

    if (!workoutId || typeof workoutId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'workoutId obrigatório' },
        { status: 400 }
      )
    }

    const admin = getAdminClient()

    // Posse do treino — o crédito só acontece sobre um treino do próprio usuário.
    const { data: workout } = await admin
      .from('fitness_workouts')
      .select('user_id')
      .eq('id', workoutId)
      .single()

    if (!workout || workout.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Treino não encontrado ou sem acesso' },
        { status: 403 }
      )
    }

    // Exercícios do treino. Lê cardio_intensity; se a coluna ainda não existe
    // no banco (migration 20260730_4 não rodou), refaz sem ela — cardio não
    // pontua até a migration rodar, mas o resto do treino funciona.
    let weRows: Array<{ id: string; status: string | null; cardio_intensity: string | null }> = []
    {
      const res = await admin
        .from('fitness_workout_exercises')
        .select('id, status, cardio_intensity')
        .eq('workout_id', workoutId)
      if (res.error && (res.error.code === '42703' || res.error.code === 'PGRST204')) {
        const retry = await admin
          .from('fitness_workout_exercises')
          .select('id, status')
          .eq('workout_id', workoutId)
        weRows = (retry.data || []).map((w: { id: string; status: string | null }) => ({
          id: w.id,
          status: w.status,
          cardio_intensity: null,
        }))
      } else {
        weRows = res.data || []
      }
    }
    const weIds = weRows.map((w) => w.id)

    // Sets de PR — is_pr é autoridade do trigger check_and_create_pr (banco).
    let prSetIds: string[] = []
    if (weIds.length > 0) {
      const { data: prSets } = await admin
        .from('fitness_exercise_sets')
        .select('id')
        .in('workout_exercise_id', weIds)
        .eq('is_pr', true)
      prSetIds = (prSets || []).map((s: { id: string }) => s.id)
    }

    // Roda todos os awards em paralelo. awardPointsServer trata dedup (por
    // reference_id / índice único) e atualiza ranking/tier. pr_achieved ainda
    // passa por prHasPriorHistory (histórico real + posse do set).
    const awardPromises: Promise<unknown>[] = [
      awardPointsServer(user.id, 'workout_completed', workoutId),
    ]

    for (const setId of prSetIds) {
      awardPromises.push(awardPointsServer(user.id, 'pr_achieved', setId))
    }

    // CARDIO — UM crédito por treino, pela maior intensidade entre os cardios
    // REALIZADOS (status 'concluido'; exercício pulado não pontua).
    //
    // Antes cada exercício de cardio pagava. A regra foi escrita pensando em
    // "esteira/bike dentro do plano" (um bloco por treino), mas um programa em
    // circuito aeróbico (polichinelo + tesoura + corrida estacionária...) virava
    // 4-5 créditos pelo mesmo esforço de quem faz 20 min de esteira. Também
    // destoava da atividade avulsa, que tem teto de 2/dia. Decisão de 2026-08-07.
    const cardioDone = weRows.filter(
      (w) =>
        w.status === 'concluido' &&
        w.cardio_intensity &&
        CARDIO_INTENSITY_PRIORITY[w.cardio_intensity as CardioIntensityKey] !== undefined
    )

    if (cardioDone.length > 0) {
      const topCardio = cardioDone.reduce((best, we) =>
        CARDIO_INTENSITY_PRIORITY[we.cardio_intensity as CardioIntensityKey] >
        CARDIO_INTENSITY_PRIORITY[best.cardio_intensity as CardioIntensityKey]
          ? we
          : best
      )

      // Se este treino já creditou cardio (rota chamada de novo depois de
      // concluir mais um exercício), não credita de novo — o índice único só
      // protege por reference_id, e aqui o exercício escolhido poderia mudar.
      const { data: cardioJaCreditado } = await admin
        .from('fitness_point_transactions')
        .select('id')
        .eq('user_id', user.id)
        .in('reference_id', weIds)
        .ilike('reason', 'Cardio%no treino')
        .limit(1)

      if (!cardioJaCreditado || cardioJaCreditado.length === 0) {
        const action =
          CARDIO_INTENSITY_ACTION[topCardio.cardio_intensity as keyof typeof CARDIO_INTENSITY_ACTION]
        if (action) {
          awardPromises.push(awardPointsServer(user.id, action, topCardio.id))
        }
      }
    }

    await Promise.all(awardPromises)

    // Bônus de streak (7=15, 30=50) — a partir do streak REAL recalculado no
    // servidor por get_user_streak (SECURITY DEFINER; conta dias consecutivos
    // dos treinos reais). NÃO lemos fitness_profiles.streak_atual porque o
    // cliente pode gravá-la (use-profile) e forjaria o bônus. Exact-match: o
    // streak cresce +1/dia, então bate exatamente 7/30 uma única vez no
    // cruzamento; o índice único diário impede duplo no mesmo dia.
    const { data: streakData } = await admin.rpc('get_user_streak', { p_user_id: user.id })
    const realStreak = Number(streakData) || 0
    const streakAwards: Promise<unknown>[] = []
    if (realStreak === 7) streakAwards.push(awardPointsServer(user.id, 'streak_7'))
    if (realStreak === 30) streakAwards.push(awardPointsServer(user.id, 'streak_30'))
    if (streakAwards.length > 0) {
      await Promise.all(streakAwards)
    }

    return NextResponse.json({
      success: true,
      prAwards: prSetIds.length,
      streak: realStreak,
    })
  } catch (error) {
    console.error('Erro em award-workout-complete:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno' },
      { status: 500 }
    )
  }
}
