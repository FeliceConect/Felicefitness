import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any

// GET /api/workout/last-weights
// Busca os últimos pesos e repetições realizados por exercício (treino anterior).
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

    // Uma única query com JOIN embarcado (set → exercício → treino), filtrando
    // direto por user_id. Antes buscávamos os treinos, depois montávamos um
    // .in('workout_exercise_id', [...centenas de UUIDs...]) — para quem tem
    // muitos treinos a URL estourava o limite do PostgREST (414 "URI too long"),
    // a query falhava e o histórico de cargas sumia para TODOS os exercícios
    // (inclusive dentro dos circuitos).
    //
    // Filtros:
    // - set e treino concluídos (status='concluido')
    // - carga 0 incluída (peso corporal/isometria ainda têm reps de referência)
    // - cardio excluído pela unidade ('km' = distância, não carga)
    const { data: sets, error: setsError } = await (supabase as AnySupabase)
      .from('fitness_exercise_sets')
      .select(`
        carga,
        repeticoes_realizadas,
        unidade_carga,
        created_at,
        workout_exercise:fitness_workout_exercises!inner(
          exercicio_nome,
          workout:fitness_workouts!inner(user_id, data, status)
        )
      `)
      .eq('status', 'concluido')
      .eq('workout_exercise.workout.user_id', user.id)
      .eq('workout_exercise.workout.status', 'concluido')
      .or('unidade_carga.is.null,unidade_carga.eq.kg')
      .order('created_at', { ascending: false })
      .limit(5000)

    if (setsError) {
      console.error('Erro ao buscar sets:', setsError)
      return NextResponse.json(
        { error: 'Erro ao buscar histórico' },
        { status: 500 }
      )
    }

    // Agrupar por nome do exercício (normalizado) e manter só o mais recente
    // (a lista já vem ordenada por created_at desc).
    const exerciseWeights: Record<string, { weight: number; reps: number; date: string }> = {}

    for (const set of sets || []) {
      // Relação to-one: PostgREST retorna objeto, mas normalizamos por garantia.
      const we = Array.isArray(set.workout_exercise) ? set.workout_exercise[0] : set.workout_exercise
      const exerciseName: string | undefined = we?.exercicio_nome
      if (!exerciseName) continue

      // Sem carga E sem reps não há referência útil pro paciente.
      if (!set.carga && !set.repeticoes_realizadas) continue

      // Normalizar nome para comparação (lowercase, sem acentos).
      const normalizedName = exerciseName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()

      // Já temos o mais recente desse exercício — pular.
      if (exerciseWeights[normalizedName]) continue

      const workout = Array.isArray(we?.workout) ? we.workout[0] : we?.workout

      exerciseWeights[normalizedName] = {
        weight: set.carga || 0,
        reps: set.repeticoes_realizadas || 0,
        date: workout?.data || ''
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
