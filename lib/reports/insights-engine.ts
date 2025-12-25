// Motor de Insights - FeliceFit Reports

import type { Insight, AnalyticsData, PeriodSummary } from '@/types/reports'

/**
 * Gera insights baseados nos dados de analytics
 */
export function generateInsights(data: AnalyticsData): Insight[] {
  const insights: Insight[] = []

  // ===== TREINO =====

  // Comparativo com período anterior
  if (data.workouts.previous > 0 && data.workouts.current > data.workouts.previous) {
    const change = ((data.workouts.current - data.workouts.previous) / data.workouts.previous) * 100
    insights.push({
      id: 'workout_increase',
      type: 'positive',
      icon: '💪',
      title: 'Mais treinos!',
      description: `Você treinou ${change.toFixed(0)}% mais que o período anterior`,
      metric: 'workouts',
      value: data.workouts.current,
      change,
      priority: 8
    })
  } else if (data.workouts.previous > 0 && data.workouts.current < data.workouts.previous) {
    const change = ((data.workouts.current - data.workouts.previous) / data.workouts.previous) * 100
    insights.push({
      id: 'workout_decrease',
      type: 'warning',
      icon: '⚠️',
      title: 'Menos treinos',
      description: `${Math.abs(change).toFixed(0)}% menos treinos que o período anterior`,
      metric: 'workouts',
      value: data.workouts.current,
      change,
      priority: 7
    })
  }

  // Taxa de conclusão de treinos
  if (data.workouts.planned > 0) {
    const completionRate = (data.workouts.current / data.workouts.planned) * 100
    if (completionRate === 100) {
      insights.push({
        id: 'workout_perfect',
        type: 'milestone',
        icon: '🏆',
        title: 'Treinos perfeitos!',
        description: 'Você completou todos os treinos planejados!',
        metric: 'workouts',
        value: completionRate,
        priority: 10
      })
    } else if (completionRate >= 80) {
      insights.push({
        id: 'workout_good',
        type: 'positive',
        icon: '✅',
        title: 'Ótima consistência!',
        description: `${completionRate.toFixed(0)}% dos treinos completados`,
        metric: 'workouts',
        value: completionRate,
        priority: 7
      })
    }
  }

  // PRs batidos
  if (data.prs.count > 0 && data.prs.best) {
    insights.push({
      id: 'prs_achieved',
      type: 'positive',
      icon: '🏆',
      title: `${data.prs.count} PR${data.prs.count > 1 ? 's' : ''} batido${data.prs.count > 1 ? 's' : ''}!`,
      description: `Destaque: ${data.prs.best.exercise} com ${data.prs.best.weight}kg`,
      metric: 'prs',
      value: data.prs.count,
      priority: 9
    })
  }

  // Streak alto
  if (data.streak >= 30) {
    insights.push({
      id: 'streak_legendary',
      type: 'milestone',
      icon: '🔥',
      title: `${data.streak} dias de streak!`,
      description: 'Consistência lendária! Continue assim!',
      metric: 'streak',
      value: data.streak,
      priority: 10
    })
  } else if (data.streak >= 14) {
    insights.push({
      id: 'streak_strong',
      type: 'milestone',
      icon: '🔥',
      title: `${data.streak} dias de streak!`,
      description: 'Sua consistência está excelente!',
      metric: 'streak',
      value: data.streak,
      priority: 9
    })
  } else if (data.streak >= 7) {
    insights.push({
      id: 'streak_good',
      type: 'positive',
      icon: '🔥',
      title: `${data.streak} dias de streak!`,
      description: 'Uma semana inteira! Mantenha o ritmo!',
      metric: 'streak',
      value: data.streak,
      priority: 8
    })
  }

  // ===== NUTRIÇÃO =====

  // Proteína consistente
  if (data.nutrition.proteinDaysOnTarget >= 6) {
    insights.push({
      id: 'protein_consistent',
      type: 'positive',
      icon: '🎯',
      title: 'Proteína em dia!',
      description: `Meta atingida em ${data.nutrition.proteinDaysOnTarget}/7 dias`,
      metric: 'protein',
      value: data.nutrition.avgProtein,
      priority: 8
    })
  } else if (data.nutrition.proteinDaysOnTarget <= 3) {
    insights.push({
      id: 'protein_low',
      type: 'warning',
      icon: '⚠️',
      title: 'Proteína abaixo da meta',
      description: `Meta atingida em apenas ${data.nutrition.proteinDaysOnTarget}/7 dias`,
      metric: 'protein',
      value: data.nutrition.avgProtein,
      priority: 7
    })
  }

  // Calorias no target
  if (data.goals.calories > 0) {
    const calorieRatio = data.nutrition.avgCalories / data.goals.calories
    if (calorieRatio >= 0.95 && calorieRatio <= 1.05) {
      insights.push({
        id: 'calories_perfect',
        type: 'positive',
        icon: '🎯',
        title: 'Calorias precisas!',
        description: 'Média dentro de ±5% da meta',
        metric: 'calories',
        value: data.nutrition.avgCalories,
        priority: 7
      })
    }
  }

  // ===== HIDRATAÇÃO =====

  // Melhor período de água
  if (data.water.current > data.water.best && data.water.best > 0) {
    insights.push({
      id: 'water_best',
      type: 'milestone',
      icon: '💧',
      title: 'Recorde de hidratação!',
      description: 'Seu melhor período de consumo de água!',
      metric: 'water',
      value: data.water.current,
      priority: 8
    })
  }

  // Água melhorando
  if (data.water.previous > 0 && data.water.current > data.water.previous * 1.1) {
    const change = ((data.water.current / data.water.previous) - 1) * 100
    insights.push({
      id: 'water_improving',
      type: 'positive',
      icon: '💧',
      title: 'Hidratação melhorando!',
      description: `+${change.toFixed(0)}% vs período anterior`,
      metric: 'water',
      change,
      priority: 6
    })
  } else if (data.water.previous > 0 && data.water.current < data.water.previous * 0.9) {
    insights.push({
      id: 'water_decreasing',
      type: 'warning',
      icon: '💧',
      title: 'Hidratação em queda',
      description: 'Beba mais água para manter a performance',
      metric: 'water',
      value: data.water.current,
      priority: 6
    })
  }

  // ===== CORPO =====

  // Perda de gordura
  if (data.body.fatChange !== null && data.body.fatChange < -0.3) {
    insights.push({
      id: 'fat_loss',
      type: 'positive',
      icon: '🔥',
      title: 'Gordura diminuindo!',
      description: `${Math.abs(data.body.fatChange).toFixed(1)}% a menos de gordura`,
      metric: 'fat',
      change: data.body.fatChange,
      priority: 9
    })
  }

  // Ganho de músculo
  if (data.body.muscleChange !== null && data.body.muscleChange > 0.1) {
    insights.push({
      id: 'muscle_gain',
      type: 'positive',
      icon: '💪',
      title: 'Músculo aumentando!',
      description: `+${data.body.muscleChange.toFixed(1)}kg de massa muscular`,
      metric: 'muscle',
      change: data.body.muscleChange,
      priority: 9
    })
  }

  // Perda de peso (se for objetivo)
  if (data.body.weightChange !== null && data.body.weightChange < -0.3) {
    insights.push({
      id: 'weight_loss',
      type: 'positive',
      icon: '⚖️',
      title: 'Peso diminuindo!',
      description: `${Math.abs(data.body.weightChange).toFixed(1)}kg a menos`,
      metric: 'weight',
      change: data.body.weightChange,
      priority: 7
    })
  }

  // ===== SUGESTÕES =====

  // Sugerir bioimpedância
  if (data.daysSinceLastBioimpedance > 30) {
    insights.push({
      id: 'suggest_bioimpedance',
      type: 'suggestion',
      icon: '📊',
      title: 'Hora da bioimpedância?',
      description: `Faz ${data.daysSinceLastBioimpedance} dias desde a última medição`,
      priority: 5
    })
  }

  // Sugerir foto de progresso
  if (data.daysSinceLastPhoto > 14) {
    insights.push({
      id: 'suggest_photo',
      type: 'suggestion',
      icon: '📷',
      title: 'Registre seu progresso!',
      description: 'Uma foto ajuda a visualizar a evolução',
      priority: 4
    })
  }

  // Ordenar por prioridade
  return insights.sort((a, b) => b.priority - a.priority)
}

/**
 * Gera insights a partir de um resumo de período
 */
export function generateInsightsFromSummary(
  current: PeriodSummary,
  previous: PeriodSummary | null
): Insight[] {
  // Converter para AnalyticsData
  const data: AnalyticsData = {
    workouts: {
      current: current.workouts.completed,
      previous: previous?.workouts.completed || 0,
      planned: current.workouts.planned
    },
    prs: {
      count: current.workouts.prsCount,
      best: null // Seria preenchido com dados reais
    },
    streak: current.gamification.currentStreak,
    nutrition: {
      avgCalories: current.nutrition.avgCalories,
      avgProtein: current.nutrition.avgProtein,
      proteinDaysOnTarget: current.nutrition.daysOnProteinTarget
    },
    water: {
      current: current.hydration.avgDaily,
      previous: previous?.hydration.avgDaily || 0,
      best: 0 // Seria calculado do histórico
    },
    body: {
      weightChange: current.body.weightChange,
      fatChange: current.body.fatChange,
      muscleChange: current.body.muscleChange
    },
    goals: {
      calories: 2500, // Seria do perfil do usuário
      protein: 170,
      water: 3
    },
    daysSinceLastBioimpedance: 0, // Seria calculado
    daysSinceLastPhoto: 0
  }

  return generateInsights(data)
}

/**
 * Filtra insights por tipo
 */
export function filterInsightsByType(
  insights: Insight[],
  types: Insight['type'][]
): Insight[] {
  return insights.filter(i => types.includes(i.type))
}

/**
 * Obtém os top N insights
 */
export function getTopInsights(insights: Insight[], count: number = 5): Insight[] {
  return insights.slice(0, count)
}

/**
 * Agrupa insights por tipo
 */
export function groupInsightsByType(insights: Insight[]): Record<Insight['type'], Insight[]> {
  return {
    positive: insights.filter(i => i.type === 'positive'),
    warning: insights.filter(i => i.type === 'warning'),
    suggestion: insights.filter(i => i.type === 'suggestion'),
    milestone: insights.filter(i => i.type === 'milestone')
  }
}

/**
 * Obtém cor para tipo de insight
 */
export function getInsightColor(type: Insight['type']): string {
  const colors: Record<Insight['type'], string> = {
    positive: 'text-green-500',
    warning: 'text-amber-500',
    suggestion: 'text-blue-500',
    milestone: 'text-violet-500'
  }
  return colors[type]
}

/**
 * Obtém cor de fundo para tipo de insight
 */
export function getInsightBgColor(type: Insight['type']): string {
  const colors: Record<Insight['type'], string> = {
    positive: 'bg-green-500/10',
    warning: 'bg-amber-500/10',
    suggestion: 'bg-blue-500/10',
    milestone: 'bg-violet-500/10'
  }
  return colors[type]
}
