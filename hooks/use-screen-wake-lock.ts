'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import type { UseScreenWakeLockReturn } from '@/types/immersive'

export function useScreenWakeLock(): UseScreenWakeLockReturn {
  const [isActive, setIsActive] = useState(false)
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)
  // Intenção do chamador: "esta tela quer ficar acesa". Sobrevive ao sistema
  // soltar o lock sozinho.
  const desejadoRef = useRef(false)

  const isSupported = typeof navigator !== 'undefined' && 'wakeLock' in navigator

  const request = useCallback(async () => {
    if (!isSupported) return

    desejadoRef.current = true

    try {
      wakeLockRef.current = await navigator.wakeLock.request('screen')
      setIsActive(true)

      wakeLockRef.current.addEventListener('release', () => {
        // Zerar a ref é o que permite reconquistar o lock ao voltar para a
        // aba. Sem isso, a primeira interrupção (uma notificação, uma troca de
        // app) desligava o wake lock para o resto da sessão.
        wakeLockRef.current = null
        setIsActive(false)
      })
    } catch (err) {
      console.error('Wake Lock error:', err)
    }
  }, [isSupported])

  const release = useCallback(async () => {
    desejadoRef.current = false
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
      // `desejadoRef` e não `isActive`: quando o sistema solta o lock, isActive
      // vira false, e exigir isActive aqui impediria justamente a retomada.
      if (document.visibilityState === 'visible' && desejadoRef.current && !wakeLockRef.current) {
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
