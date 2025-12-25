'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  getDateRangeForPeriod,
  calculateTrend,
  getDaysInRange
} from '@/lib/reports'
import { generateInsightsFromSummary } from '@/lib/reports/insights-engine'
import type {
  ReportPeriod,
  DateRange,
  PeriodSummary,
  Trend,
  Insight,
  UseAnalyticsReturn
} from '@/types/reports'
import { format, subWeeks, subMonths } from 'date-fns'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseRow = Record<string, any>

export function useAnalytics(): UseAnalyticsReturn {
  const [period, setPeriod] = useState<ReportPeriod>('week')
  const [dateRange, setDateRange] = useState<DateRange>(() => getDateRangeForPeriod('week'))
  const [summary, setSummary] = useState<PeriodSummary | null>(null)
  const [previousSummary, setPreviousSummary] = useState<PeriodSummary | null>(null)
  const [trends, setTrends] = useState<Record<string, Trend>>({})
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const supabase = createClient()

  const fetchSummary = useCallback(async (range: DateRange): Promise<PeriodSummary | null> => {
    const startStr = format(range.start, 'yyyy-MM-dd')
    const endStr = format(range.end, 'yyyy-MM-dd')

    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        console.log('User not authenticated, returning empty summary')
        return getEmptySummary(period, range)
      }

      // Fetch workouts from fitness_workouts (real table)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: workouts, error: workoutsError } = await (supabase as any)
        .from('fitness_workouts')
        .select('id, data, duracao_minutos, calorias_estimadas, status')
        .eq('user_id', user.id)
        .gte('data', startStr)
        .lte('data', endStr)

      if (workoutsError) {
        console.error('Error fetching workouts:', workoutsError)
      }

      // Fetch PRs from fitness_exercise_sets
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: prs, error: prsError } = await (supabase as any)
        .from('fitness_exercise_sets')
        .select('id, created_at')
        .eq('is_pr', true)
        .gte('created_at', startStr)
        .lte('created_at', endStr + 'T23:59:59')

      if (prsError) {
        console.error('Error fetching PRs:', prsError)
      }

      // Fetch meals from fitness_meals (real table)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: meals, error: mealsError } = await (supabase as any)
        .from('fitness_meals')
        .select('id, data, calorias_total, proteinas_total, carboidratos_total, gorduras_total')
        .eq('user_id', user.id)
        .gte('data', startStr)
        .lte('data', endStr)

      if (mealsError) {
        console.error('Error fetching meals:', mealsError)
      }

      // Fetch water logs from fitness_water_logs (real table)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: waterLogs, error: waterError } = await (supabase as any)
        .from('fitness_water_logs')
        .select('id, data, quantidade_ml')
        .eq('user_id', user.id)
        .gte('data', startStr)
        .lte('data', endStr)

      if (waterError) {
        console.error('Error fetching water logs:', waterError)
      }

      // Body measurements - fetched from profile instead (table doesn't exist yet)
      // For now we use the profile's current weight data
      const bodyMeasurements: SupabaseRow[] = []

      // Fetch user profile for goals
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profile } = await (supabase as any)
        .from('fitness_profiles')
        .select('meta_calorias_diarias, meta_proteina_g, meta_agua_ml, streak_atual, maior_streak, pontos_totais')
        .eq('id', user.id)
        .single()

      // Calculate metrics
      const daysInPeriod = getDaysInRange(range).length
      const workoutsData = (workouts || []) as SupabaseRow[]
      const completedWorkouts = workoutsData.filter(w => w.status === 'concluido').length
      const plannedWorkouts = Math.max(daysInPeriod, workoutsData.length)

      const totalMinutes = workoutsData.reduce((sum, w) => sum + (w.duracao_minutos || 0), 0)
      const totalCaloriesBurned = workoutsData.reduce((sum, w) => sum + (w.calorias_estimadas || 0), 0)

      // Nutrition averages - group by date to get daily totals
      const mealsData = (meals || []) as SupabaseRow[]
      const nutritionByDate = new Map<string, { calorias: number; proteinas: number; carboidratos: number; gorduras: number }>()

      mealsData.forEach(m => {
        const date = m.data
        const existing = nutritionByDate.get(date) || { calorias: 0, proteinas: 0, carboidratos: 0, gorduras: 0 }
        nutritionByDate.set(date, {
          calorias: existing.calorias + (m.calorias_total || 0),
          proteinas: existing.proteinas + (m.proteinas_total || 0),
          carboidratos: existing.carboidratos + (m.carboidratos_total || 0),
          gorduras: existing.gorduras + (m.gorduras_total || 0)
        })
      })

      const nutritionDays = nutritionByDate.size || 1
      const dailyNutrition = Array.from(nutritionByDate.values())
      const avgCalories = dailyNutrition.reduce((sum, n) => sum + n.calorias, 0) / nutritionDays
      const avgProtein = dailyNutrition.reduce((sum, n) => sum + n.proteinas, 0) / nutritionDays
      const avgCarbs = dailyNutrition.reduce((sum, n) => sum + n.carboidratos, 0) / nutritionDays
      const avgFat = dailyNutrition.reduce((sum, n) => sum + n.gorduras, 0) / nutritionDays

      // Target calculations from profile or defaults
      const calorieTarget = profile?.meta_calorias_diarias || 2500
      const proteinTarget = profile?.meta_proteina_g || 170
      const waterTarget = profile?.meta_agua_ml || 3000

      const daysOnCalorieTarget = dailyNutrition.filter(n =>
        n.calorias >= calorieTarget * 0.9 && n.calorias <= calorieTarget * 1.1
      ).length
      const daysOnProteinTarget = dailyNutrition.filter(n => n.proteinas >= proteinTarget).length

      // Water calculations
      const waterData = (waterLogs || []) as SupabaseRow[]
      const waterByDay = new Map<string, number>()
      waterData.forEach(w => {
        const current = waterByDay.get(w.data) || 0
        waterByDay.set(w.data, current + (w.quantidade_ml || 0))
      })
      const waterDays = waterByDay.size || 1
      const totalWaterMl = Array.from(waterByDay.values()).reduce((sum, v) => sum + v, 0)
      const avgWaterDaily = totalWaterMl / waterDays / 1000 // Convert to liters
      const daysOnWaterTarget = Array.from(waterByDay.values()).filter(v => v >= waterTarget).length

      // Body measurements
      const bodyData = (bodyMeasurements || []) as SupabaseRow[]
      const firstMeasurement = bodyData[0]
      const lastMeasurement = bodyData[bodyData.length - 1]

      // Calculate daily scores based on completion
      const dailyScores: Array<{ date: string; score: number }> = []
      const daysInRangeArr = getDaysInRange(range)

      daysInRangeArr.forEach(day => {
        const dateStr = format(day, 'yyyy-MM-dd')
        let score = 0

        // Workout score (40 points)
        const dayWorkout = workoutsData.find(w => w.data === dateStr && w.status === 'concluido')
        if (dayWorkout) score += 40

        // Nutrition score (30 points) - if logged meals for this day
        const dayNutrition = nutritionByDate.get(dateStr)
        if (dayNutrition) {
          score += 15 // Base points for logging
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

        dailyScores.push({ date: dateStr, score })
      })

      const scores = dailyScores.map(s => s.score)
      const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
      const bestScore = scores.length > 0 ? Math.max(...scores) : 0
      const worstScore = scores.length > 0 ? Math.min(...scores) : 0
      const perfectDays = scores.filter(s => s >= 95).length

      // Gamification from profile
      const xpGained = profile?.pontos_totais || 0

      return {
        period,
        dateRange: range,
        workouts: {
          completed: completedWorkouts,
          planned: Math.max(plannedWorkouts, completedWorkouts),
          completionRate: plannedWorkouts > 0 ? Math.round((completedWorkouts / plannedWorkouts) * 100) : 0,
          totalMinutes,
          totalCalories: totalCaloriesBurned,
          prsCount: prs?.length || 0
        },
        nutrition: {
          avgCalories: Math.round(avgCalories),
          avgProtein: Math.round(avgProtein),
          avgCarbs: Math.round(avgCarbs),
          avgFat: Math.round(avgFat),
          daysOnCalorieTarget,
          daysOnProteinTarget,
          totalMealsLogged: mealsData.length
        },
        hydration: {
          avgDaily: Math.round(avgWaterDaily * 10) / 10,
          totalLiters: Math.round(totalWaterMl / 100) / 10,
          daysOnTarget: daysOnWaterTarget,
          targetRate: waterDays > 0 ? Math.round((daysOnWaterTarget / waterDays) * 100) : 0
        },
        body: {
          startWeight: firstMeasurement?.peso || null,
          endWeight: lastMeasurement?.peso || null,
          weightChange: firstMeasurement?.peso && lastMeasurement?.peso
            ? Math.round((lastMeasurement.peso - firstMeasurement.peso) * 10) / 10
            : null,
          startFat: firstMeasurement?.percentual_gordura || null,
          endFat: lastMeasurement?.percentual_gordura || null,
          fatChange: firstMeasurement?.percentual_gordura && lastMeasurement?.percentual_gordura
            ? Math.round((lastMeasurement.percentual_gordura - firstMeasurement.percentual_gordura) * 10) / 10
            : null,
          startMuscle: firstMeasurement?.massa_muscular || null,
          endMuscle: lastMeasurement?.massa_muscular || null,
          muscleChange: firstMeasurement?.massa_muscular && lastMeasurement?.massa_muscular
            ? Math.round((lastMeasurement.massa_muscular - firstMeasurement.massa_muscular) * 10) / 10
            : null
        },
        score: {
          average: Math.round(avgScore),
          best: bestScore,
          worst: worstScore,
          perfectDays,
          dailyScores
        },
        gamification: {
          xpGained,
          levelsGained: Math.floor(xpGained / 1000),
          achievementsUnlocked: 0, // Would need separate table
          currentStreak: profile?.streak_atual || 0,
          bestStreak: profile?.maior_streak || 0
        }
      }
    } catch (err) {
      console.error('Error fetching summary:', err)
      return getEmptySummary(period, range)
    }
  }, [supabase, period])

  const getEmptySummary = (currentPeriod: ReportPeriod, range: DateRange): PeriodSummary => ({
    period: currentPeriod,
    dateRange: range,
    workouts: {
      completed: 0,
      planned: 7,
      completionRate: 0,
      totalMinutes: 0,
      totalCalories: 0,
      prsCount: 0
    },
    nutrition: {
      avgCalories: 0,
      avgProtein: 0,
      avgCarbs: 0,
      avgFat: 0,
      daysOnCalorieTarget: 0,
      daysOnProteinTarget: 0,
      totalMealsLogged: 0
    },
    hydration: {
      avgDaily: 0,
      totalLiters: 0,
      daysOnTarget: 0,
      targetRate: 0
    },
    body: {
      startWeight: null,
      endWeight: null,
      weightChange: null,
      startFat: null,
      endFat: null,
      fatChange: null,
      startMuscle: null,
      endMuscle: null,
      muscleChange: null
    },
    score: {
      average: 0,
      best: 0,
      worst: 0,
      perfectDays: 0,
      dailyScores: []
    },
    gamification: {
      xpGained: 0,
      levelsGained: 0,
      achievementsUnlocked: 0,
      currentStreak: 0,
      bestStreak: 0
    }
  })

  const getPreviousRange = useCallback((currentRange: DateRange, currentPeriod: ReportPeriod): DateRange => {
    switch (currentPeriod) {
      case 'week':
        return {
          start: subWeeks(currentRange.start, 1),
          end: subWeeks(currentRange.end, 1)
        }
      case 'month':
        return {
          start: subMonths(currentRange.start, 1),
          end: subMonths(currentRange.end, 1)
        }
      default:
        return {
          start: subMonths(currentRange.start, 1),
          end: subMonths(currentRange.end, 1)
        }
    }
  }, [])

  const calculateTrends = useCallback((current: PeriodSummary, previous: PeriodSummary | null): Record<string, Trend> => {
    if (!previous) return {}

    return {
      workouts: calculateTrend(current.workouts.completed, previous.workouts.completed),
      calories: calculateTrend(current.nutrition.avgCalories, previous.nutrition.avgCalories),
      protein: calculateTrend(current.nutrition.avgProtein, previous.nutrition.avgProtein),
      water: calculateTrend(current.hydration.avgDaily, previous.hydration.avgDaily),
      score: calculateTrend(current.score.average, previous.score.average)
    }
  }, [])

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const range = getDateRangeForPeriod(period)
      setDateRange(range)

      const currentSummary = await fetchSummary(range)
      setSummary(currentSummary)

      if (currentSummary) {
        const prevRange = getPreviousRange(range, period)
        const prevSummary = await fetchSummary(prevRange)
        setPreviousSummary(prevSummary)

        const calculatedTrends = calculateTrends(currentSummary, prevSummary)
        setTrends(calculatedTrends)

        const generatedInsights = generateInsightsFromSummary(currentSummary, prevSummary)
        setInsights(generatedInsights)
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch analytics'))
    } finally {
      setLoading(false)
    }
  }, [period, fetchSummary, getPreviousRange, calculateTrends])

  useEffect(() => {
    refresh()
  }, [refresh])

  return {
    summary,
    trends,
    insights,
    period,
    setPeriod,
    dateRange,
    comparison: null,
    previousSummary,
    loading,
    error,
    refresh
  }
}
