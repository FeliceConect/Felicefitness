/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { awardBioimpedancePoints, recalculateChainFrom } from '@/lib/bioimpedance/award'
import { notifyBioimpedanceRegistered } from '@/lib/notifications/bioimpedance'

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

const VALID_MOMENTOS = ['M0', 'M1', 'M2', 'M3', 'M4', 'M5', 'M6']

async function requirePermission(patientId?: string) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 }) }
  }
  const supabaseAdmin = getAdminClient()
  const { data: profile } = await supabaseAdmin
    .from('fitness_profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (!profile || !['super_admin', 'admin', 'nutritionist', 'trainer', 'coach', 'physiotherapist', 'medico_integrativo'].includes(profile.role)) {
    return { error: NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 }) }
  }

  // super_admin e admin têm acesso a qualquer paciente.
  // Profissionais clínicos precisam ter o paciente vinculado (assignment).
  const clinicalRoles = ['nutritionist', 'trainer', 'coach', 'physiotherapist', 'medico_integrativo']
  if (patientId && clinicalRoles.includes(profile.role)) {
    const { data: professional } = await supabaseAdmin
      .from('fitness_professionals')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle()

    if (!professional) {
      return { error: NextResponse.json({ success: false, error: 'Profissional inativo' }, { status: 403 }) }
    }

    const { data: assignment } = await supabaseAdmin
      .from('fitness_client_assignments')
      .select('id')
      .eq('professional_id', professional.id)
      .eq('client_id', patientId)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle()

    if (!assignment) {
      return { error: NextResponse.json({ success: false, error: 'Paciente não vinculado' }, { status: 403 }) }
    }
  }

  return { user, supabaseAdmin }
}

// GET - Lista bioimpedâncias completas do paciente (para admin/support)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: patientId } = await params
    const auth = await requirePermission(patientId)
    if ('error' in auth) return auth.error
    const { supabaseAdmin } = auth

    const { data: records, error } = await supabaseAdmin
      .from('fitness_body_compositions')
      .select('*')
      .eq('user_id', patientId)
      .order('data', { ascending: false })
      .limit(30)

    if (error) {
      console.error('Erro ao buscar bioimpedâncias:', error)
      return NextResponse.json({ success: false, error: 'Erro ao buscar dados' }, { status: 500 })
    }

    // filtra só os que têm pelo menos um campo de bioimpedância
    const filtered = (records || []).filter(r =>
      r.peso || r.percentual_gordura || r.massa_muscular_esqueletica_kg ||
      r.massa_gordura_kg || r.agua_corporal_l || r.taxa_metabolica_basal ||
      r.gordura_visceral || r.pontuacao_inbody || r.idade_metabolica
    )

    return NextResponse.json({ success: true, records: filtered })
  } catch (error) {
    console.error('Erro API bioimpedância:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}

// POST - Cria nova bioimpedância para o paciente
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: patientId } = await params
    const auth = await requirePermission(patientId)
    if ('error' in auth) return auth.error
    const { user, supabaseAdmin } = auth

    const body = await request.json()

    // Validação do momento (opcional)
    if (body.momento_avaliacao && !VALID_MOMENTOS.includes(body.momento_avaliacao)) {
      return NextResponse.json({ success: false, error: 'Momento inválido' }, { status: 400 })
    }

    const data = body.data || new Date().toISOString().split('T')[0]

    const { data: record, error } = await supabaseAdmin
      .from('fitness_body_compositions')
      .insert({
        user_id: patientId,
        data,
        fonte: body.fonte || 'inbody',
        // Básicos
        peso: body.peso ?? null,
        altura_cm: body.altura_cm ?? null,
        idade: body.idade ?? null,
        // Composição
        agua_corporal_l: body.agua_corporal_l ?? null,
        proteina_kg: body.proteina_kg ?? null,
        minerais_kg: body.minerais_kg ?? null,
        massa_gordura_kg: body.massa_gordura_kg ?? null,
        massa_muscular_esqueletica_kg: body.massa_muscular_esqueletica_kg ?? null,
        massa_livre_gordura_kg: body.massa_livre_gordura_kg ?? null,
        // Índices
        imc: body.imc ?? null,
        percentual_gordura: body.percentual_gordura ?? null,
        taxa_metabolica_basal: body.taxa_metabolica_basal ?? null,
        gordura_visceral: body.gordura_visceral ?? null,
        pontuacao_inbody: body.pontuacao_inbody ?? null,
        idade_metabolica: body.idade_metabolica ?? null,
        relacao_cintura_quadril: body.relacao_cintura_quadril ?? null,
        grau_obesidade: body.grau_obesidade ?? null,
        // Controle
        peso_ideal: body.peso_ideal ?? null,
        controle_peso: body.controle_peso ?? null,
        controle_gordura: body.controle_gordura ?? null,
        controle_muscular: body.controle_muscular ?? null,
        // Segmental - massa magra (kg + %)
        massa_magra_braco_direito: body.massa_magra_braco_direito ?? null,
        massa_magra_braco_direito_percent: body.massa_magra_braco_direito_percent ?? null,
        massa_magra_braco_esquerdo: body.massa_magra_braco_esquerdo ?? null,
        massa_magra_braco_esquerdo_percent: body.massa_magra_braco_esquerdo_percent ?? null,
        massa_magra_tronco: body.massa_magra_tronco ?? null,
        massa_magra_tronco_percent: body.massa_magra_tronco_percent ?? null,
        massa_magra_perna_direita: body.massa_magra_perna_direita ?? null,
        massa_magra_perna_direita_percent: body.massa_magra_perna_direita_percent ?? null,
        massa_magra_perna_esquerda: body.massa_magra_perna_esquerda ?? null,
        massa_magra_perna_esquerda_percent: body.massa_magra_perna_esquerda_percent ?? null,
        // Segmental - gordura (kg + %)
        gordura_braco_direito: body.gordura_braco_direito ?? null,
        gordura_braco_direito_percent: body.gordura_braco_direito_percent ?? null,
        gordura_braco_esquerdo: body.gordura_braco_esquerdo ?? null,
        gordura_braco_esquerdo_percent: body.gordura_braco_esquerdo_percent ?? null,
        gordura_tronco: body.gordura_tronco ?? null,
        gordura_tronco_percent: body.gordura_tronco_percent ?? null,
        gordura_perna_direita: body.gordura_perna_direita ?? null,
        gordura_perna_direita_percent: body.gordura_perna_direita_percent ?? null,
        gordura_perna_esquerda: body.gordura_perna_esquerda ?? null,
        gordura_perna_esquerda_percent: body.gordura_perna_esquerda_percent ?? null,
        // Impedância bruta Z (20 kHz + 100 kHz × 5 segmentos)
        impedancia_dados: body.impedancia_dados ?? null,
        // Metadados
        foto_url: body.foto_url ?? null,
        notas: body.notas ?? null,
        momento_avaliacao: body.momento_avaliacao ?? null,
        avaliador_id: body.avaliador_id ?? user.id,
        horario_coleta: body.horario_coleta ?? null,
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar bioimpedância:', error)
      return NextResponse.json({ success: false, error: 'Erro ao salvar: ' + error.message }, { status: 500 })
    }

    // Pontuação automática por delta vs. registro anterior do mesmo paciente
    const breakdown = await awardBioimpedancePoints(supabaseAdmin, {
      patientId,
      recordId: record.id,
      currentDate: record.data,
      current: {
        peso: record.peso,
        massa_muscular_esqueletica_kg: record.massa_muscular_esqueletica_kg,
        gordura_visceral: record.gordura_visceral,
      },
    })

    // Se o novo registro foi inserido com data ANTERIOR à última medição existente
    // (ex: lançando um histórico), as medições posteriores passam a ter um novo
    // "anterior" e precisam ter pontos recalculados.
    try {
      const { data: nextRecord } = await supabaseAdmin
        .from('fitness_body_compositions')
        .select('id, data')
        .eq('user_id', patientId)
        .gt('data', record.data)
        .order('data', { ascending: true })
        .limit(1)
        .maybeSingle()
      if (nextRecord?.data) {
        // Recalcula a partir da próxima medição (ela e todas depois dela)
        await recalculateChainFrom(supabaseAdmin, patientId, nextRecord.data)
      }
    } catch (recalcErr) {
      console.error('Falha no recálculo em cadeia (POST):', recalcErr)
    }

    // Notifica o paciente (fire-and-forget)
    notifyBioimpedanceRegistered(patientId, record.id, breakdown).catch(() => {})

    return NextResponse.json({ success: true, record, points: breakdown })
  } catch (error) {
    console.error('Erro API bioimpedância:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}
