// Text-to-speech for immersive workout mode

interface SpeechOptions {
  rate?: number
  pitch?: number
  volume?: number
}

// Check if speech synthesis is supported
export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

// Speak text
export function speak(text: string, options?: SpeechOptions): void {
  if (!isSpeechSupported()) return

  try {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'pt-BR'
    utterance.rate = options?.rate ?? 1
    utterance.pitch = options?.pitch ?? 1
    utterance.volume = options?.volume ?? 1

    // Try to use Brazilian Portuguese voice
    const voices = window.speechSynthesis.getVoices()
    const ptBRVoice = voices.find((v) => v.lang === 'pt-BR')
    if (ptBRVoice) {
      utterance.voice = ptBRVoice
    }

    window.speechSynthesis.speak(utterance)
  } catch {
    // Ignore errors
  }
}

// Cancel speech
export function cancelSpeech(): void {
  if (!isSpeechSupported()) return

  try {
    window.speechSynthesis.cancel()
  } catch {
    // Ignore errors
  }
}

// Motivational phrases
export const MOTIVATIONAL_PHRASES = [
  'Vamos lá!',
  'Você consegue!',
  'Mais uma série!',
  'Foco!',
  'Deu bom!',
  'Excelente!',
  'É isso aí!',
  'Mandou bem!',
  'Continue assim!',
  'Força!',
  'Bora!',
  'Perfeito!',
]

// Get random motivational phrase
export function getRandomMotivation(): string {
  return MOTIVATIONAL_PHRASES[Math.floor(Math.random() * MOTIVATIONAL_PHRASES.length)]
}

// Announce exercise
export function announceExercise(name: string, setNumber: number, totalSets: number): void {
  speak(`${name}. Série ${setNumber} de ${totalSets}.`)
}

// Announce countdown
export function announceCountdown(seconds: number): void {
  if (seconds <= 3 && seconds > 0) {
    speak(String(seconds), { rate: 1.2 })
  }
}

// Announce rest complete
export function announceRestComplete(): void {
  speak('Descanso terminado. Vamos!', { rate: 1.1 })
}

// Announce PR
export function announcePR(exerciseName: string): void {
  speak(`Novo recorde pessoal em ${exerciseName}! Parabéns!`, { rate: 0.9 })
}

// Announce workout complete
export function announceWorkoutComplete(): void {
  speak('Treino concluído! Excelente trabalho!', { rate: 0.9 })
}
