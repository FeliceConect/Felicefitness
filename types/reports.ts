// Tipos para Sistema de Relatórios e Analytics

// ========== PERÍODO ==========

export type ReportPeriod = 'week' | 'month' | '3months' | '6months' | 'year' | 'all'

export interface DateRange {
  start: Date
  end: Date
}

// ========== INSIGHTS ==========

export type InsightType = 'positive' | 'warning' | 'suggestion' | 'milestone'

export interface Insight {
  id: string
  type: InsightType
  icon: string
  title: string
  description: string
  metric?: string
  value?: number
  change?: number
  priority: number // 1-10
}

// ========== TENDÊNCIAS ==========

export type TrendDirection = 'up' | 'down' | 'stable'

export interface Trend {
  direction: TrendDirection
  percentage: number
  value: number
  previousValue: number
}

// ========== RESUMO DE PERÍODO ==========

export interface PeriodSummary {
  period: ReportPeriod
  dateRange: DateRange

  // Treino
  workouts: {
    completed: number
    planned: number
    completionRate: number
    totalMinutes: number
    totalCalories: number
    prsCount: number
  }

  // Nutrição
  nutrition: {
    avgCalories: number
    avgProtein: number
    avgCarbs: number
    avgFat: number
    daysOnCalorieTarget: number
    daysOnProteinTarget: number
    totalMealsLogged: number
  }

  // Hidratação
  hydration: {
    avgDaily: number
    totalLiters: number
    daysOnTarget: number
    targetRate: number
  }

  // Corpo
  body: {
    startWeight: number | null
    endWeight: number | null
    weightChange: number | null
    startFat: number | null
    endFat: number | null
    fatChange: number | null
    startMuscle: number | null
    endMuscle: number | null
    muscleChange: number | null
  }

  // Pontuação
  score: {
    average: number
    best: number
    worst: number
    perfectDays: number
    dailyScores: { date: string; score: number }[]
  }

  // Gamificação
  gamification: {
    xpGained: number
    levelsGained: number
    achievementsUnlocked: number
    currentStreak: number
    bestStreak: number
  }
}

// ========== RELATÓRIO SEMANAL ==========

export interface WeeklyReport {
  weekNumber: number
  year: number
  dateRange: DateRange

  summary: PeriodSummary

  // PRs da semana
  prs: {
    exercise: string
    weight: number
    reps: number
    date: string
  }[]

  // Heatmap da semana
  dailyActivity: {
    date: string
    workout: boolean
    mealsLogged: number
    waterGoalMet: boolean
    score: number
  }[]

  // Comparação com semana anterior
  comparison: {
    workouts?: Trend
    calories?: Trend
    protein?: Trend
    water?: Trend
    score?: Trend
  }

  // Insights
  insights: Insight[]
}

// ========== RELATÓRIO MENSAL ==========

export interface MonthlyReport {
  month: number
  year: number
  dateRange: DateRange

  // Resumo executivo
  executiveSummary: string
  overallScore: number
  ranking: string

  summary: PeriodSummary

  // Evolução semanal
  weeklyProgression: {
    week: number
    score: number
    workouts: number
    avgProtein: number
  }[]

  // PRs do mês
  prs: {
    exercise: string
    weight: number
    reps: number
    date: string
    improvement: number
  }[]

  // Heatmap do mês
  activityHeatmap: {
    date: string
    activities: number
    score: number
  }[]

  // Comparação com mês anterior
  comparison: {
    workouts?: Trend
    calories?: Trend
    protein?: Trend
    water?: Trend
    weight?: Trend
    score?: Trend
  }

  // Insights
  insights: Insight[]
}

// ========== DADOS DE EVOLUÇÃO ==========

export interface EvolutionData {
  period: ReportPeriod

  weight: {
    data: { date: string; value: number }[]
    trend: Trend | null
    goal: number | null
    projectedGoalDate: string | null
  }

  muscle: {
    data: { date: string; value: number }[]
    trend: Trend | null
    totalGain: number
  }

  fat: {
    data: { date: string; value: number }[]
    trend: Trend | null
    totalLoss: number
    goal: number | null
  }

  strength: {
    exercises: {
      name: string
      data: { date: string; value: number }[]
      trend: Trend
      prs: number
    }[]
  }

  consistency: {
    data: { date: string; value: number }[]
    trend: Trend | null
    avgScore: number
  }
}

// ========== COMPARAÇÃO DE PERÍODOS ==========

export interface PeriodComparison {
  period1: {
    label: string
    dateRange: DateRange
    summary: PeriodSummary
  }
  period2: {
    label: string
    dateRange: DateRange
    summary: PeriodSummary
  }

  differences: {
    metric: string
    period1Value: number
    period2Value: number
    change: number
    changePercent: number
    better: 1 | 2 | 0
  }[]

  radarData: {
    metric: string
    period1: number
    period2: number
  }[]

  analysis: string
}

// ========== ANALYTICS DATA ==========

export interface AnalyticsData {
  // Treino
  workouts: {
    current: number
    previous: number
    planned: number
  }

  prs: {
    count: number
    best: {
      exercise: string
      weight: number
    } | null
  }

  streak: number

  // Nutrição
  nutrition: {
    avgCalories: number
    avgProtein: number
    proteinDaysOnTarget: number
  }

  // Hidratação
  water: {
    current: number
    previous: number
    best: number
  }

  // Corpo
  body: {
    weightChange: number | null
    fatChange: number | null
    muscleChange: number | null
  }

  // Metas
  goals: {
    calories: number
    protein: number
    water: number
  }

  // Datas
  daysSinceLastBioimpedance: number
  daysSinceLastPhoto: number
}

// ========== HOOK RETURNS ==========

export interface UseAnalyticsReturn {
  summary: PeriodSummary | null
  trends: Record<string, Trend>
  insights: Insight[]

  period: ReportPeriod
  setPeriod: (period: ReportPeriod) => void
  dateRange: DateRange

  comparison: PeriodComparison | null
  previousSummary: PeriodSummary | null

  loading: boolean
  error: Error | null

  refresh: () => Promise<void>
}

export interface UseWeeklyReportReturn {
  report: WeeklyReport | null
  loading: boolean
  error: Error | null

  currentWeek: number
  currentYear: number
  goToWeek: (week: number, year?: number) => void
  nextWeek: () => void
  previousWeek: () => void

  exportPDF: () => Promise<Blob>
}

export interface UseMonthlyReportReturn {
  report: MonthlyReport | null
  loading: boolean
  error: Error | null

  currentMonth: number
  currentYear: number
  goToMonth: (month: number, year?: number) => void
  nextMonth: () => void
  previousMonth: () => void

  exportPDF: () => Promise<Blob>
}
