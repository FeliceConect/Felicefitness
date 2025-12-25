"use client"

import { motion } from 'framer-motion'
import type { Level } from '@/types/gamification'
import { getLevelEmoji, getLevelGradient } from '@/lib/gamification'

interface LevelBadgeProps {
  level: Level
  size?: 'sm' | 'md' | 'lg'
  showName?: boolean
  animate?: boolean
}

export function LevelBadge({
  level,
  size = 'md',
  showName = true,
  animate = false
}: LevelBadgeProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-lg'
  }

  const emoji = getLevelEmoji(level)
  const gradient = getLevelGradient(level)

  return (
    <div className="flex items-center gap-2">
      <motion.div
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-bold text-white shadow-lg`}
        style={{ background: gradient }}
        animate={animate ? {
          scale: [1, 1.1, 1],
          boxShadow: [
            `0 0 20px ${level.color}40`,
            `0 0 40px ${level.color}60`,
            `0 0 20px ${level.color}40`
          ]
        } : {}}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <span className="text-lg">{emoji}</span>
      </motion.div>

      {showName && (
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">Nível {level.level}</span>
          <span
            className="font-semibold text-sm"
            style={{ color: level.color }}
          >
            {level.name}
          </span>
        </div>
      )}
    </div>
  )
}
