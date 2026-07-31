import { describe, it, expect } from 'vitest'
import { calcularIdade } from '@/lib/utils/date'
import {
  buildAssessmentRow,
  buildMeasurementRows,
  configFromStoredRow,
  parseUsgRequest,
  recomputeFromStored,
} from '../persistence'
import { computeUsgAssessment } from '../engine'
import type { UsgParseOk } from '../persistence'

const PACIENTE = {
  sexo: 'masculino',
  data_nascimento: '1984-03-15',
  altura_cm: 178,
}

const MEDIDAS_JP3_H = [
  { site: 'peitoral', tecido: 'gordura', repeticoes_mm: [6.0, 6.4] },
  { site: 'abdominal', tecido: 'gordura', repeticoes_mm: [15.8, 16.2] },
  { site: 'coxa', tecido: 'gordura', repeticoes_mm: [11.0, 11.4] },
]

function corpoValido(over: Record<string, unknown> = {}) {
  return {
    protocolo: 'jp3_homens',
    data: '2026-08-01',
    peso_kg: 82.4,
    medidas: MEDIDAS_JP3_H,
    ...over,
  }
}

function ok(resultado: ReturnType<typeof parseUsgRequest>): UsgParseOk {
  if (!resultado.ok) throw new Error(`esperava sucesso, veio: ${resultado.error}`)
  return resultado
}

describe('parseUsgRequest — caminho feliz', () => {
  it('aceita um corpo completo e deriva a idade da data de nascimento', () => {
    const r = ok(parseUsgRequest(corpoValido(), PACIENTE))
    expect(r.input.protocolo).toBe('jp3_homens')
    expect(r.input.sexo).toBe('masculino')
    expect(r.input.idade).toBe(42) // nasceu em 15/03/1984, coleta em 01/08/2026
    expect(r.input.medidas).toHaveLength(3)
    expect(r.meta.data).toBe('2026-08-01')
  })

  it('herda a altura do cadastro quando o corpo não a envia', () => {
    const r = ok(parseUsgRequest(corpoValido(), PACIENTE))
    expect(r.input.altura_cm).toBe(178)
  })

  it('aceita número com vírgula decimal', () => {
    const r = ok(
      parseUsgRequest(
        corpoValido({
          medidas: [
            { site: 'peitoral', tecido: 'gordura', repeticoes_mm: ['6,2'] },
            { site: 'abdominal', tecido: 'gordura', repeticoes_mm: [16] },
            { site: 'coxa', tecido: 'gordura', repeticoes_mm: [11.2] },
          ],
        }),
        PACIENTE
      )
    )
    expect(r.input.medidas[0].repeticoes_mm).toEqual([6.2])
  })
})

describe('parseUsgRequest — sexo e idade nunca são inferidos em silêncio', () => {
  it('recusa quando o cadastro tem sexo "outro" e o corpo não informa', () => {
    const r = parseUsgRequest(corpoValido(), { ...PACIENTE, sexo: 'outro' })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toContain('sexo')
  })

  it('recusa quando não há sexo em lugar nenhum', () => {
    const r = parseUsgRequest(corpoValido(), { sexo: null, data_nascimento: '1984-03-15' })
    expect(r.ok).toBe(false)
  })

  it('o sexo do corpo tem precedência sobre o do cadastro', () => {
    const r = ok(
      parseUsgRequest(corpoValido({ protocolo: 'jp7', sexo: 'feminino' }), PACIENTE)
    )
    expect(r.input.sexo).toBe('feminino')
  })

  it('recusa quando não há data de nascimento nem idade informada', () => {
    const r = parseUsgRequest(corpoValido(), { sexo: 'masculino', data_nascimento: null })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toContain('idade')
  })

  it('protocolo sem equação não exige sexo nem idade', () => {
    const r = parseUsgRequest(
      {
        protocolo: 'muscular_basico',
        medidas: [
          { site: 'reto_femoral', tecido: 'musculo', repeticoes_mm: [24, 24.4] },
        ],
      },
      { sexo: null, data_nascimento: null }
    )
    expect(r.ok).toBe(true)
  })

  it('sexo desconhecido é gravado como nulo, nunca como palpite', () => {
    const r = ok(
      parseUsgRequest(
        {
          protocolo: 'muscular_basico',
          medidas: [
            { site: 'reto_femoral', tecido: 'musculo', repeticoes_mm: [24, 24.4] },
          ],
        },
        { sexo: null, data_nascimento: null }
      )
    )
    expect(r.meta.sexo_registrado).toBeNull()

    const linha = buildAssessmentRow(r.input, r.meta, computeUsgAssessment(r.input))
    expect(linha.sexo).toBeNull()
    expect(linha.idade).toBeNull()
  })
})

describe('parseUsgRequest — rejeita entrada malformada', () => {
  const casos: Array<[string, unknown]> = [
    ['corpo nulo', null],
    ['corpo string', 'nada'],
    ['protocolo inexistente', { protocolo: 'jp9', medidas: MEDIDAS_JP3_H }],
    ['sem medidas', { protocolo: 'jp3_homens', medidas: [] }],
    ['medidas não é array', { protocolo: 'jp3_homens', medidas: { a: 1 } }],
  ]

  for (const [nome, corpo] of casos) {
    it(`recusa: ${nome}`, () => {
      expect(parseUsgRequest(corpo, PACIENTE).ok).toBe(false)
    })
  }

  it('recusa sítio desconhecido', () => {
    const r = parseUsgRequest(
      corpoValido({ medidas: [{ site: 'joelho', tecido: 'gordura', repeticoes_mm: [5] }] }),
      PACIENTE
    )
    expect(r.ok).toBe(false)
  })

  it('recusa tecido inválido', () => {
    const r = parseUsgRequest(
      corpoValido({ medidas: [{ site: 'coxa', tecido: 'osso', repeticoes_mm: [5] }] }),
      PACIENTE
    )
    expect(r.ok).toBe(false)
  })

  it('recusa valores não numéricos, negativos ou absurdos', () => {
    for (const valor of ['abc', -3, 0, 500, null, {}, [1]]) {
      const r = parseUsgRequest(
        corpoValido({
          medidas: [{ site: 'coxa', tecido: 'gordura', repeticoes_mm: [valor] }],
        }),
        PACIENTE
      )
      expect(r.ok, `deveria recusar ${JSON.stringify(valor)}`).toBe(false)
    }
  })

  it('recusa mais de cinco repetições no mesmo sítio', () => {
    const r = parseUsgRequest(
      corpoValido({
        medidas: [
          { site: 'coxa', tecido: 'gordura', repeticoes_mm: [1, 2, 3, 4, 5, 6] },
        ],
      }),
      PACIENTE
    )
    expect(r.ok).toBe(false)
  })

  it('recusa data, horário e momento fora do formato', () => {
    expect(parseUsgRequest(corpoValido({ data: '01/08/2026' }), PACIENTE).ok).toBe(false)
    expect(parseUsgRequest(corpoValido({ horario_coleta: '9h30' }), PACIENTE).ok).toBe(false)
    expect(parseUsgRequest(corpoValido({ momento_avaliacao: 'M9' }), PACIENTE).ok).toBe(false)
  })

  it('recusa peso e altura fora da faixa fisiológica', () => {
    expect(parseUsgRequest(corpoValido({ peso_kg: 5 }), PACIENTE).ok).toBe(false)
    expect(parseUsgRequest(corpoValido({ peso_kg: 900 }), PACIENTE).ok).toBe(false)
    expect(parseUsgRequest(corpoValido({ altura_cm: 30 }), PACIENTE).ok).toBe(false)
  })

  it('ignora chaves de configuração desconhecidas em vez de aceitar qualquer coisa', () => {
    const r = ok(
      parseUsgRequest(
        corpoValido({ config: { conversion: 'inventada', linearFactor: 99 } }),
        PACIENTE
      )
    )
    expect(r.input.config).toBeUndefined()
  })

  it('aceita override de conversão válido', () => {
    const r = ok(parseUsgRequest(corpoValido({ config: { conversion: 'double' } }), PACIENTE))
    expect(r.input.config?.conversion).toBe('double')
  })
})

describe('linhas gravadas no banco', () => {
  it('nenhuma medida chega ao banco com valor zero (violaria o CHECK)', () => {
    const parsed = ok(parseUsgRequest(corpoValido(), PACIENTE))
    const linhas = buildMeasurementRows(computeUsgAssessment(parsed.input))
    expect(linhas.length).toBeGreaterThan(0)
    for (const linha of linhas) {
      expect(linha.valor_mm as number).toBeGreaterThan(0)
      expect(linha.valor_mm as number).toBeLessThanOrEqual(120)
      expect((linha.repeticoes_mm as number[]).length).toBeGreaterThanOrEqual(1)
      expect((linha.repeticoes_mm as number[]).length).toBeLessThanOrEqual(5)
    }
  })

  it('os derivados gravados respeitam os CHECKs da tabela', () => {
    const parsed = ok(parseUsgRequest(corpoValido(), PACIENTE))
    const resultado = computeUsgAssessment(parsed.input)
    const linha = buildAssessmentRow(parsed.input, parsed.meta, resultado)

    const percentual = linha.percentual_gordura as number | null
    if (percentual !== null) {
      expect(percentual).toBeGreaterThanOrEqual(2)
      expect(percentual).toBeLessThanOrEqual(70)
    }
    const densidade = linha.densidade_corporal as number | null
    if (densidade !== null) {
      expect(densidade).toBeGreaterThanOrEqual(0.9)
      expect(densidade).toBeLessThanOrEqual(1.15)
    }
    expect(linha.conversao_fator as number).toBeLessThanOrEqual(4)
    expect(linha.conversao_offset as number).toBeLessThanOrEqual(20)
  })

  it('a linha gravada nunca carrega derivado enviado pelo cliente', () => {
    const parsed = ok(
      parseUsgRequest(
        corpoValido({ percentual_gordura: 5, massa_gorda_kg: 1, soma_gordura_mm: 999 }),
        PACIENTE
      )
    )
    const resultado = computeUsgAssessment(parsed.input)
    const linha = buildAssessmentRow(parsed.input, parsed.meta, resultado)
    expect(linha.percentual_gordura).toBe(resultado.percentual_gordura)
    expect(linha.soma_gordura_mm).toBe(resultado.soma_gordura_mm)
    expect(linha.soma_gordura_mm).not.toBe(999)
  })
})

describe('parâmetros de cálculo ficam congelados na avaliação', () => {
  const AVALIACAO_ANTIGA = {
    equation_version: 'usg-v1',
    conversao_id: 'linear',
    conversao_fator: '1.7000',
    conversao_offset: '2.0400',
    agregacao_repeticoes: 'median',
    formula_percentual: 'siri',
  }

  it('configFromStoredRow devolve exatamente o que foi gravado', () => {
    const config = configFromStoredRow(AVALIACAO_ANTIGA)
    expect(config.conversion).toBe('linear')
    expect(config.linearFactor).toBe(1.7)
    expect(config.linearOffset).toBe(2.04)
    expect(config.fatFormula).toBe('siri')
    expect(config.repAggregation).toBe('median')
    expect(config.version).toBe('usg-v1')
  })

  it('editar uma avaliação antiga não a recalcula com a calibração de hoje', () => {
    // Simula a clínica tendo recalibrado a conversão depois da coleta.
    const calibracaoDeHoje = { linearFactor: 2.1, linearOffset: 3.5 }

    const comCalibracaoNova = ok(
      parseUsgRequest(corpoValido({ config: calibracaoDeHoje }), PACIENTE)
    )
    const comCalibracaoOriginal = ok(
      parseUsgRequest(corpoValido(), PACIENTE, configFromStoredRow(AVALIACAO_ANTIGA))
    )

    const resultadoNovo = computeUsgAssessment(comCalibracaoNova.input)
    const resultadoOriginal = computeUsgAssessment(comCalibracaoOriginal.input)

    // A calibração nova de fato muda o número — o teste não é vácuo.
    expect(resultadoNovo.soma_equivalente_mm).not.toBe(
      resultadoOriginal.soma_equivalente_mm
    )
    // E a edição com os parâmetros congelados reproduz o valor original.
    expect(resultadoOriginal.conversao_fator).toBe(1.7)
    expect(resultadoOriginal.conversao_offset).toBe(2.04)
    // O somatório BRUTO nunca muda, aconteça o que acontecer com a conversão.
    expect(resultadoNovo.soma_gordura_mm).toBe(resultadoOriginal.soma_gordura_mm)
  })

  it('recalibração explícita no corpo vence os parâmetros congelados', () => {
    const r = ok(
      parseUsgRequest(
        corpoValido({ config: { conversion: 'double' } }),
        PACIENTE,
        configFromStoredRow(AVALIACAO_ANTIGA)
      )
    )
    expect(computeUsgAssessment(r.input).conversao_id).toBe('double')
  })
})

describe('recomputeFromStored reproduz o cálculo original', () => {
  it('recalcular a partir do bruto gravado devolve os mesmos derivados', () => {
    const parsed = ok(parseUsgRequest(corpoValido(), PACIENTE))
    const original = computeUsgAssessment(parsed.input)

    const recalculado = recomputeFromStored(
      {
        protocolo: parsed.input.protocolo,
        sexo: parsed.input.sexo,
        idade: parsed.input.idade,
        peso_kg: parsed.input.peso_kg,
        altura_cm: parsed.input.altura_cm,
      },
      original.medidas.map((m) => ({
        site: m.site,
        tecido: m.tecido,
        lado: m.lado,
        repeticoes_mm: m.repeticoes_mm,
      }))
    )

    expect(recalculado.soma_gordura_mm).toBe(original.soma_gordura_mm)
    expect(recalculado.percentual_gordura).toBe(original.percentual_gordura)
    expect(recalculado.massa_gorda_kg).toBe(original.massa_gorda_kg)
    expect(recalculado.massa_magra_kg).toBe(original.massa_magra_kg)
  })
})

describe('calcularIdade', () => {
  it('conta anos completos na data de referência', () => {
    expect(calcularIdade('1984-03-15', '2026-08-01')).toBe(42)
    expect(calcularIdade('1984-03-15', '2026-03-15')).toBe(42) // no aniversário já conta
    expect(calcularIdade('1984-03-15', '2026-03-14')).toBe(41) // véspera ainda não
  })

  it('não erra por fuso horário no último dia do mês', () => {
    // O bug clássico: new Date('1990-05-31') em BRT vira 30/05 e adianta a idade.
    expect(calcularIdade('1990-05-31', '2026-05-30')).toBe(35)
    expect(calcularIdade('1990-05-31', '2026-05-31')).toBe(36)
  })

  it('trata 29 de fevereiro sem quebrar', () => {
    expect(calcularIdade('2000-02-29', '2026-02-28')).toBe(25)
    expect(calcularIdade('2000-02-29', '2026-03-01')).toBe(26)
  })

  it('aceita string com horário e usa só a data', () => {
    expect(calcularIdade('1984-03-15T10:30:00Z', '2026-08-01')).toBe(42)
  })

  it('devolve null para entrada ausente, inválida ou futura', () => {
    expect(calcularIdade(null)).toBeNull()
    expect(calcularIdade(undefined)).toBeNull()
    expect(calcularIdade('15/03/1984', '2026-08-01')).toBeNull()
    expect(calcularIdade('2030-01-01', '2026-08-01')).toBeNull()
  })
})
