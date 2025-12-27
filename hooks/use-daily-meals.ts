"use client"

import { useState, useEffect, useMemo, useCallback } from 'react'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import type {
  Meal,
  MealItem,
  PlannedMeal,
  NutritionTotals,
  NutritionGoals,
  NutritionProgress,
  MealType
} from '@/lib/nutrition/types'
import { leonardoGoals, leonardoMealPlan } from '@/lib/nutrition/types'
import { calculateNutritionProgress } from '@/lib/nutrition/calculations'

interface UseDailyMealsReturn {
  meals: Meal[]
  plannedMeals: PlannedMeal[]
  totals: NutritionTotals
  goals: NutritionGoals
  progress: NutritionProgress
  nextMeal: PlannedMeal | null
  loading: boolean
  error: Error | null
  addMeal: (meal: Omit<Meal, 'id' | 'created_at'>) => Promise<void>
  updateMeal: (id: string, data: Partial<Meal>) => Promise<void>
  deleteMeal: (id: string) => Promise<void>
  refresh: () => Promise<void>
}

export function useDailyMeals(date?: Date): UseDailyMealsReturn {
  const targetDate = date || new Date()
  const dateStr = format(targetDate, 'yyyy-MM-dd')

  const [meals, setMeals] = useState<Meal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const supabase = createClient()

  // Carregar refeições do dia do banco de dados
  const loadMeals = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        // Se não está logado, mostrar array vazio
        setMeals([])
        return
      }

      // Buscar refeições reais do banco com os itens
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: mealsData, error: mealsError } = await (supabase as any)
        .from('fitness_meals')
        .select('*, itens:fitness_meal_items(*)')
        .eq('user_id', user.id)
        .eq('data', dateStr)
        .order('horario', { ascending: true })

      if (mealsError) {
        console.error('Error loading meals:', mealsError)
        setMeals([])
        return
      }

      // Converter dados do banco para o formato Meal
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const convertedMeals: Meal[] = (mealsData || []).map((m: any) => {
        // Converter itens do banco para o formato MealItem
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const convertedItems: MealItem[] = (m.itens || []).map((item: any) => ({
          id: item.id,
          food_id: item.food_id || item.id,
          food: {
            id: item.food_id || item.id,
            nome: item.nome_alimento,
            categoria: 'outros' as const,
            porcao_padrao: item.quantidade || 100,
            unidade: (item.unidade || 'g') as 'g' | 'ml' | 'unidade',
            calorias: item.calorias || 0,
            proteinas: item.proteinas || 0,
            carboidratos: item.carboidratos || 0,
            gorduras: item.gorduras || 0
          },
          quantidade: item.quantidade || 100,
          calorias: item.calorias || 0,
          proteinas: item.proteinas || 0,
          carboidratos: item.carboidratos || 0,
          gorduras: item.gorduras || 0
        }))

        return {
          id: m.id,
          user_id: m.user_id,
          tipo: m.tipo_refeicao as MealType,
          data: m.data,
          horario_planejado: m.horario || undefined,
          horario_real: m.horario || undefined,
          status: 'concluido' as const,
          itens: convertedItems,
          calorias_total: m.calorias_total || 0,
          proteinas_total: m.proteinas_total || 0,
          carboidratos_total: m.carboidratos_total || 0,
          gorduras_total: m.gorduras_total || 0,
          foto_url: m.foto_url || undefined,
          notas: m.analise_ia || m.notas || undefined,
          created_at: m.created_at
        }
      })

      setMeals(convertedMeals)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao carregar refeições'))
      setMeals([])
    } finally {
      setLoading(false)
    }
  }, [dateStr, supabase])

  useEffect(() => {
    loadMeals()
  }, [loadMeals])

  // Calcular totais
  const totals = useMemo((): NutritionTotals => {
    return meals.reduce(
      (acc, meal) => ({
        calorias: acc.calorias + (meal.calorias_total || 0),
        proteinas: acc.proteinas + (meal.proteinas_total || 0),
        carboidratos: acc.carboidratos + (meal.carboidratos_total || 0),
        gorduras: acc.gorduras + (meal.gorduras_total || 0)
      }),
      { calorias: 0, proteinas: 0, carboidratos: 0, gorduras: 0 }
    )
  }, [meals])

  // Metas do usuário (por enquanto hardcoded para Leonardo)
  const goals = leonardoGoals

  // Calcular progresso
  const progress = useMemo(() => {
    return calculateNutritionProgress(totals, goals)
  }, [totals, goals])

  // Plano de refeições
  const plannedMeals = leonardoMealPlan

  // Identificar próxima refeição
  const nextMeal = useMemo(() => {
    const now = new Date()
    const currentTimeStr = format(now, 'HH:mm')

    // Encontrar refeições que ainda não foram concluídas
    const completedTypes = new Set(
      meals.filter(m => m.status === 'concluido').map(m => m.tipo)
    )

    // Encontrar a próxima refeição planejada não concluída
    for (const planned of plannedMeals) {
      if (!completedTypes.has(planned.tipo)) {
        // Se ainda não passou do horário ou passou há pouco tempo
        if (planned.horario >= currentTimeStr || isWithinWindow(planned.horario, currentTimeStr)) {
          return planned
        }
      }
    }

    return null
  }, [meals, plannedMeals])

  // Verificar se está dentro de uma janela de tempo razoável (1h)
  function isWithinWindow(plannedTime: string, currentTime: string): boolean {
    const [plannedHour, plannedMin] = plannedTime.split(':').map(Number)
    const [currentHour, currentMin] = currentTime.split(':').map(Number)

    const plannedMinutes = plannedHour * 60 + plannedMin
    const currentMinutes = currentHour * 60 + currentMin

    // Se passou menos de 60 minutos, ainda considera como "próxima"
    return currentMinutes - plannedMinutes < 60 && currentMinutes >= plannedMinutes
  }

  // Adicionar refeição
  const addMeal = useCallback(async (meal: Omit<Meal, 'id' | 'created_at'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Usuário não autenticado')
      }

      console.log('=== addMeal: SALVANDO REFEIÇÃO ===')
      console.log('meal.itens:', meal.itens)
      console.log('meal.itens.length:', meal.itens?.length)

      // Preparar dados para o banco
      const mealData = {
        user_id: user.id,
        data: meal.data,
        tipo_refeicao: meal.tipo,
        horario: meal.horario_real || meal.horario_planejado,
        calorias_total: meal.calorias_total,
        proteinas_total: meal.proteinas_total,
        carboidratos_total: meal.carboidratos_total,
        gorduras_total: meal.gorduras_total,
        notas: meal.notas || null
      }

      // Inserir refeição no banco
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('fitness_meals')
        .insert(mealData)
        .select()
        .single()

      if (error) {
        console.error('Error saving meal:', error)
        throw error
      }

      console.log('Refeição salva com ID:', data.id)

      // SALVAR OS ITENS DA REFEIÇÃO
      if (meal.itens && meal.itens.length > 0) {
        console.log('=== addMeal: SALVANDO ITENS ===')
        for (const item of meal.itens) {
          // Verificar se food_id é um UUID válido (formato: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
          const isValidUUID = item.food_id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.food_id)

          const itemToInsert = {
            meal_id: data.id,
            food_id: isValidUUID ? item.food_id : null, // Só envia se for UUID válido
            nome_alimento: item.food?.nome || 'Alimento',
            quantidade: Math.round(item.quantidade || 100),
            unidade: item.food?.unidade || 'g',
            calorias: Math.round(item.calorias || 0),
            proteinas: Math.round(item.proteinas || 0),
            carboidratos: Math.round(item.carboidratos || 0),
            gorduras: Math.round(item.gorduras || 0)
          }

          console.log('Inserindo item:', itemToInsert)

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { error: itemError } = await (supabase as any)
            .from('fitness_meal_items')
            .insert(itemToInsert)

          if (itemError) {
            console.error('Erro ao salvar item:', item.food?.nome, itemError)
            // Continuar mesmo com erro para salvar outros itens
          } else {
            console.log('Item salvo:', item.food?.nome)
          }
        }
        console.log('=== addMeal: ITENS SALVOS ===')
      } else {
        console.log('Nenhum item para salvar')
      }

      // Converter para formato Meal e adicionar ao estado
      const newMeal: Meal = {
        id: data.id,
        user_id: data.user_id,
        tipo: data.tipo_refeicao as MealType,
        data: data.data,
        horario_planejado: data.horario || undefined,
        horario_real: data.horario || undefined,
        status: 'concluido' as const,
        itens: meal.itens || [],
        calorias_total: data.calorias_total || 0,
        proteinas_total: data.proteinas_total || 0,
        carboidratos_total: data.carboidratos_total || 0,
        gorduras_total: data.gorduras_total || 0,
        notas: data.notas || undefined,
        created_at: data.created_at
      }

      setMeals(prev => [...prev, newMeal])
      console.log('=== addMeal: CONCLUÍDO ===')
    } catch (err) {
      console.error('Error adding meal:', err)
      throw err
    }
  }, [supabase])

  // Atualizar refeição
  const updateMeal = useCallback(async (id: string, data: Partial<Meal>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Usuário não autenticado')
      }

      // Preparar dados para atualização no banco
      const updateData: Record<string, unknown> = {}
      if (data.calorias_total !== undefined) updateData.calorias_total = data.calorias_total
      if (data.proteinas_total !== undefined) updateData.proteinas_total = data.proteinas_total
      if (data.carboidratos_total !== undefined) updateData.carboidratos_total = data.carboidratos_total
      if (data.gorduras_total !== undefined) updateData.gorduras_total = data.gorduras_total
      if (data.notas !== undefined) updateData.notas = data.notas
      if (data.status !== undefined) updateData.status = data.status
      if (data.horario_real !== undefined) updateData.horario = data.horario_real

      // Atualizar no banco
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('fitness_meals')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) {
        console.error('Error updating meal:', error)
        throw error
      }

      // Atualizar estado local
      setMeals(prev =>
        prev.map(meal => (meal.id === id ? { ...meal, ...data } : meal))
      )
    } catch (err) {
      console.error('Error updating meal:', err)
      throw err
    }
  }, [supabase])

  // Deletar refeição
  const deleteMeal = useCallback(async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Usuário não autenticado')
      }

      // Deletar itens da refeição primeiro
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('fitness_meal_items')
        .delete()
        .eq('meal_id', id)

      // Deletar a refeição
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('fitness_meals')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) {
        console.error('Error deleting meal:', error)
        throw error
      }

      // Atualizar estado local
      setMeals(prev => prev.filter(meal => meal.id !== id))
    } catch (err) {
      console.error('Error deleting meal:', err)
      throw err
    }
  }, [supabase])

  // Refresh
  const refresh = useCallback(async () => {
    await loadMeals()
  }, [loadMeals])

  return {
    meals,
    plannedMeals,
    totals,
    goals,
    progress,
    nextMeal,
    loading,
    error,
    addMeal,
    updateMeal,
    deleteMeal,
    refresh
  }
}
