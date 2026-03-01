"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Clock, Flame, MapPin, FileText, Plus } from 'lucide-react'
import {
  ActivityType,
  IntensityLevel,
  activityTypeLabels,
  intensityLabels
} from '@/lib/activity/types'
import { cn } from '@/lib/utils'

interface AddActivityModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (activity: {
    activity_type: ActivityType
    custom_name?: string
    duration_minutes: number
    intensity: IntensityLevel
    calories_burned?: number
    distance_km?: number
    notes?: string
    location?: string
    date: string
  }) => void
  date: string // YYYY-MM-DD
}

const ACTIVITY_TYPES = Object.entries(activityTypeLabels) as [ActivityType, typeof activityTypeLabels[ActivityType]][]

export function AddActivityModal({ isOpen, onClose, onSave, date }: AddActivityModalProps) {
  const [activityType, setActivityType] = useState<ActivityType | null>(null)
  const [customName, setCustomName] = useState('')
  const [duration, setDuration] = useState('')
  const [intensity, setIntensity] = useState<IntensityLevel>('moderado')
  const [calories, setCalories] = useState('')
  const [distance, setDistance] = useState('')
  const [notes, setNotes] = useState('')
  const [location, setLocation] = useState('')
  const [step, setStep] = useState<'type' | 'details'>('type')
  const [saving, setSaving] = useState(false)

  const handleSelectType = (type: ActivityType) => {
    setActivityType(type)
    setStep('details')
  }

  const handleSave = async () => {
    if (!activityType || !duration) return

    setSaving(true)
    try {
      await onSave({
        activity_type: activityType,
        custom_name: activityType === 'outro' ? customName : undefined,
        duration_minutes: parseInt(duration),
        intensity,
        calories_burned: calories ? parseInt(calories) : undefined,
        distance_km: distance ? parseFloat(distance) : undefined,
        notes: notes || undefined,
        location: location || undefined,
        date
      })

      // Reset form
      setActivityType(null)
      setCustomName('')
      setDuration('')
      setIntensity('moderado')
      setCalories('')
      setDistance('')
      setNotes('')
      setLocation('')
      setStep('type')
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const handleBack = () => {
    setStep('type')
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-border">
            {step === 'details' && (
              <button
                onClick={handleBack}
                className="p-2 text-foreground-secondary hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
            <h2 className="text-lg font-bold text-foreground flex-1 text-center">
              {step === 'type' ? 'Registrar Atividade' : activityType && activityTypeLabels[activityType].label}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-foreground-secondary hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {step === 'type' ? (
              <>
                <p className="text-foreground-secondary text-sm mb-4">
                  Selecione o tipo de atividade que você realizou:
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {ACTIVITY_TYPES.map(([type, info]) => (
                    <button
                      key={type}
                      onClick={() => handleSelectType(type)}
                      className={cn(
                        'flex flex-col items-center gap-1 p-3 rounded-xl transition-colors',
                        'bg-background-elevated/50 hover:bg-background-elevated border border-transparent',
                        'hover:border-dourado/50'
                      )}
                    >
                      <span className="text-2xl">{info.icon}</span>
                      <span className="text-[10px] text-foreground-secondary text-center leading-tight">
                        {info.label}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="space-y-4">
                {/* Nome customizado (se tipo = outro) */}
                {activityType === 'outro' && (
                  <div>
                    <label className="text-sm text-foreground-secondary block mb-2">
                      Nome da atividade *
                    </label>
                    <input
                      type="text"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder="Ex: Aula de dança"
                      className="w-full bg-background-elevated border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-dourado"
                    />
                  </div>
                )}

                {/* Duração */}
                <div>
                  <label className="text-sm text-foreground-secondary block mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Duração (minutos) *
                  </label>
                  <div className="flex gap-2 mb-2">
                    {[15, 30, 45, 60, 90, 120].map((mins) => (
                      <button
                        key={mins}
                        onClick={() => setDuration(mins.toString())}
                        className={cn(
                          'flex-1 py-2 rounded-lg text-sm font-medium transition-colors',
                          duration === mins.toString()
                            ? 'bg-dourado text-white'
                            : 'bg-background-elevated text-foreground-secondary hover:text-foreground'
                        )}
                      >
                        {mins}
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="Ou digite o tempo"
                    className="w-full bg-background-elevated border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-dourado"
                  />
                </div>

                {/* Intensidade */}
                <div>
                  <label className="text-sm text-foreground-secondary block mb-2">
                    Intensidade *
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {(Object.entries(intensityLabels) as [IntensityLevel, typeof intensityLabels[IntensityLevel]][]).map(([level, info]) => (
                      <button
                        key={level}
                        onClick={() => setIntensity(level)}
                        className={cn(
                          'py-2 rounded-lg text-sm font-medium transition-colors',
                          intensity === level
                            ? 'bg-dourado text-white'
                            : 'bg-background-elevated text-foreground-secondary hover:text-foreground'
                        )}
                      >
                        {info.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Calorias */}
                <div>
                  <label className="text-sm text-foreground-secondary block mb-2 flex items-center gap-2">
                    <Flame className="w-4 h-4" />
                    Calorias queimadas (opcional)
                  </label>
                  <input
                    type="number"
                    value={calories}
                    onChange={(e) => setCalories(e.target.value)}
                    placeholder="Ex: 350"
                    className="w-full bg-background-elevated border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-dourado"
                  />
                </div>

                {/* Distância (para atividades cardio) */}
                {['corrida', 'caminhada', 'natacao', 'ciclismo'].includes(activityType || '') && (
                  <div>
                    <label className="text-sm text-foreground-secondary block mb-2">
                      Distância em km (opcional)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={distance}
                      onChange={(e) => setDistance(e.target.value)}
                      placeholder="Ex: 5.5"
                      className="w-full bg-background-elevated border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-dourado"
                    />
                  </div>
                )}

                {/* Local */}
                <div>
                  <label className="text-sm text-foreground-secondary block mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Local (opcional)
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Ex: Praia de Ipanema"
                    className="w-full bg-background-elevated border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-dourado"
                  />
                </div>

                {/* Notas */}
                <div>
                  <label className="text-sm text-foreground-secondary block mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Observações (opcional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Como foi a atividade? Como se sentiu?"
                    rows={3}
                    className="w-full bg-background-elevated border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-dourado resize-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer - só mostra no step de detalhes */}
          {step === 'details' && (
            <div className="p-4 border-t border-border">
              <button
                onClick={handleSave}
                disabled={!duration || saving || (activityType === 'outro' && !customName)}
                className={cn(
                  'w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2',
                  'transition-colors',
                  duration && !saving && (activityType !== 'outro' || customName)
                    ? 'bg-gradient-to-r from-dourado to-vinho text-white'
                    : 'bg-background-elevated text-foreground-secondary cursor-not-allowed'
                )}
              >
                {saving ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    Registrar Atividade
                  </>
                )}
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
