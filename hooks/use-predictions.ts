'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type {
  WeightPrediction,
  MusclePrediction,
  PRPrediction,
  SkiReadiness,
} from '@/types/insights'

interface UsePredictionsReturn {
  // Previsões
  weightPrediction: WeightPrediction | null
  musclePrediction: MusclePrediction | null
  prPredictions: PRPrediction[]
  skiReadiness: SkiReadiness | null

  // Atualizar
  refreshPredictions: () => Promise<void>

  loading: boolean
}

export function usePredictions(): UsePredictionsReturn {
  const [weightPrediction, setWeightPrediction] = useState<WeightPrediction | null>(null)
  const [musclePrediction, setMusclePrediction] = useState<MusclePrediction | null>(null)
  const [prPredictions, setPRPredictions] = useState<PRPrediction[]>([])
  const [skiReadiness, setSkiReadiness] = useState<SkiReadiness | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  const loadPredictions = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      // Buscar dados via API
      const response = await fetch('/api/insights/predict')

      if (response.ok) {
        const data = await response.json()
        setWeightPrediction(data.weight || null)
        setMusclePrediction(data.muscle || null)
        setPRPredictions(data.prs || [])
        setSkiReadiness(data.skiReadiness || null)
      }
    } catch (error) {
      console.error('Error loading predictions:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    loadPredictions()
  }, [loadPredictions])

  const refreshPredictions = useCallback(async () => {
    setLoading(true)
    await loadPredictions()
  }, [loadPredictions])

  return {
    weightPrediction,
    musclePrediction,
    prPredictions,
    skiReadiness,
    refreshPredictions,
    loading,
  }
}
