'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { X, Pause, Play, RotateCcw } from 'lucide-react'
import { BreathingAnimation, BreathingProgress } from './breathing-animation'
import { useBreathing } from '@/hooks/use-breathing'
import type { BreathingPattern } from '@/types/wellness'

interface BreathingExerciseCardProps {
  pattern: BreathingPattern
  onSelect: () => void
  className?: string
}

export function BreathingExerciseCard({
  pattern,
  onSelect,
  className,
}: BreathingExerciseCardProps) {
  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:scale-[1.02] hover:shadow-md',
        className
      )}
      onClick={onSelect}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl">
            {pattern.icon}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">{pattern.name}</h3>
            <p className="text-sm text-muted-foreground mb-2">
              {pattern.description}
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{pattern.duration} min</span>
              <span>-</span>
              <span>{pattern.cycles} ciclos</span>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="flex flex-wrap gap-1 mt-3">
          {pattern.benefits.map((benefit) => (
            <span
              key={benefit}
              className="px-2 py-0.5 rounded-full bg-muted text-xs text-muted-foreground"
            >
              {benefit}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

interface BreathingPlayerProps {
  pattern: BreathingPattern
  onClose: () => void
  className?: string
}

export function BreathingPlayer({
  pattern,
  onClose,
  className,
}: BreathingPlayerProps) {
  const breathing = useBreathing()

  // Auto-start when mounted
  if (!breathing.isActive && !breathing.isPaused) {
    breathing.start(pattern)
  }

  const handleClose = () => {
    breathing.stop()
    onClose()
  }

  const handleTogglePause = () => {
    if (breathing.isPaused) {
      breathing.resume()
    } else {
      breathing.pause()
    }
  }

  const handleRestart = () => {
    breathing.stop()
    setTimeout(() => breathing.start(pattern), 100)
  }

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 bg-background flex flex-col',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 safe-area-top">
        <Button variant="ghost" size="icon" onClick={handleClose}>
          <X className="h-5 w-5" />
        </Button>
        <h2 className="font-semibold">{pattern.name}</h2>
        <div className="w-10" /> {/* Spacer */}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <BreathingAnimation
          phase={breathing.currentPhase}
          phaseDuration={
            breathing.currentPattern?.phases[
              breathing.currentPhase === 'idle'
                ? 'inhale'
                : breathing.currentPhase
            ] || 0
          }
          phaseTimeRemaining={breathing.phaseTimeRemaining}
          pattern={pattern}
          size="lg"
        />

        {/* Progress */}
        <div className="w-full max-w-sm mt-12">
          <BreathingProgress
            currentCycle={breathing.currentCycle}
            totalCycles={breathing.totalCycles}
            progress={breathing.progress}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="p-6 safe-area-bottom">
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="icon"
            className="h-14 w-14 rounded-full"
            onClick={handleRestart}
          >
            <RotateCcw className="h-6 w-6" />
          </Button>

          <Button
            size="icon"
            className="h-16 w-16 rounded-full"
            onClick={handleTogglePause}
          >
            {breathing.isPaused ? (
              <Play className="h-7 w-7" />
            ) : (
              <Pause className="h-7 w-7" />
            )}
          </Button>

          <div className="w-14" /> {/* Spacer for symmetry */}
        </div>
      </div>
    </div>
  )
}

interface BreathingCompleteProps {
  pattern: BreathingPattern
  duration: number
  onClose: () => void
  className?: string
}

export function BreathingComplete({
  pattern,
  duration,
  onClose,
  className,
}: BreathingCompleteProps) {
  const minutes = Math.floor(duration / 60)
  const seconds = duration % 60

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 bg-background flex flex-col items-center justify-center px-6',
        className
      )}
    >
      <div className="text-center space-y-6">
        <div className="text-6xl">🧘</div>
        <h1 className="text-2xl font-bold">Exercício Completo!</h1>
        <p className="text-lg text-muted-foreground">{pattern.name}</p>

        <div className="flex items-center justify-center gap-8 py-4">
          <div className="text-center">
            <p className="text-3xl font-bold">
              {minutes}:{seconds.toString().padStart(2, '0')}
            </p>
            <p className="text-sm text-muted-foreground">Duração</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold">{pattern.cycles}</p>
            <p className="text-sm text-muted-foreground">Ciclos</p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          Você praticou {pattern.benefits.join(', ').toLowerCase()}.
        </p>

        <Button size="lg" className="w-full max-w-xs" onClick={onClose}>
          Concluir
        </Button>
      </div>
    </div>
  )
}
