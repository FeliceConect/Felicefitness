"use client"

import { useState, useCallback, useEffect, useRef } from 'react'
import type { Workout, WorkoutExercise, ExerciseSet, CompletedSet, CompletedCardio, PersonalRecord, WorkoutSummary } from '@/lib/workout/types'

type ExecutionStatus = 'not_started' | 'in_progress' | 'resting' | 'completed'
export type ExerciseProgress = 'pending' | 'in_progress' | 'completed'

export interface ExerciseStatus {
  index: number
  exerciseId: string
  name: string
  totalSets: number
  completedSets: number
  status: ExerciseProgress
  // Permite ao strip agrupar membros consecutivos do mesmo biset/triset
  // num único chip — sem isso, cada exercício do circuito vira uma bolinha.
  circuitGroup: number | null
}

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
  /** Completa todas as séries de uma rodada de circuito de uma vez. */
  completeCircuitRound: (entries: Array<{ exerciseId: string; reps: number; weight: number }>) => void
  editCompletedSet: (exerciseId: string, setNumber: number, data: { reps: number; weight: number }) => void
  skipSet: () => void
  skipExercise: () => void
  jumpToExercise: (exerciseIndex: number) => void
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
  exercisesStatus: ExerciseStatus[]
  hasIncompleteExercises: boolean
}

const STORAGE_KEY = 'felicefit_workout_execution'

// MET aproximado para musculação moderada. Fórmula: kcal = MET × peso(kg) × horas.
// Mantém consistência com cardio-input-modal.tsx (que usa MET por exercício).
const MET_STRENGTH = 5

export function useWorkoutExecution(userWeightKg: number = 75): UseWorkoutExecutionReturn {
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

  // Quantidade de séries concluídas para um exercício específico
  const getCompletedSetsCountForExercise = (ex: WorkoutExercise): number => {
    return state.completedSets.filter(cs => cs.exerciseId === ex.id).length
  }

  // Status agregado de cada exercício do treino
  const exercisesStatus: ExerciseStatus[] = (state.workout?.exercicios || []).map((ex, idx) => {
    const completed = getCompletedSetsCountForExercise(ex)
    const total = ex.series.length
    let status: ExerciseProgress = 'pending'
    if (completed >= total && total > 0) status = 'completed'
    else if (completed > 0) status = 'in_progress'
    return {
      index: idx,
      exerciseId: ex.id,
      name: ex.nome,
      totalSets: total,
      completedSets: completed,
      status,
      circuitGroup: ex.circuit_group ?? null
    }
  })

  const hasIncompleteExercises = exercisesStatus.some(e => e.status !== 'completed')

  // Encontra o próximo exercício incompleto (com wrap), ignorando o índice atual e quaisquer "ignorar"
  const findNextIncompleteExerciseIndex = (
    workout: Workout,
    completedSetsSnapshot: CompletedSet[],
    fromIndex: number,
    ignore: number[] = []
  ): number => {
    const total = workout.exercicios.length
    for (let step = 1; step <= total; step++) {
      const candidate = (fromIndex + step) % total
      if (ignore.includes(candidate)) continue
      const ex = workout.exercicios[candidate]
      const completed = completedSetsSnapshot.filter(cs => cs.exerciseId === ex.id).length
      if (completed < ex.series.length) return candidate
    }
    return -1
  }

  // Primeira série incompleta usando snapshot custom de completedSets (útil dentro de setState)
  const findFirstIncompleteSetIndexWithSnapshot = (
    workout: Workout,
    exerciseIndex: number,
    completedSetsSnapshot: CompletedSet[]
  ): number => {
    const ex = workout.exercicios[exerciseIndex]
    if (!ex) return 0
    for (let i = 0; i < ex.series.length; i++) {
      const done = completedSetsSnapshot.some(cs => cs.exerciseId === ex.id && cs.setNumber === i + 1)
      if (!done) return i
    }
    return ex.series.length - 1
  }

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

  // Badge de PR durante o treino foi desativado — a detecção mock gerava
  // falso positivo em todos os exercícios (UUID real não bate com IDs
  // hardcoded). A pontuação de PR real é feita server-side pelo trigger
  // check_and_create_pr e retornada via prSetIds no save. Quando houver
  // histórico real plugado, esta função pode ser reativada.
  const checkForPR = useCallback((_exerciseId: string, _exerciseName: string, _weight: number, _reps: number): PersonalRecord | null => {
    return null
  }, [])

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
      const newCompleted = [...prev.completedSets, completedSet]
      const baseNew = {
        ...prev,
        completedSets: newCompleted,
        newPRs: pr ? [...prev.newPRs, pr] : prev.newPRs
      }

      const exercicios = prev.workout?.exercicios || []
      const curEx = exercicios[prev.currentExerciseIndex]
      if (!curEx || !prev.workout) return baseNew

      const curExCompleted = newCompleted.filter(cs => cs.exerciseId === curEx.id).length

      // ────────────────────────────────────────────────────────
      // CIRCUITO: se o exercício faz parte de um circuit_group,
      // o fluxo é intercalado — após cada série, vai pro próximo
      // exercício do mesmo circuito que ainda precisa fazer essa
      // rodada. Só volta pra "próxima série" quando completou a
      // rodada do circuito todo.
      // ────────────────────────────────────────────────────────
      const circuitGroup = curEx.circuit_group
      if (circuitGroup != null) {
        const circuitMembers = exercicios
          .map((ex, idx) => ({ ex, idx }))
          .filter(({ ex }) => ex.circuit_group === circuitGroup)

        // Em qual rodada estávamos (1-indexed): a série que acabou de ser feita
        const justCompletedRound = prev.currentSetIndex + 1

        // Próximo membro do circuito que ainda não fez essa rodada
        const nextInRound = circuitMembers.find(({ ex, idx }) => {
          if (idx === prev.currentExerciseIndex) return false
          const done = newCompleted.filter(cs => cs.exerciseId === ex.id).length
          return done < justCompletedRound && done < ex.series.length
        })

        if (nextInRound) {
          // Continua o circuito — próximo membro, mesma rodada (= série justCompletedRound)
          // Sua próxima série é a primeira incompleta dele (que será essa rodada)
          return {
            ...baseNew,
            currentExerciseIndex: nextInRound.idx,
            currentSetIndex: findFirstIncompleteSetIndexWithSnapshot(prev.workout, nextInRound.idx, newCompleted)
          }
        }

        // Rodada completa: volta pro primeiro membro com séries pendentes pra próxima rodada
        const firstWithPending = circuitMembers.find(({ ex }) => {
          const done = newCompleted.filter(cs => cs.exerciseId === ex.id).length
          return done < ex.series.length
        })
        if (firstWithPending) {
          return {
            ...baseNew,
            currentExerciseIndex: firstWithPending.idx,
            currentSetIndex: findFirstIncompleteSetIndexWithSnapshot(prev.workout, firstWithPending.idx, newCompleted)
          }
        }
        // Circuito inteiro completo: cai no fluxo de próximo exercício abaixo
      }

      // Próxima série incompleta dentro do exercício atual
      const nextSetInCurrent = findFirstIncompleteSetIndexWithSnapshot(
        prev.workout,
        prev.currentExerciseIndex,
        newCompleted
      )

      // Se ainda há série pendente no exercício atual (e não estamos em circuito), segue nele
      if (curExCompleted < curEx.series.length) {
        return { ...baseNew, currentSetIndex: nextSetInCurrent }
      }

      // Exercício atual ficou completo: pular pro próximo incompleto (com wrap)
      const nextExIndex = findNextIncompleteExerciseIndex(
        prev.workout,
        newCompleted,
        prev.currentExerciseIndex
      )
      if (nextExIndex === -1) {
        return { ...baseNew, status: 'completed' }
      }
      return {
        ...baseNew,
        currentExerciseIndex: nextExIndex,
        currentSetIndex: findFirstIncompleteSetIndexWithSnapshot(prev.workout, nextExIndex, newCompleted)
      }
    })
  }, [currentExercise, currentSet, state.currentSetIndex, checkForPR])

  const editCompletedSet = useCallback((exerciseId: string, setNumber: number, data: { reps: number; weight: number }) => {
    setState(prev => {
      const updatedSets = prev.completedSets.map(set => {
        if (set.exerciseId === exerciseId && set.setNumber === setNumber) {
          // Verificar se a edição resulta em novo PR
          const exercise = prev.workout?.exercicios.find(e => e.id === exerciseId)
          let isPR = set.isPR
          if (exercise) {
            const pr = checkForPR(exercise.exercise_id, exercise.nome, data.weight, data.reps)
            isPR = !!pr
          }
          return {
            ...set,
            reps: data.reps,
            weight: data.weight,
            isPR
          }
        }
        return set
      })
      return {
        ...prev,
        completedSets: updatedSets
      }
    })
  }, [checkForPR])

  /**
   * Completa todas as séries de uma rodada de circuito de uma vez.
   *
   * Recebe uma lista de {exerciseId, reps, weight} para cada membro do
   * circuito. Insere todas as séries em um único setState (evita race
   * de chamadas em loop) e avança para a próxima rodada — ou para o
   * próximo exercício após o circuito quando todas as rodadas terminam.
   */
  const completeCircuitRound = useCallback((
    entries: Array<{ exerciseId: string; reps: number; weight: number }>
  ) => {
    if (entries.length === 0) return

    // Calcula PRs ANTES do setState (checkForPR depende do state atual,
    // não do snapshot dentro do updater)
    const newSets: CompletedSet[] = []
    const newPRsList: PersonalRecord[] = []
    for (const entry of entries) {
      const exercise = state.workout?.exercicios.find(e => e.id === entry.exerciseId)
      if (!exercise) continue

      // numero da série = quantas já foram feitas + 1 nesse exercício
      const alreadyDone = state.completedSets.filter(cs => cs.exerciseId === entry.exerciseId).length
      const setNumber = alreadyDone + 1

      const pr = checkForPR(exercise.exercise_id, exercise.nome, entry.weight, entry.reps)
      if (pr) newPRsList.push(pr)
      newSets.push({
        exerciseId: entry.exerciseId,
        exerciseName: exercise.nome,
        setNumber,
        reps: entry.reps,
        weight: entry.weight,
        isPR: !!pr,
      })
    }

    setState(prev => {
      if (!prev.workout) return prev
      const newCompleted = [...prev.completedSets, ...newSets]
      const newPRs = [...prev.newPRs, ...newPRsList]

      const exercicios = prev.workout.exercicios
      const curEx = exercicios[prev.currentExerciseIndex]
      if (!curEx) return { ...prev, completedSets: newCompleted, newPRs }

      const circuitGroup = curEx.circuit_group
      if (circuitGroup == null) {
        // Fallback: comportamento normal
        return { ...prev, completedSets: newCompleted, newPRs }
      }

      // Próxima rodada: primeiro membro do circuito que ainda tem séries pendentes
      const circuitMembers = exercicios
        .map((ex, idx) => ({ ex, idx }))
        .filter(({ ex }) => ex.circuit_group === circuitGroup)

      const firstWithPending = circuitMembers.find(({ ex }) => {
        const done = newCompleted.filter(cs => cs.exerciseId === ex.id).length
        return done < ex.series.length
      })

      if (firstWithPending) {
        return {
          ...prev,
          completedSets: newCompleted,
          newPRs,
          currentExerciseIndex: firstWithPending.idx,
          currentSetIndex: findFirstIncompleteSetIndexWithSnapshot(
            prev.workout,
            firstWithPending.idx,
            newCompleted
          ),
        }
      }

      // Circuito todo concluído: pula pra próximo exercício fora do circuito
      const nextExIndex = findNextIncompleteExerciseIndex(
        prev.workout,
        newCompleted,
        prev.currentExerciseIndex
      )
      if (nextExIndex === -1) {
        return { ...prev, completedSets: newCompleted, newPRs, status: 'completed' }
      }
      return {
        ...prev,
        completedSets: newCompleted,
        newPRs,
        currentExerciseIndex: nextExIndex,
        currentSetIndex: findFirstIncompleteSetIndexWithSnapshot(prev.workout, nextExIndex, newCompleted),
      }
    })
  }, [state.workout, state.completedSets, checkForPR])

  const skipSet = useCallback(() => {
    if (!currentExercise) return

    setState(prev => {
      if (!prev.workout) return prev

      // Se ainda existe série incompleta dentro do exercício atual após o índice corrente, vai pra próxima
      if (prev.currentSetIndex < currentExercise.series.length - 1) {
        return { ...prev, currentSetIndex: prev.currentSetIndex + 1 }
      }

      // Pular última série → próximo exercício incompleto (sem mudar o que ficou pendente nele)
      const nextExIndex = findNextIncompleteExerciseIndex(
        prev.workout,
        prev.completedSets,
        prev.currentExerciseIndex,
        [prev.currentExerciseIndex]
      )
      if (nextExIndex === -1) {
        // Não há outro exercício incompleto. Só finalizar se o atual também estiver concluído.
        const cur = prev.workout.exercicios[prev.currentExerciseIndex]
        const curCompleted = prev.completedSets.filter(cs => cs.exerciseId === cur.id).length
        if (curCompleted >= cur.series.length) {
          return { ...prev, status: 'completed' }
        }
        return prev // mantém no atual com séries pendentes (pular foi soft)
      }
      return {
        ...prev,
        currentExerciseIndex: nextExIndex,
        currentSetIndex: findFirstIncompleteSetIndexWithSnapshot(prev.workout, nextExIndex, prev.completedSets)
      }
    })
  }, [currentExercise])

  const skipExercise = useCallback(() => {
    setState(prev => {
      if (!prev.workout) return prev
      // Próximo exercício incompleto (com wrap), ignorando o atual — séries não realizadas dele permanecem pendentes
      const nextExIndex = findNextIncompleteExerciseIndex(
        prev.workout,
        prev.completedSets,
        prev.currentExerciseIndex,
        [prev.currentExerciseIndex]
      )
      if (nextExIndex === -1) {
        // Não existe outro incompleto. Se o atual também já está completo → finalizar; senão, ficar parado nele.
        const cur = prev.workout.exercicios[prev.currentExerciseIndex]
        const curCompleted = prev.completedSets.filter(cs => cs.exerciseId === cur.id).length
        if (curCompleted >= cur.series.length) {
          return { ...prev, status: 'completed' }
        }
        return prev
      }
      return {
        ...prev,
        currentExerciseIndex: nextExIndex,
        currentSetIndex: findFirstIncompleteSetIndexWithSnapshot(prev.workout, nextExIndex, prev.completedSets)
      }
    })
  }, [])

  const jumpToExercise = useCallback((exerciseIndex: number) => {
    setState(prev => {
      if (!prev.workout) return prev
      if (exerciseIndex < 0 || exerciseIndex >= prev.workout.exercicios.length) return prev
      return {
        ...prev,
        currentExerciseIndex: exerciseIndex,
        currentSetIndex: findFirstIncompleteSetIndexWithSnapshot(prev.workout, exerciseIndex, prev.completedSets),
        // Cancelar descanso ao pular manualmente — usuário escolheu mudar de exercício
        isResting: false,
        restTimeRemaining: 0,
        restEndTime: null,
        status: prev.status === 'resting' ? 'in_progress' : prev.status
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
    // Calorias da musculação: MET × peso(kg) × horas.
    // elapsedTime está em segundos → /3600 converte pra horas.
    // Bug anterior usava /60 (minutos) e peso fixo 80, dando ~80x o valor real.
    const strengthCalories = Math.round((state.elapsedTime / 3600) * MET_STRENGTH * userWeightKg)

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
  }, [state, totalSets, userWeightKg])

  return {
    state,
    startWorkout,
    completeSet,
    completeCircuitRound,
    editCompletedSet,
    skipSet,
    skipExercise,
    jumpToExercise,
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
    completedSetsCount,
    exercisesStatus,
    hasIncompleteExercises
  }
}
