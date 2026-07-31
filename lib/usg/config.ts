/**
 * Configuração do cálculo de composição corporal por ultrassom.
 *
 * Constante em código, não variável de ambiente: é parâmetro clínico, precisa
 * ser versionado no git e revisado em pull request, não trocado no painel de
 * deploy sem rastro.
 *
 * `version` pina o COMPORTAMENTO do motor (regra de agregação, arredondamento,
 * regra do somatório). Toda avaliação grava a versão com que foi calculada,
 * junto dos números da conversão. Comportamento + números tornam o recálculo
 * retroativo auditável: dá para explicar exatamente por que um valor mudou.
 *
 * Ao mudar qualquer regra de cálculo, incremente a versão.
 */

import type { UsgCalcConfig } from './types'
import { USG_LINEAR_FACTOR, USG_LINEAR_OFFSET } from './conversion'

export const USG_CALC_CONFIG: Readonly<UsgCalcConfig> = {
  version: 'usg-v1',

  // Ver a justificativa numérica em lib/usg/conversion.ts.
  conversion: 'linear',
  linearFactor: USG_LINEAR_FACTOR,
  linearOffset: USG_LINEAR_OFFSET,

  fatFormula: 'siri',

  // Mediana: com três repetições, descarta o valor extremo — que quase sempre
  // é a medida em que se apertou demais o transdutor (força reduz a espessura
  // medida em até 36%). Com duas repetições, a mediana é a própria média.
  repAggregation: 'median',

  // Coeficiente de variação entre repetições acima do qual o sítio é
  // sinalizado para revisão. Não bloqueia o salvamento.
  cvWarnPercent: 5,

  // Trava de sanidade do resultado. Espelha o CHECK da tabela: fora disso é
  // erro de cálculo ou de digitação, não paciente.
  percentFatMin: 2,
  percentFatMax: 70,
} as const

/** Mescla um override parcial sobre o default da clínica. */
export function resolveConfig(
  override?: Partial<UsgCalcConfig>
): UsgCalcConfig {
  if (!override) return USG_CALC_CONFIG
  return { ...USG_CALC_CONFIG, ...override }
}

/**
 * Diferença máxima tolerada entre duas repetições do mesmo sítio, em mm, antes
 * de a interface sugerir uma terceira medida. Complementa o CV: em sítios
 * finos, 1 mm de diferença já é um CV alto sem ser clinicamente relevante.
 */
export const USG_REP_TOLERANCE_MM = 1.5

/**
 * Variação relativa contra o mesmo sítio da avaliação anterior que dispara
 * aviso de "confira o ponto". Não bloqueia.
 */
export const USG_DELTA_WARN_RATIO = 0.3
