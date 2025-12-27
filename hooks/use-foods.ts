"use client"

import { useState, useEffect, useCallback, useMemo } from 'react'
import type { Food, FoodCategory } from '@/lib/nutrition/types'
import { mockFoods } from '@/lib/nutrition/mock-data'

interface UseFoodsReturn {
  foods: Food[]
  favorites: Food[]
  recent: Food[]
  userFoods: Food[]
  search: (query: string) => Food[]
  getByCategory: (category: FoodCategory) => Food[]
  getById: (id: string) => Food | null
  addFood: (food: Omit<Food, 'id' | 'created_at'>) => Promise<Food>
  updateFood: (id: string, data: Partial<Food>) => Promise<void>
  deleteFood: (id: string) => Promise<void>
  toggleFavorite: (id: string) => Promise<void>
  addToRecent: (id: string) => void
  refreshUserFoods: () => Promise<void>
  loading: boolean
}

const RECENT_FOODS_KEY = 'felicefit_recent_foods'
const MAX_RECENT_FOODS = 10

// Converter alimento do banco para o formato Food
function convertDbFoodToFood(dbFood: {
  id: string
  nome: string
  categoria: string
  marca?: string | null
  porcao_padrao: number
  unidade: string
  calorias: number
  proteinas: number
  carboidratos: number
  gorduras: number
  fibras?: number | null
  porcoes_comuns?: Array<{ label: string; grams: number; isDefault?: boolean }> | null
  is_favorite?: boolean
  source?: string
  created_at?: string
}): Food {
  return {
    id: dbFood.id,
    nome: dbFood.nome,
    categoria: dbFood.categoria as FoodCategory,
    marca: dbFood.marca || undefined,
    porcao_padrao: dbFood.porcao_padrao,
    unidade: dbFood.unidade as 'g' | 'ml' | 'unidade',
    calorias: dbFood.calorias,
    proteinas: dbFood.proteinas,
    carboidratos: dbFood.carboidratos,
    gorduras: dbFood.gorduras,
    fibras: dbFood.fibras || undefined,
    porcoes_comuns: dbFood.porcoes_comuns || undefined,
    is_favorite: dbFood.is_favorite || false,
    is_user_created: true,
    source: (dbFood.source as 'manual' | 'ai_analysis') || 'ai_analysis',
    created_at: dbFood.created_at || new Date().toISOString()
  }
}

export function useFoods(): UseFoodsReturn {
  const [foods, setFoods] = useState<Food[]>(mockFoods)
  const [userFoodsFromDb, setUserFoodsFromDb] = useState<Food[]>([])
  const [recentIds, setRecentIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  // Buscar alimentos do usuário da API
  const fetchUserFoods = useCallback(async () => {
    try {
      const response = await fetch('/api/user-foods')
      const data = await response.json()

      if (data.success && data.foods) {
        const converted = data.foods.map(convertDbFoodToFood)
        setUserFoodsFromDb(converted)
      }
    } catch (error) {
      console.error('Erro ao buscar alimentos do usuário:', error)
    }
  }, [])

  // Carregar recentes do localStorage e buscar alimentos do usuário
  useEffect(() => {
    const saved = localStorage.getItem(RECENT_FOODS_KEY)
    if (saved) {
      try {
        setRecentIds(JSON.parse(saved))
      } catch {
        localStorage.removeItem(RECENT_FOODS_KEY)
      }
    }

    // Buscar alimentos do usuário
    fetchUserFoods().finally(() => setLoading(false))
  }, [fetchUserFoods])

  // Mesclar alimentos mock com alimentos do usuário
  useEffect(() => {
    // Combinar mock foods com user foods (user foods primeiro para prioridade)
    const allFoods = [...userFoodsFromDb, ...mockFoods]
    setFoods(allFoods)
  }, [userFoodsFromDb])

  // Salvar recentes no localStorage
  useEffect(() => {
    if (recentIds.length > 0) {
      localStorage.setItem(RECENT_FOODS_KEY, JSON.stringify(recentIds))
    }
  }, [recentIds])

  // Favoritos
  const favorites = useMemo(() => {
    return foods.filter(f => f.is_favorite)
  }, [foods])

  // Recentes
  const recent = useMemo(() => {
    return recentIds
      .map(id => foods.find(f => f.id === id))
      .filter(Boolean) as Food[]
  }, [foods, recentIds])

  // Alimentos criados pelo usuário
  const userFoods = useMemo(() => {
    return foods.filter(f => f.is_user_created)
  }, [foods])

  // Buscar
  const search = useCallback(
    (query: string): Food[] => {
      if (!query.trim()) return []
      const lowerQuery = query.toLowerCase()
      return foods.filter(
        f =>
          f.nome.toLowerCase().includes(lowerQuery) ||
          f.marca?.toLowerCase().includes(lowerQuery) ||
          f.categoria.toLowerCase().includes(lowerQuery)
      )
    },
    [foods]
  )

  // Por categoria
  const getByCategory = useCallback(
    (category: FoodCategory): Food[] => {
      return foods.filter(f => f.categoria === category)
    },
    [foods]
  )

  // Por ID
  const getById = useCallback(
    (id: string): Food | null => {
      return foods.find(f => f.id === id) || null
    },
    [foods]
  )

  // Adicionar alimento (via API para alimentos do usuário)
  const addFood = useCallback(
    async (food: Omit<Food, 'id' | 'created_at'>): Promise<Food> => {
      try {
        const response = await fetch('/api/user-foods', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nome: food.nome,
            categoria: food.categoria,
            marca: food.marca,
            porcao_padrao: food.porcao_padrao,
            unidade: food.unidade,
            calorias: food.calorias,
            proteinas: food.proteinas,
            carboidratos: food.carboidratos,
            gorduras: food.gorduras,
            fibras: food.fibras,
            porcoes_comuns: food.porcoes_comuns
          })
        })

        const data = await response.json()

        if (data.success && data.food) {
          const newFood = convertDbFoodToFood(data.food)
          setUserFoodsFromDb(prev => [...prev, newFood])
          return newFood
        } else {
          throw new Error(data.error || 'Erro ao salvar alimento')
        }
      } catch (error) {
        console.error('Erro ao adicionar alimento:', error)
        // Fallback local se API falhar
        const newFood: Food = {
          ...food,
          id: `food-user-${Date.now()}`,
          is_user_created: true,
          created_at: new Date().toISOString()
        }
        setFoods(prev => [...prev, newFood])
        return newFood
      }
    },
    []
  )

  // Atualizar alimento (via API para alimentos do usuário)
  const updateFood = useCallback(async (id: string, data: Partial<Food>) => {
    // Verificar se é alimento do usuário (tem UUID válido)
    const isUserFood = userFoodsFromDb.some(f => f.id === id)

    if (isUserFood) {
      try {
        const response = await fetch('/api/user-foods', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, ...data })
        })

        const result = await response.json()

        if (result.success) {
          setUserFoodsFromDb(prev =>
            prev.map(food => (food.id === id ? { ...food, ...data } : food))
          )
        }
      } catch (error) {
        console.error('Erro ao atualizar alimento:', error)
      }
    } else {
      // Alimento mock - atualizar localmente
      setFoods(prev =>
        prev.map(food => (food.id === id ? { ...food, ...data } : food))
      )
    }
  }, [userFoodsFromDb])

  // Deletar alimento (via API para alimentos do usuário)
  const deleteFood = useCallback(async (id: string) => {
    // Verificar se é alimento do usuário
    const isUserFood = userFoodsFromDb.some(f => f.id === id)

    if (isUserFood) {
      try {
        const response = await fetch(`/api/user-foods?id=${id}`, {
          method: 'DELETE'
        })

        const result = await response.json()

        if (result.success) {
          setUserFoodsFromDb(prev => prev.filter(food => food.id !== id))
        }
      } catch (error) {
        console.error('Erro ao deletar alimento:', error)
      }
    } else {
      // Alimento mock - remover localmente
      setFoods(prev => prev.filter(food => food.id !== id))
    }
  }, [userFoodsFromDb])

  // Toggle favorito (via API para alimentos do usuário)
  const toggleFavorite = useCallback(async (id: string) => {
    // Encontrar o alimento atual
    const currentFood = foods.find(f => f.id === id)
    if (!currentFood) return

    const newFavoriteValue = !currentFood.is_favorite

    // Verificar se é alimento do usuário
    const isUserFood = userFoodsFromDb.some(f => f.id === id)

    if (isUserFood) {
      // Atualizar otimisticamente
      setUserFoodsFromDb(prev =>
        prev.map(food =>
          food.id === id ? { ...food, is_favorite: newFavoriteValue } : food
        )
      )

      try {
        const response = await fetch('/api/user-foods', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, is_favorite: newFavoriteValue })
        })

        const result = await response.json()

        if (!result.success) {
          // Reverter se falhar
          setUserFoodsFromDb(prev =>
            prev.map(food =>
              food.id === id ? { ...food, is_favorite: !newFavoriteValue } : food
            )
          )
          console.error('Erro ao atualizar favorito:', result.error)
        }
      } catch (error) {
        // Reverter se falhar
        setUserFoodsFromDb(prev =>
          prev.map(food =>
            food.id === id ? { ...food, is_favorite: !newFavoriteValue } : food
          )
        )
        console.error('Erro ao atualizar favorito:', error)
      }
    } else {
      // Alimento mock - atualizar localmente
      setFoods(prev =>
        prev.map(food =>
          food.id === id ? { ...food, is_favorite: newFavoriteValue } : food
        )
      )
    }
  }, [foods, userFoodsFromDb])

  // Adicionar aos recentes
  const addToRecent = useCallback((id: string) => {
    setRecentIds(prev => {
      const filtered = prev.filter(fid => fid !== id)
      return [id, ...filtered].slice(0, MAX_RECENT_FOODS)
    })
  }, [])

  return {
    foods,
    favorites,
    recent,
    userFoods,
    search,
    getByCategory,
    getById,
    addFood,
    updateFood,
    deleteFood,
    toggleFavorite,
    addToRecent,
    refreshUserFoods: fetchUserFoods,
    loading
  }
}
