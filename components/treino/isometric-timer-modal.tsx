"use client"

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, Check, X, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface IsometricTimerModalProps {
  isOpen: boolean
  exerciseName: string
  setNumber: number
  /** Tempo planejado em segundos (ex: 30 para prancha 30s). */
  targetSeconds: number
  /** Carga opcional (peso adicional para isometria com carga, ex: prancha com anilha). */
  suggestedWeight?: number
  onComplete: (data: { seconds: number; weight: number }) => void
  onCancel: () => void
}

/**
 * Cronômetro automático para exercícios de isometria.
 *
 * Fluxo:
 * 1. Modal abre com countdown parado mostrando o tempo planejado
 * 2. Paciente toca "Começar" → countdown inicia
 * 3. Ao chegar em 0 → vibra, alerta sonoro, marca como concluído
 *    OU paciente pode parar antes e marcar com o tempo que conseguiu
 * 4. Botão "Repetir" reseta o cronômetro
 */
export function IsometricTimerModal({
  isOpen,
  exerciseName,
  setNumber,
  targetSeconds,
  suggestedWeight,
  onComplete,
  onCancel,
}: IsometricTimerModalProps) {
  const [remaining, setRemaining] = useState(targetSeconds)
  const [running, setRunning] = useState(false)
  const [finished, setFinished] = useState(false)
  const [weight, setWeight] = useState(suggestedWeight ?? 0)

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const wasOpenRef = useRef(false)

  // Reset quando o modal abre
  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      setRemaining(targetSeconds)
      setRunning(false)
      setFinished(false)
      setWeight(suggestedWeight ?? 0)
    }
    wasOpenRef.current = isOpen
  }, [isOpen, targetSeconds, suggestedWeight])

  // Cronômetro
  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }

    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          // Acabou
          setRunning(false)
          setFinished(true)
          // Vibra e alerta
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([200, 100, 200])
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [running])

  const elapsed = targetSeconds - remaining
  const progress = targetSeconds > 0 ? elapsed / targetSeconds : 0

  const handleStart = () => {
    if (finished) {
      // Reiniciar
      setRemaining(targetSeconds)
      setFinished(false)
    }
    setRunning(true)
  }

  const handlePause = () => setRunning(false)

  const handleReset = () => {
    setRunning(false)
    setRemaining(targetSeconds)
    setFinished(false)
  }

  const handleComplete = () => {
    onComplete({ seconds: elapsed > 0 ? elapsed : targetSeconds, weight })
  }

  const handleStopEarly = () => {
    setRunning(false)
    onComplete({ seconds: elapsed, weight })
  }

  if (!isOpen) return null

  // SVG circular progress
  const radius = 110
  const circumference = 2 * Math.PI * radius

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <div className="fixed inset-0 bg-black/60" onClick={onCancel} />
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="relative bg-background border-t sm:border border-border rounded-t-3xl sm:rounded-3xl w-full max-w-md p-6 pb-8"
            style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom, 0px))' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground-secondary">
                  Isometria — Série {setNumber}
                </p>
                <h3 className="text-base font-medium text-foreground mt-0.5">{exerciseName}</h3>
              </div>
              <button
                onClick={onCancel}
                className="p-1.5 rounded-lg hover:bg-background-elevated text-foreground-secondary"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cronômetro circular */}
            <div className="flex justify-center my-6">
              <div className="relative w-64 h-64">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 240 240">
                  <circle
                    cx="120"
                    cy="120"
                    r={radius}
                    fill="none"
                    strokeWidth="10"
                    className="stroke-border/50"
                  />
                  <motion.circle
                    cx="120"
                    cy="120"
                    r={radius}
                    fill="none"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference - progress * circumference}
                    className={cn(
                      'transition-all',
                      finished ? 'stroke-emerald-500' : 'stroke-dourado'
                    )}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className={cn(
                    'text-6xl font-bold font-heading leading-none',
                    finished ? 'text-emerald-500' : 'text-foreground'
                  )}>
                    {remaining}
                  </p>
                  <p className="text-xs text-foreground-secondary mt-2 uppercase tracking-wider">
                    {finished ? 'Concluído!' : 'segundos'}
                  </p>
                </div>
              </div>
            </div>

            {/* Carga (opcional) */}
            {suggestedWeight !== undefined && suggestedWeight > 0 && (
              <div className="bg-background-elevated rounded-2xl p-3 mb-4 flex items-center justify-between">
                <span className="text-sm text-foreground-secondary">Carga adicional</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setWeight(w => Math.max(0, w - 1))}
                    className="w-8 h-8 rounded-lg bg-background border border-border text-foreground-secondary hover:bg-border"
                  >
                    −
                  </button>
                  <span className="text-base font-bold text-foreground min-w-[3.5rem] text-center">
                    {weight}kg
                  </span>
                  <button
                    onClick={() => setWeight(w => w + 1)}
                    className="w-8 h-8 rounded-lg bg-background border border-border text-foreground-secondary hover:bg-border"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* Controles */}
            <div className="space-y-2">
              {!finished ? (
                <>
                  <Button
                    variant={running ? 'outline' : 'gradient'}
                    size="lg"
                    className="w-full"
                    onClick={running ? handlePause : handleStart}
                  >
                    {running ? (
                      <>
                        <Pause className="w-5 h-5 mr-2" />
                        Pausar
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5 mr-2" />
                        {remaining < targetSeconds ? 'Continuar' : 'Começar'}
                      </>
                    )}
                  </Button>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleReset}
                      disabled={remaining === targetSeconds && !running}
                    >
                      <RotateCcw className="w-4 h-4 mr-1" />
                      Reiniciar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleStopEarly}
                      disabled={elapsed === 0}
                      className="border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Marcar com {elapsed}s
                    </Button>
                  </div>
                </>
              ) : (
                <Button
                  variant="gradient"
                  size="lg"
                  className="w-full"
                  onClick={handleComplete}
                >
                  <Check className="w-5 h-5 mr-2" />
                  Confirmar série
                </Button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
