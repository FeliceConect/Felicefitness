// Calculador de Pontuação Diária - FeliceFit Gamification

import type { DailyScoreBreakdown, DayData } from '@/types/gamification'

/**
 * Pesos de cada categoria na pontuação total
 */
export const SCORE_WEIGHTS = {
  workout: 30,      // 0-30 pontos
  nutrition: 30,    // 0-30 pontos
  hydration: 25,    // 0-25 pontos
  extras: 15        // 0-15 pontos
}

/**
 * Calcula pontuação de treino (0-30)
 */
export function calculateWorkoutScore(data: DayData): number {
  // Se não tem treino agendado, dá pontos máximos (dia de descanso)
  if (!data.hasWorkoutScheduled) {
    return SCORE_WEIGHTS.workout
  }

  // Treino completo: 30 pontos
  if (data.workoutCompleted) {
    return SCORE_WEIGHTS.workout
  }

  // Treino parcial: 15 pontos
  if (data.workoutPartial) {
    return Math.floor(SCORE_WEIGHTS.workout / 2)
  }

  // Não treinou: 0 pontos
  return 0
}

/**
 * Calcula pontuação de nutrição (0-30)
 */
export function calculateNutritionScore(data: DayData): number {
  let score = 0
  const maxScore = SCORE_WEIGHTS.nutrition

  // Refeições registradas (15 pontos máx)
  const mealRatio = data.mealsPlanned > 0
    ? data.mealsLogged / data.mealsPlanned
    : 0
  score += Math.floor(mealRatio * 15)

  // Proteína (10 pontos)
  if (data.proteinGoal > 0) {
    const proteinRatio = Math.min(data.proteinConsumed / data.proteinGoal, 1)
    // Dar pontos proporcionais, mas bônus para atingir 100%
    if (proteinRatio >= 1) {
      score += 10
    } else if (proteinRatio >= 0.8) {
      score += 8
    } else {
      score += Math.floor(proteinRatio * 7)
    }
  }

  // Calorias dentro da meta (5 pontos)
  if (data.caloriesGoal > 0) {
    const calorieRatio = data.caloriesConsumed / data.caloriesGoal
    // Entre 90% e 110% é considerado "on target"
    if (calorieRatio >= 0.9 && calorieRatio <= 1.1) {
      score += 5
    } else if (calorieRatio >= 0.8 && calorieRatio <= 1.2) {
      score += 3
    } else if (calorieRatio > 0) {
      score += 1
    }
  }

  return Math.min(score, maxScore)
}

/**
 * Calcula pontuação de hidratação (0-25)
 */
export function calculateHydrationScore(data: DayData): number {
  if (data.waterGoal <= 0) return SCORE_WEIGHTS.hydration

  const ratio = data.waterConsumed / data.waterGoal

  // 100% ou mais: 25 pontos
  if (ratio >= 1) {
    return SCORE_WEIGHTS.hydration
  }

  // 75-99%: 20 pontos
  if (ratio >= 0.75) {
    return 20
  }

  // 50-74%: 15 pontos
  if (ratio >= 0.5) {
    return 15
  }

  // 25-49%: 8 pontos
  if (ratio >= 0.25) {
    return 8
  }

  // < 25%: proporcional até 5 pontos
  return Math.floor(ratio * 20)
}

/**
 * Calcula pontuação de extras (0-15)
 */
export function calculateExtrasScore(data: DayData): number {
  let score = 0

  // Check-in diário (5 pontos)
  if (data.checkinDone) {
    score += 5
  }

  // Sono registrado (5 pontos)
  if (data.sleepLogged) {
    score += 5
  }

  // Revolade no horário (5 pontos)
  if (data.revoladeOnTime) {
    score += 5
  }

  return Math.min(score, SCORE_WEIGHTS.extras)
}

/**
 * Calcula pontuação diária completa
 */
export function calculateDailyScore(data: DayData): DailyScoreBreakdown {
  const workout = calculateWorkoutScore(data)
  const nutrition = calculateNutritionScore(data)
  const hydration = calculateHydrationScore(data)
  const extras = calculateExtrasScore(data)

  return {
    workout,
    nutrition,
    hydration,
    extras,
    total: workout + nutrition + hydration + extras
  }
}

/**
 * Obtém cor baseada na pontuação
 */
export function getScoreColor(score: number): string {
  if (score >= 90) return '#10B981'  // Verde - Excelente
  if (score >= 75) return '#3B82F6'  // Azul - Muito bom
  if (score >= 60) return '#8B5CF6'  // Violeta - Bom
  if (score >= 40) return '#F59E0B'  // Laranja - Regular
  return '#EF4444'                    // Vermelho - Precisa melhorar
}

/**
 * Obtém gradiente baseado na pontuação
 */
export function getScoreGradient(score: number): string {
  if (score >= 90) return 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
  if (score >= 75) return 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)'
  if (score >= 60) return 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)'
  if (score >= 40) return 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
  return 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'
}

/**
 * Obtém mensagem baseada na pontuação
 */
export function getScoreMessage(score: number): string {
  if (score === 100) return 'DIA PERFEITO!'
  if (score >= 90) return 'Dia excelente!'
  if (score >= 75) return 'Muito bem!'
  if (score >= 60) return 'Bom dia!'
  if (score >= 40) return 'Continue tentando!'
  return 'Amanhã será melhor!'
}

/**
 * Obtém emoji baseado na pontuação
 */
export function getScoreEmoji(score: number): string {
  if (score === 100) return '💯'
  if (score >= 90) return '🌟'
  if (score >= 75) return '⭐'
  if (score >= 60) return '👍'
  if (score >= 40) return '💪'
  return '🔥'
}

/**
 * Calcula média de pontuação para um período
 */
export function calculateAverageScore(scores: DailyScoreBreakdown[]): number {
  if (scores.length === 0) return 0

  const sum = scores.reduce((acc, s) => acc + s.total, 0)
  return Math.round(sum / scores.length)
}

/**
 * Calcula média por categoria
 */
export function calculateCategoryAverages(scores: DailyScoreBreakdown[]): Omit<DailyScoreBreakdown, 'total'> & { total: number } {
  if (scores.length === 0) {
    return { workout: 0, nutrition: 0, hydration: 0, extras: 0, total: 0 }
  }

  const sums = scores.reduce(
    (acc, s) => ({
      workout: acc.workout + s.workout,
      nutrition: acc.nutrition + s.nutrition,
      hydration: acc.hydration + s.hydration,
      extras: acc.extras + s.extras
    }),
    { workout: 0, nutrition: 0, hydration: 0, extras: 0 }
  )

  const count = scores.length

  return {
    workout: Math.round(sums.workout / count),
    nutrition: Math.round(sums.nutrition / count),
    hydration: Math.round(sums.hydration / count),
    extras: Math.round(sums.extras / count),
    total: calculateAverageScore(scores)
  }
}

/**
 * Identifica categoria mais fraca
 */
export function getWeakestCategory(breakdown: DailyScoreBreakdown): {
  category: keyof Omit<DailyScoreBreakdown, 'total'>
  percentage: number
  suggestion: string
} {
  const categories = [
    { key: 'workout' as const, score: breakdown.workout, max: SCORE_WEIGHTS.workout },
    { key: 'nutrition' as const, score: breakdown.nutrition, max: SCORE_WEIGHTS.nutrition },
    { key: 'hydration' as const, score: breakdown.hydration, max: SCORE_WEIGHTS.hydration },
    { key: 'extras' as const, score: breakdown.extras, max: SCORE_WEIGHTS.extras }
  ]

  const weakest = categories.reduce((min, cat) => {
    const minRatio = min.score / min.max
    const catRatio = cat.score / cat.max
    return catRatio < minRatio ? cat : min
  })

  const percentage = Math.round((weakest.score / weakest.max) * 100)

  const suggestions: Record<string, string> = {
    workout: 'Complete seu treino do dia para ganhar mais pontos!',
    nutrition: 'Registre suas refeições e atinja as metas de macros!',
    hydration: 'Beba mais água para melhorar sua pontuação!',
    extras: 'Faça o check-in e registre seu sono!'
  }

  return {
    category: weakest.key,
    percentage,
    suggestion: suggestions[weakest.key]
  }
}

/**
 * Verifica se é um dia perfeito
 */
export function isPerfectDay(breakdown: DailyScoreBreakdown): boolean {
  return breakdown.total === 100
}

/**
 * Obtém breakdown inicial (vazio)
 */
export function getEmptyBreakdown(): DailyScoreBreakdown {
  return {
    workout: 0,
    nutrition: 0,
    hydration: 0,
    extras: 0,
    total: 0
  }
}

/**
 * Formata pontuação para exibição
 */
export function formatScore(score: number): string {
  return score.toString().padStart(2, '0')
}

/**
 * Obtém progresso visual para categoria
 */
export function getCategoryProgress(category: keyof Omit<DailyScoreBreakdown, 'total'>, score: number): {
  current: number
  max: number
  percentage: number
  color: string
} {
  const max = SCORE_WEIGHTS[category]
  const percentage = Math.round((score / max) * 100)

  let color = '#EF4444'
  if (percentage >= 90) color = '#10B981'
  else if (percentage >= 70) color = '#3B82F6'
  else if (percentage >= 50) color = '#F59E0B'

  return { current: score, max, percentage, color }
}
