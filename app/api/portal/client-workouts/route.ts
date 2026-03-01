import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

interface Assignment {
  client_id: string
}

interface DBWorkout {
  id: string
  user_id: string
  nome: string
  tipo: string
  data: string
  hora_inicio: string | null
  hora_fim: string | null
  duracao_minutos: number | null
  status: string
  calorias_estimadas: number | null
  notas: string | null
  nivel_energia: number | null
  nivel_dificuldade: number | null
  profile?: {
    id: string
    nome: string
    email: string
  }[] | {
    id: string
    nome: string
    email: string
  }
  exercises?: DBWorkoutExercise[]
}

interface DBWorkoutExercise {
  id: string
  workout_id: string
  exercicio_nome: string
  ordem: number
  status: string
  notas: string | null
  sets?: DBExerciseSet[]
}

interface DBExerciseSet {
  id: string
  workout_exercise_id: string
  numero_serie: number
  repeticoes_planejadas: number | null
  repeticoes_realizadas: number | null
  carga: number | null
  status: string
  is_pr: boolean | null
}

// Mapear status do banco para o esperado pelo frontend
function mapStatus(dbStatus: string): string {
  const statusMap: Record<string, string> = {
    'concluido': 'completed',
    'em_andamento': 'in_progress',
    'pulado': 'skipped',
    'pendente': 'pending'
  }
  return statusMap[dbStatus] || dbStatus
}

// GET - Listar treinos realizados pelos clientes do profissional
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Nao autorizado' },
        { status: 401 }
      )
    }

    // Usar admin client para bypass de RLS
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verificar se e profissional
    const { data: professional } = await supabaseAdmin
      .from('fitness_professionals')
      .select('id, type')
      .eq('user_id', user.id)
      .single()

    if (!professional) {
      return NextResponse.json(
        { success: false, error: 'Acesso restrito a profissionais' },
        { status: 403 }
      )
    }

    // Parametros de busca
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const status = searchParams.get('status')

    // Buscar clientes vinculados ao profissional de duas formas:
    // 1. Via fitness_client_assignments (vinculo direto)
    // 2. Via fitness_training_programs (cliente tem programa ativo do profissional)

    const professionalId = (professional as { id: string }).id

    // Metodo 1: Buscar via assignments
    const { data: assignments } = await supabaseAdmin
      .from('fitness_client_assignments')
      .select('client_id')
      .eq('professional_id', professionalId)
      .eq('is_active', true)

    const assignmentClientIds = (assignments as Assignment[] | null)?.map(a => a.client_id) || []

    // Metodo 2: Buscar via training programs
    const { data: programs } = await supabaseAdmin
      .from('fitness_training_programs')
      .select('client_id')
      .eq('professional_id', professionalId)
      .eq('is_active', true)
      .not('client_id', 'is', null)

    const programClientIds = (programs || []).map((p: { client_id: string }) => p.client_id).filter(Boolean)

    // Combinar IDs unicos
    const clientIds = Array.from(new Set([...assignmentClientIds, ...programClientIds]))

    if (clientIds.length === 0) {
      return NextResponse.json({
        success: true,
        workouts: [],
        clients: [],
        stats: null
      })
    }

    // Buscar informacoes dos clientes
    const { data: clients } = await supabaseAdmin
      .from('fitness_profiles')
      .select('id, nome, email')
      .in('id', clientIds)

    // Construir query de treinos - usando os nomes corretos das colunas
    let query = supabaseAdmin
      .from('fitness_workouts')
      .select(`
        id,
        user_id,
        nome,
        tipo,
        data,
        hora_inicio,
        hora_fim,
        duracao_minutos,
        status,
        calorias_estimadas,
        notas,
        nivel_energia,
        nivel_dificuldade,
        profile:fitness_profiles!user_id(id, nome, email),
        exercises:fitness_workout_exercises(
          id,
          workout_id,
          exercicio_nome,
          ordem,
          status,
          notas,
          sets:fitness_exercise_sets(
            id,
            workout_exercise_id,
            numero_serie,
            repeticoes_planejadas,
            repeticoes_realizadas,
            carga,
            status,
            is_pr
          )
        )
      `)
      .in('user_id', clientIds)
      .order('data', { ascending: false })

    // Filtros
    if (clientId && clientIds.includes(clientId)) {
      query = query.eq('user_id', clientId)
    }

    // Mapear status do frontend para o banco
    if (status) {
      const dbStatusMap: Record<string, string> = {
        'completed': 'concluido',
        'in_progress': 'em_andamento',
        'skipped': 'pulado'
      }
      const dbStatus = dbStatusMap[status] || status
      query = query.eq('status', dbStatus)
    }

    if (startDate && endDate) {
      query = query.gte('data', startDate).lte('data', endDate)
    } else {
      // Ultimos 14 dias por padrao
      const fourteenDaysAgo = new Date()
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)
      query = query.gte('data', fourteenDaysAgo.toISOString().split('T')[0])
    }

    // Limitar a 100 registros
    query = query.limit(100)

    const { data: workouts, error } = await query

    if (error) {
      console.error('Erro ao buscar treinos:', error)
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar treinos' },
        { status: 500 }
      )
    }

    const dbWorkouts = workouts as DBWorkout[] | null

    // Mapear dados para o formato esperado pelo frontend
    const mappedWorkouts = (dbWorkouts || []).map(w => {
      // Calcular total de volume e series
      let totalVolume = 0
      let totalSets = 0
      let totalReps = 0
      const prs: Array<{ exercise: string; type: string; value: number; previous: number }> = []

      const mappedExercises = (w.exercises || []).map(ex => {
        const setsData = (ex.sets || []).map(s => {
          const weight = s.carga || 0
          const reps = s.repeticoes_realizadas || s.repeticoes_planejadas || 0
          totalVolume += weight * reps
          totalSets += 1
          totalReps += reps

          if (s.is_pr && weight > 0) {
            prs.push({
              exercise: ex.exercicio_nome,
              type: 'Carga maxima',
              value: weight,
              previous: 0 // Nao temos o valor anterior
            })
          }

          return {
            reps: reps,
            weight: weight,
            completed: s.status === 'concluido'
          }
        })

        return {
          id: ex.id,
          exercise_name: ex.exercicio_nome,
          sets_completed: setsData.filter(s => s.completed).length,
          sets_data: setsData,
          notes: ex.notas
        }
      })

      // Extrair grupos musculares do tipo ou nome do treino
      const muscleGroups: string[] = []
      const tipoLower = (w.tipo || '').toLowerCase()
      const nomeLower = (w.nome || '').toLowerCase()

      if (tipoLower.includes('peito') || nomeLower.includes('peito')) muscleGroups.push('Peito')
      if (tipoLower.includes('costas') || nomeLower.includes('costas')) muscleGroups.push('Costas')
      if (tipoLower.includes('perna') || nomeLower.includes('perna')) muscleGroups.push('Pernas')
      if (tipoLower.includes('ombro') || nomeLower.includes('ombro')) muscleGroups.push('Ombros')
      if (tipoLower.includes('bice') || nomeLower.includes('bice')) muscleGroups.push('Biceps')
      if (tipoLower.includes('trice') || nomeLower.includes('trice')) muscleGroups.push('Triceps')
      if (tipoLower.includes('abdomen') || nomeLower.includes('abdomen') || tipoLower.includes('core')) muscleGroups.push('Abdomen')
      if (tipoLower.includes('full') || tipoLower === 'tradicional') muscleGroups.push('Full Body')

      // Se nenhum grupo foi identificado, usar o tipo
      if (muscleGroups.length === 0 && w.tipo) {
        muscleGroups.push(w.tipo)
      }

      return {
        id: w.id,
        user_id: w.user_id,
        workout_date: w.data,
        name: w.nome,
        status: mapStatus(w.status),
        duration_minutes: w.duracao_minutos || 0,
        calories_burned: w.calorias_estimadas || 0,
        total_volume: totalVolume,
        total_sets: totalSets,
        total_reps: totalReps,
        exercises_count: (w.exercises || []).length,
        muscle_groups: muscleGroups,
        prs: prs,
        notes: w.notas,
        rating: null, // Nao temos esse campo no banco
        perceived_effort: w.nivel_dificuldade,
        profile: Array.isArray(w.profile) ? w.profile[0] : w.profile,
        exercises: mappedExercises
      }
    })

    // Calcular estatisticas
    const completedWorkouts = mappedWorkouts.filter(w => w.status === 'completed')
    const stats = {
      totalWorkouts: mappedWorkouts.length,
      completedWorkouts: completedWorkouts.length,
      totalDuration: completedWorkouts.reduce((sum, w) => sum + (w.duration_minutes || 0), 0),
      totalCalories: completedWorkouts.reduce((sum, w) => sum + (w.calories_burned || 0), 0),
      totalVolume: completedWorkouts.reduce((sum, w) => sum + (w.total_volume || 0), 0),
      avgDuration: completedWorkouts.length
        ? Math.round(completedWorkouts.reduce((sum, w) => sum + (w.duration_minutes || 0), 0) / completedWorkouts.length)
        : 0,
      workoutsPerClient: {} as Record<string, number>,
      prsCount: 0
    }

    // Contar treinos por cliente e PRs
    mappedWorkouts.forEach(workout => {
      const cid = workout.user_id
      stats.workoutsPerClient[cid] = (stats.workoutsPerClient[cid] || 0) + 1
      if (workout.prs && Array.isArray(workout.prs)) {
        stats.prsCount += workout.prs.length
      }
    })

    return NextResponse.json({
      success: true,
      workouts: mappedWorkouts,
      clients: clients || [],
      stats
    })

  } catch (error) {
    console.error('Erro ao processar requisicao:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
