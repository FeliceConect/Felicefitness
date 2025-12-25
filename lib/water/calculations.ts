// Cálculos e funções utilitárias para hidratação

import { format, subDays, differenceInDays, parseISO } from 'date-fns'
import type { WaterDayTotal } from './types'

/**
 * Calcula o streak de hidratação (dias consecutivos atingindo a meta)
 */
export function calculateWaterStreak(
  dailyTotals: WaterDayTotal[],
  goal: number
): { currentStreak: number; bestStreak: number } {
  if (dailyTotals.length === 0) {
    return { currentStreak: 0, bestStreak: 0 }
  }

  // Ordenar por data decrescente
  const sortedTotals = [...dailyTotals].sort((a, b) =>
    b.date.localeCompare(a.date)
  )

  let currentStreak = 0
  let bestStreak = 0
  let tempStreak = 0
  let lastDate: Date | null = null

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (const day of sortedTotals) {
    const dayDate = parseISO(day.date)
    dayDate.setHours(0, 0, 0, 0)

    // Verificar se atingiu a meta
    const metGoal = day.total >= goal

    if (!lastDate) {
      // Primeiro dia
      if (metGoal) {
        // Verificar se é hoje ou ontem
        const diffDays = differenceInDays(today, dayDate)
        if (diffDays <= 1) {
          tempStreak = 1
          currentStreak = 1
        }
      }
    } else {
      // Verificar consecutividade
      const diffFromLast = differenceInDays(lastDate, dayDate)

      if (diffFromLast === 1 && metGoal) {
        tempStreak++
        if (currentStreak > 0) {
          currentStreak = tempStreak
        }
      } else {
        // Streak quebrado
        bestStreak = Math.max(bestStreak, tempStreak)
        tempStreak = metGoal ? 1 : 0
      }
    }

    lastDate = dayDate
  }

  bestStreak = Math.max(bestStreak, tempStreak)

  return { currentStreak, bestStreak }
}

/**
 * Calcula a meta ideal de água baseada no peso
 */
export function calculateIdealWaterIntake(weightKg: number): number {
  // Regra geral: 35ml por kg de peso
  return Math.round(weightKg * 35)
}

/**
 * Verifica se está no ritmo esperado de hidratação
 */
export function isOnTrack(
  currentMl: number,
  goalMl: number,
  currentHour: number,
  wakeHour: number = 5,
  sleepHour: number = 22
): { onTrack: boolean; expectedMl: number; diff: number; percentage: number } {
  const activeHours = sleepHour - wakeHour
  const hoursElapsed = Math.max(0, Math.min(currentHour - wakeHour, activeHours))
  const expectedMl = Math.round((goalMl / activeHours) * hoursElapsed)

  const diff = currentMl - expectedMl
  const percentage = expectedMl > 0 ? Math.round((currentMl / expectedMl) * 100) : 100

  return {
    onTrack: currentMl >= expectedMl * 0.8, // 80% do esperado
    expectedMl,
    diff,
    percentage
  }
}

/**
 * Formata quantidade de água
 */
export function formatWaterAmount(ml: number): string {
  if (ml >= 1000) {
    const liters = ml / 1000
    return `${liters.toFixed(liters % 1 === 0 ? 0 : 1)}L`
  }
  return `${ml}ml`
}

/**
 * Calcula quantas gotas mostrar baseado na quantidade
 */
export function getDropletCount(ml: number): number {
  if (ml >= 500) return 3
  if (ml >= 300) return 2
  return 1
}

/**
 * Retorna a cor do progresso baseada na porcentagem
 */
export function getWaterProgressColor(progress: number): string {
  if (progress >= 1) return 'cyan' // Meta atingida
  if (progress >= 0.8) return 'emerald' // Quase lá
  if (progress >= 0.5) return 'amber' // Metade do caminho
  return 'violet' // Início
}

/**
 * Gera dados mock para os últimos 7 dias
 */
export function generateMockWeeklyData(goal: number): WaterDayTotal[] {
  const data: WaterDayTotal[] = []
  const today = new Date()

  for (let i = 6; i >= 0; i--) {
    const date = subDays(today, i)
    const variation = 0.7 + Math.random() * 0.5 // 70% a 120% da meta
    const total = Math.round(goal * variation)

    data.push({
      date: format(date, 'yyyy-MM-dd'),
      total
    })
  }

  return data
}

/**
 * Gera logs mock para o dia atual
 */
export function generateMockTodayLogs(): Array<{
  id: string
  horario: string
  quantidade_ml: number
}> {
  const currentHour = new Date().getHours()
  const logs = []

  // Gerar alguns logs baseados na hora atual
  if (currentHour >= 7) {
    logs.push({ id: 'log-1', horario: '07:15', quantidade_ml: 300 })
  }
  if (currentHour >= 9) {
    logs.push({ id: 'log-2', horario: '09:30', quantidade_ml: 200 })
  }
  if (currentHour >= 11) {
    logs.push({ id: 'log-3', horario: '11:45', quantidade_ml: 500 })
  }
  if (currentHour >= 14) {
    logs.push({ id: 'log-4', horario: '14:20', quantidade_ml: 350 })
  }
  if (currentHour >= 16) {
    logs.push({ id: 'log-5', horario: '16:00', quantidade_ml: 200 })
  }
  if (currentHour >= 18) {
    logs.push({ id: 'log-6', horario: '18:30', quantidade_ml: 300 })
  }

  return logs.reverse() // Mais recentes primeiro
}
