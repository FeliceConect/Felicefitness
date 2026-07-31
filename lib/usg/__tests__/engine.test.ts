import { describe, it, expect } from 'vitest'
import { aggregateReps, computeUsgAssessment } from '../engine'
import type { UsgComputeInput, UsgSiteInput, UsgWarningCode } from '../types'

// ---------------------------------------------------------------------------
// Cenários de referência (valores conferidos à mão)
// ---------------------------------------------------------------------------

const JP7_HOMEM: UsgSiteInput[] = [
  { site: 'peitoral', tecido: 'gordura', repeticoes_mm: [6.0, 6.4] },
  { site: 'axilar_media', tecido: 'gordura', repeticoes_mm: [7.0, 7.2] },
  { site: 'abdominal', tecido: 'gordura', repeticoes_mm: [15.8, 16.2] },
  { site: 'suprailiaca', tecido: 'gordura', repeticoes_mm: [12.0, 12.4] },
  { site: 'coxa', tecido: 'gordura', repeticoes_mm: [11.0, 11.4] },
  { site: 'triceps', tecido: 'gordura', repeticoes_mm: [9.0, 9.2] },
  { site: 'subescapular', tecido: 'gordura', repeticoes_mm: [10.0, 10.4] },
]

function entradaHomem(over: Partial<UsgComputeInput> = {}): UsgComputeInput {
  return {
    protocolo: 'jp7',
    sexo: 'masculino',
    idade: 42,
    peso_kg: 82.4,
    altura_cm: 178,
    medidas: JP7_HOMEM,
    ...over,
  }
}

const JP3_MULHER: UsgSiteInput[] = [
  { site: 'suprailiaca', tecido: 'gordura', repeticoes_mm: [14.0, 14.4] },
  { site: 'coxa', tecido: 'gordura', repeticoes_mm: [20.0, 20.6] },
  { site: 'triceps', tecido: 'gordura', repeticoes_mm: [15.0, 15.2] },
]

function codigos(avisos: { code: UsgWarningCode }[]): UsgWarningCode[] {
  return avisos.map((a) => a.code)
}

// ---------------------------------------------------------------------------

describe('cálculo completo — caso de referência', () => {
  it('JP7 homem, 42 anos, 82,4 kg', () => {
    const r = computeUsgAssessment(entradaHomem())

    expect(r.soma_gordura_mm).toBeCloseTo(72, 2)
    expect(r.soma_equivalente_mm).toBeCloseTo(136.68, 2)
    expect(r.densidade_corporal).toBeCloseTo(1.05071, 5)
    expect(r.percentual_gordura).toBeCloseTo(21.1, 1)
    expect(r.massa_gorda_kg).toBeCloseTo(17.39, 2)
    expect(r.massa_magra_kg).toBeCloseTo(65.01, 2)
    expect(r.equacao_densidade).toBe('jp7_h')
    expect(r.avisos).toEqual([])
  })

  it('JP3 mulher, 38 anos', () => {
    const r = computeUsgAssessment({
      protocolo: 'jp3_mulheres',
      sexo: 'feminino',
      idade: 38,
      peso_kg: 64,
      altura_cm: 165,
      medidas: JP3_MULHER,
    })

    expect(r.soma_gordura_mm).toBeCloseTo(49.6, 2)
    expect(r.soma_equivalente_mm).toBeCloseTo(90.44, 2)
    expect(r.percentual_gordura).toBeCloseTo(33.8, 1)
    expect(r.equacao_densidade).toBe('jp3_m')
    expect(r.avisos).toEqual([])
  })

  it('massa gorda e massa magra somam o peso informado', () => {
    const r = computeUsgAssessment(entradaHomem())
    expect((r.massa_gorda_kg as number) + (r.massa_magra_kg as number)).toBeCloseTo(82.4, 1)
  })
})

describe('somatório parcial nunca acontece em silêncio', () => {
  it('faltando um sítio obrigatório, soma e percentual ficam nulos', () => {
    const r = computeUsgAssessment(
      entradaHomem({ medidas: JP7_HOMEM.filter((m) => m.site !== 'coxa') })
    )

    expect(r.soma_gordura_mm).toBeNull()
    expect(r.soma_equivalente_mm).toBeNull()
    expect(r.densidade_corporal).toBeNull()
    expect(r.percentual_gordura).toBeNull()
    expect(r.massa_gorda_kg).toBeNull()
    expect(codigos(r.avisos)).toContain('sitio_faltando')
    expect(r.avisos.find((a) => a.code === 'sitio_faltando')?.site).toBe('coxa')
  })

  it('as medidas presentes continuam sendo guardadas mesmo sem somatório', () => {
    const r = computeUsgAssessment(
      entradaHomem({ medidas: JP7_HOMEM.filter((m) => m.site !== 'coxa') })
    )
    expect(r.medidas).toHaveLength(6)
    expect(r.medidas.every((m) => m.valor_mm > 0)).toBe(true)
  })
})

describe('sítios fora do protocolo', () => {
  it('sítio extra é gravado, avisado e não entra na soma', () => {
    const r = computeUsgAssessment(
      entradaHomem({
        protocolo: 'jp3_homens',
        medidas: [
          { site: 'peitoral', tecido: 'gordura', repeticoes_mm: [6.0, 6.4] },
          { site: 'abdominal', tecido: 'gordura', repeticoes_mm: [15.8, 16.2] },
          { site: 'coxa', tecido: 'gordura', repeticoes_mm: [11.0, 11.4] },
          { site: 'triceps', tecido: 'gordura', repeticoes_mm: [9.0, 9.2] },
        ],
      })
    )

    expect(r.medidas).toHaveLength(4)
    expect(r.medidas.find((m) => m.site === 'triceps')?.entrou_na_soma).toBe(false)
    // 6,2 + 16 + 11,2 — o tríceps ficou de fora
    expect(r.soma_gordura_mm).toBeCloseTo(33.4, 2)
    expect(codigos(r.avisos)).toContain('sitio_extra_ignorado')
  })
})

describe('lado do corpo', () => {
  it('medir o mesmo sítio dos dois lados não dobra o somatório', () => {
    const r = computeUsgAssessment(
      entradaHomem({
        medidas: [
          ...JP7_HOMEM,
          { site: 'coxa', tecido: 'gordura', lado: 'E', repeticoes_mm: [13.0, 13.4] },
        ],
      })
    )

    expect(r.soma_gordura_mm).toBeCloseTo(72, 2)
    expect(r.medidas).toHaveLength(8)
    expect(
      r.medidas.find((m) => m.site === 'coxa' && m.lado === 'E')?.entrou_na_soma
    ).toBe(false)
    expect(codigos(r.avisos)).toContain('sitio_extra_ignorado')
  })

  it('medir só o lado esquerdo não completa o protocolo', () => {
    const r = computeUsgAssessment(
      entradaHomem({
        medidas: JP7_HOMEM.map((m) =>
          m.site === 'coxa' ? { ...m, lado: 'E' as const } : m
        ),
      })
    )
    expect(r.soma_gordura_mm).toBeNull()
    expect(codigos(r.avisos)).toContain('sitio_faltando')
  })
})

describe('músculo é independente da gordura', () => {
  it('sítio muscular não altera a soma nem o percentual de gordura', () => {
    const semMusculo = computeUsgAssessment(entradaHomem())
    const comMusculo = computeUsgAssessment(
      entradaHomem({
        medidas: [
          ...JP7_HOMEM,
          { site: 'reto_femoral', tecido: 'musculo', repeticoes_mm: [24.0, 24.4] },
          { site: 'vasto_lateral', tecido: 'musculo', repeticoes_mm: [21.0, 21.2] },
          { site: 'biceps_braquial', tecido: 'musculo', repeticoes_mm: [30.0, 30.4] },
        ],
      })
    )

    expect(comMusculo.soma_gordura_mm).toBe(semMusculo.soma_gordura_mm)
    expect(comMusculo.percentual_gordura).toBe(semMusculo.percentual_gordura)
    expect(comMusculo.massa_magra_kg).toBe(semMusculo.massa_magra_kg)
    // 24,2 + 21,1 + 30,2
    expect(comMusculo.soma_muscular_mm).toBeCloseTo(75.5, 2)
  })

  it('sem músculo medido, a soma muscular é nula e não gera aviso', () => {
    const r = computeUsgAssessment(entradaHomem())
    expect(r.soma_muscular_mm).toBeNull()
    expect(codigos(r.avisos)).not.toContain('sitio_faltando')
  })

  it('músculo medido pela metade não vira soma parcial', () => {
    const r = computeUsgAssessment(
      entradaHomem({
        medidas: [
          ...JP7_HOMEM,
          { site: 'reto_femoral', tecido: 'musculo', repeticoes_mm: [24.0, 24.4] },
        ],
      })
    )
    expect(r.soma_muscular_mm).toBeNull()
    expect(codigos(r.avisos)).toContain('sitio_faltando')
  })
})

describe('conversão ultrassom → equação', () => {
  it('a conversão muda o equivalente e o percentual, nunca o somatório bruto', () => {
    const linear = computeUsgAssessment(entradaHomem())
    const cru = computeUsgAssessment(entradaHomem({ config: { conversion: 'raw' } }))
    const dobro = computeUsgAssessment(entradaHomem({ config: { conversion: 'double' } }))

    expect(cru.soma_gordura_mm).toBe(linear.soma_gordura_mm)
    expect(dobro.soma_gordura_mm).toBe(linear.soma_gordura_mm)

    expect(cru.soma_equivalente_mm).toBeCloseTo(72, 2)
    expect(dobro.soma_equivalente_mm).toBeCloseTo(144, 2)
    expect(linear.soma_equivalente_mm).toBeCloseTo(136.68, 2)

    // Mais dobra equivalente ⇒ mais gordura estimada.
    expect(cru.percentual_gordura as number).toBeLessThan(
      linear.percentual_gordura as number
    )
    expect(linear.percentual_gordura as number).toBeLessThan(
      dobro.percentual_gordura as number
    )
  })

  it('o offset é aplicado por sítio, não uma vez no somatório', () => {
    // 7 sítios com offset 1 mm e fator 1 somam 7 mm a mais, não 1 mm.
    const r = computeUsgAssessment(
      entradaHomem({
        config: { conversion: 'linear', linearFactor: 1, linearOffset: 1 },
      })
    )
    expect(r.soma_equivalente_mm).toBeCloseTo(72 + 7, 2)
  })

  it('a estimativa nunca é marcada como confiável enquanto não houver calibração', () => {
    for (const conversion of ['raw', 'double', 'linear'] as const) {
      const r = computeUsgAssessment(entradaHomem({ config: { conversion } }))
      expect(r.estimativa_confiavel).toBe(false)
    }
  })

  it('grava fator e offset efetivamente usados', () => {
    const r = computeUsgAssessment(entradaHomem())
    expect(r.conversao_id).toBe('linear')
    expect(r.conversao_fator).toBeCloseTo(1.7, 5)
    expect(r.conversao_offset).toBeCloseTo(2.04, 5)
  })
})

describe('agregação de repetições', () => {
  it('mediana de três descarta o valor extremo', () => {
    expect(aggregateReps([10, 10.4, 14], 'median').valor_mm).toBeCloseTo(10.4, 5)
  })

  it('mediana de duas é a média das duas', () => {
    expect(aggregateReps([10, 11], 'median').valor_mm).toBeCloseTo(10.5, 5)
  })

  it('média e máximo respeitam a regra escolhida', () => {
    expect(aggregateReps([10, 10.4, 14], 'mean').valor_mm).toBeCloseTo(11.4667, 3)
    expect(aggregateReps([10, 10.4, 14], 'max').valor_mm).toBeCloseTo(14, 5)
  })

  it('coeficiente de variação é nulo com uma única repetição', () => {
    expect(aggregateReps([10], 'median').cv_percent).toBeNull()
  })

  it('coeficiente de variação de [8,2; 8,4] é 1,7%', () => {
    expect(aggregateReps([8.2, 8.4], 'median').cv_percent as number).toBeCloseTo(1.7, 1)
  })

  it('repetições inválidas são descartadas', () => {
    expect(aggregateReps([10, 0, -3, Number.NaN], 'median').valor_mm).toBeCloseTo(10, 5)
  })

  it('sem nenhuma repetição válida devolve null, nunca zero', () => {
    // Zero violaria o CHECK valor_mm > 0 se chegasse ao banco.
    expect(aggregateReps([0, -3, Number.NaN], 'median').valor_mm).toBeNull()
    expect(aggregateReps([], 'median').valor_mm).toBeNull()
  })

  it('sítio sem repetição válida é tratado como não medido', () => {
    const r = computeUsgAssessment(
      entradaHomem({
        medidas: JP7_HOMEM.map((m) =>
          m.site === 'coxa' ? { ...m, repeticoes_mm: [0, -1] } : m
        ),
      })
    )
    expect(r.medidas.find((m) => m.site === 'coxa')).toBeUndefined()
    expect(r.soma_gordura_mm).toBeNull()
    expect(codigos(r.avisos)).toContain('sitio_faltando')
  })

  it('repetições muito divergentes marcam o sítio para revisão', () => {
    const r = computeUsgAssessment(
      entradaHomem({
        medidas: JP7_HOMEM.map((m) =>
          m.site === 'abdominal' ? { ...m, repeticoes_mm: [14.0, 18.0] } : m
        ),
      })
    )
    const abdominal = r.medidas.find((m) => m.site === 'abdominal')
    expect(abdominal?.fora_de_tolerancia).toBe(true)
    expect(codigos(r.avisos)).toContain('cv_alto')
  })
})

describe('avisos de plausibilidade', () => {
  it('valor fora da faixa do sítio avisa mas não impede o cálculo', () => {
    const r = computeUsgAssessment(
      entradaHomem({
        medidas: JP7_HOMEM.map((m) =>
          // 62 mm no peitoral: quase certamente "6,2" digitado errado
          m.site === 'peitoral' ? { ...m, repeticoes_mm: [62] } : m
        ),
      })
    )
    expect(codigos(r.avisos)).toContain('valor_fora_faixa')
    expect(r.soma_gordura_mm).not.toBeNull()
  })

  it('idade fora da faixa da equação avisa e segue calculando', () => {
    const r = computeUsgAssessment(entradaHomem({ idade: 70 }))
    expect(codigos(r.avisos)).toContain('idade_fora_faixa')
    expect(r.percentual_gordura).not.toBeNull()
  })

  it('percentual abaixo do piso de sanidade vira null com aviso', () => {
    // Homem muito magro medido com a conversão direta: a equação devolve um
    // percentual próximo de zero (ou negativo). É exatamente por isso que a
    // conversão 'raw' não é o default.
    const r = computeUsgAssessment(
      entradaHomem({
        idade: 20,
        config: { conversion: 'raw' },
        medidas: JP7_HOMEM.map((m) => ({ ...m, repeticoes_mm: [2.0, 2.0] })),
      })
    )
    expect(r.percentual_gordura).toBeNull()
    expect(r.massa_gorda_kg).toBeNull()
    expect(codigos(r.avisos)).toContain('percentual_fora_faixa')
    // O somatório bruto continua disponível — é ele que serve para acompanhar.
    expect(r.soma_gordura_mm).toBeCloseTo(14, 2)
  })

  it('soma além do limite de validade da equação não estima percentual', () => {
    // As equações de Jackson & Pollock são quadráticas: passado o vértice, mais
    // gordura devolveria MENOS percentual. Preferimos não estimar.
    const r = computeUsgAssessment({
      protocolo: 'jp3_mulheres',
      sexo: 'feminino',
      idade: 50,
      peso_kg: 120,
      altura_cm: 160,
      medidas: [
        { site: 'suprailiaca', tecido: 'gordura', repeticoes_mm: [50] },
        { site: 'coxa', tecido: 'gordura', repeticoes_mm: [55] },
        { site: 'triceps', tecido: 'gordura', repeticoes_mm: [45] },
      ],
    })
    expect(r.percentual_gordura).toBeNull()
    expect(r.densidade_corporal).toBeNull()
    expect(codigos(r.avisos)).toContain('soma_fora_da_validade')
    expect(r.soma_gordura_mm).toBeCloseTo(150, 2)
  })

  it('sítio duplicado mantém a primeira medida e avisa', () => {
    const r = computeUsgAssessment(
      entradaHomem({
        medidas: [
          ...JP7_HOMEM,
          { site: 'coxa', tecido: 'gordura', repeticoes_mm: [30, 30] },
        ],
      })
    )
    expect(r.medidas.filter((m) => m.site === 'coxa')).toHaveLength(1)
    expect(r.medidas.find((m) => m.site === 'coxa')?.valor_mm).toBeCloseTo(11.2, 2)
    expect(codigos(r.avisos)).toContain('sitio_duplicado')
  })
})

describe('peso ausente', () => {
  it('sem peso, o percentual continua válido e as massas ficam nulas', () => {
    const r = computeUsgAssessment(entradaHomem({ peso_kg: null }))
    expect(r.percentual_gordura).toBeCloseTo(21.1, 1)
    expect(r.massa_gorda_kg).toBeNull()
    expect(r.massa_magra_kg).toBeNull()
    expect(codigos(r.avisos)).toContain('sem_peso')
  })
})

describe('protocolo sem equação ou incompatível', () => {
  it('protocolo incompatível com o sexo não calcula percentual', () => {
    const r = computeUsgAssessment(
      entradaHomem({ protocolo: 'jp3_mulheres', medidas: JP3_MULHER })
    )
    expect(r.equacao_densidade).toBeNull()
    expect(r.percentual_gordura).toBeNull()
    expect(codigos(r.avisos)).toContain('protocolo_incompativel_com_sexo')
    // As medidas continuam gravadas e somadas.
    expect(r.soma_gordura_mm).toBeCloseTo(49.6, 2)
  })

  it('protocolo muscular registra espessura sem estimar gordura', () => {
    const r = computeUsgAssessment(
      entradaHomem({
        protocolo: 'muscular_basico',
        medidas: [
          { site: 'reto_femoral', tecido: 'musculo', repeticoes_mm: [24.0, 24.4] },
          { site: 'vasto_lateral', tecido: 'musculo', repeticoes_mm: [21.0, 21.2] },
          { site: 'biceps_braquial', tecido: 'musculo', repeticoes_mm: [30.0, 30.4] },
        ],
      })
    )
    expect(r.soma_muscular_mm).toBeCloseTo(75.5, 2)
    expect(r.soma_gordura_mm).toBeNull()
    expect(r.percentual_gordura).toBeNull()
  })
})

describe('determinismo', () => {
  it('a mesma entrada devolve exatamente a mesma saída', () => {
    const a = computeUsgAssessment(entradaHomem())
    const b = computeUsgAssessment(entradaHomem())
    expect(JSON.stringify(a)).toBe(JSON.stringify(b))
  })

  it('a ordem das medidas na entrada não altera o resultado', () => {
    const direta = computeUsgAssessment(entradaHomem())
    const invertida = computeUsgAssessment(
      entradaHomem({ medidas: [...JP7_HOMEM].reverse() })
    )
    expect(JSON.stringify(invertida)).toBe(JSON.stringify(direta))
  })

  it('grava a versão do motor usada no cálculo', () => {
    expect(computeUsgAssessment(entradaHomem()).equation_version).toBe('usg-v1')
  })

  it('a ordem dos avisos é estável mesmo com a entrada embaralhada', () => {
    // Os avisos vão para JSONB; se a ordem variasse, uma auditoria acusaria
    // alteração onde nada mudou.
    const comAvisos = JP7_HOMEM.map((m) =>
      m.site === 'abdominal' || m.site === 'coxa'
        ? { ...m, repeticoes_mm: [m.repeticoes_mm[0], m.repeticoes_mm[0] + 4] }
        : m
    )
    const direta = computeUsgAssessment(entradaHomem({ medidas: comAvisos }))
    const invertida = computeUsgAssessment(
      entradaHomem({ medidas: [...comAvisos].reverse() })
    )
    expect(direta.avisos.length).toBeGreaterThan(1)
    expect(JSON.stringify(invertida.avisos)).toBe(JSON.stringify(direta.avisos))
  })
})

describe('protocolo sem equação avisa em vez de ficar em silêncio', () => {
  it('protocolo muscular emite protocolo_sem_equacao', () => {
    const r = computeUsgAssessment(
      entradaHomem({
        protocolo: 'muscular_basico',
        medidas: [
          { site: 'reto_femoral', tecido: 'musculo', repeticoes_mm: [24.0, 24.4] },
          { site: 'vasto_lateral', tecido: 'musculo', repeticoes_mm: [21.0, 21.2] },
          { site: 'biceps_braquial', tecido: 'musculo', repeticoes_mm: [30.0, 30.4] },
        ],
      })
    )
    expect(r.percentual_gordura).toBeNull()
    expect(codigos(r.avisos)).toContain('protocolo_sem_equacao')
  })
})

describe('override de equação não pode contrariar o protocolo', () => {
  it('equação de 3 sítios num protocolo de 7 é recusada', () => {
    const r = computeUsgAssessment(
      entradaHomem({ equacaoDensidadeOverride: 'jp3_h' })
    )
    expect(r.equacao_densidade).toBeNull()
    expect(r.percentual_gordura).toBeNull()
    expect(codigos(r.avisos)).toContain('protocolo_sem_equacao')
  })

  it('override coerente com o protocolo é aceito', () => {
    const r = computeUsgAssessment(
      entradaHomem({ equacaoDensidadeOverride: 'jp7_m' })
    )
    expect(r.equacao_densidade).toBe('jp7_m')
    expect(r.percentual_gordura).not.toBeNull()
  })
})
