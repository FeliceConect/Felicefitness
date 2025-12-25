// Vibration patterns for immersive workout mode

export const VIBRATION_PATTERNS = {
  // Curta - confirmação
  short: [50],

  // Dupla - alerta
  double: [50, 50, 50],

  // Tripla - atenção
  triple: [50, 50, 50, 50, 50],

  // Longa - PR!
  celebration: [100, 50, 100, 50, 100, 100, 50, 200],

  // Countdown tick
  tick: [20],

  // Timer complete
  timerComplete: [100, 100, 100],

  // Série concluída
  setComplete: [80],

  // Exercício concluído
  exerciseComplete: [100, 50, 100],

  // Treino concluído
  workoutComplete: [200, 100, 200, 100, 300],
} as const

export type VibrationPattern = keyof typeof VIBRATION_PATTERNS

// Check if vibration is supported
export function isVibrationSupported(): boolean {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator
}

// Vibrate with a pattern
export function vibrate(pattern: VibrationPattern): void {
  if (!isVibrationSupported()) return

  try {
    navigator.vibrate(VIBRATION_PATTERNS[pattern])
  } catch {
    // Ignore errors
  }
}

// Stop vibration
export function stopVibration(): void {
  if (!isVibrationSupported()) return

  try {
    navigator.vibrate(0)
  } catch {
    // Ignore errors
  }
}
