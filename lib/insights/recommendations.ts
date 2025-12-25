import type { Insight, UserAnalysisData } from '@/types/insights'
import { generateInsightId } from './alerts'
import { average, calculateTrend, calculateConsistency, getNextStreakMilestone } from './patterns'

/**
 * Gera recomendações baseadas nos dados do usuário
 */
export function generateRecommendations(data: UserAnalysisData): Insight[] {
  const insights: Insight[] = []

  // Recomendações de treino
  insights.push(...generateWorkoutRecommendations(data))

  // Recomendações de nutrição
  insights.push(...generateNutritionRecommendations(data))

  // Recomendações de sono
  insights.push(...generateSleepRecommendations(data))

  // Recomendações de corpo
  insights.push(...generateBodyRecommendations(data))

  // Recomendações de consistência
  insights.push(...generateConsistencyRecommendations(data))

  return insights
}

/**
 * Recomendações de treino
 */
function generateWorkoutRecommendations(data: UserAnalysisData): Insight[] {
  const insights: Insight[] = []

  const workouts = data.workouts || []
  const volumes = data.weeklyVolumes || []

  // Sugerir aumento de volume se estagnado
  if (volumes.length >= 4) {
    const trend = calculateTrend(volumes)

    if (trend.direction === 'stable' && trend.percentage < 3) {
      insights.push({
        id: generateInsightId(),
        type: 'optimization',
        priority: 'medium',
        category: 'workout',
        title: 'Volume estagnado',
        description:
          'Seu volume de treino está estável. Considere aumentar peso ou repetições para continuar progredindo.',
        icon: '📊',
        action: {
          type: 'view_progression',
          label: 'Ver progressão',
          href: '/treino/historico',
        },
        createdAt: new Date(),
      })
    }
  }

  // Sugerir descanso se muito frequente
  const workoutsThisWeek = workouts.filter((w) => {
    const workoutDate = new Date(w.date)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return workoutDate >= weekAgo
  })

  if (workoutsThisWeek.length >= 6) {
    insights.push({
      id: generateInsightId(),
      type: 'recommendation',
      priority: 'medium',
      category: 'workout',
      title: 'Considere um dia de descanso',
      description: `Você treinou ${workoutsThisWeek.length} vezes esta semana. O descanso é essencial para a recuperação.`,
      icon: '🧘',
      action: {
        type: 'schedule_rest',
        label: 'Agendar descanso',
        href: '/recuperacao',
      },
      createdAt: new Date(),
    })
  }

  // Sugerir variação se repetindo muito
  if (workouts.length >= 10) {
    const workoutNames = workouts.slice(0, 10).map((w) => w.name)
    const uniqueNames = new Set(workoutNames)

    if (uniqueNames.size <= 2) {
      insights.push({
        id: generateInsightId(),
        type: 'optimization',
        priority: 'low',
        category: 'workout',
        title: 'Varie seus treinos',
        description:
          'Você está repetindo os mesmos treinos. Variar pode ajudar a evitar platôs.',
        icon: '🔄',
        action: {
          type: 'explore_workouts',
          label: 'Explorar treinos',
          href: '/treino',
        },
        createdAt: new Date(),
      })
    }
  }

  return insights
}

/**
 * Recomendações de nutrição
 */
function generateNutritionRecommendations(data: UserAnalysisData): Insight[] {
  const insights: Insight[] = []

  const dailyProtein = data.dailyProtein || []
  const proteinGoal = data.goals.proteinGoal

  // Celebrar boa consistência de proteína
  if (dailyProtein.length >= 7 && proteinGoal) {
    const consistency = calculateConsistency(dailyProtein.slice(-7), proteinGoal)

    if (consistency.daysOnTarget >= 6) {
      insights.push({
        id: generateInsightId(),
        type: 'achievement',
        priority: 'medium',
        category: 'nutrition',
        title: 'Semana excelente de proteína! 🥩',
        description: `Você atingiu a meta de proteína em ${consistency.daysOnTarget}/7 dias. Seu músculo agradece!`,
        icon: '💪',
        createdAt: new Date(),
      })
    } else if (consistency.daysOnTarget < 4) {
      insights.push({
        id: generateInsightId(),
        type: 'recommendation',
        priority: 'medium',
        category: 'nutrition',
        title: 'Aumente a proteína',
        description: `Você atingiu a meta de proteína em apenas ${consistency.daysOnTarget}/7 dias. Tente incluir mais fontes proteicas.`,
        icon: '🍗',
        action: {
          type: 'view_nutrition',
          label: 'Ver alimentação',
          href: '/alimentacao',
        },
        createdAt: new Date(),
      })
    }
  }

  // Sugerir distribuição melhor de refeições
  const meals = data.meals || []
  if (meals.length >= 7) {
    const mealsPerDay = meals.length / 7
    if (mealsPerDay < 3) {
      insights.push({
        id: generateInsightId(),
        type: 'optimization',
        priority: 'low',
        category: 'nutrition',
        title: 'Distribua melhor as refeições',
        description:
          'Fazer mais refeições menores pode ajudar na absorção de nutrientes e no controle da fome.',
        icon: '🍽️',
        createdAt: new Date(),
      })
    }
  }

  return insights
}

/**
 * Recomendações de sono
 */
function generateSleepRecommendations(data: UserAnalysisData): Insight[] {
  const insights: Insight[] = []

  const sleepDurations = data.sleepDurations || []
  const sleepQuality = data.sleepQuality || []

  // Sugerir melhorar horário se inconsistente
  if (sleepDurations.length >= 7) {
    const avgSleep = average(sleepDurations)

    // Celebrar bom sono
    if (avgSleep >= 7.5) {
      insights.push({
        id: generateInsightId(),
        type: 'achievement',
        priority: 'low',
        category: 'sleep',
        title: 'Sono excelente! 😴',
        description: `Média de ${avgSleep.toFixed(1)}h de sono esta semana. Continue assim para máxima recuperação!`,
        icon: '⭐',
        createdAt: new Date(),
      })
    } else if (avgSleep >= 6.5 && avgSleep < 7) {
      insights.push({
        id: generateInsightId(),
        type: 'recommendation',
        priority: 'low',
        category: 'sleep',
        title: 'Durma um pouco mais',
        description: `Você está dormindo ${avgSleep.toFixed(1)}h em média. Tente adicionar 30 minutos.`,
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

  // Sugerir melhorar qualidade se baixa
  if (sleepQuality.length >= 7) {
    const avgQuality = average(sleepQuality)

    if (avgQuality < 60) {
      insights.push({
        id: generateInsightId(),
        type: 'recommendation',
        priority: 'medium',
        category: 'sleep',
        title: 'Melhore a qualidade do sono',
        description:
          'Sua qualidade de sono está baixa. Considere: ambiente escuro, temperatura amena, e evitar telas antes de dormir.',
        icon: '💤',
        action: {
          type: 'view_sleep',
          label: 'Ver sono',
          href: '/sono',
        },
        createdAt: new Date(),
      })
    }
  }

  return insights
}

/**
 * Recomendações de composição corporal
 */
function generateBodyRecommendations(data: UserAnalysisData): Insight[] {
  const insights: Insight[] = []

  const bodyComps = data.bodyComps || []

  // Lembrete de bioimpedância
  if (bodyComps.length > 0) {
    const lastMeasurement = new Date(bodyComps[0].date)
    const now = new Date()
    const daysSince = Math.floor(
      (now.getTime() - lastMeasurement.getTime()) / (1000 * 60 * 60 * 24)
    )

    if (daysSince > 30) {
      insights.push({
        id: generateInsightId(),
        type: 'recommendation',
        priority: 'low',
        category: 'body',
        title: 'Hora da bioimpedância? 📊',
        description: `Faz ${daysSince} dias desde sua última medição. Acompanhar regularmente ajuda a ajustar estratégias.`,
        icon: '📊',
        action: {
          type: 'schedule_measurement',
          label: 'Agendar medição',
          href: '/corpo/nova-medicao',
        },
        createdAt: new Date(),
      })
    }
  } else {
    // Sugerir primeira medição
    insights.push({
      id: generateInsightId(),
      type: 'recommendation',
      priority: 'medium',
      category: 'body',
      title: 'Faça sua primeira medição',
      description:
        'Registre suas medidas corporais para acompanhar sua evolução ao longo do tempo.',
      icon: '📏',
      action: {
        type: 'new_measurement',
        label: 'Nova medição',
        href: '/corpo/nova-medicao',
      },
      createdAt: new Date(),
    })
  }

  // Celebrar recomposição corporal
  if (bodyComps.length >= 2) {
    const latest = bodyComps[0]
    const previous = bodyComps[1]

    const muscleChange = latest.musculo - previous.musculo
    const fatChange = latest.gordura - previous.gordura

    if (muscleChange > 0 && fatChange < 0) {
      insights.push({
        id: generateInsightId(),
        type: 'achievement',
        priority: 'high',
        category: 'body',
        title: 'Recomposição corporal perfeita! 🏆',
        description: `Você ganhou ${muscleChange.toFixed(1)}kg de músculo e perdeu ${Math.abs(fatChange).toFixed(1)}% de gordura. Excelente!`,
        icon: '🎯',
        data: { muscleChange, fatChange },
        createdAt: new Date(),
      })
    } else if (muscleChange > 0.5) {
      insights.push({
        id: generateInsightId(),
        type: 'achievement',
        priority: 'medium',
        category: 'body',
        title: 'Ganho muscular! 💪',
        description: `Você ganhou ${muscleChange.toFixed(1)}kg de massa muscular desde a última medição.`,
        icon: '💪',
        createdAt: new Date(),
      })
    }
  }

  return insights
}

/**
 * Recomendações de consistência
 */
function generateConsistencyRecommendations(data: UserAnalysisData): Insight[] {
  const insights: Insight[] = []

  const gamification = data.gamification

  // Streak milestone próximo
  if (gamification) {
    const currentStreak = gamification.streak
    const nextMilestone = getNextStreakMilestone(currentStreak)
    const daysToMilestone = nextMilestone - currentStreak

    if (daysToMilestone <= 3 && daysToMilestone > 0) {
      insights.push({
        id: generateInsightId(),
        type: 'milestone',
        priority: 'medium',
        category: 'consistency',
        title: `${daysToMilestone} dia${daysToMilestone > 1 ? 's' : ''} para streak ${nextMilestone}! 🔥`,
        description: `Você está muito perto do streak de ${nextMilestone} dias. Não pare agora!`,
        icon: '🎯',
        createdAt: new Date(),
      })
    }

    // Celebrar milestones atingidos
    if ([7, 14, 21, 30, 60, 90, 100, 150, 200, 365].includes(currentStreak)) {
      insights.push({
        id: generateInsightId(),
        type: 'achievement',
        priority: 'high',
        category: 'consistency',
        title: `Streak de ${currentStreak} dias! 🏆`,
        description: `Parabéns! Você manteve consistência por ${currentStreak} dias consecutivos.`,
        icon: '🔥',
        createdAt: new Date(),
      })
    }
  }

  // Score diário
  const dailyScores = data.dailyScores || []
  if (dailyScores.length >= 7) {
    const trend = calculateTrend(dailyScores)

    if (trend.direction === 'down' && trend.percentage > 15) {
      insights.push({
        id: generateInsightId(),
        type: 'trend',
        priority: 'medium',
        category: 'consistency',
        title: 'Pontuação em queda 📉',
        description: `Sua pontuação média caiu ${trend.percentage.toFixed(0)}%. Posso ajudar a identificar o problema!`,
        icon: '📊',
        action: {
          type: 'talk_to_coach',
          label: 'Falar com Coach',
          href: '/coach',
        },
        createdAt: new Date(),
      })
    } else if (trend.direction === 'up' && trend.percentage > 10) {
      insights.push({
        id: generateInsightId(),
        type: 'trend',
        priority: 'low',
        category: 'consistency',
        title: 'Pontuação subindo! 📈',
        description: `Sua pontuação média aumentou ${trend.percentage.toFixed(0)}%. Continue assim!`,
        icon: '⭐',
        createdAt: new Date(),
      })
    }
  }

  return insights
}
