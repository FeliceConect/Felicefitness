// Sleep calculations and utilities

import type { SleepLog, DailyCheckin, TrainingRecommendation, RecoveryComponents } from '@/types/sleep'

/**
 * Calculate sleep duration in minutes from bedtime and wake time
 */
export function calculateSleepDuration(bedtime: string, wakeTime: string): number {
  const [bedHour, bedMin] = bedtime.split(':').map(Number)
  const [wakeHour, wakeMin] = wakeTime.split(':').map(Number)

  const bedMinutes = bedHour * 60 + bedMin
  let wakeMinutes = wakeHour * 60 + wakeMin

  // If wake time is before bedtime, it means we crossed midnight
  if (wakeMinutes < bedMinutes) {
    wakeMinutes += 24 * 60
  }

  return wakeMinutes - bedMinutes
}

/**
 * Format minutes to hours and minutes string
 */
export function formatSleepDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}h ${mins.toString().padStart(2, '0')}min`
}

/**
 * Format minutes to short format (e.g., "7h12")
 */
export function formatSleepDurationShort(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}h${mins.toString().padStart(2, '0')}`
}

/**
 * Convert time string (HH:MM) to minutes from midnight
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

/**
 * Convert minutes from midnight to time string (HH:MM)
 */
export function minutesToTime(minutes: number): string {
  const normalizedMinutes = ((minutes % (24 * 60)) + 24 * 60) % (24 * 60)
  const hours = Math.floor(normalizedMinutes / 60)
  const mins = normalizedMinutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

/**
 * Calculate average time from array of time strings
 */
export function calculateAverageTime(times: string[]): string {
  if (times.length === 0) return '00:00'

  // Convert all times to minutes, handling crossing midnight
  const minutesArray = times.map(time => {
    const mins = timeToMinutes(time)
    // Assume times after 6 PM are evening (before midnight)
    // and times before 6 AM are morning (after midnight)
    // This helps with averaging bedtimes that cross midnight
    return mins < 6 * 60 ? mins + 24 * 60 : mins
  })

  const avgMinutes = Math.round(minutesArray.reduce((a, b) => a + b, 0) / minutesArray.length)
  return minutesToTime(avgMinutes)
}

/**
 * Calculate standard deviation of an array of numbers
 */
export function standardDeviation(values: number[]): number {
  if (values.length === 0) return 0

  const avg = values.reduce((a, b) => a + b, 0) / values.length
  const squareDiffs = values.map(value => Math.pow(value - avg, 2))
  const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / values.length
  return Math.sqrt(avgSquareDiff)
}

/**
 * Calculate schedule consistency score (0-100)
 * Lower standard deviation = higher consistency
 */
export function calculateScheduleConsistency(logs: SleepLog[]): number {
  if (logs.length < 3) return 0

  const bedtimes = logs.map(l => {
    const mins = timeToMinutes(l.bedtime)
    // Handle crossing midnight
    return mins < 6 * 60 ? mins + 24 * 60 : mins
  })

  const wakeTimes = logs.map(l => timeToMinutes(l.wake_time))

  const bedtimeStdDev = standardDeviation(bedtimes)
  const wakeTimeStdDev = standardDeviation(wakeTimes)

  // 30 min std dev = 100% consistency, 120+ min = 0%
  const bedtimeConsistency = Math.max(0, Math.min(100, 100 - ((bedtimeStdDev - 30) / 0.9)))
  const wakeTimeConsistency = Math.max(0, Math.min(100, 100 - ((wakeTimeStdDev - 30) / 0.9)))

  return Math.round((bedtimeConsistency + wakeTimeConsistency) / 2)
}

/**
 * Calculate recovery score based on multiple factors
 */
export function calculateRecoveryScore(data: {
  sleepDuration: number
  sleepQuality: number
  energyLevel: number
  stressLevel: number
  sorenessLevel: number
  sleepGoal: number
}): number {
  const {
    sleepDuration,
    sleepQuality,
    energyLevel,
    stressLevel,
    sorenessLevel,
    sleepGoal,
  } = data

  // Sleep (35%)
  const sleepDurationScore = Math.min(sleepDuration / (sleepGoal * 60), 1.1) * 100
  const sleepQualityScore = (sleepQuality / 5) * 100
  const sleepScore = (sleepDurationScore * 0.6 + sleepQualityScore * 0.4) * 0.35

  // Energy (25%)
  const energyScore = (energyLevel / 5) * 100 * 0.25

  // Stress inverted (20%)
  const stressScore = ((6 - stressLevel) / 5) * 100 * 0.20

  // Soreness inverted (20%)
  const sorenessScore = ((6 - sorenessLevel) / 5) * 100 * 0.20

  return Math.round(sleepScore + energyScore + stressScore + sorenessScore)
}

/**
 * Calculate recovery components breakdown
 */
export function calculateRecoveryComponents(
  sleepLog: SleepLog | null,
  checkin: DailyCheckin | null,
  sleepGoal: number = 7
): RecoveryComponents {
  const sleepDurationScore = sleepLog
    ? Math.min((sleepLog.duration / (sleepGoal * 60)) * 100, 100)
    : 0
  const sleepQualityScore = sleepLog ? (sleepLog.quality / 5) * 100 : 0
  const sleepComponent = sleepLog
    ? Math.round((sleepDurationScore * 0.6 + sleepQualityScore * 0.4))
    : 0

  const energyComponent = checkin ? (checkin.energy_level / 5) * 100 : 0
  const stressComponent = checkin ? ((6 - checkin.stress_level) / 5) * 100 : 0

  // Calculate soreness from areas
  let sorenessComponent = 100
  if (checkin && checkin.soreness_areas.length > 0) {
    const totalIntensity = checkin.soreness_areas.reduce((sum, area) => sum + area.intensity, 0)
    const maxPossibleIntensity = checkin.soreness_areas.length * 3
    sorenessComponent = Math.round(100 - (totalIntensity / maxPossibleIntensity) * 100)
  }

  return {
    sleep: Math.round(sleepComponent),
    energy: Math.round(energyComponent),
    stress: Math.round(stressComponent),
    soreness: sorenessComponent,
  }
}

/**
 * Get training recommendation based on recovery score
 */
export function getTrainingRecommendation(recoveryScore: number): TrainingRecommendation {
  if (recoveryScore < 40) {
    return {
      intensity: 'rest',
      trainingReady: false,
      message: 'Considere um dia de descanso ou recuperação ativa',
      notes: [
        'Priorize o descanso',
        'Faça alongamentos leves',
        'Hidrate-se bem',
        'Durma mais cedo hoje',
      ],
    }
  }

  if (recoveryScore < 60) {
    return {
      intensity: 'light',
      trainingReady: true,
      message: 'Treino leve recomendado, reduza volume e intensidade',
      notes: [
        'Reduza a carga em 20-30%',
        'Foque em técnica',
        'Evite exercícios de alta intensidade',
        'Ouça seu corpo',
      ],
    }
  }

  if (recoveryScore < 80) {
    return {
      intensity: 'normal',
      trainingReady: true,
      message: 'Treino normal liberado',
      notes: [
        'Siga seu programa normalmente',
        'Mantenha boa hidratação',
        'Não exagere além do planejado',
      ],
    }
  }

  return {
    intensity: 'hard',
    trainingReady: true,
    message: 'Excelente recuperação! Pode aumentar intensidade',
    notes: [
      'Dia ideal para progressão de carga',
      'Tente bater PRs',
      'Aproveite a energia extra',
      'Lembre-se de se alimentar bem após o treino',
    ],
  }
}

/**
 * Get recovery score color based on value
 */
export function getRecoveryScoreColor(score: number): string {
  if (score < 40) return 'text-red-500'
  if (score < 60) return 'text-orange-500'
  if (score < 80) return 'text-yellow-500'
  return 'text-green-500'
}

/**
 * Get recovery score background color based on value
 */
export function getRecoveryScoreBgColor(score: number): string {
  if (score < 40) return 'bg-red-500'
  if (score < 60) return 'bg-orange-500'
  if (score < 80) return 'bg-yellow-500'
  return 'bg-green-500'
}

/**
 * Get recovery status label
 */
export function getRecoveryStatusLabel(score: number): string {
  if (score < 40) return 'Baixa Recuperação'
  if (score < 60) return 'Recuperação Moderada'
  if (score < 80) return 'Boa Recuperação'
  return 'Excelente Recuperação'
}

/**
 * Check if date is weekday
 */
export function isWeekday(date: Date): boolean {
  const day = date.getDay()
  return day !== 0 && day !== 6
}

/**
 * Calculate difference from sleep goal
 */
export function calculateSleepGoalDiff(duration: number, goalHours: number): {
  diff: number
  onGoal: boolean
  label: string
} {
  const goalMinutes = goalHours * 60
  const diff = duration - goalMinutes
  const onGoal = diff >= -15 // Within 15 minutes of goal

  let label: string
  if (diff >= 0) {
    label = `+${formatSleepDurationShort(diff)}`
  } else {
    label = `-${formatSleepDurationShort(Math.abs(diff))}`
  }

  return { diff, onGoal, label }
}

/**
 * Get quality star display
 */
export function getQualityStars(quality: number): string {
  return '⭐'.repeat(quality) + '☆'.repeat(5 - quality)
}

/**
 * Parse date string to formatted display
 */
export function formatSleepDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00')
  const today = new Date()
  today.setHours(12, 0, 0, 0)

  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.toDateString() === today.toDateString()) {
    return 'Hoje'
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Ontem'
  }

  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  }
  return date.toLocaleDateString('pt-BR', options)
}

/**
 * Get day of week in Portuguese
 */
export function getDayOfWeekPt(date: Date): string {
  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  return days[date.getDay()]
}

/**
 * Calculate weekly sleep stats
 */
export function calculateWeeklyStats(logs: SleepLog[], goalHours: number = 7): {
  avgDuration: number
  avgQuality: number
  daysOnGoal: number
  totalDays: number
} {
  if (logs.length === 0) {
    return { avgDuration: 0, avgQuality: 0, daysOnGoal: 0, totalDays: 0 }
  }

  const goalMinutes = goalHours * 60
  const daysOnGoal = logs.filter(l => l.duration >= goalMinutes - 15).length

  return {
    avgDuration: Math.round(logs.reduce((sum, l) => sum + l.duration, 0) / logs.length),
    avgQuality: Math.round((logs.reduce((sum, l) => sum + l.quality, 0) / logs.length) * 10) / 10,
    daysOnGoal,
    totalDays: logs.length,
  }
}
