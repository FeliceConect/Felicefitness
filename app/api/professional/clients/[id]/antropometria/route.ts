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

// GET - Antropometria (circumference) history for a client
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Nao autorizado' }, { status: 401 })
    }

    const supabaseAdmin = getAdminClient()

    // Verify professional
    const { data: professional } = await supabaseAdmin
      .from('fitness_professionals')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (!professional) {
      return NextResponse.json({ success: false, error: 'Acesso restrito' }, { status: 403 })
    }

    // Verify assignment
    const { data: assignment } = await supabaseAdmin
      .from('fitness_client_assignments')
      .select('id')
      .eq('professional_id', professional.id)
      .eq('client_id', params.id)
      .eq('is_active', true)
      .limit(1)
      .single()

    if (!assignment) {
      return NextResponse.json({ success: false, error: 'Paciente nao vinculado' }, { status: 403 })
    }

    // Fetch records with circumference fields
    const { data: records, error } = await supabaseAdmin
      .from('fitness_body_compositions')
      .select('id, data, fonte, circ_torax, circ_abdome, circ_braco_d, circ_braco_e, circ_antebraco_d, circ_antebraco_e, circ_coxa_d, circ_coxa_e, circ_panturrilha_d, circ_panturrilha_e')
      .eq('user_id', params.id)
      .order('data', { ascending: false })
      .limit(30)

    if (error) {
      console.error('Erro ao buscar antropometria:', error)
      return NextResponse.json({ success: false, error: 'Erro ao buscar dados' }, { status: 500 })
    }

    // Filter to only records that have at least one circumference value
    const filtered = (records || []).filter(r =>
      r.circ_torax || r.circ_abdome || r.circ_braco_d || r.circ_braco_e ||
      r.circ_antebraco_d || r.circ_antebraco_e || r.circ_coxa_d || r.circ_coxa_e ||
      r.circ_panturrilha_d || r.circ_panturrilha_e
    )

    return NextResponse.json({ success: true, records: filtered })
  } catch (error) {
    console.error('Erro na API de antropometria:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}

// POST - Create new antropometria record
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Nao autorizado' }, { status: 401 })
    }

    const supabaseAdmin = getAdminClient()

    // Verify professional — nutri, trainer, admin, superadmin can create
    const { data: professional } = await supabaseAdmin
      .from('fitness_professionals')
      .select('id, type')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (!professional) {
      // Check if user is admin/superadmin
      const { data: profile } = await supabaseAdmin
        .from('fitness_profiles')
        .select('role')
        .eq('user_id', user.id)
        .single()

      if (!profile || !['super_admin', 'admin'].includes(profile.role)) {
        return NextResponse.json({ success: false, error: 'Sem permissão' }, { status: 403 })
      }
    } else {
      // Verify assignment
      const { data: assignment } = await supabaseAdmin
        .from('fitness_client_assignments')
        .select('id')
        .eq('professional_id', professional.id)
        .eq('client_id', params.id)
        .eq('is_active', true)
        .limit(1)
        .single()

      if (!assignment) {
        return NextResponse.json({ success: false, error: 'Paciente nao vinculado' }, { status: 403 })
      }
    }

    const body = await request.json()
    const today = new Date().toISOString().split('T')[0]

    const { data: record, error } = await supabaseAdmin
      .from('fitness_body_compositions')
      .insert({
        user_id: params.id,
        data: today,
        fonte: 'manual',
        circ_torax: body.circ_torax || null,
        circ_abdome: body.circ_abdome || null,
        circ_braco_d: body.circ_braco_d || null,
        circ_braco_e: body.circ_braco_e || null,
        circ_antebraco_d: body.circ_antebraco_d || null,
        circ_antebraco_e: body.circ_antebraco_e || null,
        circ_coxa_d: body.circ_coxa_d || null,
        circ_coxa_e: body.circ_coxa_e || null,
        circ_panturrilha_d: body.circ_panturrilha_d || null,
        circ_panturrilha_e: body.circ_panturrilha_e || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar registro:', error)
      return NextResponse.json({ success: false, error: 'Erro ao salvar' }, { status: 500 })
    }

    return NextResponse.json({ success: true, record })
  } catch (error) {
    console.error('Erro na API de antropometria:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}
