"use client"

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Check, Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { WorkoutExercise } from '@/lib/workout/types'

export interface CircuitRoundEntry {
  exerciseId: string
  reps: number
  weight: number
}

interface CircuitRoundInputModalProps {
  isOpen: boolean
  members: WorkoutExercise[]
  /** Rodada atual (1-indexed). */
  roundNumber: number
  /** Total de rodadas do circuito. */
  totalRounds: number
  /** Última carga/reps de cada exercício, indexada por exerciseId. */
  lastWeights: Record<string, { weight: number; reps: number } | null>
  onComplete: (entries: CircuitRoundEntry[]) => void
  onCancel: () => void
}

/**
 * Modal para registrar uma rodada inteira de um circuito de uma vez.
 * Lista todos os membros do circuito com inputs compactos de peso e
 * repetições para cada um — paciente confirma a rodada toda no final.
 */
export function CircuitRoundInputModal({
  isOpen,
  members,
  roundNumber,
  totalRounds,
  lastWeights,
  onComplete,
  onCancel,
}: CircuitRoundInputModalProps) {
  // Inicializa entries com sugestão = última carga/reps (ou planejado)
  const buildInitialEntries = (): CircuitRoundEntry[] =>
    members.map(m => {
      const last = lastWeights[m.id]
      const targetSet = m.series[roundNumber - 1] ?? m.series[0]
      const plannedReps = parseInt(targetSet?.repeticoes_planejadas || '12', 10) || 12
      const plannedWeight = targetSet?.carga_planejada ?? 0
      return {
        exerciseId: m.id,
        reps: last?.reps ?? plannedReps,
        weight: last?.weight ?? plannedWeight,
      }
    })

  const [entries, setEntries] = useState<CircuitRoundEntry[]>(buildInitialEntries)
  const wasOpenRef = useRef(false)

  // Reset quando o modal abre (novo round)
  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      setEntries(buildInitialEntries())
    }
    wasOpenRef.current = isOpen
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, roundNumber])

  if (!isOpen) return null

  const updateEntry = (idx: number, patch: Partial<CircuitRoundEntry>) => {
    setEntries(prev => prev.map((e, i) => (i === idx ? { ...e, ...patch } : e)))
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center"
          onClick={onCancel}
        >
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="w-full max-w-md bg-background border-t sm:border border-vinho/30 rounded-t-3xl sm:rounded-3xl flex flex-col max-h-[90vh]"
            style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom, 0px))' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-vinho/20">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-vinho">
                  🔗 Rodada {roundNumber} de {totalRounds}
                </p>
                <h3 className="text-base font-medium text-foreground mt-0.5">
                  Registrar a rodada inteira
                </h3>
              </div>
              <button
                onClick={onCancel}
                className="p-1.5 rounded-lg hover:bg-background-elevated text-foreground-secondary"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Lista compacta de exercícios com inputs */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {members.map((m, idx) => {
                const last = lastWeights[m.id]
                const isTime = m.series[roundNumber - 1]?.set_type === 'time' || m.series[0]?.set_type === 'time'
                return (
                  <div
                    key={m.id}
                    className="bg-white border border-border rounded-xl p-3"
                  >
                    <p className="text-sm font-medium text-foreground mb-2 truncate">
                      {m.nome}
                    </p>

                    {last && (
                      <p className="text-[11px] text-foreground-secondary mb-2">
                        Última: <span className="font-semibold text-foreground">{last.weight}kg × {last.reps}{isTime ? 's' : ''}</span>
                      </p>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      {/* Carga */}
                      <div>
                        <label className="text-[10px] uppercase tracking-wider text-foreground-secondary block mb-1">
                          Carga (kg)
                        </label>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => updateEntry(idx, { weight: Math.max(0, entries[idx].weight - 1) })}
                            className="w-8 h-8 rounded-lg bg-background-elevated text-foreground-secondary flex items-center justify-center hover:bg-border"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <input
                            type="number"
                            inputMode="decimal"
                            min="0"
                            step="0.5"
                            value={entries[idx].weight}
                            onChange={e =>
                              updateEntry(idx, { weight: Math.max(0, parseFloat(e.target.value) || 0) })
                            }
                            className="flex-1 text-center text-base font-bold text-foreground bg-background-elevated rounded-lg py-1.5 border border-border focus:outline-none focus:border-dourado"
                          />
                          <button
                            type="button"
                            onClick={() => updateEntry(idx, { weight: entries[idx].weight + 1 })}
                            className="w-8 h-8 rounded-lg bg-background-elevated text-foreground-secondary flex items-center justify-center hover:bg-border"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Reps ou segundos */}
                      <div>
                        <label className="text-[10px] uppercase tracking-wider text-foreground-secondary block mb-1">
                          {isTime ? 'Segundos' : 'Reps'}
                        </label>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => updateEntry(idx, { reps: Math.max(0, entries[idx].reps - 1) })}
                            className="w-8 h-8 rounded-lg bg-background-elevated text-foreground-secondary flex items-center justify-center hover:bg-border"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <input
                            type="number"
                            inputMode="numeric"
                            min="0"
                            value={entries[idx].reps}
                            onChange={e =>
                              updateEntry(idx, { reps: Math.max(0, parseInt(e.target.value) || 0) })
                            }
                            className="flex-1 text-center text-base font-bold text-foreground bg-background-elevated rounded-lg py-1.5 border border-border focus:outline-none focus:border-dourado"
                          />
                          <button
                            type="button"
                            onClick={() => updateEntry(idx, { reps: entries[idx].reps + 1 })}
                            className="w-8 h-8 rounded-lg bg-background-elevated text-foreground-secondary flex items-center justify-center hover:bg-border"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Footer */}
            <div className="px-4 pt-2 pb-3 border-t border-border">
              <Button
                variant="gradient"
                size="lg"
                className={cn('w-full', 'bg-gradient-to-r from-vinho to-vinho/80')}
                onClick={() => onComplete(entries)}
              >
                <Check className="w-5 h-5 mr-2" />
                Concluir Rodada {roundNumber}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
