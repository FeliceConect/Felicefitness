"use client"

import { useState, useEffect, useCallback, useMemo } from 'react'
import type { Food, FoodCategory } from '@/lib/nutrition/types'
import {
  mockFoods,
  searchFoods as searchFoodsData,
  getFavoriteFoods,
  getFoodsByCategory,
  getFoodById
} from '@/lib/nutrition/mock-data'

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
  loading: boolean
}

const RECENT_FOODS_KEY = 'felicefit_recent_foods'
const MAX_RECENT_FOODS = 10

export function useFoods(): UseFoodsReturn {
  const [foods, setFoods] = useState<Food[]>(mockFoods)
  const [recentIds, setRecentIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  // Carregar recentes do localStorage
  useEffect(() => {
    const saved = localStorage.getItem(RECENT_FOODS_KEY)
    if (saved) {
      try {
        setRecentIds(JSON.parse(saved))
      } catch {
        localStorage.removeItem(RECENT_FOODS_KEY)
      }
    }
    setLoading(false)
  }, [])

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

  // Adicionar alimento
  const addFood = useCallback(
    async (food: Omit<Food, 'id' | 'created_at'>): Promise<Food> => {
      const newFood: Food = {
        ...food,
        id: `food-user-${Date.now()}`,
        is_user_created: true,
        created_at: new Date().toISOString()
      }
      setFoods(prev => [...prev, newFood])
      return newFood
    },
    []
  )

  // Atualizar alimento
  const updateFood = useCallback(async (id: string, data: Partial<Food>) => {
    setFoods(prev =>
      prev.map(food => (food.id === id ? { ...food, ...data } : food))
    )
  }, [])

  // Deletar alimento
  const deleteFood = useCallback(async (id: string) => {
    setFoods(prev => prev.filter(food => food.id !== id))
  }, [])

  // Toggle favorito
  const toggleFavorite = useCallback(async (id: string) => {
    setFoods(prev =>
      prev.map(food =>
        food.id === id ? { ...food, is_favorite: !food.is_favorite } : food
      )
    )
  }, [])

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
    loading
  }
}
