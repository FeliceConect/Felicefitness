import type { Insight, UserAnalysisData } from '@/types/insights'
import { average, calculateDaysSince } from './patterns'
import { calculateOvertrainingRisk } from './predictions'

/**
 * Gera ID único para insight
 */
export function generateInsightId(): string {
  return `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Gera alertas baseado nos dados do usuário
 */
export function generateAlerts(data: UserAnalysisData): Insight[] {
  const insights: Insight[] = []

  // Alertas de suplementos
  insights.push(...generateSupplementAlerts(data))

  // Alertas de overtraining
  insights.push(...generateOvertrainingAlerts(data))

  // Alertas de déficit calórico
  insights.push(...generateNutritionAlerts(data))

  // Alertas de sono
  insights.push(...generateSleepAlerts(data))

  // Alertas de hidratação
  insights.push(...generateHydrationAlerts(data))

  // Alertas de consistência
  insights.push(...generateConsistencyAlerts(data))

  // Alertas de Revolade (específico para PTI)
  if (data.revoladeSettings?.enabled) {
    insights.push(...generateRevoladeAlerts(data))
  }

  return insights
}

/**
 * Alertas de estoque de suplementos
 */
function generateSupplementAlerts(data: UserAnalysisData): Insight[] {
  const insights: Insight[] = []
  const supplements = data.supplements || []

  supplements.forEach((supplement) => {
    if (supplement.daysRemaining <= 3 && supplement.priority === 'alta') {
      insights.push({
        id: generateInsightId(),
        type: 'alert',
        priority: 'critical',
        category: 'health',
        title: `Estoque crítico: ${supplement.name}`,
        description: `Restam apenas ${supplement.daysRemaining} dias de ${supplement.name}. Compre imediatamente!`,
        icon: '💊',
        action: {
          type: 'view_stock',
          label: 'Ver estoque',
          href: '/suplementos/estoque',
        },
        createdAt: new Date(),
      })
    } else if (supplement.daysRemaining <= 7 && supplement.priority === 'alta') {
      insights.push({
        id: generateInsightId(),
        type: 'alert',
        priority: 'high',
        category: 'health',
        title: `Estoque baixo: ${supplement.name}`,
        description: `Restam ${supplement.daysRemaining} dias de ${supplement.name}. Não deixe acabar!`,
        icon: '💊',
        action: {
          type: 'view_stock',
          label: 'Ver estoque',
          href: '/suplementos/estoque',
        },
        createdAt: new Date(),
      })
    } else if (supplement.daysRemaining <= 14 && supplement.priority === 'alta') {
      insights.push({
        id: generateInsightId(),
        type: 'recommendation',
        priority: 'medium',
        category: 'health',
        title: `Planeje reposição: ${supplement.name}`,
        description: `${supplement.name} acaba em ${supplement.daysRemaining} dias. Considere comprar em breve.`,
        icon: '📦',
        action: {
          type: 'view_stock',
          label: 'Ver estoque',
          href: '/suplementos/estoque',
        },
        createdAt: new Date(),
      })
    }
  })

  return insights
}

/**
 * Alertas de overtraining
 */
function generateOvertrainingAlerts(data: UserAnalysisData): Insight[] {
  const insights: Insight[] = []

  const risk = calculateOvertrainingRisk(data)

  if (risk >= 0.8) {
    insights.push({
      id: generateInsightId(),
      type: 'alert',
      priority: 'critical',
      category: 'workout',
      title: 'Alto risco de overtraining!',
      description:
        'Sinais de excesso: volume alto, sono ruim e stress elevado. Tire um dia de descanso ativo.',
      icon: '🔴',
      data: { risk },
      action: {
        type: 'schedule_rest',
        label: 'Agendar descanso',
        href: '/recuperacao',
      },
      createdAt: new Date(),
    })
  } else if (risk >= 0.6) {
    insights.push({
      id: generateInsightId(),
      type: 'alert',
      priority: 'high',
      category: 'workout',
      title: 'Risco de overtraining detectado',
      description:
        'Você está treinando muito com pouca recuperação. Considere um dia mais leve.',
      icon: '⚠️',
      data: { risk },
      action: {
        type: 'view_recovery',
        label: 'Ver recuperação',
        href: '/recuperacao',
      },
      createdAt: new Date(),
    })
  }

  return insights
}

/**
 * Alertas de nutrição
 */
function generateNutritionAlerts(data: UserAnalysisData): Insight[] {
  const insights: Insight[] = []

  const recentCalories = data.recentCalories || []
  const caloriesGoal = data.goals.caloriesGoal

  if (recentCalories.length >= 3 && caloriesGoal) {
    const avgCalories = average(recentCalories.slice(-7))
    const deficit = caloriesGoal - avgCalories

    // Déficit muito grande
    if (deficit > 700) {
      insights.push({
        id: generateInsightId(),
        type: 'alert',
        priority: 'high',
        category: 'nutrition',
        title: 'Déficit calórico muito alto',
        description: `Você está comendo ${Math.round(deficit)} kcal abaixo da meta. Isso pode prejudicar sua saúde e performance.`,
        icon: '🍽️',
        action: {
          type: 'adjust_calories',
          label: 'Revisar metas',
          href: '/configuracoes/alimentacao',
        },
        createdAt: new Date(),
      })
    } else if (deficit > 500) {
      insights.push({
        id: generateInsightId(),
        type: 'alert',
        priority: 'medium',
        category: 'nutrition',
        title: 'Déficit calórico alto',
        description: `${Math.round(deficit)} kcal abaixo da meta. Pode impactar recuperação muscular.`,
        icon: '🍽️',
        action: {
          type: 'view_nutrition',
          label: 'Ver alimentação',
          href: '/alimentacao',
        },
        createdAt: new Date(),
      })
    }

    // Superávit grande (se não for objetivo)
    if (deficit < -500) {
      insights.push({
        id: generateInsightId(),
        type: 'alert',
        priority: 'medium',
        category: 'nutrition',
        title: 'Consumo calórico elevado',
        description: `Você está comendo ${Math.round(Math.abs(deficit))} kcal acima da meta.`,
        icon: '📈',
        action: {
          type: 'view_nutrition',
          label: 'Ver alimentação',
          href: '/alimentacao',
        },
        createdAt: new Date(),
      })
    }
  }

  // Proteína baixa
  const dailyProtein = data.dailyProtein || []
  const proteinGoal = data.goals.proteinGoal

  if (dailyProtein.length >= 3 && proteinGoal) {
    const avgProtein = average(dailyProtein.slice(-7))
    const proteinDeficit = proteinGoal - avgProtein

    if (proteinDeficit > 30) {
      insights.push({
        id: generateInsightId(),
        type: 'alert',
        priority: 'high',
        category: 'nutrition',
        title: 'Proteína abaixo da meta',
        description: `Média de ${Math.round(avgProtein)}g/dia (meta: ${proteinGoal}g). Isso limita ganho muscular.`,
        icon: '🥩',
        action: {
          type: 'view_nutrition',
          label: 'Ver alimentação',
          href: '/alimentacao',
        },
        createdAt: new Date(),
      })
    }
  }

  return insights
}

/**
 * Alertas de sono
 */
function generateSleepAlerts(data: UserAnalysisData): Insight[] {
  const insights: Insight[] = []

  const sleepDurations = data.sleepDurations || []

  if (sleepDurations.length >= 5) {
    const avgSleep = average(sleepDurations.slice(-7))

    if (avgSleep < 5.5) {
      insights.push({
        id: generateInsightId(),
        type: 'alert',
        priority: 'critical',
        category: 'sleep',
        title: 'Sono criticamente baixo!',
        description: `Média de apenas ${avgSleep.toFixed(1)}h de sono. Isso impacta seriamente sua saúde e recuperação.`,
        icon: '😴',
        action: {
          type: 'view_sleep',
          label: 'Ver sono',
          href: '/sono',
        },
        createdAt: new Date(),
      })
    } else if (avgSleep < 6.5) {
      insights.push({
        id: generateInsightId(),
        type: 'alert',
        priority: 'high',
        category: 'sleep',
        title: 'Sono insuficiente',
        description: `Média de ${avgSleep.toFixed(1)}h de sono. O ideal são 7-9 horas.`,
        icon: '😴',
        action: {
          type: 'view_sleep_tips',
          label: 'Ver dicas',
          href: '/sono/insights',
        },
        createdAt: new Date(),
      })
    }
  }

  return insights
}

/**
 * Alertas de hidratação
 */
function generateHydrationAlerts(data: UserAnalysisData): Insight[] {
  const insights: Insight[] = []

  const waterIntake = data.waterIntake || []
  const waterGoal = data.waterGoal || 3000

  if (waterIntake.length >= 3) {
    const avgWater = average(waterIntake.slice(-7))
    const percentageOfGoal = (avgWater / waterGoal) * 100

    if (percentageOfGoal < 60) {
      insights.push({
        id: generateInsightId(),
        type: 'alert',
        priority: 'high',
        category: 'hydration',
        title: 'Hidratação muito baixa',
        description: `Média de ${(avgWater / 1000).toFixed(1)}L/dia (${Math.round(percentageOfGoal)}% da meta).`,
        icon: '💧',
        action: {
          type: 'view_water',
          label: 'Ver água',
          href: '/agua',
        },
        createdAt: new Date(),
      })
    } else if (percentageOfGoal < 80) {
      insights.push({
        id: generateInsightId(),
        type: 'alert',
        priority: 'medium',
        category: 'hydration',
        title: 'Hidratação abaixo da meta',
        description: `Você está bebendo ${Math.round(percentageOfGoal)}% da meta diária de água.`,
        icon: '💧',
        action: {
          type: 'view_water',
          label: 'Ver água',
          href: '/agua',
        },
        createdAt: new Date(),
      })
    }
  }

  return insights
}

/**
 * Alertas de consistência
 */
function generateConsistencyAlerts(data: UserAnalysisData): Insight[] {
  const insights: Insight[] = []

  const workouts = data.workouts || []

  // Verificar se não treinou há muito tempo
  if (workouts.length > 0) {
    const lastWorkoutDate = new Date(workouts[0].date)
    const daysSinceLastWorkout = calculateDaysSince(lastWorkoutDate)

    if (daysSinceLastWorkout >= 5) {
      insights.push({
        id: generateInsightId(),
        type: 'alert',
        priority: 'high',
        category: 'consistency',
        title: `${daysSinceLastWorkout} dias sem treinar`,
        description: 'Você está perdendo seu progresso. Volte aos treinos o quanto antes!',
        icon: '⚠️',
        action: {
          type: 'start_workout',
          label: 'Treinar agora',
          href: '/treino',
        },
        createdAt: new Date(),
      })
    } else if (daysSinceLastWorkout >= 3) {
      insights.push({
        id: generateInsightId(),
        type: 'recommendation',
        priority: 'medium',
        category: 'consistency',
        title: 'Hora de treinar!',
        description: `Faz ${daysSinceLastWorkout} dias desde seu último treino. Mantenha a consistência!`,
        icon: '💪',
        action: {
          type: 'start_workout',
          label: 'Treinar agora',
          href: '/treino',
        },
        createdAt: new Date(),
      })
    }
  }

  // Verificar queda no streak
  const gamification = data.gamification
  if (gamification && gamification.streak === 0) {
    insights.push({
      id: generateInsightId(),
      type: 'alert',
      priority: 'medium',
      category: 'consistency',
      title: 'Streak perdido!',
      description: 'Você perdeu seu streak. Comece novamente hoje para reconstruir seu progresso!',
      icon: '🔥',
      action: {
        type: 'start_activity',
        label: 'Começar agora',
        href: '/dashboard',
      },
      createdAt: new Date(),
    })
  }

  return insights
}

/**
 * Alertas específicos do Revolade
 */
function generateRevoladeAlerts(data: UserAnalysisData): Insight[] {
  const insights: Insight[] = []

  // Verificar violações da janela de restrição
  const meals = data.meals || []
  const settings = data.revoladeSettings

  if (!settings) return insights

  // Contar refeições com laticínios durante janela de restrição
  let violations = 0
  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  meals
    .filter((m) => new Date(m.date) >= sevenDaysAgo)
    .forEach((meal) => {
      if (meal.hasDairy) {
        // Verificar se está na janela de restrição (simplificado)
        const mealHour = parseInt(meal.time.split(':')[0])
        const scheduleHour = parseInt(settings.schedule.split(':')[0])
        const restrictedEnd = scheduleHour + settings.restrictedHours

        if (mealHour >= scheduleHour && mealHour < restrictedEnd) {
          violations++
        }
      }
    })

  if (violations > 0) {
    insights.push({
      id: generateInsightId(),
      type: 'alert',
      priority: 'critical',
      category: 'health',
      title: 'Atenção à janela do Revolade!',
      description: `Detectamos ${violations} refeições com laticínios durante a janela de restrição esta semana.`,
      icon: '💊',
      data: { violations },
      action: {
        type: 'view_violations',
        label: 'Ver detalhes',
        href: '/suplementos',
      },
      createdAt: new Date(),
    })
  }

  return insights
}

/**
 * Filtra alertas por prioridade
 */
export function filterAlertsByPriority(
  alerts: Insight[],
  minPriority: 'low' | 'medium' | 'high' | 'critical' = 'low'
): Insight[] {
  const priorityOrder = { low: 0, medium: 1, high: 2, critical: 3 }

  return alerts.filter(
    (alert) => priorityOrder[alert.priority] >= priorityOrder[minPriority]
  )
}

/**
 * Agrupa alertas por prioridade
 */
export function groupAlertsByPriority(
  alerts: Insight[]
): Record<string, Insight[]> {
  return {
    critical: alerts.filter((a) => a.priority === 'critical'),
    high: alerts.filter((a) => a.priority === 'high'),
    medium: alerts.filter((a) => a.priority === 'medium'),
    low: alerts.filter((a) => a.priority === 'low'),
  }
}
