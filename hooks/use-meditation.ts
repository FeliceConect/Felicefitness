'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { suggestMeditation } from '@/lib/wellness/meditations'
import { getTodayDateSP, getNowSaoPaulo } from '@/lib/utils/date'
import type { Meditation } from '@/types/wellness'

interface UseMeditationReturn {
  // Estado
  isActive: boolean
  isPaused: boolean
  currentStep: number
  totalSteps: number
  timeRemaining: number
  totalTime: number
  progress: number

  // Ações
  start: (meditation: Meditation) => void
  pause: () => void
  resume: () => void
  nextStep: () => void
  previousStep: () => void
  stop: () => void

  // Info
  currentMeditation: Meditation | null
  currentStepText: string | null

  // Histórico
  sessionsThisWeek: number
  totalMinutesThisWeek: number

  // Sugestão
  suggestedMeditation: Meditation | null

  loading: boolean
}

export function useMeditation(): UseMeditationReturn {
  const [isActive, setIsActive] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [currentMeditation, setCurrentMeditation] = useState<Meditation | null>(null)
  const [sessionsThisWeek, setSessionsThisWeek] = useState(0)
  const [totalMinutesThisWeek, setTotalMinutesThisWeek] = useState(0)
  const [suggested, setSuggested] = useState<Meditation | null>(null)
  const [loading, setLoading] = useState(true)

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(0)
  const supabase = createClient()

  // Load history and suggestion
  useEffect(() => {
    async function loadData() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        // Get sessions from last 7 days
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

        const { data: sessions } = await supabase
          .from('fitness_meditation_sessions')
          .select('*')
          .eq('user_id', user.id)
          .gte('created_at', sevenDaysAgo.toISOString()) as { data: Array<{ duracao_segundos: number }> | null }

        if (sessions) {
          setSessionsThisWeek(sessions.length)
          setTotalMinutesThisWeek(
            Math.round(sessions.reduce((sum, s) => sum + s.duracao_segundos, 0) / 60)
          )
        }

        // Get today's wellness check-in for suggestion (timezone SP)
        const today = getTodayDateSP()
        const { data: checkin } = await supabase
          .from('fitness_wellness_checkins')
          .select('*')
          .eq('user_id', user.id)
          .eq('data', today)
          .single() as { data: { humor: number; stress: number; energia: number } | null }

        if (checkin) {
          setSuggested(suggestMeditation(checkin.humor, checkin.stress, checkin.energia))
        } else {
          // Default suggestion
          setSuggested(suggestMeditation(3, 3, 3))
        }
      } catch (error) {
        console.error('Error loading meditation data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [supabase])

  // Start meditation
  const start = useCallback((meditation: Meditation) => {
    setCurrentMeditation(meditation)
    setIsActive(true)
    setIsPaused(false)
    setCurrentStep(0)
    setTimeRemaining(meditation.duration * 60)
    startTimeRef.current = Date.now()
  }, [])

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

  // Next step
  const nextStep = useCallback(() => {
    if (!currentMeditation?.steps) return

    setCurrentStep((prev) => {
      const next = prev + 1
      if (next >= currentMeditation.steps!.length) {
        return currentMeditation.steps!.length - 1
      }
      return next
    })
  }, [currentMeditation])

  // Previous step
  const previousStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(0, prev - 1))
  }, [])

  // Stop and save session
  const stop = useCallback(async () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    if (currentMeditation && isActive) {
      // Save session to database
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
          const duration = Math.floor((Date.now() - startTimeRef.current) / 1000)

          await supabase.from('fitness_meditation_sessions').insert({
            user_id: user.id,
            meditation_id: currentMeditation.id,
            duracao_segundos: duration,
            completado: timeRemaining <= 0,
          } as never)

          // Update local stats
          setSessionsThisWeek((prev) => prev + 1)
          setTotalMinutesThisWeek((prev) => prev + Math.round(duration / 60))
        }
      } catch (error) {
        console.error('Error saving meditation session:', error)
      }
    }

    setIsActive(false)
    setIsPaused(false)
    setCurrentStep(0)
    setTimeRemaining(0)
    setCurrentMeditation(null)
  }, [currentMeditation, isActive, timeRemaining, supabase])

  // Timer effect
  useEffect(() => {
    if (!isActive || isPaused) return

    intervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          stop()
          return 0
        }
        return prev - 1
      })

      // Auto advance steps based on time
      if (currentMeditation?.steps) {
        const totalTime = currentMeditation.duration * 60
        const elapsed = totalTime - timeRemaining
        const stepDuration = totalTime / currentMeditation.steps.length
        const expectedStep = Math.floor(elapsed / stepDuration)

        if (expectedStep > currentStep && expectedStep < currentMeditation.steps.length) {
          setCurrentStep(expectedStep)
        }
      }
    }, 1000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isActive, isPaused, currentMeditation, timeRemaining, currentStep, stop])

  // Derived values
  const totalTime = currentMeditation ? currentMeditation.duration * 60 : 0
  const progress = totalTime > 0 ? 1 - timeRemaining / totalTime : 0
  const totalSteps = currentMeditation?.steps?.length || 0
  const currentStepText = currentMeditation?.steps?.[currentStep] || null

  return {
    isActive,
    isPaused,
    currentStep,
    totalSteps,
    timeRemaining,
    totalTime,
    progress,
    start,
    pause,
    resume,
    nextStep,
    previousStep,
    stop,
    currentMeditation,
    currentStepText,
    sessionsThisWeek,
    totalMinutesThisWeek,
    suggestedMeditation: suggested,
    loading,
  }
}
