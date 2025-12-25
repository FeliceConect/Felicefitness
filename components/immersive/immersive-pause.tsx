'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Play, SkipForward, X, Clock } from 'lucide-react'

interface ImmersivePauseProps {
  elapsedTime: number
  onResume: () => void
  onSkipExercise: () => void
  onEnd: () => void
  className?: string
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function ImmersivePause({
  elapsedTime,
  onResume,
  onSkipExercise,
  onEnd,
  className,
}: ImmersivePauseProps) {
  return (
    <div
      className={cn(
        'fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center px-6',
        className
      )}
    >
      {/* Paused indicator */}
      <div className="text-center mb-8">
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
          <Clock className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-3xl font-bold mb-2">Pausado</h2>
        <p className="text-muted-foreground text-lg">
          Tempo de treino: {formatTime(elapsedTime)}
        </p>
      </div>

      {/* Actions */}
      <div className="w-full max-w-sm space-y-3">
        <Button
          size="lg"
          className="w-full h-14 text-lg font-semibold gap-2"
          onClick={onResume}
        >
          <Play className="h-5 w-5" />
          Continuar
        </Button>

        <Button
          variant="outline"
          size="lg"
          className="w-full h-14 text-lg gap-2"
          onClick={onSkipExercise}
        >
          <SkipForward className="h-5 w-5" />
          Pular exercício
        </Button>

        <Button
          variant="ghost"
          size="lg"
          className="w-full h-14 text-lg text-destructive hover:text-destructive gap-2"
          onClick={onEnd}
        >
          <X className="h-5 w-5" />
          Encerrar treino
        </Button>
      </div>
    </div>
  )
}
