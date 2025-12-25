// Types for Supplements module

// ===== Supplement Types =====

export interface Supplement {
  id: string
  user_id: string
  nome: string
  tipo: SupplementType
  dosagem: string
  descricao_dose?: string
  horarios: string[] // ["06:00", "14:00", "20:00"]
  frequencia: SupplementFrequency
  dias_semana?: number[] // [0,1,2,3,4,5,6] for specific days
  com_refeicao: MealRelation
  restricoes: string[]
  notas?: string
  quantidade_estoque: number
  unidade_estoque: string
  alerta_estoque_minimo: number
  prioridade: SupplementPriority
  cor: string
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface NewSupplement {
  nome: string
  tipo: SupplementType
  dosagem: string
  descricao_dose?: string
  horarios: string[]
  frequencia: SupplementFrequency
  dias_semana?: number[]
  com_refeicao: MealRelation
  restricoes?: string[]
  notas?: string
  quantidade_estoque?: number
  unidade_estoque?: string
  alerta_estoque_minimo?: number
  prioridade?: SupplementPriority
  cor?: string
  ativo?: boolean
}

export type SupplementType =
  | 'medicamento'
  | 'proteina'
  | 'performance'
  | 'saude'
  | 'vitamina'
  | 'mineral'
  | 'outro'

export type SupplementFrequency =
  | 'diario'
  | 'dias_especificos'
  | 'quando_necessario'

export type MealRelation =
  | 'indiferente'
  | 'com_refeicao'
  | 'com_gordura'
  | 'jejum'

export type SupplementPriority = 'alta' | 'media' | 'baixa'

// ===== Supplement Log Types =====

export interface SupplementLog {
  id: string
  user_id: string
  supplement_id: string
  date: string // YYYY-MM-DD
  scheduled_time: string // HH:MM
  taken: boolean
  taken_at?: string // ISO timestamp
  notes?: string
  created_at: string
}

export interface NewSupplementLog {
  supplement_id: string
  date: string
  scheduled_time: string
  taken: boolean
  taken_at?: string
  notes?: string
}

// ===== Schedule Types =====

export interface SupplementSchedule {
  supplement: Supplement
  time: string
  taken: boolean
  takenAt?: string
  logId?: string
}

export interface DailyProgress {
  taken: number
  total: number
  percent: number
}

export interface NextDose {
  supplement: Supplement
  time: string
  inMinutes: number
}

// ===== Stock Types =====

export interface StockLevel {
  supplement: Supplement
  quantity: number
  daysRemaining: number
  status: 'ok' | 'low' | 'critical'
}

export interface StockUpdate {
  supplement_id: string
  quantidade: number
  tipo: 'set' | 'add' | 'subtract'
}

// ===== History Types =====

export interface SupplementStats {
  adherenceRate: number
  totalDosesTaken: number
  totalDosesScheduled: number
  perfectDays: number
  totalDays: number
  currentStreak: number
  bestStreak: number
}

export interface CalendarDay {
  date: string
  status: 'complete' | 'partial' | 'missed' | 'future'
  taken: number
  total: number
}

// ===== Constants =====

export const SUPPLEMENT_TYPES: { value: SupplementType; label: string; icon: string }[] = [
  { value: 'medicamento', label: 'Medicamento', icon: '💊' },
  { value: 'proteina', label: 'Proteína', icon: '💪' },
  { value: 'performance', label: 'Performance', icon: '⚡' },
  { value: 'saude', label: 'Saúde', icon: '🏥' },
  { value: 'vitamina', label: 'Vitamina', icon: '💊' },
  { value: 'mineral', label: 'Mineral', icon: '🔶' },
  { value: 'outro', label: 'Outro', icon: '📦' },
]

export const FREQUENCY_OPTIONS: { value: SupplementFrequency; label: string }[] = [
  { value: 'diario', label: 'Diário' },
  { value: 'dias_especificos', label: 'Dias específicos' },
  { value: 'quando_necessario', label: 'Quando necessário' },
]

export const MEAL_RELATION_OPTIONS: { value: MealRelation; label: string; description: string; icon: string }[] = [
  { value: 'indiferente', label: 'Indiferente', description: 'Pode tomar a qualquer momento', icon: '🕐' },
  { value: 'com_refeicao', label: 'Com refeição', description: 'Tomar junto com comida', icon: '🍽️' },
  { value: 'com_gordura', label: 'Com gordura', description: 'Tomar com refeição gordurosa', icon: '🥑' },
  { value: 'jejum', label: 'Estômago vazio', description: 'Tomar em jejum', icon: '⚠️' },
]

export const PRIORITY_OPTIONS: { value: SupplementPriority; label: string; color: string }[] = [
  { value: 'alta', label: 'Alta', color: 'text-red-500' },
  { value: 'media', label: 'Média', color: 'text-yellow-500' },
  { value: 'baixa', label: 'Baixa', color: 'text-green-500' },
]

export const RESTRICTION_OPTIONS = [
  { id: 'laticinios', label: 'Laticínios', icon: '🥛' },
  { id: 'calcio', label: 'Cálcio', icon: '🦴' },
  { id: 'ferro', label: 'Ferro', icon: '🔩' },
  { id: 'cafeina', label: 'Cafeína', icon: '☕' },
  { id: 'antiacidos', label: 'Antiácidos', icon: '💊' },
  { id: 'alcool', label: 'Álcool', icon: '🍷' },
]

export const COLOR_OPTIONS = [
  '#EF4444', // Red
  '#F97316', // Orange
  '#F59E0B', // Amber
  '#84CC16', // Lime
  '#22C55E', // Green
  '#06B6D4', // Cyan
  '#3B82F6', // Blue
  '#8B5CF6', // Violet
  '#EC4899', // Pink
]

export const WEEKDAYS = [
  { value: 0, label: 'Dom', short: 'D' },
  { value: 1, label: 'Seg', short: 'S' },
  { value: 2, label: 'Ter', short: 'T' },
  { value: 3, label: 'Qua', short: 'Q' },
  { value: 4, label: 'Qui', short: 'Q' },
  { value: 5, label: 'Sex', short: 'S' },
  { value: 6, label: 'Sab', short: 'S' },
]

// ===== Hook Return Types =====

export interface UseSupplementsReturn {
  supplements: Supplement[]
  schedule: SupplementSchedule[]
  dailyProgress: DailyProgress
  nextDose: NextDose | null
  isLoading: boolean
  error: string | null
  addSupplement: (data: NewSupplement) => Promise<void>
  updateSupplement: (id: string, data: Partial<Supplement>) => Promise<void>
  deleteSupplement: (id: string) => Promise<void>
  markDose: (supplementId: string, time: string, taken: boolean) => Promise<void>
  refresh: () => Promise<void>
}

export interface UseSupplementStockReturn {
  stockLevels: StockLevel[]
  lowStockItems: StockLevel[]
  criticalStockItems: StockLevel[]
  isLoading: boolean
  error: string | null
  updateStock: (supplementId: string, quantity: number) => Promise<void>
  addStock: (supplementId: string, amount: number) => Promise<void>
  refresh: () => Promise<void>
}

export interface UseSupplementHistoryReturn {
  stats: SupplementStats
  calendarData: CalendarDay[]
  adherenceBySuplement: Record<string, number>
  supplements: Supplement[]
  logs: SupplementLog[]
  selectedMonth: Date
  isLoading: boolean
  error: string | null
  changeMonth: (month: Date) => void
  getLogsForDate: (date: string) => SupplementLog[]
  refresh: () => Promise<void>
}
