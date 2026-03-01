"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Bell, BellOff, Loader2, AlertCircle, CheckCircle, Share, Smartphone, RefreshCw } from 'lucide-react'
import { usePushSubscription } from '@/hooks/use-push-subscription'
import { cn } from '@/lib/utils'

interface NotificationToggleProps {
  onStatusChange?: (subscribed: boolean) => void
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
}

// Detectar se é iOS e se está em modo standalone (PWA)
function useIOSDetection() {
  const [isIOS, setIsIOS] = useState(false)
  const [isPWA, setIsPWA] = useState(false)
  const [iosVersion, setIosVersion] = useState<number | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const ua = navigator.userAgent
      const iOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
      setIsIOS(iOS)

      // Detectar versão do iOS
      if (iOS) {
        const match = ua.match(/OS (\d+)_/)
        if (match) {
          setIosVersion(parseInt(match[1], 10))
        }
      }

      // Verificar se está em modo standalone (PWA)
      const standalone = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator as unknown as { standalone?: boolean }).standalone === true
      setIsPWA(standalone)
    }
  }, [])

  return { isIOS, isPWA, iosVersion }
}

export function NotificationToggle({
  onStatusChange,
  showLabel = true,
  size = 'md'
}: NotificationToggleProps) {
  const {
    status,
    isSupported,
    isSubscribed,
    permission,
    subscribe,
    unsubscribe,
    error
  } = usePushSubscription()

  const { isIOS, isPWA, iosVersion } = useIOSDetection()
  const [isLoading, setIsLoading] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  const handleToggle = async () => {
    setIsLoading(true)
    setLocalError(null)
    try {
      if (isSubscribed) {
        const success = await unsubscribe()
        if (success) onStatusChange?.(false)
      } else {
        const success = await subscribe()
        if (success) {
          onStatusChange?.(true)
        } else {
          setLocalError('Não foi possível ativar. Tente novamente.')
        }
      }
    } catch (err) {
      console.error('Erro ao toggle notificações:', err)
      setLocalError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setIsLoading(false)
    }
  }

  const sizeClasses = {
    sm: 'p-2',
    md: 'p-3',
    lg: 'p-4'
  }

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  // Verificar suporte de forma mais robusta
  const hasServiceWorker = typeof navigator !== 'undefined' && 'serviceWorker' in navigator
  const hasPushManager = typeof window !== 'undefined' && 'PushManager' in window
  const hasNotification = typeof window !== 'undefined' && 'Notification' in window
  const canAttemptSubscription = hasServiceWorker && hasPushManager && hasNotification

  // iOS com versão < 16.4 não suporta push
  const iosUnsupported = isIOS && iosVersion !== null && iosVersion < 16

  // iOS em PWA mas não suportado - mostrar debug
  if (isIOS && isPWA && !isSupported && !canAttemptSubscription) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3 text-amber-400">
          <AlertCircle className={iconSizes[size]} />
          {showLabel && <span className="text-sm font-medium">Verificando suporte...</span>}
        </div>
        {showLabel && (
          <div className="bg-background-elevated border border-border rounded-lg p-3 space-y-2">
            <p className="text-foreground-secondary text-xs font-mono">
              SW={hasServiceWorker ? '✓' : '✗'} Push={hasPushManager ? '✓' : '✗'} Notif={hasNotification ? '✓' : '✗'} iOS={iosVersion || '?'}
            </p>
            <p className="text-foreground-muted text-xs">
              {iosUnsupported
                ? 'iOS 16.4+ é necessário para notificações push em PWA.'
                : 'Tente: fechar completamente e reabrir o app.'}
            </p>
          </div>
        )}
      </div>
    )
  }

  // iOS mas não está em modo PWA - mostrar instruções
  if (isIOS && !isPWA) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3 text-amber-400">
          <Smartphone className={iconSizes[size]} />
          {showLabel && <span className="text-sm font-medium">Adicione à Tela de Início</span>}
        </div>
        {showLabel && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 space-y-2">
            <p className="text-amber-300 text-sm">
              Para receber notificações no iPhone:
            </p>
            <ol className="text-foreground-muted text-xs space-y-1 list-decimal pl-4">
              <li>Toque no botão <Share className="w-3 h-3 inline" /> Compartilhar do Safari</li>
              <li>Role e toque em &quot;Adicionar à Tela de Início&quot;</li>
              <li>Abra o app pela Tela de Início</li>
              <li>Volte aqui para ativar notificações</li>
            </ol>
          </div>
        )}
      </div>
    )
  }

  // Não suportado (outros navegadores)
  if (!isSupported && !canAttemptSubscription) {
    return (
      <div className="flex items-center gap-3 text-foreground-muted">
        <BellOff className={iconSizes[size]} />
        {showLabel && (
          <div>
            <span className="text-sm block">Notificações não suportadas</span>
            <span className="text-xs text-foreground-muted">
              {isIOS ? 'Abra pelo app na Tela de Início' : 'Use o Safari ou Chrome para ativar'}
            </span>
          </div>
        )}
      </div>
    )
  }

  // Permissão negada
  if (permission === 'denied') {
    return (
      <div className="flex items-center gap-3 text-red-400">
        <AlertCircle className={iconSizes[size]} />
        {showLabel && (
          <div>
            <span className="text-sm block">Permissão negada</span>
            <span className="text-xs text-foreground-muted">
              {isIOS
                ? 'Vá em Ajustes → Complexo Wellness → Notificações'
                : 'Ative nas configurações do navegador'}
            </span>
          </div>
        )}
      </div>
    )
  }

  // Loading inicial
  if (status === 'loading') {
    return (
      <div className="flex items-center gap-3 text-foreground-muted">
        <Loader2 className={cn(iconSizes[size], 'animate-spin')} />
        {showLabel && <span className="text-sm">Verificando...</span>}
      </div>
    )
  }

  const displayError = localError || error

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleToggle}
          disabled={isLoading}
          className={cn(
            'rounded-xl transition-all',
            sizeClasses[size],
            isSubscribed
              ? 'bg-dourado text-white'
              : 'bg-background-elevated text-foreground-muted hover:text-foreground border border-border',
            isLoading && 'opacity-50 cursor-not-allowed'
          )}
        >
          {isLoading ? (
            <Loader2 className={cn(iconSizes[size], 'animate-spin')} />
          ) : isSubscribed ? (
            <Bell className={iconSizes[size]} />
          ) : (
            <BellOff className={iconSizes[size]} />
          )}
        </motion.button>

        {showLabel && (
          <div className="flex-1">
            <p className="text-foreground text-sm font-medium">
              {isSubscribed ? 'Notificações ativas' : 'Notificações desativadas'}
            </p>
            {isSubscribed && !displayError && (
              <p className="text-foreground-muted text-xs flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-success" />
                Você receberá lembretes
              </p>
            )}
            {!isSubscribed && !displayError && (
              <p className="text-foreground-muted text-xs">
                Toque para ativar lembretes
              </p>
            )}
          </div>
        )}
      </div>

      {displayError && showLabel && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          <p className="text-red-400 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {displayError}
          </p>
          <button
            onClick={handleToggle}
            disabled={isLoading}
            className="mt-2 text-xs text-red-300 hover:text-red-200 flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            Tentar novamente
          </button>
        </div>
      )}
    </div>
  )
}
