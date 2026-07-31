/**
 * Preparo de séries e comparações para a interface.
 *
 * Regra que este arquivo existe para tornar impossível de violar: séries de
 * MÉTODOS diferentes (ultrassom e bioimpedância) nunca viram uma linha só.
 * Elas medem coisas diferentes, com vieses diferentes, e uma linha única
 * mostraria como "evolução do paciente" o que é só troca de aparelho.
 */

import type {
  UsgAssessmentWithSites,
  UsgMeasurement,
  UsgSiteCode,
  UsgTecido,
} from './types'
import { USG_SITES } from './protocols'

export interface SeriePonto {
  data: string
  valor: number
}

export interface CompositionSeries {
  id: 'usg' | 'bia'
  label: string
  /** Tracejada para bioimpedância, sólida para ultrassom. */
  tracejada: boolean
  cor: string
  pontos: SeriePonto[]
}

export interface DeltaSitio {
  site: UsgSiteCode
  label: string
  labelLeigo: string
  tecido: UsgTecido
  anterior: number | null
  atual: number
  delta: number | null
  /** Para gordura, menor é melhor; para músculo, maior é melhor. */
  favoravel: boolean | null
  foraDeTolerancia: boolean
}

const COR_USG = '#c29863' // dourado
const COR_BIA = '#ae9b89' // nude

/**
 * Monta as séries de percentual de gordura por método.
 *
 * Devolve SEMPRE um array de séries separadas — não existe assinatura que
 * retorne uma série única combinando os dois métodos.
 */
export function buildCompositionSeries(input: {
  usg: Array<{ data: string; percentual_gordura: number | null }>
  bia: Array<{ data: string; percentual_gordura: number | null }>
}): CompositionSeries[] {
  const series: CompositionSeries[] = []

  const pontosUsg = paraPontos(input.usg)
  if (pontosUsg.length > 0) {
    series.push({
      id: 'usg',
      label: 'Ultrassom (estimativa)',
      tracejada: false,
      cor: COR_USG,
      pontos: pontosUsg,
    })
  }

  const pontosBia = paraPontos(input.bia)
  if (pontosBia.length > 0) {
    series.push({
      id: 'bia',
      label: 'Bioimpedância',
      tracejada: true,
      cor: COR_BIA,
      pontos: pontosBia,
    })
  }

  return series
}

function paraPontos(
  linhas: Array<{ data: string; percentual_gordura: number | null }>
): SeriePonto[] {
  return linhas
    .filter((l) => l.percentual_gordura !== null)
    .map((l) => ({ data: l.data, valor: Number(l.percentual_gordura) }))
    .sort((a, b) => a.data.localeCompare(b.data))
}

/**
 * Evolução do somatório bruto em mm — a métrica que não depende de conversão.
 *
 * O `protocolo` é obrigatório porque a soma de 7 sítios e a de 3 não pertencem
 * à mesma série: plotadas juntas, a troca de protocolo apareceria como um
 * despencar de dezenas de milímetros que o paciente leria como emagrecimento.
 */
export function buildSomaSeries(
  avaliacoes: Array<{ data: string; soma_gordura_mm: number | null; protocolo: string }>,
  protocolo: string
): SeriePonto[] {
  return avaliacoes
    .filter((a) => a.protocolo === protocolo && a.soma_gordura_mm !== null)
    .map((a) => ({ data: a.data, valor: Number(a.soma_gordura_mm) }))
    .sort((a, b) => a.data.localeCompare(b.data))
}

/** Evolução da espessura de um sítio específico. */
export function buildSiteSeries(
  avaliacoes: UsgAssessmentWithSites[],
  site: UsgSiteCode,
  tecido: UsgTecido = 'gordura'
): SeriePonto[] {
  return avaliacoes
    .map((a) => {
      const medida = encontrarMedida(a.medidas, site, tecido)
      return medida ? { data: a.data, valor: Number(medida.valor_mm) } : null
    })
    .filter((p): p is SeriePonto => p !== null)
    .sort((a, b) => a.data.localeCompare(b.data))
}

/**
 * Localiza a medida de um sítio no LADO DIREITO — o lado do protocolo e o
 * único que entra no somatório.
 *
 * Não há queda para o lado esquerdo: uma coleta bilateral faria o gráfico
 * alternar entre as duas pernas e apresentaria a diferença entre elas como
 * evolução do paciente. Sem medida à direita, não há comparação.
 */
export function encontrarMedida(
  medidas: UsgMeasurement[] | undefined,
  site: UsgSiteCode,
  tecido: UsgTecido
): UsgMeasurement | null {
  if (!medidas) return null
  return (
    medidas.find((m) => m.site === site && m.tecido === tecido && m.lado === 'D') ?? null
  )
}

/** Comparação sítio a sítio entre duas avaliações. */
export function compararSitios(
  atual: UsgAssessmentWithSites,
  anterior: UsgAssessmentWithSites | null
): DeltaSitio[] {
  const medidasAtuais = (atual.medidas ?? []).filter((m) => m.lado === 'D')

  return medidasAtuais.map((m) => {
    const site = USG_SITES[m.site]
    const medidaAnterior = anterior
      ? encontrarMedida(anterior.medidas, m.site, m.tecido)
      : null

    const valorAtual = Number(m.valor_mm)
    const valorAnterior = medidaAnterior ? Number(medidaAnterior.valor_mm) : null
    const delta = valorAnterior === null ? null : valorAtual - valorAnterior

    let favoravel: boolean | null = null
    if (delta !== null && Math.abs(delta) >= 0.1) {
      favoravel = m.tecido === 'gordura' ? delta < 0 : delta > 0
    }

    return {
      site: m.site,
      label: site?.label ?? m.site,
      labelLeigo: site?.labelLeigo ?? m.site,
      tecido: m.tecido,
      anterior: valorAnterior,
      atual: valorAtual,
      delta,
      favoravel,
      foraDeTolerancia: m.fora_de_tolerancia,
    }
  })
}

export interface DeltaResumo {
  /** Chave estável — a interface não deve depender do texto do rótulo. */
  id: 'soma' | 'percentual' | 'massa_gorda' | 'massa_magra'
  label: string
  atual: number | null
  anterior: number | null
  delta: number | null
  unidade: string
  /** null quando não há base de comparação ou a variação é irrelevante. */
  favoravel: boolean | null
  /** Casas decimais na exibição. */
  decimais: number
}

/**
 * Avaliação anterior comparável: a mais recente antes desta, do MESMO
 * protocolo.
 *
 * O protocolo importa: a soma de 7 sítios contra a de 3 mostraria uma queda de
 * dezenas de milímetros que é só troca de protocolo, e apareceria na tela como
 * "o paciente melhorou muito".
 */
export function encontrarAnteriorComparavel(
  historico: Array<UsgAssessmentWithSites>,
  atual: UsgAssessmentWithSites
): UsgAssessmentWithSites | null {
  return (
    historico
      .filter(
        (a) =>
          a.id !== atual.id &&
          a.protocolo === atual.protocolo &&
          (a.data < atual.data ||
            (a.data === atual.data && a.created_at < atual.created_at))
      )
      .sort((a, b) => b.data.localeCompare(a.data))[0] ?? null
  )
}

/**
 * Cartões de variação do topo do resultado.
 *
 * Só compara dentro do mesmo protocolo — ver `encontrarAnteriorComparavel`.
 * Se o chamador passar uma avaliação de outro protocolo, a comparação é
 * descartada em vez de produzir um número enganoso.
 */
export function resumoComparativo(
  atual: UsgAssessmentWithSites,
  anteriorBruto: UsgAssessmentWithSites | null
): DeltaResumo[] {
  const anterior =
    anteriorBruto && anteriorBruto.protocolo === atual.protocolo ? anteriorBruto : null

  const item = (
    id: DeltaResumo['id'],
    label: string,
    campo: keyof UsgAssessmentWithSites,
    unidade: string,
    menorEhMelhor: boolean,
    decimais: number
  ): DeltaResumo => {
    const valorAtual = numeroOuNull(atual[campo])
    const valorAnterior = anterior ? numeroOuNull(anterior[campo]) : null
    const delta =
      valorAtual === null || valorAnterior === null ? null : valorAtual - valorAnterior

    let favoravel: boolean | null = null
    const limiar = decimais === 0 ? 0.5 : 10 ** -decimais
    if (delta !== null && Math.abs(delta) >= limiar) {
      favoravel = menorEhMelhor ? delta < 0 : delta > 0
    }

    return {
      id,
      label,
      atual: valorAtual,
      anterior: valorAnterior,
      delta,
      unidade,
      favoravel,
      decimais,
    }
  }

  return [
    item('soma', 'Soma das espessuras', 'soma_gordura_mm', 'mm', true, 1),
    item('percentual', 'Gordura estimada', 'percentual_gordura', '%', true, 1),
    item('massa_gorda', 'Massa gorda', 'massa_gorda_kg', 'kg', true, 2),
    item('massa_magra', 'Massa magra', 'massa_magra_kg', 'kg', false, 2),
  ]
}

function numeroOuNull(valor: unknown): number | null {
  if (valor === null || valor === undefined) return null
  const n = Number(valor)
  return Number.isFinite(n) ? n : null
}

/** Formata número no padrão pt-BR, com traço quando não há valor. */
export function formatarMm(valor: number | null, decimais = 1): string {
  if (valor === null || !Number.isFinite(valor)) return '—'
  return valor.toLocaleString('pt-BR', {
    minimumFractionDigits: decimais,
    maximumFractionDigits: decimais,
  })
}

/** Formata a variação com sinal explícito. */
export function formatarDelta(valor: number | null, decimais = 1): string {
  if (valor === null || !Number.isFinite(valor)) return '—'
  const sinal = valor > 0 ? '+' : ''
  return `${sinal}${formatarMm(valor, decimais)}`
}
