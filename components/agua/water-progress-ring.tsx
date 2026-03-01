"use client"

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { formatWaterAmount } from '@/lib/water/calculations'

interface WaterProgressRingProps {
  current: number
  goal: number
  size?: 'sm' | 'md' | 'lg'
  showLabels?: boolean
  animated?: boolean
}

const sizeConfig = {
  sm: { ring: 100, stroke: 8, fontSize: 'text-lg', labelSize: 'text-xs' },
  md: { ring: 180, stroke: 12, fontSize: 'text-3xl', labelSize: 'text-sm' },
  lg: { ring: 250, stroke: 16, fontSize: 'text-4xl', labelSize: 'text-base' }
}

export function WaterProgressRing({
  current,
  goal,
  size = 'md',
  showLabels = true,
  animated = true
}: WaterProgressRingProps) {
  const config = sizeConfig[size]
  const radius = (config.ring - config.stroke) / 2
  const circumference = 2 * Math.PI * radius
  const progress = Math.min(current / goal, 1.5) // Cap at 150%
  const strokeDashoffset = circumference - progress * circumference
  const percentage = Math.round((current / goal) * 100)

  // Determinar cor baseada no progresso
  const getColors = () => {
    if (percentage >= 100) {
      return {
        gradient: ['#06B6D4', '#22D3EE'], // cyan
        text: 'text-dourado',
        glow: 'shadow-dourado/50'
      }
    }
    if (percentage >= 80) {
      return {
        gradient: ['#10B981', '#34D399'], // emerald
        text: 'text-emerald-400',
        glow: ''
      }
    }
    if (percentage >= 50) {
      return {
        gradient: ['#F59E0B', '#FBBF24'], // amber
        text: 'text-amber-400',
        glow: ''
      }
    }
    return {
      gradient: ['#8B5CF6', '#A78BFA'], // violet
      text: 'text-dourado',
      glow: ''
    }
  }

  const colors = getColors()
  const gradientId = `water-gradient-${size}`

  return (
    <div className="relative flex flex-col items-center">
      {/* SVG Ring */}
      <div
        className={cn(
          'relative',
          percentage >= 100 && 'animate-pulse'
        )}
        style={{ width: config.ring, height: config.ring }}
      >
        <svg
          className="transform -rotate-90"
          width={config.ring}
          height={config.ring}
        >
          {/* Gradient Definition */}
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={colors.gradient[0]} />
              <stop offset="100%" stopColor={colors.gradient[1]} />
            </linearGradient>
          </defs>

          {/* Background circle */}
          <circle
            cx={config.ring / 2}
            cy={config.ring / 2}
            r={radius}
            stroke="rgba(148, 163, 184, 0.15)"
            strokeWidth={config.stroke}
            fill="none"
          />

          {/* Progress circle */}
          <motion.circle
            cx={config.ring / 2}
            cy={config.ring / 2}
            r={radius}
            stroke={`url(#${gradientId})`}
            strokeWidth={config.stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={animated ? { strokeDashoffset: circumference } : undefined}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {/* Droplet icon */}
          <motion.span
            className="text-2xl mb-1"
            animate={percentage >= 100 ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 0.5, repeat: percentage >= 100 ? Infinity : 0, repeatDelay: 2 }}
          >
            💧
          </motion.span>

          {/* Current amount */}
          <motion.span
            key={current}
            initial={animated ? { scale: 0.8, opacity: 0 } : undefined}
            animate={{ scale: 1, opacity: 1 }}
            className={cn('font-bold', config.fontSize, colors.text)}
          >
            {formatWaterAmount(current)}
          </motion.span>

          {/* Goal */}
          {showLabels && (
            <span className={cn('text-foreground-muted', config.labelSize)}>
              de {formatWaterAmount(goal)}
            </span>
          )}
        </div>
      </div>

      {/* Percentage badge */}
      {showLabels && (
        <motion.div
          initial={animated ? { opacity: 0, y: 10 } : undefined}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className={cn(
            'mt-3 px-4 py-1.5 rounded-full',
            percentage >= 100
              ? 'bg-dourado/20 text-dourado'
              : percentage >= 80
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'bg-white text-foreground-secondary'
          )}
        >
          <span className="font-semibold">{percentage}%</span>
          {percentage >= 100 && <span className="ml-1">da meta</span>}
        </motion.div>
      )}
    </div>
  )
}
