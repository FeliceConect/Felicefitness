"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Minus, Plus, Check, X, Timer, Route, Flame, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { CardioExerciseType, CompletedCardio } from '@/lib/workout/types'

interface CardioInputModalProps {
  isOpen: boolean
  onComplete: (data: CompletedCardio) => void
  onCancel: () => void
}

const CARDIO_TYPES: { value: CardioExerciseType; label: string; icon: string }[] = [
  { value: 'esteira', label: 'Esteira', icon: '🏃' },
  { value: 'bicicleta', label: 'Bicicleta', icon: '🚴' },
  { value: 'eliptico', label: 'Eliptico', icon: '🔄' },
  { value: 'step', label: 'Step', icon: '🪜' },
  { value: 'remo', label: 'Remo', icon: '🚣' },
  { value: 'outro', label: 'Outro', icon: '💪' },
]

// Calorias por minuto aproximadas para cada tipo de cardio (intensidade média)
const CALORIES_PER_MINUTE: Record<CardioExerciseType, number> = {
  esteira: 10,
  bicicleta: 8,
  eliptico: 9,
  step: 10,
  remo: 11,
  outro: 8
}

export function CardioInputModal({
  isOpen,
  onComplete,
  onCancel
}: CardioInputModalProps) {
  const [tipo, setTipo] = useState<CardioExerciseType>('esteira')
  const [duracao, setDuracao] = useState(20) // minutos
  const [distancia, setDistancia] = useState<number | null>(null)
  const [showDistancia, setShowDistancia] = useState(false)

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setTipo('esteira')
      setDuracao(20)
      setDistancia(null)
      setShowDistancia(false)
    }
  }, [isOpen])

  const adjustDuracao = (delta: number) => {
    setDuracao(prev => Math.max(1, prev + delta))
  }

  const adjustDistancia = (delta: number) => {
    setDistancia(prev => Math.max(0, (prev || 0) + delta))
  }

  const selectedType = CARDIO_TYPES.find(t => t.value === tipo)
  const estimatedCalories = Math.round(duracao * CALORIES_PER_MINUTE[tipo])
  const velocidadeMedia = distancia && duracao > 0
    ? Math.round((distancia / (duracao / 60)) * 10) / 10
    : null

  const handleComplete = () => {
    const cardioData: CompletedCardio = {
      id: `cardio-${Date.now()}`,
      tipo,
      nome: selectedType?.label || 'Cardio',
      duracao_minutos: duracao,
      distancia_km: distancia || undefined,
      velocidade_media: velocidadeMedia || undefined,
      calorias: estimatedCalories
    }
    onComplete(cardioData)
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
            className="w-full max-w-md bg-[#14141F] rounded-2xl flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-bold text-white">Adicionar Cardio</h3>
              </div>
              <button
                onClick={onCancel}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
              {/* Tipo de cardio */}
              <div>
                <label className="text-sm text-slate-400 block mb-2">Tipo de exercicio</label>
                <div className="grid grid-cols-3 gap-2">
                  {CARDIO_TYPES.map((cardioType) => (
                    <button
                      key={cardioType.value}
                      onClick={() => setTipo(cardioType.value)}
                      className={cn(
                        'p-3 rounded-xl border transition-all',
                        tipo === cardioType.value
                          ? 'bg-emerald-500/20 border-emerald-500/50 text-white'
                          : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:border-slate-600'
                      )}
                    >
                      <span className="text-2xl block mb-1">{cardioType.icon}</span>
                      <span className="text-xs">{cardioType.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Duracao */}
              <div>
                <label className="text-sm text-slate-400 flex items-center gap-1 mb-2">
                  <Timer className="w-4 h-4" />
                  Duracao (minutos)
                </label>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => adjustDuracao(-5)}
                    className="w-11 h-11 rounded-xl bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition-colors"
                  >
                    <Minus className="w-5 h-5 text-white" />
                  </button>
                  <div className="w-28 text-center">
                    <motion.span
                      key={duracao}
                      initial={{ scale: 1.2, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-4xl font-bold text-white"
                    >
                      {duracao}
                    </motion.span>
                    <span className="text-base text-slate-400 ml-1">min</span>
                  </div>
                  <button
                    onClick={() => adjustDuracao(5)}
                    className="w-11 h-11 rounded-xl bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition-colors"
                  >
                    <Plus className="w-5 h-5 text-white" />
                  </button>
                </div>
                {/* Quick duration buttons */}
                <div className="flex justify-center gap-2 mt-3">
                  {[10, 20, 30, 45].map(d => (
                    <button
                      key={d}
                      onClick={() => setDuracao(d)}
                      className={cn(
                        'px-3 py-1 rounded-lg text-sm font-medium transition-colors',
                        duracao === d
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      )}
                    >
                      {d}min
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggle distancia */}
              <div>
                <button
                  onClick={() => setShowDistancia(!showDistancia)}
                  className={cn(
                    'w-full p-3 rounded-xl border flex items-center justify-between transition-all',
                    showDistancia
                      ? 'bg-cyan-500/20 border-cyan-500/50'
                      : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                  )}
                >
                  <span className="flex items-center gap-2 text-sm">
                    <Route className="w-4 h-4 text-cyan-400" />
                    <span className="text-white">Adicionar distancia</span>
                  </span>
                  <span className="text-slate-400 text-xs">{showDistancia ? 'Ativado' : 'Opcional'}</span>
                </button>
              </div>

              {/* Distancia (opcional) */}
              {showDistancia && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                >
                  <label className="text-sm text-slate-400 block mb-2">Distancia (km)</label>
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={() => adjustDistancia(-0.5)}
                      className="w-11 h-11 rounded-xl bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition-colors"
                    >
                      <Minus className="w-5 h-5 text-white" />
                    </button>
                    <div className="w-28 text-center">
                      <motion.span
                        key={distancia}
                        initial={{ scale: 1.2, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-4xl font-bold text-white"
                      >
                        {(distancia || 0).toFixed(1)}
                      </motion.span>
                      <span className="text-base text-slate-400 ml-1">km</span>
                    </div>
                    <button
                      onClick={() => adjustDistancia(0.5)}
                      className="w-11 h-11 rounded-xl bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition-colors"
                    >
                      <Plus className="w-5 h-5 text-white" />
                    </button>
                  </div>
                  {velocidadeMedia && (
                    <p className="text-center text-sm text-cyan-400 mt-2">
                      Velocidade media: {velocidadeMedia} km/h
                    </p>
                  )}
                </motion.div>
              )}

              {/* Calorias estimadas */}
              <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-xl p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Flame className="w-5 h-5 text-orange-400" />
                  <span className="text-sm text-slate-400">Calorias estimadas</span>
                </div>
                <p className="text-3xl font-bold text-orange-400">{estimatedCalories} kcal</p>
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
                className="flex-1 gap-2 bg-gradient-to-r from-emerald-500 to-cyan-500"
                onClick={handleComplete}
              >
                <Check className="w-4 h-4" />
                Adicionar
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
