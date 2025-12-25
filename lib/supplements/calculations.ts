// Supplement calculations and utilities

import type {
  Supplement,
  SupplementSchedule,
  SupplementLog,
  DailyProgress,
  NextDose,
  StockLevel,
  SupplementStats,
  CalendarDay,
} from '@/types/supplements'

/**
 * Check if a supplement should be taken on a specific day
 */
export function shouldTakeOnDay(supplement: Supplement, date: Date): boolean {
  if (supplement.frequencia === 'quando_necessario') {
    return false // User decides when to take
  }

  if (supplement.frequencia === 'diario') {
    return true
  }

  if (supplement.frequencia === 'dias_especificos' && supplement.dias_semana) {
    return supplement.dias_semana.includes(date.getDay())
  }

  return true
}

/**
 * Generate today's schedule from supplements and logs
 */
export function generateDailySchedule(
  supplements: Supplement[],
  logs: SupplementLog[],
  date: Date
): SupplementSchedule[] {
  const schedule: SupplementSchedule[] = []
  const dateStr = date.toISOString().split('T')[0]

  for (const supplement of supplements) {
    if (!supplement.ativo || !shouldTakeOnDay(supplement, date)) {
      continue
    }

    for (const time of supplement.horarios) {
      const log = logs.find(
        l => l.supplement_id === supplement.id && l.scheduled_time === time && l.date === dateStr
      )

      schedule.push({
        supplement,
        time,
        taken: log?.taken || false,
        takenAt: log?.taken_at,
        logId: log?.id,
      })
    }
  }

  // Sort by time
  return schedule.sort((a, b) => a.time.localeCompare(b.time))
}

/**
 * Calculate daily progress
 */
export function calculateDailyProgress(schedule: SupplementSchedule[]): DailyProgress {
  const total = schedule.length
  const taken = schedule.filter(s => s.taken).length
  const percent = total > 0 ? Math.round((taken / total) * 100) : 0

  return { taken, total, percent }
}

/**
 * Get the next dose to take
 */
export function getNextDose(schedule: SupplementSchedule[]): NextDose | null {
  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()

  // Find the next untaken dose
  const nextUntaken = schedule.find(s => {
    if (s.taken) return false

    const [hours, minutes] = s.time.split(':').map(Number)
    const scheduleMinutes = hours * 60 + minutes

    return scheduleMinutes >= currentMinutes - 30 // Allow 30 min late
  })

  if (!nextUntaken) return null

  const [hours, minutes] = nextUntaken.time.split(':').map(Number)
  const scheduleMinutes = hours * 60 + minutes
  const inMinutes = scheduleMinutes - currentMinutes

  return {
    supplement: nextUntaken.supplement,
    time: nextUntaken.time,
    inMinutes: Math.max(0, inMinutes),
  }
}

/**
 * Calculate stock levels for all supplements
 */
export function calculateStockLevels(supplements: Supplement[]): StockLevel[] {
  return supplements.map(supplement => {
    // Calculate daily consumption
    const dailyDoses = supplement.horarios.length

    // Adjust for frequency
    let effectiveDailyDoses = dailyDoses
    if (supplement.frequencia === 'dias_especificos' && supplement.dias_semana) {
      effectiveDailyDoses = (dailyDoses * supplement.dias_semana.length) / 7
    } else if (supplement.frequencia === 'quando_necessario') {
      effectiveDailyDoses = 0.5 // Estimate
    }

    // Calculate days remaining
    const daysRemaining = effectiveDailyDoses > 0
      ? Math.floor(supplement.quantidade_estoque / effectiveDailyDoses)
      : 999

    // Determine status
    let status: 'ok' | 'low' | 'critical' = 'ok'
    if (supplement.quantidade_estoque <= supplement.alerta_estoque_minimo) {
      status = 'critical'
    } else if (daysRemaining <= 14) {
      status = 'low'
    }

    return {
      supplement,
      quantity: supplement.quantidade_estoque,
      daysRemaining,
      status,
    }
  })
}

/**
 * Calculate supplement statistics
 */
export function calculateSupplementStats(
  logs: SupplementLog[],
  supplements: Supplement[],
  startDate: Date,
  endDate: Date
): SupplementStats {
  const dateRange: string[] = []
  const current = new Date(startDate)
  while (current <= endDate) {
    dateRange.push(current.toISOString().split('T')[0])
    current.setDate(current.getDate() + 1)
  }

  let totalDosesTaken = 0
  let totalDosesScheduled = 0
  let perfectDays = 0
  let currentStreak = 0
  let bestStreak = 0
  let tempStreak = 0

  for (const dateStr of dateRange) {
    const date = new Date(dateStr + 'T12:00:00')
    const dayLogs = logs.filter(l => l.date === dateStr)

    // Count scheduled doses for this day
    let dayScheduled = 0
    let dayTaken = 0

    for (const supplement of supplements) {
      if (shouldTakeOnDay(supplement, date)) {
        dayScheduled += supplement.horarios.length
      }
    }

    // Count taken doses
    dayTaken = dayLogs.filter(l => l.taken).length
    totalDosesTaken += dayTaken
    totalDosesScheduled += dayScheduled

    // Check if perfect day
    if (dayScheduled > 0 && dayTaken >= dayScheduled) {
      perfectDays++
      tempStreak++
      bestStreak = Math.max(bestStreak, tempStreak)
    } else if (dayScheduled > 0) {
      tempStreak = 0
    }
  }

  // Current streak is from today backwards
  currentStreak = tempStreak

  const adherenceRate = totalDosesScheduled > 0
    ? Math.round((totalDosesTaken / totalDosesScheduled) * 100)
    : 0

  return {
    adherenceRate,
    totalDosesTaken,
    totalDosesScheduled,
    perfectDays,
    totalDays: dateRange.length,
    currentStreak,
    bestStreak,
  }
}

/**
 * Calculate adherence rate per supplement
 */
export function calculateAdherenceBySuplement(
  logs: SupplementLog[],
  supplements: Supplement[],
  days: number
): Record<string, number> {
  const result: Record<string, number> = {}

  for (const supplement of supplements) {
    const supplementLogs = logs.filter(l => l.supplement_id === supplement.id)
    const expectedDoses = supplement.horarios.length * days
    const takenDoses = supplementLogs.filter(l => l.taken).length

    result[supplement.id] = expectedDoses > 0
      ? Math.round((takenDoses / expectedDoses) * 100)
      : 0
  }

  return result
}

/**
 * Generate calendar data for history view
 */
export function generateCalendarData(
  logs: SupplementLog[],
  supplements: Supplement[],
  month: Date
): CalendarDay[] {
  const calendar: CalendarDay[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const year = month.getFullYear()
  const monthNum = month.getMonth()
  const daysInMonth = new Date(year, monthNum + 1, 0).getDate()

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, monthNum, day)
    const dateStr = date.toISOString().split('T')[0]

    // Count expected doses
    let expected = 0
    for (const supplement of supplements) {
      if (shouldTakeOnDay(supplement, date)) {
        expected += supplement.horarios.length
      }
    }

    // Count taken doses
    const dayLogs = logs.filter(l => l.date === dateStr)
    const taken = dayLogs.filter(l => l.taken).length

    // Determine status
    let status: CalendarDay['status'] = 'future'
    if (date < today) {
      if (taken >= expected && expected > 0) {
        status = 'complete'
      } else if (taken > 0) {
        status = 'partial'
      } else if (expected > 0) {
        status = 'missed'
      } else {
        status = 'complete' // No doses scheduled
      }
    } else if (date.getTime() === today.getTime()) {
      if (taken >= expected && expected > 0) {
        status = 'complete'
      } else if (taken > 0) {
        status = 'partial'
      } else {
        status = 'future'
      }
    }

    calendar.push({
      date: dateStr,
      status,
      taken,
      total: expected,
    })
  }

  return calendar
}

/**
 * Format time remaining until next dose
 */
export function formatTimeRemaining(minutes: number): string {
  if (minutes <= 0) return 'Agora!'
  if (minutes < 60) return `Em ${minutes} min`

  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60

  if (mins === 0) return `Em ${hours}h`
  return `Em ${hours}h ${mins}min`
}

/**
 * Check if time is between two times (handles overnight)
 */
export function isTimeBetween(time: string, start: string, end: string): boolean {
  const timeToMinutes = (t: string) => {
    const [h, m] = t.split(':').map(Number)
    return h * 60 + m
  }

  const timeMin = timeToMinutes(time)
  const startMin = timeToMinutes(start)
  const endMin = timeToMinutes(end)

  if (startMin <= endMin) {
    return timeMin >= startMin && timeMin <= endMin
  } else {
    // Crosses midnight
    return timeMin >= startMin || timeMin <= endMin
  }
}

/**
 * Check for Revolade conflicts
 */
export function checkRevoladeConflict(
  supplement: Supplement,
  time: string,
  revoladeSettings: { jejum_inicio: string; restricao_laticinios_fim: string } | null
): { conflict: boolean; reason?: string; suggestion?: string } {
  if (!revoladeSettings) {
    return { conflict: false }
  }

  const isInRestrictionWindow = isTimeBetween(
    time,
    revoladeSettings.jejum_inicio,
    revoladeSettings.restricao_laticinios_fim
  )

  const hasDairyRestriction = supplement.restricoes?.some(r =>
    ['laticinios', 'calcio', 'laticínios', 'cálcio', 'dairy', 'calcium'].includes(r.toLowerCase())
  )

  if (isInRestrictionWindow && hasDairyRestriction) {
    return {
      conflict: true,
      reason: `${supplement.nome} contém cálcio e conflita com o Revolade`,
      suggestion: `Tome antes das ${revoladeSettings.jejum_inicio} ou após as ${revoladeSettings.restricao_laticinios_fim}`,
    }
  }

  return { conflict: false }
}

/**
 * Get supplement type icon
 */
export function getSupplementTypeIcon(tipo: string): string {
  const icons: Record<string, string> = {
    medicamento: '💊',
    proteina: '💪',
    performance: '⚡',
    saude: '🏥',
    vitamina: '💊',
    mineral: '🔶',
    outro: '📦',
  }
  return icons[tipo] || '📦'
}

/**
 * Get priority color class
 */
export function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'alta':
      return 'text-red-500'
    case 'media':
      return 'text-yellow-500'
    case 'baixa':
      return 'text-green-500'
    default:
      return 'text-muted-foreground'
  }
}

/**
 * Get stock status color class
 */
export function getStockStatusColor(status: string): string {
  switch (status) {
    case 'critical':
      return 'text-red-500 bg-red-500/10'
    case 'low':
      return 'text-yellow-500 bg-yellow-500/10'
    case 'ok':
      return 'text-green-500 bg-green-500/10'
    default:
      return 'text-muted-foreground'
  }
}
