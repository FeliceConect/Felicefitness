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
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
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
      .select('id, data, peso, massa_muscular_esqueletica_kg, massa_gordura_kg, agua_corporal_l, minerais_kg, taxa_metabolica_basal, gordura_visceral, pontuacao_inbody, imc')
      .eq('user_id', params.id)
      .order('data', { ascending: false })
      .limit(30)

    if (error) {
      console.error('Erro ao buscar bioimpedância:', error)
      return NextResponse.json({ success: false, error: 'Erro ao buscar dados' }, { status: 500 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mapped = (records || []).map((r: any) => ({
      id: r.id,
      data: r.data,
      peso: r.peso,
      massa_muscular: r.massa_muscular_esqueletica_kg,
      gordura_corporal: r.massa_gordura_kg,
      agua_corporal: r.agua_corporal_l,
      massa_ossea: r.minerais_kg,
      metabolismo_basal: r.taxa_metabolica_basal,
      gordura_visceral: r.gordura_visceral,
      score_inbody: r.pontuacao_inbody,
      imc: r.imc,
    }))

    return NextResponse.json({ success: true, records: mapped })
  } catch (error) {
    console.error('Erro na API de bioimpedância:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}
