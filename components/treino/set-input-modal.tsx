"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Minus, Plus, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SetInputModalProps {
  isOpen: boolean
  exerciseName: string
  setNumber: number
  targetReps: string
  suggestedWeight?: number
  lastWeight?: { weight: number; reps: number } | null
  onComplete: (data: { reps: number; weight: number }) => void
  onCancel: () => void
}

export function SetInputModal({
  isOpen,
  exerciseName,
  setNumber,
  targetReps,
  suggestedWeight,
  lastWeight,
  onComplete,
  onCancel
}: SetInputModalProps) {
  const [weight, setWeight] = useState(suggestedWeight || lastWeight?.weight || 0)
  const [reps, setReps] = useState(parseInt(targetReps) || 12)

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setWeight(suggestedWeight || lastWeight?.weight || 0)
      setReps(parseInt(targetReps) || 12)
    }
  }, [isOpen, suggestedWeight, lastWeight, targetReps])

  const adjustWeight = (delta: number) => {
    setWeight(prev => Math.max(0, prev + delta))
  }

  const adjustReps = (delta: number) => {
    setReps(prev => Math.max(1, prev + delta))
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-md bg-[#14141F] rounded-2xl flex flex-col max-h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 pb-2">
              <div>
                <p className="text-slate-400 text-sm">Série {setNumber}</p>
                <h3 className="text-lg font-bold text-white">{exerciseName}</h3>
              </div>
              <button
                onClick={onCancel}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-4">
              {/* Last performance hint */}
              {lastWeight && (
                <div className="bg-slate-800/50 rounded-lg p-2 mb-3 text-center">
                  <p className="text-sm text-slate-400">
                    Última vez: <span className="text-white font-medium">{lastWeight.weight}kg × {lastWeight.reps}</span>
                  </p>
                </div>
              )}

              {/* Weight input */}
              <div className="mb-3">
                <label className="text-sm text-slate-400 block mb-2">Carga (kg)</label>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => adjustWeight(-2.5)}
                    className="w-11 h-11 rounded-xl bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition-colors"
                  >
                    <Minus className="w-5 h-5 text-white" />
                  </button>
                  <div className="w-24 text-center">
                    <motion.span
                      key={weight}
                      initial={{ scale: 1.2, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-3xl font-bold text-white"
                    >
                      {weight}
                    </motion.span>
                    <span className="text-base text-slate-400 ml-1">kg</span>
                  </div>
                  <button
                    onClick={() => adjustWeight(2.5)}
                    className="w-11 h-11 rounded-xl bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition-colors"
                  >
                    <Plus className="w-5 h-5 text-white" />
                  </button>
                </div>
                {/* Quick weight buttons */}
                <div className="flex justify-center gap-2 mt-2">
                  {[5, 10, 20].map(w => (
                    <button
                      key={w}
                      onClick={() => setWeight(w)}
                      className={cn(
                        'px-3 py-1 rounded-lg text-sm font-medium transition-colors',
                        weight === w
                          ? 'bg-violet-500 text-white'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      )}
                    >
                      {w}kg
                    </button>
                  ))}
                </div>
              </div>

              {/* Reps input */}
              <div className="mb-2">
                <label className="text-sm text-slate-400 block mb-2">Repetições</label>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => adjustReps(-1)}
                    className="w-11 h-11 rounded-xl bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition-colors"
                  >
                    <Minus className="w-5 h-5 text-white" />
                  </button>
                  <div className="w-24 text-center">
                    <motion.span
                      key={reps}
                      initial={{ scale: 1.2, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-3xl font-bold text-white"
                    >
                      {reps}
                    </motion.span>
                    <span className="text-base text-slate-400 ml-1">reps</span>
                  </div>
                  <button
                    onClick={() => adjustReps(1)}
                    className="w-11 h-11 rounded-xl bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition-colors"
                  >
                    <Plus className="w-5 h-5 text-white" />
                  </button>
                </div>
                {/* Target hint */}
                <p className="text-center text-xs text-slate-500 mt-1">
                  Meta: {targetReps} reps
                </p>
              </div>
            </div>

            {/* Actions - Fixed at bottom */}
            <div className="flex gap-3 p-4 pt-3 border-t border-slate-800">
              <Button
                variant="outline"
                size="default"
                className="flex-1"
                onClick={onCancel}
              >
                Cancelar
              </Button>
              <Button
                variant="gradient"
                size="default"
                className="flex-1 gap-2"
                onClick={() => onComplete({ reps, weight })}
              >
                <Check className="w-4 h-4" />
                Concluir
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
