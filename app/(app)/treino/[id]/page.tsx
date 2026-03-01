"use client"

import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Clock, Dumbbell, Play, CheckCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ExerciseCard } from '@/components/treino/exercise-card'
import { useWorkouts } from '@/hooks/use-workouts'
import { useExerciseHistory } from '@/hooks/use-exercise-history'
import { formatDuration } from '@/lib/utils/format'
import { cn } from '@/lib/utils'

const typeLabels: Record<string, { label: string; color: string; bg: string }> = {
  tradicional: { label: 'Tradicional', color: 'text-dourado', bg: 'bg-dourado/20' },
  circuito: { label: 'Circuito', color: 'text-dourado', bg: 'bg-dourado/20' },
  hiit: { label: 'HIIT', color: 'text-red-400', bg: 'bg-red-500/20' },
  mobilidade: { label: 'Mobilidade', color: 'text-emerald-400', bg: 'bg-emerald-500/20' }
}

const phaseLabels: Record<string, string> = {
  base: 'Fase Base',
  construcao: 'Fase Construção',
  pico: 'Fase Pico'
}

export default function WorkoutDetailPage() {
  const params = useParams()
  const router = useRouter()
  const workoutId = params.id as string

  const { getWorkoutById, loading } = useWorkouts()
  const workout = getWorkoutById(workoutId)

  // Histórico de pesos para mostrar últimas cargas
  const { getLastWeight } = useExerciseHistory()

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
          <p className="text-foreground-secondary mb-4">Não conseguimos encontrar este treino</p>
          <Button onClick={() => router.back()}>Voltar</Button>
        </div>
      </div>
    )
  }

  const typeInfo = typeLabels[workout.tipo] || typeLabels.tradicional
  const isCompleted = workout.status === 'concluido'

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="relative">
        {/* Background gradient */}
        <div className={cn(
          'absolute inset-0 h-48',
          isCompleted
            ? 'bg-gradient-to-b from-emerald-500/20 to-transparent'
            : 'bg-gradient-to-b from-dourado/20 to-transparent'
        )} />

        {/* Content */}
        <div className="relative px-4 pt-12">
          {/* Back button */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-foreground-secondary hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Voltar</span>
          </button>

          {/* Workout info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-2 mb-2">
              {isCompleted && <CheckCircle className="w-5 h-5 text-emerald-400" />}
              <span className={cn('text-sm font-medium uppercase', typeInfo.color)}>
                {typeInfo.label}
              </span>
              {workout.fase && (
                <>
                  <span className="text-foreground-muted">•</span>
                  <span className="text-xs text-foreground-muted">
                    {phaseLabels[workout.fase]}
                  </span>
                </>
              )}
            </div>

            <h1 className="text-3xl font-bold text-foreground mb-4">
              {workout.nome}
            </h1>

            {/* Stats */}
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-foreground-muted" />
                <span className="text-foreground-secondary">
                  {isCompleted && workout.duracao_real
                    ? `${formatDuration(workout.duracao_real)} (${formatDuration(workout.duracao_estimada)} estimado)`
                    : `~${formatDuration(workout.duracao_estimada)}`
                  }
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Dumbbell className="w-4 h-4 text-foreground-muted" />
                <span className="text-foreground-secondary">
                  {workout.exercicios.length} exercícios
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Exercises list */}
      <div className="px-4 mt-8">
        <h2 className="text-lg font-semibold text-foreground mb-4">Exercícios</h2>
        <div className="space-y-3">
          {workout.exercicios.map((exercise, index) => {
            const isSuperset = exercise.is_superset
            const supersetPartner = isSuperset
              ? workout.exercicios.find(e => e.is_superset && e.id !== exercise.id && Math.abs(e.ordem - exercise.ordem) === 1)
              : undefined

            return (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                index={index}
                isSuperset={isSuperset}
                supersetPartner={supersetPartner}
                lastWeight={getLastWeight(exercise.nome)}
              />
            )
          })}
        </div>
      </div>

      {/* Action button - positioned above bottom nav */}
      <div className="fixed bottom-20 left-0 right-0 p-4 z-40 bg-gradient-to-t from-background via-background/90 to-transparent pt-8">
        <div className="max-w-lg mx-auto">
          {isCompleted ? (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-center">
              <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-emerald-400 font-medium">Treino concluído!</p>
              <p className="text-sm text-foreground-secondary mt-1">
                Duração: {workout.duracao_real ? formatDuration(workout.duracao_real) : '-'}
              </p>
            </div>
          ) : (
            <Link href={`/treino/${workout.id}/executar`}>
              <Button
                variant="gradient"
                size="lg"
                className="w-full gap-2"
              >
                <Play className="w-5 h-5" />
                Iniciar Treino
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
