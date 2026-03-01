"use client"

import { useState, useEffect, useRef } from 'react'
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
  // Prioridade: último peso usado > peso sugerido do template > 0
  const initialWeight = lastWeight?.weight ?? suggestedWeight ?? 0
  const [weight, setWeight] = useState(initialWeight)
  const [reps, setReps] = useState(parseInt(targetReps) || 12)

  // Track if modal was previously open to only reset on actual open
  const wasOpenRef = useRef(false)

  // Reset ONLY when modal actually opens (not on every prop change)
  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      // Modal is opening - reset values
      setWeight(lastWeight?.weight ?? suggestedWeight ?? 0)
      setReps(parseInt(targetReps) || 12)
    }
    wasOpenRef.current = isOpen
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
            className="w-full max-w-md bg-white rounded-2xl flex flex-col max-h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 pb-2">
              <div>
                <p className="text-foreground-secondary text-sm">Série {setNumber}</p>
                <h3 className="text-lg font-bold text-foreground">{exerciseName}</h3>
              </div>
              <button
                type="button"
                onClick={onCancel}
                onTouchEnd={(e) => { e.preventDefault(); onCancel(); }}
                className="p-2 hover:bg-background-elevated active:bg-border rounded-lg transition-colors touch-manipulation"
              >
                <X className="w-5 h-5 text-foreground-secondary" />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-4">
              {/* Last performance hint */}
              {lastWeight && (
                <div className="bg-background-elevated/50 rounded-lg p-2 mb-3 text-center">
                  <p className="text-sm text-foreground-secondary">
                    Última vez: <span className="text-foreground font-medium">{lastWeight.weight}kg × {lastWeight.reps}</span>
                  </p>
                </div>
              )}

              {/* Weight input */}
              <div className="mb-3">
                <label className="text-sm text-foreground-secondary block mb-2">Carga (kg)</label>
                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => adjustWeight(-2.5)}
                    onTouchEnd={(e) => { e.preventDefault(); adjustWeight(-2.5); }}
                    className="w-14 h-14 rounded-xl bg-background-elevated flex items-center justify-center hover:bg-border active:bg-border transition-colors touch-manipulation select-none"
                  >
                    <Minus className="w-6 h-6 text-foreground" />
                  </button>
                  <div className="w-28 text-center">
                    <motion.span
                      key={weight}
                      initial={{ scale: 1.2, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-4xl font-bold text-foreground"
                    >
                      {weight}
                    </motion.span>
                    <span className="text-lg text-foreground-secondary ml-1">kg</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => adjustWeight(2.5)}
                    onTouchEnd={(e) => { e.preventDefault(); adjustWeight(2.5); }}
                    className="w-14 h-14 rounded-xl bg-background-elevated flex items-center justify-center hover:bg-border active:bg-border transition-colors touch-manipulation select-none"
                  >
                    <Plus className="w-6 h-6 text-foreground" />
                  </button>
                </div>
                {/* Quick weight buttons */}
                <div className="flex justify-center gap-2 mt-3">
                  {[5, 10, 20, 30, 40].map(w => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setWeight(w)}
                      onTouchEnd={(e) => { e.preventDefault(); setWeight(w); }}
                      className={cn(
                        'px-3 py-2 rounded-lg text-sm font-medium transition-colors touch-manipulation select-none',
                        weight === w
                          ? 'bg-dourado text-white'
                          : 'bg-background-elevated text-foreground-secondary hover:bg-border active:bg-border'
                      )}
                    >
                      {w}kg
                    </button>
                  ))}
                </div>
              </div>

              {/* Reps input */}
              <div className="mb-2">
                <label className="text-sm text-foreground-secondary block mb-2">Repetições</label>
                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => adjustReps(-1)}
                    onTouchEnd={(e) => { e.preventDefault(); adjustReps(-1); }}
                    className="w-14 h-14 rounded-xl bg-background-elevated flex items-center justify-center hover:bg-border active:bg-border transition-colors touch-manipulation select-none"
                  >
                    <Minus className="w-6 h-6 text-foreground" />
                  </button>
                  <div className="w-28 text-center">
                    <motion.span
                      key={reps}
                      initial={{ scale: 1.2, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-4xl font-bold text-foreground"
                    >
                      {reps}
                    </motion.span>
                    <span className="text-lg text-foreground-secondary ml-1">reps</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => adjustReps(1)}
                    onTouchEnd={(e) => { e.preventDefault(); adjustReps(1); }}
                    className="w-14 h-14 rounded-xl bg-background-elevated flex items-center justify-center hover:bg-border active:bg-border transition-colors touch-manipulation select-none"
                  >
                    <Plus className="w-6 h-6 text-foreground" />
                  </button>
                </div>
                {/* Quick reps buttons */}
                <div className="flex justify-center gap-2 mt-3">
                  {[8, 10, 12, 15, 20].map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setReps(r)}
                      onTouchEnd={(e) => { e.preventDefault(); setReps(r); }}
                      className={cn(
                        'px-3 py-2 rounded-lg text-sm font-medium transition-colors touch-manipulation select-none',
                        reps === r
                          ? 'bg-dourado text-white'
                          : 'bg-background-elevated text-foreground-secondary hover:bg-border active:bg-border'
                      )}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                {/* Target hint */}
                <p className="text-center text-xs text-foreground-muted mt-2">
                  Meta: {targetReps} reps
                </p>
              </div>
            </div>

            {/* Actions - Fixed at bottom */}
            <div className="flex gap-3 p-4 pt-3 border-t border-border">
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
