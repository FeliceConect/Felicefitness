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

// GET - Admin lista todas as consultas
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
    }

    const supabaseAdmin = getAdminClient()

    // Verificar se é admin
    const { data: profile } = await supabaseAdmin
      .from('fitness_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.role === 'super_admin' || profile?.role === 'admin'
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Sem permissão' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const professionalId = searchParams.get('professionalId')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const appointmentType = searchParams.get('type')
    const limit = searchParams.get('limit')

    let query = supabaseAdmin
      .from('fitness_appointments')
      .select('*')
      .order('date', { ascending: true })
      .order('start_time', { ascending: true })

    if (status) {
      const statuses = status.split(',')
      query = query.in('status', statuses)
    }

    if (professionalId) {
      query = query.eq('professional_id', professionalId)
    }

    if (dateFrom) {
      query = query.gte('date', dateFrom)
    }

    if (dateTo) {
      query = query.lte('date', dateTo)
    }

    if (appointmentType) {
      query = query.eq('appointment_type', appointmentType)
    }

    if (limit) {
      query = query.limit(parseInt(limit, 10))
    }

    const { data: appointments, error } = await query

    if (error) {
      console.error('Erro ao buscar consultas (admin):', error)
      return NextResponse.json({ success: false, error: 'Erro ao buscar consultas' }, { status: 500 })
    }

    if (!appointments || appointments.length === 0) {
      return NextResponse.json({ success: true, data: [] })
    }

    // Enriquecer com profissionais e pacientes
    const professionalIds = Array.from(new Set(appointments.map(a => a.professional_id)))
    const patientIds = Array.from(new Set(appointments.map(a => a.patient_id)))

    const [{ data: professionals }, { data: patients }] = await Promise.all([
      supabaseAdmin
        .from('fitness_professionals')
        .select('id, display_name, type')
        .in('id', professionalIds),
      supabaseAdmin
        .from('fitness_profiles')
        .select('id, nome, email')
        .in('id', patientIds),
    ])

    const profMap = new Map((professionals || []).map(p => [p.id, p]))
    const patientMap = new Map((patients || []).map(p => [p.id, p]))

    const enriched = appointments.map(a => ({
      ...a,
      professional_name: profMap.get(a.professional_id)?.display_name || 'Profissional',
      professional_type: profMap.get(a.professional_id)?.type || 'trainer',
      patient_name: patientMap.get(a.patient_id)?.nome || 'Paciente',
      patient_email: patientMap.get(a.patient_id)?.email || '',
    }))

    return NextResponse.json({ success: true, data: enriched })
  } catch (error) {
    console.error('Erro na API admin de consultas:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}
