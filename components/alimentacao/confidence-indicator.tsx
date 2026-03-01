"use client"

import type { ConfidenceIndicatorProps } from '@/types/analysis'
import { cn } from '@/lib/utils'

const CONFIDENCE_CONFIG = {
  alto: {
    dots: 5,
    color: 'bg-emerald-500',
    textColor: 'text-emerald-400',
    label: 'Alta'
  },
  medio: {
    dots: 3,
    color: 'bg-amber-500',
    textColor: 'text-amber-400',
    label: 'Média'
  },
  baixo: {
    dots: 1,
    color: 'bg-red-500',
    textColor: 'text-red-400',
    label: 'Baixa'
  }
}

export function ConfidenceIndicator({
  level,
  showLabel = false,
  size = 'md'
}: ConfidenceIndicatorProps) {
  const config = CONFIDENCE_CONFIG[level]
  const totalDots = 5

  const dotSizes = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5'
  }

  const gapSizes = {
    sm: 'gap-0.5',
    md: 'gap-1',
    lg: 'gap-1.5'
  }

  return (
    <div className="flex items-center gap-2">
      <div className={cn('flex', gapSizes[size])}>
        {Array.from({ length: totalDots }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'rounded-full transition-colors',
              dotSizes[size],
              i < config.dots ? config.color : 'bg-background-elevated'
            )}
          />
        ))}
      </div>

      {showLabel && (
        <span className={cn('text-xs font-medium', config.textColor)}>
          {config.label}
        </span>
      )}
    </div>
  )
}
