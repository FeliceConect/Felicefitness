// Sound effects for immersive workout mode

export const SOUNDS = {
  // Timer
  tick: '/sounds/tick.mp3',
  countdown: '/sounds/countdown-beep.mp3',
  timerComplete: '/sounds/timer-complete.mp3',

  // Ações
  setComplete: '/sounds/set-complete.mp3',
  exerciseComplete: '/sounds/exercise-complete.mp3',
  workoutComplete: '/sounds/workout-complete.mp3',

  // Celebração
  newPR: '/sounds/new-pr-fanfare.mp3',

  // UI
  buttonPress: '/sounds/button-press.mp3',
} as const

export type SoundKey = keyof typeof SOUNDS

// Cache de áudio
const audioCache: Map<SoundKey, HTMLAudioElement> = new Map()

// Preload all sounds
export function preloadSounds(): void {
  if (typeof window === 'undefined') return

  Object.entries(SOUNDS).forEach(([key, src]) => {
    try {
      const audio = new Audio(src)
      audio.preload = 'auto'
      audioCache.set(key as SoundKey, audio)
    } catch {
      // Ignore errors during preload
    }
  })
}

// Play a sound
export function playSound(soundKey: SoundKey, volume = 0.7): void {
  if (typeof window === 'undefined') return

  try {
    // Create new audio instance for overlapping sounds
    const audio = new Audio(SOUNDS[soundKey])
    audio.volume = Math.max(0, Math.min(1, volume))
    audio.play().catch(() => {
      // Ignore autoplay errors
    })
  } catch {
    // Ignore errors
  }
}

// Play countdown beeps (3, 2, 1)
export function playCountdownBeeps(volume = 0.7): void {
  const intervals = [0, 1000, 2000]
  intervals.forEach((delay) => {
    setTimeout(() => playSound('countdown', volume), delay)
  })
}
