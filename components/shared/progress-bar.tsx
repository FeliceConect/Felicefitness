"use client"

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ProgressBarProps {
  progress: number          // 0-1
  color?: string           // cor do progresso
  bgColor?: string         // cor do fundo
  height?: number          // altura em pixels
  showLabel?: boolean      // mostrar porcentagem
  label?: string           // label customizado
  className?: string
  animated?: boolean
}

export function ProgressBar({
  progress,
  color,
  bgColor = 'var(--border)',
  height = 8,
  showLabel = false,
  label,
  className = '',
  animated = true
}: ProgressBarProps) {
  const percent = Math.min(Math.max(progress, 0), 1)

  // Cor dinâmica baseada no progresso
  const getColor = () => {
    if (color) return color
    if (percent < 0.5) return '#EF4444'   // Vermelho
    if (percent < 0.8) return '#F59E0B'   // Amarelo
    if (percent < 1) return '#10B981'     // Verde
    return '#06B6D4'                       // Cyan
  }

  return (
    <div className={cn('w-full', className)}>
      {(showLabel || label) && (
        <div className="flex justify-between mb-1 text-sm">
          <span className="text-foreground-secondary">{label}</span>
          {showLabel && (
            <span className="text-foreground font-medium">
              {Math.round(percent * 100)}%
            </span>
          )}
        </div>
      )}
      <div
        className="w-full rounded-full overflow-hidden"
        style={{ backgroundColor: bgColor, height }}
      >
        {animated ? (
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: getColor() }}
            initial={{ width: 0 }}
            animate={{ width: `${percent * 100}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        ) : (
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              backgroundColor: getColor(),
              width: `${percent * 100}%`
            }}
          />
        )}
      </div>
    </div>
  )
}
