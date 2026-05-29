/**
 * Calculador de pontos da evolução de bioimpedância.
 *
 * Regras definidas por Leonardo (Complexo Felice):
 * - Perda de GORDURA (massa de gordura): +10 pts por cada 1 kg perdido (ganhar = -10 pts/kg)
 * - Ganho de massa muscular esquelética: +15 pts por cada 1 kg (perder = -15 pts/kg)
 * - Perda de gordura visceral: +20 pts por cada 1 nível perdido (ganhar = -20 pts/nível)
 *
 * NÃO pontua peso isolado de propósito: peso = gordura + músculo + água, então
 * pontuar peso premiaria perda de músculo e penalizaria ganho de músculo, além de
 * contar em dobro com a gordura. A massa de gordura isola a evolução real.
 *
 * Valores fracionários são proporcionais (ex: -0,5 kg gordura → +5 pts).
 * O total final é arredondado para inteiro e PODE SER NEGATIVO (regressão penaliza).
 */

export interface BioSnapshot {
  massa_gordura_kg: number | null
  massa_muscular_esqueletica_kg: number | null
  gordura_visceral: number | null
}

export interface PointsBreakdown {
  delta_gordura_kg: number | null
  delta_muscular_kg: number | null
  delta_visceral: number | null
  pts_gordura: number
  pts_muscular: number
  pts_visceral: number
  total: number
  reason: string
}

const FAT_PTS_PER_KG = 10
const MUSCLE_PTS_PER_KG = 15
const VISCERAL_PTS_PER_POINT = 20

export const BIO_POINT_RULES = {
  FAT_PTS_PER_KG,
  MUSCLE_PTS_PER_KG,
  VISCERAL_PTS_PER_POINT,
} as const

/**
 * Calcula pontos ganhos/perdidos comparando duas medições.
 * Retorna null se não houver base de comparação (sem anterior).
 */
export function calculateBioimpedancePoints(
  previous: BioSnapshot | null | undefined,
  current: BioSnapshot
): PointsBreakdown | null {
  if (!previous) return null

  // Δ gordura: perder gordura = positivo. (anterior - novo)
  let delta_gordura_kg: number | null = null
  let pts_gordura = 0
  if (previous.massa_gordura_kg != null && current.massa_gordura_kg != null) {
    delta_gordura_kg = round2(previous.massa_gordura_kg - current.massa_gordura_kg)
    pts_gordura = Math.round(delta_gordura_kg * FAT_PTS_PER_KG)
  }

  // Δ massa muscular: ganhar músculo = positivo. (novo - anterior)
  let delta_muscular_kg: number | null = null
  let pts_muscular = 0
  if (previous.massa_muscular_esqueletica_kg != null && current.massa_muscular_esqueletica_kg != null) {
    delta_muscular_kg = round2(current.massa_muscular_esqueletica_kg - previous.massa_muscular_esqueletica_kg)
    pts_muscular = Math.round(delta_muscular_kg * MUSCLE_PTS_PER_KG)
  }

  // Δ visceral: perder = positivo. (anterior - novo)
  let delta_visceral: number | null = null
  let pts_visceral = 0
  if (previous.gordura_visceral != null && current.gordura_visceral != null) {
    delta_visceral = round2(previous.gordura_visceral - current.gordura_visceral)
    pts_visceral = Math.round(delta_visceral * VISCERAL_PTS_PER_POINT)
  }

  const total = pts_gordura + pts_muscular + pts_visceral

  return {
    delta_gordura_kg,
    delta_muscular_kg,
    delta_visceral,
    pts_gordura,
    pts_muscular,
    pts_visceral,
    total,
    reason: buildReason({ delta_gordura_kg, delta_muscular_kg, delta_visceral, total, pts_gordura, pts_muscular, pts_visceral }),
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function buildReason(p: Omit<PointsBreakdown, 'reason'>): string {
  const parts: string[] = []
  if (p.delta_gordura_kg != null && p.pts_gordura !== 0) {
    const sign = p.delta_gordura_kg > 0 ? '-' : '+'
    parts.push(`${sign}${Math.abs(p.delta_gordura_kg)}kg gordura`)
  }
  if (p.delta_muscular_kg != null && p.pts_muscular !== 0) {
    const sign = p.delta_muscular_kg > 0 ? '+' : '-'
    parts.push(`${sign}${Math.abs(p.delta_muscular_kg)}kg músculo`)
  }
  if (p.delta_visceral != null && p.pts_visceral !== 0) {
    const sign = p.delta_visceral > 0 ? '-' : '+'
    parts.push(`${sign}${Math.abs(p.delta_visceral)} visceral`)
  }
  const prefix = p.total >= 0 ? 'Melhora bioimpedância' : 'Piora bioimpedância'
  return parts.length > 0 ? `${prefix}: ${parts.join(', ')}` : prefix
}
