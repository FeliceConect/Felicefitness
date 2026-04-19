"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import type { Food, FoodCategory } from '@/lib/nutrition/types'

interface UseFoodsReturn {
  foods: Food[]
  favorites: Food[]
  recent: Food[]
  userFoods: Food[]
  search: (query: string, sources?: string[]) => void
  searchResults: Food[]
  searchLoading: boolean
  getByCategory: (category: FoodCategory, sources?: string[]) => void
  getById: (id: string) => Food | null
  addFood: (food: Omit<Food, 'id' | 'created_at'>) => Promise<Food>
  updateFood: (id: string, data: Partial<Food>) => Promise<void>
  deleteFood: (id: string) => Promise<void>
  toggleFavorite: (id: string) => Promise<void>
  addToRecent: (id: string) => void
  searchByBarcode: (code: string) => Promise<Food | null>
  refreshUserFoods: () => Promise<void>
  loading: boolean
}

const RECENT_FOODS_KEY = 'felicefit_recent_foods'
const MAX_RECENT_FOODS = 10
const DEBOUNCE_MS = 300

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
  is_user_created?: boolean
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
    is_user_created: dbFood.is_user_created || false,
    source: (dbFood.source as 'manual' | 'ai_analysis') || 'manual',
    created_at: dbFood.created_at || new Date().toISOString()
  }
}

export function useFoods(): UseFoodsReturn {
  const [userFoodsFromDb, setUserFoodsFromDb] = useState<Food[]>([])
  const [searchResults, setSearchResults] = useState<Food[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [recentIds, setRecentIds] = useState<string[]>([])
  const [recentFoods, setRecentFoods] = useState<Food[]>([])
  const [loading, setLoading] = useState(true)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

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

    fetchUserFoods().finally(() => setLoading(false))
  }, [fetchUserFoods])

  // Salvar recentes no localStorage
  useEffect(() => {
    if (recentIds.length > 0) {
      localStorage.setItem(RECENT_FOODS_KEY, JSON.stringify(recentIds))
    }
  }, [recentIds])

  // Todos os alimentos locais (apenas user foods, sem mock)
  const foods = useMemo(() => userFoodsFromDb, [userFoodsFromDb])

  // Favoritos
  const favorites = useMemo(() => {
    return foods.filter(f => f.is_favorite)
  }, [foods])

  // Busca server-side com debounce
  const searchApi = useCallback(async (query: string, category?: string, sources?: string[]) => {
    // Cancelar request anterior
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (category) params.set('category', category)
    if (sources && sources.length > 0) params.set('source', sources.join(','))
    params.set('limit', '20')

    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      setSearchLoading(true)
      const response = await fetch(`/api/foods?${params}`, {
        signal: controller.signal,
      })
      const data = await response.json()

      if (data.success && data.foods) {
        setSearchResults(data.foods.map(convertDbFoodToFood))
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Erro na busca:', error)
      }
    } finally {
      setSearchLoading(false)
    }
  }, [])

  // Buscar com debounce
  const search = useCallback(
    (query: string, sources?: string[]) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }

      if (!query.trim() || query.trim().length < 2) {
        setSearchResults([])
        setSearchLoading(false)
        return
      }

      setSearchLoading(true)
      debounceRef.current = setTimeout(() => {
        searchApi(query, undefined, sources)
      }, DEBOUNCE_MS)
    },
    [searchApi]
  )

  // Por categoria (server-side)
  const getByCategory = useCallback(
    (category: FoodCategory, sources?: string[]) => {
      searchApi('', category, sources)
    },
    [searchApi]
  )

  // Por ID (busca local primeiro, depois no searchResults)
  const getById = useCallback(
    (id: string): Food | null => {
      return foods.find(f => f.id === id)
        || searchResults.find(f => f.id === id)
        || recentFoods.find(f => f.id === id)
        || null
    },
    [foods, searchResults, recentFoods]
  )

  // Buscar por código de barras (Open Food Facts)
  const searchByBarcode = useCallback(async (code: string): Promise<Food | null> => {
    try {
      const response = await fetch(`/api/foods/barcode?code=${encodeURIComponent(code)}`)
      const data = await response.json()

      if (data.success && data.food) {
        return convertDbFoodToFood(data.food)
      }
      return null
    } catch (error) {
      console.error('Erro ao buscar por código de barras:', error)
      return null
    }
  }, [])

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
        setUserFoodsFromDb(prev => [...prev, newFood])
        return newFood
      }
    },
    []
  )

  // Atualizar alimento (via API para alimentos do usuário)
  const updateFood = useCallback(async (id: string, data: Partial<Food>) => {
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
    }
  }, [userFoodsFromDb])

  // Deletar alimento (via API para alimentos do usuário)
  const deleteFood = useCallback(async (id: string) => {
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
    }
  }, [userFoodsFromDb])

  // Toggle favorito
  const toggleFavorite = useCallback(async (id: string) => {
    const currentFood = [...userFoodsFromDb, ...searchResults].find(f => f.id === id)
    if (!currentFood) return

    const newFavoriteValue = !currentFood.is_favorite
    const isUserFood = userFoodsFromDb.some(f => f.id === id)

    if (isUserFood) {
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
          setUserFoodsFromDb(prev =>
            prev.map(food =>
              food.id === id ? { ...food, is_favorite: !newFavoriteValue } : food
            )
          )
        }
      } catch {
        setUserFoodsFromDb(prev =>
          prev.map(food =>
            food.id === id ? { ...food, is_favorite: !newFavoriteValue } : food
          )
        )
      }
    }
  }, [userFoodsFromDb, searchResults])

  // Adicionar aos recentes
  const addToRecent = useCallback((id: string) => {
    // Salvar o food completo nos recentes para referência offline
    const food = [...userFoodsFromDb, ...searchResults].find(f => f.id === id)
    if (food) {
      setRecentFoods(prev => {
        const filtered = prev.filter(f => f.id !== id)
        return [food, ...filtered].slice(0, MAX_RECENT_FOODS)
      })
    }

    setRecentIds(prev => {
      const filtered = prev.filter(fid => fid !== id)
      return [id, ...filtered].slice(0, MAX_RECENT_FOODS)
    })
  }, [userFoodsFromDb, searchResults])

  // Recentes (usar foods salvos localmente)
  const recent = useMemo(() => {
    return recentIds
      .map(id =>
        userFoodsFromDb.find(f => f.id === id)
        || recentFoods.find(f => f.id === id)
      )
      .filter(Boolean) as Food[]
  }, [userFoodsFromDb, recentFoods, recentIds])

  // Alimentos criados pelo usuário
  const userFoods = useMemo(() => {
    return userFoodsFromDb.filter(f => f.is_user_created)
  }, [userFoodsFromDb])

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      if (abortControllerRef.current) abortControllerRef.current.abort()
    }
  }, [])

  return {
    foods,
    favorites,
    recent,
    userFoods,
    search,
    searchResults,
    searchLoading,
    getByCategory,
    getById,
    addFood,
    updateFood,
    deleteFood,
    toggleFavorite,
    addToRecent,
    searchByBarcode,
    refreshUserFoods: fetchUserFoods,
    loading
  }
}
