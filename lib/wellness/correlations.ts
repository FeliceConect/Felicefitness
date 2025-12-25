// Wellness correlations and analytics

import type { WellnessCheckin, WellnessCorrelations, WellnessPatterns } from '@/types/wellness'

// Calculate Pearson correlation coefficient
function calculateCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length < 3) return 0

  const n = x.length
  const sumX = x.reduce((a, b) => a + b, 0)
  const sumY = y.reduce((a, b) => a + b, 0)
  const sumXY = x.reduce((total, xi, i) => total + xi * y[i], 0)
  const sumX2 = x.reduce((total, xi) => total + xi * xi, 0)
  const sumY2 = y.reduce((total, yi) => total + yi * yi, 0)

  const numerator = n * sumXY - sumX * sumY
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))

  if (denominator === 0) return 0
  return numerator / denominator
}

// Calculate average for array
function average(arr: number[]): number {
  if (arr.length === 0) return 0
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

// Get day of week name in Portuguese
function getDayName(date: Date): string {
  const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
  return days[date.getDay()]
}

export interface CorrelationData {
  checkins: WellnessCheckin[]
  workouts: { date: string; morning: boolean }[]
  sleepLogs: { date: string; quality: number }[]
}

export function calculateWellnessCorrelations(data: CorrelationData): WellnessCorrelations {
  const { checkins, workouts, sleepLogs } = data

  // Create date-indexed maps
  const workoutDates = new Set(workouts.map((w) => w.date))
  const morningWorkoutDates = new Set(workouts.filter((w) => w.morning).map((w) => w.date))
  const sleepMap = new Map(sleepLogs.map((s) => [s.date, s.quality]))

  // Arrays for correlation calculation
  const moodsWithWorkout: number[] = []
  const moodsWithoutWorkout: number[] = []
  const stressWithSleep: [number, number][] = []
  const energyWithWorkout: [number, number][] = []
  const moodAfterMorningWorkout: number[] = []
  const moodWithoutMorningWorkout: number[] = []

  checkins.forEach((checkin) => {
    const date = checkin.data
    const previousDate = new Date(date)
    previousDate.setDate(previousDate.getDate() - 1)
    const prevDateStr = previousDate.toISOString().split('T')[0]

    // Workout vs Mood
    if (workoutDates.has(date)) {
      moodsWithWorkout.push(checkin.humor)
    } else {
      moodsWithoutWorkout.push(checkin.humor)
    }

    // Sleep vs Stress (previous night's sleep affects today's stress)
    const sleepQuality = sleepMap.get(prevDateStr)
    if (sleepQuality !== undefined) {
      stressWithSleep.push([sleepQuality, checkin.stress])
    }

    // Workout vs Energy
    if (workoutDates.has(date)) {
      energyWithWorkout.push([1, checkin.energia])
    } else {
      energyWithWorkout.push([0, checkin.energia])
    }

    // Morning workout vs Mood
    if (morningWorkoutDates.has(date)) {
      moodAfterMorningWorkout.push(checkin.humor)
    } else {
      moodWithoutMorningWorkout.push(checkin.humor)
    }
  })

  // Calculate correlations
  const workoutVsMood =
    moodsWithWorkout.length > 0 && moodsWithoutWorkout.length > 0
      ? (average(moodsWithWorkout) - average(moodsWithoutWorkout)) / 5
      : 0

  const sleepVsStress =
    stressWithSleep.length >= 3
      ? -calculateCorrelation(
          stressWithSleep.map((s) => s[0]),
          stressWithSleep.map((s) => s[1])
        )
      : 0

  const workoutVsEnergy =
    energyWithWorkout.length >= 3
      ? calculateCorrelation(
          energyWithWorkout.map((e) => e[0]),
          energyWithWorkout.map((e) => e[1])
        )
      : 0

  const morningWorkoutVsMood =
    moodAfterMorningWorkout.length > 0 && moodWithoutMorningWorkout.length > 0
      ? (average(moodAfterMorningWorkout) - average(moodWithoutMorningWorkout)) / 5
      : 0

  return {
    workoutVsMood: Math.max(-1, Math.min(1, workoutVsMood)),
    sleepVsStress: Math.max(-1, Math.min(1, sleepVsStress)),
    workoutVsEnergy: Math.max(-1, Math.min(1, workoutVsEnergy)),
    morningWorkoutVsMood: Math.max(-1, Math.min(1, morningWorkoutVsMood)),
  }
}

export function calculateWellnessPatterns(checkins: WellnessCheckin[]): WellnessPatterns {
  // Group moods by day of week
  const moodsByDay: Record<string, number[]> = {
    Domingo: [],
    Segunda: [],
    Terça: [],
    Quarta: [],
    Quinta: [],
    Sexta: [],
    Sábado: [],
  }

  // Group moods by time of day
  const moodsByTime: Record<string, number[]> = {
    morning: [],
    afternoon: [],
    evening: [],
  }

  checkins.forEach((checkin) => {
    const date = new Date(checkin.data)
    const dayName = getDayName(date)
    moodsByDay[dayName].push(checkin.humor)

    if (checkin.horario) {
      const hour = parseInt(checkin.horario.split(':')[0])
      if (hour < 12) {
        moodsByTime.morning.push(checkin.humor)
      } else if (hour < 18) {
        moodsByTime.afternoon.push(checkin.humor)
      } else {
        moodsByTime.evening.push(checkin.humor)
      }
    }
  })

  // Calculate averages
  const dayAverages = Object.entries(moodsByDay)
    .map(([day, moods]) => ({
      day,
      avgMood: moods.length > 0 ? average(moods) : 0,
    }))
    .filter((d) => d.avgMood > 0)
    .sort((a, b) => b.avgMood - a.avgMood)

  // Best and worst days
  const bestDays = dayAverages.slice(0, 2)
  const worstDays = dayAverages.slice(-2).reverse()

  // Best time of day
  const timeAverages = Object.entries(moodsByTime)
    .map(([time, moods]) => ({
      time,
      avgMood: moods.length > 0 ? average(moods) : 0,
    }))
    .filter((t) => t.avgMood > 0)
    .sort((a, b) => b.avgMood - a.avgMood)

  const timeLabels: Record<string, string> = {
    morning: 'Manhã',
    afternoon: 'Tarde',
    evening: 'Noite',
  }

  return {
    bestDays,
    worstDays,
    bestTimeOfDay: timeLabels[timeAverages[0]?.time || 'morning'] || 'Manhã',
  }
}

export function calculateWellnessScore(components: {
  mood: number
  stress: number
  energy: number
  sleep: number
}): number {
  const { mood, stress, energy, sleep } = components

  // Normalize all to 0-100
  const moodScore = ((mood - 1) / 4) * 100
  const stressScore = ((5 - stress) / 4) * 100 // Inverted - lower stress is better
  const energyScore = ((energy - 1) / 4) * 100
  const sleepScore = sleep // Already 0-100

  // Weighted average
  const weights = {
    mood: 0.3,
    stress: 0.25,
    energy: 0.2,
    sleep: 0.25,
  }

  return Math.round(
    moodScore * weights.mood +
      stressScore * weights.stress +
      energyScore * weights.energy +
      sleepScore * weights.sleep
  )
}
