"use client"

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Clock, Dumbbell, Flame, Trophy, Home, Loader2, Zap } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ShareButton } from '@/components/share/share-button'
import { useWorkouts } from '@/hooks/use-workouts'
import { useSaveWorkout } from '@/hooks/use-save-workout'
import { useGamification } from '@/hooks/use-gamification'
import { cn } from '@/lib/utils'
import { getTodayDateSP } from '@/lib/utils/date'
import { createClient } from '@/lib/supabase/client'
import type { CompletedCardio, CardioExerciseType } from '@/lib/workout/types'

interface CompletedSetData {
  exerciseId: string
  exerciseName: string
  setNumber: number
  reps: number
  weight: number
  isPR: boolean
}

interface WorkoutSummaryData {
  // Workout info
  workoutId?: string
  templateId?: string
  nome?: string
  tipo?: string
  data?: string
  // Summary stats
  duration: number // minutes
  exercisesCompleted: number
  exercisesTotal: number
  setsCompleted: number
  setsTotal: number
  totalVolume: number // kg
  caloriesBurned: number
  newPRs: Array<{ exercise: string; weight: number; reps: number }>
  // Completed sets for database
  completedSets?: CompletedSetData[]
  // Cardio exercises
  cardioExercises?: CompletedCardio[]
}

// Icons for cardio types
const cardioIcons: Record<CardioExerciseType, string> = {
  esteira: '🏃',
  bicicleta: '🚴',
  eliptico: '🔄',
  transport: '🚶',
  step: '🪜',
  remo: '🚣',
  escada: '🪜',
  pular_corda: '🪢',
  outro: '💪'
}

const SUMMARY_STORAGE_KEY = 'felicefit_workout_summary'

// Get summary data from localStorage (saved by execution page)
function getSavedSummaryData(): WorkoutSummaryData | null {
  if (typeof window === 'undefined') return null
  const saved = localStorage.getItem(SUMMARY_STORAGE_KEY)
  if (saved) {
    try {
      return JSON.parse(saved)
    } catch {
      return null
    }
  }
  return null
}

// Default summary if none saved
function getDefaultSummaryData(): WorkoutSummaryData {
  return {
    duration: 0,
    exercisesCompleted: 0,
    exercisesTotal: 0,
    setsCompleted: 0,
    setsTotal: 0,
    totalVolume: 0,
    caloriesBurned: 0,
    newPRs: [],
    completedSets: [],
    cardioExercises: []
  }
}

const difficultyOptions = [
  { value: 1, label: 'Muito Fácil', emoji: '😴' },
  { value: 2, label: 'Fácil', emoji: '😊' },
  { value: 3, label: 'Normal', emoji: '😐' },
  { value: 4, label: 'Difícil', emoji: '😤' },
  { value: 5, label: 'Muito Difícil', emoji: '🥵' }
]

const energyOptions = [
  { value: 1, label: 'Sem energia', emoji: '😫' },
  { value: 2, label: 'Cansado', emoji: '😓' },
  { value: 3, label: 'Normal', emoji: '😐' },
  { value: 4, label: 'Bem', emoji: '💪' },
  { value: 5, label: 'Cheio de energia', emoji: '⚡' }
]

export default function WorkoutSummaryPage() {
  const params = useParams()
  const router = useRouter()
  const workoutId = params.id as string

  const [difficulty, setDifficulty] = useState<number | null>(null)
  const [energy, setEnergy] = useState<number | null>(null)
  const [notes, setNotes] = useState('')
  const [saved, setSaved] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [summary, setSummary] = useState<WorkoutSummaryData>(getDefaultSummaryData())
  const [saveError, setSaveError] = useState<string | null>(null)
  // Synchronous lock — bloqueia cliques múltiplos antes de o estado `saving`
  // do hook propagar; sem isso, 4 cliques rápidos viram 4 inserts no banco.
  const savingRef = useRef(false)

  // Find workout from real data
  const { getWorkoutById, loading, refresh } = useWorkouts()
  const workout = getWorkoutById(workoutId)

  // Hook to save workout to database
  const { saveWorkout, saving } = useSaveWorkout()

  // Gamification
  const { addXP } = useGamification()

  // Load summary data from localStorage on mount
  useEffect(() => {
    const savedSummary = getSavedSummaryData()
    if (savedSummary) {
      setSummary(savedSummary)
    }
    // Clear execution state
    localStorage.removeItem('felicefit_workout_execution')
  }, [])

  const handleSave = async () => {
    // Guarda síncrona contra cliques duplicados / concorrentes.
    if (savingRef.current || saved) return
    savingRef.current = true
    // Feedback visual imediato — desabilita o botão antes de qualquer await,
    // para que o usuário veja o spinner já no primeiro clique.
    setSubmitting(true)
    setSaveError(null)

    // Prepare data for saving
    if (!summary.workoutId || !summary.nome || !summary.tipo || !summary.data) {
      // If we don't have workout data from execution, use from workout object
      if (!workout) {
        setSaveError('Dados do treino não encontrados')
        setSubmitting(false)
        savingRef.current = false
        return
      }
    }

    const saveData = {
      workoutId: summary.workoutId || workoutId,
      templateId: summary.templateId || workout?.template_id,
      nome: summary.nome || workout?.nome || 'Treino',
      tipo: summary.tipo || workout?.tipo || 'tradicional',
      data: summary.data || workout?.data || getTodayDateSP(),
      duracao: summary.duration,
      completedSets: summary.completedSets || [],
      cardioExercises: summary.cardioExercises || [],
      difficulty: difficulty || undefined,
      energy: energy || undefined,
      notes: notes || undefined,
      // Mesmo valor exibido na tela — evita banco e display divergirem.
      totalCalories: summary.caloriesBurned,
    }

    // Read streak BEFORE saving so we can detect transitions to 7/30.
    // Roda em paralelo com a auth.getUser para reduzir o waterfall.
    const supabase = createClient()
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    const oldStreakPromise = currentUser
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? (supabase as any)
          .from('fitness_profiles')
          .select('streak_atual')
          .eq('id', currentUser.id)
          .single()
          .then((r: { data: { streak_atual?: number } | null }) => r.data?.streak_atual || 0)
      : Promise.resolve(0)

    // Foreground: salva o treino (precisa terminar antes de mostrar sucesso).
    const result = await saveWorkout(saveData)

    if (!result) {
      setSaveError('Erro ao salvar treino. Tente novamente.')
      setSubmitting(false)
      savingRef.current = false
      return
    }

    const { workoutId: savedId, prSetIds, cardioAwards } = result

    // Sucesso visual IMEDIATO assim que o core save terminou.
    localStorage.removeItem(SUMMARY_STORAGE_KEY)
    setSaved(true)

    // Background: pontos + streak + XP + refresh.
    // São best-effort — se falharem, o treino já está salvo e dedup garante
    // que uma reentrada futura também funciona.
    void (async () => {
      try {
        const oldStreak = await oldStreakPromise

        // Uma única round-trip consolidada: o endpoint roda todos os awards
        // (workout, PRs, cardios, streak) em paralelo no servidor.
        await fetch('/api/points/award-workout-complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workoutId: savedId,
            prSetIds,
            cardioAwards: cardioAwards.map((c) => ({
              workoutExerciseId: c.workoutExerciseId,
              intensity: c.intensity,
            })),
            oldStreak,
          }),
        }).catch((err) => {
          console.error('Erro no award-workout-complete:', err)
        })

        // XP é client-side (localStorage) — sem custo de rede.
        const baseXP = 100
        const volumeBonus = Math.floor(summary.totalVolume / 1000) * 5
        const prBonus = summary.newPRs.length * 50
        await addXP(
          baseXP + volumeBonus + prBonus,
          `Treino concluído: ${saveData.nome}`,
          'workout_completed'
        )

        await refresh()
      } catch (err) {
        console.error('Erro em pontos/XP do treino (background):', err)
      }
    })()

    // Navega de volta enquanto o background termina.
    setTimeout(() => router.push('/treino'), 1500)
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-dourado animate-spin mx-auto mb-4" />
          <p className="text-foreground-secondary">Carregando...</p>
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
          <Button onClick={() => router.push('/treino')}>Voltar</Button>
        </div>
      </div>
    )
  }

  if (saved) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <span className="text-6xl mb-4 block">✅</span>
          <h2 className="text-2xl font-bold text-foreground">Treino salvo!</h2>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header with celebration */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/30 via-emerald-500/10 to-transparent" />

        <div className="relative px-4 pt-12 pb-8 text-center">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', damping: 10 }}
            className="text-6xl mb-4"
          >
            🎉
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-bold text-foreground mb-2"
          >
            Treino Concluído!
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-foreground-secondary"
          >
            {workout.nome}
          </motion.p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="px-4 -mt-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-2 gap-3"
        >
          {/* Duration */}
          <div className="bg-white border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-dourado" />
              <span className="text-xs text-foreground-secondary">Duração</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{summary.duration} min</p>
          </div>

          {/* Volume */}
          <div className="bg-white border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Dumbbell className="w-4 h-4 text-dourado" />
              <span className="text-xs text-foreground-secondary">Volume total</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {(summary.totalVolume / 1000).toFixed(1)}t
            </p>
          </div>

          {/* Calories */}
          <div className="bg-white border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-4 h-4 text-orange-400" />
              <span className="text-xs text-foreground-secondary">Calorias</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{summary.caloriesBurned} kcal</p>
          </div>

          {/* Sets */}
          <div className="bg-white border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs">✓</span>
              <span className="text-xs text-foreground-secondary">Séries</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {summary.setsCompleted}/{summary.setsTotal}
            </p>
          </div>
        </motion.div>
      </div>

      {/* PRs section */}
      {summary.newPRs.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="px-4 mt-6"
        >
          <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            Novos Recordes!
          </h2>
          <div className="space-y-2">
            {summary.newPRs.map((pr, index) => (
              <div
                key={index}
                className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-foreground font-medium">{pr.exercise}</span>
                  <span className="text-amber-400 font-bold">
                    {pr.weight}kg × {pr.reps}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Cardio section */}
      {summary.cardioExercises && summary.cardioExercises.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="px-4 mt-6"
        >
          <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <Zap className="w-5 h-5 text-emerald-400" />
            Cardio
          </h2>
          <div className="space-y-3">
            {summary.cardioExercises.map((cardio, index) => (
              <div
                key={index}
                className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 rounded-xl p-4"
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{cardioIcons[cardio.tipo]}</span>
                    <div>
                      <span className="text-foreground font-medium block">{cardio.nome}</span>
                      {cardio.intensidade && (
                        <span className="text-xs text-foreground-secondary capitalize">{cardio.intensidade.replace('_', ' ')}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-orange-400 font-bold text-lg block">
                      {cardio.calorias} kcal
                    </span>
                    {cardio.met && (
                      <span className="text-[10px] text-foreground-muted">MET: {cardio.met}</span>
                    )}
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-background-elevated/50 rounded-lg p-2">
                    <span className="text-xs text-foreground-muted block">Duração</span>
                    <span className="text-foreground font-semibold">{cardio.duracao_minutos} min</span>
                  </div>
                  {cardio.distancia_km && (
                    <div className="bg-background-elevated/50 rounded-lg p-2">
                      <span className="text-xs text-foreground-muted block">Distância</span>
                      <span className="text-foreground font-semibold">{cardio.distancia_km.toFixed(2)} km</span>
                    </div>
                  )}
                  {cardio.velocidade_media && (
                    <div className="bg-background-elevated/50 rounded-lg p-2">
                      <span className="text-xs text-foreground-muted block">Vel. Média</span>
                      <span className="text-foreground font-semibold">{cardio.velocidade_media} km/h</span>
                    </div>
                  )}
                  {cardio.ritmo_medio && cardio.ritmo_medio !== '--:--' && (
                    <div className="bg-background-elevated/50 rounded-lg p-2">
                      <span className="text-xs text-foreground-muted block">Ritmo</span>
                      <span className="text-foreground font-semibold">{cardio.ritmo_medio} /km</span>
                    </div>
                  )}
                  {cardio.inclinacao && cardio.inclinacao > 0 && (
                    <div className="bg-background-elevated/50 rounded-lg p-2">
                      <span className="text-xs text-foreground-muted block">Inclinação</span>
                      <span className="text-foreground font-semibold">{cardio.inclinacao}%</span>
                    </div>
                  )}
                  {cardio.resistencia && (
                    <div className="bg-background-elevated/50 rounded-lg p-2">
                      <span className="text-xs text-foreground-muted block">Resistência</span>
                      <span className="text-foreground font-semibold">{cardio.resistencia}/20</span>
                    </div>
                  )}
                  {cardio.frequencia_cardiaca_media && (
                    <div className="bg-background-elevated/50 rounded-lg p-2">
                      <span className="text-xs text-foreground-muted block">FC Média</span>
                      <span className="text-red-400 font-semibold">{cardio.frequencia_cardiaca_media} bpm</span>
                    </div>
                  )}
                  {cardio.frequencia_cardiaca_max && (
                    <div className="bg-background-elevated/50 rounded-lg p-2">
                      <span className="text-xs text-foreground-muted block">FC Máx</span>
                      <span className="text-red-400 font-semibold">{cardio.frequencia_cardiaca_max} bpm</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Difficulty rating */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="px-4 mt-6"
      >
        <h2 className="text-lg font-semibold text-foreground mb-3">Como foi o treino?</h2>
        <div className="flex justify-between gap-2">
          {difficultyOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setDifficulty(option.value)}
              className={cn(
                'flex-1 py-3 rounded-xl text-center transition-all',
                difficulty === option.value
                  ? 'bg-dourado ring-2 ring-dourado/70'
                  : 'bg-white border border-border hover:border-dourado/30'
              )}
            >
              <span className="text-2xl block mb-1">{option.emoji}</span>
              <span className="text-xs text-foreground-secondary">{option.label}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Energy rating */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="px-4 mt-6"
      >
        <h2 className="text-lg font-semibold text-foreground mb-3">Seu nível de energia</h2>
        <div className="flex justify-between gap-2">
          {energyOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setEnergy(option.value)}
              className={cn(
                'flex-1 py-3 rounded-xl text-center transition-all',
                energy === option.value
                  ? 'bg-vinho ring-2 ring-vinho/70'
                  : 'bg-white border border-border hover:border-vinho/30'
              )}
            >
              <span className="text-2xl block mb-1">{option.emoji}</span>
              <span className="text-xs text-foreground-secondary">{option.label}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Notes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="px-4 mt-6"
      >
        <h2 className="text-lg font-semibold text-foreground mb-3">Notas (opcional)</h2>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Como você se sentiu? Algo a melhorar?"
          className="w-full bg-white border border-border rounded-xl p-4 text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-dourado resize-none"
          rows={3}
        />
      </motion.div>

      {/* Actions - positioned above bottom nav */}
      <div className="fixed bottom-20 left-0 right-0 p-4 z-40 bg-gradient-to-t from-background via-background to-transparent pt-8">
        <div className="max-w-lg mx-auto space-y-3">
          {saveError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-center">
              <p className="text-red-400 text-sm">{saveError}</p>
            </div>
          )}
          <Button
            variant="gradient"
            size="lg"
            className="w-full"
            onClick={handleSave}
            disabled={saving || submitting}
          >
            {(saving || submitting) ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Salvando...
              </>
            ) : (
              'Salvar Treino'
            )}
          </Button>
          <div className="flex gap-3">
            <div className="flex-1">
              <ShareButton
                type="workout"
                data={{
                  workoutName: workout.nome || 'Treino',
                  duration: `${summary.duration}min`,
                  exercises: summary.exercisesCompleted,
                  sets: summary.setsCompleted,
                  calories: summary.caloriesBurned,
                  prs: summary.newPRs.length,
                  date: new Date().toLocaleDateString('pt-BR'),
                }}
                variant="button"
                className="w-full"
              />
            </div>
            <Link href="/" className="flex-1">
              <Button variant="outline" size="lg" className="w-full gap-2">
                <Home className="w-4 h-4" />
                Início
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
