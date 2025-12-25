'use client'

import { cn } from '@/lib/utils'
import { Clock, Dumbbell, Flame } from 'lucide-react'
import type { SetLog } from '@/types/immersive'

interface ImmersiveProgressProps {
  exerciseIndex: number
  totalExercises: number
  elapsedTime: number
  completedSets: SetLog[]
  className?: string
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function ImmersiveProgress({
  exerciseIndex,
  totalExercises,
  elapsedTime,
  completedSets,
  className,
}: ImmersiveProgressProps) {
  const totalVolume = completedSets.reduce(
    (sum, set) => sum + set.weight * set.reps,
    0
  )
  const progress = ((exerciseIndex + 1) / totalExercises) * 100

  return (
    <div className={cn('w-full', className)}>
      {/* Progress bar */}
      <div className="h-1 bg-muted rounded-full overflow-hidden mb-3">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          {/* Time */}
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span className="tabular-nums">{formatTime(elapsedTime)}</span>
          </div>

          {/* Exercise count */}
          <div className="flex items-center gap-1 text-muted-foreground">
            <Dumbbell className="h-4 w-4" />
            <span>
              {exerciseIndex + 1}/{totalExercises}
            </span>
          </div>
        </div>

        {/* Volume */}
        {totalVolume > 0 && (
          <div className="flex items-center gap-1 text-muted-foreground">
            <Flame className="h-4 w-4" />
            <span className="tabular-nums">{totalVolume.toLocaleString()} kg</span>
          </div>
        )}
      </div>
    </div>
  )
}
