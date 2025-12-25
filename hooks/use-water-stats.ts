"use client"

import { useState, useEffect, useMemo } from 'react'
import { format, subDays } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import {
  generateMockWeeklyData,
  calculateWaterStreak
} from '@/lib/water/calculations'
import { DEFAULT_WATER_GOAL } from '@/lib/water/types'
import type { WaterDayTotal, WaterStats } from '@/lib/water/types'

interface UseWaterStatsReturn extends WaterStats {
  isLoading: boolean
  error: Error | null
  refresh: () => Promise<void>
}

export function useWaterStats(): UseWaterStatsReturn {
  const [weeklyData, setWeeklyData] = useState<WaterDayTotal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const goal = DEFAULT_WATER_GOAL

  // Carregar dados da semana
  const loadStats = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        // Usar dados mock
        const mockData = generateMockWeeklyData(goal)
        setWeeklyData(mockData)
        setIsLoading(false)
        return
      }

      const today = new Date()
      const sevenDaysAgo = format(subDays(today, 6), 'yyyy-MM-dd')
      const todayStr = format(today, 'yyyy-MM-dd')

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error: fetchError } = await (supabase as any)
        .from('fitness_water_logs')
        .select('data, quantidade_ml')
        .eq('user_id', user.id)
        .gte('data', sevenDaysAgo)
        .lte('data', todayStr)

      if (fetchError) throw fetchError

      // Agrupar por dia
      const groupedData: Record<string, number> = {}
      data?.forEach((log: { data: string; quantidade_ml: number }) => {
        if (!groupedData[log.data]) {
          groupedData[log.data] = 0
        }
        groupedData[log.data] += log.quantidade_ml
      })

      // Criar array com todos os 7 dias (mesmo os sem dados)
      const weekData: WaterDayTotal[] = []
      for (let i = 6; i >= 0; i--) {
        const date = format(subDays(today, i), 'yyyy-MM-dd')
        weekData.push({
          date,
          total: groupedData[date] || 0
        })
      }

      setWeeklyData(weekData)
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err)
      setError(err as Error)
      // Fallback para mock
      const mockData = generateMockWeeklyData(goal)
      setWeeklyData(mockData)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadStats()
  }, [])

  // Calcular estatísticas
  const stats = useMemo((): WaterStats => {
    if (weeklyData.length === 0) {
      return {
        weeklyAverage: 0,
        weeklyTotal: 0,
        daysMetGoal: 0,
        weeklyData: [],
        monthlyAverage: 0,
        monthlyTotal: 0,
        monthlyDaysMetGoal: 0,
        bestDay: null,
        currentStreak: 0,
        bestStreak: 0
      }
    }

    // Totais semanais
    const weeklyTotal = weeklyData.reduce((sum, day) => sum + day.total, 0)
    const daysWithData = weeklyData.filter(d => d.total > 0).length
    const weeklyAverage = daysWithData > 0 ? Math.round(weeklyTotal / daysWithData) : 0
    const daysMetGoal = weeklyData.filter(d => d.total >= goal).length

    // Melhor dia
    const bestDay = weeklyData.reduce<{ date: string; amount: number } | null>((best, day) =>
      day.total > (best?.amount || 0) ? { date: day.date, amount: day.total } : best,
      null
    )

    // Streaks
    const { currentStreak, bestStreak } = calculateWaterStreak(weeklyData, goal)

    return {
      weeklyAverage,
      weeklyTotal,
      daysMetGoal,
      weeklyData,
      monthlyAverage: weeklyAverage, // Por enquanto usar semanal
      monthlyTotal: weeklyTotal * 4, // Estimativa
      monthlyDaysMetGoal: Math.round(daysMetGoal * 4.3), // Estimativa
      bestDay,
      currentStreak,
      bestStreak
    }
  }, [weeklyData, goal])

  return {
    ...stats,
    isLoading,
    error,
    refresh: loadStats
  }
}
