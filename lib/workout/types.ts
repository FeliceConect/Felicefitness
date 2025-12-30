// Tipos para o módulo de treinos

export type WorkoutType = 'tradicional' | 'circuito' | 'hiit' | 'mobilidade'
export type ExerciseType = 'strength' | 'cardio' | 'mobility'

// Tipos de exercícios cardio disponíveis
export type CardioExerciseType = 'esteira' | 'bicicleta' | 'eliptico' | 'step' | 'remo' | 'outro'

export interface CardioExercise {
  id: string
  tipo: CardioExerciseType
  nome: string
  duracao_minutos: number
  distancia_km?: number
  velocidade_media?: number // km/h
  calorias?: number
  inclinacao?: number // %
  notas?: string
}
export type WorkoutStatus = 'pendente' | 'em_andamento' | 'concluido' | 'cancelado'
export type WorkoutPhase = 'base' | 'construcao' | 'pico'

export interface WorkoutTemplate {
  id: string
  nome: string
  tipo: WorkoutType
  fase: WorkoutPhase
  dia_semana: number // 0 = Domingo, 1 = Segunda...
  duracao_estimada: number // minutos
  rodadas?: number // para circuito
  descanso_rodada?: number // segundos
  exercicios: TemplateExercise[]
}

export interface TemplateExercise {
  id: string
  exercise_id: string
  nome: string
  ordem: number
  series: number
  repeticoes: string // "12" ou "30s" ou "10 cada"
  descanso: number // segundos
  carga_sugerida?: number
  is_superset?: boolean
  superset_with?: string // id do exercício pareado
  notas?: string
}

export interface Workout {
  id: string
  template_id?: string
  user_id: string
  nome: string
  tipo: WorkoutType
  fase?: WorkoutPhase
  data: string // YYYY-MM-DD
  status: WorkoutStatus
  duracao_estimada: number
  duracao_real?: number
  calorias_estimadas?: number
  notas?: string
  dificuldade_percebida?: number // 1-5
  energia_pos?: number // 1-5
  created_at: string
  exercicios: WorkoutExercise[]
}

export interface WorkoutExercise {
  id: string
  workout_id: string
  exercise_id: string
  nome: string
  ordem: number
  series: ExerciseSet[]
  notas?: string
  is_superset?: boolean
}

export interface ExerciseSet {
  id: string
  workout_exercise_id: string
  numero_serie: number
  repeticoes_planejadas: string
  repeticoes_realizadas?: number
  carga_planejada?: number
  carga_realizada?: number
  tempo_segundos?: number // para isométricos
  descanso?: number // segundos de descanso após esta série
  status: 'pendente' | 'concluido' | 'pulado'
  is_pr?: boolean
}

export interface CompletedSet {
  exerciseId: string
  exerciseName: string
  setNumber: number
  reps: number
  weight: number
  time?: number // para isométricos
  isPR: boolean
}

export interface CompletedCardio {
  id: string
  tipo: CardioExerciseType
  nome: string
  duracao_minutos: number
  distancia_km?: number
  velocidade_media?: number
  calorias?: number
  inclinacao?: number
  notas?: string
}

export interface PersonalRecord {
  id: string
  user_id: string
  exercise_id: string
  exercise_name: string
  weight: number
  reps: number
  volume?: number // peso × reps
  data: string
  workout_id: string
}

export interface WorkoutSummary {
  workout: Workout
  duracao: number // minutos
  exerciciosCompletos: number
  exerciciosTotal: number
  seriesCompletas: number
  seriesTotal: number
  volumeTotal: number // peso × reps de todas as séries
  caloriasEstimadas: number
  novosRecordes: PersonalRecord[]
  cardioExercises?: CompletedCardio[]
}

export interface DayWorkout {
  date: Date
  dayOfWeek: number
  dayOfMonth: number
  status: 'completed' | 'partial' | 'pending' | 'rest' | 'missed' | 'future'
  workout?: Workout
  type?: string // 'beach_tennis', 'bike', etc.
  icon?: string
}

export interface ExerciseHistory {
  date: string
  sets: {
    reps: number
    weight: number
    isPR: boolean
  }[]
  maxWeight: number
  avgWeight: number
  totalVolume: number
}
