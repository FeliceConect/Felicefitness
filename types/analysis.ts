/**
 * Tipos para análise de refeições com IA
 */

// Níveis de confiança da análise
export type ConfidenceLevel = 'alto' | 'medio' | 'baixo'

// Item de alimento analisado pela IA
export interface AnalyzedFoodItem {
  id: string
  name: string
  portion_grams: number
  calories: number
  protein: number
  carbs: number
  fat: number
  confidence: ConfidenceLevel
  notes?: string
  edited?: boolean
}

// Totais nutricionais
export interface NutritionTotals {
  calories: number
  protein: number
  carbs: number
  fat: number
}

// Resultado completo da análise
export interface MealAnalysisResult {
  success: boolean
  meal_description?: string
  items: AnalyzedFoodItem[]
  totals: NutritionTotals
  suggestions: string[]
  warnings: string[]
  confidence?: number
  error?: string
}

// Resposta da API de análise
export interface AnalysisAPIResponse {
  success: boolean
  meal_description?: string
  items?: Array<{
    name: string
    portion_grams: number
    calories: number
    protein: number
    carbs: number
    fat: number
    confidence: ConfidenceLevel
    notes?: string
  }>
  totals?: NutritionTotals
  suggestions?: string[]
  warnings?: string[]
  error?: string
}

// Estado da análise
export type AnalysisStatus =
  | 'idle'
  | 'capturing'
  | 'uploading'
  | 'analyzing'
  | 'success'
  | 'error'

// Steps do loading
export interface AnalysisStep {
  id: string
  label: string
  status: 'pending' | 'in_progress' | 'completed' | 'error'
}

// Props para componentes
export interface MealAnalyzerProps {
  onAnalysisComplete: (result: MealAnalysisResult) => void
  onCancel: () => void
}

export interface AnalysisLoadingProps {
  imagePreview: string
  currentStep?: number
}

export interface AnalysisResultProps {
  result: MealAnalysisResult
  imageUrl: string
  onEditItem: (id: string) => void
  onRemoveItem: (id: string) => void
  onAddItem: () => void
  onSave: () => void
  onRetry: () => void
}

export interface FoodItemEditorProps {
  item: AnalyzedFoodItem
  onSave: (item: AnalyzedFoodItem) => void
  onDelete: () => void
  onCancel: () => void
}

export interface ConfidenceIndicatorProps {
  level: ConfidenceLevel
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
}

// Histórico de análises
export interface MealAnalysisHistory {
  id: string
  user_id: string
  meal_id?: string
  image_url?: string
  result: MealAnalysisResult
  tokens_used?: number
  was_edited: boolean
  created_at: string
}

// Configurações de análise
export interface AnalysisConfig {
  maxImageSize: number // em bytes
  maxTokens: number
  temperature: number
  model: string
}

export const DEFAULT_ANALYSIS_CONFIG: AnalysisConfig = {
  maxImageSize: 2 * 1024 * 1024, // 2MB
  maxTokens: 2000,
  temperature: 0.3,
  model: 'gpt-4o'
}
