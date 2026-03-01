import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

// GET - Buscar clientes do profissional
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
      .select('client_id, assigned_at, notes, is_active')
      .eq('professional_id', professional.id)

    if (!assignments || assignments.length === 0) {
      return NextResponse.json({
        success: true,
        clients: []
      })
    }

    const clientIds = assignments.map(a => a.client_id)

    // Buscar perfis dos clientes
    const { data: profiles } = await supabaseAdmin
      .from('fitness_profiles')
      .select('id, nome, email, peso_atual, altura_cm, objetivo, updated_at')
      .in('id', clientIds)

    // Buscar estatísticas recentes para cada cliente
    const today = new Date()
    const weekAgo = new Date(today)
    weekAgo.setDate(weekAgo.getDate() - 7)
    const weekAgoStr = weekAgo.toISOString().split('T')[0]

    // Buscar refeições e treinos da semana
    const [mealsResult, workoutsResult, hydrationResult] = await Promise.all([
      supabaseAdmin
        .from('fitness_meals')
        .select('id, user_id, calorias_total, proteinas_total, carboidratos_total, gorduras_total, data')
        .in('user_id', clientIds)
        .gte('data', weekAgoStr),
      supabaseAdmin
        .from('fitness_workouts')
        .select('id, user_id, duracao_minutos, calorias_estimadas, data')
        .in('user_id', clientIds)
        .gte('data', weekAgoStr),
      supabaseAdmin
        .from('fitness_water_logs')
        .select('id, user_id, quantidade_ml, data')
        .in('user_id', clientIds)
        .gte('data', weekAgoStr)
    ])

    // Montar dados dos clientes
    const clients = profiles?.map(profile => {
      const assignment = assignments.find(a => a.client_id === profile.id)
      const clientMeals = mealsResult.data?.filter(m => m.user_id === profile.id) || []
      const clientWorkouts = workoutsResult.data?.filter(w => w.user_id === profile.id) || []
      const clientHydration = hydrationResult.data?.filter(h => h.user_id === profile.id) || []

      // Calcular médias da semana
      const totalCalories = clientMeals.reduce((sum, m) => sum + (m.calorias_total || 0), 0)
      const totalProtein = clientMeals.reduce((sum, m) => sum + (m.proteinas_total || 0), 0)
      const avgDailyCalories = clientMeals.length > 0 ? Math.round(totalCalories / 7) : 0
      const avgDailyProtein = clientMeals.length > 0 ? Math.round(totalProtein / 7) : 0

      const totalWorkoutMinutes = clientWorkouts.reduce((sum, w) => sum + (w.duracao_minutos || 0), 0)
      const workoutDays = new Set(clientWorkouts.map(w => w.data)).size

      const totalWater = clientHydration.reduce((sum, h) => sum + (h.quantidade_ml || 0), 0)
      const avgDailyWater = clientHydration.length > 0 ? Math.round(totalWater / 7) : 0

      // Verificar última atividade
      const lastUpdate = profile.updated_at ? new Date(profile.updated_at) : null
      const daysSinceActivity = lastUpdate
        ? Math.floor((today.getTime() - lastUpdate.getTime()) / 86400000)
        : null

      // Determinar status
      let status: 'active' | 'warning' | 'inactive' = 'active'
      if (daysSinceActivity === null || daysSinceActivity > 7) {
        status = 'inactive'
      } else if (daysSinceActivity > 3) {
        status = 'warning'
      }

      return {
        id: profile.id,
        nome: profile.nome,
        email: profile.email,
        peso: profile.peso_atual,
        altura: profile.altura_cm,
        objetivo: profile.objetivo,
        assignedAt: assignment?.assigned_at,
        notes: assignment?.notes,
        isActive: assignment?.is_active ?? true,
        lastActivity: profile.updated_at,
        daysSinceActivity,
        status,
        weekStats: {
          meals: clientMeals.length,
          avgDailyCalories,
          avgDailyProtein,
          workouts: clientWorkouts.length,
          workoutDays,
          totalWorkoutMinutes,
          avgDailyWater
        }
      }
    }) || []

    // Ordenar: ativos primeiro, depois por status (warning antes de inactive)
    clients.sort((a, b) => {
      if (a.isActive !== b.isActive) return a.isActive ? -1 : 1
      if (a.status !== b.status) {
        const order = { active: 0, warning: 1, inactive: 2 }
        return order[a.status] - order[b.status]
      }
      return (a.nome || '').localeCompare(b.nome || '')
    })

    return NextResponse.json({
      success: true,
      clients,
      professionalType: professional.type
    })

  } catch (error) {
    console.error('Erro ao processar requisição:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
