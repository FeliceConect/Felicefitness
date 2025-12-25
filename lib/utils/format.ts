/**
 * Formata número com separador de milhar brasileiro
 * Ex: 1850 -> "1.850"
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value)
}

/**
 * Formata calorias
 * Ex: 1850 -> "1.850 kcal"
 */
export function formatCalories(value: number): string {
  return `${formatNumber(Math.round(value))} kcal`
}

/**
 * Formata gramas
 * Ex: 150 -> "150g"
 */
export function formatGrams(value: number): string {
  return `${Math.round(value)}g`
}

/**
 * Formata mililitros
 * Ex: 1500 -> "1.5L" ou "1500ml"
 */
export function formatWater(ml: number, useLiters: boolean = true): string {
  if (useLiters && ml >= 1000) {
    const liters = ml / 1000
    return `${liters.toFixed(1).replace('.', ',')}L`
  }
  return `${formatNumber(ml)}ml`
}

/**
 * Formata porcentagem
 * Ex: 0.75 -> "75%"
 */
export function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`
}

/**
 * Formata duração em minutos
 * Ex: 45 -> "45 min"
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}min`
}

/**
 * Formata peso
 * Ex: 75.5 -> "75,5 kg"
 */
export function formatWeight(kg: number): string {
  return `${kg.toFixed(1).replace('.', ',')} kg`
}

/**
 * Abrevia nome (pega primeiro e último nome)
 * Ex: "Leonardo da Silva" -> "Leonardo S."
 */
export function abbreviateName(fullName: string): string {
  const parts = fullName.trim().split(' ')
  if (parts.length === 1) return parts[0]
  const firstName = parts[0]
  const lastName = parts[parts.length - 1]
  return `${firstName} ${lastName.charAt(0)}.`
}

/**
 * Capitaliza primeira letra
 */
export function capitalize(str: string): string {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

/**
 * Formata streak
 * Ex: 12 -> "12 dias"
 */
export function formatStreak(days: number): string {
  if (days === 0) return 'Sem streak'
  if (days === 1) return '1 dia'
  return `${days} dias`
}
