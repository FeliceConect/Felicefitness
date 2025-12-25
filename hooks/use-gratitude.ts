'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getTodayDateSP, getNowSaoPaulo } from '@/lib/utils/date'
import type { GratitudeEntry } from '@/types/wellness'

interface UseGratitudeReturn {
  // Today's entries
  todayEntries: GratitudeEntry[]
  canAddMore: boolean

  // History
  recentEntries: { date: string; entries: GratitudeEntry[] }[]
  totalEntries: number

  // Streak
  gratitudeStreak: number

  // Ações
  addEntry: (text: string) => Promise<void>
  removeEntry: (id: string) => Promise<void>
  updateEntry: (id: string, text: string) => Promise<void>

  // Stats
  frequentThemes: string[]

  loading: boolean
}

const MAX_ENTRIES_PER_DAY = 5

export function useGratitude(): UseGratitudeReturn {
  const [allEntries, setAllEntries] = useState<GratitudeEntry[]>([])
  const [gratitudeStreak, setGratitudeStreak] = useState(0)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()
  const today = getTodayDateSP()

  // Load gratitude entries
  useEffect(() => {
    async function loadEntries() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        // Get entries from last 30 days
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const { data } = await supabase
          .from('fitness_gratitude_entries')
          .select('*')
          .eq('user_id', user.id)
          .gte('data', thirtyDaysAgo.toISOString().split('T')[0])
          .order('data', { ascending: false })
          .order('ordem', { ascending: true }) as { data: Array<{ id: string; user_id: string; data: string; entrada: string; ordem: number; created_at: string }> | null }

        if (data) {
          const mapped: GratitudeEntry[] = data.map((e) => ({
            id: e.id,
            userId: e.user_id,
            data: e.data,
            entrada: e.entrada,
            ordem: e.ordem,
            createdAt: e.created_at,
          }))
          setAllEntries(mapped)

          // Calculate streak
          let streak = 0
          const checkDate = new Date()
          const entriesByDate = new Map<string, boolean>()

          mapped.forEach((e) => {
            entriesByDate.set(e.data, true)
          })

          for (let i = 0; i < 30; i++) {
            const dateStr = checkDate.toISOString().split('T')[0]
            if (entriesByDate.has(dateStr)) {
              streak++
              checkDate.setDate(checkDate.getDate() - 1)
            } else if (i > 0) {
              break
            } else {
              checkDate.setDate(checkDate.getDate() - 1)
            }
          }
          setGratitudeStreak(streak)
        }
      } catch (error) {
        console.error('Error loading gratitude entries:', error)
      } finally {
        setLoading(false)
      }
    }

    loadEntries()
  }, [supabase])

  // Today's entries
  const todayEntries = allEntries.filter((e) => e.data === today)
  const canAddMore = todayEntries.length < MAX_ENTRIES_PER_DAY

  // Group entries by date for recent history
  const recentEntries: { date: string; entries: GratitudeEntry[] }[] = []
  const entriesByDate = new Map<string, GratitudeEntry[]>()

  allEntries.forEach((entry) => {
    const existing = entriesByDate.get(entry.data) || []
    entriesByDate.set(entry.data, [...existing, entry])
  })

  entriesByDate.forEach((entries, date) => {
    if (date !== today) {
      recentEntries.push({ date, entries })
    }
  })

  // Add entry
  const addEntry = useCallback(
    async (text: string) => {
      if (!canAddMore) return

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) throw new Error('Usuário não autenticado')

        const newOrder = todayEntries.length + 1

        const { data, error } = await supabase
          .from('fitness_gratitude_entries')
          .insert({
            user_id: user.id,
            data: today,
            entrada: text,
            ordem: newOrder,
          } as never)
          .select()
          .single() as { data: { id: string; user_id: string; data: string; entrada: string; ordem: number; created_at: string } | null; error: Error | null }

        if (error) throw error
        if (!data) throw new Error('No data returned')

        const newEntry: GratitudeEntry = {
          id: data.id,
          userId: data.user_id,
          data: data.data,
          entrada: data.entrada,
          ordem: data.ordem,
          createdAt: data.created_at,
        }

        setAllEntries((prev) => [newEntry, ...prev])

        // Update streak if first entry today
        if (todayEntries.length === 0) {
          setGratitudeStreak((prev) => prev + 1)
        }
      } catch (error) {
        console.error('Error adding gratitude entry:', error)
        throw error
      }
    },
    [supabase, today, todayEntries.length, canAddMore]
  )

  // Remove entry
  const removeEntry = useCallback(
    async (id: string) => {
      try {
        const { error } = await supabase.from('fitness_gratitude_entries').delete().eq('id', id)

        if (error) throw error

        setAllEntries((prev) => prev.filter((e) => e.id !== id))
      } catch (error) {
        console.error('Error removing gratitude entry:', error)
        throw error
      }
    },
    [supabase]
  )

  // Update entry
  const updateEntry = useCallback(
    async (id: string, text: string) => {
      try {
        const { error } = await supabase
          .from('fitness_gratitude_entries')
          .update({ entrada: text } as never)
          .eq('id', id)

        if (error) throw error

        setAllEntries((prev) =>
          prev.map((e) => (e.id === id ? { ...e, entrada: text } : e))
        )
      } catch (error) {
        console.error('Error updating gratitude entry:', error)
        throw error
      }
    },
    [supabase]
  )

  // Extract frequent themes (simple word frequency)
  const frequentThemes: string[] = []
  const wordCounts = new Map<string, number>()
  const commonWords = new Set([
    'de',
    'da',
    'do',
    'e',
    'a',
    'o',
    'que',
    'por',
    'para',
    'com',
    'em',
    'um',
    'uma',
    'os',
    'as',
    'meu',
    'minha',
    'no',
    'na',
    'ao',
    'pela',
    'pelo',
  ])

  allEntries.forEach((entry) => {
    const words = entry.entrada
      .toLowerCase()
      .replace(/[^\wà-ú\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 3 && !commonWords.has(w))

    words.forEach((word) => {
      wordCounts.set(word, (wordCounts.get(word) || 0) + 1)
    })
  })

  const sortedWords = Array.from(wordCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([word]) => word.charAt(0).toUpperCase() + word.slice(1))

  frequentThemes.push(...sortedWords)

  return {
    todayEntries,
    canAddMore,
    recentEntries,
    totalEntries: allEntries.length,
    gratitudeStreak,
    addEntry,
    removeEntry,
    updateEntry,
    frequentThemes,
    loading,
  }
}
