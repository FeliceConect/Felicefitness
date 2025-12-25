'use client'

import { useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { X, Pause, Play, SkipForward, SkipBack } from 'lucide-react'
import { useMeditation } from '@/hooks/use-meditation'
import type { Meditation } from '@/types/wellness'

interface MeditationPlayerProps {
  meditation: Meditation
  onComplete: () => void
  onExit: () => void
  className?: string
}

export function MeditationPlayer({
  meditation,
  onComplete,
  onExit,
  className,
}: MeditationPlayerProps) {
  const {
    isActive,
    isPaused,
    currentStep,
    totalSteps,
    timeRemaining,
    progress,
    start,
    pause,
    resume,
    nextStep,
    previousStep,
    stop,
    currentStepText,
  } = useMeditation()

  // Start meditation when mounted
  useEffect(() => {
    start(meditation)
    return () => stop()
  }, [meditation, start, stop])

  // Handle completion
  useEffect(() => {
    if (isActive && timeRemaining === 0) {
      onComplete()
    }
  }, [isActive, timeRemaining, onComplete])

  const handleExit = () => {
    stop()
    onExit()
  }

  const handleTogglePause = () => {
    if (isPaused) {
      resume()
    } else {
      pause()
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
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
        <Button variant="ghost" size="icon" onClick={handleExit}>
          <X className="h-5 w-5" />
        </Button>
        <div className="w-10" />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        {/* Icon */}
        <div className="text-5xl mb-4">{meditation.icon}</div>

        {/* Title */}
        <h1 className="text-xl font-bold mb-8">{meditation.name}</h1>

        {/* Timer */}
        <div className="relative mb-8">
          <svg width="200" height="200" viewBox="0 0 200 200" className="-rotate-90">
            {/* Background circle */}
            <circle
              cx="100"
              cy="100"
              r="90"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-muted/20"
            />
            {/* Progress circle */}
            <circle
              cx="100"
              cy="100"
              r="90"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-primary"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 90}
              strokeDashoffset={2 * Math.PI * 90 * (1 - progress)}
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold tabular-nums">
              {formatTime(timeRemaining)}
            </span>
            <span className="text-sm text-muted-foreground">restante</span>
          </div>
        </div>

        {/* Current step */}
        {currentStepText && (
          <Card className="w-full max-w-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">
                  Passo {currentStep + 1} de {totalSteps}
                </span>
              </div>
              <p className="text-center text-lg">&quot;{currentStepText}&quot;</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Controls */}
      <div className="p-6 safe-area-bottom">
        <div className="flex items-center justify-center gap-4">
          {/* Previous step */}
          <Button
            variant="outline"
            size="icon"
            className="h-14 w-14 rounded-full"
            onClick={previousStep}
            disabled={currentStep === 0}
          >
            <SkipBack className="h-6 w-6" />
          </Button>

          {/* Play/Pause */}
          <Button
            size="icon"
            className="h-16 w-16 rounded-full"
            onClick={handleTogglePause}
          >
            {isPaused ? (
              <Play className="h-7 w-7" />
            ) : (
              <Pause className="h-7 w-7" />
            )}
          </Button>

          {/* Next step */}
          <Button
            variant="outline"
            size="icon"
            className="h-14 w-14 rounded-full"
            onClick={nextStep}
            disabled={currentStep >= totalSteps - 1}
          >
            <SkipForward className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </div>
  )
}

interface MeditationCompleteProps {
  meditation: Meditation
  duration: number
  onClose: () => void
  className?: string
}

export function MeditationComplete({
  meditation,
  duration,
  onClose,
  className,
}: MeditationCompleteProps) {
  const minutes = Math.floor(duration / 60)

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 bg-background flex flex-col items-center justify-center px-6',
        className
      )}
    >
      <div className="text-center space-y-6">
        <div className="text-6xl">{meditation.icon}</div>
        <h1 className="text-2xl font-bold">Meditação Completa!</h1>
        <p className="text-lg text-muted-foreground">{meditation.name}</p>

        <div className="py-4">
          <p className="text-4xl font-bold">{minutes}</p>
          <p className="text-sm text-muted-foreground">minutos de prática</p>
        </div>

        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          Excelente! A prática regular de meditação traz benefícios duradouros
          para sua mente e corpo.
        </p>

        <Button size="lg" className="w-full max-w-xs" onClick={onClose}>
          Concluir
        </Button>
      </div>
    </div>
  )
}
