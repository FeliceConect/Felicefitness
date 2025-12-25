"use client"

import { motion } from 'framer-motion'
import { ProgressRing } from '@/components/shared'
import { calculateDailyScore, type DailyScoreData } from '@/lib/utils/calculations'
import { cn } from '@/lib/utils'

interface DailyScoreProps {
  data: DailyScoreData
}

export function DailyScore({ data }: DailyScoreProps) {
  const score = calculateDailyScore(data)

  const getScoreColor = () => {
    if (score >= 90) return '#06B6D4'  // Cyan
    if (score >= 70) return '#10B981'  // Verde
    if (score >= 50) return '#F59E0B'  // Amarelo
    return '#EF4444'                    // Vermelho
  }

  const getScoreLabel = () => {
    if (score >= 90) return 'Excelente!'
    if (score >= 70) return 'Muito bom'
    if (score >= 50) return 'Bom'
    return 'Pode melhorar'
  }

  const items = [
    { key: 'treino', label: 'Treino', done: data.treinoConcluido },
    { key: 'alimentacao', label: 'Alimentação', done: data.alimentacaoPercent >= 0.8 },
    { key: 'agua', label: 'Água', done: data.aguaPercent >= 0.8, percent: data.aguaPercent },
    { key: 'sono', label: 'Sono', done: data.sonoRegistrado }
  ]

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: 0.15 }}
      className="flex-1 bg-[#14141F] border border-[#2E2E3E] rounded-2xl p-4"
    >
      <div className="flex items-center gap-3">
        <ProgressRing
          progress={score / 100}
          size={56}
          strokeWidth={5}
          color={getScoreColor()}
        >
          <span className="text-lg font-bold text-white">{score}</span>
        </ProgressRing>
        <div className="flex-1">
          <p className="text-sm font-medium text-white">{getScoreLabel()}</p>
          <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-1">
            {items.map((item) => (
              <span
                key={item.key}
                className={cn(
                  'text-xs',
                  item.done ? 'text-emerald-400' : 'text-slate-500'
                )}
              >
                {item.done ? '✓' : '○'} {item.label}
                {item.percent !== undefined && !item.done && (
                  <span className="text-amber-400 ml-0.5">
                    ({Math.round(item.percent * 100)}%)
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
