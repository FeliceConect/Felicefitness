"use client"

import { useState, useEffect, useCallback } from 'react'

interface Food {
  name: string
  quantity: number
  unit: string
  calories?: number
  protein?: number
  carbs?: number
  fat?: number
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
  alternatives?: Food[][]
  is_completed?: boolean
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
      }
    } catch (error) {
      console.error('Erro ao buscar refeições completadas:', error)
    }
  }, [])

  // Completar refeição
  const completeMeal = useCallback(async (
    meal: PlannedMeal,
    alternativeIndex?: number
  ): Promise<boolean> => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const foods = alternativeIndex !== undefined && meal.alternatives
        ? meal.alternatives[alternativeIndex]
        : meal.foods

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

  // Obter refeições do dia atual
  const getTodayMeals = useCallback((): PlannedMeal[] => {
    if (!plan?.days) return []

    const today = new Date().getDay() // 0 = Sunday, 1 = Monday, etc.
    const todayDay = plan.days.find(d => d.day_of_week === today)

    return todayDay?.meals || []
  }, [plan])

  useEffect(() => {
    fetchPlan()
    fetchCompletedMeals()
  }, [fetchPlan, fetchCompletedMeals])

  return {
    plan,
    loading,
    completedMealIds,
    todayMeals: getTodayMeals(),
    completeMeal,
    refetch: () => {
      fetchPlan()
      fetchCompletedMeals()
    }
  }
}
