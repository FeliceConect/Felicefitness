import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

// GET - Buscar estatísticas do dashboard do profissional
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Usar admin client
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

    // Verificar se é profissional
    const { data: professional, error: profError } = await supabaseAdmin
      .from('fitness_professionals')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (profError || !professional) {
      return NextResponse.json(
        { success: false, error: 'Profissional não encontrado' },
        { status: 404 }
      )
    }

    // Buscar clientes atribuídos
    const { data: assignments } = await supabaseAdmin
      .from('fitness_client_assignments')
      .select('client_id')
      .eq('professional_id', professional.id)
      .eq('is_active', true)

    const clientIds = assignments?.map(a => a.client_id) || []
    const totalClients = clientIds.length

    // Buscar dados dos clientes
    let clientsData: Array<{
      id: string
      nome: string | null
      email: string | null
      updated_at: string | null
    }> = []

    if (clientIds.length > 0) {
      const { data } = await supabaseAdmin
        .from('fitness_profiles')
        .select('id, nome, email, updated_at')
        .in('id', clientIds)

      clientsData = data || []
    }

    // Calcular clientes ativos hoje (que atualizaram perfil nas últimas 24h)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const activeToday = clientsData.filter(c => {
      if (!c.updated_at) return false
      const updated = new Date(c.updated_at)
      return updated >= today
    }).length

    // Buscar refeições de hoje dos clientes (se nutricionista)
    let mealsToday = 0
    let mealsTotal = 0
    if (professional.type === 'nutritionist' && clientIds.length > 0) {
      const todayStr = today.toISOString().split('T')[0]

      const { data: meals } = await supabaseAdmin
        .from('fitness_meals')
        .select('id')
        .in('user_id', clientIds)
        .gte('data', todayStr)

      mealsToday = meals?.length || 0

      // Total de refeições no mês
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
      const { data: monthMeals } = await supabaseAdmin
        .from('fitness_meals')
        .select('id')
        .in('user_id', clientIds)
        .gte('data', monthStart.toISOString().split('T')[0])

      mealsTotal = monthMeals?.length || 0
    }

    // Buscar treinos de hoje dos clientes (se personal)
    let workoutsToday = 0
    let workoutsTotal = 0
    if (professional.type === 'trainer' && clientIds.length > 0) {
      const todayStr = today.toISOString().split('T')[0]

      const { data: workouts } = await supabaseAdmin
        .from('fitness_workouts')
        .select('id')
        .in('user_id', clientIds)
        .gte('data', todayStr)

      workoutsToday = workouts?.length || 0

      // Total de treinos no mês
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
      const { data: monthWorkouts } = await supabaseAdmin
        .from('fitness_workouts')
        .select('id')
        .in('user_id', clientIds)
        .gte('data', monthStart.toISOString().split('T')[0])

      workoutsTotal = monthWorkouts?.length || 0
    }

    // Buscar atividade recente dos clientes
    const recentActivity: Array<{
      type: string
      clientName: string
      clientId: string
      date: string
      details: string
    }> = []

    if (clientIds.length > 0) {
      const clientMap = new Map(clientsData.map(c => [c.id, c.nome || 'Cliente']))

      // Últimas refeições
      if (professional.type === 'nutritionist') {
        const { data: recentMeals } = await supabaseAdmin
          .from('fitness_meals')
          .select('id, user_id, tipo, calorias, created_at')
          .in('user_id', clientIds)
          .order('created_at', { ascending: false })
          .limit(5)

        recentMeals?.forEach(meal => {
          recentActivity.push({
            type: 'meal',
            clientName: clientMap.get(meal.user_id) || 'Cliente',
            clientId: meal.user_id,
            date: meal.created_at,
            details: `${meal.tipo} - ${meal.calorias || 0} kcal`
          })
        })
      }

      // Últimos treinos
      if (professional.type === 'trainer') {
        const { data: recentWorkouts } = await supabaseAdmin
          .from('fitness_workouts')
          .select('id, user_id, nome, duracao, created_at')
          .in('user_id', clientIds)
          .order('created_at', { ascending: false })
          .limit(5)

        recentWorkouts?.forEach(workout => {
          recentActivity.push({
            type: 'workout',
            clientName: clientMap.get(workout.user_id) || 'Cliente',
            clientId: workout.user_id,
            date: workout.created_at,
            details: `${workout.nome} - ${workout.duracao || 0} min`
          })
        })
      }
    }

    // Ordenar atividade por data
    recentActivity.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    // Clientes que precisam de atenção (sem atividade há mais de 3 dias)
    const threeDaysAgo = new Date()
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

    const needsAttention = clientsData.filter(c => {
      if (!c.updated_at) return true
      const updated = new Date(c.updated_at)
      return updated < threeDaysAgo
    }).map(c => ({
      id: c.id,
      name: c.nome || 'Cliente',
      lastActivity: c.updated_at
    }))

    return NextResponse.json({
      success: true,
      professional: {
        id: professional.id,
        type: professional.type,
        specialty: professional.specialty,
        registration: professional.registration
      },
      stats: {
        totalClients,
        activeToday,
        maxClients: professional.max_clients,
        mealsToday,
        mealsTotal,
        workoutsToday,
        workoutsTotal
      },
      recentActivity: recentActivity.slice(0, 10),
      needsAttention: needsAttention.slice(0, 5)
    })

  } catch (error) {
    console.error('Erro ao processar requisição:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
