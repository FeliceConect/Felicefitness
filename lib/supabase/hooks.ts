"use client"

import { useEffect, useState, useCallback } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from './client'
import type { Profile } from '@/types/database'

/**
 * Hook para obter o usuário atual e seu perfil
 */
export function useUser() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const supabase = createClient()

    async function getUser() {
      try {
        setLoading(true)

        // Obter usuário autenticado
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError) throw userError
        if (!user) {
          setUser(null)
          setProfile(null)
          return
        }

        setUser(user)

        // Obter perfil do usuário
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: profileData, error: profileError } = await (supabase as any)
          .from('fitness_profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profileError && profileError.code !== 'PGRST116') {
          throw profileError
        }

        setProfile(profileData)
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    getUser()

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user)
          // Recarregar perfil quando usuário mudar
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: profileData } = await (supabase as any)
            .from('fitness_profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
          setProfile(profileData)
        } else {
          setUser(null)
          setProfile(null)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return { user, profile, loading, error }
}

/**
 * Hook para obter o resumo diário do usuário
 */
export function useDailySummary(date: string) {
  const [summary, setSummary] = useState<{
    treino: { concluido: boolean; nome: string | null }
    agua: { consumido_ml: number; meta_ml: number }
    nutricao: {
      calorias: number
      proteinas: number
      carboidratos: number
      gorduras: number
      meta_calorias: number | null
      meta_proteinas: number | null
      meta_carboidratos: number | null
      meta_gorduras: number | null
    }
    streak: number
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true)
      const supabase = createClient()

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error: fetchError } = await (supabase as any).rpc('get_daily_summary', {
        p_user_id: user.id,
        p_date: date,
      })

      if (fetchError) throw fetchError

      setSummary(data)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [date])

  useEffect(() => {
    fetchSummary()
  }, [fetchSummary])

  return { summary, loading, error, refetch: fetchSummary }
}

/**
 * Hook para registros de água
 */
export function useWaterLogs(date: string) {
  const [logs, setLogs] = useState<{ id: string; quantidade_ml: number; horario: string }[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true)
      const supabase = createClient()

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('fitness_water_logs')
        .select('id, quantidade_ml, horario')
        .eq('user_id', user.id)
        .eq('data', date)
        .order('horario', { ascending: true })

      if (error) throw error

      setLogs(data || [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setTotal(data?.reduce((acc: number, log: any) => acc + log.quantidade_ml, 0) || 0)
    } catch (err) {
      console.error('Erro ao carregar registros de água:', err)
    } finally {
      setLoading(false)
    }
  }, [date])

  const addWater = async (quantidade_ml: number) => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return false

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from('fitness_water_logs').insert({
        user_id: user.id,
        data: date,
        quantidade_ml,
      })

      if (error) throw error

      await fetchLogs()
      return true
    } catch (err) {
      console.error('Erro ao adicionar água:', err)
      return false
    }
  }

  const removeWater = async (id: string) => {
    try {
      const supabase = createClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from('fitness_water_logs').delete().eq('id', id)

      if (error) throw error

      await fetchLogs()
      return true
    } catch (err) {
      console.error('Erro ao remover registro de água:', err)
      return false
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  return { logs, total, loading, addWater, removeWater, refetch: fetchLogs }
}

/**
 * Hook para buscar exercícios da biblioteca
 */
export function useExercises(query?: string, grupoMuscular?: string) {
  const [exercises, setExercises] = useState<
    { id: string; nome: string; grupo_muscular: string; equipamento: string | null; dificuldade: string | null }[]
  >([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchExercises() {
      try {
        setLoading(true)
        const supabase = createClient()

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let queryBuilder = (supabase as any)
          .from('fitness_exercises_library')
          .select('id, nome, grupo_muscular, equipamento, dificuldade')
          .order('nome')

        if (query) {
          queryBuilder = queryBuilder.ilike('nome', `%${query}%`)
        }

        if (grupoMuscular) {
          queryBuilder = queryBuilder.eq('grupo_muscular', grupoMuscular)
        }

        const { data, error } = await queryBuilder.limit(50)

        if (error) throw error

        setExercises(data || [])
      } catch (err) {
        console.error('Erro ao carregar exercícios:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchExercises()
  }, [query, grupoMuscular])

  return { exercises, loading }
}

/**
 * Hook para estatísticas do usuário
 */
export function useUserStats() {
  const [stats, setStats] = useState<{
    treinos: { total: number; este_mes: number; tempo_total_horas: number }
    prs: { total: number; este_mes: number }
    streak: { atual: number; maior: number }
    conquistas: { total: number; pontos: number }
    peso: { atual: number | null; variacao_mes: number | null }
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true)
        const supabase = createClient()

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase as any).rpc('get_user_stats', {
          p_user_id: user.id,
        })

        if (error) throw error

        setStats(data)
      } catch (err) {
        console.error('Erro ao carregar estatísticas:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  return { stats, loading }
}
