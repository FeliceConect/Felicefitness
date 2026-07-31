import { describe, it, expect } from 'vitest'
import {
  DENSITY_EQUATIONS,
  FAT_FORMULAS,
  bodyDensity,
  percentFatFromDensity,
  pickDensityEquation,
} from '../equations'
import { USG_PROTOCOLS } from '../protocols'

describe('coeficientes das equações (trava de regressão)', () => {
  // Mudar qualquer número aqui muda o resultado clínico de todos os pacientes.
  // Se um destes testes quebrar, a alteração precisa ser deliberada e vir com
  // bump de equation_version + recálculo do histórico.

  it('Jackson & Pollock 7 sítios — homens', () => {
    const eq = DENSITY_EQUATIONS.jp7_h
    expect(eq.a).toBe(1.112)
    expect(eq.b).toBe(0.00043499)
    expect(eq.c).toBe(0.00000055)
    expect(eq.d).toBe(0.00028826)
    expect(eq.sexo).toBe('masculino')
    expect(eq.sites).toHaveLength(7)
  })

  it('Jackson & Pollock 7 sítios — mulheres', () => {
    const eq = DENSITY_EQUATIONS.jp7_m
    expect(eq.a).toBe(1.097)
    expect(eq.b).toBe(0.00046971)
    expect(eq.c).toBe(0.00000056)
    expect(eq.d).toBe(0.00012828)
    expect(eq.sexo).toBe('feminino')
  })

  it('Jackson & Pollock 3 sítios — homens', () => {
    const eq = DENSITY_EQUATIONS.jp3_h
    expect(eq.a).toBe(1.10938)
    expect(eq.b).toBe(0.0008267)
    expect(eq.c).toBe(0.0000016)
    expect(eq.d).toBe(0.0002574)
    expect(eq.sites).toEqual(['peitoral', 'abdominal', 'coxa'])
  })

  it('Jackson & Pollock 3 sítios — mulheres', () => {
    const eq = DENSITY_EQUATIONS.jp3_m
    expect(eq.a).toBe(1.0994921)
    expect(eq.b).toBe(0.0009929)
    expect(eq.c).toBe(0.0000023)
    expect(eq.d).toBe(0.0001392)
    expect(eq.sites).toEqual(['triceps', 'suprailiaca', 'coxa'])
  })

  it('Siri e Brozek mantêm os coeficientes publicados', () => {
    expect(FAT_FORMULAS.siri.k1).toBe(4.95)
    expect(FAT_FORMULAS.siri.k2).toBe(4.5)
    expect(FAT_FORMULAS.brozek.k1).toBe(4.57)
    expect(FAT_FORMULAS.brozek.k2).toBe(4.142)
  })
})

describe('bodyDensity e percentFatFromDensity — casos-âncora', () => {
  // Valores conferidos à mão com Σ equivalente = 100 mm e idade 40.

  it('JP7 homens: Σ=100, 40 anos → DC 1,06247 e 15,9% por Siri', () => {
    const dc = bodyDensity(DENSITY_EQUATIONS.jp7_h, 100, 40)
    expect(dc).not.toBeNull()
    expect(dc as number).toBeCloseTo(1.06247, 5)
    expect(percentFatFromDensity(dc as number, FAT_FORMULAS.siri) as number).toBeCloseTo(15.9, 1)
  })

  it('JP7 mulheres: Σ=100, 40 anos → DC 1,05050 e 21,2% por Siri', () => {
    const dc = bodyDensity(DENSITY_EQUATIONS.jp7_m, 100, 40)
    expect(dc as number).toBeCloseTo(1.0505, 5)
    expect(percentFatFromDensity(dc as number, FAT_FORMULAS.siri) as number).toBeCloseTo(21.2, 1)
  })

  it('JP3 homens: Σ=100, 40 anos → 29,5% por Siri', () => {
    const dc = bodyDensity(DENSITY_EQUATIONS.jp3_h, 100, 40)
    expect(percentFatFromDensity(dc as number, FAT_FORMULAS.siri) as number).toBeCloseTo(29.5, 1)
  })

  it('JP3 mulheres: Σ=100, 40 anos → 36,4% por Siri', () => {
    const dc = bodyDensity(DENSITY_EQUATIONS.jp3_m, 100, 40)
    expect(percentFatFromDensity(dc as number, FAT_FORMULAS.siri) as number).toBeCloseTo(36.4, 1)
  })

  it('Brozek dá resultado diferente de Siri para a mesma densidade', () => {
    const dc = bodyDensity(DENSITY_EQUATIONS.jp3_m, 100, 40) as number
    const siri = percentFatFromDensity(dc, FAT_FORMULAS.siri) as number
    const brozek = percentFatFromDensity(dc, FAT_FORMULAS.brozek) as number
    expect(siri).not.toBeCloseTo(brozek, 1)
  })

  it('percentual cai quando a densidade sobe', () => {
    const menor = percentFatFromDensity(1.02, FAT_FORMULAS.siri) as number
    const maior = percentFatFromDensity(1.07, FAT_FORMULAS.siri) as number
    expect(maior).toBeLessThan(menor)
  })

  it('idade maior reduz a densidade (e aumenta o percentual)', () => {
    const jovem = bodyDensity(DENSITY_EQUATIONS.jp7_h, 100, 25) as number
    const maduro = bodyDensity(DENSITY_EQUATIONS.jp7_h, 100, 55) as number
    expect(maduro).toBeLessThan(jovem)
  })
})

describe('entradas inválidas não produzem NaN nem Infinity', () => {
  it('soma zero ou negativa devolve null', () => {
    expect(bodyDensity(DENSITY_EQUATIONS.jp7_h, 0, 40)).toBeNull()
    expect(bodyDensity(DENSITY_EQUATIONS.jp7_h, -10, 40)).toBeNull()
  })

  it('idade inválida devolve null', () => {
    expect(bodyDensity(DENSITY_EQUATIONS.jp7_h, 100, 0)).toBeNull()
    expect(bodyDensity(DENSITY_EQUATIONS.jp7_h, 100, Number.NaN)).toBeNull()
  })

  it('densidade fora da faixa fisiológica devolve null em vez de número absurdo', () => {
    // Σ gigante empurra a densidade para fora de 0,9–1,15.
    expect(bodyDensity(DENSITY_EQUATIONS.jp3_m, 600, 40)).toBeNull()
  })

  it('densidade zero ou negativa não vira Infinity no percentual', () => {
    expect(percentFatFromDensity(0, FAT_FORMULAS.siri)).toBeNull()
    expect(percentFatFromDensity(-1, FAT_FORMULAS.siri)).toBeNull()
  })
})

describe('pickDensityEquation', () => {
  it('escolhe a equação pelo sexo no protocolo de 7 sítios', () => {
    expect(pickDensityEquation('jp7', 'masculino')).toBe('jp7_h')
    expect(pickDensityEquation('jp7', 'feminino')).toBe('jp7_m')
  })

  it('devolve null quando o protocolo não serve ao sexo', () => {
    expect(pickDensityEquation('jp3_mulheres', 'masculino')).toBeNull()
    expect(pickDensityEquation('jp3_homens', 'feminino')).toBeNull()
  })

  it('devolve null para protocolos que não estimam gordura', () => {
    expect(pickDensityEquation('muscular_basico', 'masculino')).toBeNull()
    expect(pickDensityEquation('livre', 'feminino')).toBeNull()
  })
})

describe('equação e protocolo não podem divergir de sítios', () => {
  // Trava contra o pior erro silencioso possível: rodar a equação de 7 sítios
  // com um somatório de 3.
  it('cada protocolo com equação usa exatamente os sítios que a equação espera', () => {
    for (const protocol of Object.values(USG_PROTOCOLS)) {
      if (!protocol.densityEquationBySexo) continue
      for (const eqId of Object.values(protocol.densityEquationBySexo)) {
        const eq = DENSITY_EQUATIONS[eqId]
        expect([...eq.sites].sort()).toEqual([...protocol.fatSites].sort())
      }
    }
  })
})
