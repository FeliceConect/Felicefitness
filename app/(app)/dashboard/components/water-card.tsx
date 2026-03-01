"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { ProgressRing } from '@/components/shared'
import { formatWater } from '@/lib/utils/format'
import { getProgressColor } from '@/lib/utils/calculations'
import { cn } from '@/lib/utils'

interface WaterCardProps {
  currentMl: number
  goalMl: number
  onAddWater: (ml: number) => Promise<boolean>
  isAdding?: boolean
}

const quickAddOptions = [
  { ml: 200, label: '200ml', icon: '💧' },
  { ml: 300, label: '300ml', icon: '💧' },
  { ml: 500, label: '500ml', icon: '🍶' },
]

export function WaterCard({ currentMl, goalMl, onAddWater, isAdding = false }: WaterCardProps) {
  const router = useRouter()
  const [animatingAdd, setAnimatingAdd] = useState<number | null>(null)
  const [optimisticTotal, setOptimisticTotal] = useState(currentMl)

  const progress = optimisticTotal / goalMl
  const progressColor = getProgressColor(progress)
  const isComplete = progress >= 1

  const handleAddWater = async (ml: number, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (isAdding) return

    // Optimistic update
    setAnimatingAdd(ml)
    setOptimisticTotal(prev => prev + ml)

    const success = await onAddWater(ml)

    if (!success) {
      // Rollback on failure
      setOptimisticTotal(prev => prev - ml)
    }

    setTimeout(() => setAnimatingAdd(null), 300)
  }

  // Sincronizar com prop quando mudar
  if (currentMl !== optimisticTotal && !isAdding && animatingAdd === null) {
    setOptimisticTotal(currentMl)
  }

  const handleCardClick = () => {
    router.push('/agua')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className={cn(
        'bg-white border rounded-2xl p-4 transition-all shadow-sm',
        isComplete
          ? 'border-success/40 bg-gradient-to-br from-emerald-50 to-white'
          : 'border-border'
      )}
    >
        {/* Header - Clicável para abrir página de hidratação */}
        <button
          onClick={handleCardClick}
          className="flex items-center justify-between mb-3 w-full hover:opacity-80 transition-opacity"
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">💧</span>
            <h3 className="text-sm font-semibold text-foreground-secondary uppercase tracking-wide">
              Água
            </h3>
          </div>
          <ChevronRight className="w-4 h-4 text-foreground-muted" />
        </button>

        {/* Progress Ring */}
        <div className="flex justify-center mb-4">
          <ProgressRing
            progress={progress}
            size={100}
            strokeWidth={8}
            color={progressColor}
          >
            <div className="text-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={optimisticTotal}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                >
                  <span className="text-xl font-bold text-foreground">
                    {formatWater(optimisticTotal)}
                  </span>
                </motion.div>
              </AnimatePresence>
              <p className="text-xs text-foreground-muted">
                de {formatWater(goalMl)}
              </p>
            </div>
          </ProgressRing>
        </div>

        {/* Quick Add Buttons */}
        <div className="flex gap-2">
          {quickAddOptions.map((option) => (
            <motion.button
              key={option.ml}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => handleAddWater(option.ml, e)}
              disabled={isAdding}
              className={cn(
                'flex-1 flex flex-col items-center justify-center',
                'bg-background hover:bg-background-elevated rounded-xl py-2 px-1',
                'border border-transparent hover:border-dourado/30',
                'transition-colors duration-200',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                animatingAdd === option.ml && 'bg-dourado/10 border-dourado/40'
              )}
            >
              <span className="text-base mb-0.5">{option.icon}</span>
              <span className="text-xs text-foreground-secondary">+{option.label}</span>
            </motion.button>
          ))}
        </div>

        {/* Completion message */}
        {isComplete && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-xs text-success mt-3"
          >
            Meta atingida! 🎉
          </motion.p>
        )}
      </motion.div>
  )
}
