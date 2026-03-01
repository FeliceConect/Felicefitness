'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type {
  Supplement,
  NewSupplement,
  SupplementLog,
  SupplementSchedule,
  DailyProgress,
  NextDose,
  UseSupplementsReturn,
} from '@/types/supplements'
import {
  generateDailySchedule,
  calculateDailyProgress,
  getNextDose,
} from '@/lib/supplements/calculations'

export function useSupplements(): UseSupplementsReturn {
  const [supplements, setSupplements] = useState<Supplement[]>([])
  const [logs, setLogs] = useState<SupplementLog[]>([])
  const [schedule, setSchedule] = useState<SupplementSchedule[]>([])
  const [dailyProgress, setDailyProgress] = useState<DailyProgress>({ taken: 0, total: 0, percent: 0 })
  const [nextDose, setNextDose] = useState<NextDose | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()
  const today = new Date()

  // Fetch supplements and logs
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) {
        setError('Usuário não autenticado')
        return
      }

      // Fetch supplements
      const { data: supplementsData, error: supplementsError } = await supabase
        .from('fitness_suplementos')
        .select('*')
        .eq('user_id', userData.user.id)
        .order('nome')

      if (supplementsError) throw supplementsError

      // Fetch today's logs
      const todayStr = today.toISOString().split('T')[0]
      const { data: logsData, error: logsError } = await supabase
        .from('fitness_suplemento_logs')
        .select('*')
        .eq('user_id', userData.user.id)
        .eq('date', todayStr)

      if (logsError) throw logsError

      const supps = (supplementsData as unknown as Supplement[]) || []
      const todayLogs = (logsData as unknown as SupplementLog[]) || []

      setSupplements(supps)
      setLogs(todayLogs)

      // Generate schedule
      const todaySchedule = generateDailySchedule(supps, todayLogs, today)
      setSchedule(todaySchedule)

      // Calculate progress
      const progress = calculateDailyProgress(todaySchedule)
      setDailyProgress(progress)

      // Get next dose
      const next = getNextDose(todaySchedule)
      setNextDose(next)

    } catch (err) {
      console.error('Error fetching supplements:', err)
      setError('Erro ao carregar suplementos')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Add supplement
  const addSupplement = async (data: NewSupplement): Promise<void> => {
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) throw new Error('Usuário não autenticado')

      const { error } = await supabase
        .from('fitness_suplementos')
        .insert({
          ...data,
          user_id: userData.user.id,
        } as never)

      if (error) throw error

      await fetchData()
    } catch (err) {
      console.error('Error adding supplement:', err)
      throw err
    }
  }

  // Update supplement
  const updateSupplement = async (id: string, data: Partial<Supplement>): Promise<void> => {
    try {
      const { error } = await supabase
        .from('fitness_suplementos')
        .update(data as never)
        .eq('id', id)

      if (error) throw error

      await fetchData()
    } catch (err) {
      console.error('Error updating supplement:', err)
      throw err
    }
  }

  // Delete supplement
  const deleteSupplement = async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('fitness_suplementos')
        .delete()
        .eq('id', id)

      if (error) throw error

      await fetchData()
    } catch (err) {
      console.error('Error deleting supplement:', err)
      throw err
    }
  }

  // Mark dose as taken/untaken
  const markDose = async (supplementId: string, time: string, taken: boolean): Promise<void> => {
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) throw new Error('Usuário não autenticado')

      const todayStr = today.toISOString().split('T')[0]

      // Check if log exists
      const { data: existingLog } = await supabase
        .from('fitness_suplemento_logs')
        .select('id')
        .eq('user_id', userData.user.id)
        .eq('supplement_id', supplementId)
        .eq('date', todayStr)
        .eq('scheduled_time', time)
        .single()

      const logData = existingLog as { id: string } | null

      if (logData) {
        // Update existing log
        const { error } = await supabase
          .from('fitness_suplemento_logs')
          .update({
            taken,
            taken_at: taken ? new Date().toISOString() : null,
          } as never)
          .eq('id', logData.id)

        if (error) throw error
      } else {
        // Create new log
        const { error } = await supabase
          .from('fitness_suplemento_logs')
          .insert({
            user_id: userData.user.id,
            supplement_id: supplementId,
            date: todayStr,
            scheduled_time: time,
            taken,
            taken_at: taken ? new Date().toISOString() : null,
          } as never)

        if (error) throw error
      }

      // Update stock if marking as taken
      if (taken) {
        const supplement = supplements.find(s => s.id === supplementId)
        if (supplement && supplement.quantidade_estoque > 0) {
          await supabase
            .from('fitness_suplementos')
            .update({ quantidade_estoque: supplement.quantidade_estoque - 1 } as never)
            .eq('id', supplementId)
        }
      }

      await fetchData()
    } catch (err) {
      console.error('Error marking dose:', err)
      throw err
    }
  }

  return {
    supplements,
    schedule,
    dailyProgress,
    nextDose,
    isLoading,
    error,
    addSupplement,
    updateSupplement,
    deleteSupplement,
    markDose,
    refresh: fetchData,
  }
}
