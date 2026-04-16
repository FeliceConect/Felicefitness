/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { awardBioimpedancePoints, removeBioimpedanceTransaction } from '@/lib/bioimpedance/award'

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

// PUT - Atualiza um registro de bioimpedância + recalcula pontos
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; recordId: string }> }
) {
  try {
    const { id: patientId, recordId } = await params
    const auth = await requirePermission(patientId)
    if ('error' in auth) return auth.error
    const { supabaseAdmin } = auth

    const body = await request.json()

    if (body.momento_avaliacao && !VALID_MOMENTOS.includes(body.momento_avaliacao)) {
      return NextResponse.json({ success: false, error: 'Momento inválido' }, { status: 400 })
    }

    // monta update só com campos reconhecidos
    const updatable = [
      'data', 'fonte', 'peso', 'altura_cm', 'idade',
      'agua_corporal_l', 'proteina_kg', 'minerais_kg', 'massa_gordura_kg',
      'massa_muscular_esqueletica_kg', 'massa_livre_gordura_kg',
      'imc', 'percentual_gordura', 'taxa_metabolica_basal',
      'gordura_visceral', 'pontuacao_inbody', 'idade_metabolica',
      'relacao_cintura_quadril', 'grau_obesidade',
      'peso_ideal', 'controle_peso', 'controle_gordura', 'controle_muscular',
      'massa_magra_braco_direito', 'massa_magra_braco_direito_percent',
      'massa_magra_braco_esquerdo', 'massa_magra_braco_esquerdo_percent',
      'massa_magra_tronco', 'massa_magra_tronco_percent',
      'massa_magra_perna_direita', 'massa_magra_perna_direita_percent',
      'massa_magra_perna_esquerda', 'massa_magra_perna_esquerda_percent',
      'gordura_braco_direito', 'gordura_braco_direito_percent',
      'gordura_braco_esquerdo', 'gordura_braco_esquerdo_percent',
      'gordura_tronco', 'gordura_tronco_percent',
      'gordura_perna_direita', 'gordura_perna_direita_percent',
      'gordura_perna_esquerda', 'gordura_perna_esquerda_percent',
      'impedancia_dados',
      'foto_url', 'notas',
      'momento_avaliacao', 'avaliador_id', 'horario_coleta',
    ]

    const update: Record<string, unknown> = {}
    for (const k of updatable) {
      if (k in body) update[k] = body[k]
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ success: false, error: 'Nenhum campo para atualizar' }, { status: 400 })
    }

    // Valida ownership
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
      console.error('Erro ao atualizar bioimpedância:', error)
      return NextResponse.json({ success: false, error: 'Erro ao atualizar: ' + error.message }, { status: 500 })
    }

    // Recalcula pontos: remove transação antiga + recomputa
    await removeBioimpedanceTransaction(supabaseAdmin, recordId)
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

    return NextResponse.json({ success: true, record, points: breakdown })
  } catch (error) {
    console.error('Erro PUT bioimpedância:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}

// DELETE - Remove registro + reverte pontos + remove foto do Storage
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; recordId: string }> }
) {
  try {
    const { id: patientId, recordId } = await params
    const auth = await requirePermission(patientId)
    if ('error' in auth) return auth.error
    const { supabaseAdmin } = auth

    const { data: existing } = await supabaseAdmin
      .from('fitness_body_compositions')
      .select('id, user_id, foto_url')
      .eq('id', recordId)
      .single()

    if (!existing || existing.user_id !== patientId) {
      return NextResponse.json({ success: false, error: 'Registro não encontrado' }, { status: 404 })
    }

    // Remove pontos relacionados (reverte ranking)
    await removeBioimpedanceTransaction(supabaseAdmin, recordId)

    const { error } = await supabaseAdmin
      .from('fitness_body_compositions')
      .delete()
      .eq('id', recordId)

    if (error) {
      console.error('Erro ao deletar bioimpedância:', error)
      return NextResponse.json({ success: false, error: 'Erro ao deletar' }, { status: 500 })
    }

    // Tenta remover foto do Storage (best-effort)
    if (existing.foto_url) {
      try {
        const url = new URL(existing.foto_url)
        const pathMatch = url.pathname.match(/\/progress-photos\/(.+)$/)
        if (pathMatch) {
          await supabaseAdmin.storage.from('progress-photos').remove([pathMatch[1]])
        }
      } catch {
        // silent
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro DELETE bioimpedância:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}
