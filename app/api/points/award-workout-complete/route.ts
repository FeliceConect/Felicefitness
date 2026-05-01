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

type Intensity = 'leve' | 'moderado' | 'intenso' | 'muito_intenso'

interface CardioAwardInput {
  workoutExerciseId: string
  intensity: Intensity
}

interface RequestBody {
  workoutId: string
  prSetIds?: string[]
  cardioAwards?: CardioAwardInput[]
  // Streak lido pelo client antes do saveWorkout — necessário para detectar
  // transição <7 → ≥7 (e <30 → ≥30) já que o trigger SQL atualiza
  // streak_atual no momento do INSERT do treino.
  oldStreak?: number
}

// POST - Consolida em uma única round-trip o award de pontos pós-treino:
// workout (15) + cada PR (3) + cada cardio (3-10 por intensidade) +
// transição de streak 7 (15) e 30 (50). Tudo em paralelo no server.
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
    const {
      workoutId,
      prSetIds = [],
      cardioAwards = [],
      oldStreak = 0,
    } = body

    if (!workoutId || typeof workoutId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'workoutId obrigatório' },
        { status: 400 }
      )
    }

    const supabaseAdmin = getAdminClient()

    // Verifica posse do treino — caller mandou um id válido pertencente a ele.
    const { data: workout } = await supabaseAdmin
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

    // Roda todos os awards principais em paralelo. awardPointsServer
    // já trata dedup (por reference_id) e atualiza ranking/challenge/tier.
    const awardPromises: Promise<unknown>[] = [
      awardPointsServer(user.id, 'workout_completed', workoutId),
    ]

    for (const setId of prSetIds) {
      if (typeof setId === 'string' && setId) {
        awardPromises.push(awardPointsServer(user.id, 'pr_achieved', setId))
      }
    }

    for (const c of cardioAwards) {
      const action = c?.intensity ? CARDIO_INTENSITY_ACTION[c.intensity] : null
      if (action && c.workoutExerciseId) {
        awardPromises.push(
          awardPointsServer(user.id, action, c.workoutExerciseId)
        )
      }
    }

    await Promise.all(awardPromises)

    // Streak — lê estado pós-trigger e compara com oldStreak para detectar
    // transição. Sem oldStreak (default 0), só transitionará na primeira vez.
    const { data: profileAfter } = await supabaseAdmin
      .from('fitness_profiles')
      .select('streak_atual')
      .eq('id', user.id)
      .single()

    const newStreak =
      (profileAfter as { streak_atual?: number } | null)?.streak_atual ?? 0

    const streakAwards: Promise<unknown>[] = []
    if (oldStreak < 7 && newStreak >= 7) {
      streakAwards.push(awardPointsServer(user.id, 'streak_7'))
    }
    if (oldStreak < 30 && newStreak >= 30) {
      streakAwards.push(awardPointsServer(user.id, 'streak_30'))
    }
    if (streakAwards.length > 0) {
      await Promise.all(streakAwards)
    }

    return NextResponse.json({
      success: true,
      newStreak,
      streakBonus: streakAwards.length > 0,
    })
  } catch (error) {
    console.error('Erro em award-workout-complete:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno' },
      { status: 500 }
    )
  }
}
