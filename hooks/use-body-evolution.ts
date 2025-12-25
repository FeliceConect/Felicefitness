"use client"

import { useMemo } from 'react'
import { parseISO, differenceInDays, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type {
  BodyCompositionMeasurement,
  BodyHistoryPoint,
  MeasurementComparison
} from '@/lib/body/types'
import { compareMeasurements, measurementsToHistory, formatVariation } from '@/lib/body/calculations'

interface EvolutionMetric {
  label: string
  valorInicial: number
  valorAtual: number
  variacao: number
  variacaoFormatada: string
  percentualVariacao: number
  tendencia: 'subindo' | 'estavel' | 'descendo'
  corTendencia: string
  unidade: string
  melhorouPiorou: 'melhorou' | 'piorou' | 'neutro'
}

interface UseBodyEvolutionReturn {
  // Comparações
  comparacaoInicio: MeasurementComparison | null
  comparacaoUltimaMes: MeasurementComparison | null

  // Métricas de evolução
  evolucaoPeso: EvolutionMetric | null
  evolucaoGordura: EvolutionMetric | null
  evolucaoMusculo: EvolutionMetric | null
  evolucaoScore: EvolutionMetric | null
  evolucaoGorduraVisceral: EvolutionMetric | null

  // Dados para gráficos
  historyData: BodyHistoryPoint[]

  // Resumo textual
  periodoTotal: string
  diasAcompanhamento: number

  // Marcos/conquistas
  marcos: MarcosEvolucao[]
}

interface MarcosEvolucao {
  data: string
  titulo: string
  descricao: string
  icone: string
  cor: string
}

export function useBodyEvolution(measurements: BodyCompositionMeasurement[]): UseBodyEvolutionReturn {
  // Ordenar medições por data (mais antiga primeiro)
  const sortedMeasurements = useMemo(() => {
    return [...measurements].sort((a, b) =>
      parseISO(a.data).getTime() - parseISO(b.data).getTime()
    )
  }, [measurements])

  // Primeira e última medição
  const primeiraMedicao = sortedMeasurements[0] || null
  const ultimaMedicao = sortedMeasurements[sortedMeasurements.length - 1] || null

  // Encontrar medição de ~1 mês atrás
  const medicaoUmMesAtras = useMemo(() => {
    if (sortedMeasurements.length < 2) return null

    const hoje = new Date()
    const umMesAtras = new Date()
    umMesAtras.setMonth(umMesAtras.getMonth() - 1)

    // Encontrar a medição mais próxima de 1 mês atrás
    const medicao = [...sortedMeasurements].reverse().find(m => {
      const dataMedicao = parseISO(m.data)
      return dataMedicao <= umMesAtras
    })

    return medicao || sortedMeasurements[sortedMeasurements.length - 2] || null
  }, [sortedMeasurements])

  // Comparação desde o início
  const comparacaoInicio = useMemo(() => {
    if (!primeiraMedicao || !ultimaMedicao || primeiraMedicao.id === ultimaMedicao.id) {
      return null
    }
    return compareMeasurements(primeiraMedicao, ultimaMedicao)
  }, [primeiraMedicao, ultimaMedicao])

  // Comparação com último mês
  const comparacaoUltimaMes = useMemo(() => {
    if (!medicaoUmMesAtras || !ultimaMedicao || medicaoUmMesAtras.id === ultimaMedicao.id) {
      return null
    }
    return compareMeasurements(medicaoUmMesAtras, ultimaMedicao)
  }, [medicaoUmMesAtras, ultimaMedicao])

  // Função auxiliar para criar métrica de evolução
  const criarMetricaEvolucao = (
    label: string,
    valorInicial: number,
    valorAtual: number,
    unidade: string,
    inverso: boolean = false // Se true, diminuir é melhorar (ex: gordura)
  ): EvolutionMetric => {
    const variacao = valorAtual - valorInicial
    const percentualVariacao = valorInicial !== 0
      ? ((variacao / valorInicial) * 100)
      : 0

    let tendencia: 'subindo' | 'estavel' | 'descendo'
    if (Math.abs(variacao) < 0.1) {
      tendencia = 'estavel'
    } else {
      tendencia = variacao > 0 ? 'subindo' : 'descendo'
    }

    let melhorouPiorou: 'melhorou' | 'piorou' | 'neutro'
    if (tendencia === 'estavel') {
      melhorouPiorou = 'neutro'
    } else if (inverso) {
      melhorouPiorou = tendencia === 'descendo' ? 'melhorou' : 'piorou'
    } else {
      melhorouPiorou = tendencia === 'subindo' ? 'melhorou' : 'piorou'
    }

    let corTendencia: string
    switch (melhorouPiorou) {
      case 'melhorou':
        corTendencia = '#10B981' // emerald
        break
      case 'piorou':
        corTendencia = '#EF4444' // red
        break
      default:
        corTendencia = '#64748B' // slate
    }

    return {
      label,
      valorInicial,
      valorAtual,
      variacao,
      variacaoFormatada: formatVariation(variacao, unidade === '%' ? 1 : 1),
      percentualVariacao,
      tendencia,
      corTendencia,
      unidade,
      melhorouPiorou
    }
  }

  // Métricas de evolução
  const evolucaoPeso = useMemo(() => {
    if (!primeiraMedicao || !ultimaMedicao) return null
    return criarMetricaEvolucao(
      'Peso',
      primeiraMedicao.peso,
      ultimaMedicao.peso,
      'kg',
      true // Para o Leonardo, perder peso é melhorar
    )
  }, [primeiraMedicao, ultimaMedicao])

  const evolucaoGordura = useMemo(() => {
    if (!primeiraMedicao || !ultimaMedicao) return null
    return criarMetricaEvolucao(
      'Gordura',
      primeiraMedicao.musculo_gordura.percentual_gordura,
      ultimaMedicao.musculo_gordura.percentual_gordura,
      '%',
      true // Diminuir gordura é melhorar
    )
  }, [primeiraMedicao, ultimaMedicao])

  const evolucaoMusculo = useMemo(() => {
    if (!primeiraMedicao || !ultimaMedicao) return null
    return criarMetricaEvolucao(
      'Músculo',
      primeiraMedicao.musculo_gordura.massa_muscular_esqueletica,
      ultimaMedicao.musculo_gordura.massa_muscular_esqueletica,
      'kg',
      false // Aumentar músculo é melhorar
    )
  }, [primeiraMedicao, ultimaMedicao])

  const evolucaoScore = useMemo(() => {
    if (!primeiraMedicao || !ultimaMedicao) return null
    return criarMetricaEvolucao(
      'Score',
      primeiraMedicao.score.pontuacao,
      ultimaMedicao.score.pontuacao,
      'pts',
      false // Aumentar score é melhorar
    )
  }, [primeiraMedicao, ultimaMedicao])

  const evolucaoGorduraVisceral = useMemo(() => {
    if (!primeiraMedicao || !ultimaMedicao) return null
    return criarMetricaEvolucao(
      'Gordura Visceral',
      primeiraMedicao.adicional.nivel_gordura_visceral,
      ultimaMedicao.adicional.nivel_gordura_visceral,
      '',
      true // Diminuir é melhorar
    )
  }, [primeiraMedicao, ultimaMedicao])

  // Dados para gráficos
  const historyData = useMemo(() => {
    return measurementsToHistory(sortedMeasurements)
  }, [sortedMeasurements])

  // Período total
  const periodoTotal = useMemo(() => {
    if (!primeiraMedicao || !ultimaMedicao) return ''
    const inicio = format(parseISO(primeiraMedicao.data), "MMMM 'de' yyyy", { locale: ptBR })
    const fim = format(parseISO(ultimaMedicao.data), "MMMM 'de' yyyy", { locale: ptBR })
    return `${inicio} - ${fim}`
  }, [primeiraMedicao, ultimaMedicao])

  // Dias de acompanhamento
  const diasAcompanhamento = useMemo(() => {
    if (!primeiraMedicao || !ultimaMedicao) return 0
    return differenceInDays(parseISO(ultimaMedicao.data), parseISO(primeiraMedicao.data))
  }, [primeiraMedicao, ultimaMedicao])

  // Marcos/conquistas
  const marcos = useMemo((): MarcosEvolucao[] => {
    const listaMarcos: MarcosEvolucao[] = []

    if (sortedMeasurements.length === 0) return listaMarcos

    // Verificar marcos em cada medição
    for (let i = 1; i < sortedMeasurements.length; i++) {
      const atual = sortedMeasurements[i]
      const anterior = sortedMeasurements[i - 1]
      const primeira = sortedMeasurements[0]

      // Marco: Gordura visceral normalizada (< 10)
      if (atual.adicional.nivel_gordura_visceral < 10 && anterior.adicional.nivel_gordura_visceral >= 10) {
        listaMarcos.push({
          data: atual.data,
          titulo: 'Gordura Visceral Normalizada!',
          descricao: 'Nível de gordura visceral dentro da faixa saudável',
          icone: '🎯',
          cor: '#10B981'
        })
      }

      // Marco: Perdeu mais de 5kg desde o início
      const pesoTotal = primeira.peso - atual.peso
      const pesoPerdidoAnterior = primeira.peso - anterior.peso
      if (pesoTotal >= 5 && pesoPerdidoAnterior < 5) {
        listaMarcos.push({
          data: atual.data,
          titulo: '5kg Perdidos!',
          descricao: `Você já perdeu ${pesoTotal.toFixed(1)}kg desde o início`,
          icone: '🏆',
          cor: '#06B6D4'
        })
      }

      // Marco: Perdeu mais de 10kg
      if (pesoTotal >= 10 && pesoPerdidoAnterior < 10) {
        listaMarcos.push({
          data: atual.data,
          titulo: '10kg Perdidos!',
          descricao: 'Uma conquista incrível!',
          icone: '🥇',
          cor: '#F59E0B'
        })
      }

      // Marco: Score > 80 pela primeira vez
      if (atual.score.pontuacao >= 80 && anterior.score.pontuacao < 80) {
        listaMarcos.push({
          data: atual.data,
          titulo: 'Score Bom Atingido!',
          descricao: 'Pontuação InBody acima de 80',
          icone: '⭐',
          cor: '#8B5CF6'
        })
      }

      // Marco: Ganhou mais de 2kg de músculo
      const musculoGanho = atual.musculo_gordura.massa_muscular_esqueletica - primeira.musculo_gordura.massa_muscular_esqueletica
      const musculoGanhoAnterior = anterior.musculo_gordura.massa_muscular_esqueletica - primeira.musculo_gordura.massa_muscular_esqueletica
      if (musculoGanho >= 2 && musculoGanhoAnterior < 2) {
        listaMarcos.push({
          data: atual.data,
          titulo: '+2kg de Músculo!',
          descricao: 'Ganho significativo de massa muscular',
          icone: '💪',
          cor: '#EC4899'
        })
      }

      // Marco: Gordura < 20%
      if (atual.musculo_gordura.percentual_gordura < 20 && anterior.musculo_gordura.percentual_gordura >= 20) {
        listaMarcos.push({
          data: atual.data,
          titulo: 'Gordura < 20%!',
          descricao: 'Percentual de gordura dentro da faixa ideal',
          icone: '🔥',
          cor: '#F97316'
        })
      }
    }

    // Ordenar por data (mais recente primeiro)
    return listaMarcos.sort((a, b) =>
      parseISO(b.data).getTime() - parseISO(a.data).getTime()
    )
  }, [sortedMeasurements])

  return {
    comparacaoInicio,
    comparacaoUltimaMes,
    evolucaoPeso,
    evolucaoGordura,
    evolucaoMusculo,
    evolucaoScore,
    evolucaoGorduraVisceral,
    historyData,
    periodoTotal,
    diasAcompanhamento,
    marcos
  }
}
