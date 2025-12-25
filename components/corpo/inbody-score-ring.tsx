"use client"

import { motion } from 'framer-motion'
import { getScoreColor, getScoreCategory } from '@/lib/body/references'
import { cn } from '@/lib/utils'

interface InBodyScoreRingProps {
  score: number
  size?: 'sm' | 'md' | 'lg'
  showLabels?: boolean
  animated?: boolean
  className?: string
}

const sizeConfig = {
  sm: { ring: 80, stroke: 6, fontSize: 'text-lg' },
  md: { ring: 120, stroke: 8, fontSize: 'text-2xl' },
  lg: { ring: 180, stroke: 10, fontSize: 'text-4xl' }
}

export function InBodyScoreRing({
  score,
  size = 'md',
  showLabels = true,
  animated = true,
  className
}: InBodyScoreRingProps) {
  const config = sizeConfig[size]
  const radius = (config.ring - config.stroke) / 2
  const circumference = radius * 2 * Math.PI
  const progress = score / 100
  const offset = circumference - (progress * circumference)

  const color = getScoreColor(score)
  const categoria = getScoreCategory(score)

  const categoriaLabels: Record<typeof categoria, string> = {
    excelente: 'Excelente',
    bom: 'Bom',
    normal: 'Normal',
    abaixo_media: 'Abaixo da média',
    fraco: 'Fraco'
  }

  return (
    <div className={cn('relative flex items-center justify-center', className)}>
      <svg
        width={config.ring}
        height={config.ring}
        viewBox={`0 0 ${config.ring} ${config.ring}`}
        className="transform -rotate-90"
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
          stroke={color}
          strokeWidth={config.stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: animated ? offset : offset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          style={{
            filter: `drop-shadow(0 0 8px ${color}50)`
          }}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className={cn('font-bold text-white', config.fontSize)}
        >
          {score}
        </motion.span>
        {showLabels && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="text-xs text-slate-400 uppercase tracking-wide"
          >
            pontos
          </motion.span>
        )}
      </div>

      {/* Category badge */}
      {showLabels && size !== 'sm' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.9 }}
          className="absolute -bottom-6 left-1/2 -translate-x-1/2"
        >
          <span
            className="px-3 py-1 rounded-full text-xs font-medium"
            style={{
              backgroundColor: `${color}20`,
              color: color
            }}
          >
            {categoriaLabels[categoria]}
          </span>
        </motion.div>
      )}
    </div>
  )
}
