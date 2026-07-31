/**
 * Tipos do módulo de avaliação de composição corporal por ULTRASSOM (modo B).
 *
 * PRINCÍPIO QUE GOVERNA O MÓDULO INTEIRO:
 * A espessura em milímetros medida em cada sítio é a fonte de verdade e é
 * imutável. Densidade corporal, percentual de gordura, massa gorda e massa
 * magra são DERIVADOS — versionados e recalculáveis a partir do bruto.
 * Nunca derive um derivado de outro derivado.
 */

// ---------------------------------------------------------------------------
// Vocabulário
// ---------------------------------------------------------------------------

/** Tecido medido no sítio. Músculo NUNCA entra na soma de gordura. */
export type UsgTecido = 'gordura' | 'musculo'

/** Lado do corpo. O protocolo ISAK manda medir sempre à direita. */
export type UsgLado = 'D' | 'E'

export type UsgSiteCode =
  // Sítios de gordura subcutânea
  | 'peitoral'
  | 'axilar_media'
  | 'triceps'
  | 'subescapular'
  | 'abdominal'
  | 'suprailiaca'
  | 'coxa'
  | 'panturrilha_medial'
  // Sítios de espessura muscular
  | 'reto_femoral'
  | 'vasto_lateral'
  | 'biceps_braquial'

export type UsgProtocolCode =
  | 'jp7'
  | 'jp3_homens'
  | 'jp3_mulheres'
  | 'muscular_basico'
  | 'livre'

export type UsgSexo = 'masculino' | 'feminino'

/** Identificador da equação de densidade corporal. */
export type DensityEquationId = 'jp7_h' | 'jp7_m' | 'jp3_h' | 'jp3_m'

/** Fórmula que converte densidade corporal em percentual de gordura. */
export type FatFormulaId = 'siri' | 'brozek'

/** Modo de conversão da espessura de ultrassom para a entrada da equação. */
export type UsgConversionId = 'raw' | 'double' | 'linear'

/** Regra de consolidação das repetições de um mesmo sítio. */
export type UsgRepAggregation = 'median' | 'mean' | 'max'

// ---------------------------------------------------------------------------
// Catálogo
// ---------------------------------------------------------------------------

export interface UsgSite {
  code: UsgSiteCode
  /** Nome clínico, usado no portal profissional. */
  label: string
  /** Nome leigo, usado na tela do paciente. */
  labelLeigo: string
  tecido: UsgTecido
  /** Descrição anatômica completa do ponto (exibida na coleta). */
  landmark: string
  /** Uma linha curta, exibida junto do campo durante a coleta. */
  instrucaoCurta: string
  /** Faixa fisiologicamente plausível em mm. Fora dela, gera aviso — não bloqueia. */
  faixaPlausivelMm: readonly [number, number]
  /** Posição do marcador na silhueta do mapa corporal, em % do viewBox. */
  mapa: { x: number; y: number; vista: 'frente' | 'costas' }
}

export interface UsgProtocol {
  code: UsgProtocolCode
  label: string
  descricao: string
  /** 'ambos' quando o protocolo serve aos dois sexos com equações distintas. */
  sexo: UsgSexo | 'ambos'
  /** Sítios de gordura obrigatórios. A ordem é a da coleta (craniocaudal). */
  fatSites: readonly UsgSiteCode[]
  /** Sítios musculares sugeridos. Nunca entram na soma de gordura. */
  muscleSites: readonly UsgSiteCode[]
  /**
   * Equação por sexo. null quando o protocolo não estima percentual de gordura.
   * Parcial de propósito: JP3 tem conjuntos de sítios diferentes por sexo, então
   * cada variante só declara o sexo a que serve.
   */
  densityEquationBySexo: Readonly<Partial<Record<UsgSexo, DensityEquationId>>> | null
  /** Mínimo de repetições recomendado por sítio. */
  minRepeticoes: number
}

export interface DensityEquation {
  id: DensityEquationId
  label: string
  sexo: UsgSexo
  /** Sítios que compõem o somatório. Precisa casar com o protocolo. */
  sites: readonly UsgSiteCode[]
  /** DC = a − b·Σ + c·Σ² − d·idade  (Σ em mm, idade em anos) */
  a: number
  b: number
  c: number
  d: number
  idadeValidaMin: number
  idadeValidaMax: number
  fonte: string
}

export interface FatFormula {
  id: FatFormulaId
  label: string
  /** %G = (k1/DC − k2)·100 */
  k1: number
  k2: number
  fonte: string
}

export interface UsgConversion {
  id: UsgConversionId
  label: string
  /** mm_equivalente = mm_bruto · factor + offset */
  factor: number
  offset: number
  /**
   * SEMPRE false hoje: nenhuma conversão de ultrassom para dobra-equivalente
   * foi validada contra padrão-ouro nesta população. A UI usa isto para
   * rotular o percentual de gordura como estimativa.
   */
  validated: boolean
  /** Texto exibido ao lado do percentual estimado. */
  rationale: string
}

// ---------------------------------------------------------------------------
// Entrada e saída do motor
// ---------------------------------------------------------------------------

export interface UsgSiteInput {
  site: UsgSiteCode
  tecido: UsgTecido
  lado?: UsgLado
  /** Repetições cruas em mm, na ordem em que foram medidas. */
  repeticoes_mm: number[]
}

export interface UsgCalcConfig {
  /** Pina o COMPORTAMENTO do motor. Bump obrigatório a cada mudança de regra. */
  version: string
  conversion: UsgConversionId
  /** Usados apenas quando conversion === 'linear'. */
  linearFactor: number
  linearOffset: number
  fatFormula: FatFormulaId
  repAggregation: UsgRepAggregation
  /** Coeficiente de variação entre repetições acima do qual o sítio é sinalizado. */
  cvWarnPercent: number
  /** Trava de sanidade do resultado. Espelha o CHECK da tabela. */
  percentFatMin: number
  percentFatMax: number
}

export interface UsgComputeInput {
  protocolo: UsgProtocolCode
  sexo: UsgSexo
  idade: number
  peso_kg: number | null
  altura_cm: number | null
  medidas: UsgSiteInput[]
  config?: Partial<UsgCalcConfig>
  /** Força uma equação específica (pesquisa/calibração). */
  equacaoDensidadeOverride?: DensityEquationId | null
}

export type UsgWarningCode =
  | 'sitio_faltando'
  | 'sitio_extra_ignorado'
  | 'sitio_duplicado'
  | 'valor_fora_faixa'
  | 'cv_alto'
  | 'idade_fora_faixa'
  | 'soma_fora_da_validade'
  | 'densidade_implausivel'
  | 'percentual_fora_faixa'
  | 'sem_peso'
  | 'protocolo_sem_equacao'
  | 'protocolo_incompativel_com_sexo'

export interface UsgWarning {
  code: UsgWarningCode
  site?: UsgSiteCode
  detail: string
}

export interface UsgSiteResult {
  site: UsgSiteCode
  tecido: UsgTecido
  lado: UsgLado
  repeticoes_mm: number[]
  /** Valor consolidado pela regra de agregação. */
  valor_mm: number
  /** Valor após a conversão para a entrada da equação (só para tecido gordura). */
  valor_equivalente_mm: number | null
  cv_percent: number | null
  fora_de_tolerancia: boolean
  /** false para sítio medido mas fora do protocolo — o dado é guardado assim mesmo. */
  entrou_na_soma: boolean
}

export interface UsgComputeResult {
  equation_version: string
  medidas: UsgSiteResult[]
  /** Σ das espessuras BRUTAS de gordura. Métrica primária confiável. */
  soma_gordura_mm: number | null
  /** Σ após conversão. Só existe para alimentar a equação de dobra cutânea. */
  soma_equivalente_mm: number | null
  soma_muscular_mm: number | null
  densidade_corporal: number | null
  percentual_gordura: number | null
  massa_gorda_kg: number | null
  massa_magra_kg: number | null
  equacao_densidade: DensityEquationId | null
  formula_percentual: FatFormulaId
  conversao_id: UsgConversionId
  conversao_fator: number
  conversao_offset: number
  agregacao_repeticoes: UsgRepAggregation
  /** false enquanto a conversão não for calibrada. Governa o rótulo "estimativa". */
  estimativa_confiavel: boolean
  avisos: UsgWarning[]
}

// ---------------------------------------------------------------------------
// Registro persistido
// ---------------------------------------------------------------------------

export interface UsgAssessment {
  id: string
  user_id: string
  data: string
  horario_coleta: string | null
  momento_avaliacao: string | null
  avaliador_id: string | null
  protocolo: UsgProtocolCode
  sexo: UsgSexo | null
  idade: number | null
  peso_kg: number | null
  altura_cm: number | null
  equipamento: string | null
  transdutor_mhz: number | null
  soma_gordura_mm: number | null
  soma_equivalente_mm: number | null
  soma_muscular_mm: number | null
  densidade_corporal: number | null
  percentual_gordura: number | null
  massa_gorda_kg: number | null
  massa_magra_kg: number | null
  equation_version: string
  equacao_densidade: DensityEquationId | null
  formula_percentual: FatFormulaId
  conversao_id: UsgConversionId
  conversao_fator: number
  conversao_offset: number
  agregacao_repeticoes: UsgRepAggregation
  estimativa_confiavel: boolean
  calculo_avisos: UsgWarning[]
  /** Compartilhada com o paciente. Não há campo de anotação interna aqui. */
  interpretacao: string | null
  created_at: string
  updated_at: string
}

export interface UsgMeasurement {
  id: string
  assessment_id: string
  site: UsgSiteCode
  tecido: UsgTecido
  lado: UsgLado
  repeticoes_mm: number[]
  valor_mm: number
  cv_percent: number | null
  fora_de_tolerancia: boolean
  observacao: string | null
}

export interface UsgAssessmentWithSites extends UsgAssessment {
  medidas: UsgMeasurement[]
}
