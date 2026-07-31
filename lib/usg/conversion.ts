/**
 * Conversão da espessura medida por ULTRASSOM para a entrada das equações de
 * DOBRA CUTÂNEA. Este é o único lugar do sistema onde essa tradução acontece —
 * de propósito, para que uma recalibração futura seja um diff de uma linha.
 *
 * O problema: o adipômetro mede uma dobra dupla, comprimida, incluindo duas
 * camadas de pele. O ultrassom mede uma camada única de gordura, sem
 * compressão. As equações de Jackson & Pollock esperam a primeira grandeza.
 *
 * As opções e o que cada uma produz (simulação com perfis plausíveis):
 *
 *   Cenário                    direto    2×      2×(mm+pele)   2×(mm+pele)×0,85
 *   Homem magro,   35a (37mm)   5,6%    11,4%      13,9%            11,9%
 *   Homem médio,   45a (77mm)  13,1%    23,6%      25,6%            22,6%
 *   Mulher média,  40a (49mm)  21,1%    35,9%      37,7%            33,6%
 *
 * `raw` produz valores fisiologicamente absurdos. Dobrar puro superestima —
 * é justamente a crítica de Wagner (2022, "Oversimplification of the
 * Relationship between Ultrasound and Skinfold Measurements"): a razão entre
 * ultrassom e dobra não é 1:2 e varia por sítio e por adiposidade.
 *
 * O default `linear` aplica 2×(mm + pele)×compressão, que na simulação cai a
 * menos de um ponto percentual do que um adipômetro daria no mesmo paciente.
 *
 * NENHUMA das conversões é validada contra padrão-ouro nesta população —
 * `validated` é false em todas, e é isso que faz a interface rotular o
 * percentual como estimativa. O que NÃO depende de conversão nenhuma, e por
 * isso é a métrica primária da feature, é o somatório em mm brutos.
 */

import type { UsgConversion, UsgConversionId } from './types'

/** Espessura estimada de UMA camada de pele, em mm. */
export const USG_SKIN_MM = 1.2

/** Fator de compressão aplicado pelo adipômetro sobre a dobra. */
export const USG_COMPRESSION = 0.85

/**
 * A dobra equivalente é 2 × (gordura + pele), depois comprimida:
 *   mm_eq = 2·(mm + pele)·compressão = (2·compressão)·mm + (2·pele·compressão)
 * o que é exatamente uma reta de fator 1,70 e offset 2,04.
 */
export const USG_LINEAR_FACTOR = 2 * USG_COMPRESSION
export const USG_LINEAR_OFFSET = 2 * USG_SKIN_MM * USG_COMPRESSION

export const USG_CONVERSIONS: Readonly<
  Record<UsgConversionId, UsgConversion>
> = {
  raw: {
    id: 'raw',
    label: 'Direta (mm de ultrassom)',
    factor: 1,
    offset: 0,
    validated: false,
    rationale:
      'Usa a espessura de ultrassom sem conversão. Subestima muito o percentual de gordura, porque a equação espera dobra dupla e comprimida.',
  },
  double: {
    id: 'double',
    label: 'Dobrada (2×)',
    factor: 2,
    offset: 0,
    validated: false,
    rationale:
      'Dobra a espessura para aproximar a dobra cutânea. Simples, mas tende a superestimar a massa gorda e ignora a espessura da pele.',
  },
  linear: {
    id: 'linear',
    label: 'Dobra equivalente (pele + compressão)',
    factor: USG_LINEAR_FACTOR,
    offset: USG_LINEAR_OFFSET,
    validated: false,
    rationale:
      'Estimativa: converte a espessura de ultrassom em dobra equivalente somando a pele e aplicando o fator de compressão do adipômetro. Ainda não calibrada contra método de referência nesta população.',
  },
} as const

export function getConversion(id: UsgConversionId): UsgConversion {
  const conv = USG_CONVERSIONS[id]
  if (!conv) throw new Error(`Conversão de ultrassom desconhecida: ${id}`)
  return conv
}

/**
 * Resolve a conversão efetiva. Fator e offset explícitos vencem o catálogo —
 * é assim que uma avaliação antiga continua reproduzindo o próprio número
 * mesmo depois de o default da clínica mudar.
 */
export function resolveConversion(
  id: UsgConversionId,
  factor?: number | null,
  offset?: number | null
): UsgConversion {
  const base = getConversion(id)
  return {
    ...base,
    factor: typeof factor === 'number' && Number.isFinite(factor) ? factor : base.factor,
    offset: typeof offset === 'number' && Number.isFinite(offset) ? offset : base.offset,
  }
}

/**
 * mm_equivalente = mm_bruto · factor + offset.
 *
 * Aplicada POR SÍTIO, antes do somatório. Só seria equivalente aplicar no
 * somatório se o offset fosse zero — e o nosso não é.
 */
export function toEquationEquivalentMm(
  rawMm: number,
  conv: Pick<UsgConversion, 'factor' | 'offset'>
): number {
  return rawMm * conv.factor + conv.offset
}
