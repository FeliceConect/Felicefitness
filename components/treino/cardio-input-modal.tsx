"use client"

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Minus, Plus, Check, X, Timer, Route, Flame, Zap, Gauge, TrendingUp, Heart, Activity } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { CardioExerciseType, CardioIntensity, CompletedCardio } from '@/lib/workout/types'

interface CardioInputModalProps {
  isOpen: boolean
  userWeight?: number // kg - para cálculo preciso de calorias
  onComplete: (data: CompletedCardio) => void
  onCancel: () => void
}

const CARDIO_TYPES: { value: CardioExerciseType; label: string; icon: string; hasDistance: boolean; hasIncline: boolean; hasResistance: boolean }[] = [
  { value: 'esteira', label: 'Esteira', icon: '🏃', hasDistance: true, hasIncline: true, hasResistance: false },
  { value: 'bicicleta', label: 'Bicicleta', icon: '🚴', hasDistance: true, hasIncline: false, hasResistance: true },
  { value: 'eliptico', label: 'Eliptico', icon: '🔄', hasDistance: true, hasIncline: true, hasResistance: true },
  { value: 'transport', label: 'Transport', icon: '🚶', hasDistance: false, hasIncline: false, hasResistance: true },
  { value: 'step', label: 'Step', icon: '🪜', hasDistance: false, hasIncline: false, hasResistance: false },
  { value: 'remo', label: 'Remo', icon: '🚣', hasDistance: true, hasIncline: false, hasResistance: true },
  { value: 'escada', label: 'Escada', icon: '🪜', hasDistance: false, hasIncline: false, hasResistance: true },
  { value: 'pular_corda', label: 'Corda', icon: '🪢', hasDistance: false, hasIncline: false, hasResistance: false },
  { value: 'outro', label: 'Outro', icon: '💪', hasDistance: true, hasIncline: false, hasResistance: false },
]

const INTENSITY_OPTIONS: { value: CardioIntensity; label: string; emoji: string; description: string }[] = [
  { value: 'leve', label: 'Leve', emoji: '😊', description: 'Consegue conversar' },
  { value: 'moderado', label: 'Moderado', emoji: '😤', description: 'Fala com esforco' },
  { value: 'intenso', label: 'Intenso', emoji: '🥵', description: 'Dificil falar' },
  { value: 'muito_intenso', label: 'Maximo', emoji: '🔥', description: 'Nao consegue falar' },
]

// MET values baseados em tipo, velocidade e intensidade
// Fonte: Compendium of Physical Activities
const getMETValue = (
  tipo: CardioExerciseType,
  velocidade: number | null,
  intensidade: CardioIntensity,
  inclinacao: number
): number => {
  // Base MET por intensidade
  const intensityMultiplier: Record<CardioIntensity, number> = {
    leve: 0.7,
    moderado: 1.0,
    intenso: 1.3,
    muito_intenso: 1.5
  }

  let baseMET = 6 // Default

  switch (tipo) {
    case 'esteira':
      // Corrida/Caminhada - MET varia muito com velocidade
      if (velocidade) {
        if (velocidade < 5) baseMET = 3.5 // Caminhada lenta
        else if (velocidade < 6.5) baseMET = 4.3 // Caminhada moderada
        else if (velocidade < 8) baseMET = 6.0 // Caminhada rapida / trote
        else if (velocidade < 10) baseMET = 8.3 // Corrida leve
        else if (velocidade < 12) baseMET = 9.8 // Corrida moderada
        else if (velocidade < 14) baseMET = 11.0 // Corrida forte
        else if (velocidade < 16) baseMET = 12.8 // Corrida muito forte
        else baseMET = 14.5 // Sprint
      } else {
        // Sem velocidade, usar intensidade
        baseMET = intensidade === 'leve' ? 4 : intensidade === 'moderado' ? 7 : intensidade === 'intenso' ? 10 : 13
      }
      // Adicionar inclinacao (aproximadamente +0.5 MET por 2% de inclinacao)
      baseMET += (inclinacao / 2) * 0.5
      break

    case 'bicicleta':
      if (velocidade) {
        if (velocidade < 16) baseMET = 4.0 // Lazer
        else if (velocidade < 20) baseMET = 6.8 // Moderado
        else if (velocidade < 25) baseMET = 8.0 // Vigoroso
        else if (velocidade < 30) baseMET = 10.0 // Muito vigoroso
        else baseMET = 12.0 // Racing
      } else {
        baseMET = intensidade === 'leve' ? 4 : intensidade === 'moderado' ? 7 : intensidade === 'intenso' ? 10 : 12
      }
      break

    case 'eliptico':
      baseMET = intensidade === 'leve' ? 4.5 : intensidade === 'moderado' ? 6.5 : intensidade === 'intenso' ? 8.5 : 10.5
      baseMET += (inclinacao / 5) * 0.3 // Bonus por inclinacao
      break

    case 'transport':
      baseMET = intensidade === 'leve' ? 4 : intensidade === 'moderado' ? 6 : intensidade === 'intenso' ? 8 : 10
      break

    case 'step':
      baseMET = intensidade === 'leve' ? 5.5 : intensidade === 'moderado' ? 7.5 : intensidade === 'intenso' ? 9.5 : 11
      break

    case 'remo':
      baseMET = intensidade === 'leve' ? 4.8 : intensidade === 'moderado' ? 7.0 : intensidade === 'intenso' ? 8.5 : 12.0
      break

    case 'escada':
      baseMET = intensidade === 'leve' ? 6 : intensidade === 'moderado' ? 8 : intensidade === 'intenso' ? 10 : 12
      break

    case 'pular_corda':
      baseMET = intensidade === 'leve' ? 8 : intensidade === 'moderado' ? 10 : intensidade === 'intenso' ? 12 : 14
      break

    default:
      baseMET = 6 * intensityMultiplier[intensidade]
  }

  return Math.round(baseMET * 10) / 10
}

// Calcular calorias: MET * peso (kg) * duracao (horas)
const calculateCalories = (met: number, weightKg: number, durationMinutes: number): number => {
  return Math.round(met * weightKg * (durationMinutes / 60))
}

// Calcular ritmo (pace) em min/km
const calculatePace = (distanceKm: number, durationMinutes: number): string => {
  if (!distanceKm || distanceKm === 0) return '--:--'
  const paceMinutes = durationMinutes / distanceKm
  const mins = Math.floor(paceMinutes)
  const secs = Math.round((paceMinutes - mins) * 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function CardioInputModal({
  isOpen,
  userWeight = 75, // Default 75kg se nao informado
  onComplete,
  onCancel
}: CardioInputModalProps) {
  const [tipo, setTipo] = useState<CardioExerciseType>('esteira')
  const [duracao, setDuracao] = useState(20)
  const [distancia, setDistancia] = useState(0)
  const [velocidade, setVelocidade] = useState(0)
  const [inclinacao, setInclinacao] = useState(0)
  const [resistencia, setResistencia] = useState(5)
  const [intensidade, setIntensidade] = useState<CardioIntensity>('moderado')
  const [fcMedia, setFcMedia] = useState(0)
  const [fcMax, setFcMax] = useState(0)

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setTipo('esteira')
      setDuracao(20)
      setDistancia(0)
      setVelocidade(0)
      setInclinacao(0)
      setResistencia(5)
      setIntensidade('moderado')
      setFcMedia(0)
      setFcMax(0)
    }
  }, [isOpen])

  const selectedType = CARDIO_TYPES.find(t => t.value === tipo)!

  // Calcular velocidade automaticamente se tiver distancia e duracao
  const velocidadeCalculada = useMemo(() => {
    if (distancia > 0 && duracao > 0) {
      return Math.round((distancia / (duracao / 60)) * 10) / 10
    }
    return velocidade
  }, [distancia, duracao, velocidade])

  // Usar velocidade manual ou calculada
  const velocidadeFinal = velocidade > 0 ? velocidade : velocidadeCalculada

  // Calcular MET e calorias
  const met = useMemo(() => {
    return getMETValue(tipo, velocidadeFinal > 0 ? velocidadeFinal : null, intensidade, inclinacao)
  }, [tipo, velocidadeFinal, intensidade, inclinacao])

  const calorias = useMemo(() => {
    return calculateCalories(met, userWeight, duracao)
  }, [met, userWeight, duracao])

  const ritmo = useMemo(() => {
    return calculatePace(distancia, duracao)
  }, [distancia, duracao])

  const handleComplete = () => {
    const cardioData: CompletedCardio = {
      id: `cardio-${Date.now()}`,
      tipo,
      nome: selectedType.label,
      duracao_minutos: duracao,
      distancia_km: distancia > 0 ? distancia : undefined,
      velocidade_media: velocidadeFinal > 0 ? velocidadeFinal : undefined,
      ritmo_medio: distancia > 0 ? ritmo : undefined,
      inclinacao: inclinacao > 0 ? inclinacao : undefined,
      resistencia: selectedType.hasResistance && resistencia > 0 ? resistencia : undefined,
      intensidade,
      frequencia_cardiaca_media: fcMedia > 0 ? fcMedia : undefined,
      frequencia_cardiaca_max: fcMax > 0 ? fcMax : undefined,
      calorias,
      met
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
            className="w-full max-w-md bg-[#14141F] rounded-2xl flex flex-col max-h-[90vh]"
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
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {/* Tipo de cardio */}
              <div>
                <label className="text-sm text-slate-400 block mb-2">Tipo de exercicio</label>
                <div className="grid grid-cols-3 gap-2">
                  {CARDIO_TYPES.map((cardioType) => (
                    <button
                      key={cardioType.value}
                      onClick={() => setTipo(cardioType.value)}
                      className={cn(
                        'p-2 rounded-xl border transition-all',
                        tipo === cardioType.value
                          ? 'bg-emerald-500/20 border-emerald-500/50 text-white'
                          : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:border-slate-600'
                      )}
                    >
                      <span className="text-xl block">{cardioType.icon}</span>
                      <span className="text-[10px]">{cardioType.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Intensidade */}
              <div>
                <label className="text-sm text-slate-400 flex items-center gap-1 mb-2">
                  <Activity className="w-4 h-4" />
                  Intensidade
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {INTENSITY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setIntensidade(opt.value)}
                      className={cn(
                        'p-2 rounded-xl border transition-all text-center',
                        intensidade === opt.value
                          ? 'bg-violet-500/20 border-violet-500/50'
                          : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                      )}
                    >
                      <span className="text-lg block">{opt.emoji}</span>
                      <span className="text-[10px] text-slate-300">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Duracao */}
              <div>
                <label className="text-sm text-slate-400 flex items-center gap-1 mb-2">
                  <Timer className="w-4 h-4" />
                  Duracao
                </label>
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => setDuracao(prev => Math.max(1, prev - 5))}
                    className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center hover:bg-slate-700"
                  >
                    <Minus className="w-4 h-4 text-white" />
                  </button>
                  <div className="w-24 text-center">
                    <span className="text-3xl font-bold text-white">{duracao}</span>
                    <span className="text-sm text-slate-400 ml-1">min</span>
                  </div>
                  <button
                    onClick={() => setDuracao(prev => prev + 5)}
                    className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center hover:bg-slate-700"
                  >
                    <Plus className="w-4 h-4 text-white" />
                  </button>
                </div>
                <div className="flex justify-center gap-2 mt-2">
                  {[10, 20, 30, 45, 60].map(d => (
                    <button
                      key={d}
                      onClick={() => setDuracao(d)}
                      className={cn(
                        'px-2 py-1 rounded-lg text-xs font-medium transition-colors',
                        duracao === d
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      )}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Distancia - se o tipo suportar */}
              {selectedType.hasDistance && (
                <div>
                  <label className="text-sm text-slate-400 flex items-center gap-1 mb-2">
                    <Route className="w-4 h-4" />
                    Distancia (km)
                  </label>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => setDistancia(prev => Math.max(0, prev - 0.5))}
                      className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center hover:bg-slate-700"
                    >
                      <Minus className="w-4 h-4 text-white" />
                    </button>
                    <div className="w-24 text-center">
                      <span className="text-3xl font-bold text-white">{distancia.toFixed(1)}</span>
                      <span className="text-sm text-slate-400 ml-1">km</span>
                    </div>
                    <button
                      onClick={() => setDistancia(prev => prev + 0.5)}
                      className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center hover:bg-slate-700"
                    >
                      <Plus className="w-4 h-4 text-white" />
                    </button>
                  </div>
                  {distancia > 0 && (
                    <div className="flex justify-center gap-4 mt-2 text-xs">
                      <span className="text-cyan-400">Vel: {velocidadeCalculada} km/h</span>
                      <span className="text-violet-400">Ritmo: {ritmo} /km</span>
                    </div>
                  )}
                </div>
              )}

              {/* Velocidade manual (se nao tiver distancia) */}
              {selectedType.hasDistance && distancia === 0 && (
                <div>
                  <label className="text-sm text-slate-400 flex items-center gap-1 mb-2">
                    <Gauge className="w-4 h-4" />
                    Velocidade media (km/h)
                  </label>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => setVelocidade(prev => Math.max(0, prev - 0.5))}
                      className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center hover:bg-slate-700"
                    >
                      <Minus className="w-4 h-4 text-white" />
                    </button>
                    <div className="w-24 text-center">
                      <span className="text-3xl font-bold text-white">{velocidade.toFixed(1)}</span>
                      <span className="text-sm text-slate-400 ml-1">km/h</span>
                    </div>
                    <button
                      onClick={() => setVelocidade(prev => prev + 0.5)}
                      className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center hover:bg-slate-700"
                    >
                      <Plus className="w-4 h-4 text-white" />
                    </button>
                  </div>
                  <div className="flex justify-center gap-2 mt-2">
                    {[5, 7, 9, 11, 13].map(v => (
                      <button
                        key={v}
                        onClick={() => setVelocidade(v)}
                        className={cn(
                          'px-2 py-1 rounded-lg text-xs font-medium transition-colors',
                          velocidade === v
                            ? 'bg-cyan-500 text-white'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        )}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Inclinacao - se o tipo suportar */}
              {selectedType.hasIncline && (
                <div>
                  <label className="text-sm text-slate-400 flex items-center gap-1 mb-2">
                    <TrendingUp className="w-4 h-4" />
                    Inclinacao (%)
                  </label>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => setInclinacao(prev => Math.max(0, prev - 1))}
                      className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center hover:bg-slate-700"
                    >
                      <Minus className="w-4 h-4 text-white" />
                    </button>
                    <div className="w-24 text-center">
                      <span className="text-3xl font-bold text-white">{inclinacao}</span>
                      <span className="text-sm text-slate-400 ml-1">%</span>
                    </div>
                    <button
                      onClick={() => setInclinacao(prev => Math.min(15, prev + 1))}
                      className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center hover:bg-slate-700"
                    >
                      <Plus className="w-4 h-4 text-white" />
                    </button>
                  </div>
                  <div className="flex justify-center gap-2 mt-2">
                    {[0, 2, 5, 8, 12].map(i => (
                      <button
                        key={i}
                        onClick={() => setInclinacao(i)}
                        className={cn(
                          'px-2 py-1 rounded-lg text-xs font-medium transition-colors',
                          inclinacao === i
                            ? 'bg-amber-500 text-white'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        )}
                      >
                        {i}%
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Resistencia - se o tipo suportar */}
              {selectedType.hasResistance && (
                <div>
                  <label className="text-sm text-slate-400 flex items-center gap-1 mb-2">
                    <Gauge className="w-4 h-4" />
                    Resistencia (nivel)
                  </label>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => setResistencia(prev => Math.max(1, prev - 1))}
                      className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center hover:bg-slate-700"
                    >
                      <Minus className="w-4 h-4 text-white" />
                    </button>
                    <div className="w-24 text-center">
                      <span className="text-3xl font-bold text-white">{resistencia}</span>
                      <span className="text-sm text-slate-400 ml-1">/20</span>
                    </div>
                    <button
                      onClick={() => setResistencia(prev => Math.min(20, prev + 1))}
                      className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center hover:bg-slate-700"
                    >
                      <Plus className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>
              )}

              {/* Frequencia Cardiaca */}
              <div className="bg-slate-800/30 rounded-xl p-3">
                <label className="text-sm text-slate-400 flex items-center gap-1 mb-3">
                  <Heart className="w-4 h-4 text-red-400" />
                  Frequencia Cardiaca (opcional)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-xs text-slate-500 block mb-1">FC Media</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setFcMedia(prev => Math.max(0, prev - 5))}
                        className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center hover:bg-slate-700"
                      >
                        <Minus className="w-3 h-3 text-white" />
                      </button>
                      <div className="flex-1 text-center">
                        <span className="text-xl font-bold text-white">{fcMedia || '--'}</span>
                        <span className="text-xs text-slate-400 ml-1">bpm</span>
                      </div>
                      <button
                        onClick={() => setFcMedia(prev => prev + 5)}
                        className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center hover:bg-slate-700"
                      >
                        <Plus className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block mb-1">FC Max</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setFcMax(prev => Math.max(0, prev - 5))}
                        className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center hover:bg-slate-700"
                      >
                        <Minus className="w-3 h-3 text-white" />
                      </button>
                      <div className="flex-1 text-center">
                        <span className="text-xl font-bold text-white">{fcMax || '--'}</span>
                        <span className="text-xs text-slate-400 ml-1">bpm</span>
                      </div>
                      <button
                        onClick={() => setFcMax(prev => prev + 5)}
                        className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center hover:bg-slate-700"
                      >
                        <Plus className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Resumo e Calorias */}
              <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Flame className="w-5 h-5 text-orange-400" />
                    <span className="text-sm text-slate-300">Calorias estimadas</span>
                  </div>
                  <span className="text-xs text-slate-500">MET: {met}</span>
                </div>
                <p className="text-4xl font-bold text-orange-400 text-center">{calorias} kcal</p>

                {/* Resumo dos dados */}
                <div className="mt-3 pt-3 border-t border-orange-500/20 grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <span className="text-slate-500 block">Duracao</span>
                    <span className="text-white font-medium">{duracao} min</span>
                  </div>
                  {distancia > 0 && (
                    <div>
                      <span className="text-slate-500 block">Distancia</span>
                      <span className="text-white font-medium">{distancia.toFixed(1)} km</span>
                    </div>
                  )}
                  {velocidadeFinal > 0 && (
                    <div>
                      <span className="text-slate-500 block">Vel. Media</span>
                      <span className="text-white font-medium">{velocidadeFinal} km/h</span>
                    </div>
                  )}
                  {inclinacao > 0 && (
                    <div>
                      <span className="text-slate-500 block">Inclinacao</span>
                      <span className="text-white font-medium">{inclinacao}%</span>
                    </div>
                  )}
                  {fcMedia > 0 && (
                    <div>
                      <span className="text-slate-500 block">FC Media</span>
                      <span className="text-white font-medium">{fcMedia} bpm</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
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
