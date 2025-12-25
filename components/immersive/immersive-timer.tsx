'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { SkipForward } from 'lucide-react'

interface ImmersiveTimerProps {
  timeRemaining: number
  totalTime: number
  isRunning: boolean
  onSkip: () => void
  showSkipButton?: boolean
  size?: 'small' | 'medium' | 'large'
  className?: string
}

export function ImmersiveTimer({
  timeRemaining,
  totalTime,
  isRunning,
  onSkip,
  showSkipButton = true,
  size = 'large',
  className,
}: ImmersiveTimerProps) {
  const [pulse, setPulse] = useState(false)

  // Pulse animation for last 5 seconds
  useEffect(() => {
    if (timeRemaining <= 5 && timeRemaining > 0 && isRunning) {
      setPulse(true)
      const timeout = setTimeout(() => setPulse(false), 300)
      return () => clearTimeout(timeout)
    }
  }, [timeRemaining, isRunning])

  const minutes = Math.floor(timeRemaining / 60)
  const seconds = timeRemaining % 60
  const progress = totalTime > 0 ? (totalTime - timeRemaining) / totalTime : 0

  const sizeClasses = {
    small: 'text-4xl',
    medium: 'text-6xl',
    large: 'text-8xl',
  }

  const circleSize = {
    small: 120,
    medium: 180,
    large: 260,
  }

  const strokeWidth = size === 'large' ? 8 : 6
  const radius = (circleSize[size] - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius

  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      {/* Circular progress */}
      <div className="relative">
        <svg
          width={circleSize[size]}
          height={circleSize[size]}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={circleSize[size] / 2}
            cy={circleSize[size] / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-muted/20"
          />
          {/* Progress circle */}
          <circle
            cx={circleSize[size] / 2}
            cy={circleSize[size] / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
            strokeLinecap="round"
            className={cn(
              'transition-all duration-1000',
              timeRemaining <= 5 ? 'text-orange-500' : 'text-primary'
            )}
          />
        </svg>

        {/* Timer text */}
        <div
          className={cn(
            'absolute inset-0 flex items-center justify-center',
            sizeClasses[size],
            'font-mono font-bold tabular-nums',
            pulse && 'animate-pulse text-orange-500'
          )}
        >
          {minutes > 0 ? (
            <span>
              {minutes}:{seconds.toString().padStart(2, '0')}
            </span>
          ) : (
            <span>{seconds}</span>
          )}
        </div>
      </div>

      {/* Skip button */}
      {showSkipButton && (
        <Button
          variant="ghost"
          size="lg"
          onClick={onSkip}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <SkipForward className="h-5 w-5" />
          Pular descanso
        </Button>
      )}
    </div>
  )
}
