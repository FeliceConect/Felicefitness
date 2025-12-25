"use client"

import { motion } from 'framer-motion'
import type { StreakData } from '@/types/gamification'
import { getStreakColor, getStreakMessage, getFlameIntensity } from '@/lib/gamification'

interface StreakCounterProps {
  streak: StreakData
  size?: 'sm' | 'md' | 'lg'
  showMessage?: boolean
  showBest?: boolean
}

export function StreakCounter({
  streak,
  size = 'md',
  showMessage = true,
  showBest = false
}: StreakCounterProps) {
  const { currentStreak, bestStreak } = streak
  const color = getStreakColor(currentStreak)
  const message = getStreakMessage(currentStreak)
  const intensity = getFlameIntensity(currentStreak)

  const sizeClasses = {
    sm: { container: 'gap-1', number: 'text-2xl', flame: 'text-xl' },
    md: { container: 'gap-2', number: 'text-4xl', flame: 'text-3xl' },
    lg: { container: 'gap-3', number: 'text-6xl', flame: 'text-5xl' }
  }

  const intensityAnimations = {
    low: { scale: [1, 1.05, 1], rotate: [0, 2, -2, 0] },
    medium: { scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] },
    high: { scale: [1, 1.15, 1], rotate: [0, 8, -8, 0] },
    extreme: { scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }
  }

  const intensityDurations = {
    low: 2,
    medium: 1.5,
    high: 1,
    extreme: 0.5
  }

  return (
    <div className={`flex flex-col items-center ${sizeClasses[size].container}`}>
      <div className="flex items-center gap-1">
        <motion.span
          className={sizeClasses[size].flame}
          animate={intensityAnimations[intensity]}
          transition={{
            duration: intensityDurations[intensity],
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{ filter: `drop-shadow(0 0 10px ${color})` }}
        >
          🔥
        </motion.span>

        <motion.span
          className={`${sizeClasses[size].number} font-bold`}
          style={{ color }}
          key={currentStreak}
          initial={{ scale: 1.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 15 }}
        >
          {currentStreak}
        </motion.span>
      </div>

      <span className="text-muted-foreground text-sm">
        {currentStreak === 1 ? 'dia' : 'dias'}
      </span>

      {showMessage && (
        <motion.p
          className="text-sm text-center mt-1"
          style={{ color }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {message}
        </motion.p>
      )}

      {showBest && bestStreak > currentStreak && (
        <div className="text-xs text-muted-foreground mt-2">
          Melhor: {bestStreak} dias
        </div>
      )}
    </div>
  )
}
