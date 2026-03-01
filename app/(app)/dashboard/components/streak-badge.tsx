"use client"

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface StreakBadgeProps {
  currentStreak: number
  maxStreak?: number
}

export function StreakBadge({ currentStreak, maxStreak = 0 }: StreakBadgeProps) {
  const hasStreak = currentStreak > 0
  const isOnFire = currentStreak >= 7

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className={cn(
        'flex-1 bg-white border rounded-2xl p-4 shadow-sm',
        hasStreak
          ? 'border-orange-400/40 bg-gradient-to-br from-orange-50 to-white'
          : 'border-border'
      )}
    >
      <div className="flex items-center gap-3">
        <motion.span
          className={cn('text-3xl', isOnFire && 'drop-shadow-[0_0_8px_rgba(249,115,22,0.4)]')}
          animate={isOnFire ? {
            scale: [1, 1.1, 1],
          } : {}}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        >
          {hasStreak ? '🔥' : '💪'}
        </motion.span>
        <div>
          <div className="flex items-baseline gap-1">
            <span className={cn(
              'text-2xl font-bold',
              hasStreak ? 'text-orange-500' : 'text-foreground-muted'
            )}>
              {currentStreak}
            </span>
            <span className="text-sm text-foreground-muted">
              {currentStreak === 1 ? 'dia' : 'dias'}
            </span>
          </div>
          <p className="text-xs text-foreground-secondary">
            {hasStreak
              ? `Recorde: ${maxStreak} dias`
              : 'Comece hoje!'}
          </p>
        </div>
      </div>
    </motion.div>
  )
}
