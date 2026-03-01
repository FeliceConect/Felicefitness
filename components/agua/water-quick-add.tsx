"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Droplets } from 'lucide-react'
import { cn } from '@/lib/utils'

interface WaterQuickAddProps {
  amounts: number[]
  onAdd: (ml: number) => Promise<boolean>
  onCustomAdd: () => void
  disabled?: boolean
  compact?: boolean
}

const dropletIcons: Record<number, string> = {
  200: '💧',
  300: '💧',
  350: '🧊',
  500: '🍶',
  750: '🥤',
  1000: '🫗'
}

export function WaterQuickAdd({
  amounts,
  onAdd,
  onCustomAdd,
  disabled = false,
  compact = false
}: WaterQuickAddProps) {
  const [animatingAmount, setAnimatingAmount] = useState<number | null>(null)
  const [splashEffect, setSplashEffect] = useState<number | null>(null)

  const handleAdd = async (ml: number) => {
    if (disabled || animatingAmount !== null) return

    setAnimatingAmount(ml)
    setSplashEffect(ml)

    const success = await onAdd(ml)

    if (success) {
      // Manter efeito de splash por um momento
      setTimeout(() => setSplashEffect(null), 500)
    } else {
      setSplashEffect(null)
    }

    setTimeout(() => setAnimatingAmount(null), 300)
  }

  const getIcon = (ml: number) => {
    return dropletIcons[ml] || '💧'
  }

  return (
    <div className="space-y-3">
      {/* Quick add buttons */}
      <div className={cn('grid gap-3', compact ? 'grid-cols-3' : 'grid-cols-3')}>
        {amounts.map((ml) => (
          <motion.button
            key={ml}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleAdd(ml)}
            disabled={disabled}
            className={cn(
              'relative flex flex-col items-center justify-center',
              'bg-background-elevated hover:bg-border rounded-2xl',
              'border-2 border-transparent hover:border-dourado/30',
              'transition-all duration-200',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              compact ? 'py-3 px-2' : 'py-4 px-3',
              animatingAmount === ml && 'bg-dourado/20 border-dourado/50',
              splashEffect === ml && 'animate-pulse'
            )}
          >
            {/* Splash effect */}
            <AnimatePresence>
              {splashEffect === ml && (
                <motion.div
                  initial={{ scale: 0, opacity: 0.8 }}
                  animate={{ scale: 2, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 rounded-2xl bg-dourado/30"
                />
              )}
            </AnimatePresence>

            {/* Icon */}
            <motion.span
              className={cn('mb-1', compact ? 'text-xl' : 'text-2xl')}
              animate={animatingAmount === ml ? { y: [-5, 0], rotate: [0, -10, 10, 0] } : {}}
              transition={{ duration: 0.3 }}
            >
              {getIcon(ml)}
            </motion.span>

            {/* Amount */}
            <span className={cn(
              'font-semibold text-foreground',
              compact ? 'text-sm' : 'text-base'
            )}>
              +{ml}ml
            </span>

            {/* Loading indicator */}
            {animatingAmount === ml && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-2xl"
              >
                <Droplets className="w-5 h-5 text-dourado animate-bounce" />
              </motion.div>
            )}
          </motion.button>
        ))}
      </div>

      {/* Custom amount button */}
      {!compact && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onCustomAdd}
          disabled={disabled}
          className={cn(
            'w-full flex items-center justify-center gap-2',
            'bg-white hover:bg-background-elevated rounded-xl',
            'border border-border hover:border-dourado/30',
            'py-3 px-4',
            'transition-all duration-200',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          <Plus className="w-5 h-5 text-dourado" />
          <span className="text-foreground-secondary">Quantidade personalizada</span>
        </motion.button>
      )}
    </div>
  )
}
