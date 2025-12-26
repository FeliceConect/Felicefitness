"use client"

import { useState, useEffect, useCallback, useRef } from 'react'

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
  const checkedRef = useRef(false)

  const isSupported = typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window

  // Verificar estado inicial
  useEffect(() => {
    if (checkedRef.current) return
    checkedRef.current = true

    if (!isSupported) {
      console.log('Push: Não suportado - SW:', 'serviceWorker' in navigator, 'Push:', typeof window !== 'undefined' && 'PushManager' in window, 'Notif:', typeof window !== 'undefined' && 'Notification' in window)
      setStatus('unsupported')
      return
    }

    const checkSubscription = async () => {
      try {
        // Verificar permissão atual
        const perm = Notification.permission
        console.log('Push: Permissão atual =', perm)
        setPermission(perm)

        if (perm === 'denied') {
          setStatus('denied')
          return
        }

        // Registrar service worker se não estiver registrado
        let registration: ServiceWorkerRegistration | undefined

        try {
          // Primeiro, tentar obter registration existente
          const registrations = await navigator.serviceWorker.getRegistrations()
          console.log('Push: Registrations encontradas:', registrations.length)

          if (registrations.length > 0) {
            registration = registrations[0]
          } else {
            // Registrar service worker
            // Em desenvolvimento usa sw-dev.js, em produção o next-pwa gera sw.js
            // Mas podemos usar sw-dev.js como fallback se sw.js falhar
            const swPaths = process.env.NODE_ENV === 'development'
              ? ['/sw-dev.js']
              : ['/sw.js', '/sw-dev.js']

            for (const swPath of swPaths) {
              try {
                console.log('Push: Tentando registrar:', swPath)
                registration = await navigator.serviceWorker.register(swPath)
                console.log('Push: Service worker registrado:', registration.scope)
                break
              } catch (regError) {
                console.warn('Push: Falha ao registrar', swPath, regError)
                if (swPath === swPaths[swPaths.length - 1]) {
                  throw regError
                }
              }
            }
          }

          // Aguardar service worker ficar pronto (com timeout)
          const timeoutPromise = new Promise<null>((_, reject) => {
            setTimeout(() => reject(new Error('Timeout aguardando SW')), 10000)
          })

          await Promise.race([navigator.serviceWorker.ready, timeoutPromise])
          console.log('Push: Service worker pronto')

          // Verificar subscription existente
          if (registration && registration.pushManager) {
            const sub = await registration.pushManager.getSubscription()
            console.log('Push: Subscription existente?', !!sub)

            if (sub) {
              setSubscription(sub)
              setStatus('subscribed')
            } else {
              setStatus('unsubscribed')
            }
          } else {
            console.log('Push: pushManager não disponível')
            setStatus('unsubscribed')
          }
        } catch (swError) {
          console.error('Push: Erro com service worker:', swError)
          setStatus('unsubscribed')
        }
      } catch (err) {
        console.error('Push: Erro ao verificar subscription:', err)
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
    console.log('Push: Iniciando subscribe...')

    try {
      // Solicitar permissão
      console.log('Push: Solicitando permissão...')
      const perm = await Notification.requestPermission()
      console.log('Push: Permissão recebida =', perm)
      setPermission(perm)

      if (perm !== 'granted') {
        setStatus('denied')
        setError('Permissão para notificações negada. Vá em Ajustes → FeliceFit → Notificações para ativar.')
        return false
      }

      // Obter service worker registration
      console.log('Push: Aguardando service worker...')
      let registration: ServiceWorkerRegistration

      try {
        // Verificar se já existe registration
        const registrations = await navigator.serviceWorker.getRegistrations()

        if (registrations.length === 0) {
          // Registrar SW se não existir
          const swPaths = process.env.NODE_ENV === 'development'
            ? ['/sw-dev.js']
            : ['/sw.js', '/sw-dev.js']

          for (const swPath of swPaths) {
            try {
              console.log('Push: Tentando registrar:', swPath)
              await navigator.serviceWorker.register(swPath)
              console.log('Push: Service worker registrado')
              break
            } catch (regError) {
              console.warn('Push: Falha ao registrar', swPath)
              if (swPath === swPaths[swPaths.length - 1]) {
                throw regError
              }
            }
          }
        }

        // Tentar obter registration com timeout
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Timeout aguardando service worker')), 10000)
        })

        registration = await Promise.race([
          navigator.serviceWorker.ready,
          timeoutPromise
        ])
        console.log('Push: Service worker obtido:', registration.scope)
      } catch (swError) {
        console.error('Push: Erro ao obter service worker:', swError)
        setError('Service worker não está disponível. Tente recarregar o app.')
        return false
      }

      // Obter chave pública VAPID
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      console.log('Push: VAPID key presente?', !!vapidKey)

      if (!vapidKey) {
        setError('Chave VAPID não configurada no servidor')
        return false
      }

      // Converter chave para Uint8Array
      const applicationServerKey = urlBase64ToUint8Array(vapidKey)

      // Criar subscription
      console.log('Push: Criando subscription...')
      let sub: PushSubscription

      try {
        sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey as BufferSource
        })
        console.log('Push: Subscription criada:', sub.endpoint.substring(0, 50) + '...')
      } catch (subError) {
        console.error('Push: Erro ao criar subscription:', subError)
        const errorMessage = subError instanceof Error ? subError.message : 'Erro desconhecido'

        if (errorMessage.includes('permission')) {
          setError('Permissão negada pelo sistema. Verifique as configurações do iOS.')
        } else {
          setError(`Erro ao criar subscription: ${errorMessage}`)
        }
        return false
      }

      // Enviar subscription para o servidor
      console.log('Push: Enviando para servidor...')
      try {
        const response = await fetch('/api/notifications/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subscription: sub.toJSON(),
            userAgent: navigator.userAgent
          })
        })

        if (!response.ok) {
          const data = await response.json().catch(() => ({ error: 'Erro no servidor' }))
          throw new Error(data.error || `Erro ${response.status}`)
        }

        console.log('Push: Subscription salva no servidor!')
      } catch (serverError) {
        console.error('Push: Erro ao salvar no servidor:', serverError)
        // Mesmo com erro no servidor, a subscription local foi criada
        // Podemos tentar novamente depois
        setError('Subscription criada, mas erro ao salvar. Tente novamente.')
        return false
      }

      setSubscription(sub)
      setStatus('subscribed')
      console.log('Push: Subscribe concluído com sucesso!')
      return true

    } catch (err) {
      console.error('Push: Erro geral ao inscrever:', err)
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
