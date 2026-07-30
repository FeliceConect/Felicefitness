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
 * TRAVA DE SANIDADE: variações fisicamente impossíveis entre duas medições
 * (ex.: +6,9 kg de músculo) são quase sempre erro de digitação ou medições
 * incompatíveis. Cada métrica fora dos limites plausíveis é IGNORADA (0 pts) e
 * sinalizada no motivo, em vez de pontuar valores absurdos.
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

// Limites de plausibilidade da variação entre DUAS medições. Acima disso, a
// métrica é ignorada (não pontua) e marcada para revisão. Generosos de propósito
// — só pegam erro grosseiro, nunca uma evolução real.
const MAX_PLAUSIBLE_FAT_KG = 15
const MAX_PLAUSIBLE_MUSCLE_KG = 5
const MAX_PLAUSIBLE_VISCERAL = 5

export const BIO_POINT_RULES = {
  FAT_PTS_PER_KG,
  MUSCLE_PTS_PER_KG,
  VISCERAL_PTS_PER_POINT,
  MAX_PLAUSIBLE_FAT_KG,
  MAX_PLAUSIBLE_MUSCLE_KG,
  MAX_PLAUSIBLE_VISCERAL,
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

  const flags: string[] = []

  // Δ gordura: perder gordura = positivo. (anterior - novo)
  let delta_gordura_kg: number | null = null
  let pts_gordura = 0
  if (previous.massa_gordura_kg != null && current.massa_gordura_kg != null) {
    delta_gordura_kg = round2(previous.massa_gordura_kg - current.massa_gordura_kg)
    if (Math.abs(delta_gordura_kg) > MAX_PLAUSIBLE_FAT_KG) {
      flags.push('gordura')
    } else {
      pts_gordura = Math.round(delta_gordura_kg * FAT_PTS_PER_KG)
    }
  }

  // Δ massa muscular: ganhar músculo = positivo. (novo - anterior)
  let delta_muscular_kg: number | null = null
  let pts_muscular = 0
  if (previous.massa_muscular_esqueletica_kg != null && current.massa_muscular_esqueletica_kg != null) {
    delta_muscular_kg = round2(current.massa_muscular_esqueletica_kg - previous.massa_muscular_esqueletica_kg)
    if (Math.abs(delta_muscular_kg) > MAX_PLAUSIBLE_MUSCLE_KG) {
      flags.push('músculo')
    } else {
      pts_muscular = Math.round(delta_muscular_kg * MUSCLE_PTS_PER_KG)
    }
  }

  // Δ visceral: perder = positivo. (anterior - novo)
  let delta_visceral: number | null = null
  let pts_visceral = 0
  if (previous.gordura_visceral != null && current.gordura_visceral != null) {
    delta_visceral = round2(previous.gordura_visceral - current.gordura_visceral)
    if (Math.abs(delta_visceral) > MAX_PLAUSIBLE_VISCERAL) {
      flags.push('visceral')
    } else {
      pts_visceral = Math.round(delta_visceral * VISCERAL_PTS_PER_POINT)
    }
  }

  const total = pts_gordura + pts_muscular + pts_visceral

  let reason = buildReason({ delta_gordura_kg, delta_muscular_kg, delta_visceral, total, pts_gordura, pts_muscular, pts_visceral })
  if (flags.length > 0) {
    reason += ` [revisar: variação implausível ignorada em ${flags.join(', ')}]`
  }

  return {
    delta_gordura_kg,
    delta_muscular_kg,
    delta_visceral,
    pts_gordura,
    pts_muscular,
    pts_visceral,
    total,
    reason,
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

/**
 * Monta o texto do lançamento.
 *
 * Cada métrica traz os pontos que ela própria gerou, entre parênteses. Sem isso
 * o texto ficava ambíguo: em "Melhora bioimpedância: -0.1kg gordura, -0.5kg
 * músculo", os dois "-" significam a mesma coisa (a métrica caiu) mas têm sinais
 * OPOSTOS na pontuação — perder gordura pontua, perder músculo penaliza. Dava a
 * impressão de erro de cálculo quando o total era positivo apesar da perda de
 * músculo. Com os pontos por métrica, a conta fica visível na própria linha.
 */
function buildReason(p: Omit<PointsBreakdown, 'reason'>): string {
  const parts: string[] = []
  const pts = (n: number) => `${n > 0 ? '+' : ''}${n}`
  if (p.delta_gordura_kg != null && p.pts_gordura !== 0) {
    // delta positivo = perdeu gordura
    const sign = p.delta_gordura_kg > 0 ? '-' : '+'
    parts.push(`gordura ${sign}${Math.abs(p.delta_gordura_kg)}kg (${pts(p.pts_gordura)})`)
  }
  if (p.delta_muscular_kg != null && p.pts_muscular !== 0) {
    // delta positivo = ganhou músculo
    const sign = p.delta_muscular_kg > 0 ? '+' : '-'
    parts.push(`músculo ${sign}${Math.abs(p.delta_muscular_kg)}kg (${pts(p.pts_muscular)})`)
  }
  if (p.delta_visceral != null && p.pts_visceral !== 0) {
    // delta positivo = perdeu nível de visceral
    const sign = p.delta_visceral > 0 ? '-' : '+'
    parts.push(`visceral ${sign}${Math.abs(p.delta_visceral)} (${pts(p.pts_visceral)})`)
  }
  const prefix = p.total >= 0 ? 'Melhora bioimpedância' : 'Piora bioimpedância'
  return parts.length > 0 ? `${prefix}: ${parts.join(', ')}` : prefix
}
