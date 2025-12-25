"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Clock, Dumbbell, Flame, Trophy, Calendar, Loader2 } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface WorkoutSet {
  id: string
  numero_serie: number
  repeticoes_realizadas: number | null
  carga: number | null
  is_pr: boolean
}

interface WorkoutExercise {
  id: string
  exercicio_nome: string
  ordem: number
  series: WorkoutSet[]
}

interface WorkoutDetail {
  id: string
  nome: string
  tipo: string
  data: string
  duracao_minutos: number | null
  nivel_dificuldade: number | null
  nivel_energia: number | null
  notas: string | null
  calorias_estimadas: number | null
  exercicios: WorkoutExercise[]
}

const difficultyLabels = ['', 'Muito Fácil', 'Fácil', 'Normal', 'Difícil', 'Muito Difícil']

export default function HistoryWorkoutDetailPage() {
  const params = useParams()
  const router = useRouter()
  const workoutId = params.id as string

  const [workout, setWorkout] = useState<WorkoutDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    async function loadWorkout() {
      try {
        setLoading(true)

        // Fetch workout with exercises and sets
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: workoutData, error: workoutError } = await (supabase as any)
          .from('fitness_workouts')
          .select(`
            *,
            exercicios:fitness_workout_exercises(
              *,
              series:fitness_exercise_sets(*)
            )
          `)
          .eq('id', workoutId)
          .single()

        if (workoutError) throw workoutError

        if (workoutData) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const exercicios: WorkoutExercise[] = ((workoutData as any).exercicios || []).map((ex: any) => ({
            id: ex.id,
            exercicio_nome: ex.exercicio_nome,
            ordem: ex.ordem,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            series: (ex.series || []).map((s: any) => ({
              id: s.id,
              numero_serie: s.numero_serie,
              repeticoes_realizadas: s.repeticoes_realizadas,
              carga: s.carga,
              is_pr: s.is_pr || false
            })).sort((a: WorkoutSet, b: WorkoutSet) => a.numero_serie - b.numero_serie)
          })).sort((a: WorkoutExercise, b: WorkoutExercise) => a.ordem - b.ordem)

          setWorkout({
            id: workoutData.id,
            nome: workoutData.nome,
            tipo: workoutData.tipo,
            data: workoutData.data,
            duracao_minutos: workoutData.duracao_minutos,
            nivel_dificuldade: workoutData.nivel_dificuldade,
            nivel_energia: workoutData.nivel_energia,
            notas: workoutData.notas,
            calorias_estimadas: workoutData.calorias_estimadas,
            exercicios
          })
        }
      } catch (err) {
        console.error('Error loading workout:', err)
        setError('Erro ao carregar treino')
      } finally {
        setLoading(false)
      }
    }

    loadWorkout()
  }, [workoutId, supabase])

  // Calculate total volume
  const volumeTotal = workout?.exercicios.reduce((total, ex) => {
    return total + ex.series.reduce((exTotal, set) => {
      return exTotal + ((set.carga || 0) * (set.repeticoes_realizadas || 0))
    }, 0)
  }, 0) || 0

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-violet-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Carregando treino...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !workout) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <div className="text-center">
          <span className="text-4xl mb-4 block">🤷</span>
          <h2 className="text-xl font-bold text-white mb-2">Treino não encontrado</h2>
          <p className="text-slate-400 mb-4">{error}</p>
          <Button onClick={() => router.back()}>Voltar</Button>
        </div>
      </div>
    )
  }

  // Parse date safely
  let formattedDate = ''
  try {
    const date = workout.data.includes('T') ? parseISO(workout.data) : new Date(workout.data + 'T00:00:00')
    formattedDate = format(date, "EEEE, d 'de' MMMM", { locale: ptBR })
  } catch {
    formattedDate = workout.data
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] pb-24">
      {/* Header */}
      <div className="relative">
        <div className="absolute inset-0 h-48 bg-gradient-to-b from-violet-500/20 to-transparent" />

        <div className="relative px-4 pt-12">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Voltar</span>
          </button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-400">
                {formattedDate}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-4">{workout.nome}</h1>
          </motion.div>
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 mb-6">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#14141F] border border-[#2E2E3E] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-violet-400" />
              <span className="text-xs text-slate-400">Duração</span>
            </div>
            <p className="text-2xl font-bold text-white">{workout.duracao_minutos || 0} min</p>
          </div>

          <div className="bg-[#14141F] border border-[#2E2E3E] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Dumbbell className="w-4 h-4 text-cyan-400" />
              <span className="text-xs text-slate-400">Volume</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {volumeTotal >= 1000 ? `${(volumeTotal / 1000).toFixed(1)}t` : `${volumeTotal}kg`}
            </p>
          </div>

          <div className="bg-[#14141F] border border-[#2E2E3E] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-4 h-4 text-orange-400" />
              <span className="text-xs text-slate-400">Calorias</span>
            </div>
            <p className="text-2xl font-bold text-white">{workout.calorias_estimadas || 0} kcal</p>
          </div>

          <div className="bg-[#14141F] border border-[#2E2E3E] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm">💪</span>
              <span className="text-xs text-slate-400">Dificuldade</span>
            </div>
            <p className="text-lg font-bold text-white">
              {workout.nivel_dificuldade ? difficultyLabels[workout.nivel_dificuldade] : '-'}
            </p>
          </div>
        </div>
      </div>

      {/* Notes */}
      {workout.notas && (
        <div className="px-4 mb-6">
          <h2 className="text-lg font-semibold text-white mb-3">Notas</h2>
          <div className="bg-[#14141F] border border-[#2E2E3E] rounded-xl p-4">
            <p className="text-slate-300">{workout.notas}</p>
          </div>
        </div>
      )}

      {/* Exercises */}
      <div className="px-4">
        <h2 className="text-lg font-semibold text-white mb-3">Exercícios</h2>
        <div className="space-y-4">
          {workout.exercicios.length === 0 ? (
            <div className="bg-[#14141F] border border-[#2E2E3E] rounded-xl p-4 text-center">
              <p className="text-slate-400">Nenhum exercício registrado</p>
            </div>
          ) : (
            workout.exercicios.map((exercise, index) => (
              <motion.div
                key={exercise.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-[#14141F] border border-[#2E2E3E] rounded-xl p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-medium">{exercise.exercicio_nome}</h3>
                  {exercise.series.some(s => s.is_pr) && (
                    <div className="flex items-center gap-1 text-amber-400">
                      <Trophy className="w-4 h-4" />
                      <span className="text-xs font-medium">PR</span>
                    </div>
                  )}
                </div>

                {exercise.series.length === 0 ? (
                  <p className="text-slate-500 text-sm">Sem séries registradas</p>
                ) : (
                  <div className="flex gap-2 flex-wrap">
                    {exercise.series.map((set) => (
                      <div
                        key={set.id}
                        className={cn(
                          'flex-1 min-w-[70px] py-2 rounded-lg text-center',
                          set.is_pr
                            ? 'bg-amber-500/20 border border-amber-500/30'
                            : 'bg-slate-800'
                        )}
                      >
                        <div className={cn(
                          'text-sm font-medium',
                          set.is_pr ? 'text-amber-400' : 'text-white'
                        )}>
                          {set.carga || 0}kg
                        </div>
                        <div className="text-xs text-slate-400">
                          {set.repeticoes_realizadas || 0} reps
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
