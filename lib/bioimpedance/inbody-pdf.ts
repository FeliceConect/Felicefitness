/**
 * Parser determinístico do bloco segmentar de relatórios InBody em PDF.
 *
 * PROBLEMA QUE ISTO RESOLVE
 * O texto extraído do PDF do InBody NÃO contém os rótulos "Esquerdo"/"Direito":
 * eles são desenhados como texto rotacionado na moldura do gráfico e não saem
 * na extração (`unpdf`). Sem rótulo, a IA precisava adivinhar o lado de cada
 * valor — e vinha trocando D com E de forma sistemática.
 *
 * COMO O LAYOUT FUNCIONA
 * No relatório (InBody120, layout BR-Português) a análise segmentar é desenhada
 * sobre uma silhueta, com os rótulos verticais nas laterais: "Esquerdo" à
 * ESQUERDA da silhueta e "Direito" à DIREITA. A extração de texto respeita a
 * ordem de desenho (esquerda→direita, cima→baixo), então cada bloco de 5
 * segmentos sai nesta ordem:
 *
 *   [braço esquerdo, braço direito, tronco, perna esquerda, perna direita]
 *
 * E são dois blocos consecutivos: "Análise da Massa Magra Segmentar" e depois
 * "Análise da Gordura Segmentar" — 10 pares `<kg> <%>` no total.
 *
 * Este módulo lê esses 10 pares direto do texto e atribui os lados por posição,
 * eliminando o chute da IA. Também confere o resultado contra a tabela de
 * Impedância Z(Ω) do rodapé, que é a única informação com lado explícito.
 */

/** Pares no formato `3,60kg 107,8%` — o `%` obrigatório evita casar com os
 *  campos de Controle de Peso ("- 4,2 kg"), que não têm percentual.
 *  Guardado como string e instanciado por chamada: RegExp com /g é stateful. */
const SEGMENT_PAIR_PATTERN = '(\\d+(?:[.,]\\d+)?)\\s*kg\\s*(\\d+(?:[.,]\\d+)?)\\s*%'

const NUMBER_PATTERN = '\\d+(?:[.,]\\d+)?'

const LEAN_KEYS = [
  ['massa_magra_braco_esquerdo', 'massa_magra_braco_esquerdo_percent'],
  ['massa_magra_braco_direito', 'massa_magra_braco_direito_percent'],
  ['massa_magra_tronco', 'massa_magra_tronco_percent'],
  ['massa_magra_perna_esquerda', 'massa_magra_perna_esquerda_percent'],
  ['massa_magra_perna_direita', 'massa_magra_perna_direita_percent'],
] as const

const FAT_KEYS = [
  ['gordura_braco_esquerdo', 'gordura_braco_esquerdo_percent'],
  ['gordura_braco_direito', 'gordura_braco_direito_percent'],
  ['gordura_tronco', 'gordura_tronco_percent'],
  ['gordura_perna_esquerda', 'gordura_perna_esquerda_percent'],
  ['gordura_perna_direita', 'gordura_perna_direita_percent'],
] as const

interface SegmentPair {
  kg: number
  percent: number
}

export interface InbodySegmentalParse {
  /** Os 20 campos segmentares (kg + %) com os lados já corretos. */
  values: Record<string, number>
  /** Alertas para revisão humana. Vazio quando tudo confere. */
  warnings: string[]
}

function toNumber(raw: string): number {
  return parseFloat(raw.replace(',', '.'))
}

function extractPairs(text: string): SegmentPair[] {
  const pairs: SegmentPair[] = []
  const re = new RegExp(SEGMENT_PAIR_PATTERN, 'gi')
  let match: RegExpExecArray | null
  while ((match = re.exec(text)) !== null) {
    const kg = toNumber(match[1])
    const percent = toNumber(match[2])
    if (!Number.isNaN(kg) && !Number.isNaN(percent)) pairs.push({ kg, percent })
  }
  return pairs
}

function extractNumbers(text: string): number[] {
  const numbers: number[] = []
  const re = new RegExp(NUMBER_PATTERN, 'g')
  let match: RegExpExecArray | null
  while ((match = re.exec(text)) !== null) {
    numbers.push(toNumber(match[0]))
  }
  return numbers
}

/**
 * Confere os lados contra a tabela de Impedância Z(Ω) do rodapé, que sai no
 * texto como 10 números na ordem BD, BE, TR, PD, PE em 20 kHz e os mesmos 5 em
 * 100 kHz. Impedância é inversamente proporcional à massa magra do segmento:
 * se o braço direito tem mais massa magra, sua impedância tem que ser MENOR.
 *
 * Só gera alerta — nunca troca valores sozinho, para não transformar um acerto
 * em erro quando o rodapé não for reconhecido.
 */
function checkAgainstImpedance(text: string, values: Record<string, number>): string | null {
  const numbers = extractNumbers(text)
  if (numbers.length < 10) return null

  const tail = numbers.slice(-10)
  const [bd20, be20, tr20, pd20, pe20] = tail
  const [bd100, be100, tr100, pd100, pe100] = tail.slice(5)

  // Valida que os 10 últimos números realmente são a tabela de impedância:
  // o tronco tem impedância muito menor que os membros, e 100 kHz é sempre
  // menor que 20 kHz no mesmo segmento.
  const looksLikeImpedanceTable =
    tr20 < bd20 * 0.5 && tr100 < bd100 * 0.5 &&
    bd100 < bd20 && be100 < be20 && pd100 < pd20 && pe100 < pe20
  if (!looksLikeImpedanceTable) return null

  const inverted: string[] = []
  const check = (
    label: string,
    impedanceRight: number,
    impedanceLeft: number,
    leanRight: number,
    leanLeft: number,
  ) => {
    if (!Number.isFinite(leanRight) || !Number.isFinite(leanLeft)) return
    const leanDiff = leanRight - leanLeft
    const impedanceDiff = impedanceRight - impedanceLeft
    // Empates não são conclusivos: ignora diferenças pequenas nos dois lados.
    if (Math.abs(leanDiff) < 0.15 || Math.abs(impedanceDiff) < 3) return
    // Esperado: sinais opostos. Sinais iguais indicam lado trocado.
    if (Math.sign(leanDiff) === Math.sign(impedanceDiff)) inverted.push(label)
  }

  check('braços', bd20, be20, values.massa_magra_braco_direito, values.massa_magra_braco_esquerdo)
  check('pernas', pd20, pe20, values.massa_magra_perna_direita, values.massa_magra_perna_esquerda)

  if (inverted.length === 0) return null
  return `Possível inversão D/E em ${inverted.join(' e ')}: a impedância do PDF não bate com a massa magra atribuída. Confira no relatório antes de salvar.`
}

/**
 * Extrai os campos segmentares do texto de um PDF InBody.
 * Retorna `null` quando o layout não é reconhecido (nesse caso o chamador deve
 * manter o que a IA leu e pedir revisão manual dos lados).
 */
export function parseInbodySegmental(pdfText: string): InbodySegmentalParse | null {
  const pairs = extractPairs(pdfText)
  if (pairs.length !== 10) return null

  const warnings: string[] = []
  let lean = pairs.slice(0, 5)
  let fat = pairs.slice(5, 10)

  // A massa magra segmentar vem antes da gordura segmentar no relatório.
  // Confirmação barata: a soma dos 5 segmentos magros é maior que a dos gordos
  // sempre que o percentual de gordura é menor que ~50%.
  const sumKg = (group: SegmentPair[]) => group.reduce((acc, p) => acc + p.kg, 0)
  if (sumKg(lean) < sumKg(fat)) {
    [lean, fat] = [fat, lean]
    warnings.push('Os blocos de massa magra e gordura segmentar vieram em ordem inesperada no PDF — confira os valores antes de salvar.')
  }

  const values: Record<string, number> = {}
  LEAN_KEYS.forEach(([kgKey, percentKey], i) => {
    values[kgKey] = lean[i].kg
    values[percentKey] = lean[i].percent
  })
  FAT_KEYS.forEach(([kgKey, percentKey], i) => {
    values[kgKey] = fat[i].kg
    values[percentKey] = fat[i].percent
  })

  const impedanceWarning = checkAgainstImpedance(pdfText, values)
  if (impedanceWarning) warnings.push(impedanceWarning)

  return { values, warnings }
}
