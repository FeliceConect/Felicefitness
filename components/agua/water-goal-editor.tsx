"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Check, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatWaterAmount, calculateIdealWaterIntake } from '@/lib/water/calculations'
import { cn } from '@/lib/utils'

interface WaterGoalEditorProps {
  isOpen: boolean
  currentGoal: number
  onClose: () => void
  onSave: (goal: number) => void
}

const presetGoals = [2000, 2500, 3000, 3500, 4000]

export function WaterGoalEditor({
  isOpen,
  currentGoal,
  onClose,
  onSave
}: WaterGoalEditorProps) {
  const [goal, setGoal] = useState(currentGoal)
  const [weight, setWeight] = useState<number | null>(null)

  const handlePresetSelect = (value: number) => {
    setGoal(value)
    setWeight(null)
  }

  const handleWeightChange = (value: string) => {
    const w = parseInt(value)
    if (w && w > 0 && w < 300) {
      setWeight(w)
      setGoal(calculateIdealWaterIntake(w))
    } else {
      setWeight(null)
    }
  }

  const handleSave = () => {
    if (goal >= 1000 && goal <= 5000) {
      onSave(goal)
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 z-50 flex items-end justify-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-[#14141F] rounded-t-3xl p-6 max-h-[85vh] flex flex-col"
          >
            {/* Handle */}
            <div className="w-12 h-1 bg-slate-700 rounded-full mx-auto mb-6" />

            {/* Header */}
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <h2 className="text-xl font-bold text-white">Meta Diária</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto min-h-0">
              {/* Current goal display */}
              <div className="text-center mb-4">
                <motion.span
                  key={goal}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-4xl font-bold text-cyan-400"
                >
                  {formatWaterAmount(goal)}
                </motion.span>
                <p className="text-slate-500 mt-1">por dia</p>
              </div>

              {/* Preset buttons */}
              <div className="mb-4">
                <p className="text-sm text-slate-400 mb-2">Escolha uma meta</p>
                <div className="flex flex-wrap gap-2">
                  {presetGoals.map((preset) => (
                    <button
                      key={preset}
                      onClick={() => handlePresetSelect(preset)}
                      className={cn(
                        'px-3 py-1.5 rounded-xl text-sm font-medium transition-all',
                        goal === preset
                          ? 'bg-cyan-500 text-white'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      )}
                    >
                      {formatWaterAmount(preset)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom slider */}
              <div className="mb-4">
                <p className="text-sm text-slate-400 mb-2">Ou ajuste manualmente</p>
                <input
                  type="range"
                  min={1000}
                  max={5000}
                  step={100}
                  value={goal}
                  onChange={(e) => {
                    setGoal(Number(e.target.value))
                    setWeight(null)
                  }}
                  className="w-full h-2 bg-slate-800 rounded-full appearance-none cursor-pointer
                             [&::-webkit-slider-thumb]:appearance-none
                             [&::-webkit-slider-thumb]:w-6
                             [&::-webkit-slider-thumb]:h-6
                             [&::-webkit-slider-thumb]:rounded-full
                             [&::-webkit-slider-thumb]:bg-cyan-500
                             [&::-webkit-slider-thumb]:cursor-pointer"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>1L</span>
                  <span>5L</span>
                </div>
              </div>

              {/* Calculate by weight */}
              <div className="bg-slate-800/50 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="w-4 h-4 text-violet-400" />
                  <span className="text-sm text-slate-400">Calcular por peso</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    placeholder="Seu peso"
                    value={weight || ''}
                    onChange={(e) => handleWeightChange(e.target.value)}
                    className="flex-1 bg-[#14141F] border border-[#2E2E3E] rounded-xl px-4 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                  <span className="text-slate-500">kg</span>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Recomendação: ~35ml por kg de peso corporal
                </p>
              </div>
            </div>

            {/* Actions - Always visible at bottom with safe area */}
            <div className="flex gap-3 pt-4 flex-shrink-0 pb-20">
              <Button
                variant="outline"
                size="lg"
                className="flex-1"
                onClick={onClose}
              >
                Cancelar
              </Button>
              <Button
                variant="gradient"
                size="lg"
                className="flex-1 gap-2"
                onClick={handleSave}
              >
                <Check className="w-5 h-5" />
                Salvar
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
