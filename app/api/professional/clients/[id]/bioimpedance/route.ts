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

// GET - Bioimpedance history for a client
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

    // Fetch bioimpedance records
    const { data: records, error } = await supabaseAdmin
      .from('fitness_body_compositions')
      .select('id, data, peso, massa_muscular, gordura_corporal, agua_corporal, massa_ossea, metabolismo_basal, gordura_visceral, score_inbody, imc')
      .eq('user_id', params.id)
      .order('data', { ascending: false })
      .limit(30)

    if (error) {
      console.error('Erro ao buscar bioimpedância:', error)
      return NextResponse.json({ success: false, error: 'Erro ao buscar dados' }, { status: 500 })
    }

    return NextResponse.json({ success: true, records: records || [] })
  } catch (error) {
    console.error('Erro na API de bioimpedância:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}
