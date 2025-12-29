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
        .from('fitness_sleep_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('data', startDate.toISOString().split('T')[0])
        .order('data', { ascending: false })

      if (fetchError) throw fetchError

      // Transformar dados do banco para o formato do hook
      const rawLogs = (data as SupabaseRow[]) || []
      const logs: SleepLog[] = rawLogs.map(log => {
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
      setSleepLogs(logs)

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

      // Obter o offset do timezone local (ex: -03:00 para Brasília)
      const getTimezoneOffset = () => {
        const offset = new Date().getTimezoneOffset()
        const hours = Math.floor(Math.abs(offset) / 60)
        const minutes = Math.abs(offset) % 60
        const sign = offset <= 0 ? '+' : '-'
        return `${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
      }
      const tzOffset = getTimezoneOffset()

      // Converter horarios para timestamp completo COM timezone
      // data.date = "2024-12-25", data.bedtime = "22:00"
      // Hora de dormir: se for >= 18h, é no mesmo dia; se for < 6h, é no dia seguinte ao date
      const bedtimeHour = parseInt(data.bedtime.split(':')[0])
      let bedtimeDate = data.date

      // Se hora de dormir for de madrugada (antes das 6h), foi no dia seguinte
      // Mas como estamos registrando a noite anterior, mantemos a lógica original
      // Ex: dormiu 22:00 do dia 25, acordou 05:00 do dia 26
      // date = 26 (dia que acordou - 1 = 25)
      // bedtimeDate = 25 (mesmo que date pois >= 18h)

      // Se bedtime < 6h, significa que dormiu de madrugada do dia anterior
      if (bedtimeHour < 6) {
        // Dormiu na madrugada, então é no dia do acordar
        const nextDay = new Date(data.date)
        nextDay.setDate(nextDay.getDate() + 1)
        bedtimeDate = nextDay.toISOString().split('T')[0]
      }

      // Adicionar timezone offset para garantir que seja salvo corretamente
      const horaDormir = `${bedtimeDate}T${data.bedtime}:00${tzOffset}`

      // Hora de acordar é sempre no dia seguinte ao date (pois date é o dia anterior)
      const wakeDate = new Date(data.date)
      wakeDate.setDate(wakeDate.getDate() + 1)
      const horaAcordar = `${wakeDate.toISOString().split('T')[0]}T${data.wake_time}:00${tzOffset}`

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: insertError } = await (supabase as any)
        .from('fitness_sleep_logs')
        .insert({
          user_id: user.id,
          data: data.date,
          hora_dormir: horaDormir,
          hora_acordar: horaAcordar,
          duracao_minutos: duration,
          qualidade: data.quality,
          vezes_acordou: data.times_woken || 0,
          sensacao_acordar: data.wake_feeling || 3,
          fatores_positivos: data.positive_factors || [],
          fatores_negativos: data.negative_factors || [],
          notas: data.notes || null,
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

      // Obter o offset do timezone local
      const getTimezoneOffset = () => {
        const offset = new Date().getTimezoneOffset()
        const hours = Math.floor(Math.abs(offset) / 60)
        const minutes = Math.abs(offset) % 60
        const sign = offset <= 0 ? '+' : '-'
        return `${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
      }
      const tzOffset = getTimezoneOffset()

      // Preparar objeto de update apenas com campos definidos
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateData: Record<string, any> = {
        updated_at: new Date().toISOString(),
      }

      if (data.date) {
        updateData.data = data.date
        // Converter horarios para timestamp COM timezone se fornecidos
        if (data.bedtime) {
          const bedtimeHour = parseInt(data.bedtime.split(':')[0])
          let bedtimeDate = data.date
          if (bedtimeHour < 6) {
            const nextDay = new Date(data.date)
            nextDay.setDate(nextDay.getDate() + 1)
            bedtimeDate = nextDay.toISOString().split('T')[0]
          }
          updateData.hora_dormir = `${bedtimeDate}T${data.bedtime}:00${tzOffset}`
        }
        if (data.wake_time) {
          const wakeDate = new Date(data.date)
          wakeDate.setDate(wakeDate.getDate() + 1)
          updateData.hora_acordar = `${wakeDate.toISOString().split('T')[0]}T${data.wake_time}:00${tzOffset}`
        }
      }
      if (duration !== undefined) updateData.duracao_minutos = duration
      if (data.quality !== undefined) updateData.qualidade = data.quality
      if (data.times_woken !== undefined) updateData.vezes_acordou = data.times_woken
      if (data.wake_feeling !== undefined) updateData.sensacao_acordar = data.wake_feeling
      if (data.positive_factors !== undefined) updateData.fatores_positivos = data.positive_factors
      if (data.negative_factors !== undefined) updateData.fatores_negativos = data.negative_factors
      if (data.notes !== undefined) updateData.notas = data.notes

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (supabase as any)
        .from('fitness_sleep_logs')
        .update(updateData)
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
        .from('fitness_sleep_logs')
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
