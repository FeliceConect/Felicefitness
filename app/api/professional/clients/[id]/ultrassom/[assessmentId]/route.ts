import { NextRequest, NextResponse } from 'next/server'
import { requireClinicalAccess } from '@/lib/auth/require-clinical-access'
import { computeUsgAssessment } from '@/lib/usg/engine'
import {
  buildAssessmentRow,
  buildMeasurementRows,
  configFromStoredRow,
  parseUsgRequest,
} from '@/lib/usg/persistence'

const PAPEIS = ['nutritionist'] as const

const SELECT_COMPLETO =
  'id, user_id, data, horario_coleta, momento_avaliacao, avaliador_id, protocolo, sexo, idade, peso_kg, altura_cm, equipamento, transdutor_mhz, soma_gordura_mm, soma_equivalente_mm, soma_muscular_mm, densidade_corporal, percentual_gordura, massa_gorda_kg, massa_magra_kg, equation_version, equacao_densidade, formula_percentual, conversao_id, conversao_fator, conversao_offset, agregacao_repeticoes, estimativa_confiavel, calculo_avisos, interpretacao, created_at, updated_at, medidas:fitness_usg_measurements(id, site, tecido, lado, repeticoes_mm, valor_mm, cv_percent, fora_de_tolerancia, observacao)'

interface RotaParams {
  params: { id: string; assessmentId: string }
}

// GET — detalhe de uma avaliação
export async function GET(_request: NextRequest, { params }: RotaParams) {
  try {
    const acesso = await requireClinicalAccess(params.id, {
      allowedClinicalRoles: PAPEIS,
    })
    if ('error' in acesso) return acesso.error

    const { data, error } = await acesso.supabaseAdmin
      .from('fitness_usg_assessments')
      .select(SELECT_COMPLETO)
      .eq('id', params.assessmentId)
      // Sem este filtro, quem tem vínculo com um paciente leria a avaliação
      // de qualquer outro só trocando o id na URL.
      .eq('user_id', params.id)
      .maybeSingle()

    if (error) {
      console.error('Erro ao buscar avaliação de ultrassom:', error)
      return NextResponse.json({ success: false, error: 'Erro ao buscar' }, { status: 500 })
    }
    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Avaliação não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, assessment: data })
  } catch (error) {
    console.error('Erro na API de ultrassom:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}

// PUT — edita metadados e/ou medidas, sempre recalculando os derivados
export async function PUT(request: NextRequest, { params }: RotaParams) {
  try {
    const acesso = await requireClinicalAccess(params.id, {
      allowedClinicalRoles: PAPEIS,
    })
    if ('error' in acesso) return acesso.error

    const { supabaseAdmin, user } = acesso

    // Traz a linha inteira: além dos metadados, precisamos dos parâmetros de
    // cálculo pinados (para não recalcular com a configuração de hoje) e dos
    // derivados atuais (para restaurar caso a regravação das medidas falhe).
    const { data: atual } = await supabaseAdmin
      .from('fitness_usg_assessments')
      .select('*')
      .eq('id', params.assessmentId)
      .eq('user_id', params.id)
      .maybeSingle()

    if (!atual) {
      return NextResponse.json(
        { success: false, error: 'Avaliação não encontrada' },
        { status: 404 }
      )
    }

    const body = await request.json().catch(() => null)
    if (typeof body !== 'object' || body === null) {
      return NextResponse.json(
        { success: false, error: 'Corpo da requisição inválido' },
        { status: 400 }
      )
    }
    const corpo = body as Record<string, unknown>

    // Só a interpretação mudou: caminho leve, sem recalcular nada.
    const somenteInterpretacao =
      Object.keys(corpo).length > 0 &&
      Object.keys(corpo).every((k) => k === 'interpretacao')

    if (somenteInterpretacao) {
      const { error: updateError } = await supabaseAdmin
        .from('fitness_usg_assessments')
        .update({
          ...(typeof corpo.interpretacao === 'string'
            ? { interpretacao: corpo.interpretacao.trim().slice(0, 5000) || null }
            : {}),
          updated_by: user.id,
        })
        .eq('id', params.assessmentId)

      if (updateError) {
        console.error('Erro ao atualizar interpretação:', updateError)
        return NextResponse.json(
          { success: false, error: 'Erro ao salvar' },
          { status: 500 }
        )
      }

      const { data: completo } = await supabaseAdmin
        .from('fitness_usg_assessments')
        .select(SELECT_COMPLETO)
        .eq('id', params.assessmentId)
        .single()

      return NextResponse.json({ success: true, assessment: completo })
    }

    // Medidas não vieram no corpo: recarrega o bruto do banco para recalcular.
    let medidasParaCalculo = corpo.medidas
    if (medidasParaCalculo === undefined) {
      const { data: medidasGravadas } = await supabaseAdmin
        .from('fitness_usg_measurements')
        .select('site, tecido, lado, repeticoes_mm')
        .eq('assessment_id', params.assessmentId)

      medidasParaCalculo = (medidasGravadas ?? []).map((m) => ({
        site: m.site,
        tecido: m.tecido,
        lado: m.lado,
        repeticoes_mm: (m.repeticoes_mm ?? []).map(Number),
      }))
    }

    // Mescla por PRESENÇA da chave, não por `??`: assim enviar `null` de fato
    // limpa o campo, em vez de silenciosamente manter o valor antigo.
    const mesclar = (chave: string, valorAtual: unknown): unknown =>
      Object.prototype.hasOwnProperty.call(corpo, chave) ? corpo[chave] : valorAtual

    const parsed = parseUsgRequest(
      {
        protocolo: mesclar('protocolo', atual.protocolo),
        data: mesclar('data', atual.data),
        horario_coleta: mesclar('horario_coleta', atual.horario_coleta),
        momento_avaliacao: mesclar('momento_avaliacao', atual.momento_avaliacao),
        sexo: mesclar('sexo', atual.sexo),
        idade: mesclar('idade', atual.idade),
        peso_kg: mesclar('peso_kg', atual.peso_kg),
        altura_cm: mesclar('altura_cm', atual.altura_cm),
        equipamento: mesclar('equipamento', atual.equipamento),
        transdutor_mhz: mesclar('transdutor_mhz', atual.transdutor_mhz),
        interpretacao: mesclar('interpretacao', atual.interpretacao),
        config: corpo.config,
        medidas: medidasParaCalculo,
      },
      { sexo: atual.sexo ?? null, data_nascimento: null },
      // Parâmetros congelados da avaliação. Sem isto, corrigir um campo
      // qualquer de uma coleta antiga a recalcularia com a conversão vigente
      // hoje, misturando duas calibrações na mesma série histórica.
      configFromStoredRow(atual)
    )

    if (!parsed.ok) {
      return NextResponse.json(
        { success: false, error: parsed.error },
        { status: parsed.status }
      )
    }

    const resultado = computeUsgAssessment(parsed.input)

    const { error: updateError } = await supabaseAdmin
      .from('fitness_usg_assessments')
      .update({
        ...buildAssessmentRow(parsed.input, parsed.meta, resultado),
        updated_by: user.id,
      })
      .eq('id', params.assessmentId)

    if (updateError) {
      if (updateError.code === '23505') {
        return NextResponse.json(
          {
            success: false,
            error:
              'Já existe outra avaliação deste paciente com o mesmo protocolo nesta data.',
          },
          { status: 409 }
        )
      }
      console.error('Erro ao atualizar avaliação de ultrassom:', updateError)
      return NextResponse.json(
        { success: false, error: 'Erro ao salvar avaliação' },
        { status: 500 }
      )
    }

    if (corpo.medidas !== undefined) {
      const { error: rpcError } = await supabaseAdmin.rpc(
        'fitness_usg_replace_measurements',
        {
          p_assessment_id: params.assessmentId,
          p_rows: buildMeasurementRows(resultado),
        }
      )
      if (rpcError) {
        console.error('Erro ao regravar medidas do ultrassom:', rpcError)

        // O pai já foi atualizado com os derivados novos. Sem desfazer, a
        // avaliação ficaria com um percentual calculado sobre medidas que o
        // banco não tem — exatamente o descasamento que a RPC existe para
        // evitar. Restaura o estado anterior a partir do snapshot.
        const { error: rollbackError } = await supabaseAdmin
          .from('fitness_usg_assessments')
          .update({
            soma_gordura_mm: atual.soma_gordura_mm,
            soma_equivalente_mm: atual.soma_equivalente_mm,
            soma_muscular_mm: atual.soma_muscular_mm,
            densidade_corporal: atual.densidade_corporal,
            percentual_gordura: atual.percentual_gordura,
            massa_gorda_kg: atual.massa_gorda_kg,
            massa_magra_kg: atual.massa_magra_kg,
            equation_version: atual.equation_version,
            equacao_densidade: atual.equacao_densidade,
            formula_percentual: atual.formula_percentual,
            conversao_id: atual.conversao_id,
            conversao_fator: atual.conversao_fator,
            conversao_offset: atual.conversao_offset,
            agregacao_repeticoes: atual.agregacao_repeticoes,
            estimativa_confiavel: atual.estimativa_confiavel,
            calculo_avisos: atual.calculo_avisos,
            protocolo: atual.protocolo,
            sexo: atual.sexo,
            idade: atual.idade,
            peso_kg: atual.peso_kg,
            altura_cm: atual.altura_cm,
          })
          .eq('id', params.assessmentId)

        if (rollbackError) {
          console.error(
            'FALHA AO REVERTER avaliação de ultrassom — derivados podem estar descasados das medidas:',
            params.assessmentId,
            rollbackError
          )
        }

        return NextResponse.json(
          { success: false, error: 'Erro ao salvar as medidas' },
          { status: 500 }
        )
      }
    }

    const { data: completo } = await supabaseAdmin
      .from('fitness_usg_assessments')
      .select(SELECT_COMPLETO)
      .eq('id', params.assessmentId)
      .single()

    return NextResponse.json({
      success: true,
      assessment: completo,
      calculo: {
        avisos: resultado.avisos,
        estimativa_confiavel: resultado.estimativa_confiavel,
      },
    })
  } catch (error) {
    console.error('Erro na API de ultrassom:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}

// DELETE — remove a avaliação (as medidas caem por CASCADE)
export async function DELETE(_request: NextRequest, { params }: RotaParams) {
  try {
    const acesso = await requireClinicalAccess(params.id, {
      allowedClinicalRoles: PAPEIS,
    })
    if ('error' in acesso) return acesso.error

    const { error, count } = await acesso.supabaseAdmin
      .from('fitness_usg_assessments')
      .delete({ count: 'exact' })
      .eq('id', params.assessmentId)
      .eq('user_id', params.id)

    if (error) {
      console.error('Erro ao remover avaliação de ultrassom:', error)
      return NextResponse.json({ success: false, error: 'Erro ao remover' }, { status: 500 })
    }
    if (!count) {
      return NextResponse.json(
        { success: false, error: 'Avaliação não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro na API de ultrassom:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}
