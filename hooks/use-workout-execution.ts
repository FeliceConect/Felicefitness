"use client"

import { useState, useCallback, useEffect, useRef } from 'react'
import type { Workout, WorkoutExercise, ExerciseSet, CompletedSet, PersonalRecord, WorkoutSummary } from '@/lib/workout/types'
import { getExercisePR } from '@/lib/workout/mock-data'

type ExecutionStatus = 'not_started' | 'in_progress' | 'resting' | 'completed'

interface WorkoutExecutionState {
  workout: Workout | null
  currentExerciseIndex: number
  currentSetIndex: number
  completedSets: CompletedSet[]
  isResting: boolean
  restTimeRemaining: number
  elapsedTime: number
  status: ExecutionStatus
  newPRs: PersonalRecord[]
}

interface UseWorkoutExecutionReturn {
  state: WorkoutExecutionState
  // Ações
  startWorkout: (workout: Workout) => void
  completeSet: (data: { reps: number; weight: number }) => void
  skipSet: () => void
  skipExercise: () => void
  startRest: (seconds: number) => void
  skipRest: () => void
  addRestTime: (seconds: number) => void
  finishWorkout: () => WorkoutSummary | null
  // Computed
  currentExercise: WorkoutExercise | null
  currentSet: ExerciseSet | null
  progress: number
  isLastSet: boolean
  isLastExercise: boolean
  totalSets: number
  completedSetsCount: number
}

const STORAGE_KEY = 'felicefit_workout_execution'

export function useWorkoutExecution(): UseWorkoutExecutionReturn {
  const [state, setState] = useState<WorkoutExecutionState>({
    workout: null,
    currentExerciseIndex: 0,
    currentSetIndex: 0,
    completedSets: [],
    isResting: false,
    restTimeRemaining: 0,
    elapsedTime: 0,
    status: 'not_started',
    newPRs: []
  })

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const elapsedRef = useRef<NodeJS.Timeout | null>(null)

  // Timer de elapsed time
  useEffect(() => {
    if (state.status === 'in_progress' || state.status === 'resting') {
      elapsedRef.current = setInterval(() => {
        setState(prev => ({ ...prev, elapsedTime: prev.elapsedTime + 1 }))
      }, 1000)
    }

    return () => {
      if (elapsedRef.current) {
        clearInterval(elapsedRef.current)
      }
    }
  }, [state.status])

  // Timer de descanso
  useEffect(() => {
    if (state.isResting && state.restTimeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setState(prev => {
          if (prev.restTimeRemaining <= 1) {
            // Vibrar ao terminar
            if (navigator.vibrate) {
              navigator.vibrate([200, 100, 200])
            }
            return { ...prev, restTimeRemaining: 0, isResting: false, status: 'in_progress' }
          }
          return { ...prev, restTimeRemaining: prev.restTimeRemaining - 1 }
        })
      }, 1000)

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current)
        }
      }
    }
  }, [state.isResting, state.restTimeRemaining])

  // Tentar restaurar estado do localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed.status !== 'completed') {
          setState(parsed)
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY)
      }
    }
  }, [])

  // Salvar estado no localStorage
  useEffect(() => {
    if (state.status !== 'not_started') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    }
  }, [state])

  const currentExercise = state.workout?.exercicios[state.currentExerciseIndex] || null
  const currentSet = currentExercise?.series[state.currentSetIndex] || null

  const totalSets = state.workout?.exercicios.reduce((acc, ex) => acc + ex.series.length, 0) || 0
  const completedSetsCount = state.completedSets.length

  const isLastSet = currentExercise
    ? state.currentSetIndex === currentExercise.series.length - 1
    : false

  const isLastExercise = state.workout
    ? state.currentExerciseIndex === state.workout.exercicios.length - 1
    : false

  const progress = totalSets > 0 ? (completedSetsCount / totalSets) * 100 : 0

  const startWorkout = useCallback((workout: Workout) => {
    setState({
      workout,
      currentExerciseIndex: 0,
      currentSetIndex: 0,
      completedSets: [],
      isResting: false,
      restTimeRemaining: 0,
      elapsedTime: 0,
      status: 'in_progress',
      newPRs: []
    })
  }, [])

  const checkForPR = useCallback((exerciseId: string, exerciseName: string, weight: number, reps: number): PersonalRecord | null => {
    const currentPR = getExercisePR(exerciseId)

    if (!currentPR) {
      // Primeiro registro é PR
      return {
        id: `pr-${Date.now()}`,
        user_id: 'mock-user',
        exercise_id: exerciseId,
        exercise_name: exerciseName,
        weight,
        reps,
        data: new Date().toISOString(),
        workout_id: state.workout?.id || ''
      }
    }

    // Verificar se é PR
    if (weight > currentPR.weight && reps >= currentPR.reps) {
      return {
        id: `pr-${Date.now()}`,
        user_id: 'mock-user',
        exercise_id: exerciseId,
        exercise_name: exerciseName,
        weight,
        reps,
        data: new Date().toISOString(),
        workout_id: state.workout?.id || ''
      }
    }

    if (weight >= currentPR.weight && reps > currentPR.reps) {
      return {
        id: `pr-${Date.now()}`,
        user_id: 'mock-user',
        exercise_id: exerciseId,
        exercise_name: exerciseName,
        weight,
        reps,
        data: new Date().toISOString(),
        workout_id: state.workout?.id || ''
      }
    }

    return null
  }, [state.workout])

  const completeSet = useCallback((data: { reps: number; weight: number }) => {
    if (!currentExercise || !currentSet) return

    const pr = checkForPR(currentExercise.exercise_id, currentExercise.nome, data.weight, data.reps)

    // Use the unique workout exercise id (not the exercise_id which can be empty for templates)
    const completedSet: CompletedSet = {
      exerciseId: currentExercise.id, // Changed from exercise_id to id
      exerciseName: currentExercise.nome,
      setNumber: state.currentSetIndex + 1,
      reps: data.reps,
      weight: data.weight,
      isPR: !!pr
    }

    setState(prev => {
      const newState = {
        ...prev,
        completedSets: [...prev.completedSets, completedSet],
        newPRs: pr ? [...prev.newPRs, pr] : prev.newPRs
      }

      // Verificar se é última série do exercício
      if (prev.currentSetIndex < currentExercise.series.length - 1) {
        // Próxima série
        return {
          ...newState,
          currentSetIndex: prev.currentSetIndex + 1
        }
      } else if (prev.currentExerciseIndex < (prev.workout?.exercicios.length || 0) - 1) {
        // Próximo exercício
        return {
          ...newState,
          currentExerciseIndex: prev.currentExerciseIndex + 1,
          currentSetIndex: 0
        }
      } else {
        // Treino completo
        return {
          ...newState,
          status: 'completed'
        }
      }
    })
  }, [currentExercise, currentSet, state.currentSetIndex, checkForPR])

  const skipSet = useCallback(() => {
    if (!currentExercise) return

    setState(prev => {
      if (prev.currentSetIndex < currentExercise.series.length - 1) {
        return { ...prev, currentSetIndex: prev.currentSetIndex + 1 }
      } else if (prev.currentExerciseIndex < (prev.workout?.exercicios.length || 0) - 1) {
        return {
          ...prev,
          currentExerciseIndex: prev.currentExerciseIndex + 1,
          currentSetIndex: 0
        }
      } else {
        return { ...prev, status: 'completed' }
      }
    })
  }, [currentExercise])

  const skipExercise = useCallback(() => {
    setState(prev => {
      if (prev.currentExerciseIndex < (prev.workout?.exercicios.length || 0) - 1) {
        return {
          ...prev,
          currentExerciseIndex: prev.currentExerciseIndex + 1,
          currentSetIndex: 0
        }
      } else {
        return { ...prev, status: 'completed' }
      }
    })
  }, [])

  const startRest = useCallback((seconds: number) => {
    setState(prev => ({
      ...prev,
      isResting: true,
      restTimeRemaining: seconds,
      status: 'resting'
    }))
  }, [])

  const skipRest = useCallback(() => {
    setState(prev => ({
      ...prev,
      isResting: false,
      restTimeRemaining: 0,
      status: 'in_progress'
    }))
  }, [])

  const addRestTime = useCallback((seconds: number) => {
    setState(prev => ({
      ...prev,
      restTimeRemaining: prev.restTimeRemaining + seconds
    }))
  }, [])

  const finishWorkout = useCallback((): WorkoutSummary | null => {
    if (!state.workout) return null

    const summary: WorkoutSummary = {
      workout: state.workout,
      duracao: Math.round(state.elapsedTime / 60),
      exerciciosCompletos: new Set(state.completedSets.map(s => s.exerciseId)).size,
      exerciciosTotal: state.workout.exercicios.length,
      seriesCompletas: state.completedSets.length,
      seriesTotal: totalSets,
      volumeTotal: state.completedSets.reduce((acc, s) => acc + s.weight * s.reps, 0),
      caloriasEstimadas: Math.round(state.elapsedTime / 60 * 5 * 80), // MET * peso * horas
      novosRecordes: state.newPRs
    }

    // Limpar localStorage
    localStorage.removeItem(STORAGE_KEY)

    return summary
  }, [state, totalSets])

  return {
    state,
    startWorkout,
    completeSet,
    skipSet,
    skipExercise,
    startRest,
    skipRest,
    addRestTime,
    finishWorkout,
    currentExercise,
    currentSet,
    progress,
    isLastSet,
    isLastExercise,
    totalSets,
    completedSetsCount
  }
}
