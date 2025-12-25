'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { getPhaseLabel, getPhaseColor } from '@/lib/wellness/breathing-patterns'
import type { BreathingPhase, BreathingPattern } from '@/types/wellness'

interface BreathingAnimationProps {
  phase: BreathingPhase
  phaseDuration: number
  phaseTimeRemaining: number
  pattern: BreathingPattern
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function BreathingAnimation({
  phase,
  phaseDuration,
  phaseTimeRemaining,
  pattern: _pattern,
  size = 'lg',
  className,
}: BreathingAnimationProps) {
  // pattern is used for future features like different animations per pattern
  void _pattern
  const [scale, setScale] = useState(1)

  const sizeConfig = {
    sm: { outer: 150, inner: 100, text: 'text-2xl', label: 'text-sm' },
    md: { outer: 200, inner: 140, text: 'text-4xl', label: 'text-base' },
    lg: { outer: 280, inner: 200, text: 'text-6xl', label: 'text-lg' },
  }

  const config = sizeConfig[size]

  // Animate scale based on phase
  useEffect(() => {
    if (phase === 'idle') {
      setScale(1)
      return
    }

    const progress = 1 - phaseTimeRemaining / phaseDuration

    switch (phase) {
      case 'inhale':
        // Expand from 0.6 to 1.2
        setScale(0.6 + progress * 0.6)
        break
      case 'holdIn':
        // Stay expanded
        setScale(1.2)
        break
      case 'exhale':
        // Contract from 1.2 to 0.6
        setScale(1.2 - progress * 0.6)
        break
      case 'holdOut':
        // Stay contracted
        setScale(0.6)
        break
    }
  }, [phase, phaseDuration, phaseTimeRemaining])

  const phaseLabel = getPhaseLabel(phase)
  const phaseColor = getPhaseColor(phase)

  return (
    <div
      className={cn('relative flex items-center justify-center', className)}
      style={{ width: config.outer, height: config.outer }}
    >
      {/* Outer guide circle */}
      <div
        className="absolute rounded-full border-2 border-dashed border-muted/30"
        style={{
          width: config.outer,
          height: config.outer,
        }}
      />

      {/* Inner guide circle (minimum) */}
      <div
        className="absolute rounded-full border border-muted/20"
        style={{
          width: config.inner * 0.5,
          height: config.inner * 0.5,
        }}
      />

      {/* Animated breathing circle */}
      <div
        className="absolute rounded-full transition-all duration-1000 ease-in-out flex items-center justify-center"
        style={{
          width: config.inner,
          height: config.inner,
          transform: `scale(${scale})`,
          backgroundColor: `${phaseColor}20`,
          border: `3px solid ${phaseColor}`,
          boxShadow: `0 0 30px ${phaseColor}40`,
        }}
      >
        {/* Center content */}
        <div className="flex flex-col items-center gap-2">
          <span
            className={cn('font-bold tabular-nums', config.text)}
            style={{ color: phaseColor }}
          >
            {phaseTimeRemaining}
          </span>
          <span
            className={cn('font-medium uppercase tracking-wider', config.label)}
            style={{ color: phaseColor }}
          >
            {phaseLabel}
          </span>
        </div>
      </div>

      {/* Glow effect */}
      <div
        className="absolute rounded-full blur-3xl opacity-20 -z-10 transition-all duration-1000"
        style={{
          width: config.inner * scale,
          height: config.inner * scale,
          backgroundColor: phaseColor,
        }}
      />
    </div>
  )
}

interface BreathingProgressProps {
  currentCycle: number
  totalCycles: number
  progress: number
  className?: string
}

export function BreathingProgress({
  currentCycle,
  totalCycles,
  progress,
  className,
}: BreathingProgressProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>
          Ciclo {currentCycle} de {totalCycles}
        </span>
        <span>{Math.round(progress * 100)}%</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </div>
  )
}
