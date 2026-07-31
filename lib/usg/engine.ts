/**
 * Motor de cálculo da avaliação por ultrassom.
 *
 * Função pura e determinística: a mesma entrada devolve exatamente a mesma
 * saída, e a ordem das medidas na entrada não altera o resultado. Não importa
 * nada de Supabase — é a mesma função que roda no servidor ao gravar e no
 * cliente para o preview durante a coleta.
 *
 * Regras que o motor garante e que existem por um motivo clínico:
 *
 * 1. O somatório de gordura só é calculado se TODOS os sítios obrigatórios do
 *    protocolo estiverem presentes. Somatório parcial silencioso compararia
 *    um JP7 com um JP7-menos-um entre avaliações — o pior bug possível aqui.
 * 2. Sítio medido fora do protocolo é gravado (dado clínico não se joga fora),
 *    mas não entra no somatório.
 * 3. A conversão é aplicada por sítio ANTES do somatório. Só daria no mesmo
 *    aplicar depois se o offset fosse zero, e o nosso não é.
 * 4. Músculo nunca entra no somatório de gordura nem no cálculo de massa magra.
 * 5. Arredondamento só no final.
 */

import type {
  DensityEquationId,
  UsgCalcConfig,
  UsgComputeInput,
  UsgComputeResult,
  UsgConversion,
  UsgLado,
  UsgRepAggregation,
  UsgSiteCode,
  UsgSiteInput,
  UsgSiteResult,
  UsgWarning,
} from './types'
import { resolveConfig, USG_REP_TOLERANCE_MM } from './config'
import { resolveConversion, toEquationEquivalentMm } from './conversion'
import {
  bodyDensity,
  getDensityEquation,
  getFatFormula,
  percentFatFromDensity,
  pickDensityEquation,
  validitySumLimit,
} from './equations'
import { getProtocol, getSite, isProtocolCompatibleWithSexo } from './protocols'

// ---------------------------------------------------------------------------
// Utilitários numéricos
// ---------------------------------------------------------------------------

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals
  return Math.round((value + Number.EPSILON) * factor) / factor
}

function roundOrNull(value: number | null, decimals: number): number | null {
  return value === null ? null : round(value, decimals)
}

/**
 * Consolida as repetições de um sítio.
 *
 * A mediana é o default: com três medidas ela descarta o extremo, que quase
 * sempre é aquela em que se apertou demais o transdutor — a força reduz a
 * espessura medida em até 36%. Com duas medidas, a mediana é a média.
 */
export function aggregateReps(
  reps: number[],
  rule: UsgRepAggregation
): { valor_mm: number | null; cv_percent: number | null } {
  const valid = reps.filter((r) => Number.isFinite(r) && r > 0)
  // null, e não 0: a coluna tem CHECK valor_mm > 0, e devolver um número como
  // sentinela de "não há valor" convidaria a gravar zero no banco.
  if (valid.length === 0) {
    return { valor_mm: null, cv_percent: null }
  }

  let valor: number
  if (rule === 'max') {
    valor = Math.max(...valid)
  } else if (rule === 'mean') {
    valor = valid.reduce((sum, r) => sum + r, 0) / valid.length
  } else {
    const sorted = [...valid].sort((a, b) => a - b)
    const mid = Math.floor(sorted.length / 2)
    valor =
      sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
  }

  let cv: number | null = null
  if (valid.length > 1) {
    const mean = valid.reduce((sum, r) => sum + r, 0) / valid.length
    if (mean > 0) {
      const variance =
        valid.reduce((sum, r) => sum + (r - mean) ** 2, 0) / (valid.length - 1)
      cv = (Math.sqrt(variance) / mean) * 100
    }
  }

  return { valor_mm: valor, cv_percent: cv }
}

// ---------------------------------------------------------------------------
// Motor
// ---------------------------------------------------------------------------

function measurementKey(site: UsgSiteCode, tecido: string, lado: UsgLado): string {
  return `${site}|${tecido}|${lado}`
}

export function computeUsgAssessment(
  input: UsgComputeInput
): UsgComputeResult {
  const config: UsgCalcConfig = resolveConfig(input.config)
  const conversion: UsgConversion =
    config.conversion === 'linear'
      ? resolveConversion('linear', config.linearFactor, config.linearOffset)
      : resolveConversion(config.conversion)

  const protocol = getProtocol(input.protocolo)
  const avisos: UsgWarning[] = []

  // --- equação aplicável -----------------------------------------------------
  let equacaoId: DensityEquationId | null = null
  if (input.equacaoDensidadeOverride !== undefined) {
    equacaoId = input.equacaoDensidadeOverride
    // Um override que não bate com os sítios do protocolo produziria um número
    // plausível à vista e clinicamente absurdo (rodar a equação de 3 sítios
    // sobre a soma de 7). Ele é recusado, não apenas avisado.
    if (equacaoId !== null) {
      const eq = getDensityEquation(equacaoId)
      const mesmosSitios =
        eq.sites.length === protocol.fatSites.length &&
        [...eq.sites].sort().join('|') === [...protocol.fatSites].sort().join('|')
      if (!mesmosSitios) {
        avisos.push({
          code: 'protocolo_sem_equacao',
          detail: `A equação ${eq.label} não corresponde aos sítios do protocolo ${protocol.label}. O percentual de gordura não foi estimado.`,
        })
        equacaoId = null
      }
    }
  } else if (!isProtocolCompatibleWithSexo(input.protocolo, input.sexo)) {
    avisos.push({
      code: 'protocolo_incompativel_com_sexo',
      detail: `O protocolo ${protocol.label} não tem equação para o sexo informado.`,
    })
  } else {
    equacaoId = pickDensityEquation(input.protocolo, input.sexo)
  }

  // Aviso emitido SEMPRE que não haverá estimativa, inclusive nos protocolos
  // que por natureza não estimam. Sem ele, a interface não consegue distinguir
  // "este protocolo não calcula isso" de "o cálculo falhou".
  if (equacaoId === null && avisos.length === 0) {
    avisos.push({
      code: 'protocolo_sem_equacao',
      detail: `O protocolo ${protocol.label} não estima percentual de gordura.`,
    })
  }

  // --- consolidação por sítio ------------------------------------------------
  const vistos = new Set<string>()
  const resultados: UsgSiteResult[] = []

  for (const medida of input.medidas) {
    const lado: UsgLado = medida.lado ?? 'D'
    const chave = measurementKey(medida.site, medida.tecido, lado)

    if (vistos.has(chave)) {
      avisos.push({
        code: 'sitio_duplicado',
        site: medida.site,
        detail: `Sítio ${medida.site} enviado mais de uma vez. A primeira medida foi mantida.`,
      })
      continue
    }
    vistos.add(chave)

    const resultado = consolidarSitio(medida, lado, protocol.fatSites, config, conversion, avisos)
    if (resultado) resultados.push(resultado)
  }

  // --- sítios obrigatórios ausentes -----------------------------------------
  // Só o lado direito conta (padrão ISAK, e é o lado para o qual as equações
  // foram desenvolvidas). Uma medida do lado esquerdo é guardada como dado
  // clínico, mas não completa o protocolo nem entra no somatório — do
  // contrário, medir os dois lados dobraria o Σ.
  const medidosGordura = new Set(
    resultados.filter((r) => r.tecido === 'gordura' && r.lado === 'D').map((r) => r.site)
  )
  const faltandoGordura = protocol.fatSites.filter((s) => !medidosGordura.has(s))
  for (const site of faltandoGordura) {
    avisos.push({
      code: 'sitio_faltando',
      site,
      detail: `${getSite(site).label} não foi medido. Sem ele, a soma e o percentual de gordura não podem ser calculados.`,
    })
  }

  const medidosMusculo = new Set(
    resultados.filter((r) => r.tecido === 'musculo' && r.lado === 'D').map((r) => r.site)
  )
  const musculoParcial =
    medidosMusculo.size > 0 &&
    protocol.muscleSites.some((s) => !medidosMusculo.has(s))
  if (musculoParcial) {
    for (const site of protocol.muscleSites.filter((s) => !medidosMusculo.has(s))) {
      avisos.push({
        code: 'sitio_faltando',
        site,
        detail: `${getSite(site).label} não foi medido. A soma de espessura muscular fica indisponível.`,
      })
    }
  }

  // --- somatórios ------------------------------------------------------------
  const gorduraCompleta = faltandoGordura.length === 0 && protocol.fatSites.length > 0

  const naSoma = resultados.filter((r) => r.entrou_na_soma)
  const somaGordura = gorduraCompleta
    ? naSoma.reduce((sum, r) => sum + r.valor_mm, 0)
    : null
  const somaEquivalente = gorduraCompleta
    ? naSoma.reduce((sum, r) => sum + (r.valor_equivalente_mm ?? 0), 0)
    : null

  const musculoCompleto =
    protocol.muscleSites.length > 0 &&
    protocol.muscleSites.every((s) => medidosMusculo.has(s))
  const somaMuscular = musculoCompleto
    ? resultados
        .filter(
          (r) =>
            r.tecido === 'musculo' &&
            r.lado === 'D' &&
            protocol.muscleSites.includes(r.site)
        )
        .reduce((sum, r) => sum + r.valor_mm, 0)
    : null

  // --- densidade e percentual ------------------------------------------------
  let densidade: number | null = null
  let percentual: number | null = null

  if (equacaoId !== null && somaEquivalente !== null) {
    const eq = getDensityEquation(equacaoId)

    if (input.idade < eq.idadeValidaMin || input.idade > eq.idadeValidaMax) {
      avisos.push({
        code: 'idade_fora_faixa',
        detail: `A equação ${eq.label} foi validada para ${eq.idadeValidaMin} a ${eq.idadeValidaMax} anos. O resultado é menos preciso fora dessa faixa.`,
      })
    }

    const limite = validitySumLimit(eq)
    const foraDaValidade = somaEquivalente > limite

    if (foraDaValidade) {
      // Além do vértice da parábola a equação se inverte: mais gordura passaria
      // a devolver menos percentual. Preferimos não estimar a estimar ao contrário.
      avisos.push({
        code: 'soma_fora_da_validade',
        detail: `A soma das dobras equivalentes (${round(somaEquivalente, 1)} mm) passou do limite de validade da equação ${eq.label} (${round(limite, 0)} mm). O percentual de gordura não foi estimado — use a soma em milímetros para acompanhar a evolução.`,
      })
    }

    densidade = foraDaValidade ? null : bodyDensity(eq, somaEquivalente, input.idade)

    if (densidade === null && !foraDaValidade) {
      avisos.push({
        code: 'densidade_implausivel',
        detail:
          'A densidade corporal calculada ficou fora da faixa fisiológica. Confira as medidas e a idade.',
      })
    } else if (densidade !== null) {
      const bruto = percentFatFromDensity(densidade, getFatFormula(config.fatFormula))
      if (
        bruto === null ||
        bruto < config.percentFatMin ||
        bruto > config.percentFatMax
      ) {
        avisos.push({
          code: 'percentual_fora_faixa',
          detail: `O percentual de gordura calculado (${bruto === null ? 'inválido' : round(bruto, 1)}%) está fora da faixa aceita de ${config.percentFatMin}% a ${config.percentFatMax}%. Confira as medidas.`,
        })
      } else {
        percentual = bruto
      }
    }
  }

  // --- massas ----------------------------------------------------------------
  let massaGorda: number | null = null
  let massaMagra: number | null = null

  if (percentual !== null) {
    if (input.peso_kg !== null && Number.isFinite(input.peso_kg) && input.peso_kg > 0) {
      massaGorda = (input.peso_kg * percentual) / 100
      massaMagra = input.peso_kg - massaGorda
    } else {
      avisos.push({
        code: 'sem_peso',
        detail:
          'Sem o peso não é possível calcular massa gorda e massa magra. O percentual de gordura continua válido.',
      })
    }
  }

  return {
    equation_version: config.version,
    medidas: ordenarResultados(resultados, protocol.fatSites, protocol.muscleSites).map(
      (r) => ({
        ...r,
        valor_mm: round(r.valor_mm, 2),
        valor_equivalente_mm: roundOrNull(r.valor_equivalente_mm, 2),
        cv_percent: roundOrNull(r.cv_percent, 2),
      })
    ),
    soma_gordura_mm: roundOrNull(somaGordura, 2),
    soma_equivalente_mm: roundOrNull(somaEquivalente, 2),
    soma_muscular_mm: roundOrNull(somaMuscular, 2),
    densidade_corporal: roundOrNull(densidade, 5),
    percentual_gordura: roundOrNull(percentual, 1),
    massa_gorda_kg: roundOrNull(massaGorda, 2),
    massa_magra_kg: roundOrNull(massaMagra, 2),
    equacao_densidade: equacaoId,
    formula_percentual: config.fatFormula,
    conversao_id: conversion.id,
    conversao_fator: conversion.factor,
    conversao_offset: conversion.offset,
    agregacao_repeticoes: config.repAggregation,
    // Sempre false enquanto nenhuma conversão for calibrada contra método de
    // referência nesta população. É o que faz a interface rotular "estimativa".
    estimativa_confiavel: conversion.validated && percentual !== null,
    // Ordenação estável: sem ela, inverter a ordem das medidas na entrada
    // mudaria a ordem dos avisos e, como eles são gravados em JSONB, qualquer
    // diff de auditoria acusaria uma alteração que não houve.
    avisos: ordenarAvisos(avisos),
  }
}

function ordenarAvisos(avisos: UsgWarning[]): UsgWarning[] {
  return [...avisos].sort((a, b) => {
    if (a.code !== b.code) return a.code.localeCompare(b.code)
    return (a.site ?? '').localeCompare(b.site ?? '')
  })
}

function consolidarSitio(
  medida: UsgSiteInput,
  lado: UsgLado,
  fatSites: readonly UsgSiteCode[],
  config: UsgCalcConfig,
  conversion: UsgConversion,
  avisos: UsgWarning[]
): UsgSiteResult | null {
  const site = getSite(medida.site)
  const reps = (medida.repeticoes_mm ?? []).filter((r) => Number.isFinite(r) && r > 0)

  const { valor_mm, cv_percent } = aggregateReps(reps, config.repAggregation)
  // Sem nenhuma repetição válida não há medida — o sítio é tratado como não
  // medido e cai no aviso de sítio faltando, em vez de virar linha com zero.
  if (valor_mm === null) return null

  const [minMm, maxMm] = site.faixaPlausivelMm
  if (valor_mm < minMm || valor_mm > maxMm) {
    avisos.push({
      code: 'valor_fora_faixa',
      site: medida.site,
      detail: `${valor_mm.toFixed(1)} mm está fora da faixa esperada para ${site.label} (${minMm}–${maxMm} mm). Confira a pressão do transdutor e o ponto.`,
    })
  }

  const amplitude = Math.max(...reps) - Math.min(...reps)
  const foraDeTolerancia =
    (cv_percent !== null && cv_percent > config.cvWarnPercent) ||
    amplitude > USG_REP_TOLERANCE_MM

  if (foraDeTolerancia && reps.length > 1) {
    avisos.push({
      code: 'cv_alto',
      site: medida.site,
      detail: `As repetições de ${site.label} variaram ${amplitude.toFixed(1)} mm entre si. Considere repetir a medida.`,
    })
  }

  const ehGordura = medida.tecido === 'gordura'
  // Lado esquerdo nunca entra na soma: o protocolo é do lado direito, e contar
  // os dois lados dobraria o Σ do sítio.
  const noProtocolo = ehGordura && lado === 'D' && fatSites.includes(medida.site)

  if (ehGordura && !noProtocolo && fatSites.length > 0) {
    avisos.push({
      code: 'sitio_extra_ignorado',
      site: medida.site,
      detail:
        lado === 'E'
          ? `${site.label} foi medido do lado esquerdo. A medida foi guardada, mas o protocolo usa o lado direito e ela não entra na soma.`
          : `${site.label} não faz parte deste protocolo. A medida foi guardada, mas não entra na soma.`,
    })
  }

  return {
    site: medida.site,
    tecido: medida.tecido,
    lado,
    repeticoes_mm: reps,
    valor_mm,
    valor_equivalente_mm: ehGordura
      ? toEquationEquivalentMm(valor_mm, conversion)
      : null,
    cv_percent,
    fora_de_tolerancia: foraDeTolerancia,
    entrou_na_soma: noProtocolo,
  }
}

/** Ordena de forma estável: gordura do protocolo, músculo do protocolo, extras. */
function ordenarResultados(
  resultados: UsgSiteResult[],
  fatSites: readonly UsgSiteCode[],
  muscleSites: readonly UsgSiteCode[]
): UsgSiteResult[] {
  const peso = (r: UsgSiteResult): number => {
    const iFat = fatSites.indexOf(r.site)
    if (r.tecido === 'gordura' && iFat >= 0) return iFat
    const iMusc = muscleSites.indexOf(r.site)
    if (r.tecido === 'musculo' && iMusc >= 0) return 1000 + iMusc
    return 2000
  }

  return [...resultados].sort((a, b) => {
    const diff = peso(a) - peso(b)
    if (diff !== 0) return diff
    if (a.site !== b.site) return a.site.localeCompare(b.site)
    if (a.tecido !== b.tecido) return a.tecido.localeCompare(b.tecido)
    return a.lado.localeCompare(b.lado)
  })
}
