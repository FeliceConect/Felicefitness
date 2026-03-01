// Wellness module types

// Mood levels
export interface MoodLevel {
  value: number
  emoji: string
  label: string
  color: string
  description: string
}

// Stress levels
export interface StressLevel {
  value: number
  label: string
  color: string
}

// Energy levels
export interface EnergyLevel {
  value: number
  emoji: string
  label: string
}

// Mood factors
export interface MoodFactor {
  id: string
  label: string
  icon: string
}

// Wellness check-in input
export interface WellnessCheckinInput {
  mood: number
  stress: number
  energy: number
  positiveFactors: string[]
  negativeFactors: string[]
  notes?: string
}

// Wellness check-in (from database)
export interface WellnessCheckin {
  id: string
  userId: string
  data: string
  horario?: string
  humor: number
  stress: number
  energia: number
  fatoresPositivos: string[]
  fatoresNegativos: string[]
  notas?: string
  createdAt: string
}

// Wellness score components
export interface WellnessScoreComponents {
  mood: number
  stress: number
  energy: number
  sleep: number
}

// Wellness correlations
export interface WellnessCorrelations {
  workoutVsMood: number
  sleepVsStress: number
  workoutVsEnergy: number
  morningWorkoutVsMood: number
}

// Wellness patterns
export interface WellnessPatterns {
  bestDays: { day: string; avgMood: number }[]
  worstDays: { day: string; avgMood: number }[]
  bestTimeOfDay: string
}

// Wellness tip
export interface WellnessTip {
  id: string
  text: string
  category: 'mood' | 'stress' | 'energy' | 'sleep' | 'general'
  icon: string
}

// Mood trend
export type MoodTrend = 'up' | 'down' | 'stable'

// Week mood data
export interface WeekMoodData {
  date: string
  mood: number | null
}
