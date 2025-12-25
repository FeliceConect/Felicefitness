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
        'flex-1 bg-[#14141F] border rounded-2xl p-4',
        hasStreak
          ? 'border-orange-500/30 bg-gradient-to-br from-orange-500/10 to-transparent'
          : 'border-[#2E2E3E]'
      )}
    >
      <div className="flex items-center gap-3">
        <motion.span
          className={cn('text-3xl', isOnFire && 'drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]')}
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
              hasStreak ? 'text-orange-400' : 'text-slate-400'
            )}>
              {currentStreak}
            </span>
            <span className="text-sm text-slate-400">
              {currentStreak === 1 ? 'dia' : 'dias'}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            {hasStreak
              ? `Recorde: ${maxStreak} dias`
              : 'Comece hoje!'}
          </p>
        </div>
      </div>
    </motion.div>
  )
}
