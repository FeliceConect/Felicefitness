"use client"

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { formatDuration } from '@/lib/utils/format'
import type { TodayWorkout } from '@/hooks/use-dashboard-data'

interface WorkoutCardProps {
  workout: TodayWorkout | null
  onStartWorkout?: () => void
}

export function WorkoutCard({ workout, onStartWorkout }: WorkoutCardProps) {
  const router = useRouter()

  const handleStartWorkout = () => {
    if (onStartWorkout) {
      onStartWorkout()
    } else if (workout) {
      router.push(`/treino/${workout.id}`)
    }
  }

  const handleViewDetails = () => {
    if (workout) {
      router.push(`/treino/${workout.id}/detalhes`)
    }
  }

  // Dia de descanso
  if (!workout) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="bg-gradient-to-br from-emerald-500/10 to-cyan-500/5 border border-emerald-500/20 rounded-2xl p-5"
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">😴</span>
          <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wide">
            Dia de Descanso
          </h3>
        </div>
        <p className="text-white text-lg font-medium mb-2">
          Hoje é dia de recuperar!
        </p>
        <p className="text-slate-400 text-sm">
          Descanse bem para voltar mais forte amanhã.
        </p>
      </motion.div>
    )
  }

  // Treino concluído
  if (workout.status === 'concluido') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="bg-gradient-to-br from-emerald-500/10 to-cyan-500/5 border border-emerald-500/30 rounded-2xl p-5"
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">✅</span>
          <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wide">
            Treino Concluído
          </h3>
        </div>

        <h4 className="text-white text-xl font-bold mb-2">
          {workout.nome}
        </h4>

        <div className="flex items-center gap-4 text-sm text-slate-300 mb-4">
          <span className="flex items-center gap-1">
            ✓ {workout.duracao_minutos || workout.duracao_estimada} min
          </span>
          <span>•</span>
          <span>{workout.exercicios_count}/{workout.exercicios_count} exercícios</span>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleViewDetails}
          className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 p-0"
        >
          Ver detalhes
        </Button>
      </motion.div>
    )
  }

  // Treino em andamento
  if (workout.status === 'em_andamento') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="bg-gradient-to-br from-violet-500/10 to-cyan-500/5 border border-violet-500/30 rounded-2xl p-5"
      >
        <div className="flex items-center gap-2 mb-3">
          <motion.span
            className="text-xl"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            🏋️
          </motion.span>
          <h3 className="text-sm font-semibold text-violet-400 uppercase tracking-wide">
            Treino em Andamento
          </h3>
        </div>

        <h4 className="text-white text-xl font-bold mb-2">
          {workout.nome}
        </h4>

        <div className="flex items-center gap-4 text-sm text-slate-400 mb-4">
          <span>⏱️ ~{formatDuration(workout.duracao_estimada)}</span>
          <span>•</span>
          <span>{workout.exercicios_count} exercícios</span>
        </div>

        <Button
          variant="gradient"
          className="w-full"
          onClick={handleStartWorkout}
        >
          Continuar Treino
        </Button>
      </motion.div>
    )
  }

  // Treino pendente
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="bg-[#14141F] border border-[#2E2E3E] rounded-2xl p-5"
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">🏋️</span>
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">
          Treino de Hoje
        </h3>
      </div>

      <h4 className="text-white text-xl font-bold mb-2">
        {workout.nome}
      </h4>

      <div className="flex items-center gap-4 text-sm text-slate-400 mb-4">
        <span>⏱️ ~{formatDuration(workout.duracao_estimada)}</span>
        <span>•</span>
        <span>{workout.exercicios_count} exercícios</span>
      </div>

      <Button
        variant="gradient"
        className="w-full"
        onClick={handleStartWorkout}
      >
        Iniciar Treino
      </Button>
    </motion.div>
  )
}
