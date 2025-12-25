'use client'

import { useState, useRef, useCallback } from 'react'
import { useHaptic } from '@/hooks/use-haptic'

interface LongPressProps {
  children: React.ReactNode
  onLongPress: () => void
  duration?: number
  className?: string
}

export function LongPress({
  children,
  onLongPress,
  duration = 500,
  className,
}: LongPressProps) {
  const [isPressed, setIsPressed] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const { haptic } = useHaptic()

  const start = useCallback(() => {
    setIsPressed(true)
    timerRef.current = setTimeout(() => {
      haptic('medium')
      onLongPress()
      setIsPressed(false)
    }, duration)
  }, [duration, haptic, onLongPress])

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    setIsPressed(false)
  }, [])

  return (
    <div
      className={className}
      onMouseDown={start}
      onMouseUp={stop}
      onMouseLeave={stop}
      onTouchStart={start}
      onTouchEnd={stop}
      style={{
        transform: isPressed ? 'scale(0.98)' : 'scale(1)',
        transition: 'transform 0.1s ease',
      }}
    >
      {children}
    </div>
  )
}

// Hook version
export function useLongPress(
  onLongPress: () => void,
  options?: { duration?: number; onStart?: () => void; onEnd?: () => void }
) {
  const { duration = 500, onStart, onEnd } = options || {}
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const { haptic } = useHaptic()

  const start = useCallback(() => {
    onStart?.()
    timerRef.current = setTimeout(() => {
      haptic('medium')
      onLongPress()
    }, duration)
  }, [duration, haptic, onLongPress, onStart])

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    onEnd?.()
  }, [onEnd])

  return {
    onMouseDown: start,
    onMouseUp: stop,
    onMouseLeave: stop,
    onTouchStart: start,
    onTouchEnd: stop,
  }
}
