'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  getMonthDateRange,
  calculateTrend,
  generateExecutiveSummary,
  calculateMonthRanking
} from '@/lib/reports'
import { generateInsightsFromSummary } from '@/lib/reports/insights-engine'
import type { MonthlyReport, UseMonthlyReportReturn, PeriodSummary, Trend } from '@/types/reports'
import { format, getMonth, getYear, getWeek, endOfWeek, eachWeekOfInterval, eachDayOfInterval } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseRow = Record<string, any>

export function useMonthlyReport(): UseMonthlyReportReturn {
  const now = new Date()
  const [currentMonth, setCurrentMonth] = useState(getMonth(now) + 1)
  const [currentYear, setCurrentYear] = useState(getYear(now))
  const [report, setReport] = useState<MonthlyReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const supabase = createClient()

  const fetchMonthlyReport = useCallback(async (month: number, year: number): Promise<MonthlyReport | null> => {
    const dateRange = getMonthDateRange(month, year)
    const startStr = format(dateRange.start, 'yyyy-MM-dd')
    const endStr = format(dateRange.end, 'yyyy-MM-dd')

    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        console.log('User not authenticated')
        return getEmptyMonthlyReport(month, year, dateRange)
      }

      // Fetch workouts from fitness_workouts
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: workouts } = await (supabase as any)
        .from('fitness_workouts')
        .select('id, data, duracao_minutos, calorias_estimadas, status')
        .eq('user_id', user.id)
        .gte('data', startStr)
        .lte('data', endStr)

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
            exercicio:fitness_exercises(nome)
          )
        `)
        .eq('is_pr', true)
        .gte('created_at', startStr)
        .lte('created_at', endStr + 'T23:59:59')

      // Fetch meals from fitness_meals
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: meals } = await (supabase as any)
        .from('fitness_meals')
        .select('id, data, calorias_total, proteinas_total, carboidratos_total, gorduras_total')
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
        .select('meta_calorias_diarias, meta_proteina_g, meta_agua_ml, streak_atual, maior_streak, pontos_totais')
        .eq('id', user.id)
        .single()

      // Type cast all data
      const workoutsData = (workouts || []) as SupabaseRow[]
      const prsData = (prs || []) as SupabaseRow[]
      const mealsData = (meals || []) as SupabaseRow[]
      const waterData = (waterLogs || []) as SupabaseRow[]

      // Calculate all metrics
      const daysInMonth = eachDayOfInterval({ start: dateRange.start, end: dateRange.end }).length
      const completedWorkouts = workoutsData.filter(w => w.status === 'concluido').length
      const totalMinutes = workoutsData.reduce((sum, w) => sum + (w.duracao_minutos || 0), 0)
      const totalCalories = workoutsData.reduce((sum, w) => sum + (w.calorias_estimadas || 0), 0)

      // Nutrition - group by date
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

      // Targets from profile
      const calorieTarget = profile?.meta_calorias_diarias || 2500
      const proteinTarget = profile?.meta_proteina_g || 170
      const waterTarget = profile?.meta_agua_ml || 3000

      const daysOnCalorieTarget = dailyNutrition.filter(n =>
        n.calorias >= calorieTarget * 0.9 && n.calorias <= calorieTarget * 1.1
      ).length
      const daysOnProteinTarget = dailyNutrition.filter(n => n.proteinas >= proteinTarget).length

      // Water
      const waterByDay = new Map<string, number>()
      waterData.forEach(w => {
        const current = waterByDay.get(w.data) || 0
        waterByDay.set(w.data, current + (w.quantidade_ml || 0))
      })
      const totalWaterMl = Array.from(waterByDay.values()).reduce((sum, v) => sum + v, 0)
      const avgWaterDaily = waterByDay.size > 0 ? totalWaterMl / waterByDay.size / 1000 : 0
      const daysOnWaterTarget = Array.from(waterByDay.values()).filter(v => v >= waterTarget).length

      // Calculate daily scores
      const days = eachDayOfInterval({ start: dateRange.start, end: dateRange.end })
      const dailyScores: Array<{ date: string; score: number }> = []

      days.forEach(day => {
        const dateStr = format(day, 'yyyy-MM-dd')
        let score = 0

        const dayWorkout = workoutsData.find(w => w.data === dateStr && w.status === 'concluido')
        if (dayWorkout) score += 40

        const dayNutrition = nutritionByDate.get(dateStr)
        if (dayNutrition) {
          score += 15
          if (dayNutrition.proteinas >= proteinTarget) score += 15
        }

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

      const summary: PeriodSummary = {
        period: 'month',
        dateRange,
        workouts: {
          completed: completedWorkouts,
          planned: daysInMonth,
          completionRate: Math.round((completedWorkouts / daysInMonth) * 100),
          totalMinutes,
          totalCalories,
          prsCount: prsData.length
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
          targetRate: waterByDay.size > 0 ? Math.round((daysOnWaterTarget / waterByDay.size) * 100) : 0
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
          average: Math.round(avgScore),
          best: scores.length > 0 ? Math.max(...scores) : 0,
          worst: scores.length > 0 ? Math.min(...scores) : 0,
          perfectDays: scores.filter(s => s >= 95).length,
          dailyScores
        },
        gamification: {
          xpGained: profile?.pontos_totais || 0,
          levelsGained: Math.floor((profile?.pontos_totais || 0) / 1000),
          achievementsUnlocked: 0,
          currentStreak: profile?.streak_atual || 0,
          bestStreak: profile?.maior_streak || 0
        }
      }

      // Weekly progression
      const weeks = eachWeekOfInterval({ start: dateRange.start, end: dateRange.end }, { weekStartsOn: 1 })
      const workoutDates = new Set(workoutsData.filter(w => w.status === 'concluido').map(w => w.data))

      const weeklyProgression = weeks.map(weekStart => {
        const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
        const weekNum = getWeek(weekStart, { weekStartsOn: 1 })

        const weekScores = dailyScores.filter(s => {
          const d = new Date(s.date)
          return d >= weekStart && d <= weekEnd
        })

        const weekWorkoutCount = Array.from(workoutDates).filter(date => {
          const d = new Date(date)
          return d >= weekStart && d <= weekEnd
        }).length

        const weekNutrition = Array.from(nutritionByDate.entries()).filter(([date]) => {
          const d = new Date(date)
          return d >= weekStart && d <= weekEnd
        })

        const weekAvgProtein = weekNutrition.length > 0
          ? weekNutrition.reduce((sum, [, n]) => sum + n.proteinas, 0) / weekNutrition.length
          : 0

        return {
          week: weekNum,
          score: weekScores.length > 0
            ? Math.round(weekScores.reduce((sum, s) => sum + s.score, 0) / weekScores.length)
            : 0,
          workouts: weekWorkoutCount,
          avgProtein: Math.round(weekAvgProtein)
        }
      })

      // Activity heatmap
      const activityHeatmap = days.map(day => {
        const dateStr = format(day, 'yyyy-MM-dd')
        const scoreEntry = dailyScores.find(s => s.date === dateStr)
        let activities = 0
        if (workoutDates.has(dateStr)) activities++
        if (nutritionByDate.has(dateStr)) activities++
        if ((waterByDay.get(dateStr) || 0) >= waterTarget) activities++

        return { date: dateStr, activities, score: scoreEntry?.score || 0 }
      })

      // PRs
      const formattedPrs = prsData.map(pr => ({
        exercise: pr.workout_exercise?.exercicio?.nome || 'Exercício',
        weight: pr.peso as number,
        reps: pr.repeticoes as number,
        date: format(new Date(pr.created_at), 'yyyy-MM-dd'),
        improvement: 0
      }))

      // Generate executive summary and ranking
      const trends: Record<string, Trend> = {
        workouts: calculateTrend(completedWorkouts, 0),
        calories: calculateTrend(avgCalories, 0),
        protein: calculateTrend(avgProtein, 0),
        water: calculateTrend(avgWaterDaily, 0),
        score: calculateTrend(avgScore, 0)
      }

      const executiveSummary = generateExecutiveSummary(avgScore, trends)
      const ranking = calculateMonthRanking(avgScore, [])

      const insights = generateInsightsFromSummary(summary, null)

      return {
        month,
        year,
        dateRange,
        executiveSummary,
        overallScore: Math.round(avgScore),
        ranking,
        summary,
        weeklyProgression,
        prs: formattedPrs,
        activityHeatmap,
        comparison: {
          workouts: trends.workouts,
          calories: trends.calories,
          protein: trends.protein,
          water: trends.water,
          weight: undefined,
          score: trends.score
        },
        insights
      }
    } catch (err) {
      console.error('Error fetching monthly report:', err)
      return getEmptyMonthlyReport(month, year, dateRange)
    }
  }, [supabase])

  const getEmptyMonthlyReport = (month: number, year: number, dateRange: { start: Date; end: Date }): MonthlyReport => {
    const days = eachDayOfInterval({ start: dateRange.start, end: dateRange.end })
    return {
      month,
      year,
      dateRange,
      executiveSummary: 'Sem dados suficientes para gerar um resumo.',
      overallScore: 0,
      ranking: 'Sem classificação',
      summary: {
        period: 'month',
        dateRange,
        workouts: { completed: 0, planned: days.length, completionRate: 0, totalMinutes: 0, totalCalories: 0, prsCount: 0 },
        nutrition: { avgCalories: 0, avgProtein: 0, avgCarbs: 0, avgFat: 0, daysOnCalorieTarget: 0, daysOnProteinTarget: 0, totalMealsLogged: 0 },
        hydration: { avgDaily: 0, totalLiters: 0, daysOnTarget: 0, targetRate: 0 },
        body: { startWeight: null, endWeight: null, weightChange: null, startFat: null, endFat: null, fatChange: null, startMuscle: null, endMuscle: null, muscleChange: null },
        score: { average: 0, best: 0, worst: 0, perfectDays: 0, dailyScores: [] },
        gamification: { xpGained: 0, levelsGained: 0, achievementsUnlocked: 0, currentStreak: 0, bestStreak: 0 }
      },
      weeklyProgression: [],
      prs: [],
      activityHeatmap: days.map(day => ({ date: format(day, 'yyyy-MM-dd'), activities: 0, score: 0 })),
      comparison: {},
      insights: []
    }
  }

  const goToMonth = useCallback((month: number, year?: number) => {
    setCurrentMonth(month)
    if (year) setCurrentYear(year)
  }, [])

  const nextMonth = useCallback(() => {
    const now = new Date()
    const currentM = getMonth(now) + 1
    const currentY = getYear(now)

    if (currentYear < currentY || (currentYear === currentY && currentMonth < currentM)) {
      if (currentMonth >= 12) {
        setCurrentMonth(1)
        setCurrentYear(y => y + 1)
      } else {
        setCurrentMonth(m => m + 1)
      }
    }
  }, [currentMonth, currentYear])

  const previousMonth = useCallback(() => {
    if (currentMonth <= 1) {
      setCurrentMonth(12)
      setCurrentYear(y => y - 1)
    } else {
      setCurrentMonth(m => m - 1)
    }
  }, [currentMonth])

  const exportPDF = useCallback(async (): Promise<Blob> => {
    const { default: jsPDF } = await import('jspdf')
    const doc = new jsPDF()

    if (report) {
      const monthNames = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
      ]

      doc.setFontSize(20)
      doc.text(`Relatório Mensal - ${monthNames[report.month - 1]} ${report.year}`, 20, 20)

      doc.setFontSize(12)
      doc.text(report.executiveSummary, 20, 35, { maxWidth: 170 })

      doc.setFontSize(16)
      doc.text(`Pontuação: ${report.overallScore}/100`, 20, 55)

      doc.setFontSize(14)
      doc.text('Treino', 20, 75)
      doc.setFontSize(11)
      doc.text(`Treinos: ${report.summary.workouts.completed}/${report.summary.workouts.planned}`, 20, 85)
      doc.text(`Taxa: ${report.summary.workouts.completionRate}%`, 20, 93)

      doc.setFontSize(14)
      doc.text('Nutrição', 110, 75)
      doc.setFontSize(11)
      doc.text(`Média kcal: ${report.summary.nutrition.avgCalories}`, 110, 85)
      doc.text(`Média proteína: ${report.summary.nutrition.avgProtein}g`, 110, 93)

      doc.setFontSize(14)
      doc.text('Hidratação', 20, 115)
      doc.setFontSize(11)
      doc.text(`Média: ${report.summary.hydration.avgDaily}L/dia`, 20, 125)

      doc.setFontSize(8)
      doc.text(`Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} - FeliceFit`, 20, 280)
    }

    return doc.output('blob')
  }, [report])

  useEffect(() => {
    const loadReport = async () => {
      setLoading(true)
      setError(null)
      try {
        const monthlyReport = await fetchMonthlyReport(currentMonth, currentYear)
        setReport(monthlyReport)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load monthly report'))
      } finally {
        setLoading(false)
      }
    }

    loadReport()
  }, [currentMonth, currentYear, fetchMonthlyReport])

  return {
    report,
    loading,
    error,
    currentMonth,
    currentYear,
    goToMonth,
    nextMonth,
    previousMonth,
    exportPDF
  }
}
