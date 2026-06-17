import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { getDateOffsetSP } from '@/lib/utils/date'

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

    // Datas de referência (America/Sao_Paulo)
    const weekAgoStr = getDateOffsetSP(-7)
    const monthAgoStr = getDateOffsetSP(-30)

    // Buscar refeições, treinos, hidratação, sono, peso, bioimpedância e plano ativo
    const [
      mealsResult,
      workoutsResult,
      hydrationResult,
      sleepResult,
      weightResult,
      bioimpedanceResult,
      mealPlanResult
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
        .eq('status', 'concluido')
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
        .select('id, user_id, data, peso, massa_muscular_esqueletica_kg, massa_gordura_kg, percentual_gordura')
        .eq('user_id', clientId)
        .gte('data', monthAgoStr)
        .order('data', { ascending: false }),
      supabaseAdmin
        .from('fitness_body_compositions')
        .select('*')
        .eq('user_id', clientId)
        .order('data', { ascending: false })
        .limit(30),
      supabaseAdmin
        .from('fitness_meal_plans')
        .select('calories_target, protein_target, carbs_target, fat_target, water_target')
        .eq('client_id', clientId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
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
    const waterGoalMl = (profile.meta_agua_ml as number) || 2000
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

    // Progresso de peso — usa peso do perfil; se ausente, cai para a última
    // medição corporal COM peso preenchido (o registro mais recente pode estar
    // em branco). Variação = peso mais recente vs. o mais antigo com peso.
    const weightHistory = weightResult.data || []
    const weighed = weightHistory.filter((w: { peso: number | null }) => w.peso != null)
    const latestWeight = weighed.length > 0 ? weighed[0].peso : null
    const currentWeight = profile.peso_atual ?? latestWeight
    const oldestWeight = weighed.length > 0 ? weighed[weighed.length - 1].peso : null
    const weightChange = latestWeight && oldestWeight && weighed.length >= 2
      ? +(latestWeight - oldestWeight).toFixed(1)
      : 0

    // Última bioimpedância — considerar apenas medições reais (InBody / avaliação),
    // ignorando registros de peso manuais sem dados de composição.
    const isRealBioimpedance = (r: Record<string, unknown>) =>
      r.momento_avaliacao != null ||
      r.fonte === 'inbody' ||
      r.impedancia_dados != null ||
      r.pontuacao_inbody != null ||
      r.massa_muscular_esqueletica_kg != null ||
      r.massa_gordura_kg != null ||
      r.percentual_gordura != null ||
      r.agua_corporal_l != null ||
      r.taxa_metabolica_basal != null
    const lastBioimpedance = (bioimpedanceResult.data || []).find(isRealBioimpedance) || null

    // Plano alimentar ativo — usado como fallback das metas quando o perfil não as tem
    const activePlan = mealPlanResult.data as {
      calories_target?: number | null
      protein_target?: number | null
      carbs_target?: number | null
      fat_target?: number | null
      water_target?: number | null
    } | null

    // Detalhamento das refeições recentes (itens/alimentos)
    const recentMealsSlice = meals.slice(0, 10)
    const recentMealIds = recentMealsSlice.map(m => m.id)
    const itemsByMeal: Record<string, Array<{ nome: string; quantidade: number | null; unidade: string | null; calorias: number | null }>> = {}
    if (recentMealIds.length > 0) {
      const { data: mealItems } = await supabaseAdmin
        .from('fitness_meal_items')
        .select('meal_id, nome_alimento, quantidade, unidade, calorias')
        .in('meal_id', recentMealIds)
      for (const it of mealItems || []) {
        const list = itemsByMeal[it.meal_id] || (itemsByMeal[it.meal_id] = [])
        list.push({
          nome: it.nome_alimento,
          quantidade: it.quantidade,
          unidade: it.unidade,
          calorias: it.calorias,
        })
      }
    }

    return NextResponse.json({
      success: true,
      client: {
        id: profile.id,
        nome: profile.nome,
        email: profile.email,
        foto: profile.foto_url,
        peso: currentWeight,
        altura: profile.altura_cm,
        objetivo: profile.objetivo,
        // Metas: nomes corretos das colunas do perfil, com fallback no plano ativo
        meta_calorias: profile.meta_calorias_diarias ?? activePlan?.calories_target ?? null,
        meta_proteinas: profile.meta_proteina_g ?? activePlan?.protein_target ?? null,
        meta_carboidratos: profile.meta_carboidrato_g ?? activePlan?.carbs_target ?? null,
        meta_gorduras: profile.meta_gordura_g ?? activePlan?.fat_target ?? null,
        meta_agua: profile.meta_agua_ml ?? activePlan?.water_target ?? 2000,
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
      recentMeals: recentMealsSlice.map(m => ({
        id: m.id,
        tipo: m.tipo_refeicao,
        descricao: m.notas || m.analise_ia || null,
        itens: itemsByMeal[m.id] || [],
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
        momento: lastBioimpedance.momento_avaliacao ?? null,
        peso: lastBioimpedance.peso,
        massa_muscular: lastBioimpedance.massa_muscular_esqueletica_kg,
        // % de gordura — preferir o percentual real; cair para massa gorda
        gordura_corporal: lastBioimpedance.percentual_gordura ?? lastBioimpedance.massa_gordura_kg,
        agua_corporal: lastBioimpedance.agua_corporal_l,
        massa_ossea: lastBioimpedance.minerais_kg,
        metabolismo_basal: lastBioimpedance.taxa_metabolica_basal
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
