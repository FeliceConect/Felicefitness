// Tipos para Sistema de Gamificação

// ========== XP E NÍVEIS ==========

export interface Level {
  level: number
  name: string
  minXP: number
  maxXP: number
  color: string
}

export interface XPEvent {
  id: string
  type: XPEventType
  amount: number
  reason: string
  timestamp: Date
}

export type XPEventType =
  | 'workout_completed'
  | 'workout_all_sets'
  | 'personal_record'
  | 'meal_logged'
  | 'meal_photo_ai'
  | 'all_meals_logged'
  | 'protein_goal_met'
  | 'calories_on_target'
  | 'water_logged'
  | 'water_goal_50'
  | 'water_goal_100'
  | 'weight_logged'
  | 'bioimpedance_logged'
  | 'progress_photo'
  | 'daily_checkin'
  | 'streak_bonus'
  | 'weekly_goal_met'
  | 'first_of_type'
  | 'comeback'
  | 'achievement_unlocked'
  | 'challenge_completed'
  | 'level_up'

// ========== CONQUISTAS ==========

export type AchievementCategory =
  | 'streak'
  | 'workout'
  | 'nutrition'
  | 'hydration'
  | 'body'
  | 'consistency'
  | 'special'

export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'

export interface AchievementCriteria {
  type: string
  value?: number
  time?: string
  meal?: string
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  category: AchievementCategory
  tier: AchievementTier
  xpReward: number
  criteria: AchievementCriteria
  secret?: boolean
}

export interface UserAchievement {
  id: string
  achievementId: string
  unlockedAt: Date
  progress?: number
}

// ========== STREAKS ==========

export interface StreakData {
  currentStreak: number
  bestStreak: number
  lastActivityDate: string | null
  streakHistory: StreakDay[]
}

export interface StreakDay {
  date: string
  completed: boolean
  activities?: string[]
}

// ========== PONTUAÇÃO DIÁRIA ==========

export interface DailyScoreBreakdown {
  workout: number      // 0-30
  nutrition: number    // 0-30
  hydration: number    // 0-25
  extras: number       // 0-15
  total: number        // 0-100
}

export interface DayData {
  date: string
  hasWorkoutScheduled: boolean
  workoutCompleted: boolean
  workoutPartial?: boolean
  mealsLogged: number
  mealsPlanned: number
  proteinConsumed: number
  proteinGoal: number
  caloriesConsumed: number
  caloriesGoal: number
  waterConsumed: number
  waterGoal: number
  checkinDone: boolean
  sleepLogged: boolean
  medicamentoOnTime?: boolean
}

export interface DailyScoreHistory {
  date: string
  score: number
  breakdown: DailyScoreBreakdown
}

// ========== DESAFIOS ==========

export type ChallengeType = 'daily' | 'weekly' | 'special'

export interface ChallengeCriteria {
  type: string
  value?: number
  time?: string
  meal?: string
}

export interface Challenge {
  id: string
  name: string
  description: string
  icon: string
  type: ChallengeType
  xpReward: number
  criteria: ChallengeCriteria
  startDate?: string
  endDate?: string
}

export interface ActiveChallenge extends Challenge {
  progress: number
  target: number
  expiresAt?: Date
  completed: boolean
}

// ========== GAMIFICATION STATE ==========

export interface GamificationState {
  // XP e Nível
  totalXP: number
  currentLevel: number
  levelName: string
  xpToNextLevel: number
  levelProgress: number

  // Streak
  streak: StreakData

  // Conquistas
  unlockedAchievements: UserAchievement[]

  // Pontuação
  todayScore: DailyScoreBreakdown | null
  weeklyAverage: number
  monthlyAverage: number

  // Desafios
  activeChallenges: ActiveChallenge[]

  // Timestamps
  lastUpdated: string
}

// ========== USER STATS ==========

export interface UserStats {
  // Treino
  workoutsCompleted: number
  totalSets: number
  totalReps: number
  prsAchieved: number
  earlyWorkouts: number // antes das 6h

  // Nutrição
  mealsLogged: number
  aiAnalyses: number
  proteinStreakDays: number
  perfectMacroDays: number

  // Hidratação
  waterGoalsMet: number
  waterStreakDays: number
  totalWaterLiters: number

  // Corpo
  bioimpedances: number
  progressPhotos: number
  muscleGained: number
  fatLost: number

  // Consistência
  perfectDays: number // pontuação 100
  perfectDayStreak: number
  checkins: number

  // Especial
  medicamentoStreak: number
}

// ========== HOOK RETURN TYPE ==========

export interface UseGamificationReturn {
  // XP e Nível
  totalXP: number
  currentLevel: Level
  xpToNextLevel: number
  levelProgress: number // 0-100

  // Streak
  streak: StreakData

  // Conquistas
  achievements: Achievement[]
  unlockedAchievements: UserAchievement[]

  // Pontuação
  todayScore: DailyScoreBreakdown | null
  weeklyAverage: number

  // Desafios
  activeChallenges: ActiveChallenge[]

  // Ações
  checkAchievements: () => Promise<Achievement[]> // Retorna novas conquistas
  addXP: (amount: number, reason: string, type?: XPEventType) => Promise<void>
  refreshGamification: () => Promise<void>

  // Estados
  loading: boolean
  showLevelUp: boolean
  newLevel: Level | null
  showAchievement: Achievement | null

  // Dismisses
  dismissLevelUp: () => void
  dismissAchievement: () => void
}
