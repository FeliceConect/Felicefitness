// Calculador de Streaks - FeliceFit Gamification

import type { StreakData, StreakDay } from '@/types/gamification'

/**
 * Verifica se duas datas são dias consecutivos
 */
export function areConsecutiveDays(date1: string, date2: string): boolean {
  const d1 = new Date(date1)
  const d2 = new Date(date2)

  // Normalizar para início do dia
  d1.setHours(0, 0, 0, 0)
  d2.setHours(0, 0, 0, 0)

  const diffTime = Math.abs(d2.getTime() - d1.getTime())
  const diffDays = diffTime / (1000 * 60 * 60 * 24)

  return diffDays === 1
}

/**
 * Formata data para string YYYY-MM-DD
 */
export function formatDateString(date: Date): string {
  return date.toISOString().split('T')[0]
}

/**
 * Verifica se é o mesmo dia
 */
export function isSameDay(date1: string, date2: string): boolean {
  return date1 === date2
}

/**
 * Obtém a data de ontem
 */
export function getYesterdayString(): string {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return formatDateString(yesterday)
}

/**
 * Obtém a data de hoje
 */
export function getTodayString(): string {
  return formatDateString(new Date())
}

/**
 * Calcula o streak atual baseado no histórico
 */
export function calculateCurrentStreak(history: StreakDay[]): number {
  if (!history || history.length === 0) return 0

  // Ordenar por data decrescente
  const sortedHistory = [...history]
    .filter(d => d.completed)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  if (sortedHistory.length === 0) return 0

  const today = getTodayString()
  const yesterday = getYesterdayString()

  // O dia mais recente deve ser hoje ou ontem para manter o streak
  const lastActiveDate = sortedHistory[0].date
  if (lastActiveDate !== today && lastActiveDate !== yesterday) {
    return 0
  }

  let streak = 1
  let currentDate = lastActiveDate

  for (let i = 1; i < sortedHistory.length; i++) {
    const previousDate = sortedHistory[i].date
    if (areConsecutiveDays(previousDate, currentDate)) {
      streak++
      currentDate = previousDate
    } else {
      break
    }
  }

  return streak
}

/**
 * Calcula o melhor streak do histórico
 */
export function calculateBestStreak(history: StreakDay[]): number {
  if (!history || history.length === 0) return 0

  // Ordenar por data crescente
  const sortedHistory = [...history]
    .filter(d => d.completed)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  if (sortedHistory.length === 0) return 0

  let bestStreak = 1
  let currentStreak = 1
  let previousDate = sortedHistory[0].date

  for (let i = 1; i < sortedHistory.length; i++) {
    const currentDate = sortedHistory[i].date
    if (areConsecutiveDays(previousDate, currentDate)) {
      currentStreak++
      bestStreak = Math.max(bestStreak, currentStreak)
    } else {
      currentStreak = 1
    }
    previousDate = currentDate
  }

  return bestStreak
}

/**
 * Atualiza dados de streak com nova atividade
 */
export function updateStreakData(
  currentData: StreakData,
  activityDate: string,
  activities?: string[]
): StreakData {
  // Verificar se já registrou hoje
  const existingToday = currentData.streakHistory.find(d => d.date === activityDate)
  if (existingToday?.completed) {
    // Apenas atualiza as atividades se necessário
    if (activities) {
      const updatedHistory = currentData.streakHistory.map(d =>
        d.date === activityDate
          ? { ...d, activities: [...(d.activities || []), ...activities] }
          : d
      )
      return { ...currentData, streakHistory: updatedHistory }
    }
    return currentData
  }

  // Adicionar/atualizar o dia
  const newDay: StreakDay = {
    date: activityDate,
    completed: true,
    activities: activities || []
  }

  const updatedHistory = existingToday
    ? currentData.streakHistory.map(d =>
        d.date === activityDate ? newDay : d
      )
    : [...currentData.streakHistory, newDay]

  // Recalcular streaks
  const currentStreak = calculateCurrentStreak(updatedHistory)
  const bestStreak = Math.max(currentData.bestStreak, currentStreak)

  return {
    currentStreak,
    bestStreak,
    lastActivityDate: activityDate,
    streakHistory: updatedHistory
  }
}

/**
 * Verifica se o streak foi perdido
 */
export function isStreakLost(lastActivityDate: string | null): boolean {
  if (!lastActivityDate) return true

  const today = getTodayString()
  const yesterday = getYesterdayString()

  return lastActivityDate !== today && lastActivityDate !== yesterday
}

/**
 * Obtém dias até o streak expirar
 */
export function getDaysUntilStreakExpires(lastActivityDate: string | null): number {
  if (!lastActivityDate) return 0

  const today = getTodayString()
  const yesterday = getYesterdayString()

  if (lastActivityDate === today) return 2 // Hoje: expira depois de amanhã
  if (lastActivityDate === yesterday) return 1 // Ontem: expira amanhã
  return 0 // Já expirou
}

/**
 * Verifica se é um "comeback" (retorno após inatividade)
 */
export function isComeback(
  lastActivityDate: string | null,
  inactiveDaysThreshold: number = 3
): boolean {
  if (!lastActivityDate) return false

  const lastDate = new Date(lastActivityDate)
  const today = new Date()

  lastDate.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)

  const diffTime = today.getTime() - lastDate.getTime()
  const diffDays = diffTime / (1000 * 60 * 60 * 24)

  return diffDays >= inactiveDaysThreshold
}

/**
 * Obtém dados de streak inicial
 */
export function getInitialStreakData(): StreakData {
  return {
    currentStreak: 0,
    bestStreak: 0,
    lastActivityDate: null,
    streakHistory: []
  }
}

/**
 * Obtém cor do streak baseado no valor
 */
export function getStreakColor(streak: number): string {
  if (streak >= 365) return '#FFD700'  // Dourado - Ano
  if (streak >= 180) return '#FF4500'  // Laranja forte - 6 meses
  if (streak >= 90) return '#FF6347'   // Tomate - 3 meses
  if (streak >= 30) return '#FF8C00'   // Laranja escuro - Mês
  if (streak >= 14) return '#FFA500'   // Laranja - 2 semanas
  if (streak >= 7) return '#FFB347'    // Laranja claro - Semana
  if (streak >= 3) return '#FFCC00'    // Amarelo - 3 dias
  return '#FFE4B5'                      // Bege claro - Início
}

/**
 * Obtém mensagem motivacional baseada no streak
 */
export function getStreakMessage(streak: number): string {
  if (streak === 0) return 'Comece seu streak hoje!'
  if (streak === 1) return 'Primeiro dia! Continue assim!'
  if (streak === 2) return 'Dois dias seguidos! Está formando um hábito!'
  if (streak < 7) return `${streak} dias! Continue firme!`
  if (streak === 7) return 'Uma semana completa! Incrível!'
  if (streak < 14) return `${streak} dias! Você é imparável!`
  if (streak === 14) return 'Duas semanas! Hábito formado!'
  if (streak < 30) return `${streak} dias de fogo!`
  if (streak === 30) return 'UM MÊS! Você é uma máquina!'
  if (streak < 60) return `${streak} dias! Disciplina total!`
  if (streak === 60) return 'Dois meses! Lendário!'
  if (streak < 90) return `${streak} dias! Elite!`
  if (streak === 90) return 'Três meses! Você é um guerreiro!'
  if (streak < 180) return `${streak} dias! Fenomenal!`
  if (streak === 180) return 'Meio ano! Você é imortal!'
  if (streak < 365) return `${streak} dias! Histórico!`
  return `${streak} DIAS! LENDA ABSOLUTA!`
}

/**
 * Obtém intensidade da animação do fogo baseada no streak
 */
export function getFlameIntensity(streak: number): 'low' | 'medium' | 'high' | 'extreme' {
  if (streak >= 30) return 'extreme'
  if (streak >= 14) return 'high'
  if (streak >= 7) return 'medium'
  return 'low'
}

/**
 * Gera histórico visual para os últimos N dias
 */
export function getStreakCalendar(
  history: StreakDay[],
  days: number = 30
): StreakDay[] {
  const calendar: StreakDay[] = []
  const today = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateString = formatDateString(date)

    const existingDay = history.find(d => d.date === dateString)
    calendar.push(existingDay || { date: dateString, completed: false })
  }

  return calendar
}
