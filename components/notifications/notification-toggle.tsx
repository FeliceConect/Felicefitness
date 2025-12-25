"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Bell, BellOff, Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { usePushSubscription } from '@/hooks/use-push-subscription'
import { cn } from '@/lib/utils'

interface NotificationToggleProps {
  onStatusChange?: (subscribed: boolean) => void
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
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

  // Não suportado
  if (!isSupported) {
    return (
      <div className="flex items-center gap-3 text-slate-500">
        <BellOff className={iconSizes[size]} />
        {showLabel && <span className="text-sm">Notificações não suportadas</span>}
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
