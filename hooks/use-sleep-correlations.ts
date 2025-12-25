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
        .from('sleep_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', ninetyDaysAgo.toISOString().split('T')[0])
        .order('date', { ascending: false })

      if (sleepError) throw sleepError

      const sleepLogs = (sleepData as SupabaseRow[]) || []

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
