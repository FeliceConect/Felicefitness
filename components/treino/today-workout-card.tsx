"use client"

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { formatDuration } from '@/lib/utils/format'
import type { Workout } from '@/lib/workout/types'
import { cn } from '@/lib/utils'

interface TodayWorkoutCardProps {
  workout: Workout | null
  isRest?: boolean
  specialActivity?: {
    name: string
    icon: string
  }
}

const typeLabels: Record<string, { label: string; color: string }> = {
  tradicional: { label: 'Tradicional', color: 'text-violet-400' },
  circuito: { label: 'Circuito', color: 'text-cyan-400' },
  hiit: { label: 'HIIT', color: 'text-red-400' },
  mobilidade: { label: 'Mobilidade', color: 'text-emerald-400' }
}

const phaseLabels: Record<string, string> = {
  base: 'Fase Base',
  construcao: 'Fase Construção',
  pico: 'Fase Pico'
}

export function TodayWorkoutCard({ workout, isRest, specialActivity }: TodayWorkoutCardProps) {
  const router = useRouter()

  // Dia de descanso
  if (isRest) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-2xl p-6"
      >
        <div className="text-center">
          <span className="text-4xl mb-4 block">😴</span>
          <h3 className="text-xl font-bold text-white mb-2">Dia de Descanso</h3>
          <p className="text-slate-400 text-sm">
            Recupere-se para voltar mais forte!
          </p>
        </div>
      </motion.div>
    )
  }

  // Atividade especial (Beach Tennis, etc)
  if (specialActivity) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-cyan-500/10 to-emerald-500/5 border border-cyan-500/20 rounded-2xl p-6"
      >
        <div className="text-center">
          <span className="text-4xl mb-4 block">{specialActivity.icon}</span>
          <h3 className="text-xl font-bold text-white mb-2">{specialActivity.name}</h3>
          <p className="text-slate-400 text-sm">
            Aproveite sua atividade!
          </p>
        </div>
      </motion.div>
    )
  }

  // Sem treino
  if (!workout) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#14141F] border border-[#2E2E3E] rounded-2xl p-6"
      >
        <div className="text-center">
          <span className="text-4xl mb-4 block">📋</span>
          <h3 className="text-xl font-bold text-white mb-2">Nenhum treino hoje</h3>
          <p className="text-slate-400 text-sm mb-4">
            Configure seus templates de treino para ver os treinos do dia
          </p>
          <Button
            variant="gradient"
            size="sm"
            onClick={() => router.push('/treino/templates')}
          >
            Gerenciar Treinos
          </Button>
        </div>
      </motion.div>
    )
  }

  const typeInfo = typeLabels[workout.tipo] || typeLabels.tradicional
  const exerciseCount = workout.exercicios.length

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'border rounded-2xl p-6',
        workout.status === 'concluido'
          ? 'bg-gradient-to-br from-emerald-500/10 to-cyan-500/5 border-emerald-500/30'
          : 'bg-gradient-to-br from-violet-500/10 to-cyan-500/5 border-violet-500/30'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">
              {workout.status === 'concluido' ? '✅' : '🏋️'}
            </span>
            <span className={cn('text-xs font-medium uppercase', typeInfo.color)}>
              {typeInfo.label}
            </span>
          </div>
          <h3 className="text-xl font-bold text-white">
            {workout.nome}
          </h3>
        </div>
        {workout.fase && (
          <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded-full">
            {phaseLabels[workout.fase]}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex items-center gap-4 text-sm text-slate-400 mb-6">
        <span>⏱️ ~{formatDuration(workout.duracao_estimada)}</span>
        <span>•</span>
        <span>{exerciseCount} exercícios</span>
      </div>

      {/* Ação */}
      {workout.status === 'concluido' ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Duração real:</span>
            <span className="text-white font-medium">
              {workout.duracao_real ? formatDuration(workout.duracao_real) : '-'}
            </span>
          </div>
          <Button
            variant="ghost"
            className="w-full text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
            onClick={() => router.push(`/treino/${workout.id}`)}
          >
            Ver detalhes
          </Button>
        </div>
      ) : (
        <Button
          variant="gradient"
          className="w-full"
          onClick={() => router.push(`/treino/${workout.id}`)}
        >
          Ver Treino
        </Button>
      )}
    </motion.div>
  )
}
