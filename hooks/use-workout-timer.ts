'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import type { UseWorkoutTimerReturn } from '@/types/immersive'

export function useWorkoutTimer(
  onComplete?: () => void,
  onTick?: (remaining: number) => void
): UseWorkoutTimerReturn {
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [totalTime, setTotalTime] = useState(0)
  const [isRunning, setIsRunning] = useState(false)

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const onCompleteRef = useRef(onComplete)
  const onTickRef = useRef(onTick)

  // Update refs when callbacks change
  useEffect(() => {
    onCompleteRef.current = onComplete
    onTickRef.current = onTick
  }, [onComplete, onTick])

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

    setTotalTime(duration)
    setTimeRemaining(duration)
    setIsRunning(true)

    intervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        const next = prev - 1

        if (next <= 0) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
          }
          setIsRunning(false)
          onCompleteRef.current?.()
          return 0
        }

        onTickRef.current?.(next)
        return next
      })
    }, 1000)
  }, [])

  const pause = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setIsRunning(false)
  }, [])

  const resume = useCallback(() => {
    if (timeRemaining > 0 && !isRunning) {
      setIsRunning(true)

      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          const next = prev - 1

          if (next <= 0) {
            if (intervalRef.current) {
              clearInterval(intervalRef.current)
              intervalRef.current = null
            }
            setIsRunning(false)
            onCompleteRef.current?.()
            return 0
          }

          onTickRef.current?.(next)
          return next
        })
      }, 1000)
    }
  }, [timeRemaining, isRunning])

  const reset = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setTimeRemaining(totalTime)
    setIsRunning(false)
  }, [totalTime])

  const skip = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
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
