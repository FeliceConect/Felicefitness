'use client'

import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { Trend } from '@/types/reports'

interface TrendIndicatorProps {
  trend: Trend
  higherIsBetter?: boolean
  showValue?: boolean
  showPercentage?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function TrendIndicator({
  trend,
  higherIsBetter = true,
  showValue = false,
  showPercentage = true,
  size = 'sm',
  className
}: TrendIndicatorProps) {
  const isPositive = higherIsBetter
    ? trend.direction === 'up'
    : trend.direction === 'down'

  const colorClass = trend.direction === 'stable'
    ? 'text-muted-foreground'
    : isPositive
      ? 'text-green-500'
      : 'text-red-500'

  const bgClass = trend.direction === 'stable'
    ? 'bg-muted'
    : isPositive
      ? 'bg-green-500/10'
      : 'bg-red-500/10'

  const iconSize = {
    sm: 14,
    md: 18,
    lg: 22
  }[size]

  const textSize = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }[size]

  const Icon = trend.direction === 'up'
    ? TrendingUp
    : trend.direction === 'down'
      ? TrendingDown
      : Minus

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div className={cn('flex items-center gap-1 px-2 py-0.5 rounded-full', bgClass, colorClass)}>
        <Icon size={iconSize} />
        {showPercentage && (
          <span className={textSize}>
            {trend.direction === 'up' ? '+' : ''}
            {trend.percentage.toFixed(1)}%
          </span>
        )}
      </div>
      {showValue && (
        <span className={cn('text-muted-foreground', textSize)}>
          ({trend.previousValue} → {trend.value})
        </span>
      )}
    </div>
  )
}

// Simple arrow variant
interface SimpleTrendProps {
  direction: 'up' | 'down' | 'stable'
  value?: number
  higherIsBetter?: boolean
  className?: string
}

export function SimpleTrend({
  direction,
  value,
  higherIsBetter = true,
  className
}: SimpleTrendProps) {
  const isPositive = higherIsBetter
    ? direction === 'up'
    : direction === 'down'

  const colorClass = direction === 'stable'
    ? 'text-muted-foreground'
    : isPositive
      ? 'text-green-500'
      : 'text-red-500'

  return (
    <span className={cn('inline-flex items-center gap-0.5 text-sm', colorClass, className)}>
      {direction === 'up' && '↑'}
      {direction === 'down' && '↓'}
      {direction === 'stable' && '→'}
      {value !== undefined && (
        <span>{value > 0 ? '+' : ''}{value.toFixed(1)}%</span>
      )}
    </span>
  )
}
