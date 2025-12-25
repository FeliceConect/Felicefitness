'use client'

import { useState, useCallback, useEffect } from 'react'
import { playSound, preloadSounds } from '@/lib/immersive/sounds'
import { vibrate, isVibrationSupported } from '@/lib/immersive/vibration'
import { speak, isSpeechSupported, getRandomMotivation } from '@/lib/immersive/speech'

interface UseWorkoutAudioReturn {
  // Sons
  playBeep: () => void
  playSetComplete: () => void
  playExerciseComplete: () => void
  playWorkoutComplete: () => void
  playPR: () => void
  playCountdown: () => void

  // Vibração
  vibrateShort: () => void
  vibrateDouble: () => void
  vibrateCelebration: () => void
  vibrateTimerComplete: () => void

  // Voz
  speakText: (text: string) => void
  speakMotivation: () => void

  // Configurações
  soundEnabled: boolean
  setSoundEnabled: (enabled: boolean) => void
  vibrationEnabled: boolean
  setVibrationEnabled: (enabled: boolean) => void
  voiceEnabled: boolean
  setVoiceEnabled: (enabled: boolean) => void
  volume: number
  setVolume: (volume: number) => void

  // Status
  isSpeechSupported: boolean
  isVibrationSupported: boolean
}

export function useWorkoutAudio(): UseWorkoutAudioReturn {
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [vibrationEnabled, setVibrationEnabled] = useState(true)
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const [volume, setVolume] = useState(0.7)

  // Preload sounds on mount
  useEffect(() => {
    preloadSounds()
  }, [])

  // Sound functions
  const playBeep = useCallback(() => {
    if (soundEnabled) playSound('tick', volume)
  }, [soundEnabled, volume])

  const playSetComplete = useCallback(() => {
    if (soundEnabled) playSound('setComplete', volume)
  }, [soundEnabled, volume])

  const playExerciseComplete = useCallback(() => {
    if (soundEnabled) playSound('exerciseComplete', volume)
  }, [soundEnabled, volume])

  const playWorkoutComplete = useCallback(() => {
    if (soundEnabled) playSound('workoutComplete', volume)
  }, [soundEnabled, volume])

  const playPR = useCallback(() => {
    if (soundEnabled) playSound('newPR', volume)
  }, [soundEnabled, volume])

  const playCountdown = useCallback(() => {
    if (soundEnabled) playSound('countdown', volume)
  }, [soundEnabled, volume])

  // Vibration functions
  const vibrateShort = useCallback(() => {
    if (vibrationEnabled) vibrate('short')
  }, [vibrationEnabled])

  const vibrateDouble = useCallback(() => {
    if (vibrationEnabled) vibrate('double')
  }, [vibrationEnabled])

  const vibrateCelebration = useCallback(() => {
    if (vibrationEnabled) vibrate('celebration')
  }, [vibrationEnabled])

  const vibrateTimerComplete = useCallback(() => {
    if (vibrationEnabled) vibrate('timerComplete')
  }, [vibrationEnabled])

  // Voice functions
  const speakText = useCallback(
    (text: string) => {
      if (voiceEnabled) speak(text, { volume })
    },
    [voiceEnabled, volume]
  )

  const speakMotivation = useCallback(() => {
    if (voiceEnabled) speak(getRandomMotivation(), { volume })
  }, [voiceEnabled, volume])

  return {
    // Sons
    playBeep,
    playSetComplete,
    playExerciseComplete,
    playWorkoutComplete,
    playPR,
    playCountdown,

    // Vibração
    vibrateShort,
    vibrateDouble,
    vibrateCelebration,
    vibrateTimerComplete,

    // Voz
    speakText,
    speakMotivation,

    // Configurações
    soundEnabled,
    setSoundEnabled,
    vibrationEnabled,
    setVibrationEnabled,
    voiceEnabled,
    setVoiceEnabled,
    volume,
    setVolume,

    // Status
    isSpeechSupported: isSpeechSupported(),
    isVibrationSupported: isVibrationSupported(),
  }
}
