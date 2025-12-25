"use client"

import { motion } from 'framer-motion'
import { Info } from 'lucide-react'
import Link from 'next/link'
import type { WorkoutExercise } from '@/lib/workout/types'
import { getExerciseLastWeight } from '@/lib/workout/mock-data'
import { cn } from '@/lib/utils'

interface ExerciseCardProps {
  exercise: WorkoutExercise
  index: number
  isSuperset?: boolean
  supersetPartner?: WorkoutExercise
}

export function ExerciseCard({ exercise, index, isSuperset, supersetPartner }: ExerciseCardProps) {
  const lastWeight = getExerciseLastWeight(exercise.exercise_id)
  const totalSets = exercise.series.length
  const targetReps = exercise.series[0]?.repeticoes_planejadas || '12'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        'bg-[#14141F] border border-[#2E2E3E] rounded-xl overflow-hidden',
        isSuperset && 'border-l-2 border-l-amber-500'
      )}
    >
      {/* Superset indicator */}
      {isSuperset && (
        <div className="bg-amber-500/10 px-4 py-1.5 flex items-center gap-2">
          <span className="text-xs font-medium text-amber-400">SUPERSET</span>
          {supersetPartner && (
            <span className="text-xs text-slate-400">com {supersetPartner.nome}</span>
          )}
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            {/* Order number */}
            <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-violet-400">{exercise.ordem}</span>
            </div>

            {/* Exercise info */}
            <div className="flex-1">
              <h3 className="text-white font-medium mb-1">{exercise.nome}</h3>
              <div className="flex items-center gap-3 text-sm text-slate-400">
                <span>{totalSets} séries</span>
                <span>•</span>
                <span>{targetReps} reps</span>
                {lastWeight && (
                  <>
                    <span>•</span>
                    <span className="text-violet-400">{lastWeight.weight}kg</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Action */}
          <Link
            href={`/treino/exercicio/${exercise.exercise_id}`}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Info className="w-5 h-5 text-slate-500" />
          </Link>
        </div>

        {/* Series preview */}
        <div className="mt-4 flex gap-2">
          {exercise.series.map((set) => (
            <div
              key={set.id}
              className={cn(
                'flex-1 py-2 rounded-lg text-center text-sm',
                set.status === 'concluido'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-slate-800 text-slate-400'
              )}
            >
              <div className="font-medium">
                {set.carga_planejada ? `${set.carga_planejada}kg` : '-'}
              </div>
              <div className="text-xs opacity-70">
                {set.repeticoes_planejadas}
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
