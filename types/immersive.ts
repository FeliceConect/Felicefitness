// Types for Immersive Workout Mode

// ===== Workout Status =====
export type ImmersiveStatus =
  | 'preparing'   // Countdown inicial
  | 'active'      // Executando exercício
  | 'input'       // Registrando série
  | 'rest'        // Descansando
  | 'pr'          // Celebrando PR
  | 'paused'      // Pausado
  | 'complete'    // Concluído

// ===== Exercise Types =====
export interface ImmersiveExercise {
  id: string
  workoutExerciseId: string
  name: string
  muscleGroup: string
  equipment?: string
  sets: number
  targetReps: number
  suggestedWeight: number
  currentPR?: number
  restTime: number
  animationUrl?: string
  demoUrl?: string
  notes?: string
}

export interface SetLog {
  setNumber: number
  weight: number
  reps: number
  rpe?: number // 1-10
  isNewPR: boolean
  completedAt: string
}

export interface SetInput {
  weight: number
  reps: number
  rpe?: number
}

// ===== PR Types =====
export interface NewPR {
  exerciseId: string
  exerciseName: string
  newRecord: number
  previousRecord: number
  improvement: number
  xpEarned: number
}

// ===== Workout Types =====
export interface ImmersiveWorkout {
  id: string
  name: string
  exercises: ImmersiveExercise[]
  estimatedDuration: number
}

export interface WorkoutSummary {
  workoutId: string
  workoutName: string
  duration: number // segundos
  exercisesCompleted: number
  totalExercises: number
  setsCompleted: number
  totalSets: number
  totalVolume: number // kg
  totalReps: number
  prsAchieved: NewPR[]
  xpEarned: number
  completedAt: string
}

// ===== Settings =====
export interface ImmersiveSettings {
  // Timer
  defaultRestTime: number // segundos
  autoStartTimer: boolean
  timerWarningAt: number // segundos antes do fim

  // Som
  soundEnabled: boolean
  volume: number // 0-1

  // Vibração
  vibrationEnabled: boolean

  // Voz
  voiceEnabled: boolean
  announceExercise: boolean
  announceCountdown: boolean
  announceMotivation: boolean

  // Tela
  keepScreenOn: boolean
  showAnimation: boolean

  // Gestos
  gesturesEnabled: boolean
}

// ===== Hook Return Types =====
export interface UseImmersiveWorkoutReturn {
  // Estado
  status: ImmersiveStatus

  // Exercício atual
  currentExercise: ImmersiveExercise | null
  currentSetIndex: number
  totalSets: number
  completedSetsForExercise: SetLog[]

  // Progresso geral
  exerciseIndex: number
  totalExercises: number
  allCompletedSets: SetLog[]
  elapsedTime: number

  // Timer de descanso
  restTimeRemaining: number
  isRestTimerActive: boolean

  // PRs
  newPRs: NewPR[]
  currentPRCelebration: NewPR | null

  // Ações
  startWorkout: () => void
  completeSet: (data: SetInput) => void
  skipRest: () => void
  skipExercise: () => void
  goToPreviousExercise: () => void
  pause: () => void
  resume: () => void
  endWorkout: () => void
  dismissPRCelebration: () => void

  // Configurações
  settings: ImmersiveSettings
  updateSettings: (settings: Partial<ImmersiveSettings>) => void

  // Resumo (quando completo)
  summary: WorkoutSummary | null
}

export interface UseWorkoutTimerReturn {
  timeRemaining: number
  totalTime: number
  isRunning: boolean
  progress: number // 0-1

  start: (duration: number) => void
  pause: () => void
  resume: () => void
  reset: () => void
  skip: () => void
}

export interface UseScreenWakeLockReturn {
  isSupported: boolean
  isActive: boolean
  request: () => Promise<void>
  release: () => Promise<void>
}

// ===== Constants =====
export const DEFAULT_IMMERSIVE_SETTINGS: ImmersiveSettings = {
  defaultRestTime: 60,
  autoStartTimer: true,
  timerWarningAt: 5,
  soundEnabled: true,
  volume: 0.7,
  vibrationEnabled: true,
  voiceEnabled: false,
  announceExercise: true,
  announceCountdown: true,
  announceMotivation: false,
  keepScreenOn: true,
  showAnimation: true,
  gesturesEnabled: true,
}

export const RPE_SCALE = [
  { value: 1, emoji: '😴', label: 'Muito fácil' },
  { value: 2, emoji: '😌', label: 'Fácil' },
  { value: 3, emoji: '🙂', label: 'Leve' },
  { value: 4, emoji: '😐', label: 'Moderado' },
  { value: 5, emoji: '😤', label: 'Desafiador' },
  { value: 6, emoji: '😓', label: 'Difícil' },
  { value: 7, emoji: '😰', label: 'Muito difícil' },
  { value: 8, emoji: '🥵', label: 'Quase falha' },
  { value: 9, emoji: '😵', label: '1 rep restante' },
  { value: 10, emoji: '💀', label: 'Falha total' },
]

export const WEIGHT_INCREMENTS = [0.5, 1, 2.5, 5, 10]
export const REP_PRESETS = [6, 8, 10, 12, 15, 20]
