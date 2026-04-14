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

async function requireSuperAdmin() {
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
  if (!profile || profile.role !== 'super_admin') {
    return { error: NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 }) }
  }
  return { user, supabaseAdmin }
}

// GET - Retorna a ficha viva do paciente (cria uma vazia se não existir)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params
    const auth = await requireSuperAdmin()
    if ('error' in auth) return auth.error
    const { supabaseAdmin } = auth

    const { data: existing, error: selectError } = await supabaseAdmin
      .from('fitness_medical_records')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (selectError) {
      console.error('Erro select ficha:', selectError)
      return NextResponse.json({ success: false, error: 'select: ' + selectError.message, details: selectError }, { status: 500 })
    }

    let record = existing
    // Lazy-create: se o paciente nunca teve ficha, cria vazia com defaults
    if (!record) {
      const { data: created, error: insertError } = await supabaseAdmin
        .from('fitness_medical_records')
        .insert({
          user_id: userId,
          program_name: 'felice_wellness',
          program_duration_months: 6,
        })
        .select()
        .single()

      if (insertError) {
        console.error('Erro criando ficha vazia:', insertError)
        return NextResponse.json({ success: false, error: 'insert: ' + insertError.message, details: insertError }, { status: 500 })
      }
      record = created
    }

    return NextResponse.json({ success: true, record })
  } catch (error) {
    console.error('Erro ao buscar ficha:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}

// PUT - Atualiza a ficha viva
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params
    const auth = await requireSuperAdmin()
    if ('error' in auth) return auth.error
    const { user, supabaseAdmin } = auth

    const body = await request.json()
    const allowed: Record<string, unknown> = {}
    const fields = [
      'program_name',
      'program_start_date',
      'program_duration_months',
      'assigned_super_admin_id',
      'objectives',
      'health_history',
      'lifestyle',
      'difficulties',
      'clinical_impressions',
    ]
    for (const f of fields) {
      if (f in body) allowed[f] = body[f]
    }
    allowed.updated_by = user.id

    const { data: record, error } = await supabaseAdmin
      .from('fitness_medical_records')
      .update(allowed)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar ficha:', error)
      return NextResponse.json({ success: false, error: 'Erro ao atualizar' }, { status: 500 })
    }

    return NextResponse.json({ success: true, record })
  } catch (error) {
    console.error('Erro ao atualizar ficha:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}
