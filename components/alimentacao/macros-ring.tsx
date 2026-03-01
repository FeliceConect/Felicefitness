"use client"

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface MacrosRingProps {
  label: string
  current: number
  goal: number
  color: string // tailwind color class (e.g., 'violet', 'cyan', 'emerald')
  size?: 'sm' | 'md' | 'lg'
}

const sizeConfig = {
  sm: { ring: 60, stroke: 4, fontSize: 'text-sm', labelSize: 'text-xs' },
  md: { ring: 80, stroke: 6, fontSize: 'text-lg', labelSize: 'text-sm' },
  lg: { ring: 100, stroke: 8, fontSize: 'text-xl', labelSize: 'text-sm' }
}

export function MacrosRing({
  label,
  current,
  goal,
  color,
  size = 'md'
}: MacrosRingProps) {
  const config = sizeConfig[size]
  const radius = (config.ring - config.stroke) / 2
  const circumference = 2 * Math.PI * radius
  const progress = Math.min((current / goal) * 100, 100)
  const strokeDashoffset = circumference - (progress / 100) * circumference

  // Determine status color
  const getStatusColor = () => {
    const percentage = (current / goal) * 100
    if (percentage < 80) return `text-${color}-400`
    if (percentage <= 105) return 'text-emerald-400'
    return 'text-red-400'
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: config.ring, height: config.ring }}>
        <svg
          className="transform -rotate-90"
          width={config.ring}
          height={config.ring}
        >
          {/* Background circle */}
          <circle
            cx={config.ring / 2}
            cy={config.ring / 2}
            r={radius}
            stroke="rgba(148, 163, 184, 0.2)"
            strokeWidth={config.stroke}
            fill="none"
          />
          {/* Progress circle */}
          <motion.circle
            cx={config.ring / 2}
            cy={config.ring / 2}
            r={radius}
            className={cn(
              current / goal < 0.8 ? `stroke-${color}-500` :
              current / goal <= 1.05 ? 'stroke-emerald-500' :
              'stroke-red-500'
            )}
            strokeWidth={config.stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </svg>
        {/* Percentage */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn('font-bold', config.fontSize, getStatusColor())}>
            {Math.round(progress)}%
          </span>
        </div>
      </div>
      {/* Label */}
      <span className={cn('text-foreground-secondary mt-2', config.labelSize)}>{label}</span>
      {/* Values */}
      <span className={cn('text-foreground font-medium', config.labelSize)}>
        {Math.round(current)}/{goal}g
      </span>
    </div>
  )
}
