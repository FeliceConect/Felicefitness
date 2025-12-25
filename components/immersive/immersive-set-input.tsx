'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Minus, Plus, Check } from 'lucide-react'
import type { ImmersiveExercise, SetLog, SetInput } from '@/types/immersive'
import { RPE_SCALE, WEIGHT_INCREMENTS, REP_PRESETS } from '@/types/immersive'

interface ImmersiveSetInputProps {
  exercise: ImmersiveExercise
  setNumber: number
  previousSet?: SetLog
  onConfirm: (data: SetInput) => void
  onCancel?: () => void
  className?: string
}

export function ImmersiveSetInput({
  exercise,
  setNumber,
  previousSet,
  onConfirm,
  onCancel,
  className,
}: ImmersiveSetInputProps) {
  const [weight, setWeight] = useState(
    previousSet?.weight || exercise.suggestedWeight || 0
  )
  const [reps, setReps] = useState(
    previousSet?.reps || exercise.targetReps || 10
  )
  const [rpe, setRpe] = useState<number | undefined>(undefined)
  const [showRpe, setShowRpe] = useState(false)

  const handleWeightChange = (delta: number) => {
    setWeight((prev) => Math.max(0, prev + delta))
  }

  const handleRepsChange = (delta: number) => {
    setReps((prev) => Math.max(1, prev + delta))
  }

  const handleConfirm = () => {
    onConfirm({ weight, reps, rpe })
  }

  return (
    <div className={cn('flex flex-col gap-6', className)}>
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-1">Registrar Série {setNumber}</h2>
        <p className="text-muted-foreground">{exercise.name}</p>
      </div>

      {/* Weight input */}
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground mb-3">Carga (kg)</p>
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {WEIGHT_INCREMENTS.slice(0, 2).map((inc) => (
                <Button
                  key={`dec-${inc}`}
                  variant="outline"
                  size="icon"
                  onClick={() => handleWeightChange(-inc)}
                  className="h-12 w-12"
                >
                  <Minus className="h-4 w-4" />
                  <span className="sr-only">-{inc}</span>
                </Button>
              ))}
            </div>

            <div className="text-center">
              <span className="text-5xl font-bold tabular-nums">{weight}</span>
              <span className="text-2xl text-muted-foreground ml-1">kg</span>
            </div>

            <div className="flex gap-2">
              {WEIGHT_INCREMENTS.slice(0, 2).map((inc) => (
                <Button
                  key={`inc-${inc}`}
                  variant="outline"
                  size="icon"
                  onClick={() => handleWeightChange(inc)}
                  className="h-12 w-12"
                >
                  <Plus className="h-4 w-4" />
                  <span className="sr-only">+{inc}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Quick weight adjustments */}
          <div className="flex justify-center gap-2 mt-3">
            {WEIGHT_INCREMENTS.map((inc) => (
              <Button
                key={inc}
                variant="ghost"
                size="sm"
                onClick={() => handleWeightChange(inc)}
                className="text-xs"
              >
                +{inc}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Reps input */}
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground mb-3">Repetições</p>
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleRepsChange(-1)}
              className="h-12 w-12"
            >
              <Minus className="h-4 w-4" />
            </Button>

            <span className="text-5xl font-bold tabular-nums">{reps}</span>

            <Button
              variant="outline"
              size="icon"
              onClick={() => handleRepsChange(1)}
              className="h-12 w-12"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Rep presets */}
          <div className="flex justify-center gap-2 flex-wrap">
            {REP_PRESETS.map((preset) => (
              <Button
                key={preset}
                variant={reps === preset ? 'default' : 'outline'}
                size="sm"
                onClick={() => setReps(preset)}
              >
                {preset}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* RPE (optional) */}
      <Card>
        <CardContent className="p-4">
          <button
            onClick={() => setShowRpe(!showRpe)}
            className="w-full flex items-center justify-between"
          >
            <span className="text-sm text-muted-foreground">
              Como foi? (opcional)
            </span>
            <span className="text-2xl">
              {rpe !== undefined ? RPE_SCALE[rpe - 1]?.emoji : '➕'}
            </span>
          </button>

          {showRpe && (
            <div className="mt-4 grid grid-cols-5 gap-2">
              {RPE_SCALE.slice(0, 5).map((item) => (
                <button
                  key={item.value}
                  onClick={() => setRpe(item.value)}
                  className={cn(
                    'flex flex-col items-center p-2 rounded-lg transition-colors',
                    rpe === item.value
                      ? 'bg-primary/10 ring-2 ring-primary'
                      : 'hover:bg-muted'
                  )}
                >
                  <span className="text-2xl">{item.emoji}</span>
                  <span className="text-[10px] text-muted-foreground mt-1">
                    {item.value}
                  </span>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comparison with previous set */}
      {previousSet && (
        <p className="text-center text-sm text-muted-foreground">
          Série anterior: {previousSet.weight}kg × {previousSet.reps} reps
        </p>
      )}

      {/* Confirm button */}
      <Button
        size="lg"
        className="w-full h-14 text-lg font-semibold gap-2"
        onClick={handleConfirm}
      >
        <Check className="h-5 w-5" />
        Confirmar
      </Button>

      {onCancel && (
        <Button
          variant="ghost"
          className="w-full"
          onClick={onCancel}
        >
          Cancelar
        </Button>
      )}
    </div>
  )
}
