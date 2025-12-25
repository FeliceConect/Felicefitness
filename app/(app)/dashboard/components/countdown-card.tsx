"use client"

import { motion } from 'framer-motion'
import { getDaysUntil, formatDatePtBr } from '@/lib/utils/date'
import { ProgressBar } from '@/components/shared'

interface CountdownCardProps {
  meta: {
    titulo: string
    data: Date
    icone: string
    dataInicio?: Date // Data de início para calcular progresso
  }
}

export function CountdownCard({ meta }: CountdownCardProps) {
  const daysRemaining = getDaysUntil(meta.data)
  const formattedDate = formatDatePtBr(meta.data)

  // Calcular progresso (se tiver data de início)
  let progress = 0
  if (meta.dataInicio) {
    const totalDays = getDaysUntil(meta.data) + Math.abs(getDaysUntil(meta.dataInicio))
    const daysElapsed = Math.abs(getDaysUntil(meta.dataInicio))
    progress = totalDays > 0 ? daysElapsed / totalDays : 0
  }

  const isClose = daysRemaining <= 30
  const isVeryClose = daysRemaining <= 7

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.5 }}
      className="bg-gradient-to-br from-violet-500/10 via-[#14141F] to-cyan-500/5 border border-violet-500/20 rounded-2xl p-5"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">{meta.icone}</span>
        <h3 className="text-sm font-semibold text-violet-400 uppercase tracking-wide">
          {meta.titulo}
        </h3>
      </div>

      {/* Countdown Number */}
      <div className="text-center mb-4">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6, type: "spring" }}
          className="relative inline-block"
        >
          <span className="text-5xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
            {daysRemaining}
          </span>
          <span className="text-lg text-slate-400 ml-2">
            {daysRemaining === 1 ? 'dia' : 'dias'}
          </span>
        </motion.div>
      </div>

      {/* Date */}
      <p className="text-center text-sm text-slate-400 mb-4 capitalize">
        {formattedDate}
      </p>

      {/* Progress Bar */}
      {meta.dataInicio && (
        <div className="mt-2">
          <ProgressBar
            progress={progress}
            height={4}
            color="#8B5CF6"
            bgColor="#2E2E3E"
          />
          <p className="text-xs text-slate-500 text-center mt-2">
            {Math.round(progress * 100)}% do tempo
          </p>
        </div>
      )}

      {/* Urgency Messages */}
      {isVeryClose && (
        <motion.p
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="text-center text-xs text-amber-400 mt-3"
        >
          Faltam poucos dias! Foco total!
        </motion.p>
      )}
      {isClose && !isVeryClose && (
        <p className="text-center text-xs text-violet-400 mt-3">
          A meta está próxima!
        </p>
      )}
    </motion.div>
  )
}
