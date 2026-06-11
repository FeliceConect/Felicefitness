/**
 * Formata a referência "Último treino" de um exercício.
 *
 * - Isometria (isTime): reps guarda segundos → "45s"
 * - Com carga: "20kg × 12"
 * - Peso corporal (carga 0): "12 reps"
 */
export function formatLastSet(
  last: { weight: number; reps: number },
  isTime: boolean
): string {
  if (isTime) return `${last.reps}s`
  if (last.weight > 0) return `${last.weight}kg × ${last.reps}`
  return `${last.reps} reps`
}
