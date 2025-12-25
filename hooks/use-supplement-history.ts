'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type {
  Supplement,
  SupplementLog,
  SupplementStats,
  CalendarDay,
  UseSupplementHistoryReturn,
} from '@/types/supplements'
import {
  calculateSupplementStats,
  generateCalendarData,
  calculateAdherenceBySuplement,
} from '@/lib/supplements/calculations'

export function useSupplementHistory(days: number = 30): UseSupplementHistoryReturn {
  const [supplements, setSupplements] = useState<Supplement[]>([])
  const [logs, setLogs] = useState<SupplementLog[]>([])
  const [stats, setStats] = useState<SupplementStats>({
    adherenceRate: 0,
    totalDosesTaken: 0,
    totalDosesScheduled: 0,
    perfectDays: 0,
    totalDays: 0,
    currentStreak: 0,
    bestStreak: 0,
  })
  const [calendarData, setCalendarData] = useState<CalendarDay[]>([])
  const [adherenceBySuplement, setAdherenceBySuplement] = useState<Record<string, number>>({})
  const [selectedMonth, setSelectedMonth] = useState(new Date())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) {
        setError('Usuário não autenticado')
        return
      }

      // Calculate date range
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const startStr = startDate.toISOString().split('T')[0]
      const endStr = endDate.toISOString().split('T')[0]

      // Fetch supplements
      const { data: supplementsData, error: supplementsError } = await supabase
        .from('suplementos')
        .select('*')
        .eq('user_id', userData.user.id)
        .order('nome')

      if (supplementsError) throw supplementsError

      // Fetch logs for the period
      const { data: logsData, error: logsError } = await supabase
        .from('suplemento_logs')
        .select('*')
        .eq('user_id', userData.user.id)
        .gte('date', startStr)
        .lte('date', endStr)
        .order('date', { ascending: false })

      if (logsError) throw logsError

      const supps = (supplementsData as unknown as Supplement[]) || []
      const allLogs = (logsData as unknown as SupplementLog[]) || []

      setSupplements(supps)
      setLogs(allLogs)

      // Calculate stats
      const calculatedStats = calculateSupplementStats(allLogs, supps, startDate, endDate)
      setStats(calculatedStats)

      // Calculate adherence by supplement
      const adherence = calculateAdherenceBySuplement(allLogs, supps, days)
      setAdherenceBySuplement(adherence)

      // Generate calendar data for selected month
      const calendar = generateCalendarData(allLogs, supps, selectedMonth)
      setCalendarData(calendar)

    } catch (err) {
      console.error('Error fetching history:', err)
      setError('Erro ao carregar histórico')
    } finally {
      setIsLoading(false)
    }
  }, [days, selectedMonth])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Change selected month
  const changeMonth = (month: Date) => {
    setSelectedMonth(month)
  }

  // Get logs for a specific date
  const getLogsForDate = (date: string): SupplementLog[] => {
    return logs.filter(l => l.date === date)
  }

  return {
    stats,
    calendarData,
    adherenceBySuplement,
    supplements,
    logs,
    selectedMonth,
    isLoading,
    error,
    changeMonth,
    getLogsForDate,
    refresh: fetchData,
  }
}
