// Cálculos estatísticos para relatórios

import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subMonths,
  getWeek,
  getYear,
  format,
  eachDayOfInterval,
  differenceInDays,
  setWeek,
  startOfYear
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { DateRange, Trend, TrendDirection, ReportPeriod } from '@/types/reports'

/**
 * Calcula a tendência entre dois valores
 */
export function calculateTrend(current: number, previous: number): Trend {
  if (previous === 0) {
    return {
      direction: current > 0 ? 'up' : 'stable',
      percentage: current > 0 ? 100 : 0,
      value: current,
      previousValue: previous
    }
  }

  const change = current - previous
  const percentage = (change / previous) * 100

  let direction: TrendDirection = 'stable'
  if (percentage > 2) direction = 'up'
  else if (percentage < -2) direction = 'down'

  return {
    direction,
    percentage: Math.round(percentage * 10) / 10,
    value: current,
    previousValue: previous
  }
}

/**
 * Obtém o ícone e cor para uma tendência
 */
export function getTrendDisplay(trend: Trend, higherIsBetter: boolean = true): {
  icon: string
  color: string
  label: string
} {
  const isPositive = higherIsBetter
    ? trend.direction === 'up'
    : trend.direction === 'down'

  if (trend.direction === 'stable') {
    return {
      icon: '→',
      color: 'text-muted-foreground',
      label: 'Estável'
    }
  }

  return {
    icon: trend.direction === 'up' ? '↑' : '↓',
    color: isPositive ? 'text-green-500' : 'text-red-500',
    label: `${trend.direction === 'up' ? '+' : ''}${trend.percentage.toFixed(1)}%`
  }
}

/**
 * Obtém o range de datas para um período
 */
export function getDateRangeForPeriod(period: ReportPeriod, referenceDate: Date = new Date()): DateRange {
  switch (period) {
    case 'week':
      return {
        start: startOfWeek(referenceDate, { weekStartsOn: 1 }),
        end: endOfWeek(referenceDate, { weekStartsOn: 1 })
      }
    case 'month':
      return {
        start: startOfMonth(referenceDate),
        end: endOfMonth(referenceDate)
      }
    case '3months':
      return {
        start: startOfMonth(subMonths(referenceDate, 2)),
        end: endOfMonth(referenceDate)
      }
    case '6months':
      return {
        start: startOfMonth(subMonths(referenceDate, 5)),
        end: endOfMonth(referenceDate)
      }
    case 'year':
      return {
        start: new Date(referenceDate.getFullYear(), 0, 1),
        end: new Date(referenceDate.getFullYear(), 11, 31)
      }
    case 'all':
      return {
        start: new Date(2024, 0, 1), // Data inicial do app
        end: referenceDate
      }
  }
}

/**
 * Obtém o range de datas para uma semana específica
 */
export function getWeekDateRange(weekNumber: number, year: number): DateRange {
  // Usar setWeek do date-fns para obter a data correta da semana
  const dateInWeek = setWeek(startOfYear(new Date(year, 0, 4)), weekNumber, {
    weekStartsOn: 1, // Segunda-feira
    firstWeekContainsDate: 4 // ISO week
  })

  const weekStart = startOfWeek(dateInWeek, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(dateInWeek, { weekStartsOn: 1 })

  return { start: weekStart, end: weekEnd }
}

/**
 * Obtém o range de datas para um mês específico
 */
export function getMonthDateRange(month: number, year: number): DateRange {
  return {
    start: new Date(year, month - 1, 1),
    end: endOfMonth(new Date(year, month - 1, 1))
  }
}

/**
 * Formata um range de datas para exibição
 */
export function formatDateRange(range: DateRange): string {
  const start = format(range.start, "dd 'de' MMM", { locale: ptBR })
  const end = format(range.end, "dd 'de' MMM", { locale: ptBR })
  return `${start} - ${end}`
}

/**
 * Formata data para exibição curta
 */
export function formatShortDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'dd/MM', { locale: ptBR })
}

/**
 * Formata data para exibição longa
 */
export function formatLongDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
}

/**
 * Obtém número da semana atual
 */
export function getCurrentWeekNumber(): number {
  return getWeek(new Date(), { weekStartsOn: 1 })
}

/**
 * Obtém ano atual
 */
export function getCurrentYear(): number {
  return getYear(new Date())
}

/**
 * Calcula média de um array de números
 */
export function calculateAverage(values: number[]): number {
  if (values.length === 0) return 0
  const sum = values.reduce((a, b) => a + b, 0)
  return Math.round((sum / values.length) * 10) / 10
}

/**
 * Calcula a taxa de conclusão
 */
export function calculateCompletionRate(completed: number, total: number): number {
  if (total === 0) return 0
  return Math.round((completed / total) * 100)
}

/**
 * Gera array de dias para um range
 */
export function getDaysInRange(range: DateRange): Date[] {
  return eachDayOfInterval({ start: range.start, end: range.end })
}

/**
 * Calcula dias desde uma data
 */
export function daysSince(date: Date | string | null): number {
  if (!date) return Infinity
  const d = typeof date === 'string' ? new Date(date) : date
  return differenceInDays(new Date(), d)
}

/**
 * Formata duração em minutos para exibição
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}min`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`
}

/**
 * Formata número com separador de milhares
 */
export function formatNumber(value: number): string {
  return value.toLocaleString('pt-BR')
}

/**
 * Formata variação com sinal
 */
export function formatChange(value: number, suffix: string = ''): string {
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(1)}${suffix}`
}

/**
 * Calcula projeção linear
 */
export function calculateProjection(
  data: { date: string; value: number }[],
  targetValue: number
): string | null {
  if (data.length < 2) return null

  // Regressão linear simples
  const n = data.length
  const xValues = data.map((_, i) => i)
  const yValues = data.map(d => d.value)

  const sumX = xValues.reduce((a, b) => a + b, 0)
  const sumY = yValues.reduce((a, b) => a + b, 0)
  const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0)
  const sumXX = xValues.reduce((sum, x) => sum + x * x, 0)

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n

  if (slope === 0) return null

  // Calcular quando atinge o target
  const daysToTarget = (targetValue - intercept) / slope - (n - 1)

  if (daysToTarget <= 0) return null

  const targetDate = new Date()
  targetDate.setDate(targetDate.getDate() + Math.ceil(daysToTarget))

  return format(targetDate, "MMM 'de' yyyy", { locale: ptBR })
}

/**
 * Gera resumo executivo baseado nos dados
 */
export function generateExecutiveSummary(
  score: number,
  trends: Record<string, Trend>
): string {
  const positives: string[] = []
  const negatives: string[] = []

  // Analisar tendências
  Object.entries(trends).forEach(([key, trend]) => {
    if (trend.direction === 'up' && trend.percentage > 5) {
      positives.push(key)
    } else if (trend.direction === 'down' && trend.percentage < -5) {
      negatives.push(key)
    }
  })

  // Gerar texto
  if (score >= 90) {
    return 'Excelente mês! Você manteve uma consistência excepcional em todas as áreas.'
  } else if (score >= 80) {
    return 'Ótimo mês! Seu desempenho foi muito bom na maioria das métricas.'
  } else if (score >= 70) {
    return 'Bom mês! Continue focado para melhorar ainda mais.'
  } else if (score >= 60) {
    return 'Mês razoável. Identifique as áreas que precisam de mais atenção.'
  } else {
    return 'Mês desafiador. Vamos focar em retomar a consistência!'
  }
}

/**
 * Calcula ranking do mês comparado com histórico
 */
export function calculateMonthRanking(
  currentScore: number,
  historicalScores: number[]
): string {
  if (historicalScores.length === 0) return 'Primeiro mês!'

  const allScores = [...historicalScores, currentScore].sort((a, b) => b - a)
  const position = allScores.indexOf(currentScore) + 1
  const total = allScores.length
  const percentile = Math.round(((total - position + 1) / total) * 100)

  if (position === 1) return 'Seu melhor mês!'
  if (percentile >= 90) return `Top ${100 - percentile}% dos seus meses`
  if (percentile >= 75) return 'Acima da média'
  if (percentile >= 50) return 'Na média'
  return 'Abaixo da média'
}
