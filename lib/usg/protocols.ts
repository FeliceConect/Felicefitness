/**
 * Catálogo de sítios anatômicos e protocolos de coleta por ultrassom.
 *
 * O catálogo é DADO, não código: adicionar um sítio ou um protocolo é editar
 * uma entrada aqui, sem tocar no motor de cálculo nem no banco. Por isso o
 * vocabulário de sítios vive aqui e não em CHECK do Postgres — o Supabase é
 * self-hosted e as migrations rodam à mão; incluir um sítio novo não pode
 * depender disso.
 */

import type {
  UsgProtocol,
  UsgProtocolCode,
  UsgSexo,
  UsgSite,
  UsgSiteCode,
} from './types'

// ---------------------------------------------------------------------------
// Sítios
// ---------------------------------------------------------------------------
// Todas as medidas são feitas no LADO DIREITO do corpo (padrão ISAK).
// As faixas plausíveis são generosas de propósito: existem para pegar erro
// grosseiro de digitação, nunca para questionar um paciente real.

export const USG_SITES: Readonly<Record<UsgSiteCode, UsgSite>> = {
  peitoral: {
    code: 'peitoral',
    label: 'Peitoral',
    labelLeigo: 'Peito',
    tecido: 'gordura',
    landmark:
      'Prega diagonal entre a linha axilar anterior e o mamilo. Nos homens, no ponto médio; nas mulheres, no primeiro terço a partir da axila.',
    instrucaoCurta: 'Diagonal, entre a axila e o mamilo.',
    faixaPlausivelMm: [1, 40],
    mapa: { x: 41, y: 27, vista: 'frente' },
  },
  axilar_media: {
    code: 'axilar_media',
    label: 'Axilar média',
    labelLeigo: 'Lateral do tronco',
    tecido: 'gordura',
    landmark:
      'Sobre a linha axilar média, na altura do processo xifoide do esterno. Transdutor na vertical.',
    instrucaoCurta: 'Linha da axila, na altura da ponta do esterno.',
    faixaPlausivelMm: [1, 45],
    mapa: { x: 36, y: 32, vista: 'frente' },
  },
  triceps: {
    code: 'triceps',
    label: 'Tríceps',
    labelLeigo: 'Atrás do braço',
    tecido: 'gordura',
    landmark:
      'Face posterior do braço, no ponto médio entre o acrômio e o olécrano, com o braço relaxado ao longo do corpo.',
    instrucaoCurta: 'Meio do braço, por trás, braço relaxado.',
    faixaPlausivelMm: [1.5, 50],
    mapa: { x: 68.5, y: 33, vista: 'costas' },
  },
  subescapular: {
    code: 'subescapular',
    label: 'Subescapular',
    labelLeigo: 'Abaixo da escápula',
    tecido: 'gordura',
    landmark:
      'Dois centímetros abaixo do ângulo inferior da escápula, seguindo a inclinação natural de 45° da pele.',
    instrucaoCurta: '2 cm abaixo da ponta da escápula, a 45°.',
    faixaPlausivelMm: [1.5, 50],
    mapa: { x: 58, y: 30, vista: 'costas' },
  },
  abdominal: {
    code: 'abdominal',
    label: 'Abdominal',
    labelLeigo: 'Barriga',
    tecido: 'gordura',
    landmark:
      'Dois centímetros à direita da cicatriz umbilical, transdutor na vertical. Paciente em decúbito dorsal, respiração normal.',
    instrucaoCurta: '2 cm ao lado do umbigo, na vertical.',
    faixaPlausivelMm: [1.5, 70],
    mapa: { x: 45, y: 42, vista: 'frente' },
  },
  suprailiaca: {
    code: 'suprailiaca',
    label: 'Suprailíaca',
    labelLeigo: 'Acima do quadril',
    tecido: 'gordura',
    landmark:
      'Logo acima da crista ilíaca, sobre a linha axilar anterior, acompanhando a inclinação oblíqua natural da pele.',
    instrucaoCurta: 'Logo acima do osso do quadril, na diagonal.',
    faixaPlausivelMm: [1.5, 60],
    mapa: { x: 38, y: 44, vista: 'frente' },
  },
  coxa: {
    code: 'coxa',
    label: 'Coxa',
    labelLeigo: 'Frente da coxa',
    tecido: 'gordura',
    landmark:
      'Face anterior da coxa, no ponto médio entre a prega inguinal e a borda superior da patela, com a perna estendida e relaxada.',
    instrucaoCurta: 'Meio da coxa, na frente, perna relaxada.',
    faixaPlausivelMm: [1.5, 60],
    mapa: { x: 43, y: 60, vista: 'frente' },
  },
  panturrilha_medial: {
    code: 'panturrilha_medial',
    label: 'Panturrilha medial',
    labelLeigo: 'Panturrilha',
    tecido: 'gordura',
    landmark:
      'Face medial da panturrilha, no ponto de maior perímetro, com o joelho flexionado a 90°.',
    instrucaoCurta: 'Parte interna da panturrilha, na maior circunferência.',
    faixaPlausivelMm: [1, 40],
    mapa: { x: 43, y: 84, vista: 'frente' },
  },

  // ------------------------------- músculo --------------------------------
  reto_femoral: {
    code: 'reto_femoral',
    label: 'Reto femoral',
    labelLeigo: 'Músculo da coxa (frente)',
    tecido: 'musculo',
    landmark:
      'A 50% da distância entre a espinha ilíaca ântero-superior e a borda superior da patela. Paciente em decúbito dorsal, após 10 minutos de repouso.',
    instrucaoCurta: 'Meio da coxa, na frente. Deitado, relaxado.',
    faixaPlausivelMm: [8, 45],
    mapa: { x: 43, y: 66, vista: 'frente' },
  },
  vasto_lateral: {
    code: 'vasto_lateral',
    label: 'Vasto lateral',
    labelLeigo: 'Músculo da coxa (lateral)',
    tecido: 'musculo',
    landmark:
      'A 2/3 da distância entre a espinha ilíaca ântero-superior e a face lateral da patela.',
    instrucaoCurta: 'Lateral da coxa, a dois terços do quadril.',
    faixaPlausivelMm: [8, 45],
    mapa: { x: 40.5, y: 63, vista: 'frente' },
  },
  biceps_braquial: {
    code: 'biceps_braquial',
    label: 'Bíceps braquial',
    labelLeigo: 'Músculo do braço',
    tecido: 'musculo',
    landmark:
      'Face anterior do braço, a 60% da distância entre o acrômio e a fossa cubital, braço estendido e relaxado.',
    instrucaoCurta: 'Frente do braço, mais perto do cotovelo.',
    faixaPlausivelMm: [10, 60],
    mapa: { x: 31.5, y: 32, vista: 'frente' },
  },
} as const

// ---------------------------------------------------------------------------
// Protocolos
// ---------------------------------------------------------------------------
// A ordem dos sítios é a ordem da coleta e foi escolhida para minimizar
// reposicionamento do paciente: primeiro tudo o que se mede em decúbito dorsal,
// depois o que exige o paciente sentado ou de lado.

export const USG_PROTOCOLS: Readonly<Record<UsgProtocolCode, UsgProtocol>> = {
  jp7: {
    code: 'jp7',
    label: 'Jackson & Pollock — 7 sítios',
    descricao:
      'Protocolo completo, para os dois sexos. Cinco sítios em decúbito dorsal, depois tríceps e subescapular com o paciente sentado.',
    sexo: 'ambos',
    fatSites: [
      'peitoral',
      'axilar_media',
      'abdominal',
      'suprailiaca',
      'coxa',
      'triceps',
      'subescapular',
    ],
    muscleSites: ['reto_femoral', 'vasto_lateral', 'biceps_braquial'],
    densityEquationBySexo: { masculino: 'jp7_h', feminino: 'jp7_m' },
    minRepeticoes: 2,
  },
  jp3_homens: {
    code: 'jp3_homens',
    label: 'Jackson & Pollock — 3 sítios (homens)',
    descricao: 'Versão reduzida para homens: peitoral, abdominal e coxa.',
    sexo: 'masculino',
    fatSites: ['peitoral', 'abdominal', 'coxa'],
    muscleSites: ['reto_femoral', 'vasto_lateral', 'biceps_braquial'],
    densityEquationBySexo: { masculino: 'jp3_h' },
    minRepeticoes: 2,
  },
  jp3_mulheres: {
    code: 'jp3_mulheres',
    label: 'Jackson & Pollock — 3 sítios (mulheres)',
    descricao: 'Versão reduzida para mulheres: tríceps, suprailíaca e coxa.',
    sexo: 'feminino',
    fatSites: ['suprailiaca', 'coxa', 'triceps'],
    muscleSites: ['reto_femoral', 'vasto_lateral', 'biceps_braquial'],
    densityEquationBySexo: { feminino: 'jp3_m' },
    minRepeticoes: 2,
  },
  muscular_basico: {
    code: 'muscular_basico',
    label: 'Espessura muscular',
    descricao:
      'Só espessura muscular, sem estimativa de percentual de gordura. Para acompanhar ganho de massa entre avaliações completas.',
    sexo: 'ambos',
    fatSites: [],
    muscleSites: ['reto_femoral', 'vasto_lateral', 'biceps_braquial'],
    densityEquationBySexo: null,
    minRepeticoes: 2,
  },
  livre: {
    code: 'livre',
    label: 'Livre',
    descricao:
      'Sem protocolo fixo: registra os sítios que forem medidos, sem estimar percentual de gordura.',
    sexo: 'ambos',
    fatSites: [],
    muscleSites: [],
    densityEquationBySexo: null,
    minRepeticoes: 1,
  },
} as const

// ---------------------------------------------------------------------------
// Consultas
// ---------------------------------------------------------------------------

export function getProtocol(code: UsgProtocolCode): UsgProtocol {
  const protocol = USG_PROTOCOLS[code]
  if (!protocol) {
    throw new Error(`Protocolo de ultrassom desconhecido: ${code}`)
  }
  return protocol
}

export function getSite(code: UsgSiteCode): UsgSite {
  const site = USG_SITES[code]
  if (!site) {
    throw new Error(`Sítio de ultrassom desconhecido: ${code}`)
  }
  return site
}

export function isValidSiteCode(value: string): value is UsgSiteCode {
  return Object.prototype.hasOwnProperty.call(USG_SITES, value)
}

export function isValidProtocolCode(value: string): value is UsgProtocolCode {
  return Object.prototype.hasOwnProperty.call(USG_PROTOCOLS, value)
}

/**
 * Sítios de gordura obrigatórios do protocolo. Se algum faltar, o somatório
 * NÃO é calculado — Σ parcial silencioso compararia avaliações incomparáveis.
 */
export function requiredFatSites(code: UsgProtocolCode): readonly UsgSiteCode[] {
  return getProtocol(code).fatSites
}

export function isProtocolCompatibleWithSexo(
  code: UsgProtocolCode,
  sexo: UsgSexo
): boolean {
  const protocol = getProtocol(code)
  if (protocol.sexo !== 'ambos' && protocol.sexo !== sexo) return false
  if (protocol.densityEquationBySexo === null) return true
  return protocol.densityEquationBySexo[sexo] !== undefined
}

/** Protocolo sugerido na abertura da coleta, a partir do sexo do paciente. */
export function suggestedProtocol(sexo: UsgSexo): UsgProtocolCode {
  return sexo === 'feminino' ? 'jp3_mulheres' : 'jp7'
}

/**
 * Sítios do protocolo na ordem de coleta, incluindo músculo quando pedido.
 *
 * Num protocolo sem sítios de gordura (o de espessura muscular), os sítios
 * musculares entram sempre — senão a coleta ficaria sem nenhum ponto.
 */
export function collectionOrder(
  code: UsgProtocolCode,
  incluirMusculo: boolean
): readonly UsgSiteCode[] {
  const protocol = getProtocol(code)
  const musculoObrigatorio = protocol.fatSites.length === 0
  return incluirMusculo || musculoObrigatorio
    ? [...protocol.fatSites, ...protocol.muscleSites]
    : protocol.fatSites
}
