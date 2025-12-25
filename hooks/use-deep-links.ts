'use client'

import { useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useQuickActions } from './use-quick-actions'

interface UseDeepLinksReturn {
  // Navegar via deep link
  handleDeepLink: (url: string) => void

  // Gerar deep link
  generateLink: (route: string, params?: Record<string, string>) => string

  // Compartilhar link
  shareLink: (link: string, title?: string) => Promise<void>
}

export function useDeepLinks(): UseDeepLinksReturn {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { executeById } = useQuickActions()

  // Processar deep links na inicialização
  useEffect(() => {
    const action = searchParams.get('action')
    const amount = searchParams.get('amount')

    if (action) {
      switch (action) {
        case 'add':
          if (amount) {
            executeById('water', { amount: parseInt(amount) })
          }
          break
        case 'start':
          executeById('workout')
          break
        case 'revolade':
          executeById('revolade')
          break
      }
    }
  }, [searchParams, executeById])

  // Processar deep link manualmente
  const handleDeepLink = useCallback((url: string) => {
    try {
      const parsed = new URL(url)
      const pathname = parsed.pathname
      const action = parsed.searchParams.get('action')
      const params: Record<string, string> = {}

      parsed.searchParams.forEach((value, key) => {
        params[key] = value
      })

      switch (pathname) {
        case '/agua':
          if (action === 'add') {
            executeById('water', { amount: parseInt(params.amount || '250') })
          } else {
            router.push('/agua')
          }
          break

        case '/treino':
        case '/treino/hoje':
          if (action === 'start') {
            executeById('workout')
          } else {
            router.push('/treino')
          }
          break

        case '/suplementos':
          if (action === 'revolade') {
            executeById('revolade')
          } else {
            router.push('/suplementos')
          }
          break

        case '/alimentacao/registrar':
        case '/alimentacao/refeicao/nova':
          router.push('/alimentacao/refeicao/nova')
          break

        case '/coach':
          router.push('/coach')
          break

        case '/dashboard':
          router.push('/dashboard')
          break

        default:
          router.push(pathname)
      }
    } catch (error) {
      console.error('Error handling deep link:', error)
    }
  }, [router, executeById])

  // Gerar deep link
  const generateLink = useCallback((route: string, params?: Record<string, string>) => {
    const base = typeof window !== 'undefined' ? window.location.origin : ''
    const url = new URL(route, base)

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, value)
      })
    }

    return url.toString()
  }, [])

  // Compartilhar link
  const shareLink = useCallback(async (link: string, title = 'FeliceFit') => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          url: link,
        })
      } catch (error) {
        // Usuário cancelou ou erro
        console.log('Share cancelled or failed:', error)
      }
    } else {
      // Fallback: copiar para clipboard
      try {
        await navigator.clipboard.writeText(link)
        console.log('Link copied to clipboard')
      } catch (error) {
        console.error('Failed to copy link:', error)
      }
    }
  }, [])

  return {
    handleDeepLink,
    generateLink,
    shareLink,
  }
}

// Registrar handler de deep links para PWA
export function registerDeepLinkHandler() {
  if (typeof window === 'undefined') return

  // Para PWA instalado (Launch Handler API)
  if ('launchQueue' in window) {
    interface LaunchParams {
      targetURL?: string
    }

    interface LaunchQueue {
      setConsumer: (callback: (params: LaunchParams) => void) => void
    }

    (window as unknown as { launchQueue: LaunchQueue }).launchQueue.setConsumer((launchParams: LaunchParams) => {
      if (launchParams.targetURL) {
        // Navegar para a URL
        window.location.href = launchParams.targetURL
      }
    })
  }
}
