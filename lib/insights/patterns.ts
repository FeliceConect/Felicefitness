import type { TrendAnalysis, MuscleBalance, CorrelationResult } from '@/types/insights'

/**
 * Calcula a tendência de uma série de valores
 */
export function calculateTrend(values: number[]): TrendAnalysis {
  if (values.length < 3) {
    return { direction: 'stable', percentage: 0, confidence: 0 }
  }

  // Dividir em duas metades
  const midpoint = Math.floor(values.length / 2)
  const firstHalf = values.slice(0, midpoint)
  const secondHalf = values.slice(midpoint)

  const firstAvg = average(firstHalf)
  const secondAvg = average(secondHalf)

  if (firstAvg === 0) {
    return { direction: 'stable', percentage: 0, confidence: 0.5 }
  }

  const percentageChange = ((secondAvg - firstAvg) / firstAvg) * 100

  // Calcular confiança baseada na consistência
  const variance = calculateVariance(values)
  const confidence = Math.max(0.3, Math.min(0.95, 1 - variance / (Math.abs(firstAvg) + 1)))

  let direction: 'up' | 'down' | 'stable' = 'stable'
  if (percentageChange > 5) {
    direction = 'up'
  } else if (percentageChange < -5) {
    direction = 'down'
  }

  return {
    direction,
    percentage: Math.abs(percentageChange),
    confidence,
  }
}

/**
 * Calcula a média de um array de números
 */
export function average(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((sum, v) => sum + v, 0) / values.length
}

/**
 * Calcula a variância de um array de números
 */
export function calculateVariance(values: number[]): number {
  if (values.length < 2) return 0
  const avg = average(values)
  const squaredDiffs = values.map((v) => Math.pow(v - avg, 2))
  return average(squaredDiffs)
}

/**
 * Calcula o coeficiente de correlação de Pearson
 */
export function calculateCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length < 3) return 0

  const n = x.length
  const xMean = average(x)
  const yMean = average(y)

  let numerator = 0
  let xDenominator = 0
  let yDenominator = 0

  for (let i = 0; i < n; i++) {
    const xDiff = x[i] - xMean
    const yDiff = y[i] - yMean
    numerator += xDiff * yDiff
    xDenominator += xDiff * xDiff
    yDenominator += yDiff * yDiff
  }

  const denominator = Math.sqrt(xDenominator * yDenominator)
  if (denominator === 0) return 0

  return numerator / denominator
}

/**
 * Interpreta o coeficiente de correlação
 */
export function interpretCorrelation(coefficient: number): string {
  const abs = Math.abs(coefficient)
  const direction = coefficient > 0 ? 'positiva' : 'negativa'

  if (abs < 0.2) return 'correlação muito fraca'
  if (abs < 0.4) return `correlação ${direction} fraca`
  if (abs < 0.6) return `correlação ${direction} moderada`
  if (abs < 0.8) return `correlação ${direction} forte`
  return `correlação ${direction} muito forte`
}

/**
 * Analisa correlações entre várias métricas
 */
export function analyzeCorrelations(data: {
  sleepQuality: number[]
  workoutPerformance: number[]
  mood: number[]
  stress: number[]
  energy: number[]
}): CorrelationResult[] {
  const results: CorrelationResult[] = []

  // Sono vs Treino
  const sleepWorkout = calculateCorrelation(data.sleepQuality, data.workoutPerformance)
  if (Math.abs(sleepWorkout) > 0.3) {
    results.push({
      metric1: 'Qualidade do sono',
      metric2: 'Performance no treino',
      coefficient: sleepWorkout,
      interpretation: interpretCorrelation(sleepWorkout),
    })
  }

  // Sono vs Humor
  const sleepMood = calculateCorrelation(data.sleepQuality, data.mood)
  if (Math.abs(sleepMood) > 0.3) {
    results.push({
      metric1: 'Qualidade do sono',
      metric2: 'Humor',
      coefficient: sleepMood,
      interpretation: interpretCorrelation(sleepMood),
    })
  }

  // Stress vs Energia
  const stressEnergy = calculateCorrelation(data.stress, data.energy)
  if (Math.abs(stressEnergy) > 0.3) {
    results.push({
      metric1: 'Nível de stress',
      metric2: 'Energia',
      coefficient: stressEnergy,
      interpretation: interpretCorrelation(stressEnergy),
    })
  }

  // Treino vs Humor
  const workoutMood = calculateCorrelation(data.workoutPerformance, data.mood)
  if (Math.abs(workoutMood) > 0.3) {
    results.push({
      metric1: 'Treino',
      metric2: 'Humor',
      coefficient: workoutMood,
      interpretation: interpretCorrelation(workoutMood),
    })
  }

  return results
}

/**
 * Analisa o balanceamento muscular baseado nos treinos
 */
export function analyzeMuscleBalance(
  workouts: Array<{ muscleGroups?: string[] }>
): MuscleBalance {
  const muscleCount: Record<string, number> = {}

  workouts.forEach((workout) => {
    if (workout.muscleGroups) {
      workout.muscleGroups.forEach((muscle) => {
        muscleCount[muscle] = (muscleCount[muscle] || 0) + 1
      })
    }
  })

  const entries = Object.entries(muscleCount)
  if (entries.length < 2) {
    return { imbalanced: false, overworked: '', underworked: '', ratio: 1 }
  }

  entries.sort((a, b) => b[1] - a[1])

  const most = entries[0]
  const least = entries[entries.length - 1]

  const ratio = least[1] > 0 ? most[1] / least[1] : most[1]

  return {
    imbalanced: ratio > 2,
    overworked: most[0],
    underworked: least[0],
    ratio,
  }
}

/**
 * Analisa consistência de horário de treino
 */
export function analyzeWorkoutSchedule(
  workouts: Array<{ createdAt: string }>
): number {
  if (workouts.length < 5) return 0

  const hours = workouts.map((w) => new Date(w.createdAt).getHours())
  const hourCounts: Record<number, number> = {}

  hours.forEach((hour) => {
    // Agrupa por período de 2 horas
    const period = Math.floor(hour / 2) * 2
    hourCounts[period] = (hourCounts[period] || 0) + 1
  })

  const mostCommonCount = Math.max(...Object.values(hourCounts))
  return (mostCommonCount / workouts.length) * 100
}

/**
 * Calcula dias desde uma data
 */
export function calculateDaysSince(date: Date | string | undefined): number {
  if (!date) return 999
  const targetDate = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffTime = now.getTime() - targetDate.getTime()
  return Math.floor(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * Calcula consistência de atingimento de meta
 */
export function calculateConsistency(
  actual: number[],
  target: number
): { daysOnTarget: number; period: number; percentage: number } {
  if (actual.length === 0) {
    return { daysOnTarget: 0, period: 0, percentage: 0 }
  }

  const daysOnTarget = actual.filter((v) => v >= target * 0.9).length

  return {
    daysOnTarget,
    period: actual.length,
    percentage: (daysOnTarget / actual.length) * 100,
  }
}

/**
 * Obtém o próximo milestone de streak
 */
export function getNextStreakMilestone(currentStreak: number): number {
  const milestones = [7, 14, 21, 30, 60, 90, 100, 150, 200, 365]
  return milestones.find((m) => m > currentStreak) || currentStreak + 30
}

/**
 * Detecta anomalias em uma série de dados
 */
export function detectAnomalies(
  values: number[],
  threshold: number = 2
): number[] {
  if (values.length < 5) return []

  const mean = average(values)
  const stdDev = Math.sqrt(calculateVariance(values))

  const anomalyIndices: number[] = []

  values.forEach((value, index) => {
    const zScore = Math.abs((value - mean) / stdDev)
    if (zScore > threshold) {
      anomalyIndices.push(index)
    }
  })

  return anomalyIndices
}

/**
 * Identifica o melhor dia da semana para uma métrica
 */
export function findBestDayOfWeek(
  data: Array<{ date: string; value: number }>
): { day: string; average: number } | null {
  if (data.length < 7) return null

  const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
  const dayValues: Record<number, number[]> = {}

  data.forEach((item) => {
    const dayIndex = new Date(item.date).getDay()
    if (!dayValues[dayIndex]) dayValues[dayIndex] = []
    dayValues[dayIndex].push(item.value)
  })

  let bestDay = 0
  let bestAverage = 0

  Object.entries(dayValues).forEach(([day, values]) => {
    const avg = average(values)
    if (avg > bestAverage) {
      bestAverage = avg
      bestDay = parseInt(day)
    }
  })

  return {
    day: dayNames[bestDay],
    average: bestAverage,
  }
}
