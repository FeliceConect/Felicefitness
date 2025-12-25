'use client'

import { useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useImmersiveWorkout } from '@/hooks/use-immersive-workout'
import {
  ImmersivePreparing,
  ImmersiveExerciseView,
  ImmersiveSetInput,
  ImmersiveRest,
  ImmersiveProgress,
  ImmersiveControls,
  ImmersivePause,
  ImmersivePRCelebration,
  ImmersiveComplete,
} from '@/components/immersive'
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet'
import type { SetInput } from '@/types/immersive'

export default function ImmersiveWorkoutPage() {
  const params = useParams()
  const router = useRouter()
  const workoutId = params.id as string

  const [showSetInput, setShowSetInput] = useState(false)

  const handleComplete = useCallback(() => {
    // Will be called when workout is complete
  }, [])

  const handleExit = useCallback(() => {
    router.push(`/treino/${workoutId}`)
  }, [router, workoutId])

  const workout = useImmersiveWorkout({
    workoutId,
    onComplete: handleComplete,
    onExit: handleExit,
  })

  const handleCompleteSetClick = () => {
    setShowSetInput(true)
  }

  const handleConfirmSet = (data: SetInput) => {
    setShowSetInput(false)
    workout.completeSet(data)
  }

  const handleCancelSetInput = () => {
    setShowSetInput(false)
  }

  // Preparing screen
  if (workout.status === 'preparing') {
    return (
      <ImmersivePreparing
        workoutName={workout.currentExercise ? 'Carregando...' : 'Treino'}
        exerciseCount={workout.totalExercises}
        onReady={workout.startWorkout}
      />
    )
  }

  // Complete screen
  if (workout.status === 'complete' && workout.summary) {
    return (
      <ImmersiveComplete
        summary={workout.summary}
        onClose={handleExit}
      />
    )
  }

  // PR celebration
  if (workout.status === 'pr' && workout.currentPRCelebration) {
    return (
      <ImmersivePRCelebration
        pr={workout.currentPRCelebration}
        onContinue={workout.dismissPRCelebration}
      />
    )
  }

  // Paused
  if (workout.status === 'paused') {
    return (
      <ImmersivePause
        elapsedTime={workout.elapsedTime}
        onResume={workout.resume}
        onSkipExercise={workout.skipExercise}
        onEnd={workout.endWorkout}
      />
    )
  }

  return (
    <div className="fixed inset-0 z-40 bg-background flex flex-col">
      {/* Header with controls and progress */}
      <div className="px-4 pt-4 pb-2 safe-area-top">
        <ImmersiveControls
          onPause={workout.pause}
          onExit={handleExit}
        />
        <ImmersiveProgress
          exerciseIndex={workout.exerciseIndex}
          totalExercises={workout.totalExercises}
          elapsedTime={workout.elapsedTime}
          completedSets={workout.allCompletedSets}
          className="mt-2"
        />
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        {workout.status === 'rest' ? (
          <ImmersiveRest
            timeRemaining={workout.restTimeRemaining}
            totalTime={workout.currentExercise?.restTime || 60}
            isRunning={workout.isRestTimerActive}
            onSkip={workout.skipRest}
            nextExercise={
              workout.currentSetIndex + 1 < workout.totalSets
                ? workout.currentExercise || undefined
                : workout.exerciseIndex + 1 < workout.totalExercises
                ? undefined // Next exercise would need to be fetched
                : undefined
            }
            nextSetNumber={
              workout.currentSetIndex + 1 < workout.totalSets
                ? workout.currentSetIndex + 2
                : undefined
            }
          />
        ) : workout.currentExercise ? (
          <ImmersiveExerciseView
            exercise={workout.currentExercise}
            currentSet={workout.currentSetIndex + 1}
            totalSets={workout.totalSets}
            completedSets={workout.completedSetsForExercise}
            onCompleteSet={handleCompleteSetClick}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Carregando exercício...</p>
          </div>
        )}
      </div>

      {/* Set input sheet */}
      <Sheet open={showSetInput} onOpenChange={setShowSetInput}>
        <SheetContent side="bottom" className="h-auto max-h-[90vh] overflow-y-auto">
          {workout.currentExercise && (
            <ImmersiveSetInput
              exercise={workout.currentExercise}
              setNumber={workout.currentSetIndex + 1}
              previousSet={
                workout.completedSetsForExercise[
                  workout.completedSetsForExercise.length - 1
                ]
              }
              onConfirm={handleConfirmSet}
              onCancel={handleCancelSetInput}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
