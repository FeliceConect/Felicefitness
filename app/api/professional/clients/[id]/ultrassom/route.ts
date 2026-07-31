import { NextRequest, NextResponse } from 'next/server'
import { requireClinicalAccess } from '@/lib/auth/require-clinical-access'
import { calcularIdade } from '@/lib/utils/date'
import { computeUsgAssessment } from '@/lib/usg/engine'
import {
  buildAssessmentRow,
  buildMeasurementRows,
  parseUsgRequest,
} from '@/lib/usg/persistence'

// Avaliação por ultrassom é procedimento da nutricionista. super_admin
// (Leonardo/Marinella) passa sempre, pelo helper. A secretária não entra —
// é dado clínico.
const PAPEIS = ['nutritionist'] as const

const SELECT_COMPLETO =
  'id, user_id, data, horario_coleta, momento_avaliacao, avaliador_id, protocolo, sexo, idade, peso_kg, altura_cm, equipamento, transdutor_mhz, soma_gordura_mm, soma_equivalente_mm, soma_muscular_mm, densidade_corporal, percentual_gordura, massa_gorda_kg, massa_magra_kg, equation_version, equacao_densidade, formula_percentual, conversao_id, conversao_fator, conversao_offset, agregacao_repeticoes, estimativa_confiavel, calculo_avisos, interpretacao, created_at, updated_at, medidas:fitness_usg_measurements(id, site, tecido, lado, repeticoes_mm, valor_mm, cv_percent, fora_de_tolerancia, observacao)'

// GET — histórico de avaliações por ultrassom do paciente
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const acesso = await requireClinicalAccess(params.id, {
      allowedClinicalRoles: PAPEIS,
    })
    if ('error' in acesso) return acesso.error

    const limite = Number(request.nextUrl.searchParams.get('limit') ?? 30)

    const [{ data, error }, { data: perfil }] = await Promise.all([
      acesso.supabaseAdmin
        .from('fitness_usg_assessments')
        .select(SELECT_COMPLETO)
        .eq('user_id', params.id)
        .order('data', { ascending: false })
        .limit(Number.isFinite(limite) && limite > 0 ? Math.min(limite, 100) : 30),
      acesso.supabaseAdmin
        .from('fitness_profiles')
        .select('nome, sexo, data_nascimento, altura_cm, peso_atual')
        .eq('id', params.id)
        .maybeSingle(),
    ])

    if (error) {
      console.error('Erro ao buscar avaliações de ultrassom:', error)
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar avaliações' },
        { status: 500 }
      )
    }

    // O wizard de coleta usa isto para pré-preencher o setup. Vem por aqui, e
    // não pela rota compartilhada de detalhe do cliente, para não ampliar o que
    // as outras especialidades enxergam.
    return NextResponse.json({
      success: true,
      assessments: data ?? [],
      paciente: perfil
        ? {
            nome: perfil.nome ?? null,
            sexo: perfil.sexo ?? null,
            idade: calcularIdade(perfil.data_nascimento ?? null),
            altura_cm: perfil.altura_cm ?? null,
            peso_kg: perfil.peso_atual ?? null,
          }
        : null,
    })
  } catch (error) {
    console.error('Erro na API de ultrassom:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}

// POST — registra uma avaliação
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const acesso = await requireClinicalAccess(params.id, {
      allowedClinicalRoles: PAPEIS,
    })
    if ('error' in acesso) return acesso.error

    const { supabaseAdmin, user } = acesso

    const { data: paciente } = await supabaseAdmin
      .from('fitness_profiles')
      .select('id, sexo, data_nascimento, altura_cm')
      .eq('id', params.id)
      .maybeSingle()

    if (!paciente) {
      return NextResponse.json(
        { success: false, error: 'Paciente não encontrado' },
        { status: 404 }
      )
    }

    const body = await request.json().catch(() => null)
    const parsed = parseUsgRequest(body, {
      sexo: paciente.sexo ?? null,
      data_nascimento: paciente.data_nascimento ?? null,
      altura_cm: paciente.altura_cm ?? null,
    })

    if (!parsed.ok) {
      return NextResponse.json(
        { success: false, error: parsed.error },
        { status: parsed.status }
      )
    }

    // O servidor é quem calcula. Qualquer derivado enviado pelo cliente é ignorado.
    const resultado = computeUsgAssessment(parsed.input)

    const { data: assessment, error: insertError } = await supabaseAdmin
      .from('fitness_usg_assessments')
      .insert({
        ...buildAssessmentRow(parsed.input, parsed.meta, resultado),
        user_id: params.id,
        avaliador_id: user.id,
        created_by: user.id,
        updated_by: user.id,
      })
      .select('id')
      .single()

    if (insertError || !assessment) {
      if (insertError?.code === '23505') {
        return NextResponse.json(
          {
            success: false,
            error:
              'Já existe uma avaliação deste paciente com o mesmo protocolo nesta data. Edite a existente ou mude a data.',
          },
          { status: 409 }
        )
      }
      console.error('Erro ao gravar avaliação de ultrassom:', insertError)
      return NextResponse.json(
        { success: false, error: 'Erro ao salvar avaliação' },
        { status: 500 }
      )
    }

    // Gravação atômica das medidas. Se falhar, o pai é removido para não
    // deixar um percentual gravado sem o dado bruto que o justifica.
    const { error: rpcError } = await supabaseAdmin.rpc(
      'fitness_usg_replace_measurements',
      {
        p_assessment_id: assessment.id,
        p_rows: buildMeasurementRows(resultado),
      }
    )

    if (rpcError) {
      console.error('Erro ao gravar medidas do ultrassom:', rpcError)
      await supabaseAdmin.from('fitness_usg_assessments').delete().eq('id', assessment.id)
      return NextResponse.json(
        { success: false, error: 'Erro ao salvar as medidas' },
        { status: 500 }
      )
    }

    const { data: completo } = await supabaseAdmin
      .from('fitness_usg_assessments')
      .select(SELECT_COMPLETO)
      .eq('id', assessment.id)
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
