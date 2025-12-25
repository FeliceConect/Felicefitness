'use client'

import { cn } from '@/lib/utils'
import { getRecoveryScoreColor, getRecoveryStatusLabel } from '@/lib/sleep/calculations'
import type { RecoveryComponents } from '@/types/sleep'

interface RecoveryScoreDisplayProps {
  score: number
  components?: RecoveryComponents
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function RecoveryScoreDisplay({
  score,
  components,
  className,
  size = 'md',
}: RecoveryScoreDisplayProps) {
  const scoreColor = getRecoveryScoreColor(score)
  const statusLabel = getRecoveryStatusLabel(score)

  const sizeClasses = {
    sm: 'w-20 h-20',
    md: 'w-28 h-28',
    lg: 'w-36 h-36',
  }

  const textSizeClasses = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-5xl',
  }

  // Calculate stroke dasharray for circular progress
  const radius = size === 'sm' ? 35 : size === 'md' ? 50 : 65
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (score / 100) * circumference

  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      {/* Circular gauge */}
      <div className={cn('relative', sizeClasses[size])}>
        <svg className="w-full h-full -rotate-90" viewBox="0 0 150 150">
          {/* Background circle */}
          <circle
            cx="75"
            cy="75"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="10"
            className="text-muted"
          />
          {/* Progress circle */}
          <circle
            cx="75"
            cy="75"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className={cn(
              'transition-all duration-500',
              score < 40 && 'text-red-500',
              score >= 40 && score < 60 && 'text-orange-500',
              score >= 60 && score < 80 && 'text-yellow-500',
              score >= 80 && 'text-green-500'
            )}
          />
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('font-bold', textSizeClasses[size], scoreColor)}>
            {score}
          </span>
          <span className="text-xs text-muted-foreground">/100</span>
        </div>
      </div>

      {/* Status label */}
      <div className="text-center">
        <span className={cn('font-medium', scoreColor)}>
          {score >= 80 ? '🟢' : score >= 60 ? '🟡' : score >= 40 ? '🟠' : '🔴'}{' '}
          {statusLabel}
        </span>
      </div>

      {/* Components breakdown */}
      {components && (
        <div className="w-full grid grid-cols-2 gap-2 mt-2">
          <ComponentBar label="Sono" value={components.sleep} icon="😴" />
          <ComponentBar label="Energia" value={components.energy} icon="⚡" />
          <ComponentBar label="Stress" value={components.stress} icon="🧘" />
          <ComponentBar label="Dor" value={components.soreness} icon="💪" />
        </div>
      )}
    </div>
  )
}

interface ComponentBarProps {
  label: string
  value: number
  icon: string
}

function ComponentBar({ label, value, icon }: ComponentBarProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1">
          <span>{icon}</span>
          <span className="text-muted-foreground">{label}</span>
        </span>
        <span className="font-medium">{value}%</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all',
            value < 40 && 'bg-red-500',
            value >= 40 && value < 60 && 'bg-orange-500',
            value >= 60 && value < 80 && 'bg-yellow-500',
            value >= 80 && 'bg-green-500'
          )}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}
