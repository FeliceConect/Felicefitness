"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { playSound } from '@/lib/immersive/sounds'
import { timerNotificationService } from '@/lib/workout/timer-notifications'
// Removido backgroundAudioService - causa pausa na música do usuário no iOS
// Removido audioPlayerService - também pode interferir com música

interface UseRestTimerOptions {
  soundEnabled?: boolean
  vibrationEnabled?: boolean
  notificationsEnabled?: boolean
  onComplete?: () => void
}

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
  requestNotificationPermission: () => Promise<boolean>
}

/**
 * Timer de descanso que funciona mesmo quando a tela do iOS é desligada.
 * Usa timestamps reais ao invés de depender apenas de setInterval.
 */
export function useRestTimer(options?: UseRestTimerOptions | (() => void)): UseRestTimerReturn {
  // Support both old signature (onComplete callback) and new signature (options object)
  const resolvedOptions: UseRestTimerOptions = typeof options === 'function'
    ? { onComplete: options }
    : options || {}

  const {
    soundEnabled = true,
    vibrationEnabled = true,
    notificationsEnabled = true,
    onComplete
  } = resolvedOptions
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [totalTime, setTotalTime] = useState(0)
  const [isRunning, setIsRunning] = useState(false)

  // Refs para manter estado real do timer
  const endTimeRef = useRef<number | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const onCompleteRef = useRef(onComplete)
  const hasCompletedRef = useRef(false)

  // Manter referência atualizada do callback
  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

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

      // Tocar som ao completar (se habilitado)
      if (soundEnabled) {
        try {
          playSound('timerComplete', 0.8)
        } catch (e) {
          // Ignore audio errors
        }
      }

      // Vibrar ao completar (se habilitado)
      if (vibrationEnabled && navigator.vibrate) {
        navigator.vibrate([200, 100, 200, 100, 300])
      }

      onCompleteRef.current?.()
    } else if (remaining <= 3 && remaining > 0) {
      // Countdown beeps nos últimos 3 segundos (se som habilitado)
      if (soundEnabled) {
        try {
          playSound('countdown', 0.6)
        } catch (e) {
          // Ignore audio errors
        }
      }
    }
  }, [calculateRemaining, soundEnabled, vibrationEnabled])

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

  // Limpar intervalo ao desmontar
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  // Listener para mensagens do Service Worker (quando timer completa em background)
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return

    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'TIMER_COMPLETE') {
        console.log('[RestTimer] Recebido TIMER_COMPLETE do SW')
        // Tocar som quando o SW notifica que o timer completou
        if (soundEnabled) {
          try {
            // Usar apenas playSound que usa Web Audio API (não interfere com música)
            playSound('timerComplete', 1.0)
          } catch (e) {
            // Ignore
          }
        }
      }
    }

    navigator.serviceWorker.addEventListener('message', handleMessage)

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage)
    }
  }, [soundEnabled])

  const start = useCallback((seconds: number) => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    hasCompletedRef.current = false
    const now = Date.now()
    endTimeRef.current = now + (seconds * 1000)

    setTotalTime(seconds)
    setTimeRemaining(seconds)
    setIsRunning(true)

    // NOTA: Removido audioPlayerService e backgroundAudioService
    // Eles causavam pausa na música do usuário no iOS

    // Agendar notificação para quando o timer terminar
    if (notificationsEnabled) {
      timerNotificationService.scheduleNotification(seconds, {
        title: 'Descanso Finalizado!',
        body: 'Hora de voltar ao treino!',
        requireInteraction: true
      })
    }

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

        // Cancelar notificação agendada (já disparou ou será disparada pelo SW)
        timerNotificationService.cancelScheduledNotification()

        // Tocar som ao completar (se habilitado)
        // Usa apenas playSound com Web Audio API (não interfere com música)
        if (soundEnabled) {
          try {
            playSound('timerComplete', 1.0)
          } catch (e) {
            // Ignore audio errors
          }
        }

        // Vibrar ao completar (se habilitado) - Android apenas
        if (vibrationEnabled && typeof navigator !== 'undefined' && navigator.vibrate) {
          try {
            navigator.vibrate([200, 100, 200, 100, 300])
          } catch (e) {
            // Ignore - iOS não suporta
          }
        }

        onCompleteRef.current?.()
      } else if (remaining <= 3 && remaining > 0) {
        // Countdown beeps nos últimos 3 segundos (se som habilitado)
        if (soundEnabled) {
          try {
            playSound('countdown', 0.8)
          } catch (e) {
            // Ignore audio errors
          }
        }
      }
    }, 1000)
  }, [calculateRemaining, soundEnabled, vibrationEnabled, notificationsEnabled])

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

    // Cancelar notificação agendada
    timerNotificationService.cancelScheduledNotification()
  }, [calculateRemaining])

  const resume = useCallback(() => {
    if (timeRemaining > 0 && !isRunning) {
      hasCompletedRef.current = false
      endTimeRef.current = Date.now() + (timeRemaining * 1000)
      setIsRunning(true)

      // Reagendar notificação
      if (notificationsEnabled) {
        timerNotificationService.scheduleNotification(timeRemaining, {
          title: 'Descanso Finalizado!',
          body: 'Hora de voltar ao treino!',
          requireInteraction: true
        })
      }

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

          // Cancelar notificação agendada
          timerNotificationService.cancelScheduledNotification()

          // Tocar som ao completar (se habilitado)
          if (soundEnabled) {
            try {
              playSound('timerComplete', 1.0)
            } catch (e) {
              // Ignore audio errors
            }
          }

          // Vibrar ao completar (se habilitado) - Android apenas
          if (vibrationEnabled && typeof navigator !== 'undefined' && navigator.vibrate) {
            try {
              navigator.vibrate([200, 100, 200, 100, 300])
            } catch (e) {
              // Ignore - iOS não suporta
            }
          }

          onCompleteRef.current?.()
        } else if (remaining <= 3 && remaining > 0) {
          // Countdown beeps nos últimos 3 segundos (se som habilitado)
          if (soundEnabled) {
            try {
              playSound('countdown', 0.8)
            } catch (e) {
              // Ignore audio errors
            }
          }
        }
      }, 1000)
    }
  }, [timeRemaining, isRunning, calculateRemaining, soundEnabled, vibrationEnabled, notificationsEnabled])

  const skip = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    hasCompletedRef.current = true
    endTimeRef.current = null
    setTimeRemaining(0)
    setIsRunning(false)

    // Cancelar notificação agendada
    timerNotificationService.cancelScheduledNotification()

    onCompleteRef.current?.()
  }, [])

  const addTime = useCallback((seconds: number) => {
    if (endTimeRef.current) {
      endTimeRef.current += seconds * 1000
    }
    setTimeRemaining(prev => prev + seconds)
    setTotalTime(prev => prev + seconds)
  }, [])

  const reset = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    hasCompletedRef.current = false
    endTimeRef.current = null
    setTimeRemaining(totalTime)
    setIsRunning(false)

    // Cancelar notificação agendada
    timerNotificationService.cancelScheduledNotification()
  }, [totalTime])

  // Função para solicitar permissão de notificações
  const requestNotificationPermission = useCallback(async (): Promise<boolean> => {
    return timerNotificationService.ensurePermission()
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
    reset,
    requestNotificationPermission
  }
}
