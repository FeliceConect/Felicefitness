"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Bell, BellOff, Loader2, AlertCircle, CheckCircle, Share, Smartphone } from 'lucide-react'
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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const ua = navigator.userAgent
      const iOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
      setIsIOS(iOS)

      // Verificar se está em modo standalone (PWA)
      const standalone = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator as unknown as { standalone?: boolean }).standalone === true
      setIsPWA(standalone)
    }
  }, [])

  return { isIOS, isPWA }
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

  const { isIOS, isPWA } = useIOSDetection()
  const [isLoading, setIsLoading] = useState(false)

  const handleToggle = async () => {
    setIsLoading(true)
    try {
      if (isSubscribed) {
        const success = await unsubscribe()
        if (success) onStatusChange?.(false)
      } else {
        const success = await subscribe()
        if (success) onStatusChange?.(true)
      }
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

  // iOS mas não está em modo PWA - mostrar instruções
  if (isIOS && !isPWA && !isSupported) {
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
            <ol className="text-slate-400 text-xs space-y-1 list-decimal pl-4">
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
  if (!isSupported) {
    return (
      <div className="flex items-center gap-3 text-slate-500">
        <BellOff className={iconSizes[size]} />
        {showLabel && (
          <div>
            <span className="text-sm block">Notificações não suportadas</span>
            <span className="text-xs text-slate-600">Use o Safari ou Chrome para ativar</span>
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
            <span className="text-xs text-slate-500">Ative nas configurações do navegador</span>
          </div>
        )}
      </div>
    )
  }

  // Loading inicial
  if (status === 'loading') {
    return (
      <div className="flex items-center gap-3 text-slate-400">
        <Loader2 className={cn(iconSizes[size], 'animate-spin')} />
        {showLabel && <span className="text-sm">Verificando...</span>}
      </div>
    )
  }

  return (
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
            ? 'bg-violet-500 text-white'
            : 'bg-[#1E1E2E] text-slate-400 hover:text-white border border-[#2E2E3E]',
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
          <p className="text-white text-sm font-medium">
            {isSubscribed ? 'Notificações ativas' : 'Notificações desativadas'}
          </p>
          {error && (
            <p className="text-red-400 text-xs">{error}</p>
          )}
          {isSubscribed && !error && (
            <p className="text-slate-500 text-xs flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-emerald-400" />
              Você receberá lembretes
            </p>
          )}
        </div>
      )}
    </div>
  )
}
