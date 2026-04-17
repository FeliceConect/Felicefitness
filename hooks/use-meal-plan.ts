"use client"

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format, startOfWeek, addDays, isToday } from 'date-fns'

interface Food {
  name: string
  quantity: number
  unit: string
  calories?: number
  protein?: number
  carbs?: number
  fat?: number
}

// Named alternative with option letter (A, B, C, D, E) and name
interface MealAlternative {
  option: string  // "B", "C", "D", "E"
  name: string    // "Café com pasta de amendoim"
  foods: Food[]
}

interface PlannedMeal {
  id: string
  meal_type: string
  meal_name?: string
  scheduled_time?: string
  foods: Food[]
  total_calories?: number
  total_protein?: number
  total_carbs?: number
  total_fat?: number
  instructions?: string
  // Support both formats: named alternatives (new) and food arrays (legacy)
  alternatives?: MealAlternative[] | Food[][]
  is_completed?: boolean
}

// Dados da refeição realmente consumida
interface CompletedMealData {
  id: string
  meal_type: string
  time: string
  total_calories: number
  total_protein: number
  total_carbs: number
  total_fat: number
  foods: Food[]
  notes?: string
}

interface MealPlanDay {
  id: string
  day_of_week: number
  day_name?: string
  meals: PlannedMeal[]
}

interface MealPlan {
  id: string
  name: string
  description?: string
  goal?: string
  calories_target?: number
  protein_target?: number
  carbs_target?: number
  fat_target?: number
  professional?: {
    id: string
    display_name?: string
    specialty?: string
  }
  days: MealPlanDay[]
}

export function useMealPlan() {
  const [plan, setPlan] = useState<MealPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [completedMealIds, setCompletedMealIds] = useState<string[]>([])
  const [completedMealsData, setCompletedMealsData] = useState<Record<string, CompletedMealData>>({})
  const [isTrainingDay, setIsTrainingDay] = useState(false)
  const supabase = createClient()

  // Buscar plano alimentar ativo
  const fetchPlan = useCallback(async () => {
    try {
      const response = await fetch('/api/client/meal-plan')
      const data = await response.json()
      if (data.success) {
        setPlan(data.plan)
      }
    } catch (error) {
      console.error('Erro ao buscar plano:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Buscar refeições completadas hoje
  const fetchCompletedMeals = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const response = await fetch(`/api/client/meal-plan/complete?date=${today}`)
      const data = await response.json()
      if (data.success) {
        // Usar meal_type como identificador de refeições completadas
        setCompletedMealIds(data.completedMealTypes || [])
        // Armazenar dados completos das refeições (alimentos reais consumidos)
        if (data.completedMealsData) {
          setCompletedMealsData(data.completedMealsData)
        }
      }
    } catch (error) {
      console.error('Erro ao buscar refeições completadas:', error)
    }
  }, [])

  // Verificar se hoje é dia de treino
  const checkTrainingDay = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const today = new Date()
      const todayStr = format(today, 'yyyy-MM-dd')
      const dayOfWeek = today.getDay()

      // Check 1: Treino real realizado ou planejado hoje
      const { data: todayWorkout } = await supabase
        .from('fitness_workouts')
        .select('id')
        .eq('user_id', user.id)
        .eq('data', todayStr)
        .limit(1)
        .single()

      if (todayWorkout) {
        setIsTrainingDay(true)
        return
      }

      // Check 2: Template de treino para este dia da semana
      const { data: template } = await supabase
        .from('fitness_workout_templates')
        .select('id')
        .eq('user_id', user.id)
        .eq('dia_semana', dayOfWeek)
        .eq('is_ativo', true)
        .limit(1)
        .single()

      if (template) {
        setIsTrainingDay(true)
        return
      }

      // Check 3: Programa de treino do profissional (via API para bypass RLS)
      try {
        const response = await fetch('/api/client/training-program')
        if (response.ok) {
          const result = await response.json()
          if (result.success && result.program) {
            const program = result.program
            // Verificar se há treino para hoje no programa
            if (program.weeks && program.weeks.length > 0) {
              const activeWeek = program.weeks[0]
              if (activeWeek.days) {
                const todayDay = activeWeek.days.find(
                  (d: { day_of_week: number; exercises?: unknown[] }) =>
                    d.day_of_week === dayOfWeek && d.exercises && d.exercises.length > 0
                )
                if (todayDay) {
                  setIsTrainingDay(true)
                  return
                }
              }
            }
          }
        }
      } catch {
        // Ignore errors checking professional program
      }

      setIsTrainingDay(false)
    } catch (error) {
      console.error('Erro ao verificar dia de treino:', error)
      setIsTrainingDay(false)
    }
  }, [supabase])

  // Completar refeição
  const completeMeal = useCallback(async (
    meal: PlannedMeal,
    alternativeIndex?: number
  ): Promise<boolean> => {
    try {
      const today = new Date().toISOString().split('T')[0]

      // Get foods from the selected alternative
      let foods: Food[] = meal.foods
      if (alternativeIndex !== undefined && meal.alternatives) {
        const alt = meal.alternatives[alternativeIndex]
        // Check if it's a named alternative or a food array
        if ('foods' in alt && 'option' in alt) {
          // Named alternative (new format)
          foods = (alt as MealAlternative).foods
        } else if (Array.isArray(alt)) {
          // Food array (legacy format)
          foods = alt as Food[]
        }
      }

      const response = await fetch('/api/client/meal-plan/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planMealId: meal.id,
          date: today,
          completedFoods: foods,
          usedAlternative: alternativeIndex !== undefined
        })
      })

      const data = await response.json()
      if (data.success) {
        setCompletedMealIds(prev => [...prev, meal.id])
        return true
      }
      return false
    } catch (error) {
      console.error('Erro ao completar refeição:', error)
      return false
    }
  }, [])

  // Obter refeições do dia atual (filtrando por dia de treino se necessário)
  const getTodayMeals = useCallback((): PlannedMeal[] => {
    if (!plan?.days) return []

    const today = new Date().getDay() // 0 = Sunday, 1 = Monday, etc.
    const todayDay = plan.days.find(d => d.day_of_week === today)

    const meals = todayDay?.meals || []

    // Filter meals based on training day status
    // Note: Meals with is_training_day_only are stored in the DB, we need to check meal metadata
    return meals
  }, [plan])

  useEffect(() => {
    fetchPlan()
    fetchCompletedMeals()
    checkTrainingDay()
  }, [fetchPlan, fetchCompletedMeals, checkTrainingDay])

  return {
    plan,
    loading,
    completedMealIds,
    completedMealsData, // Dados das refeições realmente consumidas
    todayMeals: getTodayMeals(),
    isTrainingDay,
    completeMeal,
    refetch: () => {
      fetchPlan()
      fetchCompletedMeals()
      checkTrainingDay()
    }
  }
}
