/**
 * Faixas de referência de percentual de gordura corporal (ACSM), por sexo.
 *
 * Existe uma função equivalente em lib/body/references.ts, mas ela só tem
 * faixas MASCULINAS — herança do app pessoal, de quando havia um único
 * usuário. Numa clínica com maioria de pacientes mulheres isso classifica
 * errado, então o módulo de ultrassom traz as faixas corretas por sexo.
 *
 * Esta classificação é ferramenta CLÍNICA. A interface do paciente não exibe
 * a categoria (nem a palavra "obesidade"): ele vê tendência e contexto.
 */

import type { UsgSexo } from './types'

export type BodyFatCategory =
  | 'abaixo_essencial'
  | 'essencial'
  | 'atletico'
  | 'boa_forma'
  | 'aceitavel'
  | 'obesidade'

export interface BodyFatBand {
  categoria: BodyFatCategory
  label: string
  /** Limite inferior, inclusivo. */
  min: number
  /** Limite superior, exclusivo. Infinity na última faixa. */
  max: number
  cor: string
  descricao: string
}

const BANDS_MASCULINO: readonly BodyFatBand[] = [
  {
    categoria: 'abaixo_essencial',
    label: 'Abaixo do essencial',
    min: 0,
    max: 3,
    cor: '#a04045',
    descricao: 'Gordura abaixo do mínimo fisiológico. Requer atenção clínica.',
  },
  {
    categoria: 'essencial',
    label: 'Essencial',
    min: 3,
    max: 6,
    cor: '#c29863',
    descricao: 'No limite mínimo fisiológico.',
  },
  {
    categoria: 'atletico',
    label: 'Atlético',
    min: 6,
    max: 14,
    cor: '#7dad6a',
    descricao: 'Faixa de atletas.',
  },
  {
    categoria: 'boa_forma',
    label: 'Boa forma',
    min: 14,
    max: 18,
    cor: '#7dad6a',
    descricao: 'Faixa de boa condição física.',
  },
  {
    categoria: 'aceitavel',
    label: 'Aceitável',
    min: 18,
    max: 25,
    cor: '#c29863',
    descricao: 'Dentro do aceitável para a população geral.',
  },
  {
    categoria: 'obesidade',
    label: 'Obesidade',
    min: 25,
    max: Infinity,
    cor: '#a04045',
    descricao: 'Percentual compatível com obesidade.',
  },
] as const

const BANDS_FEMININO: readonly BodyFatBand[] = [
  {
    categoria: 'abaixo_essencial',
    label: 'Abaixo do essencial',
    min: 0,
    max: 9,
    cor: '#a04045',
    descricao: 'Gordura abaixo do mínimo fisiológico. Requer atenção clínica.',
  },
  {
    categoria: 'essencial',
    label: 'Essencial',
    min: 9,
    max: 12,
    cor: '#c29863',
    descricao: 'No limite mínimo fisiológico.',
  },
  {
    categoria: 'atletico',
    label: 'Atlético',
    min: 12,
    max: 20,
    cor: '#7dad6a',
    descricao: 'Faixa de atletas.',
  },
  {
    categoria: 'boa_forma',
    label: 'Boa forma',
    min: 20,
    max: 25,
    cor: '#7dad6a',
    descricao: 'Faixa de boa condição física.',
  },
  {
    categoria: 'aceitavel',
    label: 'Aceitável',
    min: 25,
    max: 30,
    cor: '#c29863',
    descricao: 'Dentro do aceitável para a população geral.',
  },
  {
    categoria: 'obesidade',
    label: 'Obesidade',
    min: 30,
    max: Infinity,
    cor: '#a04045',
    descricao: 'Percentual compatível com obesidade.',
  },
] as const

export const ACSM_BANDS: Readonly<Record<UsgSexo, readonly BodyFatBand[]>> = {
  masculino: BANDS_MASCULINO,
  feminino: BANDS_FEMININO,
}

export function getAcsmBands(sexo: UsgSexo): readonly BodyFatBand[] {
  return ACSM_BANDS[sexo]
}

/** Classifica o percentual estimado. Retorna null se não houver percentual. */
export function classifyBodyFat(
  percentual: number | null,
  sexo: UsgSexo
): BodyFatBand | null {
  if (percentual === null || !Number.isFinite(percentual)) return null
  const bands = getAcsmBands(sexo)
  return bands.find((b) => percentual >= b.min && percentual < b.max) ?? null
}
