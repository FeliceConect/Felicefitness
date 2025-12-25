"use client"

import { useState, useEffect, useCallback, useMemo } from 'react'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { getTodayISO } from '@/lib/utils/date'

// Função para obter horário local do dispositivo
function getLocalTime(): string {
  return new Date().toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

// Função para formatar timestamp ISO para horário local
function formatToLocalTime(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}
import { generateMockTodayLogs } from '@/lib/water/calculations'
import { DEFAULT_WATER_GOAL, DEFAULT_QUICK_ADD_AMOUNTS } from '@/lib/water/types'
import type { WaterLog } from '@/lib/water/types'

interface WaterLogItem {
  id: string
  horario: string
  quantidade_ml: number
}

interface UseWaterLogReturn {
  // Estado
  logs: WaterLogItem[]
  todayTotal: number
  goal: number
  progress: number // 0-100+
  quickAddAmounts: number[]

  // Ações
  addWater: (ml: number) => Promise<boolean>
  removeLog: (id: string) => Promise<boolean>
  updateGoal: (ml: number) => Promise<void>

  // Estados de UI
  isAdding: boolean
  isLoading: boolean
  error: Error | null

  // Helpers
  isGoalReached: boolean
  remainingMl: number

  // Refresh
  refresh: () => Promise<void>
}

export function useWaterLog(date?: Date): UseWaterLogReturn {
  // Use timezone de São Paulo se não especificada uma data
  const dateStr = date ? format(date, 'yyyy-MM-dd') : getTodayISO()

  const [logs, setLogs] = useState<WaterLogItem[]>([])
  const [goal, setGoal] = useState(DEFAULT_WATER_GOAL)
  const [quickAddAmounts] = useState(DEFAULT_QUICK_ADD_AMOUNTS)
  const [isAdding, setIsAdding] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Carregar logs do dia
  const loadLogs = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        // Usar dados mock se não autenticado
        const mockLogs = generateMockTodayLogs()
        setLogs(mockLogs)
        setIsLoading(false)
        return
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error: fetchError } = await (supabase as any)
        .from('fitness_water_logs')
        .select('id, horario, quantidade_ml')
        .eq('user_id', user.id)
        .eq('data', dateStr)
        .order('horario', { ascending: false })

      if (fetchError) throw fetchError

      setLogs(data || [])
    } catch (err) {
      console.error('Erro ao carregar logs de água:', err)
      setError(err as Error)
      // Fallback para mock data
      const mockLogs = generateMockTodayLogs()
      setLogs(mockLogs)
    } finally {
      setIsLoading(false)
    }
  }, [dateStr])

  useEffect(() => {
    loadLogs()
  }, [loadLogs])

  // Adicionar água com optimistic update
  const addWater = useCallback(async (ml: number): Promise<boolean> => {
    if (ml <= 0 || ml > 2000) return false

    setIsAdding(true)
    setError(null)

    // Optimistic update com horário local do dispositivo
    const tempId = `temp-${Date.now()}`
    const horarioLocal = getLocalTime()
    const tempLog: WaterLogItem = {
      id: tempId,
      horario: horarioLocal,
      quantidade_ml: ml
    }
    setLogs(prev => [tempLog, ...prev])

    try {
      // Vibrar (feedback tátil)
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(50)
      }

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        // Mock mode - manter o log temporário
        return true
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error: insertError } = await (supabase as any)
        .from('fitness_water_logs')
        .insert({
          user_id: user.id,
          data: getTodayISO(), // Usa timezone de São Paulo
          horario: new Date().toISOString(), // UTC para o banco
          quantidade_ml: ml
        })
        .select('id, horario, quantidade_ml')
        .single()

      if (insertError) throw insertError

      // Atualizar com ID real - formatar horário para local do dispositivo
      setLogs(prev =>
        prev.map(log =>
          log.id === tempId
            ? { ...log, id: data.id, horario: formatToLocalTime(data.horario) }
            : log
        )
      )

      return true
    } catch (err) {
      console.error('Erro ao adicionar água:', err)
      setError(err as Error)
      // Rollback
      setLogs(prev => prev.filter(log => log.id !== tempId))
      return false
    } finally {
      setIsAdding(false)
    }
  }, [])

  // Remover log
  const removeLog = useCallback(async (id: string): Promise<boolean> => {
    // Guardar log para rollback
    const logToRemove = logs.find(log => log.id === id)
    if (!logToRemove) return false

    // Optimistic update
    setLogs(prev => prev.filter(log => log.id !== id))

    try {
      const supabase = createClient()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: deleteError } = await (supabase as any)
        .from('fitness_water_logs')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError

      return true
    } catch (err) {
      console.error('Erro ao remover log:', err)
      // Rollback
      setLogs(prev => [...prev, logToRemove].sort((a, b) =>
        b.horario.localeCompare(a.horario)
      ))
      return false
    }
  }, [logs])

  // Atualizar meta
  const updateGoal = useCallback(async (ml: number) => {
    if (ml < 1000 || ml > 5000) return
    setGoal(ml)
    // TODO: Salvar no perfil do usuário
  }, [])

  // Calcular total
  const todayTotal = useMemo(() =>
    logs.reduce((sum, log) => sum + log.quantidade_ml, 0),
    [logs]
  )

  // Calcular progresso (0-100+)
  const progress = useMemo(() =>
    Math.round((todayTotal / goal) * 100),
    [todayTotal, goal]
  )

  // Verificar se atingiu a meta
  const isGoalReached = todayTotal >= goal

  // Calcular restante
  const remainingMl = Math.max(0, goal - todayTotal)

  // Refresh
  const refresh = useCallback(async () => {
    await loadLogs()
  }, [loadLogs])

  return {
    logs,
    todayTotal,
    goal,
    progress,
    quickAddAmounts,
    addWater,
    removeLog,
    updateGoal,
    isAdding,
    isLoading,
    error,
    isGoalReached,
    remainingMl,
    refresh
  }
}
