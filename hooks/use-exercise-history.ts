'use client'

import { useState, useEffect, useCallback } from 'react'

interface ExerciseWeight {
  weight: number
  reps: number
  date: string
}

interface UseExerciseHistoryReturn {
  lastWeights: Record<string, ExerciseWeight>
  getLastWeight: (exerciseName: string) => { weight: number; reps: number } | null
  loading: boolean
  refresh: () => Promise<void>
}

// Normaliza o nome do exercício para comparação
function normalizeExerciseName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

export function useExerciseHistory(): UseExerciseHistoryReturn {
  const [lastWeights, setLastWeights] = useState<Record<string, ExerciseWeight>>({})
  const [loading, setLoading] = useState(true)

  const fetchLastWeights = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/workout/last-weights')

      if (!response.ok) {
        console.error('Erro ao buscar histórico de pesos')
        return
      }

      const data = await response.json()

      if (data.success && data.data) {
        setLastWeights(data.data)
      }
    } catch (error) {
      console.error('Erro ao buscar histórico de pesos:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLastWeights()
  }, [fetchLastWeights])

  // Função para obter o último peso de um exercício pelo nome
  const getLastWeight = useCallback(
    (exerciseName: string): { weight: number; reps: number } | null => {
      const normalized = normalizeExerciseName(exerciseName)
      const data = lastWeights[normalized]

      if (data) {
        return {
          weight: data.weight,
          reps: data.reps
        }
      }

      return null
    },
    [lastWeights]
  )

  return {
    lastWeights,
    getLastWeight,
    loading,
    refresh: fetchLastWeights
  }
}
