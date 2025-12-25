'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type {
  SleepLog,
  NewSleepLog,
  SleepStats,
  SleepPatterns,
  UseSleepReturn,
} from '@/types/sleep'
import {
  calculateSleepDuration,
  calculateAverageTime,
  calculateScheduleConsistency,
  isWeekday,
} from '@/lib/sleep/calculations'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseRow = Record<string, any>

export function useSleep(days: number = 30): UseSleepReturn {
  const [sleepLogs, setSleepLogs] = useState<SleepLog[]>([])
  const [stats, setStats] = useState<SleepStats | null>(null)
  const [patterns, setPatterns] = useState<SleepPatterns | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const supabase = createClient()

  const fetchSleepLogs = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const { data, error: fetchError } = await supabase
        .from('sleep_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: false })

      if (fetchError) throw fetchError

      const logs = (data as SupabaseRow[]) || []
      setSleepLogs(logs as SleepLog[])

      // Calculate stats
      if (logs.length > 0) {
        calculateStats(logs as SleepLog[])
        calculatePatterns(logs as SleepLog[])
      }
    } catch (err) {
      console.error('Error fetching sleep logs:', err)
      setError(err instanceof Error ? err : new Error('Failed to fetch sleep logs'))
    } finally {
      setLoading(false)
    }
  }, [supabase, days])

  const calculateStats = (logs: SleepLog[]) => {
    if (logs.length === 0) {
      setStats(null)
      return
    }

    const goalMinutes = 7 * 60 // 7 hours
    const durations = logs.map(l => l.duration)
    const qualities = logs.map(l => l.quality)

    const avgDuration = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    const avgQuality = Math.round((qualities.reduce((a, b) => a + b, 0) / qualities.length) * 10) / 10
    const daysOnGoal = logs.filter(l => l.duration >= goalMinutes - 15).length
    const consistencyScore = calculateScheduleConsistency(logs)

    // Find best and worst nights
    const sortedByQuality = [...logs].sort((a, b) => {
      if (b.quality !== a.quality) return b.quality - a.quality
      return b.duration - a.duration
    })

    setStats({
      averageDuration: avgDuration,
      averageQuality: avgQuality,
      daysOnGoal,
      totalDays: logs.length,
      bestNight: sortedByQuality[0] || null,
      worstNight: sortedByQuality[sortedByQuality.length - 1] || null,
      consistencyScore,
    })
  }

  const calculatePatterns = (logs: SleepLog[]) => {
    if (logs.length === 0) {
      setPatterns(null)
      return
    }

    const bedtimes = logs.map(l => l.bedtime)
    const wakeTimes = logs.map(l => l.wake_time)

    const weekdayLogs = logs.filter(l => isWeekday(new Date(l.date + 'T12:00:00')))
    const weekendLogs = logs.filter(l => !isWeekday(new Date(l.date + 'T12:00:00')))

    const avgBedtime = calculateAverageTime(bedtimes)
    const avgWakeTime = calculateAverageTime(wakeTimes)

    const weekdayAvg = weekdayLogs.length > 0
      ? {
          duration: Math.round(weekdayLogs.reduce((a, b) => a + b.duration, 0) / weekdayLogs.length),
          quality: Math.round((weekdayLogs.reduce((a, b) => a + b.quality, 0) / weekdayLogs.length) * 10) / 10,
          bedtime: calculateAverageTime(weekdayLogs.map(l => l.bedtime)),
          wakeTime: calculateAverageTime(weekdayLogs.map(l => l.wake_time)),
        }
      : { duration: 0, quality: 0, bedtime: '22:00', wakeTime: '05:00' }

    const weekendAvg = weekendLogs.length > 0
      ? {
          duration: Math.round(weekendLogs.reduce((a, b) => a + b.duration, 0) / weekendLogs.length),
          quality: Math.round((weekendLogs.reduce((a, b) => a + b.quality, 0) / weekendLogs.length) * 10) / 10,
          bedtime: calculateAverageTime(weekendLogs.map(l => l.bedtime)),
          wakeTime: calculateAverageTime(weekendLogs.map(l => l.wake_time)),
        }
      : { duration: 0, quality: 0, bedtime: '22:00', wakeTime: '05:00' }

    setPatterns({
      avgBedtime,
      avgWakeTime,
      weekdayAvg,
      weekendAvg,
    })
  }

  const logSleep = useCallback(async (data: NewSleepLog) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const duration = calculateSleepDuration(data.bedtime, data.wake_time)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: insertError } = await (supabase as any)
        .from('sleep_logs')
        .insert({
          user_id: user.id,
          date: data.date,
          bedtime: data.bedtime,
          wake_time: data.wake_time,
          duration,
          quality: data.quality,
          times_woken: data.times_woken,
          wake_feeling: data.wake_feeling,
          positive_factors: data.positive_factors,
          negative_factors: data.negative_factors,
          notes: data.notes || null,
        })

      if (insertError) throw insertError

      await fetchSleepLogs()
    } catch (err) {
      console.error('Error logging sleep:', err)
      throw err
    }
  }, [supabase, fetchSleepLogs])

  const updateSleep = useCallback(async (id: string, data: Partial<SleepLog>) => {
    try {
      // Recalculate duration if times changed
      let duration = data.duration
      if (data.bedtime && data.wake_time) {
        duration = calculateSleepDuration(data.bedtime, data.wake_time)
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (supabase as any)
        .from('sleep_logs')
        .update({
          ...data,
          duration,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (updateError) throw updateError

      await fetchSleepLogs()
    } catch (err) {
      console.error('Error updating sleep log:', err)
      throw err
    }
  }, [supabase, fetchSleepLogs])

  const deleteSleep = useCallback(async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('sleep_logs')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError

      await fetchSleepLogs()
    } catch (err) {
      console.error('Error deleting sleep log:', err)
      throw err
    }
  }, [supabase, fetchSleepLogs])

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    await fetchSleepLogs()
  }, [fetchSleepLogs])

  useEffect(() => {
    fetchSleepLogs()
  }, [fetchSleepLogs])

  return {
    lastSleep: sleepLogs[0] || null,
    sleepLogs,
    stats,
    patterns,
    loading,
    error,
    logSleep,
    updateSleep,
    deleteSleep,
    refresh,
  }
}
