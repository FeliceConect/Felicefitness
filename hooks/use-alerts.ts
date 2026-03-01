'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
type InsightPriority = 'critical' | 'high' | 'medium' | 'low'

interface Insight {
  id: string
  type: string
  priority: InsightPriority
  category: string
  title: string
  description: string
  icon: string
  data?: Record<string, unknown>
  action?: { label: string; href?: string; action?: string }
  viewed: boolean
  dismissed: boolean
  dismissedAt?: Date
  expiresAt?: Date
  createdAt: Date
}

interface AlertSettings {
  notifyCritical: boolean
  notifyHigh: boolean
  dailySummary: boolean
  summaryTime: string
}

interface UseAlertsReturn {
  // Alertas
  alerts: Insight[]
  criticalCount: number
  highCount: number

  // Agrupados por prioridade
  byPriority: Record<InsightPriority, Insight[]>

  // Ações
  resolveAlert: (id: string) => Promise<void>
  snoozeAlert: (id: string, hours: number) => Promise<void>

  // Configurações
  settings: AlertSettings
  updateSettings: (settings: Partial<AlertSettings>) => Promise<void>

  loading: boolean
}

const DEFAULT_SETTINGS: AlertSettings = {
  notifyCritical: true,
  notifyHigh: true,
  dailySummary: true,
  summaryTime: '08:00',
}

export function useAlerts(): UseAlertsReturn {
  const [alerts, setAlerts] = useState<Insight[]>([])
  const [settings, setSettings] = useState<AlertSettings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  // Carregar alertas
  const loadAlerts = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data } = (await supabase
        .from('fitness_insights')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'alert')
        .eq('dismissed', false)
        .order('priority', { ascending: true })
        .order('created_at', { ascending: false })) as {
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
        const mappedAlerts: Insight[] = data.map((i) => ({
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
        setAlerts(mappedAlerts)
      }

      // Carregar configurações
      const { data: profileData } = (await supabase
        .from('fitness_profiles')
        .select('alert_settings')
        .eq('id', user.id)
        .single()) as { data: { alert_settings: AlertSettings | null } | null }

      if (profileData?.alert_settings) {
        setSettings({ ...DEFAULT_SETTINGS, ...profileData.alert_settings })
      }
    } catch (error) {
      console.error('Error loading alerts:', error)
    } finally {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    loadAlerts()
  }, [loadAlerts])

  // Contagens
  const criticalCount = useMemo(() => {
    return alerts.filter((a) => a.priority === 'critical').length
  }, [alerts])

  const highCount = useMemo(() => {
    return alerts.filter((a) => a.priority === 'high').length
  }, [alerts])

  // Agrupados por prioridade
  const byPriority = useMemo(() => {
    return {
      critical: alerts.filter((a) => a.priority === 'critical'),
      high: alerts.filter((a) => a.priority === 'high'),
      medium: alerts.filter((a) => a.priority === 'medium'),
      low: alerts.filter((a) => a.priority === 'low'),
    }
  }, [alerts])

  // Resolver alerta
  const resolveAlert = useCallback(
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

        setAlerts((prev) => prev.filter((a) => a.id !== id))
      } catch (error) {
        console.error('Error resolving alert:', error)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  // Snooze alerta
  const snoozeAlert = useCallback(
    async (id: string, hours: number) => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        const expiresAt = new Date()
        expiresAt.setHours(expiresAt.getHours() + hours)

        await supabase
          .from('fitness_insights')
          .update({ expires_at: expiresAt.toISOString() } as never)
          .eq('id', id)

        setAlerts((prev) => prev.filter((a) => a.id !== id))
      } catch (error) {
        console.error('Error snoozing alert:', error)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  // Atualizar configurações
  const updateSettings = useCallback(
    async (newSettings: Partial<AlertSettings>) => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        const updated = { ...settings, ...newSettings }

        await supabase
          .from('fitness_profiles')
          .update({ alert_settings: updated } as never)
          .eq('id', user.id)

        setSettings(updated)
      } catch (error) {
        console.error('Error updating alert settings:', error)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [settings]
  )

  return {
    alerts,
    criticalCount,
    highCount,
    byPriority,
    resolveAlert,
    snoozeAlert,
    settings,
    updateSettings,
    loading,
  }
}
