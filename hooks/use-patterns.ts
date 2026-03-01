'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
interface CorrelationResult {
  metric1: string
  metric2: string
  coefficient: number
  interpretation: string
}

interface TrendAnalysis {
  direction: 'up' | 'down' | 'stable'
  percentage: number
  confidence: number
}

interface PatternData {
  bestWorkoutDays: string[]
  worstWorkoutDays: string[]
  optimalWorkoutTime: string | null
  sleepWorkoutCorrelation: number
  moodFactors: { factor: string; impact: 'positive' | 'negative'; frequency: number }[]
  weeklyPatterns: {
    dayOfWeek: string
    avgMood: number
    avgEnergy: number
    workoutFrequency: number
  }[]
}

interface UsePatternsReturn {
  // Padrões identificados
  patterns: PatternData | null

  // Correlações
  correlations: CorrelationResult[]

  // Tendências
  trends: {
    workout: TrendAnalysis | null
    nutrition: TrendAnalysis | null
    sleep: TrendAnalysis | null
    wellness: TrendAnalysis | null
  }

  // Atualizar
  refreshPatterns: () => Promise<void>

  loading: boolean
}

export function usePatterns(): UsePatternsReturn {
  const [patterns, setPatterns] = useState<PatternData | null>(null)
  const [correlations, setCorrelations] = useState<CorrelationResult[]>([])
  const [trends, setTrends] = useState<{
    workout: TrendAnalysis | null
    nutrition: TrendAnalysis | null
    sleep: TrendAnalysis | null
    wellness: TrendAnalysis | null
  }>({
    workout: null,
    nutrition: null,
    sleep: null,
    wellness: null,
  })
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  const loadPatterns = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0]

      // Buscar dados
      const [workoutsResult, wellnessResult, sleepResult] = await Promise.all([
        supabase
          .from('fitness_workouts')
          .select('*')
          .eq('user_id', user.id)
          .gte('data', thirtyDaysAgoStr)
          .order('data', { ascending: false }),

        supabase
          .from('fitness_wellness_checkins')
          .select('*')
          .eq('user_id', user.id)
          .gte('data', thirtyDaysAgoStr)
          .order('data', { ascending: false }),

        supabase
          .from('fitness_sleep_logs')
          .select('*')
          .eq('user_id', user.id)
          .gte('data', thirtyDaysAgoStr)
          .order('data', { ascending: false }),
      ])

      const workouts = workoutsResult.data || []
      const wellness = wellnessResult.data || []
      const sleep = sleepResult.data || []

      // Calcular padrões de dia da semana
      const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
      const dayStats: Record<number, { moods: number[]; energies: number[]; workouts: number }> = {}

      for (let i = 0; i < 7; i++) {
        dayStats[i] = { moods: [], energies: [], workouts: 0 }
      }

      wellness.forEach((w: Record<string, unknown>) => {
        const dayOfWeek = new Date(w.data as string).getDay()
        dayStats[dayOfWeek].moods.push(w.humor as number || 3)
        dayStats[dayOfWeek].energies.push(w.energia as number || 3)
      })

      workouts.forEach((w: Record<string, unknown>) => {
        const dayOfWeek = new Date(w.data as string).getDay()
        dayStats[dayOfWeek].workouts++
      })

      const weeklyPatterns = Object.entries(dayStats).map(([day, stats]) => ({
        dayOfWeek: dayNames[parseInt(day)],
        avgMood:
          stats.moods.length > 0
            ? stats.moods.reduce((a, b) => a + b, 0) / stats.moods.length
            : 0,
        avgEnergy:
          stats.energies.length > 0
            ? stats.energies.reduce((a, b) => a + b, 0) / stats.energies.length
            : 0,
        workoutFrequency: stats.workouts,
      }))

      // Encontrar melhores/piores dias
      const sortedByMood = [...weeklyPatterns].sort((a, b) => b.avgMood - a.avgMood)
      const bestDays = sortedByMood.slice(0, 2).map((p) => p.dayOfWeek)
      const worstDays = sortedByMood.slice(-2).map((p) => p.dayOfWeek)

      // Horário ótimo de treino
      const workoutHours = workouts.map((w: Record<string, unknown>) =>
        new Date(w.created_at as string).getHours()
      )
      const hourCounts: Record<number, number> = {}
      workoutHours.forEach((h) => {
        hourCounts[h] = (hourCounts[h] || 0) + 1
      })
      const optimalHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0]
      const optimalWorkoutTime = optimalHour ? `${optimalHour[0]}:00` : null

      // Calcular correlação sono-treino
      const sleepMap = new Map(
        sleep.map((s: Record<string, unknown>) => [s.data as string, s.qualidade as number || 70])
      )
      const workoutDays = new Set(workouts.map((w: Record<string, unknown>) => w.data as string))

      let sleepWithWorkout: number[] = []
      let sleepWithoutWorkout: number[] = []

      sleepMap.forEach((quality, date) => {
        if (workoutDays.has(date)) {
          sleepWithWorkout.push(quality)
        } else {
          sleepWithoutWorkout.push(quality)
        }
      })

      const avgSleepWithWorkout =
        sleepWithWorkout.length > 0
          ? sleepWithWorkout.reduce((a, b) => a + b, 0) / sleepWithWorkout.length
          : 0
      const avgSleepWithoutWorkout =
        sleepWithoutWorkout.length > 0
          ? sleepWithoutWorkout.reduce((a, b) => a + b, 0) / sleepWithoutWorkout.length
          : 0

      const sleepWorkoutCorrelation =
        avgSleepWithWorkout > 0 && avgSleepWithoutWorkout > 0
          ? (avgSleepWithWorkout - avgSleepWithoutWorkout) / avgSleepWithoutWorkout
          : 0

      // Fatores de humor
      const factorCounts: Record<string, { positive: number; negative: number }> = {}

      wellness.forEach((w: Record<string, unknown>) => {
        const positivos = (w.fatores_positivos as string[]) || []
        const negativos = (w.fatores_negativos as string[]) || []

        positivos.forEach((f) => {
          if (!factorCounts[f]) factorCounts[f] = { positive: 0, negative: 0 }
          factorCounts[f].positive++
        })

        negativos.forEach((f) => {
          if (!factorCounts[f]) factorCounts[f] = { positive: 0, negative: 0 }
          factorCounts[f].negative++
        })
      })

      const moodFactors = Object.entries(factorCounts)
        .map(([factor, counts]) => ({
          factor,
          impact: counts.positive > counts.negative ? 'positive' as const : 'negative' as const,
          frequency: counts.positive + counts.negative,
        }))
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 5)

      setPatterns({
        bestWorkoutDays: bestDays,
        worstWorkoutDays: worstDays,
        optimalWorkoutTime,
        sleepWorkoutCorrelation,
        moodFactors,
        weeklyPatterns,
      })

      // Correlações identificadas
      if (Math.abs(sleepWorkoutCorrelation) > 0.1) {
        setCorrelations([
          {
            metric1: 'Qualidade do Sono',
            metric2: 'Treino',
            coefficient: sleepWorkoutCorrelation,
            interpretation:
              sleepWorkoutCorrelation > 0
                ? 'Você dorme melhor em dias de treino'
                : 'Treinos intensos podem afetar seu sono',
          },
        ])
      }

      // Tendências simplificadas
      const workoutVolumes = workouts.map((w: Record<string, unknown>) => w.volume_total as number || 0)
      const sleepQualities = sleep.map((s: Record<string, unknown>) => s.qualidade as number || 70)
      const moods = wellness.map((w: Record<string, unknown>) => w.humor as number || 3)

      setTrends({
        workout: calculateSimpleTrend(workoutVolumes),
        nutrition: null, // Seria calculado com dados de refeições
        sleep: calculateSimpleTrend(sleepQualities),
        wellness: calculateSimpleTrend(moods),
      })
    } catch (error) {
      console.error('Error loading patterns:', error)
    } finally {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    loadPatterns()
  }, [loadPatterns])

  const refreshPatterns = useCallback(async () => {
    setLoading(true)
    await loadPatterns()
  }, [loadPatterns])

  return {
    patterns,
    correlations,
    trends,
    refreshPatterns,
    loading,
  }
}

function calculateSimpleTrend(values: number[]): TrendAnalysis | null {
  if (values.length < 5) return null

  const midpoint = Math.floor(values.length / 2)
  const firstHalf = values.slice(0, midpoint)
  const secondHalf = values.slice(midpoint)

  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length

  if (firstAvg === 0) return { direction: 'stable', percentage: 0, confidence: 0.5 }

  const percentageChange = ((secondAvg - firstAvg) / firstAvg) * 100

  let direction: 'up' | 'down' | 'stable' = 'stable'
  if (percentageChange > 5) direction = 'up'
  else if (percentageChange < -5) direction = 'down'

  return {
    direction,
    percentage: Math.abs(percentageChange),
    confidence: 0.6,
  }
}
