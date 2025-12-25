'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  getDateRangeForPeriod,
  calculateTrend,
  calculateProjection
} from '@/lib/reports'
import type { ReportPeriod, EvolutionData } from '@/types/reports'
import { format, eachDayOfInterval } from 'date-fns'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseRow = Record<string, any>

interface UseEvolutionReturn {
  data: EvolutionData | null
  loading: boolean
  error: Error | null
  period: ReportPeriod
  setPeriod: (period: ReportPeriod) => void
  refresh: () => Promise<void>
}

export function useEvolution(): UseEvolutionReturn {
  const [period, setPeriod] = useState<ReportPeriod>('3months')
  const [data, setData] = useState<EvolutionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const supabase = createClient()

  const fetchEvolutionData = useCallback(async (): Promise<EvolutionData | null> => {
    const dateRange = getDateRangeForPeriod(period)
    const startStr = format(dateRange.start, 'yyyy-MM-dd')
    const endStr = format(dateRange.end, 'yyyy-MM-dd')

    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        console.log('User not authenticated')
        return getEmptyEvolutionData(period)
      }

      // Fetch workouts from fitness_workouts
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: workouts } = await (supabase as any)
        .from('fitness_workouts')
        .select('id, data, duracao_minutos, calorias_estimadas, status')
        .eq('user_id', user.id)
        .gte('data', startStr)
        .lte('data', endStr)
        .order('data', { ascending: true })

      // Fetch PRs from fitness_exercise_sets
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: prs } = await (supabase as any)
        .from('fitness_exercise_sets')
        .select(`
          id,
          peso,
          repeticoes,
          created_at,
          workout_exercise:fitness_workout_exercises(
            exercise_id,
            exercicio:fitness_exercises(id, nome)
          )
        `)
        .eq('is_pr', true)
        .gte('created_at', startStr)
        .lte('created_at', endStr + 'T23:59:59')
        .order('created_at', { ascending: true })

      // Fetch meals from fitness_meals
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: meals } = await (supabase as any)
        .from('fitness_meals')
        .select('id, data, calorias_total, proteinas_total')
        .eq('user_id', user.id)
        .gte('data', startStr)
        .lte('data', endStr)

      // Fetch water from fitness_water_logs
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: waterLogs } = await (supabase as any)
        .from('fitness_water_logs')
        .select('id, data, quantidade_ml')
        .eq('user_id', user.id)
        .gte('data', startStr)
        .lte('data', endStr)

      // Fetch profile for goals
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profile } = await (supabase as any)
        .from('fitness_profiles')
        .select('meta_calorias_diarias, meta_proteina_g, meta_agua_ml, peso_atual, meta_peso')
        .eq('id', user.id)
        .single()

      // Type cast all data
      const workoutsData = (workouts || []) as SupabaseRow[]
      const prsData = (prs || []) as SupabaseRow[]
      const mealsData = (meals || []) as SupabaseRow[]
      const waterData = (waterLogs || []) as SupabaseRow[]

      // We don't have body measurements table, so use empty data for weight/muscle/fat
      // These would need a fitness_body_measurements table to track over time
      const weightData: Array<{ date: string; value: number }> = []
      const muscleData: Array<{ date: string; value: number }> = []
      const fatData: Array<{ date: string; value: number }> = []

      // Process strength data - group PRs by exercise
      const exercisePRs = new Map<string, { name: string; prs: Array<{ date: string; value: number }> }>()
      prsData.forEach(pr => {
        const exerciseId = pr.workout_exercise?.exercicio?.id || pr.workout_exercise?.exercise_id || 'unknown'
        const exerciseName = pr.workout_exercise?.exercicio?.nome || 'Exercício'
        const existing = exercisePRs.get(exerciseId)
        if (existing) {
          existing.prs.push({
            date: format(new Date(pr.created_at), 'yyyy-MM-dd'),
            value: pr.peso as number
          })
        } else {
          exercisePRs.set(exerciseId, {
            name: exerciseName,
            prs: [{
              date: format(new Date(pr.created_at), 'yyyy-MM-dd'),
              value: pr.peso as number
            }]
          })
        }
      })

      const strengthExercises = Array.from(exercisePRs.values()).map(exercise => {
        const sortedPRs = exercise.prs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        const firstPR = sortedPRs[0]?.value || 0
        const lastPR = sortedPRs[sortedPRs.length - 1]?.value || 0

        return {
          name: exercise.name,
          data: sortedPRs,
          trend: calculateTrend(lastPR, firstPR),
          prs: sortedPRs.length
        }
      })

      // Calculate daily scores for consistency
      const days = eachDayOfInterval({ start: dateRange.start, end: dateRange.end })

      // Group nutrition by date
      const nutritionByDate = new Map<string, { calorias: number; proteinas: number }>()
      mealsData.forEach(m => {
        const date = m.data
        const existing = nutritionByDate.get(date) || { calorias: 0, proteinas: 0 }
        nutritionByDate.set(date, {
          calorias: existing.calorias + (m.calorias_total || 0),
          proteinas: existing.proteinas + (m.proteinas_total || 0)
        })
      })

      // Group water by date
      const waterByDay = new Map<string, number>()
      waterData.forEach(w => {
        const current = waterByDay.get(w.data) || 0
        waterByDay.set(w.data, current + (w.quantidade_ml || 0))
      })

      // Get workout dates
      const workoutDates = new Set(workoutsData.filter(w => w.status === 'concluido').map(w => w.data))

      // Targets from profile
      const proteinTarget = profile?.meta_proteina_g || 170
      const waterTarget = profile?.meta_agua_ml || 3000

      // Calculate daily scores
      const consistencyData = days.map(day => {
        const dateStr = format(day, 'yyyy-MM-dd')
        let score = 0

        // Workout score (40 points)
        if (workoutDates.has(dateStr)) score += 40

        // Nutrition score (30 points)
        const dayNutrition = nutritionByDate.get(dateStr)
        if (dayNutrition) {
          score += 15
          if (dayNutrition.proteinas >= proteinTarget) score += 15
        }

        // Water score (30 points)
        const dayWater = waterByDay.get(dateStr) || 0
        if (dayWater >= waterTarget) {
          score += 30
        } else if (dayWater >= waterTarget * 0.7) {
          score += 20
        } else if (dayWater > 0) {
          score += 10
        }

        return { date: dateStr, value: score }
      }).filter(d => {
        // Only include days that have any activity
        const hasActivity = workoutDates.has(d.date) ||
          nutritionByDate.has(d.date) ||
          (waterByDay.get(d.date) || 0) > 0
        return hasActivity
      })

      const avgScore = consistencyData.length > 0
        ? consistencyData.reduce((sum, s) => sum + s.value, 0) / consistencyData.length
        : 0

      // Calculate first half vs second half for consistency trend
      const halfPoint = Math.floor(consistencyData.length / 2)
      const firstHalfAvg = halfPoint > 0
        ? consistencyData.slice(0, halfPoint).reduce((sum, s) => sum + s.value, 0) / halfPoint
        : 0
      const secondHalfAvg = consistencyData.length - halfPoint > 0
        ? consistencyData.slice(halfPoint).reduce((sum, s) => sum + s.value, 0) / (consistencyData.length - halfPoint)
        : 0

      const weightGoal = profile?.meta_peso || null

      return {
        period,
        weight: {
          data: weightData,
          trend: null,
          goal: weightGoal,
          projectedGoalDate: null
        },
        muscle: {
          data: muscleData,
          trend: null,
          totalGain: 0
        },
        fat: {
          data: fatData,
          trend: null,
          totalLoss: 0,
          goal: null
        },
        strength: {
          exercises: strengthExercises
        },
        consistency: {
          data: consistencyData,
          trend: calculateTrend(secondHalfAvg, firstHalfAvg),
          avgScore: Math.round(avgScore)
        }
      }
    } catch (err) {
      console.error('Error fetching evolution data:', err)
      return getEmptyEvolutionData(period)
    }
  }, [supabase, period])

  const getEmptyEvolutionData = (period: ReportPeriod): EvolutionData => ({
    period,
    weight: { data: [], trend: null, goal: null, projectedGoalDate: null },
    muscle: { data: [], trend: null, totalGain: 0 },
    fat: { data: [], trend: null, totalLoss: 0, goal: null },
    strength: { exercises: [] },
    consistency: { data: [], trend: null, avgScore: 0 }
  })

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const evolutionData = await fetchEvolutionData()
      setData(evolutionData)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch evolution data'))
    } finally {
      setLoading(false)
    }
  }, [fetchEvolutionData])

  useEffect(() => {
    refresh()
  }, [refresh])

  return {
    data,
    loading,
    error,
    period,
    setPeriod,
    refresh
  }
}
