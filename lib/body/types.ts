/**
 * Tipos para o módulo de Bioimpedância (InBody)
 * Baseado nos dados de composição corporal do InBody
 */

// Composição corporal básica
export interface BodyCompositionBase {
  agua_total: number // Água corporal total (L)
  proteina: number // Proteína (kg)
  minerais: number // Minerais (kg)
  gordura_corporal: number // Massa de gordura corporal (kg)
}

// Análise músculo-gordura
export interface MuscleFatAnalysis {
  peso: number // Peso (kg)
  massa_muscular_esqueletica: number // Massa muscular esquelética (kg)
  massa_gordura_corporal: number // Massa de gordura corporal (kg)
  imc: number // Índice de massa corporal
  percentual_gordura: number // Percentual de gordura corporal (%)
}

// Dados adicionais
export interface AdditionalBodyData {
  taxa_metabolica_basal: number // Taxa metabólica basal (kcal)
  nivel_gordura_visceral: number // Nível de gordura visceral (1-20)
  massa_magra: number // Massa magra total (kg)
  massa_muscular: number // Massa muscular total (kg)
  agua_intracelular: number // Água intracelular (L)
  agua_extracelular: number // Água extracelular (L)
  relacao_cintura_quadril: number // Relação cintura-quadril
  circunferencia_cintura?: number // Circunferência da cintura (cm) - opcional
  altura: number // Altura (cm)
  idade: number // Idade (anos)
}

// Análise segmentar - um segmento
export interface SegmentData {
  massa_magra: number // Massa magra do segmento (kg)
  percentual_gordura: number // Percentual de gordura do segmento (%)
  avaliacao: 'baixo' | 'normal' | 'alto' // Avaliação do segmento
}

// Análise segmentar completa
export interface SegmentalAnalysis {
  braco_esquerdo: SegmentData
  braco_direito: SegmentData
  tronco: SegmentData
  perna_esquerda: SegmentData
  perna_direita: SegmentData
}

// Pontuação InBody
export interface InBodyScore {
  pontuacao: number // Pontuação geral (0-100)
  categoria: 'fraco' | 'abaixo_media' | 'normal' | 'bom' | 'excelente'
}

// Medição completa de bioimpedância
export interface BodyCompositionMeasurement {
  id: string
  user_id: string
  data: string // Data da medição (YYYY-MM-DD)
  horario?: string // Hora da medição (HH:MM)

  // Dados básicos
  peso: number
  altura: number
  idade: number

  // Composição básica
  composicao: BodyCompositionBase

  // Análise músculo-gordura
  musculo_gordura: MuscleFatAnalysis

  // Dados adicionais
  adicional: AdditionalBodyData

  // Análise segmentar
  segmental: SegmentalAnalysis

  // Pontuação InBody
  score: InBodyScore

  // Metadados
  fonte: 'inbody' | 'manual' | 'balanca_smart'
  notas?: string
  created_at: string
  updated_at?: string
}

// Faixas de referência para cada métrica
export interface MetricRange {
  min: number
  max: number
  ideal_min: number
  ideal_max: number
  unit: string
}

// Referências baseadas em idade/sexo
export interface BodyReferences {
  peso: MetricRange
  massa_muscular_esqueletica: MetricRange
  massa_gordura_corporal: MetricRange
  imc: MetricRange
  percentual_gordura: MetricRange
  gordura_visceral: MetricRange
  taxa_metabolica: MetricRange
}

// Status de uma métrica comparada à referência
export type MetricStatus = 'baixo' | 'normal' | 'alto' | 'muito_alto'

// Avaliação de uma métrica
export interface MetricEvaluation {
  valor: number
  status: MetricStatus
  percentual_faixa: number // -100 a 100 (0 = ideal)
  descricao: string
}

// Resumo da composição corporal
export interface BodyCompositionSummary {
  ultima_medicao: BodyCompositionMeasurement | null
  total_medicoes: number
  evolucao_peso: {
    variacao_total: number
    variacao_mes: number
    tendencia: 'subindo' | 'estavel' | 'descendo'
  }
  evolucao_gordura: {
    variacao_total: number
    variacao_mes: number
    tendencia: 'subindo' | 'estavel' | 'descendo'
  }
  evolucao_musculo: {
    variacao_total: number
    variacao_mes: number
    tendencia: 'subindo' | 'estavel' | 'descendo'
  }
}

// Metas de composição corporal
export interface BodyGoals {
  peso_meta?: number
  gordura_meta?: number // Percentual
  musculo_meta?: number // kg de massa muscular esquelética
  gordura_visceral_meta?: number
}

// Comparação entre duas medições
export interface MeasurementComparison {
  medicao_anterior: BodyCompositionMeasurement
  medicao_atual: BodyCompositionMeasurement
  diferencas: {
    peso: number
    gordura_kg: number
    gordura_percentual: number
    musculo_kg: number
    agua: number
    score: number
    dias_entre: number
  }
}

// Histórico para gráficos
export interface BodyHistoryPoint {
  data: string
  peso: number
  gordura_percentual: number
  massa_muscular: number
  score: number
}

// Estatísticas do módulo
export interface BodyStats {
  medicoes_total: number
  medicoes_ultimo_mes: number
  melhor_score: number
  menor_gordura: number
  maior_musculo: number
  peso_inicial: number
  peso_atual: number
  gordura_inicial: number
  gordura_atual: number
  musculo_inicial: number
  musculo_atual: number
}

// Tipos para formulário de nova medição
export interface NewMeasurementInput {
  data: string
  peso: number
  altura: number

  // Opcional - dados do InBody
  agua_total?: number
  proteina?: number
  minerais?: number
  gordura_corporal?: number
  massa_muscular_esqueletica?: number
  imc?: number
  percentual_gordura?: number
  taxa_metabolica_basal?: number
  nivel_gordura_visceral?: number
  massa_magra?: number
  massa_muscular?: number

  // Segmental (opcional)
  segmental?: Partial<SegmentalAnalysis>

  fonte: 'inbody' | 'manual' | 'balanca_smart'
  notas?: string
}

// Tipo para badge/chip de status
export interface StatusBadge {
  label: string
  color: 'emerald' | 'cyan' | 'amber' | 'red' | 'violet' | 'slate'
  icon?: string
}

// Constantes
export const INBODY_SCORE_RANGES = {
  fraco: { min: 0, max: 59 },
  abaixo_media: { min: 60, max: 69 },
  normal: { min: 70, max: 79 },
  bom: { min: 80, max: 89 },
  excelente: { min: 90, max: 100 }
} as const

export const GORDURA_VISCERAL_RANGES = {
  normal: { min: 1, max: 9 },
  alto: { min: 10, max: 14 },
  muito_alto: { min: 15, max: 20 }
} as const

export const IMC_RANGES = {
  baixo_peso: { min: 0, max: 18.4 },
  normal: { min: 18.5, max: 24.9 },
  sobrepeso: { min: 25, max: 29.9 },
  obesidade_1: { min: 30, max: 34.9 },
  obesidade_2: { min: 35, max: 39.9 },
  obesidade_3: { min: 40, max: 100 }
} as const

// Percentual de gordura por idade/sexo (homens)
export const GORDURA_PERCENTUAL_HOMEM = {
  '20-39': { baixo: 8, normal_min: 8, normal_max: 19, alto: 25 },
  '40-59': { baixo: 11, normal_min: 11, normal_max: 21, alto: 28 },
  '60-79': { baixo: 13, normal_min: 13, normal_max: 24, alto: 30 }
} as const
