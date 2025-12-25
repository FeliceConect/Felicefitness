"use client"

import { useState, useEffect, useCallback } from 'react'
import { usePushSubscription } from './use-push-subscription'
import type { NotificationPreferences, NotificationHistory, NotificationType } from '@/types/notifications'
import { DEFAULT_NOTIFICATION_PREFERENCES } from '@/types/notifications'

interface UseNotificationsReturn {
  // Push subscription
  isSupported: boolean
  isSubscribed: boolean
  permission: NotificationPermission | null
  subscriptionError: string | null
  subscribe: () => Promise<boolean>
  unsubscribe: () => Promise<boolean>

  // Preferences
  preferences: NotificationPreferences
  isLoadingPreferences: boolean
  updatePreferences: (prefs: Partial<NotificationPreferences>) => Promise<boolean>

  // History
  history: NotificationHistory[]
  unreadCount: number
  isLoadingHistory: boolean
  loadHistory: (options?: { limit?: number; offset?: number; type?: NotificationType }) => Promise<void>
  markAsRead: (ids: string[]) => Promise<boolean>
  markAllAsRead: () => Promise<boolean>
  clearHistory: () => Promise<boolean>

  // Testing
  sendTestNotification: (type?: string) => Promise<boolean>
  testError: string | null
}

export function useNotifications(): UseNotificationsReturn {
  // Push subscription
  const {
    isSupported,
    isSubscribed,
    permission,
    subscribe,
    unsubscribe,
    error: subscriptionError
  } = usePushSubscription()

  // Preferences state
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_NOTIFICATION_PREFERENCES)
  const [isLoadingPreferences, setIsLoadingPreferences] = useState(true)

  // History state
  const [history, setHistory] = useState<NotificationHistory[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)

  // Test state
  const [testError, setTestError] = useState<string | null>(null)

  // Carregar preferências
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const response = await fetch('/api/notifications/preferences')
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.preferences) {
            setPreferences(data.preferences)
          }
        }
      } catch (error) {
        console.error('Erro ao carregar preferências:', error)
      } finally {
        setIsLoadingPreferences(false)
      }
    }

    loadPreferences()
  }, [])

  // Atualizar preferências
  const updatePreferences = useCallback(async (newPrefs: Partial<NotificationPreferences>): Promise<boolean> => {
    try {
      const updatedPrefs = { ...preferences, ...newPrefs }

      const response = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences: updatedPrefs })
      })

      if (!response.ok) {
        return false
      }

      setPreferences(updatedPrefs)
      return true
    } catch (error) {
      console.error('Erro ao atualizar preferências:', error)
      return false
    }
  }, [preferences])

  // Carregar histórico
  const loadHistory = useCallback(async (options?: {
    limit?: number
    offset?: number
    type?: NotificationType
  }): Promise<void> => {
    setIsLoadingHistory(true)
    try {
      const params = new URLSearchParams()
      if (options?.limit) params.set('limit', options.limit.toString())
      if (options?.offset) params.set('offset', options.offset.toString())
      if (options?.type) params.set('type', options.type)

      const response = await fetch(`/api/notifications/history?${params}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setHistory(data.notifications || [])
          // Contar não lidas
          const unread = (data.notifications || []).filter(
            (n: NotificationHistory) => !n.readAt
          ).length
          setUnreadCount(unread)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar histórico:', error)
    } finally {
      setIsLoadingHistory(false)
    }
  }, [])

  // Marcar como lida
  const markAsRead = useCallback(async (ids: string[]): Promise<boolean> => {
    try {
      const response = await fetch('/api/notifications/history', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markAsRead', notificationIds: ids })
      })

      if (response.ok) {
        setHistory(prev =>
          prev.map(n =>
            ids.includes(n.id) ? { ...n, readAt: new Date() } : n
          )
        )
        setUnreadCount(prev => Math.max(0, prev - ids.length))
        return true
      }
      return false
    } catch (error) {
      console.error('Erro ao marcar como lida:', error)
      return false
    }
  }, [])

  // Marcar todas como lidas
  const markAllAsRead = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/notifications/history', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markAllAsRead' })
      })

      if (response.ok) {
        setHistory(prev =>
          prev.map(n => ({ ...n, readAt: n.readAt || new Date() }))
        )
        setUnreadCount(0)
        return true
      }
      return false
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error)
      return false
    }
  }, [])

  // Limpar histórico
  const clearHistory = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/notifications/history', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deleteAll: true })
      })

      if (response.ok) {
        setHistory([])
        setUnreadCount(0)
        return true
      }
      return false
    } catch (error) {
      console.error('Erro ao limpar histórico:', error)
      return false
    }
  }, [])

  // Enviar notificação de teste
  const sendTestNotification = useCallback(async (type?: string): Promise<boolean> => {
    setTestError(null)

    try {
      const response = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testType: type || 'boas_vindas' })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        setTestError(data.error || 'Erro ao enviar notificação de teste')
        return false
      }

      return true
    } catch (error) {
      console.error('Erro ao enviar teste:', error)
      setTestError('Erro de conexão ao enviar teste')
      return false
    }
  }, [])

  return {
    // Push subscription
    isSupported,
    isSubscribed,
    permission,
    subscriptionError,
    subscribe,
    unsubscribe,

    // Preferences
    preferences,
    isLoadingPreferences,
    updatePreferences,

    // History
    history,
    unreadCount,
    isLoadingHistory,
    loadHistory,
    markAsRead,
    markAllAsRead,
    clearHistory,

    // Testing
    sendTestNotification,
    testError
  }
}
