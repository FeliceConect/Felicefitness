"use client"

import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Clock, CheckCircle, XCircle } from 'lucide-react'
import type { RevoladeWindow } from '@/lib/nutrition/types'
import { cn } from '@/lib/utils'

interface RevoladeAlertProps {
  window: RevoladeWindow
}

const alertStyles: Record<string, { bg: string; border: string; icon: string }> = {
  warning: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    icon: 'text-amber-400'
  },
  danger: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    icon: 'text-red-400'
  },
  success: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    icon: 'text-emerald-400'
  }
}

function formatTimeRemaining(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`
  }
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`
}

export function RevoladeAlert({ window }: RevoladeAlertProps) {
  // Don't show if status is normal
  if (window.alertType === 'none') {
    return null
  }

  const style = alertStyles[window.alertType]

  const IconComponent = () => {
    switch (window.alertType) {
      case 'danger':
        return <XCircle className={cn('w-5 h-5', style.icon)} />
      case 'success':
        return <CheckCircle className={cn('w-5 h-5', style.icon)} />
      default:
        return <AlertTriangle className={cn('w-5 h-5', style.icon)} />
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={cn(
          'rounded-xl p-4 border',
          style.bg,
          style.border
        )}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <IconComponent />
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h4 className={cn('font-semibold', style.icon)}>
                {window.status === 'jejum' && '🚫 JEJUM'}
                {window.status === 'pre_jejum' && '⚠️ ALERTA'}
                {window.status === 'restricao' && '🥛 RESTRIÇÃO'}
                {window.status === 'liberado' && '✅ LIBERADO'}
              </h4>

              {window.timeRemaining && (
                <div className="flex items-center gap-1 text-sm text-slate-400">
                  <Clock className="w-4 h-4" />
                  <span>{formatTimeRemaining(window.timeRemaining)}</span>
                </div>
              )}
            </div>

            <p className="text-sm text-slate-300 mt-1">{window.message}</p>

            {window.nextPhase && window.status !== 'liberado' && (
              <p className="text-xs text-slate-500 mt-2">
                Próximo: {window.nextPhase}
              </p>
            )}

            {/* Restriction details */}
            {window.status === 'restricao' && (
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-800 text-xs text-slate-400">
                  🥛 Sem laticínios
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/10 text-xs text-emerald-400">
                  ✓ Pode comer normalmente
                </span>
              </div>
            )}

            {window.status === 'jejum' && (
              <div className="mt-3">
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/10 text-xs text-red-400">
                  Apenas água permitida
                </span>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
