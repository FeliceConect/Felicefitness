/**
 * Valores de referência para análise de bioimpedância
 * Baseado em padrões InBody e literatura científica
 */

import type { MetricRange, MetricStatus, MetricEvaluation, BodyReferences } from './types'

// Referências para homem de 40-59 anos (perfil do Leonardo)
export const REFERENCIAS_HOMEM_40_59: BodyReferences = {
  peso: {
    min: 60,
    max: 100,
    ideal_min: 70,
    ideal_max: 85,
    unit: 'kg'
  },
  massa_muscular_esqueletica: {
    min: 25,
    max: 45,
    ideal_min: 32,
    ideal_max: 40,
    unit: 'kg'
  },
  massa_gordura_corporal: {
    min: 5,
    max: 35,
    ideal_min: 10,
    ideal_max: 18,
    unit: 'kg'
  },
  imc: {
    min: 18.5,
    max: 30,
    ideal_min: 18.5,
    ideal_max: 24.9,
    unit: ''
  },
  percentual_gordura: {
    min: 8,
    max: 30,
    ideal_min: 11,
    ideal_max: 21,
    unit: '%'
  },
  gordura_visceral: {
    min: 1,
    max: 20,
    ideal_min: 1,
    ideal_max: 9,
    unit: ''
  },
  taxa_metabolica: {
    min: 1400,
    max: 2200,
    ideal_min: 1600,
    ideal_max: 1900,
    unit: 'kcal'
  }
}

// Obter referências por idade e sexo
export function getReferences(idade: number, sexo: 'masculino' | 'feminino' = 'masculino'): BodyReferences {
  // Por enquanto, retornar referências para homem 40-59
  // TODO: Expandir para outras faixas etárias e sexo feminino
  if (sexo === 'masculino') {
    if (idade >= 40 && idade < 60) {
      return REFERENCIAS_HOMEM_40_59
    }
    // Default para homens
    return REFERENCIAS_HOMEM_40_59
  }

  // TODO: Adicionar referências femininas
  return REFERENCIAS_HOMEM_40_59
}

// Avaliar uma métrica em relação à referência
export function evaluateMetric(
  valor: number,
  range: MetricRange,
  inverso: boolean = false // Se true, menor é melhor (ex: gordura)
): MetricEvaluation {
  let status: MetricStatus
  let percentual_faixa: number
  let descricao: string

  const { ideal_min, ideal_max, min, max } = range

  if (valor >= ideal_min && valor <= ideal_max) {
    status = 'normal'
    const midpoint = (ideal_min + ideal_max) / 2
    percentual_faixa = ((valor - midpoint) / (ideal_max - midpoint)) * 50
    descricao = 'Dentro da faixa ideal'
  } else if (valor < ideal_min) {
    if (inverso) {
      // Para métricas inversas (ex: gordura), baixo é bom
      status = 'normal'
      percentual_faixa = -((ideal_min - valor) / (ideal_min - min)) * 50
      descricao = 'Abaixo da média - excelente!'
    } else {
      status = 'baixo'
      percentual_faixa = -((ideal_min - valor) / (ideal_min - min)) * 100
      descricao = 'Abaixo do ideal'
    }
  } else {
    // valor > ideal_max
    if (inverso) {
      // Para métricas inversas, alto é ruim
      const excesso = valor - ideal_max
      const maxExcesso = max - ideal_max
      if (excesso > maxExcesso * 0.5) {
        status = 'muito_alto'
        descricao = 'Muito acima do ideal'
      } else {
        status = 'alto'
        descricao = 'Acima do ideal'
      }
      percentual_faixa = (excesso / maxExcesso) * 100
    } else {
      status = 'alto'
      percentual_faixa = ((valor - ideal_max) / (max - ideal_max)) * 100
      descricao = 'Acima da faixa ideal'
    }
  }

  return {
    valor,
    status,
    percentual_faixa: Math.max(-100, Math.min(100, percentual_faixa)),
    descricao
  }
}

// Calcular pontuação InBody
export function calculateInBodyScore(
  peso: number,
  massaMuscular: number,
  gorduraPercentual: number,
  gorduraVisceral: number,
  idade: number
): number {
  const refs = getReferences(idade)

  // Pontuação base: 70 pontos
  let score = 70

  // Avaliar massa muscular (+/- até 15 pontos)
  const musculoEval = evaluateMetric(massaMuscular, refs.massa_muscular_esqueletica)
  if (musculoEval.status === 'normal') {
    score += 15
  } else if (musculoEval.status === 'alto') {
    score += 10
  } else if (musculoEval.status === 'baixo') {
    score -= 5
  }

  // Avaliar gordura percentual (+/- até 10 pontos)
  const gorduraEval = evaluateMetric(gorduraPercentual, refs.percentual_gordura, true)
  if (gorduraEval.status === 'normal') {
    if (gorduraPercentual < refs.percentual_gordura.ideal_min) {
      score += 10 // Abaixo do ideal é bom para gordura
    } else {
      score += 5
    }
  } else if (gorduraEval.status === 'alto') {
    score -= 10
  } else if (gorduraEval.status === 'muito_alto') {
    score -= 15
  }

  // Avaliar gordura visceral (+/- até 5 pontos)
  if (gorduraVisceral <= 9) {
    score += 5
  } else if (gorduraVisceral >= 10 && gorduraVisceral <= 14) {
    score -= 5
  } else {
    score -= 10
  }

  // Limitar entre 0 e 100
  return Math.max(0, Math.min(100, Math.round(score)))
}

// Obter categoria da pontuação InBody
export function getScoreCategory(score: number): 'fraco' | 'abaixo_media' | 'normal' | 'bom' | 'excelente' {
  if (score >= 90) return 'excelente'
  if (score >= 80) return 'bom'
  if (score >= 70) return 'normal'
  if (score >= 60) return 'abaixo_media'
  return 'fraco'
}

// Cores para cada categoria de pontuação
export function getScoreColor(score: number): string {
  const categoria = getScoreCategory(score)
  switch (categoria) {
    case 'excelente': return '#10B981' // emerald
    case 'bom': return '#06B6D4' // cyan
    case 'normal': return '#8B5CF6' // violet
    case 'abaixo_media': return '#F59E0B' // amber
    case 'fraco': return '#EF4444' // red
  }
}

// Obter cor para status de métrica
export function getMetricStatusColor(status: MetricStatus): string {
  switch (status) {
    case 'normal': return '#10B981' // emerald
    case 'baixo': return '#F59E0B' // amber
    case 'alto': return '#F59E0B' // amber
    case 'muito_alto': return '#EF4444' // red
  }
}

// Interpretar IMC
export function interpretIMC(imc: number): { categoria: string; cor: string; descricao: string } {
  if (imc < 18.5) {
    return { categoria: 'Baixo peso', cor: '#F59E0B', descricao: 'IMC abaixo do ideal' }
  }
  if (imc < 25) {
    return { categoria: 'Normal', cor: '#10B981', descricao: 'IMC dentro da faixa ideal' }
  }
  if (imc < 30) {
    return { categoria: 'Sobrepeso', cor: '#F59E0B', descricao: 'IMC acima do ideal' }
  }
  if (imc < 35) {
    return { categoria: 'Obesidade I', cor: '#EF4444', descricao: 'Obesidade grau I' }
  }
  if (imc < 40) {
    return { categoria: 'Obesidade II', cor: '#EF4444', descricao: 'Obesidade grau II' }
  }
  return { categoria: 'Obesidade III', cor: '#EF4444', descricao: 'Obesidade grau III' }
}

// Interpretar gordura visceral
export function interpretGorduraVisceral(nivel: number): { categoria: string; cor: string; descricao: string } {
  if (nivel <= 9) {
    return { categoria: 'Normal', cor: '#10B981', descricao: 'Nível saudável de gordura visceral' }
  }
  if (nivel <= 14) {
    return { categoria: 'Alto', cor: '#F59E0B', descricao: 'Atenção: nível elevado' }
  }
  return { categoria: 'Muito alto', cor: '#EF4444', descricao: 'Risco aumentado para saúde' }
}

// Interpretar percentual de gordura para homem
export function interpretGorduraPercentual(
  percentual: number,
  idade: number
): { categoria: string; cor: string; descricao: string } {
  // Referências para homens
  let ranges: { baixo: number; normal_max: number; alto: number }

  if (idade < 40) {
    ranges = { baixo: 8, normal_max: 19, alto: 25 }
  } else if (idade < 60) {
    ranges = { baixo: 11, normal_max: 21, alto: 28 }
  } else {
    ranges = { baixo: 13, normal_max: 24, alto: 30 }
  }

  if (percentual < ranges.baixo) {
    return { categoria: 'Atlético', cor: '#06B6D4', descricao: 'Gordura corporal muito baixa' }
  }
  if (percentual <= ranges.normal_max) {
    return { categoria: 'Normal', cor: '#10B981', descricao: 'Gordura corporal saudável' }
  }
  if (percentual <= ranges.alto) {
    return { categoria: 'Acima', cor: '#F59E0B', descricao: 'Gordura corporal elevada' }
  }
  return { categoria: 'Alto', cor: '#EF4444', descricao: 'Gordura corporal alta' }
}

// Calcular relação músculo-gordura
export function calcularRelacaoMusculoGordura(massaMuscular: number, massaGordura: number): number {
  if (massaGordura === 0) return 0
  return massaMuscular / massaGordura
}

// Interpretar relação músculo-gordura
export function interpretRelacaoMusculoGordura(ratio: number): { status: string; cor: string } {
  if (ratio >= 3) {
    return { status: 'Excelente', cor: '#10B981' }
  }
  if (ratio >= 2) {
    return { status: 'Bom', cor: '#06B6D4' }
  }
  if (ratio >= 1.5) {
    return { status: 'Regular', cor: '#F59E0B' }
  }
  return { status: 'Baixo', cor: '#EF4444' }
}
