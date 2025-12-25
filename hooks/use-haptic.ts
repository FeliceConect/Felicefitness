'use client'

import { useCallback } from 'react'

type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error'

export function useHaptic() {
  const vibrate = useCallback((pattern: number | number[]) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern)
    }
  }, [])

  const haptic = useCallback((type: HapticType = 'light') => {
    const patterns: Record<HapticType, number | number[]> = {
      light: 10,
      medium: 20,
      heavy: 30,
      success: [10, 50, 10],
      warning: [20, 30, 20],
      error: [30, 50, 30, 50, 30],
    }

    vibrate(patterns[type])
  }, [vibrate])

  // Wrapper para eventos com haptic
  const withHaptic = useCallback(<T extends (...args: unknown[]) => unknown>(
    fn: T,
    type: HapticType = 'light'
  ) => {
    return (...args: Parameters<T>) => {
      haptic(type)
      return fn(...args)
    }
  }, [haptic])

  return { haptic, vibrate, withHaptic }
}

// Hook para componentes com haptic automatico
export function useHapticButton(type: HapticType = 'light') {
  const { haptic } = useHaptic()

  return {
    onTouchStart: () => haptic(type),
  }
}
