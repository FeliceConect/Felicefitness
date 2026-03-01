'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { WellnessCheckin, MoodTrend, WeekMoodData } from '@/types/wellness'

interface UseMoodTrackingReturn {
  // Dados
  todayMood: number | null
  weekMoods: WeekMoodData[]
  monthMoods: WeekMoodData[]

  // Estatísticas
  weeklyAverage: number
  monthlyAverage: number
  trend: MoodTrend

  // Padrões
  bestDays: string[]
  worstDays: string[]

  // Ações
  logMood: (mood: number, factors?: string[], notes?: string) => Promise<void>

  loading: boolean
}

export function useMoodTracking(): UseMoodTrackingReturn {
  const [checkins, setCheckins] = useState<WellnessCheckin[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    async function loadMoods() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const { data } = await supabase
          .from('fitness_wellness_checkins')
          .select('*')
          .eq('user_id', user.id)
          .gte('data', thirtyDaysAgo.toISOString().split('T')[0])
          .order('data', { ascending: false }) as { data: Array<{ id: string; user_id: string; data: string; horario: string | null; humor: number; stress: number; energia: number; fatores_positivos: string[] | null; fatores_negativos: string[] | null; notas: string | null; created_at: string }> | null }

        if (data) {
          const mappedCheckins: WellnessCheckin[] = data.map((c) => ({
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
          setCheckins(mappedCheckins)
        }
      } catch (error) {
        console.error('Error loading moods:', error)
      } finally {
        setLoading(false)
      }
    }

    loadMoods()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Today's mood
  const todayMood = checkins.find((c) => c.data === today)?.humor || null

  // Build week moods array
  const weekMoods: WeekMoodData[] = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    const checkin = checkins.find((c) => c.data === dateStr)
    weekMoods.push({
      date: dateStr,
      mood: checkin?.humor || null,
    })
  }

  // Build month moods array
  const monthMoods: WeekMoodData[] = []
  for (let i = 29; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    const checkin = checkins.find((c) => c.data === dateStr)
    monthMoods.push({
      date: dateStr,
      mood: checkin?.humor || null,
    })
  }

  // Calculate averages
  const weekCheckins = checkins.filter((c) => {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    return new Date(c.data) >= sevenDaysAgo
  })

  const weeklyAverage =
    weekCheckins.length > 0
      ? Math.round((weekCheckins.reduce((sum, c) => sum + c.humor, 0) / weekCheckins.length) * 10) /
        10
      : 0

  const monthlyAverage =
    checkins.length > 0
      ? Math.round((checkins.reduce((sum, c) => sum + c.humor, 0) / checkins.length) * 10) / 10
      : 0

  // Calculate trend
  let trend: MoodTrend = 'stable'
  if (weekCheckins.length >= 3) {
    const firstHalf = weekCheckins.slice(Math.floor(weekCheckins.length / 2))
    const secondHalf = weekCheckins.slice(0, Math.floor(weekCheckins.length / 2))

    const firstAvg = firstHalf.reduce((sum, c) => sum + c.humor, 0) / firstHalf.length
    const secondAvg =
      secondHalf.length > 0
        ? secondHalf.reduce((sum, c) => sum + c.humor, 0) / secondHalf.length
        : firstAvg

    if (secondAvg - firstAvg > 0.3) {
      trend = 'up'
    } else if (firstAvg - secondAvg > 0.3) {
      trend = 'down'
    }
  }

  // Calculate best/worst days
  const dayMoods: Record<string, number[]> = {}
  const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

  checkins.forEach((c) => {
    const day = dayNames[new Date(c.data).getDay()]
    if (!dayMoods[day]) dayMoods[day] = []
    dayMoods[day].push(c.humor)
  })

  const dayAverages = Object.entries(dayMoods)
    .map(([day, moods]) => ({
      day,
      avg: moods.reduce((a, b) => a + b, 0) / moods.length,
    }))
    .sort((a, b) => b.avg - a.avg)

  const bestDays = dayAverages.slice(0, 2).map((d) => d.day)
  const worstDays = dayAverages.slice(-2).map((d) => d.day)

  // Log mood
  const logMood = useCallback(
    async (mood: number, factors?: string[], notes?: string) => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) throw new Error('Usuário não autenticado')

        const now = new Date()
        const horario = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

        await supabase.from('fitness_wellness_checkins').upsert(
          {
            user_id: user.id,
            data: today,
            horario,
            humor: mood,
            stress: 3, // Default
            energia: 3, // Default
            fatores_positivos: factors?.filter((f) => !f.startsWith('neg_')) || [],
            fatores_negativos: factors?.filter((f) => f.startsWith('neg_')) || [],
            notas: notes || null,
          } as never,
          { onConflict: 'user_id,data' }
        )

        // Refetch data
        const { data } = await supabase
          .from('fitness_wellness_checkins')
          .select('*')
          .eq('user_id', user.id)
          .order('data', { ascending: false })
          .limit(30) as { data: Array<{ id: string; user_id: string; data: string; horario: string | null; humor: number; stress: number; energia: number; fatores_positivos: string[] | null; fatores_negativos: string[] | null; notas: string | null; created_at: string }> | null }

        if (data) {
          const mappedCheckins: WellnessCheckin[] = data.map((c) => ({
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
          setCheckins(mappedCheckins)
        }
      } catch (error) {
        console.error('Error logging mood:', error)
        throw error
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [today]
  )

  return {
    todayMood,
    weekMoods,
    monthMoods,
    weeklyAverage,
    monthlyAverage,
    trend,
    bestDays,
    worstDays,
    logMood,
    loading,
  }
}
