// Share Types

export type ShareType = 'workout' | 'pr' | 'achievement' | 'streak' | 'progress' | 'weekly'

export type ShareFormat = 'square' | 'story' | 'wide'

export type ShareTheme = 'power' | 'light' | 'fire' | 'gradient'

export interface ShareOptions {
  theme?: ShareTheme
  format?: ShareFormat
  includeStats?: boolean
  includeName?: boolean
  includeDate?: boolean
  includeWatermark?: boolean
  customMessage?: string
}

// Web Share API data
export interface WebShareData {
  title: string
  text: string
  url?: string
  files?: File[]
}

// Union type for card data
export type ShareCardData = WorkoutShareData | PRShareData | AchievementShareData | StreakShareData | ProgressShareData | WeeklyShareData

// Card Data Types

export interface WorkoutShareData {
  workoutName: string
  duration: string
  exercises: number
  sets: number
  calories: number
  prs: number
  date: string
  userName?: string
}

export interface PRShareData {
  exercise: string
  weight: number
  previousWeight: number
  improvement: number
  date: string
  userName?: string
}

export interface AchievementShareData {
  name: string
  description: string
  icon: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  date: string
  userName?: string
}

export interface StreakShareData {
  days: number
  record: number
  message: string
  userName?: string
}

export interface ProgressShareData {
  beforePhoto: string
  afterPhoto: string
  daysBetween: number
  stats?: {
    weight?: { before: number; after: number }
    fat?: { before: number; after: number }
    muscle?: { before: number; after: number }
  }
  userName?: string
}

export interface WeeklyShareData {
  weekStart: string
  weekEnd: string
  workoutsCompleted: number
  workoutsPlanned: number
  totalDuration: string
  totalCalories: number
  totalSets: number
  prsSet: number
  highlights?: string[]
  userName?: string
}

// Template Types

export interface CardTemplate {
  id: string
  name: string
  sizes: {
    square: { width: number; height: number }
    story: { width: number; height: number }
    wide: { width: number; height: number }
  }
  elements: string[]
}

export interface ThemeColors {
  background: string
  primary: string
  secondary: string
  text: string
  accent: string
}

// Share History

export interface ShareHistoryItem {
  id: string
  type: ShareType
  data: Record<string, unknown>
  theme: ShareTheme
  format: ShareFormat
  sharedAt: Date
  platform?: string
}

// Share Content

export interface ShareContent {
  type: ShareType
  data: WorkoutShareData | PRShareData | AchievementShareData | StreakShareData | ProgressShareData | WeeklyShareData
  options: ShareOptions
}
