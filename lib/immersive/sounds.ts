// Sound effects for immersive workout mode using Web Audio API

export type SoundKey =
  | 'tick'
  | 'countdown'
  | 'timerComplete'
  | 'setComplete'
  | 'exerciseComplete'
  | 'workoutComplete'
  | 'newPR'
  | 'buttonPress'

// Audio context singleton
let audioContext: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null

  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    } catch {
      console.warn('Web Audio API not supported')
      return null
    }
  }

  // Resume if suspended (needed for iOS)
  if (audioContext.state === 'suspended') {
    audioContext.resume()
  }

  return audioContext
}

// Preload sounds (just initialize audio context)
export function preloadSounds(): void {
  getAudioContext()
}

// Play a beep tone with specific frequency and duration
function playTone(
  frequency: number,
  duration: number,
  volume: number,
  type: OscillatorType = 'sine'
): void {
  const ctx = getAudioContext()
  if (!ctx) return

  try {
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.frequency.value = frequency
    oscillator.type = type

    // Apply volume with envelope to avoid clicks
    const now = ctx.currentTime
    gainNode.gain.setValueAtTime(0, now)
    gainNode.gain.linearRampToValueAtTime(volume, now + 0.01)
    gainNode.gain.linearRampToValueAtTime(volume * 0.7, now + duration * 0.7)
    gainNode.gain.linearRampToValueAtTime(0, now + duration)

    oscillator.start(now)
    oscillator.stop(now + duration)
  } catch {
    // Ignore errors
  }
}

// Play multiple tones in sequence
function playToneSequence(
  tones: Array<{ freq: number; dur: number; delay: number }>,
  volume: number
): void {
  tones.forEach(({ freq, dur, delay }) => {
    setTimeout(() => playTone(freq, dur, volume), delay)
  })
}

// Play a sound effect
export function playSound(soundKey: SoundKey, volume = 0.7): void {
  if (typeof window === 'undefined') return

  const vol = Math.max(0, Math.min(1, volume))

  switch (soundKey) {
    case 'tick':
      playTone(800, 0.05, vol * 0.5, 'sine')
      break

    case 'countdown':
      playTone(880, 0.15, vol, 'sine')
      break

    case 'timerComplete':
      // Three ascending beeps
      playToneSequence([
        { freq: 660, dur: 0.15, delay: 0 },
        { freq: 880, dur: 0.15, delay: 180 },
        { freq: 1100, dur: 0.25, delay: 360 },
      ], vol)
      break

    case 'setComplete':
      // Quick double beep
      playToneSequence([
        { freq: 880, dur: 0.1, delay: 0 },
        { freq: 1100, dur: 0.15, delay: 120 },
      ], vol)
      break

    case 'exerciseComplete':
      // Triumphant three-tone
      playToneSequence([
        { freq: 523, dur: 0.15, delay: 0 },      // C
        { freq: 659, dur: 0.15, delay: 150 },    // E
        { freq: 784, dur: 0.3, delay: 300 },     // G
      ], vol)
      break

    case 'workoutComplete':
      // Victory fanfare
      playToneSequence([
        { freq: 523, dur: 0.2, delay: 0 },       // C
        { freq: 659, dur: 0.2, delay: 200 },     // E
        { freq: 784, dur: 0.2, delay: 400 },     // G
        { freq: 1047, dur: 0.4, delay: 600 },    // High C
      ], vol)
      break

    case 'newPR':
      // PR celebration fanfare
      playToneSequence([
        { freq: 523, dur: 0.15, delay: 0 },
        { freq: 659, dur: 0.15, delay: 100 },
        { freq: 784, dur: 0.15, delay: 200 },
        { freq: 1047, dur: 0.15, delay: 300 },
        { freq: 784, dur: 0.15, delay: 400 },
        { freq: 1047, dur: 0.4, delay: 500 },
      ], vol)
      break

    case 'buttonPress':
      playTone(600, 0.05, vol * 0.3, 'sine')
      break
  }
}

// Play countdown beeps (3, 2, 1)
export function playCountdownBeeps(volume = 0.7): void {
  const intervals = [0, 1000, 2000]
  intervals.forEach((delay) => {
    setTimeout(() => playSound('countdown', volume), delay)
  })
}
