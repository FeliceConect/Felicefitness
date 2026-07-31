/**
 * Ponte entre o corpo da requisição HTTP e o motor de cálculo.
 *
 * Regra de ouro das rotas: o servidor recalcula tudo com `computeUsgAssessment`
 * e IGNORA qualquer derivado que o cliente tenha enviado. O cliente manda
 * milímetros; percentual de gordura e massas são responsabilidade do servidor.
 */

import { calcularIdade, getTodayDateSP } from '@/lib/utils/date'
import { computeUsgAssessment } from './engine'
import { getProtocol, isValidProtocolCode, isValidSiteCode } from './protocols'
import type {
  UsgCalcConfig,
  UsgComputeInput,
  UsgComputeResult,
  UsgLado,
  UsgProtocolCode,
  UsgSexo,
  UsgSiteInput,
  UsgTecido,
} from './types'

const MOMENTOS_VALIDOS = ['M0', 'M1', 'M2', 'M3', 'M4', 'M5', 'M6'] as const
const MAX_REPETICOES = 5
const MAX_ESPESSURA_MM = 120

export interface UsgAssessmentMeta {
  data: string
  horario_coleta: string | null
  momento_avaliacao: string | null
  equipamento: string | null
  transdutor_mhz: number | null
  /** Compartilhada com o paciente — ver o comentário na migration. */
  interpretacao: string | null
  /**
   * Sexo a GRAVAR. Diferente de `input.sexo`, que o motor sempre exige: em
   * protocolo sem equação o sexo pode ser genuinamente desconhecido, e gravar
   * um palpite deixaria o registro clínico mentindo.
   */
  sexo_registrado: UsgSexo | null
}

export interface UsgParseOk {
  ok: true
  input: UsgComputeInput
  meta: UsgAssessmentMeta
}

export interface UsgParseError {
  ok: false
  error: string
  status: number
}

export type UsgParseResult = UsgParseOk | UsgParseError

/** Dados do paciente usados como fallback quando o corpo não os traz. */
export interface UsgPatientDefaults {
  sexo: string | null
  data_nascimento: string | null
  peso_kg?: number | null
  altura_cm?: number | null
}

function erro(error: string, status = 400): UsgParseError {
  return { ok: false, error, status }
}

/**
 * Converte para número aceitando apenas número ou string numérica.
 *
 * Nada de `Number(valor)` genérico: em JavaScript `Number([1])` é 1 e
 * `Number(true)` é 1, então um array aninhado ou um booleano no corpo da
 * requisição viraria uma medida de 1 mm sem ninguém perceber.
 */
function numeroOuNull(valor: unknown): number | null {
  if (typeof valor === 'number') {
    return Number.isFinite(valor) ? valor : null
  }
  if (typeof valor === 'string') {
    const texto = valor.trim()
    if (!/^-?\d+([.,]\d+)?$/.test(texto)) return null
    const n = Number(texto.replace(',', '.'))
    return Number.isFinite(n) ? n : null
  }
  return null
}

/**
 * Texto saneado com teto de tamanho. O corte evita que um campo colado sem
 * querer estoure o limite da coluna e vire erro 500 genérico em vez de um
 * salvamento bem-sucedido.
 */
function textoOuNull(valor: unknown, maxLength = 5000): string | null {
  if (typeof valor !== 'string') return null
  const t = valor.trim().slice(0, maxLength)
  return t.length > 0 ? t : null
}

function normalizarSexo(valor: unknown): UsgSexo | null {
  if (typeof valor !== 'string') return null
  const v = valor.trim().toLowerCase()
  if (v === 'masculino' || v === 'm') return 'masculino'
  if (v === 'feminino' || v === 'f') return 'feminino'
  return null
}

function parseMedidas(bruto: unknown): UsgSiteInput[] | UsgParseError {
  if (!Array.isArray(bruto) || bruto.length === 0) {
    return erro('Envie ao menos uma medida.')
  }

  const medidas: UsgSiteInput[] = []

  for (const item of bruto) {
    if (typeof item !== 'object' || item === null) {
      return erro('Formato de medida inválido.')
    }
    const registro = item as Record<string, unknown>

    const site = registro.site
    if (typeof site !== 'string' || !isValidSiteCode(site)) {
      return erro(`Sítio desconhecido: ${String(site)}`)
    }

    const tecido = registro.tecido
    if (tecido !== 'gordura' && tecido !== 'musculo') {
      return erro(`Tecido inválido em ${site}. Use "gordura" ou "musculo".`)
    }

    const lado = registro.lado === 'E' ? 'E' : 'D'

    const repsBrutas = registro.repeticoes_mm
    if (!Array.isArray(repsBrutas) || repsBrutas.length === 0) {
      return erro(`Informe ao menos uma medida em ${site}.`)
    }
    if (repsBrutas.length > MAX_REPETICOES) {
      return erro(`Máximo de ${MAX_REPETICOES} repetições por sítio (${site}).`)
    }

    const repeticoes: number[] = []
    for (const rep of repsBrutas) {
      const n = numeroOuNull(rep)
      if (n === null || n <= 0 || n > MAX_ESPESSURA_MM) {
        return erro(
          `Medida inválida em ${site}: ${String(rep)}. Use um valor entre 0,1 e ${MAX_ESPESSURA_MM} mm.`
        )
      }
      repeticoes.push(n)
    }

    medidas.push({
      site,
      tecido: tecido as UsgTecido,
      lado: lado as UsgLado,
      repeticoes_mm: repeticoes,
    })
  }

  return medidas
}

function parseConfig(bruto: unknown): Partial<UsgCalcConfig> | undefined {
  if (typeof bruto !== 'object' || bruto === null) return undefined
  const registro = bruto as Record<string, unknown>
  const config: Partial<UsgCalcConfig> = {}

  if (
    registro.conversion === 'raw' ||
    registro.conversion === 'double' ||
    registro.conversion === 'linear'
  ) {
    config.conversion = registro.conversion
  }
  if (registro.fatFormula === 'siri' || registro.fatFormula === 'brozek') {
    config.fatFormula = registro.fatFormula
  }
  if (
    registro.repAggregation === 'median' ||
    registro.repAggregation === 'mean' ||
    registro.repAggregation === 'max'
  ) {
    config.repAggregation = registro.repAggregation
  }

  const fator = numeroOuNull(registro.linearFactor)
  if (fator !== null && fator > 0 && fator <= 4) config.linearFactor = fator

  const offset = numeroOuNull(registro.linearOffset)
  if (offset !== null && offset >= 0 && offset <= 20) config.linearOffset = offset

  return Object.keys(config).length > 0 ? config : undefined
}

/**
 * Reconstrói a configuração PINADA de uma avaliação já gravada.
 *
 * Sem isto, editar uma avaliação antiga a recalcularia com a configuração
 * vigente hoje — e uma recalibração futura da conversão reescreveria em
 * silêncio o percentual de uma coleta de dois anos atrás, misturando duas
 * conversões na mesma série histórica. É exatamente o que o versionamento
 * existe para impedir.
 */
export function configFromStoredRow(row: {
  equation_version?: string | null
  conversao_id?: string | null
  conversao_fator?: number | string | null
  conversao_offset?: number | string | null
  agregacao_repeticoes?: string | null
  formula_percentual?: string | null
}): Partial<UsgCalcConfig> {
  const config: Partial<UsgCalcConfig> = {}

  if (row.equation_version) config.version = row.equation_version
  if (
    row.conversao_id === 'raw' ||
    row.conversao_id === 'double' ||
    row.conversao_id === 'linear'
  ) {
    config.conversion = row.conversao_id
  }
  if (row.formula_percentual === 'siri' || row.formula_percentual === 'brozek') {
    config.fatFormula = row.formula_percentual
  }
  if (
    row.agregacao_repeticoes === 'median' ||
    row.agregacao_repeticoes === 'mean' ||
    row.agregacao_repeticoes === 'max'
  ) {
    config.repAggregation = row.agregacao_repeticoes
  }

  const fator = numeroOuNull(row.conversao_fator ?? null)
  if (fator !== null) config.linearFactor = fator
  const offset = numeroOuNull(row.conversao_offset ?? null)
  if (offset !== null) config.linearOffset = offset

  return config
}

/**
 * Valida o corpo da requisição e monta a entrada do motor.
 *
 * Sexo e idade nunca são inferidos em silêncio: sexo errado troca a equação
 * inteira, então quando o perfil não tem a informação (o campo é anulável e
 * aceita "outro") a rota exige que ela venha explícita.
 */
export function parseUsgRequest(
  body: unknown,
  paciente: UsgPatientDefaults,
  /**
   * Configuração de base — use `configFromStoredRow` ao editar, para que a
   * avaliação continue sendo calculada com os parâmetros dela, não com os
   * parâmetros de hoje. Um `config` explícito no corpo ainda vence, porque aí
   * a recalibração é intencional.
   */
  baseConfig?: Partial<UsgCalcConfig>
): UsgParseResult {
  if (typeof body !== 'object' || body === null) {
    return erro('Corpo da requisição inválido.')
  }
  const registro = body as Record<string, unknown>

  // --- protocolo -----------------------------------------------------------
  const protocoloBruto = registro.protocolo
  if (typeof protocoloBruto !== 'string' || !isValidProtocolCode(protocoloBruto)) {
    return erro(`Protocolo desconhecido: ${String(protocoloBruto)}`)
  }
  const protocolo = protocoloBruto as UsgProtocolCode
  const protocolDef = getProtocol(protocolo)
  const exigeEquacao = protocolDef.densityEquationBySexo !== null

  // --- data ----------------------------------------------------------------
  const dataBruta = textoOuNull(registro.data) ?? getTodayDateSP()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dataBruta)) {
    return erro('Data inválida. Use o formato AAAA-MM-DD.')
  }

  // --- momento -------------------------------------------------------------
  const momento = textoOuNull(registro.momento_avaliacao)
  if (momento !== null && !(MOMENTOS_VALIDOS as readonly string[]).includes(momento)) {
    return erro('Momento de avaliação inválido. Use de M0 a M6.')
  }

  // --- sexo ----------------------------------------------------------------
  const sexo = normalizarSexo(registro.sexo) ?? normalizarSexo(paciente.sexo)
  if (!sexo) {
    if (exigeEquacao) {
      return erro(
        'Informe o sexo para o cálculo. O cadastro do paciente não tem essa informação em formato utilizável.'
      )
    }
  }

  // --- idade ---------------------------------------------------------------
  const idadeInformada = numeroOuNull(registro.idade)
  const idadeDerivada = calcularIdade(paciente.data_nascimento, dataBruta)
  const idade = idadeInformada ?? idadeDerivada
  if (exigeEquacao && idade === null) {
    return erro(
      'Informe a idade do paciente. O cadastro não tem data de nascimento válida.'
    )
  }
  // A faixa vale SEMPRE que houver idade, não só quando o protocolo usa
  // equação: o CHECK da tabela é 10–100, e deixar passar aqui trocaria uma
  // mensagem clara por um erro 500 genérico do banco. O arredondamento importa
  // porque a coluna é INTEGER: calcular com 42,5 e gravar 43 quebraria a
  // reprodutibilidade do recálculo.
  const idadeInteira = idade === null ? null : Math.round(idade)
  if (idadeInteira !== null && (idadeInteira < 10 || idadeInteira > 100)) {
    return erro('Idade fora da faixa aceita (10 a 100 anos).')
  }

  // --- medidas antropométricas --------------------------------------------
  const peso = numeroOuNull(registro.peso_kg) ?? paciente.peso_kg ?? null
  if (peso !== null && (peso < 20 || peso > 400)) {
    return erro('Peso fora da faixa aceita (20 a 400 kg).')
  }

  const altura = numeroOuNull(registro.altura_cm) ?? paciente.altura_cm ?? null
  if (altura !== null && (altura < 80 || altura > 250)) {
    return erro('Altura fora da faixa aceita (80 a 250 cm).')
  }

  const transdutor = numeroOuNull(registro.transdutor_mhz)
  if (transdutor !== null && (transdutor <= 0 || transdutor > 30)) {
    return erro('Frequência do transdutor fora da faixa aceita (0 a 30 MHz).')
  }

  const horario = textoOuNull(registro.horario_coleta)
  if (horario !== null && !/^\d{2}:\d{2}(:\d{2})?$/.test(horario)) {
    return erro('Horário de coleta inválido. Use HH:MM.')
  }

  // --- medidas -------------------------------------------------------------
  const medidas = parseMedidas(registro.medidas)
  if (!Array.isArray(medidas)) return medidas

  const configRequisicao = parseConfig(registro.config)
  const config =
    baseConfig || configRequisicao ? { ...baseConfig, ...configRequisicao } : undefined

  return {
    ok: true,
    input: {
      protocolo,
      // Valor só usado para escolher a equação; em protocolo sem equação ele é
      // irrelevante e o que vai para o banco é `meta.sexo_registrado` (null).
      sexo: sexo ?? 'feminino',
      idade: idadeInteira ?? 0,
      peso_kg: peso,
      altura_cm: altura,
      medidas,
      config,
    },
    meta: {
      data: dataBruta,
      horario_coleta: horario,
      momento_avaliacao: momento,
      // 120 é o limite da coluna VARCHAR(120); cortar aqui evita erro 22001.
      equipamento: textoOuNull(registro.equipamento, 120),
      transdutor_mhz: transdutor,
      interpretacao: textoOuNull(registro.interpretacao),
      sexo_registrado: sexo,
    },
  }
}

/** Linha da tabela pai, pronta para insert/update. */
export function buildAssessmentRow(
  input: UsgComputeInput,
  meta: UsgAssessmentMeta,
  resultado: UsgComputeResult
): Record<string, unknown> {
  return {
    data: meta.data,
    horario_coleta: meta.horario_coleta,
    momento_avaliacao: meta.momento_avaliacao,
    protocolo: input.protocolo,
    sexo: meta.sexo_registrado,
    idade: input.idade > 0 ? input.idade : null,
    peso_kg: input.peso_kg,
    altura_cm: input.altura_cm,
    equipamento: meta.equipamento,
    transdutor_mhz: meta.transdutor_mhz,
    soma_gordura_mm: resultado.soma_gordura_mm,
    soma_equivalente_mm: resultado.soma_equivalente_mm,
    soma_muscular_mm: resultado.soma_muscular_mm,
    densidade_corporal: resultado.densidade_corporal,
    percentual_gordura: resultado.percentual_gordura,
    massa_gorda_kg: resultado.massa_gorda_kg,
    massa_magra_kg: resultado.massa_magra_kg,
    equation_version: resultado.equation_version,
    equacao_densidade: resultado.equacao_densidade,
    formula_percentual: resultado.formula_percentual,
    conversao_id: resultado.conversao_id,
    conversao_fator: resultado.conversao_fator,
    conversao_offset: resultado.conversao_offset,
    agregacao_repeticoes: resultado.agregacao_repeticoes,
    estimativa_confiavel: resultado.estimativa_confiavel,
    calculo_avisos: resultado.avisos,
    interpretacao: meta.interpretacao,
  }
}

/** Linhas da tabela filha, no formato aceito pela RPC de gravação atômica. */
export function buildMeasurementRows(
  resultado: UsgComputeResult
): Array<Record<string, unknown>> {
  return resultado.medidas.map((m) => ({
    site: m.site,
    tecido: m.tecido,
    lado: m.lado,
    repeticoes_mm: m.repeticoes_mm,
    valor_mm: m.valor_mm,
    cv_percent: m.cv_percent,
    fora_de_tolerancia: m.fora_de_tolerancia,
    observacao: null,
  }))
}

/** Recalcula uma avaliação já gravada a partir do bruto. */
export function recomputeFromStored(
  assessment: {
    protocolo: string
    sexo: string | null
    idade: number | null
    peso_kg: number | null
    altura_cm: number | null
  },
  medidas: Array<{
    site: string
    tecido: string
    lado: string
    repeticoes_mm: number[]
  }>,
  config?: Partial<UsgCalcConfig>
): UsgComputeResult {
  return computeUsgAssessment({
    protocolo: assessment.protocolo as UsgProtocolCode,
    sexo: (normalizarSexo(assessment.sexo) ?? 'feminino') as UsgSexo,
    idade: assessment.idade ?? 0,
    peso_kg: assessment.peso_kg,
    altura_cm: assessment.altura_cm,
    medidas: medidas.map((m) => ({
      site: m.site as UsgSiteInput['site'],
      tecido: m.tecido as UsgTecido,
      lado: (m.lado === 'E' ? 'E' : 'D') as UsgLado,
      repeticoes_mm: m.repeticoes_mm,
    })),
    config,
  })
}
