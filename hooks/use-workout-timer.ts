'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import type { UseWorkoutTimerReturn } from '@/types/immersive'

/**
 * Timer que funciona mesmo quando a tela do iOS é desligada.
 * Usa timestamps reais ao invés de depender apenas de setInterval.
 */
export function useWorkoutTimer(
  onComplete?: () => void,
  onTick?: (remaining: number) => void
): UseWorkoutTimerReturn {
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [totalTime, setTotalTime] = useState(0)
  const [isRunning, setIsRunning] = useState(false)

  // Refs para manter estado real do timer
  const endTimeRef = useRef<number | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const onCompleteRef = useRef(onComplete)
  const onTickRef = useRef(onTick)
  const hasCompletedRef = useRef(false)

  // Update refs when callbacks change
  useEffect(() => {
    onCompleteRef.current = onComplete
    onTickRef.current = onTick
  }, [onComplete, onTick])

  // Função para calcular tempo restante baseado no timestamp real
  const calculateRemaining = useCallback(() => {
    if (!endTimeRef.current) return 0
    const remaining = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000))
    return remaining
  }, [])

  // Função para verificar e atualizar o timer
  const checkTimer = useCallback(() => {
    const remaining = calculateRemaining()
    setTimeRemaining(remaining)

    if (remaining <= 0 && !hasCompletedRef.current && endTimeRef.current) {
      hasCompletedRef.current = true
      setIsRunning(false)
      endTimeRef.current = null

      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }

      onCompleteRef.current?.()
    } else if (remaining > 0) {
      onTickRef.current?.(remaining)
    }
  }, [calculateRemaining])

  // Verificar timer quando app volta ao foco (crucial para iOS)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && endTimeRef.current) {
        checkTimer()
      }
    }

    const handleFocus = () => {
      if (endTimeRef.current) {
        checkTimer()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)
    window.addEventListener('pageshow', handleFocus)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('pageshow', handleFocus)
    }
  }, [checkTimer])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  const start = useCallback((duration: number) => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    hasCompletedRef.current = false
    const now = Date.now()
    endTimeRef.current = now + (duration * 1000)

    setTotalTime(duration)
    setTimeRemaining(duration)
    setIsRunning(true)

    // Intervalo apenas para atualizar a UI, não para controlar o tempo
    intervalRef.current = setInterval(() => {
      const remaining = calculateRemaining()
      setTimeRemaining(remaining)

      if (remaining <= 0 && !hasCompletedRef.current) {
        hasCompletedRef.current = true
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
        setIsRunning(false)
        endTimeRef.current = null
        onCompleteRef.current?.()
      } else if (remaining > 0) {
        onTickRef.current?.(remaining)
      }
    }, 1000)
  }, [calculateRemaining])

  const pause = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    // Salvar tempo restante atual
    const remaining = calculateRemaining()
    setTimeRemaining(remaining)
    endTimeRef.current = null
    setIsRunning(false)
  }, [calculateRemaining])

  const resume = useCallback(() => {
    if (timeRemaining > 0 && !isRunning) {
      hasCompletedRef.current = false
      endTimeRef.current = Date.now() + (timeRemaining * 1000)
      setIsRunning(true)

      intervalRef.current = setInterval(() => {
        const remaining = calculateRemaining()
        setTimeRemaining(remaining)

        if (remaining <= 0 && !hasCompletedRef.current) {
          hasCompletedRef.current = true
          if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
          }
          setIsRunning(false)
          endTimeRef.current = null
          onCompleteRef.current?.()
        } else if (remaining > 0) {
          onTickRef.current?.(remaining)
        }
      }, 1000)
    }
  }, [timeRemaining, isRunning, calculateRemaining])

  const reset = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    hasCompletedRef.current = false
    endTimeRef.current = null
    setTimeRemaining(totalTime)
    setIsRunning(false)
  }, [totalTime])

  const skip = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    hasCompletedRef.current = true
    endTimeRef.current = null
    setTimeRemaining(0)
    setIsRunning(false)
    onCompleteRef.current?.()
  }, [])

  const progress = totalTime > 0 ? (totalTime - timeRemaining) / totalTime : 0

  return {
    timeRemaining,
    totalTime,
    isRunning,
    progress,
    start,
    pause,
    resume,
    reset,
    skip,
  }
}
