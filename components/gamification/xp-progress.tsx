"use client"

import { motion } from 'framer-motion'
import type { Level } from '@/types/gamification'
import { formatXP, getLevelGradient } from '@/lib/gamification'

interface XPProgressProps {
  currentXP: number
  xpToNextLevel: number
  levelProgress: number
  currentLevel: Level
  showDetails?: boolean
}

export function XPProgress({
  currentXP,
  xpToNextLevel,
  levelProgress,
  currentLevel,
  showDetails = true
}: XPProgressProps) {
  const gradient = getLevelGradient(currentLevel)

  return (
    <div className="space-y-2">
      {showDetails && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {formatXP(currentXP)} XP
          </span>
          <span className="text-muted-foreground">
            {xpToNextLevel > 0 ? `${formatXP(xpToNextLevel)} para próximo nível` : 'Nível máximo!'}
          </span>
        </div>
      )}

      <div className="relative h-3 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ background: gradient }}
          initial={{ width: 0 }}
          animate={{ width: `${levelProgress}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />

        {/* Brilho animado */}
        <motion.div
          className="absolute inset-y-0 w-10 bg-gradient-to-r from-transparent via-white/30 to-transparent"
          animate={{ left: ['-10%', '110%'] }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatDelay: 3,
            ease: "easeInOut"
          }}
        />
      </div>

      {showDetails && (
        <div className="text-center text-xs text-muted-foreground">
          {levelProgress}% do nível {currentLevel.level}
        </div>
      )}
    </div>
  )
}
