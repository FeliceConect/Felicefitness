import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any

// GET /api/workout/last-weights
// Busca os últimos pesos e repetições realizados por exercício
export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    // Abordagem: buscar treinos concluídos do usuário, depois seus exercícios e sets
    // Primeiro, buscar IDs dos treinos concluídos do usuário
    const { data: workouts, error: workoutsError } = await (supabase as AnySupabase)
      .from('fitness_workouts')
      .select('id, data')
      .eq('user_id', user.id)
      .eq('status', 'concluido')
      .order('data', { ascending: false })
      .limit(50) // Últimos 50 treinos

    if (workoutsError) {
      console.error('Erro ao buscar treinos:', workoutsError)
      return NextResponse.json(
        { error: 'Erro ao buscar treinos' },
        { status: 500 }
      )
    }

    if (!workouts || workouts.length === 0) {
      return NextResponse.json({
        success: true,
        data: {}
      })
    }

    const workoutIds = workouts.map((w: { id: string }) => w.id)
    const workoutDates = new Map<string, string>(workouts.map((w: { id: string; data: string }) => [w.id, w.data]))

    // Buscar exercícios desses treinos
    const { data: exercises, error: exercisesError } = await (supabase as AnySupabase)
      .from('fitness_workout_exercises')
      .select('id, workout_id, exercicio_nome')
      .in('workout_id', workoutIds)

    if (exercisesError) {
      console.error('Erro ao buscar exercícios:', exercisesError)
      return NextResponse.json(
        { error: 'Erro ao buscar exercícios' },
        { status: 500 }
      )
    }

    if (!exercises || exercises.length === 0) {
      return NextResponse.json({
        success: true,
        data: {}
      })
    }

    const exerciseIds = exercises.map((e: { id: string }) => e.id)
    const exerciseMap = new Map<string, { workoutId: string; name: string }>(
      exercises.map((e: { id: string; workout_id: string; exercicio_nome: string }) => [
        e.id,
        { workoutId: e.workout_id, name: e.exercicio_nome }
      ])
    )

    // Buscar sets desses exercícios
    const { data: sets, error: setsError } = await (supabase as AnySupabase)
      .from('fitness_exercise_sets')
      .select('id, workout_exercise_id, carga, repeticoes_realizadas, created_at')
      .in('workout_exercise_id', exerciseIds)
      .eq('status', 'concluido')
      .not('carga', 'is', null)
      .gt('carga', 0)
      .order('created_at', { ascending: false })

    if (setsError) {
      console.error('Erro ao buscar sets:', setsError)
      return NextResponse.json(
        { error: 'Erro ao buscar sets' },
        { status: 500 }
      )
    }

    // Agrupar por nome do exercício e pegar apenas o mais recente
    const exerciseWeights: Record<string, { weight: number; reps: number; date: string }> = {}

    for (const set of sets || []) {
      const exerciseInfo = exerciseMap.get(set.workout_exercise_id)
      if (!exerciseInfo) continue

      const exerciseName = exerciseInfo.name
      if (!exerciseName) continue

      // Normalizar nome para comparação (lowercase, sem acentos)
      const normalizedName = exerciseName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()

      // Se já temos esse exercício, pular (já temos o mais recente por causa do order by)
      if (exerciseWeights[normalizedName]) continue

      const workoutDate = workoutDates.get(exerciseInfo.workoutId) || ''

      exerciseWeights[normalizedName] = {
        weight: set.carga || 0,
        reps: set.repeticoes_realizadas || 0,
        date: workoutDate
      }
    }

    return NextResponse.json({
      success: true,
      data: exerciseWeights
    })

  } catch (error) {
    console.error('Erro na API last-weights:', error)
    return NextResponse.json(
      { error: 'Erro interno' },
      { status: 500 }
    )
  }
}
