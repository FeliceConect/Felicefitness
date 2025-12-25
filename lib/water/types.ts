// Tipos para o módulo de água e hidratação

export interface WaterLog {
  id: string
  user_id: string
  data: string // YYYY-MM-DD
  horario: string // timestamp
  quantidade_ml: number
  created_at: string
}

export interface WaterDayTotal {
  date: string
  total: number
}

export interface WaterStats {
  // Semana
  weeklyAverage: number
  weeklyTotal: number
  daysMetGoal: number
  weeklyData: WaterDayTotal[]

  // Mês
  monthlyAverage: number
  monthlyTotal: number
  monthlyDaysMetGoal: number
  bestDay: { date: string; amount: number } | null

  // Streaks
  currentStreak: number
  bestStreak: number
}

export interface WaterGoalSettings {
  goal_ml: number
  quick_add_amounts: number[]
}

export interface WaterReminderSettings {
  enabled: boolean
  interval_hours: number
  start_time: string // "06:00"
  end_time: string // "22:00"
  skip_if_goal_met: boolean
}

export const DEFAULT_WATER_GOAL = 3000 // ml
export const DEFAULT_QUICK_ADD_AMOUNTS = [200, 300, 500]

export const WATER_PRESETS = [150, 200, 250, 300, 400, 500, 600, 750, 1000]
