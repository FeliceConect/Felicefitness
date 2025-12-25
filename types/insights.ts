// Tipos de insight
export type InsightType =
  | 'achievement'      // Conquista/marco atingido
  | 'pattern'          // Padrão identificado
  | 'trend'            // Tendência (positiva/negativa)
  | 'alert'            // Alerta importante
  | 'recommendation'   // Recomendação de ação
  | 'prediction'       // Previsão/projeção
  | 'optimization'     // Sugestão de otimização
  | 'correlation'      // Correlação descoberta
  | 'milestone'        // Marco próximo
  | 'anomaly'          // Anomalia detectada

export type InsightPriority = 'low' | 'medium' | 'high' | 'critical'

export type InsightCategory =
  | 'workout'
  | 'nutrition'
  | 'body'
  | 'sleep'
  | 'wellness'
  | 'hydration'
  | 'consistency'
  | 'goals'
  | 'health'

export interface InsightAction {
  type: string
  label: string
  href?: string
  params?: Record<string, unknown>
}

export interface Insight {
  id: string
  type: InsightType
  priority: InsightPriority
  category: InsightCategory
  title: string
  description: string
  icon: string
  data?: Record<string, unknown>
  action?: InsightAction
  createdAt: Date
  expiresAt?: Date
  dismissed?: boolean
  dismissedAt?: Date
  viewed?: boolean
}

// Dados do usuário para análise
export interface UserAnalysisData {
  // Treinos
  workouts: WorkoutData[]
  weeklyVolumes: number[]
  lastPR?: { date: Date; exercise: string; weight: number }
  workoutPerformance: number[]

  // Nutrição
  dailyProtein: number[]
  recentCalories: number[]
  meals: MealData[]
  proteinGoal: number
  caloriesGoal: number

  // Corpo
  bodyComps: BodyCompData[]
  weightHistory: { date: Date; value: number }[]

  // Sono
  sleepDurations: number[]
  sleepQuality: number[]

  // Bem-estar
  wellnessCheckins: WellnessData[]
  dailyScores: number[]

  // Hidratação
  waterIntake: number[]
  waterGoal: number

  // Suplementos
  supplements: SupplementData[]

  // Gamificação
  gamification: {
    streak: number
    level: number
    xp: number
  }

  // Metas
  goals: {
    weightTarget?: number
    caloriesGoal: number
    proteinGoal: number
    skiTrip?: { date: Date; preparedness: number }
  }

  // Configurações específicas
  revoladeSettings?: {
    enabled: boolean
    schedule: string
    restrictedHours: number
  }
}

export interface WorkoutData {
  id: string
  date: string
  name: string
  duration: number
  volume: number
  exercises: number
  createdAt: string
}

export interface MealData {
  id: string
  date: string
  time: string
  calories: number
  protein: number
  carbs: number
  fat: number
  hasDairy: boolean
}

export interface BodyCompData {
  id: string
  date: string
  peso: number
  gordura: number
  musculo: number
}

export interface WellnessData {
  id: string
  date: string
  mood: number
  stress: number
  energy: number
}

export interface SupplementData {
  id: string
  name: string
  daysRemaining: number
  priority: 'alta' | 'media' | 'baixa'
}

// Análise de tendência
export interface TrendAnalysis {
  direction: 'up' | 'down' | 'stable'
  percentage: number
  confidence: number
}

// Correlação
export interface CorrelationResult {
  metric1: string
  metric2: string
  coefficient: number
  interpretation: string
}

// Previsões
export interface WeightPrediction {
  currentWeight: number
  targetWeight: number
  predictedDate: Date
  daysToTarget: number
  weeklyChange: number
  confidence: number
}

export interface MusclePrediction {
  currentMuscle: number
  targetMuscle: number
  predictedDate: Date
  monthlyGain: number
  confidence: number
}

export interface PRPrediction {
  exercise: string
  currentWeight: number
  predictedWeight: number
  predictedDate: Date
  likely: boolean
}

export interface SkiReadiness {
  percentage: number
  daysRemaining: number
  components: {
    legStrength: number
    core: number
    endurance: number
    bodyComposition: number
  }
  recommendations: string[]
}

// Relatório IA
export interface AIReport {
  id: string
  userId: string
  type: 'weekly' | 'monthly' | 'custom'
  periodStart: Date
  periodEnd: Date
  summary: string
  highlights: string[]
  warnings: string[]
  recommendations: string[]
  score: number
  sections: AIReportSection[]
  createdAt: Date
}

export interface AIReportSection {
  title: string
  icon: string
  content: string
  metrics?: { label: string; value: string; trend?: 'up' | 'down' | 'stable' }[]
}

// Configurações de alertas
export interface AlertSettings {
  notifyCritical: boolean
  notifyHigh: boolean
  dailySummary: boolean
  summaryTime: string
}

// Filtros de insights
export interface InsightFilter {
  types?: InsightType[]
  categories?: InsightCategory[]
  priorities?: InsightPriority[]
  showDismissed?: boolean
}

// Balance muscular
export interface MuscleBalance {
  imbalanced: boolean
  overworked: string
  underworked: string
  ratio: number
}

// Resposta da API de insights
export interface GenerateInsightsResponse {
  insights: Insight[]
  summary: string
}
