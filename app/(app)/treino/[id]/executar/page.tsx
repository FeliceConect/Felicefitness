"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { X, Pause, Loader2, Zap, Play } from 'lucide-react'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { useWorkoutExecution } from '@/hooks/use-workout-execution'
import { useRestTimer } from '@/hooks/use-rest-timer'
import { useWorkouts } from '@/hooks/use-workouts'
import { useSettings } from '@/hooks/use-settings'
import { useExerciseHistory } from '@/hooks/use-exercise-history'
import { cn } from '@/lib/utils'

// Lazy load modals — only needed when user triggers them
const RestTimerModal = dynamic(() => import('@/components/treino/rest-timer-modal').then(m => ({ default: m.RestTimerModal })), { ssr: false })
const SetInputModal = dynamic(() => import('@/components/treino/set-input-modal').then(m => ({ default: m.SetInputModal })), { ssr: false })
const CardioInputModal = dynamic(() => import('@/components/treino/cardio-input-modal').then(m => ({ default: m.CardioInputModal })), { ssr: false })
const PRCelebration = dynamic(() => import('@/components/treino/pr-celebration').then(m => ({ default: m.PRCelebration })), { ssr: false })
const ExerciseVideoModal = dynamic(() => import('@/components/treino/exercise-video-modal').then(m => ({ default: m.ExerciseVideoModal })), { ssr: false })
import type { CompletedCardio } from '@/lib/workout/types'

function formatTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export default function WorkoutExecutionPage() {
  const params = useParams()
  const router = useRouter()
  const workoutId = params.id as string

  const [showSetInput, setShowSetInput] = useState(false)
  const [showCardioInput, setShowCardioInput] = useState(false)
  const [showPRCelebration, setShowPRCelebration] = useState(false)
  const [latestPR, setLatestPR] = useState<{ name: string; weight: number; reps: number } | null>(null)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  // Estado para edição de série completada
  const [editingSet, setEditingSet] = useState<{ exerciseId: string; setNumber: number; weight: number; reps: number; exerciseName: string } | null>(null)
  const [showVideoModal, setShowVideoModal] = useState(false)
  const [exerciseVideoUrls, setExerciseVideoUrls] = useState<Record<string, string>>({})

  // Find workout from real data via useWorkouts hook
  const { getWorkoutById, loading } = useWorkouts()
  const workout = getWorkoutById(workoutId)

  // Get user settings for rest timer
  const { settings } = useSettings()
  const defaultRestTime = settings?.workout?.descanso_padrao || 60

  // Get exercise history (last weights)
  const { getLastWeight } = useExerciseHistory()

  const {
    state,
    startWorkout,
    completeSet,
    editCompletedSet,
    skipSet,
    skipExercise,
    addCardio,
    finishWorkout,
    currentExercise,
    currentSet,
    progress,
    isLastSet,
    isLastExercise,
    completedSetsCount
  } = useWorkoutExecution()

  const restTimer = useRestTimer({
    soundEnabled: settings?.workout?.som_timer ?? true,
    vibrationEnabled: settings?.workout?.vibracao_timer ?? true,
    notificationsEnabled: true
  })

  // Fetch video URLs for exercises from DB
  useEffect(() => {
    if (!workout) return
    const exerciseNames = workout.exercicios?.map((e: { exercise_id?: string; nome: string }) => e.exercise_id || e.nome) || []
    if (exerciseNames.length === 0) return

    // Fetch exercises that have video_url
    fetch(`/api/portal/exercises?limit=100`)
      .then(r => r.json())
      .then(data => {
        if (data.success && data.exercises) {
          const urls: Record<string, string> = {}
          for (const ex of data.exercises) {
            if (ex.video_url) {
              urls[ex.id] = ex.video_url
              urls[ex.nome?.toLowerCase()] = ex.video_url
            }
          }
          setExerciseVideoUrls(urls)
        }
      })
      .catch(() => {})
  }, [workout])

  // Solicitar permissão de notificações ao iniciar o treino
  useEffect(() => {
    if (!loading && workout && state.status === 'in_progress') {
      restTimer.requestNotificationPermission()
    }
  }, [loading, workout, state.status, restTimer])

  // Start workout on mount (only after loading is complete)
  useEffect(() => {
    if (!loading && workout && state.status === 'not_started') {
      startWorkout(workout)
    }
  }, [loading, workout, state.status, startWorkout])

  // Handle set completion (new set or editing existing)
  const handleCompleteSet = (data: { reps: number; weight: number }) => {
    setShowSetInput(false)

    // Se estamos editando uma série existente
    if (editingSet) {
      editCompletedSet(editingSet.exerciseId, editingSet.setNumber, data)
      setEditingSet(null)
      return
    }

    // Check if this will be a PR (before completing)
    const previousPRsCount = state.newPRs.length

    completeSet(data)

    // Check if we got a new PR
    setTimeout(() => {
      if (state.newPRs.length > previousPRsCount ||
          (currentExercise && data.weight > 0)) {
        // For demo purposes, simulate PR detection occasionally
        const isPR = Math.random() > 0.7 // 30% chance for demo
        if (isPR && currentExercise) {
          setLatestPR({
            name: currentExercise.nome,
            weight: data.weight,
            reps: data.reps
          })
          setShowPRCelebration(true)
          return
        }
      }

      // Start rest timer if not last set of last exercise
      if (!(isLastSet && isLastExercise) && currentExercise) {
        const restTime = currentSet?.descanso || defaultRestTime
        restTimer.start(restTime)
      }
    }, 100)
  }

  // Handle click on completed set to edit
  const handleEditCompletedSet = (exerciseId: string, setNumber: number) => {
    const completedSet = state.completedSets.find(
      cs => cs.exerciseId === exerciseId && cs.setNumber === setNumber
    )
    if (completedSet) {
      setEditingSet({
        exerciseId,
        setNumber,
        weight: completedSet.weight,
        reps: completedSet.reps,
        exerciseName: completedSet.exerciseName
      })
      setShowSetInput(true)
    }
  }

  // Cancel editing
  const handleCancelEdit = () => {
    setShowSetInput(false)
    setEditingSet(null)
  }

  // Handle skip rest
  const handleSkipRest = () => {
    restTimer.skip()
  }

  // Handle finish workout
  const handleFinishWorkout = () => {
    const summary = finishWorkout()
    if (summary && workout) {
      // Save summary data for the resume page
      // IMPORTANT: Always use today's date (when workout was actually done)
      // not the original scheduled date
      const todayDate = format(new Date(), 'yyyy-MM-dd')
      const summaryData = {
        // Workout info for saving to database
        workoutId: workoutId,
        templateId: workout.template_id,
        nome: workout.nome,
        tipo: workout.tipo,
        data: todayDate, // Use actual execution date, not scheduled date
        // Summary stats
        duration: summary.duracao,
        exercisesCompleted: summary.exerciciosCompletos,
        exercisesTotal: summary.exerciciosTotal,
        setsCompleted: summary.seriesCompletas,
        setsTotal: summary.seriesTotal,
        totalVolume: summary.volumeTotal,
        caloriesBurned: summary.caloriasEstimadas,
        newPRs: summary.novosRecordes.map(pr => ({
          exercise: pr.exercise_name,
          weight: pr.weight,
          reps: pr.reps
        })),
        // Completed sets for saving to database
        completedSets: state.completedSets,
        // Cardio exercises
        cardioExercises: summary.cardioExercises || []
      }
      localStorage.setItem('felicefit_workout_summary', JSON.stringify(summaryData))
      router.push(`/treino/${workoutId}/resumo`)
    }
  }

  // Handle exit
  const handleExit = () => {
    if (completedSetsCount > 0) {
      setShowExitConfirm(true)
    } else {
      router.back()
    }
  }

  // Handle PR celebration close
  const handleClosePR = () => {
    setShowPRCelebration(false)
    setLatestPR(null)

    // Start rest timer after PR celebration
    if (!(isLastSet && isLastExercise) && currentExercise) {
      const restTime = currentSet?.descanso || 45
      restTimer.start(restTime)
    }
  }

  // Handle cardio addition
  const handleAddCardio = (cardioData: CompletedCardio) => {
    setShowCardioInput(false)
    addCardio(cardioData)
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-dourado animate-spin mx-auto mb-4" />
          <p className="text-foreground-secondary">Carregando treino...</p>
        </div>
      </div>
    )
  }

  if (!workout) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <span className="text-4xl mb-4 block">🤷</span>
          <h2 className="text-xl font-bold text-foreground mb-2">Treino não encontrado</h2>
          <Button onClick={() => router.back()}>Voltar</Button>
        </div>
      </div>
    )
  }

  // Check if workout is completed
  if (state.status === 'completed') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <span className="text-6xl mb-6 block">🎉</span>
          <h2 className="text-2xl font-bold text-foreground mb-2">Treino Concluído!</h2>
          <p className="text-foreground-secondary mb-8">
            {completedSetsCount} séries em {formatTime(state.elapsedTime)}
          </p>
          <Button variant="gradient" size="lg" onClick={handleFinishWorkout}>
            Ver Resumo
          </Button>
        </motion.div>
      </div>
    )
  }

  // Buscar último peso pelo nome do exercício (dados reais do banco)
  const lastWeight = currentExercise ? getLastWeight(currentExercise.nome) : null

  return (
    <div className="min-h-screen bg-background flex flex-col pb-44">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <button
          onClick={handleExit}
          className="p-2 hover:bg-background-elevated rounded-lg transition-colors"
        >
          <X className="w-6 h-6 text-foreground-secondary" />
        </button>

        <div className="text-center">
          <p className="text-sm text-foreground-secondary">{workout.nome}</p>
          <p className="text-lg font-bold text-foreground">{formatTime(state.elapsedTime)}</p>
        </div>

        <button
          onClick={() => setShowExitConfirm(true)}
          className="p-2 hover:bg-background-elevated rounded-lg transition-colors"
        >
          <Pause className="w-6 h-6 text-foreground-secondary" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-background-elevated">
        <motion.div
          className="h-full bg-gradient-to-r from-dourado to-vinho"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col p-6">
        {/* Current exercise */}
        {currentExercise && (
          <motion.div
            key={currentExercise.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex flex-col"
          >
            {/* Exercise info */}
            <div className="text-center mb-4">
              <p className="text-sm text-dourado mb-1">
                Exercício {state.currentExerciseIndex + 1} de {workout.exercicios.length}
              </p>
              <div className="flex items-center justify-center gap-2 mb-2">
                <h2 className="text-2xl font-bold text-foreground">
                  {currentExercise.nome}
                </h2>
                {(exerciseVideoUrls[currentExercise.exercise_id] || exerciseVideoUrls[currentExercise.nome?.toLowerCase()]) && (
                  <button
                    onClick={() => setShowVideoModal(true)}
                    className="p-2 rounded-full bg-dourado/10 hover:bg-dourado/20 transition-colors"
                    title="Ver video"
                  >
                    <Play className="w-4 h-4 text-dourado" fill="currentColor" />
                  </button>
                )}
              </div>
              {lastWeight && (
                <p className="text-sm text-foreground-secondary">
                  Última vez: {lastWeight.weight}kg × {lastWeight.reps}
                </p>
              )}
            </div>

            {/* Series indicators */}
            <div className="flex justify-center gap-3 mb-4">
              {currentExercise.series.map((set, index) => {
                // Use the unique workout exercise id (currentExercise.id) not exercise_id
                const completedSet = state.completedSets.find(
                  cs => cs.exerciseId === currentExercise.id && cs.setNumber === index + 1
                )
                const isCompleted = !!completedSet
                const isCurrent = index === state.currentSetIndex

                return (
                  <motion.div
                    key={set.id}
                    animate={isCurrent ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ repeat: isCurrent ? Infinity : 0, duration: 2 }}
                    onClick={() => isCompleted && handleEditCompletedSet(currentExercise.id, index + 1)}
                    className={cn(
                      'w-12 h-12 rounded-full flex flex-col items-center justify-center text-lg font-bold',
                      isCompleted
                        ? 'bg-emerald-500 text-white cursor-pointer hover:bg-emerald-400 active:scale-95 transition-all'
                        : isCurrent
                          ? 'bg-dourado text-white ring-2 ring-dourado/70 ring-offset-2 ring-offset-background'
                          : 'bg-background-elevated text-foreground-muted'
                    )}
                  >
                    {isCompleted ? (
                      <>
                        <span className="text-xs leading-none">{completedSet.weight}kg</span>
                        <span className="text-[10px] leading-none opacity-80">×{completedSet.reps}</span>
                      </>
                    ) : index + 1}
                  </motion.div>
                )
              })}
            </div>
            {/* Hint para edição */}
            {state.completedSets.some(cs => cs.exerciseId === currentExercise.id) && (
              <p className="text-center text-xs text-foreground-muted mb-2">
                Toque nas séries verdes para editar
              </p>
            )}

            {/* Current set info */}
            {currentSet && (
              <div className="bg-white border border-border rounded-2xl p-4">
                <div className="text-center">
                  <p className="text-sm text-foreground-secondary mb-2">Série {state.currentSetIndex + 1}</p>
                  <div className="flex items-center justify-center gap-4">
                    <div>
                      <p className="text-4xl font-bold text-foreground">
                        {/* Prioridade: último peso usado > peso do template > '-' */}
                        {lastWeight?.weight ?? currentSet.carga_planejada ?? '-'}
                      </p>
                      <p className="text-sm text-foreground-secondary">kg</p>
                    </div>
                    <span className="text-2xl text-foreground-muted">×</span>
                    <div>
                      <p className="text-4xl font-bold text-foreground">
                        {currentSet.repeticoes_planejadas}
                      </p>
                      <p className="text-sm text-foreground-secondary">reps</p>
                    </div>
                  </div>
                  {/* Indicar se é baseado no histórico */}
                  {lastWeight && (
                    <p className="text-xs text-dourado mt-2">
                      Baseado no seu último treino
                    </p>
                  )}
                </div>
              </div>
            )}

          </motion.div>
        )}
      </div>

      {/* Action buttons - Fixed at bottom above nav */}
      {currentExercise && (
        <div className="fixed bottom-20 left-0 right-0 p-4 z-40 bg-gradient-to-t from-background via-background to-transparent pt-6">
          <div className="max-w-lg mx-auto space-y-3">
            <Button
              variant="gradient"
              size="lg"
              className="w-full"
              onClick={() => setShowSetInput(true)}
            >
              Concluir Serie
            </Button>

            <div className="flex gap-3">
              <Button
                variant="outline"
                size="lg"
                className="flex-1"
                onClick={skipSet}
              >
                Pular Serie
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="flex-1"
                onClick={skipExercise}
              >
                Pular Exercicio
              </Button>
            </div>

            {/* Cardio button */}
            <Button
              variant="outline"
              size="lg"
              className="w-full border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
              onClick={() => setShowCardioInput(true)}
            >
              <Zap className="w-4 h-4 mr-2" />
              Adicionar Cardio
              {state.completedCardio.length > 0 && (
                <span className="ml-2 bg-emerald-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {state.completedCardio.length}
                </span>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Set input modal */}
      <SetInputModal
        isOpen={showSetInput}
        exerciseName={editingSet?.exerciseName || currentExercise?.nome || ''}
        setNumber={editingSet?.setNumber || state.currentSetIndex + 1}
        targetReps={currentSet?.repeticoes_planejadas || '12'}
        suggestedWeight={editingSet?.weight ?? currentSet?.carga_planejada}
        lastWeight={editingSet ? { weight: editingSet.weight, reps: editingSet.reps } : lastWeight}
        onComplete={handleCompleteSet}
        onCancel={handleCancelEdit}
      />

      {/* Cardio input modal */}
      <CardioInputModal
        isOpen={showCardioInput}
        onComplete={handleAddCardio}
        onCancel={() => setShowCardioInput(false)}
      />

      {/* Rest timer modal */}
      <RestTimerModal
        isOpen={restTimer.isRunning && restTimer.timeRemaining > 0}
        timeRemaining={restTimer.timeRemaining}
        totalTime={restTimer.totalTime}
        progress={restTimer.progress}
        onSkip={handleSkipRest}
        onAddTime={restTimer.addTime}
      />

      {/* PR celebration */}
      {latestPR && (
        <PRCelebration
          isOpen={showPRCelebration}
          exerciseName={latestPR.name}
          weight={latestPR.weight}
          reps={latestPR.reps}
          onClose={handleClosePR}
        />
      )}

      {/* Exercise video modal */}
      {currentExercise && (
        <ExerciseVideoModal
          isOpen={showVideoModal}
          onClose={() => setShowVideoModal(false)}
          videoUrl={exerciseVideoUrls[currentExercise.exercise_id] || exerciseVideoUrls[currentExercise.nome?.toLowerCase()] || ''}
          exerciseName={currentExercise.nome}
        />
      )}

      {/* Exit confirmation */}
      <AnimatePresence>
        {showExitConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full"
            >
              <h3 className="text-xl font-bold text-foreground mb-2">Pausar treino?</h3>
              <p className="text-foreground-secondary mb-6">
                Seu progresso será salvo e você pode continuar depois.
              </p>
              <div className="space-y-3">
                <Button
                  variant="gradient"
                  className="w-full"
                  onClick={() => setShowExitConfirm(false)}
                >
                  Continuar Treinando
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.back()}
                >
                  Sair e Salvar
                </Button>
                <Button
                  variant="ghost"
                  className="w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  onClick={() => {
                    localStorage.removeItem('felicefit_workout_execution')
                    router.back()
                  }}
                >
                  Descartar Treino
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
