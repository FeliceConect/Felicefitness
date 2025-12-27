// Tipos para o módulo de alimentação

export type FoodCategory =
  | 'proteina'
  | 'carboidrato'
  | 'vegetal'
  | 'fruta'
  | 'laticinio'
  | 'gordura'
  | 'suplemento'
  | 'bebida'
  | 'outros'

export type MealType =
  | 'cafe_manha'
  | 'lanche_manha'
  | 'almoco'
  | 'lanche_tarde'
  | 'pre_treino'
  | 'jantar'
  | 'ceia'

export type MealStatus = 'pendente' | 'concluido' | 'pulado'

// Porção comum para seleção rápida (ex: "1 unidade", "1 fatia")
export interface CommonPortion {
  label: string       // Ex: "1 unidade", "1 fatia", "1 colher de sopa"
  grams: number       // Peso em gramas ou ml
  isDefault?: boolean // Se é a porção padrão sugerida
}

export interface Food {
  id: string
  nome: string
  categoria: FoodCategory
  marca?: string
  porcao_padrao: number // gramas ou ml
  unidade: 'g' | 'ml' | 'unidade'
  calorias: number
  proteinas: number
  carboidratos: number
  gorduras: number
  fibras?: number
  sodio?: number
  porcoes_comuns?: CommonPortion[] // Porções comuns para seleção rápida
  is_favorite?: boolean
  is_user_created?: boolean
  source?: 'manual' | 'ai_analysis' // Origem do alimento
  created_at?: string
}

export interface MealItem {
  id: string
  food_id: string
  food: Food
  quantidade: number // em gramas/ml
  calorias: number
  proteinas: number
  carboidratos: number
  gorduras: number
}

export interface Meal {
  id: string
  user_id: string
  tipo: MealType
  data: string // YYYY-MM-DD
  horario_planejado?: string // HH:MM
  horario_real?: string // HH:MM
  status: MealStatus
  itens: MealItem[]
  calorias_total: number
  proteinas_total: number
  carboidratos_total: number
  gorduras_total: number
  foto_url?: string
  notas?: string
  created_at: string
}

export interface PlannedMeal {
  tipo: MealType
  label: string
  horario: string
  opcional?: boolean
  restricao?: string // 'sem_laticínios', etc
  condicao?: string // 'dias_beach_tennis', etc
}

export interface NutritionGoals {
  calorias: number
  proteinas: number
  carboidratos: number
  gorduras: number
  agua: number // ml
}

export interface NutritionTotals {
  calorias: number
  proteinas: number
  carboidratos: number
  gorduras: number
  fibras?: number
}

export interface NutritionProgress {
  calorias: number // 0-100+
  proteinas: number
  carboidratos: number
  gorduras: number
}

export interface DailyNutrition {
  date: string
  meals: Meal[]
  totals: NutritionTotals
  goals: NutritionGoals
  progress: NutritionProgress
  agua_consumida: number
}

export type RevoladeStatus = 'normal' | 'pre_jejum' | 'jejum' | 'restricao' | 'liberado'
export type RevoladeAlertType = 'none' | 'warning' | 'danger' | 'success'

export interface RevoladeWindow {
  status: RevoladeStatus
  message: string
  alertType: RevoladeAlertType
  timeRemaining?: number // minutos
  nextPhase?: string
  canEat: boolean
  canHaveDairy: boolean
}

export interface RevoladeConfig {
  horario_medicamento: string // "14:00"
  horas_jejum_antes: number // 2
  horas_restricao_depois: number // 4
  restricao_tipo: string // 'laticínios'
}

export interface MealTemplate {
  tipo: MealType
  nome: string
  itens: Array<{
    alimento_nome: string
    quantidade: number
  }>
}

// Labels e configurações
export const mealTypeLabels: Record<MealType, string> = {
  cafe_manha: 'Café da Manhã',
  lanche_manha: 'Lanche da Manhã',
  almoco: 'Almoço',
  lanche_tarde: 'Lanche da Tarde',
  pre_treino: 'Pré-Treino',
  jantar: 'Jantar',
  ceia: 'Ceia'
}

export const mealTypeIcons: Record<MealType, string> = {
  cafe_manha: '☕',
  lanche_manha: '🍎',
  almoco: '🍽️',
  lanche_tarde: '🥪',
  pre_treino: '💪',
  jantar: '🌙',
  ceia: '🌜'
}

export const foodCategoryLabels: Record<FoodCategory, { label: string; icon: string }> = {
  proteina: { label: 'Proteínas', icon: '🥩' },
  carboidrato: { label: 'Carboidratos', icon: '🍚' },
  vegetal: { label: 'Vegetais', icon: '🥬' },
  fruta: { label: 'Frutas', icon: '🍎' },
  laticinio: { label: 'Laticínios', icon: '🥛' },
  gordura: { label: 'Gorduras', icon: '🥜' },
  suplemento: { label: 'Suplementos', icon: '💊' },
  bebida: { label: 'Bebidas', icon: '🥤' },
  outros: { label: 'Outros', icon: '🍴' }
}

// Metas do Leonardo
export const leonardoGoals: NutritionGoals = {
  calorias: 2500,
  proteinas: 170,
  carboidratos: 280,
  gorduras: 85,
  agua: 3000
}

// Plano de refeições do Leonardo
export const leonardoMealPlan: PlannedMeal[] = [
  { tipo: 'cafe_manha', label: 'Café da Manhã', horario: '06:30' },
  { tipo: 'lanche_manha', label: 'Lanche da Manhã', horario: '10:00', opcional: true },
  { tipo: 'almoco', label: 'Almoço', horario: '11:30' },
  { tipo: 'lanche_tarde', label: 'Lanche da Tarde', horario: '17:00', restricao: 'sem_laticínios' },
  { tipo: 'pre_treino', label: 'Pré-Treino BT', horario: '18:30', condicao: 'dias_beach_tennis' },
  { tipo: 'jantar', label: 'Jantar', horario: '20:00' },
  { tipo: 'ceia', label: 'Ceia', horario: '22:00', opcional: true }
]

// Configuração do Revolade do Leonardo
export const leonardoRevoladeConfig: RevoladeConfig = {
  horario_medicamento: '14:00',
  horas_jejum_antes: 2,
  horas_restricao_depois: 4,
  restricao_tipo: 'laticínios'
}
