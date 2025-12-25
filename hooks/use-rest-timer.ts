"use client"

import { useState, useEffect, useCallback, useRef } from 'react'

interface UseRestTimerReturn {
  timeRemaining: number
  isRunning: boolean
  progress: number // 0-100
  totalTime: number
  start: (seconds: number) => void
  pause: () => void
  resume: () => void
  skip: () => void
  addTime: (seconds: number) => void
  reset: () => void
}

export function useRestTimer(onComplete?: () => void): UseRestTimerReturn {
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [totalTime, setTotalTime] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const onCompleteRef = useRef(onComplete)

  // Manter referência atualizada do callback
  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  // Limpar intervalo ao desmontar
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  // Timer principal
  useEffect(() => {
    if (isRunning && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setIsRunning(false)
            // Vibrar ao completar
            if (navigator.vibrate) {
              navigator.vibrate([200, 100, 200])
            }
            onCompleteRef.current?.()
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
        }
      }
    }
  }, [isRunning, timeRemaining])

  const start = useCallback((seconds: number) => {
    setTotalTime(seconds)
    setTimeRemaining(seconds)
    setIsRunning(true)
  }, [])

  const pause = useCallback(() => {
    setIsRunning(false)
  }, [])

  const resume = useCallback(() => {
    if (timeRemaining > 0) {
      setIsRunning(true)
    }
  }, [timeRemaining])

  const skip = useCallback(() => {
    setIsRunning(false)
    setTimeRemaining(0)
    onCompleteRef.current?.()
  }, [])

  const addTime = useCallback((seconds: number) => {
    setTimeRemaining(prev => prev + seconds)
    setTotalTime(prev => prev + seconds)
  }, [])

  const reset = useCallback(() => {
    setIsRunning(false)
    setTimeRemaining(0)
    setTotalTime(0)
  }, [])

  const progress = totalTime > 0 ? ((totalTime - timeRemaining) / totalTime) * 100 : 0

  return {
    timeRemaining,
    isRunning,
    progress,
    totalTime,
    start,
    pause,
    resume,
    skip,
    addTime,
    reset
  }
}
