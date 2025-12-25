/**
 * Funções de cálculo para o módulo de Bioimpedância
 */

import type {
  BodyCompositionMeasurement,
  MeasurementComparison,
  BodyHistoryPoint,
  BodyStats,
  BodyCompositionSummary
} from './types'
import { differenceInDays, parseISO } from 'date-fns'

// Calcular diferenças entre duas medições
export function compareMeasurements(
  anterior: BodyCompositionMeasurement,
  atual: BodyCompositionMeasurement
): MeasurementComparison {
  const diasEntre = differenceInDays(parseISO(atual.data), parseISO(anterior.data))

  return {
    medicao_anterior: anterior,
    medicao_atual: atual,
    diferencas: {
      peso: atual.peso - anterior.peso,
      gordura_kg: atual.musculo_gordura.massa_gordura_corporal - anterior.musculo_gordura.massa_gordura_corporal,
      gordura_percentual: atual.musculo_gordura.percentual_gordura - anterior.musculo_gordura.percentual_gordura,
      musculo_kg: atual.musculo_gordura.massa_muscular_esqueletica - anterior.musculo_gordura.massa_muscular_esqueletica,
      agua: atual.composicao.agua_total - anterior.composicao.agua_total,
      score: atual.score.pontuacao - anterior.score.pontuacao,
      dias_entre: diasEntre
    }
  }
}

// Converter medições para pontos de histórico (para gráficos)
export function measurementsToHistory(medicoes: BodyCompositionMeasurement[]): BodyHistoryPoint[] {
  return medicoes.map(m => ({
    data: m.data,
    peso: m.peso,
    gordura_percentual: m.musculo_gordura.percentual_gordura,
    massa_muscular: m.musculo_gordura.massa_muscular_esqueletica,
    score: m.score.pontuacao
  }))
}

// Calcular estatísticas gerais
export function calculateBodyStats(medicoes: BodyCompositionMeasurement[]): BodyStats {
  if (medicoes.length === 0) {
    return {
      medicoes_total: 0,
      medicoes_ultimo_mes: 0,
      melhor_score: 0,
      menor_gordura: 0,
      maior_musculo: 0,
      peso_inicial: 0,
      peso_atual: 0,
      gordura_inicial: 0,
      gordura_atual: 0,
      musculo_inicial: 0,
      musculo_atual: 0
    }
  }

  // Ordenar por data
  const sorted = [...medicoes].sort((a, b) =>
    parseISO(a.data).getTime() - parseISO(b.data).getTime()
  )

  const primeira = sorted[0]
  const ultima = sorted[sorted.length - 1]

  // Contar medições do último mês
  const hoje = new Date()
  const umMesAtras = new Date()
  umMesAtras.setMonth(umMesAtras.getMonth() - 1)
  const medicoesUltimoMes = medicoes.filter(m =>
    parseISO(m.data) >= umMesAtras && parseISO(m.data) <= hoje
  ).length

  return {
    medicoes_total: medicoes.length,
    medicoes_ultimo_mes: medicoesUltimoMes,
    melhor_score: Math.max(...medicoes.map(m => m.score.pontuacao)),
    menor_gordura: Math.min(...medicoes.map(m => m.musculo_gordura.percentual_gordura)),
    maior_musculo: Math.max(...medicoes.map(m => m.musculo_gordura.massa_muscular_esqueletica)),
    peso_inicial: primeira.peso,
    peso_atual: ultima.peso,
    gordura_inicial: primeira.musculo_gordura.percentual_gordura,
    gordura_atual: ultima.musculo_gordura.percentual_gordura,
    musculo_inicial: primeira.musculo_gordura.massa_muscular_esqueletica,
    musculo_atual: ultima.musculo_gordura.massa_muscular_esqueletica
  }
}

// Calcular resumo da composição corporal
export function calculateBodySummary(medicoes: BodyCompositionMeasurement[]): BodyCompositionSummary {
  if (medicoes.length === 0) {
    return {
      ultima_medicao: null,
      total_medicoes: 0,
      evolucao_peso: { variacao_total: 0, variacao_mes: 0, tendencia: 'estavel' },
      evolucao_gordura: { variacao_total: 0, variacao_mes: 0, tendencia: 'estavel' },
      evolucao_musculo: { variacao_total: 0, variacao_mes: 0, tendencia: 'estavel' }
    }
  }

  // Ordenar por data
  const sorted = [...medicoes].sort((a, b) =>
    parseISO(a.data).getTime() - parseISO(b.data).getTime()
  )

  const primeira = sorted[0]
  const ultima = sorted[sorted.length - 1]

  // Encontrar medição de ~1 mês atrás
  const umMesAtras = new Date()
  umMesAtras.setMonth(umMesAtras.getMonth() - 1)

  const medicaoMesPassado = sorted.reverse().find(m =>
    parseISO(m.data) <= umMesAtras
  ) || primeira

  // Calcular variações
  const variacaoPesoTotal = ultima.peso - primeira.peso
  const variacaoPesoMes = ultima.peso - medicaoMesPassado.peso

  const variacaoGorduraTotal = ultima.musculo_gordura.percentual_gordura - primeira.musculo_gordura.percentual_gordura
  const variacaoGorduraMes = ultima.musculo_gordura.percentual_gordura - medicaoMesPassado.musculo_gordura.percentual_gordura

  const variacaoMusculoTotal = ultima.musculo_gordura.massa_muscular_esqueletica - primeira.musculo_gordura.massa_muscular_esqueletica
  const variacaoMusculoMes = ultima.musculo_gordura.massa_muscular_esqueletica - medicaoMesPassado.musculo_gordura.massa_muscular_esqueletica

  // Determinar tendências
  const getTendencia = (variacao: number): 'subindo' | 'estavel' | 'descendo' => {
    if (Math.abs(variacao) < 0.5) return 'estavel'
    return variacao > 0 ? 'subindo' : 'descendo'
  }

  return {
    ultima_medicao: ultima,
    total_medicoes: medicoes.length,
    evolucao_peso: {
      variacao_total: variacaoPesoTotal,
      variacao_mes: variacaoPesoMes,
      tendencia: getTendencia(variacaoPesoMes)
    },
    evolucao_gordura: {
      variacao_total: variacaoGorduraTotal,
      variacao_mes: variacaoGorduraMes,
      tendencia: getTendencia(variacaoGorduraMes)
    },
    evolucao_musculo: {
      variacao_total: variacaoMusculoTotal,
      variacao_mes: variacaoMusculoMes,
      tendencia: getTendencia(variacaoMusculoMes)
    }
  }
}

// Formatar variação com sinal
export function formatVariation(valor: number, decimals: number = 1): string {
  const formatted = Math.abs(valor).toFixed(decimals)
  if (valor > 0) return `+${formatted}`
  if (valor < 0) return `-${formatted}`
  return formatted
}

// Formatar peso (kg ou g)
export function formatWeight(kg: number): string {
  if (kg >= 1) {
    return `${kg.toFixed(1)}kg`
  }
  return `${(kg * 1000).toFixed(0)}g`
}

// Calcular idade metabólica estimada
export function calculateMetabolicAge(
  taxaMetabolica: number,
  idade: number
): { idadeMetabolica: number; diferenca: number } {
  // Fórmula simplificada baseada em referências de TMB por idade
  // TMB médio homem 40 anos: ~1700 kcal
  // TMB médio homem 50 anos: ~1600 kcal
  // Cada 100 kcal de diferença = ~5 anos de diferença

  const tmb_referencia_idade = 1850 - (idade * 5) // Aproximação linear

  const diferenca_tmb = taxaMetabolica - tmb_referencia_idade
  const ajuste_idade = Math.round(diferenca_tmb / 20) // Cada 20 kcal = 1 ano

  const idadeMetabolica = Math.max(18, idade - ajuste_idade)

  return {
    idadeMetabolica,
    diferenca: idade - idadeMetabolica
  }
}

// Calcular água ideal baseada no peso
export function calculateIdealWater(peso: number): { min: number; max: number } {
  // Recomendação: 50-60% do peso corporal em litros
  return {
    min: peso * 0.50,
    max: peso * 0.60
  }
}

// Verificar se água corporal está adequada
export function isWaterAdequate(aguaTotal: number, peso: number): boolean {
  const ideal = calculateIdealWater(peso)
  return aguaTotal >= ideal.min && aguaTotal <= ideal.max
}

// Calcular peso de gordura ideal
export function calculateIdealFatMass(peso: number, idade: number): { min: number; max: number } {
  // Percentual ideal de gordura para homem 40-59: 11-21%
  let percentMin = 11
  let percentMax = 21

  if (idade < 40) {
    percentMin = 8
    percentMax = 19
  } else if (idade >= 60) {
    percentMin = 13
    percentMax = 24
  }

  return {
    min: peso * (percentMin / 100),
    max: peso * (percentMax / 100)
  }
}

// Calcular massa muscular ideal
export function calculateIdealMuscleMass(altura: number): { min: number; max: number } {
  // Baseado em altura para homens
  // Fórmula aproximada: altura em cm determina a faixa
  const alturaM = altura / 100

  return {
    min: Math.round((alturaM * alturaM * 10) * 10) / 10, // ~32kg para 1.80m
    max: Math.round((alturaM * alturaM * 12) * 10) / 10  // ~39kg para 1.80m
  }
}

// Obter emoji para tendência
export function getTendenciaEmoji(tendencia: 'subindo' | 'estavel' | 'descendo', inverso: boolean = false): string {
  if (inverso) {
    // Para métricas onde descer é bom (gordura)
    switch (tendencia) {
      case 'descendo': return '📉'
      case 'subindo': return '📈'
      default: return '➡️'
    }
  }
  // Para métricas onde subir é bom (músculo)
  switch (tendencia) {
    case 'subindo': return '📈'
    case 'descendo': return '📉'
    default: return '➡️'
  }
}

// Calcular progresso em direção a uma meta
export function calculateGoalProgress(
  valorAtual: number,
  valorInicial: number,
  meta: number
): { progresso: number; restante: number; percentual: number } {
  const total = meta - valorInicial
  const atingido = valorAtual - valorInicial

  if (total === 0) {
    return { progresso: 100, restante: 0, percentual: 100 }
  }

  const percentual = Math.min(100, Math.max(0, (atingido / total) * 100))
  const restante = meta - valorAtual

  return {
    progresso: atingido,
    restante,
    percentual
  }
}
