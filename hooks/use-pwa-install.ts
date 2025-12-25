'use client'

import { useState, useEffect, useCallback } from 'react'
import type { BeforeInstallPromptEvent, InstallInstructions } from '@/types/widgets'

interface UsePWAInstallReturn {
  // Estado
  isInstallable: boolean
  isInstalled: boolean
  platform: 'ios' | 'android' | 'desktop' | 'unknown'

  // Ações
  promptInstall: () => Promise<boolean>
  dismissPrompt: () => void

  // UI
  showPrompt: boolean
  setShowPrompt: (show: boolean) => void

  // Instruções
  getInstructions: () => InstallInstructions
}

const DISMISS_KEY = 'felicefit-pwa-dismissed'
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 dias

export function usePWAInstall(): UsePWAInstallReturn {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [showPrompt, setShowPrompt] = useState(false)
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop' | 'unknown'>('unknown')

  // Detectar plataforma
  useEffect(() => {
    if (typeof window === 'undefined') return

    const ua = navigator.userAgent.toLowerCase()

    if (/iphone|ipad|ipod/.test(ua)) {
      setPlatform('ios')
    } else if (/android/.test(ua)) {
      setPlatform('android')
    } else if (/windows|macintosh|linux/.test(ua)) {
      setPlatform('desktop')
    }
  }, [])

  // Verificar se está instalado
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Check if running in standalone mode (installed PWA)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as Navigator & { standalone?: boolean }).standalone === true

    setIsInstalled(isStandalone)
  }, [])

  // Listener para beforeinstallprompt
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)

      // Verificar se o usuário já dispensou recentemente
      const dismissed = localStorage.getItem(DISMISS_KEY)
      if (dismissed) {
        const dismissedAt = parseInt(dismissed)
        if (Date.now() - dismissedAt < DISMISS_DURATION) {
          return // Não mostrar ainda
        }
      }

      // Mostrar prompt após um delay
      setTimeout(() => {
        setShowPrompt(true)
      }, 3000)
    }

    window.addEventListener('beforeinstallprompt', handler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  // Listener para appinstalled
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handler = () => {
      setIsInstalled(true)
      setShowPrompt(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('appinstalled', handler)

    return () => {
      window.removeEventListener('appinstalled', handler)
    }
  }, [])

  // Prompt de instalação
  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) {
      // iOS não suporta, mostrar instruções
      if (platform === 'ios') {
        setShowPrompt(true)
      }
      return false
    }

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice

      if (outcome === 'accepted') {
        setIsInstalled(true)
        setShowPrompt(false)
        return true
      }
    } catch (error) {
      console.error('Install prompt error:', error)
    }

    return false
  }, [deferredPrompt, platform])

  // Dispensar prompt
  const dismissPrompt = useCallback(() => {
    setShowPrompt(false)
    localStorage.setItem(DISMISS_KEY, Date.now().toString())
  }, [])

  // Obter instruções
  const getInstructions = useCallback((): InstallInstructions => {
    switch (platform) {
      case 'ios':
        return {
          platform: 'ios',
          steps: [
            'Toque no botão de compartilhar (Safari)',
            'Selecione "Adicionar à Tela de Início"',
            'Toque em "Adicionar"',
          ],
        }
      case 'android':
        return {
          platform: 'android',
          steps: [
            'Toque no menu (3 pontos)',
            'Selecione "Instalar app" ou "Adicionar à tela inicial"',
            'Confirme a instalação',
          ],
        }
      case 'desktop':
        return {
          platform: 'desktop',
          steps: [
            'Clique no ícone de instalação na barra de endereço',
            'Confirme a instalação',
          ],
        }
      default:
        return {
          platform: 'android',
          steps: [
            'Abra o menu do navegador',
            'Procure por "Adicionar à tela inicial" ou "Instalar"',
            'Confirme',
          ],
        }
    }
  }, [platform])

  return {
    isInstallable: !!deferredPrompt || platform === 'ios',
    isInstalled,
    platform,
    promptInstall,
    dismissPrompt,
    showPrompt,
    setShowPrompt,
    getInstructions,
  }
}
