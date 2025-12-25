'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { Dumbbell } from 'lucide-react'

interface ImmersivePreparingProps {
  workoutName: string
  exerciseCount: number
  onReady: () => void
  className?: string
}

export function ImmersivePreparing({
  workoutName,
  exerciseCount,
  onReady,
  className,
}: ImmersivePreparingProps) {
  const [countdown, setCountdown] = useState(3)
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    // Show content immediately
    setShowContent(true)

    // Start countdown
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          setTimeout(onReady, 500)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [onReady])

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 bg-background flex flex-col items-center justify-center px-6',
        className
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          'h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-8 transition-all duration-500',
          showContent ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
        )}
      >
        <Dumbbell className="h-10 w-10 text-primary" />
      </div>

      {/* Title */}
      <h2
        className={cn(
          'text-xl text-muted-foreground mb-4 transition-all duration-500 delay-100',
          showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        )}
      >
        PREPARAR
      </h2>

      {/* Countdown */}
      <div
        className={cn(
          'relative mb-8 transition-all duration-500 delay-200',
          showContent ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
        )}
      >
        <div
          className={cn(
            'h-32 w-32 rounded-full border-4 border-primary flex items-center justify-center transition-transform',
            countdown > 0 && 'animate-pulse'
          )}
        >
          <span className="text-6xl font-bold tabular-nums">
            {countdown > 0 ? countdown : '✓'}
          </span>
        </div>
      </div>

      {/* Workout info */}
      <div
        className={cn(
          'text-center transition-all duration-500 delay-300',
          showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        )}
      >
        <h1 className="text-2xl font-bold mb-2">{workoutName}</h1>
        <p className="text-muted-foreground">{exerciseCount} exercícios</p>
      </div>
    </div>
  )
}
