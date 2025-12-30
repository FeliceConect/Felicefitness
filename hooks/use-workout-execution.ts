"use client"

import { useState, useCallback, useEffect, useRef } from 'react'
import type { Workout, WorkoutExercise, ExerciseSet, CompletedSet, CompletedCardio, PersonalRecord, WorkoutSummary } from '@/lib/workout/types'
import { getExercisePR } from '@/lib/workout/mock-data'

type ExecutionStatus = 'not_started' | 'in_progress' | 'resting' | 'completed'

interface WorkoutExecutionState {
  workout: Workout | null
  currentExerciseIndex: number
  currentSetIndex: number
  completedSets: CompletedSet[]
  completedCardio: CompletedCardio[]
  isResting: boolean
  restTimeRemaining: number
  elapsedTime: number
  status: ExecutionStatus
  newPRs: PersonalRecord[]
  // Timestamps para persistência robusta
  startedAt?: number
  restEndTime?: number | null
}

interface UseWorkoutExecutionReturn {
  state: WorkoutExecutionState
  // Ações
  startWorkout: (workout: Workout, forceNew?: boolean) => void
  completeSet: (data: { reps: number; weight: number }) => void
  skipSet: () => void
  skipExercise: () => void
  startRest: (seconds: number) => void
  skipRest: () => void
  addRestTime: (seconds: number) => void
  addCardio: (cardio: CompletedCardio) => void
  finishWorkout: () => WorkoutSummary | null
  clearSavedWorkout: () => void
  hasSavedWorkout: () => boolean
  getSavedWorkoutId: () => string | null
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
    completedCardio: [],
    isResting: false,
    restTimeRemaining: 0,
    elapsedTime: 0,
    status: 'not_started',
    newPRs: [],
    startedAt: undefined,
    restEndTime: null
  })

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const elapsedRef = useRef<NodeJS.Timeout | null>(null)
  const hasRestoredRef = useRef(false)

  // Timer de elapsed time - usa timestamp para ser preciso mesmo após suspensão
  useEffect(() => {
    if (state.status === 'in_progress' || state.status === 'resting') {
      const updateElapsed = () => {
        if (state.startedAt) {
          const elapsed = Math.floor((Date.now() - state.startedAt) / 1000)
          setState(prev => ({ ...prev, elapsedTime: elapsed }))
        }
      }

      updateElapsed() // Atualizar imediatamente
      elapsedRef.current = setInterval(updateElapsed, 1000)
    }

    return () => {
      if (elapsedRef.current) {
        clearInterval(elapsedRef.current)
      }
    }
  }, [state.status, state.startedAt])

  // Timer de descanso - usa timestamp para funcionar quando iOS suspende
  useEffect(() => {
    if (state.isResting && state.restEndTime) {
      const checkRest = () => {
        const now = Date.now()
        const remaining = Math.max(0, Math.ceil((state.restEndTime! - now) / 1000))

        if (remaining <= 0) {
          // Vibrar ao terminar
          if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200])
          }
          setState(prev => ({
            ...prev,
            restTimeRemaining: 0,
            isResting: false,
            status: 'in_progress',
            restEndTime: null
          }))
          if (timerRef.current) {
            clearInterval(timerRef.current)
            timerRef.current = null
          }
        } else {
          setState(prev => ({ ...prev, restTimeRemaining: remaining }))
        }
      }

      checkRest() // Verificar imediatamente
      timerRef.current = setInterval(checkRest, 1000)

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current)
        }
      }
    }
  }, [state.isResting, state.restEndTime])

  // Verificar timer quando app volta ao foco (crucial para iOS)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Recalcular elapsed time
        if (state.startedAt && (state.status === 'in_progress' || state.status === 'resting')) {
          const elapsed = Math.floor((Date.now() - state.startedAt) / 1000)
          setState(prev => ({ ...prev, elapsedTime: elapsed }))
        }

        // Verificar rest timer
        if (state.restEndTime && state.isResting) {
          const now = Date.now()
          const remaining = Math.max(0, Math.ceil((state.restEndTime - now) / 1000))

          if (remaining <= 0) {
            if (navigator.vibrate) {
              navigator.vibrate([200, 100, 200])
            }
            setState(prev => ({
              ...prev,
              restTimeRemaining: 0,
              isResting: false,
              status: 'in_progress',
              restEndTime: null
            }))
          } else {
            setState(prev => ({ ...prev, restTimeRemaining: remaining }))
          }
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleVisibilityChange)
    window.addEventListener('pageshow', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleVisibilityChange)
      window.removeEventListener('pageshow', handleVisibilityChange)
    }
  }, [state.startedAt, state.restEndTime, state.isResting, state.status])

  // Tentar restaurar estado do localStorage
  useEffect(() => {
    if (hasRestoredRef.current) return
    hasRestoredRef.current = true

    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed.status !== 'completed' && parsed.status !== 'not_started' && parsed.workout) {
          // Recalcular elapsed time baseado no timestamp
          if (parsed.startedAt) {
            parsed.elapsedTime = Math.floor((Date.now() - parsed.startedAt) / 1000)
          }

          // Verificar se o rest timer expirou enquanto estava fora
          if (parsed.restEndTime && parsed.isResting) {
            const remaining = Math.max(0, Math.ceil((parsed.restEndTime - Date.now()) / 1000))
            if (remaining <= 0) {
              parsed.isResting = false
              parsed.restTimeRemaining = 0
              parsed.status = 'in_progress'
              parsed.restEndTime = null
            } else {
              parsed.restTimeRemaining = remaining
            }
          }

          setState(parsed)
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY)
      }
    }
  }, [])

  // Salvar estado no localStorage
  useEffect(() => {
    if (state.status !== 'not_started' && state.workout) {
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

  // Funções auxiliares para verificar treino salvo
  const hasSavedWorkout = useCallback((): boolean => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        return parsed.status !== 'completed' && parsed.status !== 'not_started' && parsed.workout
      }
    } catch {
      // ignore
    }
    return false
  }, [])

  const getSavedWorkoutId = useCallback((): string | null => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.status !== 'completed' && parsed.status !== 'not_started' && parsed.workout) {
          return parsed.workout.id
        }
      }
    } catch {
      // ignore
    }
    return null
  }, [])

  const clearSavedWorkout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setState({
      workout: null,
      currentExerciseIndex: 0,
      currentSetIndex: 0,
      completedSets: [],
      completedCardio: [],
      isResting: false,
      restTimeRemaining: 0,
      elapsedTime: 0,
      status: 'not_started',
      newPRs: [],
      startedAt: undefined,
      restEndTime: null
    })
  }, [])

  const startWorkout = useCallback((workout: Workout, forceNew = false) => {
    // Se não forçar novo e já temos um treino salvo do mesmo workout, não sobrescrever
    if (!forceNew && state.status !== 'not_started' && state.workout?.id === workout.id) {
      return // Já está em andamento
    }

    const now = Date.now()
    setState({
      workout,
      currentExerciseIndex: 0,
      currentSetIndex: 0,
      completedSets: [],
      completedCardio: [],
      isResting: false,
      restTimeRemaining: 0,
      elapsedTime: 0,
      status: 'in_progress',
      newPRs: [],
      startedAt: now,
      restEndTime: null
    })
  }, [state.status, state.workout?.id])

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
    const now = Date.now()
    setState(prev => ({
      ...prev,
      isResting: true,
      restTimeRemaining: seconds,
      status: 'resting',
      restEndTime: now + (seconds * 1000)
    }))
  }, [])

  const skipRest = useCallback(() => {
    setState(prev => ({
      ...prev,
      isResting: false,
      restTimeRemaining: 0,
      status: 'in_progress',
      restEndTime: null
    }))
  }, [])

  const addRestTime = useCallback((seconds: number) => {
    setState(prev => ({
      ...prev,
      restTimeRemaining: prev.restTimeRemaining + seconds,
      restEndTime: prev.restEndTime ? prev.restEndTime + (seconds * 1000) : null
    }))
  }, [])

  const addCardio = useCallback((cardio: CompletedCardio) => {
    setState(prev => ({
      ...prev,
      completedCardio: [...prev.completedCardio, cardio]
    }))
  }, [])

  const finishWorkout = useCallback((): WorkoutSummary | null => {
    if (!state.workout) return null

    // Calcular calorias do cardio
    const cardioCalories = state.completedCardio.reduce((acc, c) => acc + (c.calorias || 0), 0)
    // Calorias da musculação: MET * peso * horas (aproximado)
    const strengthCalories = Math.round(state.elapsedTime / 60 * 5 * 80)

    const summary: WorkoutSummary = {
      workout: state.workout,
      duracao: Math.round(state.elapsedTime / 60),
      exerciciosCompletos: new Set(state.completedSets.map(s => s.exerciseId)).size,
      exerciciosTotal: state.workout.exercicios.length,
      seriesCompletas: state.completedSets.length,
      seriesTotal: totalSets,
      volumeTotal: state.completedSets.reduce((acc, s) => acc + s.weight * s.reps, 0),
      caloriasEstimadas: strengthCalories + cardioCalories,
      novosRecordes: state.newPRs,
      cardioExercises: state.completedCardio.length > 0 ? state.completedCardio : undefined
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
    addCardio,
    finishWorkout,
    clearSavedWorkout,
    hasSavedWorkout,
    getSavedWorkoutId,
    currentExercise,
    currentSet,
    progress,
    isLastSet,
    isLastExercise,
    totalSets,
    completedSetsCount
  }
}
