"use client"

import { useState, useEffect, useCallback } from 'react'

type SubscriptionStatus = 'loading' | 'subscribed' | 'unsubscribed' | 'unsupported' | 'denied'

interface UsePushSubscriptionReturn {
  status: SubscriptionStatus
  isSupported: boolean
  isSubscribed: boolean
  permission: NotificationPermission | null
  subscribe: () => Promise<boolean>
  unsubscribe: () => Promise<boolean>
  error: string | null
}

/**
 * Hook para gerenciar subscription de push notifications
 */
export function usePushSubscription(): UsePushSubscriptionReturn {
  const [status, setStatus] = useState<SubscriptionStatus>('loading')
  const [permission, setPermission] = useState<NotificationPermission | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)

  const isSupported = typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window

  // Verificar estado inicial
  useEffect(() => {
    if (!isSupported) {
      setStatus('unsupported')
      return
    }

    const checkSubscription = async () => {
      try {
        // Verificar permissão
        if ('Notification' in window) {
          const perm = Notification.permission
          setPermission(perm)

          if (perm === 'denied') {
            setStatus('denied')
            return
          }
        }

        // Verificar se service worker está registrado com timeout
        const timeoutPromise = new Promise<null>((_, reject) => {
          setTimeout(() => reject(new Error('Timeout')), 5000)
        })

        const swReady = navigator.serviceWorker.ready

        try {
          const registration = await Promise.race([swReady, timeoutPromise]) as ServiceWorkerRegistration

          if (registration && registration.pushManager) {
            const sub = await registration.pushManager.getSubscription()

            if (sub) {
              setSubscription(sub)
              setStatus('subscribed')
            } else {
              setStatus('unsubscribed')
            }
          } else {
            setStatus('unsubscribed')
          }
        } catch (timeoutErr) {
          console.warn('Service worker não está pronto:', timeoutErr)
          setStatus('unsubscribed')
        }
      } catch (err) {
        console.error('Erro ao verificar subscription:', err)
        setStatus('unsubscribed')
      }
    }

    checkSubscription()
  }, [isSupported])

  // Função para inscrever
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError('Push notifications não são suportadas neste navegador')
      return false
    }

    setError(null)

    try {
      // Solicitar permissão
      const permission = await Notification.requestPermission()
      setPermission(permission)

      if (permission !== 'granted') {
        setStatus('denied')
        setError('Permissão para notificações negada')
        return false
      }

      // Obter service worker registration
      const registration = await navigator.serviceWorker.ready

      // Obter chave pública VAPID
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidKey) {
        setError('Chave VAPID não configurada')
        return false
      }

      // Converter chave para Uint8Array
      const applicationServerKey = urlBase64ToUint8Array(vapidKey)

      // Criar subscription
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as BufferSource
      })

      // Enviar subscription para o servidor
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: sub.toJSON(),
          userAgent: navigator.userAgent
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao salvar subscription')
      }

      setSubscription(sub)
      setStatus('subscribed')
      return true

    } catch (err) {
      console.error('Erro ao inscrever:', err)
      setError(err instanceof Error ? err.message : 'Erro ao ativar notificações')
      return false
    }
  }, [isSupported])

  // Função para desinscrever
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!subscription) {
      setStatus('unsubscribed')
      return true
    }

    setError(null)

    try {
      // Desinscrever do push manager
      await subscription.unsubscribe()

      // Notificar servidor
      await fetch('/api/notifications/subscribe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: subscription.endpoint
        })
      })

      setSubscription(null)
      setStatus('unsubscribed')
      return true

    } catch (err) {
      console.error('Erro ao desinscrever:', err)
      setError(err instanceof Error ? err.message : 'Erro ao desativar notificações')
      return false
    }
  }, [subscription])

  return {
    status,
    isSupported,
    isSubscribed: status === 'subscribed',
    permission,
    subscribe,
    unsubscribe,
    error
  }
}

/**
 * Converte chave base64 para Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }

  return outputArray
}
