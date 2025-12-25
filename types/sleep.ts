// Types for Sleep and Recovery module

// ===== Sleep Types =====

export interface SleepLog {
  id: string
  user_id: string
  date: string // YYYY-MM-DD
  bedtime: string // HH:MM
  wake_time: string // HH:MM
  duration: number // minutes
  quality: number // 1-5
  times_woken: number
  wake_feeling: number // 1-5
  positive_factors: string[]
  negative_factors: string[]
  notes?: string
  created_at: string
  updated_at: string
}

export interface NewSleepLog {
  date: string
  bedtime: string
  wake_time: string
  quality: number
  times_woken: number
  wake_feeling: number
  positive_factors: string[]
  negative_factors: string[]
  notes?: string
}

export interface SleepStats {
  averageDuration: number // minutes
  averageQuality: number // 1-5
  daysOnGoal: number
  totalDays: number
  bestNight: SleepLog | null
  worstNight: SleepLog | null
  consistencyScore: number // 0-100
}

export interface SleepPatterns {
  avgBedtime: string
  avgWakeTime: string
  weekdayAvg: {
    duration: number
    quality: number
    bedtime: string
    wakeTime: string
  }
  weekendAvg: {
    duration: number
    quality: number
    bedtime: string
    wakeTime: string
  }
}

// ===== Recovery Types =====

export interface DailyCheckin {
  id: string
  user_id: string
  date: string // YYYY-MM-DD
  energy_level: number // 1-5
  mood: number // 1-5
  stress_level: number // 1-5
  soreness_areas: SorenessArea[]
  training_readiness: number // 1-5
  recovery_score: number // 0-100
  notes?: string
  created_at: string
}

export interface NewDailyCheckin {
  date: string
  energy_level: number
  mood: number
  stress_level: number
  soreness_areas: SorenessArea[]
  training_readiness: number
  notes?: string
}

export interface SorenessArea {
  area: string
  intensity: number // 1-3 (leve, moderado, forte)
}

export interface RecoveryComponents {
  sleep: number // 0-100
  energy: number // 0-100
  stress: number // 0-100
  soreness: number // 0-100
}

export interface TrainingRecommendation {
  intensity: 'rest' | 'light' | 'normal' | 'hard'
  trainingReady: boolean
  message: string
  notes: string[]
}

// ===== Correlation Types =====

export interface SleepCorrelations {
  factorImpacts: FactorImpact[]
  sleepVsWorkoutPerformance: number
  sleepVsPRChance: number
  bestBedtime: string
  bestWakeTime: string
  lateEatingImpact: number
  caffeineImpact: number
}

export interface FactorImpact {
  factor: string
  impact: number // -100 to +100
  sampleSize: number
  type: 'positive' | 'negative'
}

// ===== Factor Constants =====

export interface SleepFactor {
  id: string
  label: string
  icon: string
}

export const POSITIVE_FACTORS: SleepFactor[] = [
  { id: 'workout', label: 'Treino', icon: '🏋️' },
  { id: 'no_screen', label: 'Sem tela', icon: '📵' },
  { id: 'meditation', label: 'Meditação', icon: '🧘' },
  { id: 'warm_bath', label: 'Banho quente', icon: '🛁' },
  { id: 'reading', label: 'Leitura', icon: '📖' },
  { id: 'dark_room', label: 'Quarto escuro', icon: '🌙' },
  { id: 'cool_room', label: 'Quarto fresco', icon: '❄️' },
  { id: 'routine', label: 'Rotina', icon: '⏰' },
  { id: 'magnesium', label: 'Magnésio', icon: '💊' },
  { id: 'stretching', label: 'Alongamento', icon: '🤸' },
]

export const NEGATIVE_FACTORS: SleepFactor[] = [
  { id: 'late_coffee', label: 'Café tarde', icon: '☕' },
  { id: 'stress', label: 'Stress', icon: '😰' },
  { id: 'screen_night', label: 'Tela à noite', icon: '📱' },
  { id: 'alcohol', label: 'Álcool', icon: '🍷' },
  { id: 'heavy_meal', label: 'Refeição pesada', icon: '🍝' },
  { id: 'noise', label: 'Barulho', icon: '🔊' },
  { id: 'worry', label: 'Preocupação', icon: '💭' },
  { id: 'pain', label: 'Dor', icon: '🤕' },
  { id: 'hot_room', label: 'Quarto quente', icon: '🥵' },
  { id: 'irregular_schedule', label: 'Horário irregular', icon: '⏰' },
]

// ===== Body Areas for Soreness Map =====

export interface BodyArea {
  id: string
  label: string
  x: number
  y: number
  width: number
  height: number
}

export const BODY_AREAS_FRONT: BodyArea[] = [
  { id: 'neck', label: 'Pescoço', x: 45, y: 12, width: 10, height: 5 },
  { id: 'shoulders', label: 'Ombros', x: 30, y: 18, width: 40, height: 8 },
  { id: 'chest', label: 'Peito', x: 35, y: 26, width: 30, height: 12 },
  { id: 'biceps_l', label: 'Bíceps E', x: 20, y: 28, width: 10, height: 12 },
  { id: 'biceps_r', label: 'Bíceps D', x: 70, y: 28, width: 10, height: 12 },
  { id: 'forearms_l', label: 'Antebraço E', x: 15, y: 42, width: 8, height: 12 },
  { id: 'forearms_r', label: 'Antebraço D', x: 77, y: 42, width: 8, height: 12 },
  { id: 'abs', label: 'Abdômen', x: 40, y: 38, width: 20, height: 15 },
  { id: 'quads_l', label: 'Quadríceps E', x: 35, y: 55, width: 12, height: 18 },
  { id: 'quads_r', label: 'Quadríceps D', x: 53, y: 55, width: 12, height: 18 },
  { id: 'calves_l', label: 'Panturrilha E', x: 35, y: 78, width: 10, height: 15 },
  { id: 'calves_r', label: 'Panturrilha D', x: 55, y: 78, width: 10, height: 15 },
]

export const BODY_AREAS_BACK: BodyArea[] = [
  { id: 'upper_back', label: 'Costas Superior', x: 35, y: 20, width: 30, height: 12 },
  { id: 'lower_back', label: 'Lombar', x: 38, y: 35, width: 24, height: 12 },
  { id: 'triceps_l', label: 'Tríceps E', x: 20, y: 28, width: 10, height: 12 },
  { id: 'triceps_r', label: 'Tríceps D', x: 70, y: 28, width: 10, height: 12 },
  { id: 'glutes', label: 'Glúteos', x: 38, y: 48, width: 24, height: 10 },
  { id: 'hamstrings_l', label: 'Posterior E', x: 35, y: 60, width: 12, height: 15 },
  { id: 'hamstrings_r', label: 'Posterior D', x: 53, y: 60, width: 12, height: 15 },
]

// ===== Quality and Feeling Labels =====

export const QUALITY_LABELS = [
  { value: 1, emoji: '😫', label: 'Péssimo', description: 'Mal conseguiu dormir' },
  { value: 2, emoji: '😕', label: 'Ruim', description: 'Sono agitado' },
  { value: 3, emoji: '😐', label: 'Regular', description: 'Poderia ser melhor' },
  { value: 4, emoji: '🙂', label: 'Bom', description: 'Dormiu bem' },
  { value: 5, emoji: '😴', label: 'Excelente', description: 'Sono perfeito' },
]

export const WAKE_FEELING_LABELS = [
  { value: 1, emoji: '😫', label: 'Cansado', description: 'Muito cansado' },
  { value: 2, emoji: '😕', label: 'Meio grogue', description: 'Ainda sonolento' },
  { value: 3, emoji: '😐', label: 'Normal', description: 'Ok' },
  { value: 4, emoji: '🙂', label: 'Bem', description: 'Bem descansado' },
  { value: 5, emoji: '😃', label: 'Ótimo', description: 'Cheio de energia' },
]

export const ENERGY_LABELS = [
  { value: 1, emoji: '🔋', label: 'Muito baixa', color: 'text-red-500' },
  { value: 2, emoji: '🔋', label: 'Baixa', color: 'text-orange-500' },
  { value: 3, emoji: '🔋', label: 'Moderada', color: 'text-yellow-500' },
  { value: 4, emoji: '🔋', label: 'Boa', color: 'text-lime-500' },
  { value: 5, emoji: '🔋', label: 'Alta', color: 'text-green-500' },
]

export const MOOD_LABELS = [
  { value: 1, emoji: '😤', label: 'Irritado' },
  { value: 2, emoji: '😕', label: 'Desanimado' },
  { value: 3, emoji: '😐', label: 'Neutro' },
  { value: 4, emoji: '🙂', label: 'Bom' },
  { value: 5, emoji: '😄', label: 'Ótimo' },
]

export const STRESS_LABELS = [
  { value: 1, label: 'Muito baixo' },
  { value: 2, label: 'Baixo' },
  { value: 3, label: 'Moderado' },
  { value: 4, label: 'Alto' },
  { value: 5, label: 'Muito alto' },
]

export const SORENESS_INTENSITY_LABELS = [
  { value: 1, label: 'Leve', color: 'bg-yellow-500' },
  { value: 2, label: 'Moderado', color: 'bg-orange-500' },
  { value: 3, label: 'Forte', color: 'bg-red-500' },
]

export const READINESS_LABELS = [
  { value: 1, label: 'Não estou pronto', recommendation: 'Descanse hoje' },
  { value: 2, label: 'Pouco pronto', recommendation: 'Treino leve' },
  { value: 3, label: 'Moderado', recommendation: 'Treino normal' },
  { value: 4, label: 'Pronto', recommendation: 'Pode pegar pesado' },
  { value: 5, label: 'Muito pronto', recommendation: 'Dia de PR!' },
]

// ===== Hook Return Types =====

export interface UseSleepReturn {
  lastSleep: SleepLog | null
  sleepLogs: SleepLog[]
  stats: SleepStats | null
  patterns: SleepPatterns | null
  loading: boolean
  error: Error | null
  logSleep: (data: NewSleepLog) => Promise<void>
  updateSleep: (id: string, data: Partial<SleepLog>) => Promise<void>
  deleteSleep: (id: string) => Promise<void>
  refresh: () => Promise<void>
}

export interface UseRecoveryReturn {
  todayScore: number | null
  todayCheckin: DailyCheckin | null
  history: DailyCheckin[]
  weeklyAverage: number
  components: RecoveryComponents | null
  recommendation: TrainingRecommendation | null
  loading: boolean
  error: Error | null
  submitCheckin: (data: NewDailyCheckin) => Promise<void>
  refresh: () => Promise<void>
}

export interface UseSleepCorrelationsReturn {
  correlations: SleepCorrelations | null
  tips: string[]
  loading: boolean
  error: Error | null
}
