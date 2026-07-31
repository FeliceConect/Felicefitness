import { describe, it, expect } from 'vitest'
import {
  USG_PROTOCOLS,
  USG_SITES,
  collectionOrder,
  isProtocolCompatibleWithSexo,
  isValidProtocolCode,
  isValidSiteCode,
  requiredFatSites,
  suggestedProtocol,
} from '../protocols'

describe('integridade do catálogo', () => {
  it('todo sítio de gordura de todo protocolo existe e é de gordura', () => {
    for (const protocol of Object.values(USG_PROTOCOLS)) {
      for (const code of protocol.fatSites) {
        expect(USG_SITES[code], `sítio ${code} não existe`).toBeDefined()
        expect(USG_SITES[code].tecido).toBe('gordura')
      }
    }
  })

  it('todo sítio muscular de todo protocolo existe e é de músculo', () => {
    for (const protocol of Object.values(USG_PROTOCOLS)) {
      for (const code of protocol.muscleSites) {
        expect(USG_SITES[code], `sítio ${code} não existe`).toBeDefined()
        expect(USG_SITES[code].tecido).toBe('musculo')
      }
    }
  })

  it('nenhum sítio aparece como gordura e músculo no mesmo protocolo', () => {
    for (const protocol of Object.values(USG_PROTOCOLS)) {
      const intersecao = protocol.fatSites.filter((s) =>
        (protocol.muscleSites as readonly string[]).includes(s)
      )
      expect(intersecao).toEqual([])
    }
  })

  it('nenhum protocolo repete um sítio', () => {
    for (const protocol of Object.values(USG_PROTOCOLS)) {
      expect(new Set(protocol.fatSites).size).toBe(protocol.fatSites.length)
      expect(new Set(protocol.muscleSites).size).toBe(protocol.muscleSites.length)
    }
  })

  it('toda faixa plausível é crescente e positiva', () => {
    for (const site of Object.values(USG_SITES)) {
      const [min, max] = site.faixaPlausivelMm
      expect(min).toBeGreaterThan(0)
      expect(max).toBeGreaterThan(min)
    }
  })

  it('todo sítio tem rótulo leigo e instrução curta preenchidos', () => {
    for (const site of Object.values(USG_SITES)) {
      expect(site.labelLeigo.length).toBeGreaterThan(0)
      expect(site.instrucaoCurta.length).toBeGreaterThan(0)
      expect(site.landmark.length).toBeGreaterThan(0)
    }
  })
})

describe('composição dos protocolos', () => {
  it('JP7 tem exatamente os sete sítios clássicos', () => {
    expect([...USG_PROTOCOLS.jp7.fatSites].sort()).toEqual(
      [
        'abdominal',
        'axilar_media',
        'coxa',
        'peitoral',
        'subescapular',
        'suprailiaca',
        'triceps',
      ].sort()
    )
  })

  it('JP3 homens é peitoral, abdominal e coxa', () => {
    expect([...USG_PROTOCOLS.jp3_homens.fatSites].sort()).toEqual(
      ['abdominal', 'coxa', 'peitoral'].sort()
    )
  })

  it('JP3 mulheres é tríceps, suprailíaca e coxa', () => {
    expect([...USG_PROTOCOLS.jp3_mulheres.fatSites].sort()).toEqual(
      ['coxa', 'suprailiaca', 'triceps'].sort()
    )
  })

  it('protocolos sem estimativa de gordura não têm sítios de gordura', () => {
    expect(USG_PROTOCOLS.muscular_basico.fatSites).toEqual([])
    expect(USG_PROTOCOLS.livre.fatSites).toEqual([])
    expect(USG_PROTOCOLS.muscular_basico.densityEquationBySexo).toBeNull()
    expect(USG_PROTOCOLS.livre.densityEquationBySexo).toBeNull()
  })
})

describe('compatibilidade com sexo', () => {
  it('JP7 serve aos dois sexos', () => {
    expect(isProtocolCompatibleWithSexo('jp7', 'masculino')).toBe(true)
    expect(isProtocolCompatibleWithSexo('jp7', 'feminino')).toBe(true)
  })

  it('JP3 é específico por sexo', () => {
    expect(isProtocolCompatibleWithSexo('jp3_homens', 'masculino')).toBe(true)
    expect(isProtocolCompatibleWithSexo('jp3_homens', 'feminino')).toBe(false)
    expect(isProtocolCompatibleWithSexo('jp3_mulheres', 'feminino')).toBe(true)
    expect(isProtocolCompatibleWithSexo('jp3_mulheres', 'masculino')).toBe(false)
  })

  it('sugere JP3 mulheres para paciente do sexo feminino e JP7 para masculino', () => {
    expect(suggestedProtocol('feminino')).toBe('jp3_mulheres')
    expect(suggestedProtocol('masculino')).toBe('jp7')
  })
})

describe('helpers de coleta', () => {
  it('requiredFatSites devolve os sítios obrigatórios do protocolo', () => {
    expect(requiredFatSites('jp7')).toHaveLength(7)
    expect(requiredFatSites('jp3_homens')).toHaveLength(3)
    expect(requiredFatSites('livre')).toHaveLength(0)
  })

  it('collectionOrder inclui músculo apenas quando pedido', () => {
    expect(collectionOrder('jp7', false)).toHaveLength(7)
    expect(collectionOrder('jp7', true)).toHaveLength(
      7 + USG_PROTOCOLS.jp7.muscleSites.length
    )
  })

  it('collectionOrder preserva a ordem declarada no protocolo', () => {
    expect(collectionOrder('jp7', false)).toEqual(USG_PROTOCOLS.jp7.fatSites)
  })

  it('validadores rejeitam códigos desconhecidos', () => {
    expect(isValidSiteCode('triceps')).toBe(true)
    expect(isValidSiteCode('joelho')).toBe(false)
    expect(isValidProtocolCode('jp7')).toBe(true)
    expect(isValidProtocolCode('jp9')).toBe(false)
  })

  it('validadores não são enganados por propriedades do Object.prototype', () => {
    expect(isValidSiteCode('toString')).toBe(false)
    expect(isValidProtocolCode('constructor')).toBe(false)
  })
})
