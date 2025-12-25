'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useWorkoutTimer } from './use-workout-timer'
import { useWorkoutAudio } from './use-workout-audio'
import { useScreenWakeLock } from './use-screen-wake-lock'
import { getTodayDateSP } from '@/lib/utils/date'
import {
  DEFAULT_IMMERSIVE_SETTINGS,
  type ImmersiveStatus,
  type ImmersiveExercise,
  type ImmersiveWorkout,
  type SetLog,
  type SetInput,
  type NewPR,
  type WorkoutSummary,
  type ImmersiveSettings,
  type UseImmersiveWorkoutReturn,
} from '@/types/immersive'

interface UseImmersiveWorkoutProps {
  workoutId: string
  onComplete?: (summary: WorkoutSummary) => void
  onExit?: () => void
}

export function useImmersiveWorkout({
  workoutId,
  onComplete,
  onExit,
}: UseImmersiveWorkoutProps): UseImmersiveWorkoutReturn {
  // State
  const [status, setStatus] = useState<ImmersiveStatus>('preparing')
  const [workout, setWorkout] = useState<ImmersiveWorkout | null>(null)
  const [exerciseIndex, setExerciseIndex] = useState(0)
  const [currentSetIndex, setCurrentSetIndex] = useState(0)
  const [allCompletedSets, setAllCompletedSets] = useState<SetLog[]>([])
  const [completedSetsForExercise, setCompletedSetsForExercise] = useState<SetLog[]>([])
  const [newPRs, setNewPRs] = useState<NewPR[]>([])
  const [currentPRCelebration, setCurrentPRCelebration] = useState<NewPR | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [summary, setSummary] = useState<WorkoutSummary | null>(null)
  const [settings, setSettings] = useState<ImmersiveSettings>(DEFAULT_IMMERSIVE_SETTINGS)
  const [userPRs, setUserPRs] = useState<Record<string, number>>({})

  // Refs
  const startTimeRef = useRef<number>(Date.now())
  const elapsedIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const supabase = createClient()

  // Hooks
  const audio = useWorkoutAudio()
  const wakeLock = useScreenWakeLock()

  const handleRestComplete = useCallback(() => {
    audio.vibrateTimerComplete()
    audio.playBeep()
    setStatus('active')
  }, [audio])

  const handleRestTick = useCallback(
    (remaining: number) => {
      if (remaining <= settings.timerWarningAt && remaining > 0) {
        audio.playCountdown()
      }
    },
    [audio, settings.timerWarningAt]
  )

  const restTimer = useWorkoutTimer(handleRestComplete, handleRestTick)

  // Current exercise
  const currentExercise = workout?.exercises[exerciseIndex] || null
  const totalExercises = workout?.exercises.length || 0
  const totalSets = currentExercise?.sets || 0

  // Load workout data
  useEffect(() => {
    async function loadWorkout() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Fetch workout with exercises
        const { data: workoutData } = await supabase
          .from('fitness_workouts')
          .select(`
            *,
            fitness_workout_exercises (
              *,
              fitness_exercises (*)
            )
          `)
          .eq('id', workoutId)
          .single() as { data: unknown }

        if (!workoutData) return

        const w = workoutData as {
          id: string
          nome: string
          fitness_workout_exercises: Array<{
            id: string
            series: number
            repeticoes: number
            descanso: number
            fitness_exercises: {
              id: string
              nome: string
              grupo_muscular: string
              equipamento?: string
            }
          }>
        }

        // Fetch user's PRs
        const exerciseIds = w.fitness_workout_exercises.map(
          (we) => we.fitness_exercises.id
        )

        const { data: prsData } = await supabase
          .from('personal_records')
          .select('*')
          .eq('user_id', user.id)
          .in('exercicio_id', exerciseIds) as { data: Array<{ exercicio_id: string; peso: number }> | null }

        const prsMap: Record<string, number> = {}
        prsData?.forEach((pr) => {
          prsMap[pr.exercicio_id] = pr.peso
        })
        setUserPRs(prsMap)

        // Fetch last sets for suggestions
        const { data: lastSets } = await supabase
          .from('treino_series')
          .select('*')
          .eq('user_id', user.id)
          .in('exercicio_id', exerciseIds)
          .order('created_at', { ascending: false })
          .limit(50) as { data: Array<{ exercicio_id: string; peso: number }> | null }

        const lastWeightMap: Record<string, number> = {}
        lastSets?.forEach((set) => {
          if (!lastWeightMap[set.exercicio_id]) {
            lastWeightMap[set.exercicio_id] = set.peso
          }
        })

        // Build immersive workout structure
        const immersiveWorkout: ImmersiveWorkout = {
          id: w.id,
          name: w.nome,
          exercises: w.fitness_workout_exercises.map((we) => ({
            id: we.fitness_exercises.id,
            workoutExerciseId: we.id,
            name: we.fitness_exercises.nome,
            muscleGroup: we.fitness_exercises.grupo_muscular,
            equipment: we.fitness_exercises.equipamento,
            sets: we.series,
            targetReps: we.repeticoes,
            suggestedWeight: lastWeightMap[we.fitness_exercises.id] || 0,
            currentPR: prsMap[we.fitness_exercises.id],
            restTime: we.descanso || settings.defaultRestTime,
          })),
          estimatedDuration: 45, // TODO: Calculate properly
        }

        setWorkout(immersiveWorkout)
      } catch (error) {
        console.error('Error loading workout:', error)
      }
    }

    loadWorkout()
  }, [workoutId, settings.defaultRestTime])

  // Elapsed time tracking
  useEffect(() => {
    if (status !== 'paused' && status !== 'complete' && status !== 'preparing') {
      elapsedIntervalRef.current = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000))
      }, 1000)
    } else {
      if (elapsedIntervalRef.current) {
        clearInterval(elapsedIntervalRef.current)
      }
    }

    return () => {
      if (elapsedIntervalRef.current) {
        clearInterval(elapsedIntervalRef.current)
      }
    }
  }, [status])

  // Wake lock
  useEffect(() => {
    if (settings.keepScreenOn && status !== 'complete') {
      wakeLock.request()
    }

    return () => {
      wakeLock.release()
    }
  }, [settings.keepScreenOn, status, wakeLock])

  // Actions
  const startWorkout = useCallback(() => {
    startTimeRef.current = Date.now()
    setStatus('active')
    audio.speakText('Vamos começar!')
  }, [audio])

  const completeSet = useCallback(
    async (data: SetInput) => {
      if (!currentExercise) return

      // Check for PR
      const currentPR = userPRs[currentExercise.id] || 0
      const isNewPR = data.weight > currentPR && data.reps >= 1

      const setLog: SetLog = {
        setNumber: currentSetIndex + 1,
        weight: data.weight,
        reps: data.reps,
        rpe: data.rpe,
        isNewPR,
        completedAt: new Date().toISOString(),
      }

      setCompletedSetsForExercise((prev) => [...prev, setLog])
      setAllCompletedSets((prev) => [...prev, setLog])

      audio.playSetComplete()
      audio.vibrateShort()

      // Handle PR
      if (isNewPR) {
        const newPR: NewPR = {
          exerciseId: currentExercise.id,
          exerciseName: currentExercise.name,
          newRecord: data.weight,
          previousRecord: currentPR,
          improvement: data.weight - currentPR,
          xpEarned: 50,
        }

        setNewPRs((prev) => [...prev, newPR])
        setCurrentPRCelebration(newPR)
        setUserPRs((prev) => ({ ...prev, [currentExercise.id]: data.weight }))
        setStatus('pr')

        audio.playPR()
        audio.vibrateCelebration()

        // Save PR to database
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            await supabase.from('personal_records').upsert({
              user_id: user.id,
              exercicio_id: currentExercise.id,
              peso: data.weight,
              reps: data.reps,
              data: getTodayDateSP(),
            } as never)
          }
        } catch (error) {
          console.error('Error saving PR:', error)
        }

        return
      }

      // Check if exercise is complete
      if (currentSetIndex + 1 >= totalSets) {
        audio.playExerciseComplete()

        // Move to next exercise or complete
        if (exerciseIndex + 1 >= totalExercises) {
          finishWorkout()
        } else {
          setExerciseIndex((prev) => prev + 1)
          setCurrentSetIndex(0)
          setCompletedSetsForExercise([])
          setStatus('rest')
          restTimer.start(currentExercise.restTime)
        }
      } else {
        setCurrentSetIndex((prev) => prev + 1)
        setStatus('rest')
        if (settings.autoStartTimer) {
          restTimer.start(currentExercise.restTime)
        }
      }
    },
    [
      currentExercise,
      currentSetIndex,
      totalSets,
      exerciseIndex,
      totalExercises,
      userPRs,
      audio,
      settings.autoStartTimer,
      restTimer,
      supabase,
    ]
  )

  const finishWorkout = useCallback(async () => {
    if (!workout) return

    restTimer.skip()

    const totalVolume = allCompletedSets.reduce((sum, set) => sum + set.weight * set.reps, 0)
    const totalReps = allCompletedSets.reduce((sum, set) => sum + set.reps, 0)
    const xpBase = 100 // Base XP for completing workout
    const xpPRs = newPRs.length * 50 // 50 XP per PR
    const xpBonus = allCompletedSets.length * 5 // 5 XP per set

    const workoutSummary: WorkoutSummary = {
      workoutId: workout.id,
      workoutName: workout.name,
      duration: elapsedTime,
      exercisesCompleted: exerciseIndex + 1,
      totalExercises,
      setsCompleted: allCompletedSets.length,
      totalSets: workout.exercises.reduce((sum, ex) => sum + ex.sets, 0),
      totalVolume,
      totalReps,
      prsAchieved: newPRs,
      xpEarned: xpBase + xpPRs + xpBonus,
      completedAt: new Date().toISOString(),
    }

    setSummary(workoutSummary)
    setStatus('complete')

    audio.playWorkoutComplete()
    audio.vibrateCelebration()
    audio.speakText('Treino concluído! Excelente trabalho!')

    wakeLock.release()
    onComplete?.(workoutSummary)

    // Save workout log
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('treino_logs').insert({
          user_id: user.id,
          treino_id: workout.id,
          data: new Date().toISOString().split('T')[0],
          duracao: elapsedTime,
          volume_total: totalVolume,
          series_realizadas: allCompletedSets.length,
          exercicios_count: exerciseIndex + 1,
        } as never)
      }
    } catch (error) {
      console.error('Error saving workout log:', error)
    }
  }, [
    workout,
    elapsedTime,
    exerciseIndex,
    totalExercises,
    allCompletedSets,
    newPRs,
    audio,
    wakeLock,
    onComplete,
    restTimer,
    supabase,
  ])

  const skipRest = useCallback(() => {
    restTimer.skip()
    setStatus('active')
  }, [restTimer])

  const skipExercise = useCallback(() => {
    if (exerciseIndex + 1 >= totalExercises) {
      finishWorkout()
    } else {
      setExerciseIndex((prev) => prev + 1)
      setCurrentSetIndex(0)
      setCompletedSetsForExercise([])
      setStatus('active')
    }
  }, [exerciseIndex, totalExercises, finishWorkout])

  const goToPreviousExercise = useCallback(() => {
    if (exerciseIndex > 0) {
      setExerciseIndex((prev) => prev - 1)
      setCurrentSetIndex(0)
      setCompletedSetsForExercise([])
      setStatus('active')
    }
  }, [exerciseIndex])

  const pause = useCallback(() => {
    restTimer.pause()
    setStatus('paused')
  }, [restTimer])

  const resume = useCallback(() => {
    if (restTimer.timeRemaining > 0) {
      restTimer.resume()
      setStatus('rest')
    } else {
      setStatus('active')
    }
  }, [restTimer])

  const endWorkout = useCallback(() => {
    finishWorkout()
  }, [finishWorkout])

  const dismissPRCelebration = useCallback(() => {
    setCurrentPRCelebration(null)

    // Continue to next set or exercise
    if (currentSetIndex + 1 >= totalSets) {
      if (exerciseIndex + 1 >= totalExercises) {
        finishWorkout()
      } else {
        setExerciseIndex((prev) => prev + 1)
        setCurrentSetIndex(0)
        setCompletedSetsForExercise([])
        setStatus('rest')
        if (currentExercise && settings.autoStartTimer) {
          restTimer.start(currentExercise.restTime)
        }
      }
    } else {
      setCurrentSetIndex((prev) => prev + 1)
      setStatus('rest')
      if (currentExercise && settings.autoStartTimer) {
        restTimer.start(currentExercise.restTime)
      }
    }
  }, [
    currentSetIndex,
    totalSets,
    exerciseIndex,
    totalExercises,
    currentExercise,
    settings.autoStartTimer,
    restTimer,
    finishWorkout,
  ])

  const updateSettings = useCallback((newSettings: Partial<ImmersiveSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }))
  }, [])

  return {
    // Estado
    status,

    // Exercício atual
    currentExercise,
    currentSetIndex,
    totalSets,
    completedSetsForExercise,

    // Progresso geral
    exerciseIndex,
    totalExercises,
    allCompletedSets,
    elapsedTime,

    // Timer de descanso
    restTimeRemaining: restTimer.timeRemaining,
    isRestTimerActive: restTimer.isRunning,

    // PRs
    newPRs,
    currentPRCelebration,

    // Ações
    startWorkout,
    completeSet,
    skipRest,
    skipExercise,
    goToPreviousExercise,
    pause,
    resume,
    endWorkout,
    dismissPRCelebration,

    // Configurações
    settings,
    updateSettings,

    // Resumo
    summary,
  }
}
