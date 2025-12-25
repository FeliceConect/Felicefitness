'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import type { UseScreenWakeLockReturn } from '@/types/immersive'

export function useScreenWakeLock(): UseScreenWakeLockReturn {
  const [isActive, setIsActive] = useState(false)
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)

  const isSupported = typeof navigator !== 'undefined' && 'wakeLock' in navigator

  const request = useCallback(async () => {
    if (!isSupported) return

    try {
      wakeLockRef.current = await navigator.wakeLock.request('screen')
      setIsActive(true)

      wakeLockRef.current.addEventListener('release', () => {
        setIsActive(false)
      })
    } catch (err) {
      console.error('Wake Lock error:', err)
    }
  }, [isSupported])

  const release = useCallback(async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release()
        wakeLockRef.current = null
        setIsActive(false)
      } catch (err) {
        console.error('Wake Lock release error:', err)
      }
    }
  }, [])

  // Re-acquire on visibility change
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && isActive && !wakeLockRef.current) {
        await request()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [isActive, request])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {})
      }
    }
  }, [])

  return { isSupported, isActive, request, release }
}
