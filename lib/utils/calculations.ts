/**
 * Calcula a pontuação diária (0-100)
 */
export interface DailyScoreData {
  treinoConcluido: boolean
  alimentacaoPercent: number    // 0-1
  aguaPercent: number           // 0-1
  sonoRegistrado: boolean
}

export function calculateDailyScore(data: DailyScoreData): number {
  let score = 0

  // Treino: 30 pontos
  if (data.treinoConcluido) score += 30

  // Alimentação: até 30 pontos
  score += Math.min(data.alimentacaoPercent, 1) * 30

  // Água: até 25 pontos
  score += Math.min(data.aguaPercent, 1) * 25

  // Sono: 15 pontos
  if (data.sonoRegistrado) score += 15

  return Math.round(score)
}

/**
 * Calcula porcentagem de progresso de água
 */
export function calculateWaterProgress(current: number, goal: number): number {
  if (goal <= 0) return 0
  return Math.min(current / goal, 1)
}

/**
 * Calcula porcentagem de progresso de calorias
 */
export function calculateCaloriesProgress(current: number, goal: number): number {
  if (goal <= 0) return 0
  return Math.min(current / goal, 1)
}

/**
 * Retorna a cor baseada no progresso
 */
export function getProgressColor(percent: number): string {
  if (percent < 0.5) return '#a04045'   // Erro
  if (percent < 0.8) return '#F59E0B'   // Amarelo
  if (percent < 1) return '#7dad6a'     // Sucesso
  return '#c29863'                       // Dourado (100%)
}

/**
 * Retorna a cor do streak
 */
export function getStreakColor(days: number): string {
  if (days === 0) return '#ae9b89'      // Nude
  if (days < 7) return '#F59E0B'        // Amarelo
  if (days < 30) return '#a04045'       // Vinho/Fogo
  return '#c29863'                       // Dourado (épico)
}

/**
 * Calcula calorias restantes
 */
export function calculateRemainingCalories(consumed: number, goal: number): number {
  return Math.max(0, goal - consumed)
}

/**
 * Verifica se é dia de descanso
 */
export function isRestDay(workoutDays: string[], currentDay: string): boolean {
  return !workoutDays.includes(currentDay.toLowerCase())
}
