'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { SleepCorrelations, UseSleepCorrelationsReturn } from '@/types/sleep'
import { calculateSleepCorrelations, generateSleepTips } from '@/lib/sleep/correlations'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseRow = Record<string, any>

export function useSleepCorrelations(): UseSleepCorrelationsReturn {
  const [correlations, setCorrelations] = useState<SleepCorrelations | null>(null)
  const [tips, setTips] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const supabase = createClient()

  const fetchCorrelations = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      // Fetch sleep logs (last 90 days for better correlation data)
      const ninetyDaysAgo = new Date()
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

      const { data: sleepData, error: sleepError } = await supabase
        .from('fitness_sleep_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('data', ninetyDaysAgo.toISOString().split('T')[0])
        .order('data', { ascending: false })

      if (sleepError) throw sleepError

      // Transformar dados do banco para o formato do hook
      const rawLogs = (sleepData as SupabaseRow[]) || []
      const sleepLogs = rawLogs.map(log => {
        // Extrair apenas o horario do timestamp (ex: "2024-12-25T22:00:00" -> "22:00")
        const extractTime = (timestamp: string | null): string => {
          if (!timestamp) return '00:00'
          try {
            const date = new Date(timestamp)
            return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
          } catch {
            return timestamp.includes('T') ? timestamp.split('T')[1]?.substring(0, 5) || '00:00' : timestamp
          }
        }

        return {
          id: log.id,
          user_id: log.user_id,
          date: log.data,
          bedtime: extractTime(log.hora_dormir),
          wake_time: extractTime(log.hora_acordar),
          duration: log.duracao_minutos,
          quality: log.qualidade,
          times_woken: log.vezes_acordou || 0,
          wake_feeling: log.sensacao_acordar || 3,
          positive_factors: log.fatores_positivos || [],
          negative_factors: log.fatores_negativos || [],
          notes: log.notas,
          created_at: log.created_at,
          updated_at: log.updated_at,
        }
      })

      if (sleepLogs.length < 7) {
        setTips(['Continue registrando seu sono para receber análises personalizadas'])
        setCorrelations(null)
        return
      }

      // Fetch workout sessions for correlation
      const { data: workoutData } = await supabase
        .from('workout_sessions')
        .select('completed_at, performance_score')
        .eq('user_id', user.id)
        .not('completed_at', 'is', null)
        .gte('completed_at', ninetyDaysAgo.toISOString())

      const workoutLogs = (workoutData as SupabaseRow[])?.map(w => ({
        date: w.completed_at?.split('T')[0],
        performanceScore: w.performance_score || 0,
      })) || []

      // Calculate correlations
      const corrs = calculateSleepCorrelations(
        sleepLogs as unknown as import('@/types/sleep').SleepLog[],
        workoutLogs
      )
      setCorrelations(corrs)

      // Generate tips
      const generatedTips = generateSleepTips(sleepLogs as unknown as import('@/types/sleep').SleepLog[], 7)
      setTips(generatedTips)
    } catch (err) {
      console.error('Error fetching correlations:', err)
      setError(err instanceof Error ? err : new Error('Failed to fetch correlations'))
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchCorrelations()
  }, [fetchCorrelations])

  return {
    correlations,
    tips,
    loading,
    error,
  }
}
