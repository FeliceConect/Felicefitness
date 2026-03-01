'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  calculateWellnessCorrelations,
  calculateWellnessPatterns,
} from '@/lib/wellness/correlations'
import { getRecommendations } from '@/lib/wellness/tips'
import type {
  WellnessCheckin,
  WellnessCorrelations,
  WellnessPatterns,
} from '@/types/wellness'

interface UseWellnessCorrelationsReturn {
  correlations: WellnessCorrelations | null
  patterns: WellnessPatterns | null
  recommendations: string[]
  loading: boolean
}

export function useWellnessCorrelations(): UseWellnessCorrelationsReturn {
  const [correlations, setCorrelations] = useState<WellnessCorrelations | null>(null)
  const [patterns, setPatterns] = useState<WellnessPatterns | null>(null)
  const [recommendations, setRecommendations] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    async function loadData() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        // Get wellness check-ins from last 30 days
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const { data: checkinsData } = await supabase
          .from('fitness_wellness_checkins')
          .select('*')
          .eq('user_id', user.id)
          .gte('data', thirtyDaysAgo.toISOString().split('T')[0])
          .order('data', { ascending: false }) as { data: Array<{ id: string; user_id: string; data: string; horario: string | null; humor: number; stress: number; energia: number; fatores_positivos: string[] | null; fatores_negativos: string[] | null; notas: string | null; created_at: string }> | null }

        // Get workout logs from last 30 days
        const { data: workoutsData } = await supabase
          .from('treino_logs')
          .select('*')
          .eq('user_id', user.id)
          .gte('data', thirtyDaysAgo.toISOString().split('T')[0]) as { data: Array<{ data: string; created_at: string }> | null }

        // Get sleep logs from last 30 days
        const { data: sleepData } = await supabase
          .from('sono_registros')
          .select('*')
          .eq('user_id', user.id)
          .gte('data', thirtyDaysAgo.toISOString().split('T')[0]) as { data: Array<{ data: string; qualidade: number }> | null }

        if (!checkinsData || checkinsData.length < 3) {
          setLoading(false)
          return
        }

        // Map check-ins
        const checkins: WellnessCheckin[] = checkinsData.map((c) => ({
          id: c.id,
          userId: c.user_id,
          data: c.data,
          horario: c.horario || undefined,
          humor: c.humor,
          stress: c.stress,
          energia: c.energia,
          fatoresPositivos: c.fatores_positivos || [],
          fatoresNegativos: c.fatores_negativos || [],
          notas: c.notas || undefined,
          createdAt: c.created_at,
        }))

        // Map workouts
        const workouts = (workoutsData || []).map((w) => {
          const createdHour = new Date(w.created_at).getHours()
          return {
            date: w.data,
            morning: createdHour < 12,
          }
        })

        // Map sleep data
        const sleepLogs = (sleepData || []).map((s) => ({
          date: s.data,
          quality: s.qualidade || 70,
        }))

        // Calculate correlations
        const correlationsResult = calculateWellnessCorrelations({
          checkins,
          workouts,
          sleepLogs,
        })
        setCorrelations(correlationsResult)

        // Calculate patterns
        const patternsResult = calculateWellnessPatterns(checkins)
        setPatterns(patternsResult)

        // Get recommendations
        const avgMood =
          checkins.reduce((sum, c) => sum + c.humor, 0) / checkins.length
        const avgStress =
          checkins.reduce((sum, c) => sum + c.stress, 0) / checkins.length
        const avgEnergy =
          checkins.reduce((sum, c) => sum + c.energia, 0) / checkins.length
        const avgSleep =
          sleepLogs.length > 0
            ? sleepLogs.reduce((sum, s) => sum + s.quality, 0) / sleepLogs.length
            : 70

        const recs = getRecommendations({
          avgMood,
          avgStress,
          avgEnergy,
          workoutDays: workouts.length,
          sleepQuality: avgSleep,
        })
        setRecommendations(recs)
      } catch (error) {
        console.error('Error loading wellness correlations:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    correlations,
    patterns,
    recommendations,
    loading,
  }
}
