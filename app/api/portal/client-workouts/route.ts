import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface Assignment {
  client_id: string
}

interface Workout {
  id: string
  user_id: string
  workout_date: string
  status: string
  duration_minutes: number
  calories_burned: number
  total_volume: number
  prs: Array<{
    exercise: string
    type: string
    value: number
    previous: number
  }> | null
  [key: string]: unknown
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

    // Verificar se e profissional
    const { data: professional } = await supabase
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

    // Buscar clientes vinculados ao profissional
    const { data: assignments } = await supabase
      .from('fitness_professional_assignments')
      .select('client_id')
      .eq('professional_id', (professional as { id: string }).id)
      .eq('status', 'active')

    const clientIds = (assignments as Assignment[] | null)?.map(a => a.client_id) || []

    if (clientIds.length === 0) {
      return NextResponse.json({
        success: true,
        workouts: [],
        clients: []
      })
    }

    // Buscar informacoes dos clientes
    const { data: clients } = await supabase
      .from('fitness_profiles')
      .select('id, nome, email, avatar_url')
      .in('id', clientIds)

    // Construir query de treinos
    let query = supabase
      .from('fitness_workouts')
      .select(`
        *,
        profile:fitness_profiles!user_id(id, nome, email, avatar_url),
        exercises:fitness_workout_exercises(*)
      `)
      .in('user_id', clientIds)
      .order('workout_date', { ascending: false })

    // Filtros
    if (clientId && clientIds.includes(clientId)) {
      query = query.eq('user_id', clientId)
    }

    if (status) {
      query = query.eq('status', status)
    }

    if (startDate && endDate) {
      query = query.gte('workout_date', startDate).lte('workout_date', endDate)
    } else {
      // Ultimos 14 dias por padrao
      const fourteenDaysAgo = new Date()
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)
      query = query.gte('workout_date', fourteenDaysAgo.toISOString().split('T')[0])
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

    const workoutsTyped = workouts as Workout[] | null

    // Calcular estatisticas
    const completedWorkouts = workoutsTyped?.filter(w => w.status === 'completed') || []
    const stats = {
      totalWorkouts: workoutsTyped?.length || 0,
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
    workoutsTyped?.forEach(workout => {
      const cid = workout.user_id
      stats.workoutsPerClient[cid] = (stats.workoutsPerClient[cid] || 0) + 1
      if (workout.prs && Array.isArray(workout.prs)) {
        stats.prsCount += workout.prs.length
      }
    })

    return NextResponse.json({
      success: true,
      workouts: workoutsTyped || [],
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
