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
        .from('fitness_water_logs')
        .select('*')
        .eq('user_id', clientId)
        .gte('data', weekAgoStr)
        .order('data', { ascending: false }),
      supabaseAdmin
        .from('fitness_sleep_logs')
        .select('*')
        .eq('user_id', clientId)
        .gte('data', weekAgoStr)
        .order('data', { ascending: false }),
      supabaseAdmin
        .from('fitness_body_compositions')
        .select('id, user_id, data, peso, massa_muscular, gordura_corporal, gordura_percentual')
        .eq('user_id', clientId)
        .gte('data', monthAgoStr)
        .order('data', { ascending: false }),
      supabaseAdmin
        .from('fitness_body_compositions')
        .select('*')
        .eq('user_id', clientId)
        .not('impedancia_dados', 'is', null)
        .order('data', { ascending: false })
        .limit(5)
    ])

    // Calcular estatísticas de refeições
    const meals = mealsResult.data || []
    const totalCalories = meals.reduce((sum, m) => sum + (m.calorias_total || 0), 0)
    const totalProtein = meals.reduce((sum, m) => sum + (m.proteinas_total || 0), 0)
    const totalCarbs = meals.reduce((sum, m) => sum + (m.carboidratos_total || 0), 0)
    const totalFat = meals.reduce((sum, m) => sum + (m.gorduras_total || 0), 0)
    const daysWithMeals = new Set(meals.map(m => m.data)).size
    const avgDailyCalories = daysWithMeals > 0 ? Math.round(totalCalories / daysWithMeals) : 0
    const avgDailyProtein = daysWithMeals > 0 ? Math.round(totalProtein / daysWithMeals) : 0
    const avgDailyCarbs = daysWithMeals > 0 ? Math.round(totalCarbs / daysWithMeals) : 0
    const avgDailyFat = daysWithMeals > 0 ? Math.round(totalFat / daysWithMeals) : 0

    // Calcular estatísticas de treinos
    const workouts = workoutsResult.data || []
    const totalWorkoutMinutes = workouts.reduce((sum, w) => sum + (w.duracao_minutos || 0), 0)
    const totalCaloriesBurned = workouts.reduce((sum, w) => sum + (w.calorias_estimadas || 0), 0)
    const workoutDays = new Set(workouts.map(w => w.data)).size

    // Calcular média de hidratação
    const hydration = hydrationResult.data || []
    // Water logs may have quantidade_ml instead of quantidade
    const totalWater = hydration.reduce((sum: number, h: Record<string, unknown>) => sum + ((h.quantidade_ml as number) || (h.quantidade as number) || 0), 0)
    const waterByDay: Record<string, number> = {}
    for (const h of hydration) {
      const day = h.data as string
      const ml = (h.quantidade_ml as number) || (h.quantidade as number) || 0
      waterByDay[day] = (waterByDay[day] || 0) + ml
    }
    const daysWithHydration = Object.keys(waterByDay).length
    const avgDailyWater = daysWithHydration > 0 ? Math.round(totalWater / daysWithHydration) : 0
    const waterGoalMl = (profile.meta_agua as number) || 2500
    const daysGoalMet = Object.values(waterByDay).filter(ml => ml >= waterGoalMl).length

    // Calcular média de sono
    const sleepRecords = sleepResult.data || []
    const totalSleepMinutes = sleepRecords.reduce((sum: number, s: Record<string, unknown>) => {
      const mins = (s.duracao_minutos as number) || (s.duracao as number) || 0
      return sum + mins
    }, 0)
    const avgSleepHours = sleepRecords.length > 0 ? (totalSleepMinutes / sleepRecords.length / 60).toFixed(1) : '0'
    const avgSleepQuality = sleepRecords.length > 0
      ? (sleepRecords.reduce((sum: number, s: Record<string, unknown>) => sum + ((s.qualidade as number) || 0), 0) / sleepRecords.length).toFixed(1)
      : '0'

    // Progresso de peso
    const weightHistory = weightResult.data || []
    const currentWeight = profile.peso_atual
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
        foto: profile.foto_url,
        peso: profile.peso_atual,
        altura: profile.altura_cm,
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
          avgDaily: avgDailyWater,
          goalMl: waterGoalMl,
          daysGoalMet,
          dailyLog: Object.entries(waterByDay).map(([date, ml]) => ({ date, ml })).sort((a, b) => b.date.localeCompare(a.date))
        },
        sleep: {
          records: sleepRecords.length,
          avgHours: avgSleepHours,
          avgQuality: avgSleepQuality,
          dailyLog: sleepRecords.slice(0, 7).map((s: Record<string, unknown>) => ({
            date: s.data,
            hours: ((s.duracao_minutos as number) || (s.duracao as number) || 0) / 60,
            quality: (s.qualidade as number) || 0,
            bedtime: s.hora_dormir,
            wakeup: s.hora_acordar,
          }))
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
        tipo: m.tipo_refeicao,
        calorias: m.calorias_total,
        proteinas: m.proteinas_total,
        carboidratos: m.carboidratos_total,
        gorduras: m.gorduras_total,
        foto: m.foto_url,
        data: m.data,
        hora: m.horario
      })),
      recentWorkouts: workouts.slice(0, 10).map(w => ({
        id: w.id,
        nome: w.nome,
        tipo: w.tipo,
        duracao: w.duracao_minutos,
        calorias_queimadas: w.calorias_estimadas,
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
