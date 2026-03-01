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

// POST - Paciente solicita reagendamento
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params
    const supabaseAdmin = getAdminClient()

    const body = await request.json()
    const reason = body?.reason

    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Informe o motivo do reagendamento' },
        { status: 400 }
      )
    }

    // Verificar que a consulta pertence ao paciente
    const { data: appointment, error: fetchError } = await supabaseAdmin
      .from('fitness_appointments')
      .select('id, patient_id, status')
      .eq('id', id)
      .single()

    if (fetchError || !appointment) {
      return NextResponse.json({ success: false, error: 'Consulta não encontrada' }, { status: 404 })
    }

    if (appointment.patient_id !== user.id) {
      return NextResponse.json({ success: false, error: 'Sem permissão' }, { status: 403 })
    }

    if (!['scheduled', 'confirmed'].includes(appointment.status)) {
      return NextResponse.json(
        { success: false, error: 'Não é possível reagendar consulta com status atual' },
        { status: 400 }
      )
    }

    const { data: updated, error } = await supabaseAdmin
      .from('fitness_appointments')
      .update({
        status: 'reschedule_requested',
        reschedule_reason: reason.trim(),
        reschedule_requested_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao solicitar reagendamento:', error)
      return NextResponse.json({ success: false, error: 'Erro ao solicitar reagendamento' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('Erro na API de reagendamento:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}
