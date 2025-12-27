import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

// GET - Buscar detalhes de um cliente específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clientId } = await params
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

    // Verificar se o cliente está atribuído a este profissional
    const { data: assignment } = await supabaseAdmin
      .from('fitness_client_assignments')
      .select('*')
      .eq('professional_id', professional.id)
      .eq('client_id', clientId)
      .single()

    if (!assignment) {
      return NextResponse.json(
        { success: false, error: 'Cliente não atribuído a este profissional' },
        { status: 403 }
      )
    }

    // Buscar perfil do cliente
    const { data: profile } = await supabaseAdmin
      .from('fitness_profiles')
      .select('*')
      .eq('id', clientId)
      .single()

    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'Cliente não encontrado' },
        { status: 404 }
      )
    }

    // Buscar dados dos últimos 7 dias
    const today = new Date()
    const weekAgo = new Date(today)
    weekAgo.setDate(weekAgo.getDate() - 7)
    const weekAgoStr = weekAgo.toISOString().split('T')[0]

    // Buscar dados dos últimos 30 dias para histórico
    const monthAgo = new Date(today)
    monthAgo.setDate(monthAgo.getDate() - 30)
    const monthAgoStr = monthAgo.toISOString().split('T')[0]

    // Buscar refeições, treinos, hidratação, sono, peso
    const [
      mealsResult,
      workoutsResult,
      hydrationResult,
      sleepResult,
      weightResult,
      bioimpedanceResult
    ] = await Promise.all([
      supabaseAdmin
        .from('fitness_meals')
        .select('*')
        .eq('user_id', clientId)
        .gte('data', weekAgoStr)
        .order('data', { ascending: false }),
      supabaseAdmin
        .from('fitness_workouts')
        .select('*')
        .eq('user_id', clientId)
        .gte('data', weekAgoStr)
        .order('data', { ascending: false }),
      supabaseAdmin
        .from('fitness_hydration')
        .select('*')
        .eq('user_id', clientId)
        .gte('data', weekAgoStr)
        .order('data', { ascending: false }),
      supabaseAdmin
        .from('fitness_sleep')
        .select('*')
        .eq('user_id', clientId)
        .gte('data', weekAgoStr)
        .order('data', { ascending: false }),
      supabaseAdmin
        .from('fitness_weight_history')
        .select('*')
        .eq('user_id', clientId)
        .gte('data', monthAgoStr)
        .order('data', { ascending: false }),
      supabaseAdmin
        .from('fitness_bioimpedance')
        .select('*')
        .eq('user_id', clientId)
        .order('data', { ascending: false })
        .limit(5)
    ])

    // Calcular estatísticas de refeições
    const meals = mealsResult.data || []
    const totalCalories = meals.reduce((sum, m) => sum + (m.calorias || 0), 0)
    const totalProtein = meals.reduce((sum, m) => sum + (m.proteinas || 0), 0)
    const totalCarbs = meals.reduce((sum, m) => sum + (m.carboidratos || 0), 0)
    const totalFat = meals.reduce((sum, m) => sum + (m.gorduras || 0), 0)
    const daysWithMeals = new Set(meals.map(m => m.data)).size
    const avgDailyCalories = daysWithMeals > 0 ? Math.round(totalCalories / daysWithMeals) : 0
    const avgDailyProtein = daysWithMeals > 0 ? Math.round(totalProtein / daysWithMeals) : 0
    const avgDailyCarbs = daysWithMeals > 0 ? Math.round(totalCarbs / daysWithMeals) : 0
    const avgDailyFat = daysWithMeals > 0 ? Math.round(totalFat / daysWithMeals) : 0

    // Calcular estatísticas de treinos
    const workouts = workoutsResult.data || []
    const totalWorkoutMinutes = workouts.reduce((sum, w) => sum + (w.duracao || 0), 0)
    const totalCaloriesBurned = workouts.reduce((sum, w) => sum + (w.calorias_queimadas || 0), 0)
    const workoutDays = new Set(workouts.map(w => w.data)).size

    // Calcular média de hidratação
    const hydration = hydrationResult.data || []
    const totalWater = hydration.reduce((sum, h) => sum + (h.quantidade || 0), 0)
    const daysWithHydration = new Set(hydration.map(h => h.data)).size
    const avgDailyWater = daysWithHydration > 0 ? Math.round(totalWater / daysWithHydration) : 0

    // Calcular média de sono
    const sleepRecords = sleepResult.data || []
    const totalSleepHours = sleepRecords.reduce((sum, s) => sum + (s.duracao || 0), 0)
    const avgSleepHours = sleepRecords.length > 0 ? (totalSleepHours / sleepRecords.length).toFixed(1) : 0

    // Progresso de peso
    const weightHistory = weightResult.data || []
    const currentWeight = profile.peso
    const oldestWeight = weightHistory.length > 0 ? weightHistory[weightHistory.length - 1].peso : currentWeight
    const weightChange = currentWeight && oldestWeight ? (currentWeight - oldestWeight).toFixed(1) : 0

    // Última bioimpedância
    const lastBioimpedance = bioimpedanceResult.data?.[0] || null

    return NextResponse.json({
      success: true,
      client: {
        id: profile.id,
        nome: profile.nome,
        email: profile.email,
        foto: profile.foto,
        peso: profile.peso,
        altura: profile.altura,
        objetivo: profile.objetivo,
        meta_calorias: profile.meta_calorias,
        meta_proteinas: profile.meta_proteinas,
        meta_carboidratos: profile.meta_carboidratos,
        meta_gorduras: profile.meta_gorduras,
        meta_agua: profile.meta_agua,
        data_nascimento: profile.data_nascimento,
        genero: profile.genero,
        nivel_atividade: profile.nivel_atividade,
        updated_at: profile.updated_at
      },
      assignment: {
        assignedAt: assignment.assigned_at,
        notes: assignment.notes,
        isActive: assignment.is_active
      },
      professionalType: professional.type,
      weekStats: {
        nutrition: {
          meals: meals.length,
          daysWithMeals,
          avgDailyCalories,
          avgDailyProtein,
          avgDailyCarbs,
          avgDailyFat
        },
        training: {
          workouts: workouts.length,
          workoutDays,
          totalMinutes: totalWorkoutMinutes,
          caloriesBurned: totalCaloriesBurned
        },
        hydration: {
          records: hydration.length,
          avgDaily: avgDailyWater
        },
        sleep: {
          records: sleepRecords.length,
          avgHours: avgSleepHours
        },
        weight: {
          current: currentWeight,
          change: weightChange,
          history: weightHistory.slice(0, 10).map(w => ({
            date: w.data,
            weight: w.peso
          }))
        }
      },
      recentMeals: meals.slice(0, 10).map(m => ({
        id: m.id,
        tipo: m.tipo,
        descricao: m.descricao,
        calorias: m.calorias,
        proteinas: m.proteinas,
        carboidratos: m.carboidratos,
        gorduras: m.gorduras,
        foto: m.foto,
        data: m.data,
        hora: m.hora
      })),
      recentWorkouts: workouts.slice(0, 10).map(w => ({
        id: w.id,
        nome: w.nome,
        tipo: w.tipo,
        duracao: w.duracao,
        calorias_queimadas: w.calorias_queimadas,
        exercicios: w.exercicios,
        data: w.data
      })),
      bioimpedance: lastBioimpedance ? {
        data: lastBioimpedance.data,
        peso: lastBioimpedance.peso,
        massa_muscular: lastBioimpedance.massa_muscular,
        gordura_corporal: lastBioimpedance.gordura_corporal,
        agua_corporal: lastBioimpedance.agua_corporal,
        massa_ossea: lastBioimpedance.massa_ossea,
        metabolismo_basal: lastBioimpedance.metabolismo_basal
      } : null
    })

  } catch (error) {
    console.error('Erro ao processar requisição:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
