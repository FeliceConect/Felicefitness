'use client'

import { cn } from '@/lib/utils'
import { formatSleepDuration, calculateSleepGoalDiff } from '@/lib/sleep/calculations'
import { Clock } from 'lucide-react'

interface SleepDurationDisplayProps {
  duration: number // in minutes
  goalHours?: number
  className?: string
  showGoalDiff?: boolean
}

export function SleepDurationDisplay({
  duration,
  goalHours = 7,
  className,
  showGoalDiff = true,
}: SleepDurationDisplayProps) {
  const { diff, onGoal, label } = calculateSleepGoalDiff(duration, goalHours)

  return (
    <div className={cn('p-4 rounded-xl bg-muted', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Duração</span>
        </div>
        <span className="text-2xl font-bold">{formatSleepDuration(duration)}</span>
      </div>

      {showGoalDiff && (
        <div className="mt-2 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Meta: {goalHours}h</span>
          <span
            className={cn(
              'font-medium',
              onGoal ? 'text-green-500' : diff > 0 ? 'text-blue-500' : 'text-orange-500'
            )}
          >
            {onGoal ? '✓ Na meta' : label}
          </span>
        </div>
      )}
    </div>
  )
}
