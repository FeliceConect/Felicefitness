'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Insight, InsightFilter, InsightPriority } from '@/types/insights'

interface UseInsightsReturn {
  // Insights
  insights: Insight[]
  criticalAlerts: Insight[]
  unreadCount: number

  // Filtros
  filter: InsightFilter
  setFilter: (filter: InsightFilter) => void
  filteredInsights: Insight[]

  // Ações
  dismissInsight: (id: string) => Promise<void>
  markAsRead: (id: string) => Promise<void>
  refreshInsights: () => Promise<void>

  // Geração
  generateNewInsights: () => Promise<void>
  lastGenerated: Date | null

  loading: boolean
  generating: boolean
}

export function useInsights(): UseInsightsReturn {
  const [insights, setInsights] = useState<Insight[]>([])
  const [filter, setFilter] = useState<InsightFilter>({})
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [lastGenerated, setLastGenerated] = useState<Date | null>(null)

  const supabase = createClient()

  // Carregar insights do banco
  const loadInsights = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data } = (await supabase
        .from('fitness_insights')
        .select('*')
        .eq('user_id', user.id)
        .eq('dismissed', false)
        .order('created_at', { ascending: false })
        .limit(50)) as {
        data: Array<{
          id: string
          type: string
          priority: string
          category: string
          title: string
          description: string
          icon: string
          data: Record<string, unknown> | null
          action: Record<string, unknown> | null
          viewed: boolean
          dismissed: boolean
          dismissed_at: string | null
          expires_at: string | null
          created_at: string
        }> | null
      }

      if (data) {
        const mappedInsights: Insight[] = data.map((i) => ({
          id: i.id,
          type: i.type as Insight['type'],
          priority: i.priority as InsightPriority,
          category: i.category as Insight['category'],
          title: i.title,
          description: i.description,
          icon: i.icon,
          data: i.data || undefined,
          action: i.action as unknown as Insight['action'] | undefined,
          viewed: i.viewed,
          dismissed: i.dismissed,
          dismissedAt: i.dismissed_at ? new Date(i.dismissed_at) : undefined,
          expiresAt: i.expires_at ? new Date(i.expires_at) : undefined,
          createdAt: new Date(i.created_at),
        }))
        setInsights(mappedInsights)
      }
    } catch (error) {
      console.error('Error loading insights:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    loadInsights()
  }, [loadInsights])

  // Alertas críticos
  const criticalAlerts = useMemo(() => {
    return insights.filter(
      (i) => i.type === 'alert' && (i.priority === 'critical' || i.priority === 'high')
    )
  }, [insights])

  // Contagem de não lidos
  const unreadCount = useMemo(() => {
    return insights.filter((i) => !i.viewed).length
  }, [insights])

  // Insights filtrados
  const filteredInsights = useMemo(() => {
    let result = [...insights]

    if (filter.types && filter.types.length > 0) {
      result = result.filter((i) => filter.types!.includes(i.type))
    }

    if (filter.categories && filter.categories.length > 0) {
      result = result.filter((i) => filter.categories!.includes(i.category))
    }

    if (filter.priorities && filter.priorities.length > 0) {
      result = result.filter((i) => filter.priorities!.includes(i.priority))
    }

    if (!filter.showDismissed) {
      result = result.filter((i) => !i.dismissed)
    }

    return result
  }, [insights, filter])

  // Dispensar insight
  const dismissInsight = useCallback(
    async (id: string) => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        await supabase
          .from('fitness_insights')
          .update({ dismissed: true, dismissed_at: new Date().toISOString() } as never)
          .eq('id', id)

        setInsights((prev) =>
          prev.map((i) =>
            i.id === id ? { ...i, dismissed: true, dismissedAt: new Date() } : i
          )
        )
      } catch (error) {
        console.error('Error dismissing insight:', error)
      }
    },
    [supabase]
  )

  // Marcar como lido
  const markAsRead = useCallback(
    async (id: string) => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        await supabase
          .from('fitness_insights')
          .update({ viewed: true } as never)
          .eq('id', id)

        setInsights((prev) =>
          prev.map((i) => (i.id === id ? { ...i, viewed: true } : i))
        )
      } catch (error) {
        console.error('Error marking insight as read:', error)
      }
    },
    [supabase]
  )

  // Atualizar insights
  const refreshInsights = useCallback(async () => {
    setLoading(true)
    await loadInsights()
  }, [loadInsights])

  // Gerar novos insights via API
  const generateNewInsights = useCallback(async () => {
    setGenerating(true)
    try {
      const response = await fetch('/api/insights/generate', {
        method: 'POST',
      })

      if (response.ok) {
        setLastGenerated(new Date())
        await loadInsights()
      }
    } catch (error) {
      console.error('Error generating insights:', error)
    } finally {
      setGenerating(false)
    }
  }, [loadInsights])

  return {
    insights,
    criticalAlerts,
    unreadCount,
    filter,
    setFilter,
    filteredInsights,
    dismissInsight,
    markAsRead,
    refreshInsights,
    generateNewInsights,
    lastGenerated,
    loading,
    generating,
  }
}
