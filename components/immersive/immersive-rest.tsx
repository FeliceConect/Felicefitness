'use client'

import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { ImmersiveTimer } from './immersive-timer'
import type { ImmersiveExercise } from '@/types/immersive'
import { Dumbbell } from 'lucide-react'

interface ImmersiveRestProps {
  timeRemaining: number
  totalTime: number
  isRunning: boolean
  onSkip: () => void
  nextExercise?: ImmersiveExercise
  nextSetNumber?: number
  className?: string
}

export function ImmersiveRest({
  timeRemaining,
  totalTime,
  isRunning,
  onSkip,
  nextExercise,
  nextSetNumber,
  className,
}: ImmersiveRestProps) {
  return (
    <div
      className={cn(
        'flex flex-col h-full items-center justify-center px-6',
        className
      )}
    >
      {/* Title */}
      <h2 className="text-2xl font-semibold text-muted-foreground mb-8">
        Descansando...
      </h2>

      {/* Timer */}
      <ImmersiveTimer
        timeRemaining={timeRemaining}
        totalTime={totalTime}
        isRunning={isRunning}
        onSkip={onSkip}
        size="large"
      />

      {/* Next exercise preview */}
      {nextExercise && (
        <Card className="mt-8 w-full max-w-sm">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-2">Próximo:</p>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
                <Dumbbell className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="font-semibold">{nextExercise.name}</p>
                <p className="text-sm text-muted-foreground">
                  {nextSetNumber
                    ? `Série ${nextSetNumber}/${nextExercise.sets}`
                    : `${nextExercise.sets} séries`}{' '}
                  • {nextExercise.targetReps} reps
                  {nextExercise.suggestedWeight > 0 &&
                    ` • ${nextExercise.suggestedWeight}kg`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
