'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getTodayDateSP, getCurrentTimeSP, getNowSaoPaulo } from '@/lib/utils/date'
import { calculateWellnessScore } from '@/lib/wellness/correlations'
import type { WellnessCheckin, WellnessCheckinInput } from '@/types/wellness'

interface UseWellnessReturn {
  // Score
  todayScore: number | null
  weeklyAverage: number

  // Check-in de hoje
  todayCheckin: WellnessCheckin | null
  hasCheckedInToday: boolean

  // Streak
  checkinStreak: number

  // Ações
  submitCheckin: (data: WellnessCheckinInput) => Promise<void>

  // Histórico
  history: WellnessCheckin[]

  loading: boolean
  error: string | null
}

export function useWellness(): UseWellnessReturn {
  const [todayCheckin, setTodayCheckin] = useState<WellnessCheckin | null>(null)
  const [history, setHistory] = useState<WellnessCheckin[]>([])
  const [checkinStreak, setCheckinStreak] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()
  const today = getTodayDateSP()

  // Load wellness data
  useEffect(() => {
    async function loadData() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        // Fetch recent check-ins (last 30 days)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const { data: checkins } = await supabase
          .from('fitness_wellness_checkins')
          .select('*')
          .eq('user_id', user.id)
          .gte('data', thirtyDaysAgo.toISOString().split('T')[0])
          .order('data', { ascending: false }) as { data: Array<{ id: string; user_id: string; data: string; horario: string | null; humor: number; stress: number; energia: number; fatores_positivos: string[] | null; fatores_negativos: string[] | null; notas: string | null; created_at: string }> | null }

        if (checkins) {
          const mappedCheckins: WellnessCheckin[] = checkins.map((c) => ({
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

          setHistory(mappedCheckins)

          // Check if today has a check-in
          const todayCheckinData = mappedCheckins.find((c) => c.data === today)
          setTodayCheckin(todayCheckinData || null)

          // Calculate streak
          let streak = 0
          const checkDate = new Date()
          for (let i = 0; i < 30; i++) {
            const dateStr = checkDate.toISOString().split('T')[0]
            if (mappedCheckins.some((c) => c.data === dateStr)) {
              streak++
              checkDate.setDate(checkDate.getDate() - 1)
            } else if (i > 0) {
              // Only break if not today (give user chance to check in today)
              break
            } else {
              checkDate.setDate(checkDate.getDate() - 1)
            }
          }
          setCheckinStreak(streak)
        }
      } catch (err) {
        console.error('Error loading wellness data:', err)
        setError('Erro ao carregar dados')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [supabase, today])

  // Submit check-in
  const submitCheckin = useCallback(
    async (data: WellnessCheckinInput) => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) throw new Error('Usuário não autenticado')

        const horario = getCurrentTimeSP()

        const checkinData = {
          user_id: user.id,
          data: today,
          horario,
          humor: data.mood,
          stress: data.stress,
          energia: data.energy,
          fatores_positivos: data.positiveFactors,
          fatores_negativos: data.negativeFactors,
          notas: data.notes || null,
        }

        // Upsert to handle updating existing check-in
        const { data: result, error: insertError } = await supabase
          .from('fitness_wellness_checkins')
          .upsert(checkinData as never, { onConflict: 'user_id,data' })
          .select()
          .single() as { data: { id: string; user_id: string; data: string; horario: string | null; humor: number; stress: number; energia: number; fatores_positivos: string[] | null; fatores_negativos: string[] | null; notas: string | null; created_at: string } | null; error: Error | null }

        if (insertError) throw insertError
        if (!result) throw new Error('No data returned')

        const newCheckin: WellnessCheckin = {
          id: result.id,
          userId: result.user_id,
          data: result.data,
          horario: result.horario || undefined,
          humor: result.humor,
          stress: result.stress,
          energia: result.energia,
          fatoresPositivos: result.fatores_positivos || [],
          fatoresNegativos: result.fatores_negativos || [],
          notas: result.notas || undefined,
          createdAt: result.created_at,
        }

        setTodayCheckin(newCheckin)
        setHistory((prev) => {
          const filtered = prev.filter((c) => c.data !== today)
          return [newCheckin, ...filtered]
        })

        // Update streak
        if (!todayCheckin) {
          setCheckinStreak((prev) => prev + 1)
        }
      } catch (err) {
        console.error('Error submitting check-in:', err)
        throw err
      }
    },
    [supabase, today, todayCheckin]
  )

  // Calculate today's score
  const todayScore = todayCheckin
    ? calculateWellnessScore({
        mood: todayCheckin.humor,
        stress: todayCheckin.stress,
        energy: todayCheckin.energia,
        sleep: 70, // Default sleep score, would need to integrate with sleep tracking
      })
    : null

  // Calculate weekly average
  const weeklyAverage =
    history.length > 0
      ? Math.round(
          history
            .slice(0, 7)
            .reduce(
              (sum, c) =>
                sum +
                calculateWellnessScore({
                  mood: c.humor,
                  stress: c.stress,
                  energy: c.energia,
                  sleep: 70,
                }),
              0
            ) / Math.min(history.length, 7)
        )
      : 0

  return {
    todayScore,
    weeklyAverage,
    todayCheckin,
    hasCheckedInToday: !!todayCheckin,
    checkinStreak,
    submitCheckin,
    history,
    loading,
    error,
  }
}
