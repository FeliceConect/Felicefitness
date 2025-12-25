import { createClient } from '@/lib/supabase/client'
import type { Insight, UserAnalysisData } from '@/types/insights'
import { calculateTrend, analyzeCorrelations, analyzeMuscleBalance, analyzeWorkoutSchedule } from './patterns'
import { projectWeight, predictNextPRs, calculateSkiReadiness } from './predictions'
import { generateAlerts, generateInsightId } from './alerts'
import { generateRecommendations } from './recommendations'

/**
 * Busca todos os dados do usuário para análise
 */
export async function fetchAllUserData(userId: string): Promise<UserAnalysisData> {
  const supabase = createClient()

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0]

  // Buscar dados em paralelo
  const [
    workoutsResult,
    mealsResult,
    bodyCompsResult,
    sleepResult,
    wellnessResult,
    waterResult,
    supplementsResult,
    profileResult,
  ] = await Promise.all([
    // Treinos
    supabase
      .from('treino_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('data', thirtyDaysAgoStr)
      .order('data', { ascending: false }),

    // Refeições
    supabase
      .from('refeicoes')
      .select('*')
      .eq('user_id', userId)
      .gte('data', thirtyDaysAgoStr)
      .order('data', { ascending: false }),

    // Composição corporal
    supabase
      .from('fitness_body_compositions')
      .select('*')
      .eq('user_id', userId)
      .order('data', { ascending: false })
      .limit(10),

    // Sono
    supabase
      .from('sono_registros')
      .select('*')
      .eq('user_id', userId)
      .gte('data', thirtyDaysAgoStr)
      .order('data', { ascending: false }),

    // Bem-estar
    supabase
      .from('fitness_wellness_checkins')
      .select('*')
      .eq('user_id', userId)
      .gte('data', thirtyDaysAgoStr)
      .order('data', { ascending: false }),

    // Água
    supabase
      .from('agua_registros')
      .select('*')
      .eq('user_id', userId)
      .gte('data', thirtyDaysAgoStr)
      .order('data', { ascending: false }),

    // Suplementos
    supabase
      .from('fitness_supplements')
      .select('*')
      .eq('user_id', userId),

    // Perfil
    supabase
      .from('fitness_profiles')
      .select('*')
      .eq('id', userId)
      .single(),
  ])

  // Processar dados
  const workouts = (workoutsResult.data || []).map((w: Record<string, unknown>) => ({
    id: w.id as string,
    date: w.data as string,
    name: w.nome as string || 'Treino',
    duration: w.duracao_minutos as number || 0,
    volume: w.volume_total as number || 0,
    exercises: w.exercicios_count as number || 0,
    createdAt: w.created_at as string,
  }))

  // Calcular volumes semanais
  const weeklyVolumes = calculateWeeklyVolumes(workouts)

  // Mapear refeições
  const meals = (mealsResult.data || []).map((m: Record<string, unknown>) => ({
    id: m.id as string,
    date: m.data as string,
    time: m.horario as string || '12:00',
    calories: m.calorias as number || 0,
    protein: m.proteina as number || 0,
    carbs: m.carboidratos as number || 0,
    fat: m.gordura as number || 0,
    hasDairy: (m.ingredientes as string || '').toLowerCase().includes('leite') ||
              (m.ingredientes as string || '').toLowerCase().includes('queijo'),
  }))

  // Agregar proteína e calorias diárias
  const dailyNutrition = aggregateDailyNutrition(meals)

  // Mapear composição corporal
  const bodyComps = (bodyCompsResult.data || []).map((b: Record<string, unknown>) => ({
    id: b.id as string,
    date: b.data as string,
    peso: b.peso as number || 0,
    gordura: b.gordura_percentual as number || 0,
    musculo: b.massa_muscular as number || 0,
  }))

  // Construir histórico de peso
  const weightHistory = bodyComps.map((b) => ({
    date: new Date(b.date),
    value: b.peso,
  }))

  // Mapear sono
  const sleepData = sleepResult.data || []
  const sleepDurations = sleepData.map((s: Record<string, unknown>) => s.duracao_horas as number || 0)
  const sleepQuality = sleepData.map((s: Record<string, unknown>) => s.qualidade as number || 70)

  // Mapear bem-estar
  const wellnessData = wellnessResult.data || []
  const wellnessCheckins = wellnessData.map((w: Record<string, unknown>) => ({
    id: w.id as string,
    date: w.data as string,
    mood: w.humor as number || 3,
    stress: w.stress as number || 3,
    energy: w.energia as number || 3,
  }))

  // Mapear água
  const waterData = waterResult.data || []
  const waterIntake = aggregateDailyWater(waterData)

  // Mapear suplementos
  const supplements = (supplementsResult.data || []).map((s: Record<string, unknown>) => ({
    id: s.id as string,
    name: s.nome as string,
    daysRemaining: calculateDaysRemaining(s),
    priority: s.prioridade as 'alta' | 'media' | 'baixa' || 'media',
  }))

  // Dados do perfil
  const profile = (profileResult.data || {}) as {
    meta_proteina?: number
    meta_calorias?: number
    meta_agua?: number
    streak?: number
    nivel?: number
    xp?: number
    meta_peso?: number
    ski_trip_date?: string
    revolade_enabled?: boolean
    revolade_horario?: string
    revolade_restricao_horas?: number
  }

  return {
    workouts,
    weeklyVolumes,
    lastPR: undefined, // Seria calculado de exercicio_logs
    workoutPerformance: workouts.map((w) => w.volume / Math.max(1, w.duration)),

    dailyProtein: dailyNutrition.protein,
    recentCalories: dailyNutrition.calories,
    meals,
    proteinGoal: profile.meta_proteina || 170,
    caloriesGoal: profile.meta_calorias || 2500,

    bodyComps,
    weightHistory,

    sleepDurations,
    sleepQuality,

    wellnessCheckins,
    dailyScores: wellnessCheckins.map((w) => ((w.mood + (6 - w.stress) + w.energy) / 3) * 20),

    waterIntake,
    waterGoal: profile.meta_agua || 3000,

    supplements,

    gamification: {
      streak: profile.streak || 0,
      level: profile.nivel || 1,
      xp: profile.xp || 0,
    },

    goals: {
      weightTarget: profile.meta_peso,
      caloriesGoal: profile.meta_calorias || 2500,
      proteinGoal: profile.meta_proteina || 170,
      skiTrip: profile.ski_trip_date ? {
        date: new Date(profile.ski_trip_date),
        preparedness: 0,
      } : undefined,
    },

    revoladeSettings: profile.revolade_enabled ? {
      enabled: true,
      schedule: profile.revolade_horario || '07:00',
      restrictedHours: profile.revolade_restricao_horas || 4,
    } : undefined,
  }
}

/**
 * Calcula volumes semanais
 */
function calculateWeeklyVolumes(
  workouts: Array<{ date: string; volume: number }>
): number[] {
  const weeklyVolumes: Record<string, number> = {}

  workouts.forEach((w) => {
    const date = new Date(w.date)
    const weekStart = new Date(date)
    weekStart.setDate(date.getDate() - date.getDay())
    const weekKey = weekStart.toISOString().split('T')[0]

    weeklyVolumes[weekKey] = (weeklyVolumes[weekKey] || 0) + w.volume
  })

  return Object.values(weeklyVolumes)
}

/**
 * Agrega nutrição diária
 */
function aggregateDailyNutrition(
  meals: Array<{ date: string; calories: number; protein: number }>
): { calories: number[]; protein: number[] } {
  const dailyData: Record<string, { calories: number; protein: number }> = {}

  meals.forEach((m) => {
    if (!dailyData[m.date]) {
      dailyData[m.date] = { calories: 0, protein: 0 }
    }
    dailyData[m.date].calories += m.calories
    dailyData[m.date].protein += m.protein
  })

  const values = Object.values(dailyData)
  return {
    calories: values.map((v) => v.calories),
    protein: values.map((v) => v.protein),
  }
}

/**
 * Agrega água diária
 */
function aggregateDailyWater(
  waterData: Array<Record<string, unknown>>
): number[] {
  const dailyWater: Record<string, number> = {}

  waterData.forEach((w) => {
    const date = w.data as string
    const amount = w.quantidade_ml as number || 0
    dailyWater[date] = (dailyWater[date] || 0) + amount
  })

  return Object.values(dailyWater)
}

/**
 * Calcula dias restantes de suplemento
 */
function calculateDaysRemaining(supplement: Record<string, unknown>): number {
  const quantidadeAtual = supplement.quantidade_atual as number || 0
  const doseDiaria = supplement.dose_diaria as number || 1
  return Math.floor(quantidadeAtual / doseDiaria)
}

/**
 * Analisa todos os dados do usuário e gera insights
 */
export async function analyzeUserData(userId: string): Promise<Insight[]> {
  const insights: Insight[] = []

  try {
    // Buscar dados
    const data = await fetchAllUserData(userId)

    // ===== ANÁLISES DE TREINO =====
    insights.push(...analyzeWorkouts(data))

    // ===== ANÁLISES DE NUTRIÇÃO =====
    insights.push(...analyzeNutrition(data))

    // ===== ANÁLISES DE CORPO =====
    insights.push(...analyzeBodyComposition(data))

    // ===== ANÁLISES DE SONO =====
    insights.push(...analyzeSleep(data))

    // ===== CORRELAÇÕES =====
    insights.push(...analyzeDataCorrelations(data))

    // ===== PREVISÕES =====
    insights.push(...generatePredictions(data))

    // ===== ALERTAS =====
    insights.push(...generateAlerts(data))

    // ===== RECOMENDAÇÕES =====
    insights.push(...generateRecommendations(data))

    // Ordenar por prioridade e data
    return insights
      .filter((i) => !i.dismissed)
      .sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority]
        }
        return b.createdAt.getTime() - a.createdAt.getTime()
      })
  } catch (error) {
    console.error('Error analyzing user data:', error)
    return []
  }
}

/**
 * Análise de treinos
 */
function analyzeWorkouts(data: UserAnalysisData): Insight[] {
  const insights: Insight[] = []

  // Tendência de volume
  const volumeTrend = calculateTrend(data.weeklyVolumes)
  if (volumeTrend.direction === 'up' && volumeTrend.percentage > 10) {
    insights.push({
      id: generateInsightId(),
      type: 'trend',
      priority: 'medium',
      category: 'workout',
      title: 'Volume de treino crescendo! 📈',
      description: `Seu volume de treino aumentou ${volumeTrend.percentage.toFixed(0)}% nas últimas semanas. Continue assim!`,
      icon: '💪',
      data: { trend: volumeTrend },
      createdAt: new Date(),
    })
  }

  // Consistência de horário
  const scheduleConsistency = analyzeWorkoutSchedule(data.workouts)
  if (scheduleConsistency > 85) {
    insights.push({
      id: generateInsightId(),
      type: 'achievement',
      priority: 'low',
      category: 'workout',
      title: 'Horários consistentes! ⏰',
      description: `${scheduleConsistency.toFixed(0)}% dos seus treinos são no mesmo horário. Isso otimiza seu ritmo circadiano!`,
      icon: '🎯',
      createdAt: new Date(),
    })
  }

  // Desbalanceamento muscular
  const muscleBalance = analyzeMuscleBalance(data.workouts as Array<{ muscleGroups?: string[] }>)
  if (muscleBalance.imbalanced) {
    insights.push({
      id: generateInsightId(),
      type: 'recommendation',
      priority: 'medium',
      category: 'workout',
      title: 'Desbalanceamento detectado',
      description: `Você treina ${muscleBalance.overworked} mais que ${muscleBalance.underworked}. Considere equilibrar.`,
      icon: '⚖️',
      data: muscleBalance as unknown as Record<string, unknown>,
      action: {
        type: 'adjust_routine',
        label: 'Ajustar rotina',
        href: '/treino',
      },
      createdAt: new Date(),
    })
  }

  return insights
}

/**
 * Análise de nutrição
 */
function analyzeNutrition(data: UserAnalysisData): Insight[] {
  void data // Já coberto em recommendations e alerts
  return []
}

/**
 * Análise de composição corporal
 */
function analyzeBodyComposition(data: UserAnalysisData): Insight[] {
  void data // Já coberto em recommendations
  return []
}

/**
 * Análise de sono
 */
function analyzeSleep(data: UserAnalysisData): Insight[] {
  const insights: Insight[] = []

  const sleepTrend = calculateTrend(data.sleepDurations)
  if (sleepTrend.direction === 'down' && sleepTrend.percentage > 10) {
    insights.push({
      id: generateInsightId(),
      type: 'trend',
      priority: 'high',
      category: 'sleep',
      title: 'Sono diminuindo ⚠️',
      description: `Sua média de sono caiu ${sleepTrend.percentage.toFixed(0)}%. Isso pode impactar recuperação e performance.`,
      icon: '😴',
      action: {
        type: 'view_sleep_tips',
        label: 'Ver dicas',
        href: '/sono/insights',
      },
      createdAt: new Date(),
    })
  }

  return insights
}

/**
 * Análise de correlações
 */
function analyzeDataCorrelations(data: UserAnalysisData): Insight[] {
  const insights: Insight[] = []

  const correlations = analyzeCorrelations({
    sleepQuality: data.sleepQuality,
    workoutPerformance: data.workoutPerformance,
    mood: data.wellnessCheckins.map((w) => w.mood),
    stress: data.wellnessCheckins.map((w) => w.stress),
    energy: data.wellnessCheckins.map((w) => w.energy),
  })

  correlations.forEach((corr) => {
    if (Math.abs(corr.coefficient) > 0.5) {
      insights.push({
        id: generateInsightId(),
        type: 'correlation',
        priority: 'medium',
        category: 'wellness',
        title: `${corr.metric1} impacta ${corr.metric2.toLowerCase()}! 💡`,
        description: `Descobrimos uma ${corr.interpretation} entre ${corr.metric1.toLowerCase()} e ${corr.metric2.toLowerCase()}.`,
        icon: '🔗',
        data: { correlation: corr },
        createdAt: new Date(),
      })
    }
  })

  return insights
}

/**
 * Gera previsões
 */
function generatePredictions(data: UserAnalysisData): Insight[] {
  const insights: Insight[] = []

  // Previsão de peso
  const weightProjection = projectWeight(data)
  if (weightProjection && weightProjection.daysToTarget <= 90 && weightProjection.confidence > 0.4) {
    const targetDate = weightProjection.predictedDate.toLocaleDateString('pt-BR')
    insights.push({
      id: generateInsightId(),
      type: 'prediction',
      priority: 'medium',
      category: 'goals',
      title: 'Previsão: meta de peso 🎯',
      description: `No ritmo atual, você atingirá ${data.goals.weightTarget}kg em ~${weightProjection.daysToTarget} dias (${targetDate}).`,
      icon: '📈',
      data: weightProjection as unknown as Record<string, unknown>,
      createdAt: new Date(),
    })
  }

  // Previsão de PR
  const prPredictions = predictNextPRs(data.workouts as unknown as Array<{ exercises?: Array<{ name: string; sets: Array<{ weight: number; reps: number }> }> }>)
  prPredictions.forEach((pr) => {
    if (pr.likely) {
      insights.push({
        id: generateInsightId(),
        type: 'prediction',
        priority: 'low',
        category: 'workout',
        title: `PR de ${pr.exercise} vindo! 💪`,
        description: `Baseado na sua progressão, você pode bater ${pr.predictedWeight}kg no ${pr.exercise} em breve.`,
        icon: '🏆',
        data: pr as unknown as Record<string, unknown>,
        createdAt: new Date(),
      })
    }
  })

  // Preparação para esqui
  const skiReadiness = calculateSkiReadiness(data)
  if (skiReadiness) {
    insights.push({
      id: generateInsightId(),
      type: 'prediction',
      priority: 'high',
      category: 'goals',
      title: 'Preparação para Esqui 🎿',
      description: `Você está ${skiReadiness.percentage}% preparado. ${skiReadiness.daysRemaining} dias restantes.`,
      icon: '🎿',
      data: skiReadiness as unknown as Record<string, unknown>,
      action: {
        type: 'view_ski_prep',
        label: 'Ver detalhes',
        href: '/insights/previsoes',
      },
      createdAt: new Date(),
    })
  }

  return insights
}

/**
 * Prepara contexto para análise por IA
 */
export function prepareContextForAI(data: UserAnalysisData): Record<string, unknown> {
  return {
    // Resumo de treino
    workout: {
      totalWorkoutsLast30Days: data.workouts.length,
      averageVolume: data.weeklyVolumes.length > 0
        ? data.weeklyVolumes.reduce((a, b) => a + b, 0) / data.weeklyVolumes.length
        : 0,
      volumeTrend: calculateTrend(data.weeklyVolumes),
    },

    // Resumo de nutrição
    nutrition: {
      averageCalories: data.recentCalories.length > 0
        ? data.recentCalories.reduce((a, b) => a + b, 0) / data.recentCalories.length
        : 0,
      caloriesGoal: data.goals.caloriesGoal,
      averageProtein: data.dailyProtein.length > 0
        ? data.dailyProtein.reduce((a, b) => a + b, 0) / data.dailyProtein.length
        : 0,
      proteinGoal: data.goals.proteinGoal,
    },

    // Resumo de corpo
    body: {
      latestWeight: data.bodyComps[0]?.peso,
      latestFat: data.bodyComps[0]?.gordura,
      latestMuscle: data.bodyComps[0]?.musculo,
      weightTarget: data.goals.weightTarget,
    },

    // Resumo de sono
    sleep: {
      averageDuration: data.sleepDurations.length > 0
        ? data.sleepDurations.reduce((a, b) => a + b, 0) / data.sleepDurations.length
        : 0,
      averageQuality: data.sleepQuality.length > 0
        ? data.sleepQuality.reduce((a, b) => a + b, 0) / data.sleepQuality.length
        : 0,
    },

    // Resumo de bem-estar
    wellness: {
      averageMood: data.wellnessCheckins.length > 0
        ? data.wellnessCheckins.reduce((a, b) => a + b.mood, 0) / data.wellnessCheckins.length
        : 3,
      averageStress: data.wellnessCheckins.length > 0
        ? data.wellnessCheckins.reduce((a, b) => a + b.stress, 0) / data.wellnessCheckins.length
        : 3,
      averageEnergy: data.wellnessCheckins.length > 0
        ? data.wellnessCheckins.reduce((a, b) => a + b.energy, 0) / data.wellnessCheckins.length
        : 3,
    },

    // Suplementos com estoque baixo
    lowStockSupplements: data.supplements.filter((s) => s.daysRemaining <= 14),

    // Gamificação
    streak: data.gamification.streak,
    level: data.gamification.level,

    // Metas específicas
    skiTrip: data.goals.skiTrip,
    revoladeEnabled: data.revoladeSettings?.enabled,
  }
}
