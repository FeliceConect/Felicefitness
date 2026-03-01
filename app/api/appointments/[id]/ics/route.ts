import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { generateAppointmentICS } from '@/lib/calendar/ics-generator'
import type { AppointmentWithDetails } from '@/types/appointments'

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// GET - Download arquivo .ics
export async function GET(
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

    const { data: appointment, error } = await supabaseAdmin
      .from('fitness_appointments')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !appointment) {
      return NextResponse.json({ success: false, error: 'Consulta não encontrada' }, { status: 404 })
    }

    // Verificar acesso
    if (appointment.patient_id !== user.id) {
      const { data: profile } = await supabaseAdmin
        .from('fitness_profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      const isAdmin = profile?.role === 'super_admin' || profile?.role === 'admin'
      if (!isAdmin) {
        return NextResponse.json({ success: false, error: 'Sem permissão' }, { status: 403 })
      }
    }

    // Buscar profissional
    const { data: prof } = await supabaseAdmin
      .from('fitness_professionals')
      .select('id, display_name, type')
      .eq('id', appointment.professional_id)
      .single()

    const appointmentWithDetails: AppointmentWithDetails = {
      ...appointment,
      professional_name: prof?.display_name || 'Profissional',
      professional_type: prof?.type || 'trainer',
    }

    const icsContent = generateAppointmentICS(appointmentWithDetails)

    return new NextResponse(icsContent, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="consulta-${appointment.date}.ics"`,
      },
    })
  } catch (error) {
    console.error('Erro ao gerar ICS:', error)
    return NextResponse.json({ success: false, error: 'Erro ao gerar arquivo de calendário' }, { status: 500 })
  }
}
