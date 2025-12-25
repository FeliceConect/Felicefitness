'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getTodayDateSP, getNowSaoPaulo } from '@/lib/utils/date'
import type {
  DailyCheckin,
  NewDailyCheckin,
  RecoveryComponents,
  TrainingRecommendation,
  UseRecoveryReturn,
  SleepLog,
} from '@/types/sleep'
import {
  calculateRecoveryScore,
  calculateRecoveryComponents,
  getTrainingRecommendation,
} from '@/lib/sleep/calculations'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseRow = Record<string, any>

export function useRecovery(): UseRecoveryReturn {
  const [todayCheckin, setTodayCheckin] = useState<DailyCheckin | null>(null)
  const [history, setHistory] = useState<DailyCheckin[]>([])
  const [components, setComponents] = useState<RecoveryComponents | null>(null)
  const [recommendation, setRecommendation] = useState<TrainingRecommendation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const supabase = createClient()

  const fetchRecoveryData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const today = getTodayDateSP()
      const thirtyDaysAgo = getNowSaoPaulo()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      // Fetch check-ins
      const { data: checkinsData, error: checkinsError } = await supabase
        .from('daily_checkins')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('date', { ascending: false })

      if (checkinsError) throw checkinsError

      const checkins = (checkinsData as SupabaseRow[]) || []
      setHistory(checkins as DailyCheckin[])

      // Find today's check-in
      const todayData = checkins.find(c => c.date === today)
      setTodayCheckin(todayData as DailyCheckin || null)

      // Fetch today's sleep for components calculation
      const { data: sleepData } = await supabase
        .from('sleep_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .single()

      const sleepLog = sleepData as unknown as SleepLog | null

      // Calculate components and recommendation
      if (todayData) {
        const comps = calculateRecoveryComponents(
          sleepLog,
          todayData as DailyCheckin,
          7 // goal hours
        )
        setComponents(comps)

        const rec = getTrainingRecommendation((todayData as DailyCheckin).recovery_score)
        setRecommendation(rec)
      }
    } catch (err) {
      console.error('Error fetching recovery data:', err)
      setError(err instanceof Error ? err : new Error('Failed to fetch recovery data'))
    } finally {
      setLoading(false)
    }
  }, [supabase])

  const submitCheckin = useCallback(async (data: NewDailyCheckin) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      // Fetch today's sleep log for score calculation
      const { data: sleepData } = await supabase
        .from('sleep_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', data.date)
        .single()

      const sleepLog = sleepData as unknown as SleepLog | null

      // Calculate average soreness level
      const avgSoreness = data.soreness_areas.length > 0
        ? data.soreness_areas.reduce((sum, a) => sum + a.intensity, 0) / data.soreness_areas.length
        : 1

      // Calculate recovery score
      const recoveryScore = calculateRecoveryScore({
        sleepDuration: sleepLog?.duration || 0,
        sleepQuality: sleepLog?.quality || 3,
        energyLevel: data.energy_level,
        stressLevel: data.stress_level,
        sorenessLevel: Math.min(5, Math.round(avgSoreness * 1.67)), // Scale 1-3 to 1-5
        sleepGoal: 7,
      })

      // Check if there's already a check-in for today
      const { data: existingCheckin } = await supabase
        .from('daily_checkins')
        .select('id')
        .eq('user_id', user.id)
        .eq('date', data.date)
        .single()

      if (existingCheckin) {
        // Update existing check-in
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: updateError } = await (supabase as any)
          .from('daily_checkins')
          .update({
            energy_level: data.energy_level,
            mood: data.mood,
            stress_level: data.stress_level,
            soreness_areas: data.soreness_areas,
            training_readiness: data.training_readiness,
            recovery_score: recoveryScore,
            notes: data.notes || null,
          })
          .eq('id', (existingCheckin as SupabaseRow).id)

        if (updateError) throw updateError
      } else {
        // Insert new check-in
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: insertError } = await (supabase as any)
          .from('daily_checkins')
          .insert({
            user_id: user.id,
            date: data.date,
            energy_level: data.energy_level,
            mood: data.mood,
            stress_level: data.stress_level,
            soreness_areas: data.soreness_areas,
            training_readiness: data.training_readiness,
            recovery_score: recoveryScore,
            notes: data.notes || null,
          })

        if (insertError) throw insertError
      }

      await fetchRecoveryData()
    } catch (err) {
      console.error('Error submitting check-in:', err)
      throw err
    }
  }, [supabase, fetchRecoveryData])

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    await fetchRecoveryData()
  }, [fetchRecoveryData])

  useEffect(() => {
    fetchRecoveryData()
  }, [fetchRecoveryData])

  // Calculate weekly average
  const weeklyAverage = history.length > 0
    ? Math.round(
        history.slice(0, 7).reduce((sum, c) => sum + c.recovery_score, 0) /
        Math.min(history.length, 7)
      )
    : 0

  return {
    todayScore: todayCheckin?.recovery_score || null,
    todayCheckin,
    history,
    weeklyAverage,
    components,
    recommendation,
    loading,
    error,
    submitCheckin,
    refresh,
  }
}
