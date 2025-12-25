'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dumbbell, Trophy, ChevronRight } from 'lucide-react'
import type { ImmersiveExercise, SetLog } from '@/types/immersive'
import { getMuscleGroupIcon } from '@/lib/immersive/animations'

interface ImmersiveExerciseProps {
  exercise: ImmersiveExercise
  currentSet: number
  totalSets: number
  completedSets: SetLog[]
  onCompleteSet: () => void
  className?: string
}

export function ImmersiveExerciseView({
  exercise,
  currentSet,
  totalSets,
  completedSets,
  onCompleteSet,
  className,
}: ImmersiveExerciseProps) {
  const lastSet = completedSets[completedSets.length - 1]
  const suggestedWeight = lastSet?.weight || exercise.suggestedWeight || 0

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Exercise info */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        {/* Muscle group badge */}
        <Badge variant="secondary" className="mb-4 text-sm">
          {getMuscleGroupIcon(exercise.muscleGroup)} {exercise.muscleGroup}
        </Badge>

        {/* Exercise name */}
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-2">
          {exercise.name}
        </h1>

        {/* Equipment */}
        {exercise.equipment && (
          <p className="text-muted-foreground text-lg mb-6">
            {exercise.equipment}
          </p>
        )}

        {/* Animation placeholder */}
        <div className="w-48 h-48 md:w-64 md:h-64 rounded-2xl bg-muted/30 flex items-center justify-center mb-8">
          <Dumbbell className="h-24 w-24 text-muted-foreground/50" />
        </div>

        {/* Set info */}
        <div className="text-center mb-6">
          <p className="text-5xl font-bold mb-2">
            Série {currentSet} de {totalSets}
          </p>
          <div className="flex items-center justify-center gap-4 text-xl text-muted-foreground">
            <span>{suggestedWeight > 0 ? `${suggestedWeight} kg` : 'Peso livre'}</span>
            <span>•</span>
            <span>{exercise.targetReps} reps</span>
          </div>
        </div>

        {/* PR indicator */}
        {exercise.currentPR && (
          <div className="flex items-center gap-2 text-amber-500 mb-4">
            <Trophy className="h-5 w-5" />
            <span className="text-sm">PR atual: {exercise.currentPR} kg</span>
          </div>
        )}

        {/* Set progress dots */}
        <div className="flex items-center gap-2 mb-8">
          {Array.from({ length: totalSets }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'w-3 h-3 rounded-full transition-all',
                i < completedSets.length
                  ? 'bg-primary scale-100'
                  : i === currentSet - 1
                  ? 'bg-primary/50 scale-125 ring-2 ring-primary ring-offset-2 ring-offset-background'
                  : 'bg-muted'
              )}
            />
          ))}
        </div>
      </div>

      {/* Complete button */}
      <div className="p-6 pb-safe">
        <Button
          size="lg"
          className="w-full h-16 text-xl font-semibold gap-3"
          onClick={onCompleteSet}
        >
          Série Concluída
          <ChevronRight className="h-6 w-6" />
        </Button>
      </div>
    </div>
  )
}
