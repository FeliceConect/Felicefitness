/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

const VALID_MOMENTOS = ['M0', 'M1', 'M2', 'M3', 'M4', 'M5', 'M6']

const ALLOWED = [
  'data', 'horario_coleta', 'momento_avaliacao',
  'circ_torax', 'circ_cintura', 'circ_abdome', 'circ_quadril',
  'circ_braco_d', 'circ_braco_e', 'circ_braco_contraido_d', 'circ_braco_contraido_e',
  'circ_antebraco_d', 'circ_antebraco_e',
  'circ_coxa_d', 'circ_coxa_e', 'circ_coxa_medial_d', 'circ_coxa_medial_e',
  'circ_panturrilha_d', 'circ_panturrilha_e',
]

async function requirePermission() {
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
  return { user, supabaseAdmin }
}

// PUT - Atualiza medidas antropométricas de um registro
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; recordId: string }> }
) {
  try {
    const { id: patientId, recordId } = await params
    const auth = await requirePermission()
    if ('error' in auth) return auth.error
    const { supabaseAdmin } = auth

    const body = await request.json()

    if (body.momento_avaliacao && !VALID_MOMENTOS.includes(body.momento_avaliacao)) {
      return NextResponse.json({ success: false, error: 'Momento inválido' }, { status: 400 })
    }

    const update: Record<string, unknown> = {}
    for (const k of ALLOWED) {
      if (k in body) update[k] = body[k]
    }
    if (Object.keys(update).length === 0) {
      return NextResponse.json({ success: false, error: 'Nenhum campo para atualizar' }, { status: 400 })
    }

    const { data: existing } = await supabaseAdmin
      .from('fitness_body_compositions')
      .select('id, user_id')
      .eq('id', recordId)
      .single()

    if (!existing || existing.user_id !== patientId) {
      return NextResponse.json({ success: false, error: 'Registro não encontrado' }, { status: 404 })
    }

    const { data: record, error } = await supabaseAdmin
      .from('fitness_body_compositions')
      .update(update)
      .eq('id', recordId)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar antropometria:', error)
      return NextResponse.json({ success: false, error: 'Erro ao atualizar' }, { status: 500 })
    }

    return NextResponse.json({ success: true, record })
  } catch (error) {
    console.error('Erro PUT antropometria:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}

// DELETE - apenas limpa os campos de circunferência (não deleta o registro,
// pois ele pode conter bioimpedância também nessa mesma data)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; recordId: string }> }
) {
  try {
    const { id: patientId, recordId } = await params
    const auth = await requirePermission()
    if ('error' in auth) return auth.error
    const { supabaseAdmin } = auth

    const { data: existing } = await supabaseAdmin
      .from('fitness_body_compositions')
      .select('id, user_id, peso, percentual_gordura, massa_muscular_esqueletica_kg')
      .eq('id', recordId)
      .single()

    if (!existing || existing.user_id !== patientId) {
      return NextResponse.json({ success: false, error: 'Registro não encontrado' }, { status: 404 })
    }

    // Se o registro só tem circunferências (sem bioimpedância) → deleta tudo
    const hasBioimpedance = existing.peso || existing.percentual_gordura || existing.massa_muscular_esqueletica_kg
    if (!hasBioimpedance) {
      const { error } = await supabaseAdmin
        .from('fitness_body_compositions')
        .delete()
        .eq('id', recordId)
      if (error) {
        console.error('Erro ao deletar:', error)
        return NextResponse.json({ success: false, error: 'Erro ao deletar' }, { status: 500 })
      }
      return NextResponse.json({ success: true, deleted: true })
    }

    // Senão → zera só os campos de circunferência
    const clear: Record<string, null> = {}
    for (const k of ALLOWED) {
      if (k.startsWith('circ_')) clear[k] = null
    }
    const { error } = await supabaseAdmin
      .from('fitness_body_compositions')
      .update(clear)
      .eq('id', recordId)
    if (error) {
      console.error('Erro ao limpar antropometria:', error)
      return NextResponse.json({ success: false, error: 'Erro ao limpar' }, { status: 500 })
    }
    return NextResponse.json({ success: true, deleted: false })
  } catch (error) {
    console.error('Erro DELETE antropometria:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}
