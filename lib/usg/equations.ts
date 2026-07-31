/**
 * Equações de densidade corporal e conversão para percentual de gordura.
 *
 * ATENÇÃO — as equações de Jackson & Pollock foram desenvolvidas e validadas
 * para DOBRA CUTÂNEA medida com adipômetro: dobra dupla, comprimida, incluindo
 * a pele. O ultrassom mede uma camada única, não comprimida. Por isso a
 * espessura de ultrassom passa obrigatoriamente por `lib/usg/conversion.ts`
 * antes de entrar aqui, e o resultado é sempre tratado como ESTIMATIVA.
 *
 * Os coeficientes abaixo são trava de regressão: mudar qualquer número aqui
 * muda o resultado clínico de todos os pacientes. Existe teste que os fixa.
 */

import type {
  DensityEquation,
  DensityEquationId,
  FatFormula,
  FatFormulaId,
  UsgProtocolCode,
  UsgSexo,
} from './types'
import { getProtocol } from './protocols'

/** DC = a − b·Σ + c·Σ² − d·idade  (Σ em mm de dobra equivalente, idade em anos) */
export const DENSITY_EQUATIONS: Readonly<
  Record<DensityEquationId, DensityEquation>
> = {
  jp7_h: {
    id: 'jp7_h',
    label: 'Jackson & Pollock 7 sítios — homens',
    sexo: 'masculino',
    sites: [
      'peitoral',
      'axilar_media',
      'triceps',
      'subescapular',
      'abdominal',
      'suprailiaca',
      'coxa',
    ],
    a: 1.112,
    b: 0.00043499,
    c: 0.00000055,
    d: 0.00028826,
    idadeValidaMin: 18,
    idadeValidaMax: 61,
    fonte: 'Jackson & Pollock (1978)',
  },
  jp7_m: {
    id: 'jp7_m',
    label: 'Jackson & Pollock 7 sítios — mulheres',
    sexo: 'feminino',
    sites: [
      'peitoral',
      'axilar_media',
      'triceps',
      'subescapular',
      'abdominal',
      'suprailiaca',
      'coxa',
    ],
    a: 1.097,
    b: 0.00046971,
    c: 0.00000056,
    d: 0.00012828,
    idadeValidaMin: 18,
    idadeValidaMax: 55,
    fonte: 'Jackson, Pollock & Ward (1980)',
  },
  jp3_h: {
    id: 'jp3_h',
    label: 'Jackson & Pollock 3 sítios — homens',
    sexo: 'masculino',
    sites: ['peitoral', 'abdominal', 'coxa'],
    a: 1.10938,
    b: 0.0008267,
    c: 0.0000016,
    d: 0.0002574,
    idadeValidaMin: 18,
    idadeValidaMax: 61,
    fonte: 'Jackson & Pollock (1978)',
  },
  jp3_m: {
    id: 'jp3_m',
    label: 'Jackson & Pollock 3 sítios — mulheres',
    sexo: 'feminino',
    sites: ['triceps', 'suprailiaca', 'coxa'],
    a: 1.0994921,
    b: 0.0009929,
    c: 0.0000023,
    d: 0.0001392,
    idadeValidaMin: 18,
    idadeValidaMax: 55,
    fonte: 'Jackson, Pollock & Ward (1980)',
  },
} as const

/** %G = (k1/DC − k2)·100 */
export const FAT_FORMULAS: Readonly<Record<FatFormulaId, FatFormula>> = {
  siri: {
    id: 'siri',
    label: 'Siri',
    k1: 4.95,
    k2: 4.5,
    fonte: 'Siri (1961)',
  },
  brozek: {
    id: 'brozek',
    label: 'Brozek',
    k1: 4.57,
    k2: 4.142,
    fonte: 'Brozek et al. (1963)',
  },
} as const

/**
 * Somatório a partir do qual a equação deixa de ser monotônica.
 *
 * As equações de Jackson & Pollock são quadráticas em Σ, com o termo de segundo
 * grau positivo: existe um vértice além do qual um paciente MAIS gordo receberia
 * um percentual MENOR. Isso é artefato matemático, não fisiologia — as equações
 * nunca foram validadas para adiposidade tão alta. Passando desse ponto, o
 * motor prefere não estimar a estimar ao contrário.
 *
 * Vértice = b / (2c). Para JP3 mulheres dá ~216 mm de dobra equivalente, que é
 * alcançável na prática; para JP7 homens, ~395 mm.
 */
export function validitySumLimit(eq: DensityEquation): number {
  return eq.b / (2 * eq.c)
}

/**
 * Densidade corporal a partir do somatório de dobras equivalentes.
 * Retorna null se a entrada for inválida ou o resultado não for fisicamente
 * plausível — densidade fora de 0,9 a 1,15 g/cm³ é erro de cálculo, não paciente.
 */
export function bodyDensity(
  eq: DensityEquation,
  sumMm: number,
  idade: number
): number | null {
  if (!Number.isFinite(sumMm) || !Number.isFinite(idade)) return null
  if (sumMm <= 0 || idade <= 0) return null

  const dc = eq.a - eq.b * sumMm + eq.c * sumMm * sumMm - eq.d * idade

  if (!Number.isFinite(dc) || dc < 0.9 || dc > 1.15) return null
  return dc
}

/** Percentual de gordura a partir da densidade corporal. */
export function percentFatFromDensity(
  dc: number,
  formula: FatFormula
): number | null {
  if (!Number.isFinite(dc) || dc <= 0) return null
  const pct = (formula.k1 / dc - formula.k2) * 100
  return Number.isFinite(pct) ? pct : null
}

/** Equação do protocolo para o sexo informado, ou null se não houver. */
export function pickDensityEquation(
  protocolo: UsgProtocolCode,
  sexo: UsgSexo
): DensityEquationId | null {
  const byPeso = getProtocol(protocolo).densityEquationBySexo
  if (!byPeso) return null
  return byPeso[sexo] ?? null
}

export function getDensityEquation(id: DensityEquationId): DensityEquation {
  const eq = DENSITY_EQUATIONS[id]
  if (!eq) throw new Error(`Equação de densidade desconhecida: ${id}`)
  return eq
}

export function getFatFormula(id: FatFormulaId): FatFormula {
  const formula = FAT_FORMULAS[id]
  if (!formula) throw new Error(`Fórmula de gordura desconhecida: ${id}`)
  return formula
}
