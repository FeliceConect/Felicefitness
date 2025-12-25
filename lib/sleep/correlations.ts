// Sleep correlation analysis

import type { SleepLog, FactorImpact, SleepCorrelations } from '@/types/sleep'
import { POSITIVE_FACTORS, NEGATIVE_FACTORS } from '@/types/sleep'

/**
 * Calculate average of an array of numbers
 */
function average(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((a, b) => a + b, 0) / values.length
}

/**
 * Calculate Pearson correlation coefficient
 */
export function pearsonCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length < 3) return 0

  const n = x.length
  const sumX = x.reduce((a, b) => a + b, 0)
  const sumY = y.reduce((a, b) => a + b, 0)
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0)
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0)
  const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0)

  const numerator = n * sumXY - sumX * sumY
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))

  if (denominator === 0) return 0
  return numerator / denominator
}

/**
 * Calculate the impact of a factor on sleep quality
 */
export function calculateFactorImpact(
  logsWithFactor: SleepLog[],
  logsWithoutFactor: SleepLog[]
): number {
  if (logsWithFactor.length < 3 || logsWithoutFactor.length < 3) {
    return 0 // Insufficient data
  }

  const avgWithFactor = average(logsWithFactor.map(l => l.quality))
  const avgWithoutFactor = average(logsWithoutFactor.map(l => l.quality))

  if (avgWithoutFactor === 0) return 0
  return Math.round(((avgWithFactor - avgWithoutFactor) / avgWithoutFactor) * 100)
}

/**
 * Analyze all factors and their impact on sleep
 */
export function analyzeFactorImpacts(logs: SleepLog[]): FactorImpact[] {
  const impacts: FactorImpact[] = []

  // Analyze positive factors
  for (const factor of POSITIVE_FACTORS) {
    const logsWithFactor = logs.filter(l => l.positive_factors.includes(factor.id))
    const logsWithoutFactor = logs.filter(l => !l.positive_factors.includes(factor.id))

    if (logsWithFactor.length >= 3 && logsWithoutFactor.length >= 3) {
      const impact = calculateFactorImpact(logsWithFactor, logsWithoutFactor)
      impacts.push({
        factor: factor.id,
        impact,
        sampleSize: logsWithFactor.length,
        type: 'positive',
      })
    }
  }

  // Analyze negative factors
  for (const factor of NEGATIVE_FACTORS) {
    const logsWithFactor = logs.filter(l => l.negative_factors.includes(factor.id))
    const logsWithoutFactor = logs.filter(l => !l.negative_factors.includes(factor.id))

    if (logsWithFactor.length >= 3 && logsWithoutFactor.length >= 3) {
      const impact = calculateFactorImpact(logsWithFactor, logsWithoutFactor)
      impacts.push({
        factor: factor.id,
        impact,
        sampleSize: logsWithFactor.length,
        type: 'negative',
      })
    }
  }

  // Sort by absolute impact
  return impacts.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
}

/**
 * Find the best bedtime based on sleep quality correlation
 */
export function findBestBedtime(logs: SleepLog[]): string {
  if (logs.length < 7) return '22:00'

  // Group by bedtime hour
  const hourQuality: Record<number, { total: number; count: number }> = {}

  for (const log of logs) {
    const hour = parseInt(log.bedtime.split(':')[0])
    if (!hourQuality[hour]) {
      hourQuality[hour] = { total: 0, count: 0 }
    }
    hourQuality[hour].total += log.quality
    hourQuality[hour].count++
  }

  // Find hour with best average quality
  let bestHour = 22
  let bestAvg = 0

  for (const [hour, data] of Object.entries(hourQuality)) {
    if (data.count >= 3) {
      const avg = data.total / data.count
      if (avg > bestAvg) {
        bestAvg = avg
        bestHour = parseInt(hour)
      }
    }
  }

  return `${bestHour.toString().padStart(2, '0')}:00`
}

/**
 * Find the best wake time based on sleep quality correlation
 */
export function findBestWakeTime(logs: SleepLog[]): string {
  if (logs.length < 7) return '05:00'

  // Group by wake time hour
  const hourQuality: Record<number, { total: number; count: number }> = {}

  for (const log of logs) {
    const hour = parseInt(log.wake_time.split(':')[0])
    if (!hourQuality[hour]) {
      hourQuality[hour] = { total: 0, count: 0 }
    }
    hourQuality[hour].total += log.quality
    hourQuality[hour].count++
  }

  // Find hour with best average quality
  let bestHour = 5
  let bestAvg = 0

  for (const [hour, data] of Object.entries(hourQuality)) {
    if (data.count >= 3) {
      const avg = data.total / data.count
      if (avg > bestAvg) {
        bestAvg = avg
        bestHour = parseInt(hour)
      }
    }
  }

  return `${bestHour.toString().padStart(2, '0')}:00`
}

/**
 * Calculate sleep vs workout performance correlation
 * Requires workout data to be passed in
 */
export function correlateSleepWithWorkout(
  sleepLogs: SleepLog[],
  workoutData: { date: string; performanceScore: number }[]
): number {
  if (sleepLogs.length < 7 || workoutData.length < 7) return 0

  const pairs: { sleepQuality: number; performance: number }[] = []

  for (const workout of workoutData) {
    const workoutDate = new Date(workout.date)
    const previousNight = new Date(workoutDate)
    previousNight.setDate(previousNight.getDate() - 1)
    const previousNightStr = previousNight.toISOString().split('T')[0]

    const sleepLog = sleepLogs.find(s => s.date === previousNightStr)
    if (sleepLog && workout.performanceScore) {
      pairs.push({
        sleepQuality: sleepLog.quality,
        performance: workout.performanceScore,
      })
    }
  }

  if (pairs.length < 5) return 0

  return Math.round(
    pearsonCorrelation(
      pairs.map(p => p.sleepQuality),
      pairs.map(p => p.performance)
    ) * 100
  )
}

/**
 * Generate personalized sleep tips based on data
 */
export function generateSleepTips(
  logs: SleepLog[],
  goalHours: number = 7
): string[] {
  const tips: string[] = []

  if (logs.length < 7) {
    tips.push('Continue registrando seu sono para receber dicas personalizadas')
    return tips
  }

  const goalMinutes = goalHours * 60
  const avgDuration = average(logs.map(l => l.duration))
  const avgQuality = average(logs.map(l => l.quality))

  // Duration tips
  if (avgDuration < goalMinutes - 30) {
    const deficit = Math.round((goalMinutes - avgDuration) / 60 * 10) / 10
    tips.push(`Tente dormir ${deficit}h a mais para atingir sua meta de ${goalHours}h`)
  }

  // Quality tips
  if (avgQuality < 3.5) {
    tips.push('Sua qualidade de sono está baixa. Revise seus hábitos antes de dormir')
  }

  // Factor-based tips
  const factorImpacts = analyzeFactorImpacts(logs)

  const bestPositive = factorImpacts
    .filter(f => f.type === 'positive' && f.impact > 10)
    .slice(0, 2)

  const worstNegative = factorImpacts
    .filter(f => f.type === 'negative' && f.impact < -10)
    .slice(0, 2)

  for (const factor of bestPositive) {
    const factorInfo = POSITIVE_FACTORS.find(f => f.id === factor.factor)
    if (factorInfo) {
      tips.push(`${factorInfo.icon} ${factorInfo.label} melhora seu sono em ${factor.impact}%`)
    }
  }

  for (const factor of worstNegative) {
    const factorInfo = NEGATIVE_FACTORS.find(f => f.id === factor.factor)
    if (factorInfo) {
      tips.push(`Evite ${factorInfo.label.toLowerCase()} - piora seu sono em ${Math.abs(factor.impact)}%`)
    }
  }

  // Consistency tip
  const bestBedtime = findBestBedtime(logs)
  tips.push(`Seu melhor horário para dormir é ${bestBedtime}`)

  return tips.slice(0, 5) // Max 5 tips
}

/**
 * Calculate full sleep correlations
 */
export function calculateSleepCorrelations(
  logs: SleepLog[],
  workoutData?: { date: string; performanceScore: number }[]
): SleepCorrelations {
  const factorImpacts = analyzeFactorImpacts(logs)

  // Calculate late eating impact (heavy_meal factor)
  const lateEatingImpact = factorImpacts.find(f => f.factor === 'heavy_meal')?.impact || 0

  // Calculate caffeine impact (late_coffee factor)
  const caffeineImpact = factorImpacts.find(f => f.factor === 'late_coffee')?.impact || 0

  // Calculate workout correlation
  const sleepVsWorkoutPerformance = workoutData
    ? correlateSleepWithWorkout(logs, workoutData)
    : 0

  // Estimate PR chance based on sleep quality (simplified)
  const goodSleepLogs = logs.filter(l => l.quality >= 4)
  const avgGoodSleep = goodSleepLogs.length > 0
    ? average(goodSleepLogs.map(l => l.quality))
    : 0
  const sleepVsPRChance = Math.round((avgGoodSleep / 5) * 25) // Up to 25% increase

  return {
    factorImpacts,
    sleepVsWorkoutPerformance,
    sleepVsPRChance,
    bestBedtime: findBestBedtime(logs),
    bestWakeTime: findBestWakeTime(logs),
    lateEatingImpact,
    caffeineImpact,
  }
}
