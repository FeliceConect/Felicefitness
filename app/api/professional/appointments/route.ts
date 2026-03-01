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

// GET - Listar consultas do profissional autenticado
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
    }

    const supabaseAdmin = getAdminClient()

    // Buscar professional_id do usuário
    const { data: professional, error: profError } = await supabaseAdmin
      .from('fitness_professionals')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (profError || !professional) {
      return NextResponse.json({ success: false, error: 'Profissional não encontrado' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    let query = supabaseAdmin
      .from('fitness_appointments')
      .select('*')
      .eq('professional_id', professional.id)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true })

    if (status) {
      const statuses = status.split(',')
      query = query.in('status', statuses)
    }

    if (dateFrom) {
      query = query.gte('date', dateFrom)
    }

    if (dateTo) {
      query = query.lte('date', dateTo)
    }

    const { data: appointments, error } = await query

    if (error) {
      console.error('Erro ao buscar consultas do profissional:', error)
      return NextResponse.json({ success: false, error: 'Erro ao buscar consultas' }, { status: 500 })
    }

    if (!appointments || appointments.length === 0) {
      return NextResponse.json({ success: true, data: [] })
    }

    // Enriquecer com dados dos pacientes
    const patientIds = Array.from(new Set(appointments.map(a => a.patient_id)))
    const { data: patients } = await supabaseAdmin
      .from('fitness_profiles')
      .select('id, nome, email')
      .in('id', patientIds)

    const patientMap = new Map((patients || []).map(p => [p.id, p]))

    // Verificar formulários pendentes para cada paciente
    const { data: formAssignments } = await supabaseAdmin
      .from('fitness_form_assignments')
      .select('client_id, status')
      .eq('professional_id', professional.id)
      .in('client_id', patientIds)
      .in('status', ['pending', 'in_progress'])

    const pendingFormsByPatient = new Map<string, number>()
    if (formAssignments) {
      for (const fa of formAssignments) {
        pendingFormsByPatient.set(fa.client_id, (pendingFormsByPatient.get(fa.client_id) || 0) + 1)
      }
    }

    const enriched = appointments.map(a => ({
      ...a,
      patient_name: patientMap.get(a.patient_id)?.nome || 'Paciente',
      patient_email: patientMap.get(a.patient_id)?.email || '',
      pending_forms: pendingFormsByPatient.get(a.patient_id) || 0,
    }))

    return NextResponse.json({ success: true, data: enriched })
  } catch (error) {
    console.error('Erro na API de consultas do profissional:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}
