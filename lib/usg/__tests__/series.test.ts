import { describe, it, expect } from 'vitest'
import {
  buildCompositionSeries,
  buildSomaSeries,
  compararSitios,
  encontrarAnteriorComparavel,
  encontrarMedida,
  formatarDelta,
  formatarMm,
  resumoComparativo,
} from '../series'
import type { UsgAssessmentWithSites, UsgMeasurement } from '../types'

function medida(over: Partial<UsgMeasurement>): UsgMeasurement {
  return {
    id: `${over.site}-${over.lado ?? 'D'}`,
    assessment_id: 'a',
    site: 'coxa',
    tecido: 'gordura',
    lado: 'D',
    repeticoes_mm: [10, 10.4],
    valor_mm: 10.2,
    cv_percent: 2,
    fora_de_tolerancia: false,
    observacao: null,
    ...over,
  } as UsgMeasurement
}

function avaliacao(over: Partial<UsgAssessmentWithSites>): UsgAssessmentWithSites {
  return {
    id: 'id',
    user_id: 'u',
    data: '2026-08-01',
    horario_coleta: null,
    momento_avaliacao: null,
    avaliador_id: null,
    protocolo: 'jp7',
    sexo: 'masculino',
    idade: 42,
    peso_kg: 82.4,
    altura_cm: 178,
    equipamento: null,
    transdutor_mhz: null,
    soma_gordura_mm: 72,
    soma_equivalente_mm: 136.68,
    soma_muscular_mm: null,
    densidade_corporal: 1.05071,
    percentual_gordura: 21.1,
    massa_gorda_kg: 17.39,
    massa_magra_kg: 65.01,
    equation_version: 'usg-v1',
    equacao_densidade: 'jp7_h',
    formula_percentual: 'siri',
    conversao_id: 'linear',
    conversao_fator: 1.7,
    conversao_offset: 2.04,
    agregacao_repeticoes: 'median',
    estimativa_confiavel: false,
    calculo_avisos: [],
    interpretacao: null,
    created_at: '2026-08-01T10:00:00Z',
    updated_at: '2026-08-01T10:00:00Z',
    medidas: [],
    ...over,
  } as UsgAssessmentWithSites
}

describe('buildSomaSeries — uma série por protocolo', () => {
  const historico = [
    avaliacao({ id: '3', data: '2026-08-01', protocolo: 'jp7', soma_gordura_mm: 68 }),
    avaliacao({ id: '2', data: '2026-06-01', protocolo: 'jp3_homens', soma_gordura_mm: 33 }),
    avaliacao({ id: '1', data: '2026-04-01', protocolo: 'jp7', soma_gordura_mm: 75 }),
  ]

  it('exclui avaliações de outro protocolo', () => {
    // Sem o filtro, a série cairia de 75 para 33 e subiria para 68 — um
    // "emagrecimento" que é só troca de protocolo.
    const serie = buildSomaSeries(historico, 'jp7')
    expect(serie.map((p) => p.valor)).toEqual([75, 68])
  })

  it('ordena do mais antigo para o mais recente', () => {
    const serie = buildSomaSeries(historico, 'jp7')
    expect(serie[0].data < serie[1].data).toBe(true)
  })

  it('ignora avaliações sem somatório', () => {
    const serie = buildSomaSeries(
      [avaliacao({ id: 'x', protocolo: 'jp7', soma_gordura_mm: null })],
      'jp7'
    )
    expect(serie).toEqual([])
  })
})

describe('encontrarAnteriorComparavel', () => {
  const atual = avaliacao({ id: 'atual', data: '2026-08-01', protocolo: 'jp7' })

  it('escolhe a mais recente anterior do MESMO protocolo', () => {
    const anterior = encontrarAnteriorComparavel(
      [
        atual,
        avaliacao({ id: 'a', data: '2026-07-01', protocolo: 'jp7' }),
        avaliacao({ id: 'b', data: '2026-05-01', protocolo: 'jp7' }),
      ],
      atual
    )
    expect(anterior?.id).toBe('a')
  })

  it('ignora avaliações de outro protocolo', () => {
    const anterior = encontrarAnteriorComparavel(
      [atual, avaliacao({ id: 'c', data: '2026-07-01', protocolo: 'jp3_homens' })],
      atual
    )
    expect(anterior).toBeNull()
  })

  it('nunca devolve a própria avaliação', () => {
    expect(encontrarAnteriorComparavel([atual], atual)).toBeNull()
  })

  it('desempata por created_at quando a data é a mesma', () => {
    const anterior = encontrarAnteriorComparavel(
      [
        atual,
        avaliacao({
          id: 'mesma-data',
          data: '2026-08-01',
          protocolo: 'jp7',
          created_at: '2026-08-01T08:00:00Z',
        }),
      ],
      atual
    )
    expect(anterior?.id).toBe('mesma-data')
  })
})

describe('resumoComparativo', () => {
  it('descarta a comparação quando o protocolo difere', () => {
    const atual = avaliacao({ id: 'a', protocolo: 'jp7', soma_gordura_mm: 68 })
    const outro = avaliacao({ id: 'b', protocolo: 'jp3_homens', soma_gordura_mm: 33 })
    const resumo = resumoComparativo(atual, outro)
    expect(resumo.every((r) => r.delta === null)).toBe(true)
  })

  it('calcula a variação dentro do mesmo protocolo', () => {
    const atual = avaliacao({ id: 'a', protocolo: 'jp7', soma_gordura_mm: 68 })
    const anterior = avaliacao({ id: 'b', protocolo: 'jp7', soma_gordura_mm: 75 })
    const soma = resumoComparativo(atual, anterior)[0]
    expect(soma.delta).toBeCloseTo(-7, 5)
    // Menos gordura é favorável.
    expect(soma.favoravel).toBe(true)
  })

  it('ganho de massa magra é favorável, perda não', () => {
    const atual = avaliacao({ id: 'a', massa_magra_kg: 66 })
    const anterior = avaliacao({ id: 'b', massa_magra_kg: 65 })
    const magra = resumoComparativo(atual, anterior).find(
      (r) => r.label === 'Massa magra'
    )
    expect(magra?.favoravel).toBe(true)
  })
})

describe('compararSitios', () => {
  it('ignora medidas do lado esquerdo', () => {
    const atual = avaliacao({
      medidas: [
        medida({ site: 'coxa', lado: 'D', valor_mm: 11 }),
        medida({ site: 'coxa', lado: 'E', valor_mm: 13 }),
      ],
    })
    const deltas = compararSitios(atual, null)
    expect(deltas).toHaveLength(1)
    expect(deltas[0].atual).toBe(11)
  })

  it('marca redução de gordura como favorável e aumento como não', () => {
    const anterior = avaliacao({
      id: 'b',
      medidas: [medida({ site: 'coxa', valor_mm: 12 })],
    })
    const atual = avaliacao({
      id: 'a',
      medidas: [medida({ site: 'coxa', valor_mm: 10 })],
    })
    expect(compararSitios(atual, anterior)[0].favoravel).toBe(true)
    expect(compararSitios(anterior, atual)[0].favoravel).toBe(false)
  })

  it('para músculo, ganhar espessura é favorável', () => {
    const anterior = avaliacao({
      id: 'b',
      medidas: [medida({ site: 'reto_femoral', tecido: 'musculo', valor_mm: 22 })],
    })
    const atual = avaliacao({
      id: 'a',
      medidas: [medida({ site: 'reto_femoral', tecido: 'musculo', valor_mm: 24 })],
    })
    expect(compararSitios(atual, anterior)[0].favoravel).toBe(true)
  })

  it('sem avaliação anterior, não inventa variação', () => {
    const atual = avaliacao({ medidas: [medida({ site: 'coxa' })] })
    const delta = compararSitios(atual, null)[0]
    expect(delta.delta).toBeNull()
    expect(delta.favoravel).toBeNull()
  })
})

describe('encontrarMedida só aceita o lado direito', () => {
  it('devolve o lado direito quando existem os dois', () => {
    const medidas = [
      medida({ site: 'coxa', lado: 'E', valor_mm: 13 }),
      medida({ site: 'coxa', lado: 'D', valor_mm: 11 }),
    ]
    expect(encontrarMedida(medidas, 'coxa', 'gordura')?.valor_mm).toBe(11)
  })

  it('devolve null quando só existe o lado esquerdo', () => {
    // Cair no esquerdo compararia perna esquerda com direita e apresentaria a
    // diferença entre elas como evolução do paciente.
    const medidas = [medida({ site: 'coxa', lado: 'E', valor_mm: 13 })]
    expect(encontrarMedida(medidas, 'coxa', 'gordura')).toBeNull()
  })
})

describe('buildCompositionSeries nunca funde os métodos', () => {
  it('devolve séries separadas e rotuladas', () => {
    const series = buildCompositionSeries({
      usg: [{ data: '2026-08-01', percentual_gordura: 21.1 }],
      bia: [{ data: '2026-08-01', percentual_gordura: 26.4 }],
    })
    expect(series).toHaveLength(2)
    expect(series.map((s) => s.id).sort()).toEqual(['bia', 'usg'])
    // Nenhuma série mistura pontos das duas origens.
    expect(series.every((s) => s.pontos.length === 1)).toBe(true)
  })

  it('omite a série que não tem dados em vez de inventar zeros', () => {
    const series = buildCompositionSeries({
      usg: [{ data: '2026-08-01', percentual_gordura: 21.1 }],
      bia: [],
    })
    expect(series).toHaveLength(1)
    expect(series[0].id).toBe('usg')
  })
})

describe('formatação pt-BR', () => {
  it('usa vírgula decimal e traço para ausente', () => {
    expect(formatarMm(8.25, 1)).toBe('8,3')
    expect(formatarMm(null)).toBe('—')
  })

  it('mostra o sinal explícito na variação', () => {
    expect(formatarDelta(2.5)).toBe('+2,5')
    expect(formatarDelta(-2.5)).toBe('-2,5')
    expect(formatarDelta(null)).toBe('—')
  })
})
