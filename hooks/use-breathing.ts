'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { BreathingPattern, BreathingPhase } from '@/types/wellness'

interface UseBreathingReturn {
  // Estado
  isActive: boolean
  isPaused: boolean
  currentPhase: BreathingPhase
  currentCycle: number
  totalCycles: number
  phaseTimeRemaining: number
  totalTimeRemaining: number
  progress: number

  // Ações
  start: (pattern: BreathingPattern) => void
  pause: () => void
  resume: () => void
  stop: () => void

  // Pattern info
  currentPattern: BreathingPattern | null
}

export function useBreathing(): UseBreathingReturn {
  const [isActive, setIsActive] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [currentPhase, setCurrentPhase] = useState<BreathingPhase>('idle')
  const [currentCycle, setCurrentCycle] = useState(1)
  const [phaseTimeRemaining, setPhaseTimeRemaining] = useState(0)
  const [totalTimeRemaining, setTotalTimeRemaining] = useState(0)
  const [currentPattern, setCurrentPattern] = useState<BreathingPattern | null>(null)

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(0)
  const supabase = createClient()

  // Get phases in order (skip phases with 0 duration)
  const getPhaseOrder = useCallback((pattern: BreathingPattern): BreathingPhase[] => {
    const phases: BreathingPhase[] = []
    if (pattern.phases.inhale > 0) phases.push('inhale')
    if (pattern.phases.holdIn > 0) phases.push('holdIn')
    if (pattern.phases.exhale > 0) phases.push('exhale')
    if (pattern.phases.holdOut > 0) phases.push('holdOut')
    return phases
  }, [])

  // Get phase duration
  const getPhaseDuration = useCallback(
    (phase: BreathingPhase, pattern: BreathingPattern): number => {
      switch (phase) {
        case 'inhale':
          return pattern.phases.inhale
        case 'holdIn':
          return pattern.phases.holdIn
        case 'exhale':
          return pattern.phases.exhale
        case 'holdOut':
          return pattern.phases.holdOut
        default:
          return 0
      }
    },
    []
  )

  // Calculate total duration
  const calculateTotalDuration = useCallback((pattern: BreathingPattern): number => {
    const { inhale, holdIn, exhale, holdOut } = pattern.phases
    return (inhale + holdIn + exhale + holdOut) * pattern.cycles
  }, [])

  // Start exercise
  const start = useCallback(
    (pattern: BreathingPattern) => {
      setCurrentPattern(pattern)
      setIsActive(true)
      setIsPaused(false)
      setCurrentCycle(1)

      const phases = getPhaseOrder(pattern)
      const firstPhase = phases[0]
      setCurrentPhase(firstPhase)
      setPhaseTimeRemaining(getPhaseDuration(firstPhase, pattern))
      setTotalTimeRemaining(calculateTotalDuration(pattern))

      startTimeRef.current = Date.now()
    },
    [getPhaseOrder, getPhaseDuration, calculateTotalDuration]
  )

  // Pause
  const pause = useCallback(() => {
    setIsPaused(true)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  // Resume
  const resume = useCallback(() => {
    setIsPaused(false)
  }, [])

  // Stop and save session
  const stop = useCallback(async () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    if (currentPattern && isActive) {
      // Save session to database
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
          const duration = Math.floor((Date.now() - startTimeRef.current) / 1000)
          const cyclesCompleted = currentCycle - 1

          await supabase.from('fitness_breathing_sessions').insert({
            user_id: user.id,
            pattern_id: currentPattern.id,
            duracao_segundos: duration,
            ciclos_completados: cyclesCompleted,
            completado: cyclesCompleted >= currentPattern.cycles,
          } as never)
        }
      } catch (error) {
        console.error('Error saving breathing session:', error)
      }
    }

    setIsActive(false)
    setIsPaused(false)
    setCurrentPhase('idle')
    setCurrentCycle(1)
    setPhaseTimeRemaining(0)
    setTotalTimeRemaining(0)
    setCurrentPattern(null)
  }, [currentPattern, isActive, currentCycle, supabase])

  // Timer effect
  useEffect(() => {
    if (!isActive || isPaused || !currentPattern) return

    intervalRef.current = setInterval(() => {
      setPhaseTimeRemaining((prev) => {
        if (prev <= 1) {
          // Move to next phase
          const phases = getPhaseOrder(currentPattern)
          const currentIndex = phases.indexOf(currentPhase)
          const nextIndex = currentIndex + 1

          if (nextIndex >= phases.length) {
            // End of cycle
            setCurrentCycle((cycle) => {
              if (cycle >= currentPattern.cycles) {
                // Exercise complete
                stop()
                return cycle
              }
              return cycle + 1
            })

            // Start new cycle
            const firstPhase = phases[0]
            setCurrentPhase(firstPhase)
            return getPhaseDuration(firstPhase, currentPattern)
          } else {
            // Next phase in cycle
            const nextPhase = phases[nextIndex]
            setCurrentPhase(nextPhase)
            return getPhaseDuration(nextPhase, currentPattern)
          }
        }

        return prev - 1
      })

      setTotalTimeRemaining((prev) => Math.max(0, prev - 1))
    }, 1000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [
    isActive,
    isPaused,
    currentPattern,
    currentPhase,
    getPhaseOrder,
    getPhaseDuration,
    stop,
  ])

  // Calculate progress
  const progress = currentPattern
    ? 1 - totalTimeRemaining / calculateTotalDuration(currentPattern)
    : 0

  return {
    isActive,
    isPaused,
    currentPhase,
    currentCycle,
    totalCycles: currentPattern?.cycles || 0,
    phaseTimeRemaining,
    totalTimeRemaining,
    progress,
    start,
    pause,
    resume,
    stop,
    currentPattern,
  }
}
