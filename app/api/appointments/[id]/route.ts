import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import type { UpdateAppointmentInput } from '@/types/appointments'

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// GET - Detalhes de uma consulta
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

    // Verificar acesso: paciente, profissional ou admin
    const isPatient = appointment.patient_id === user.id

    const { data: profile } = await supabaseAdmin
      .from('fitness_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.role === 'super_admin' || profile?.role === 'admin'

    const { data: professional } = await supabaseAdmin
      .from('fitness_professionals')
      .select('id')
      .eq('user_id', user.id)
      .eq('id', appointment.professional_id)
      .maybeSingle()

    const isProfessional = !!professional

    if (!isPatient && !isAdmin && !isProfessional) {
      return NextResponse.json({ success: false, error: 'Sem permissão' }, { status: 403 })
    }

    // Enriquecer com dados do profissional
    const { data: prof } = await supabaseAdmin
      .from('fitness_professionals')
      .select('id, display_name, type')
      .eq('id', appointment.professional_id)
      .single()

    const enriched = {
      ...appointment,
      professional_name: prof?.display_name || 'Profissional',
      professional_type: prof?.type || 'trainer',
    }

    // Se admin ou profissional, incluir dados do paciente
    if (isAdmin || isProfessional) {
      const { data: patient } = await supabaseAdmin
        .from('fitness_profiles')
        .select('id, nome, email')
        .eq('id', appointment.patient_id)
        .single()

      Object.assign(enriched, {
        patient_name: patient?.nome || 'Paciente',
        patient_email: patient?.email || '',
      })
    }

    return NextResponse.json({ success: true, data: enriched })
  } catch (error) {
    console.error('Erro na API de consultas:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}

// PATCH - Atualizar consulta (admin ou profissional)
export async function PATCH(
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

    // Verificar permissão (admin ou profissional da consulta)
    const { data: profile } = await supabaseAdmin
      .from('fitness_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.role === 'super_admin' || profile?.role === 'admin'

    if (!isAdmin) {
      const { data: appointment } = await supabaseAdmin
        .from('fitness_appointments')
        .select('professional_id')
        .eq('id', id)
        .single()

      if (!appointment) {
        return NextResponse.json({ success: false, error: 'Consulta não encontrada' }, { status: 404 })
      }

      const { data: professional } = await supabaseAdmin
        .from('fitness_professionals')
        .select('id')
        .eq('user_id', user.id)
        .eq('id', appointment.professional_id)
        .maybeSingle()

      if (!professional) {
        return NextResponse.json({ success: false, error: 'Sem permissão' }, { status: 403 })
      }
    }

    const body = await request.json() as UpdateAppointmentInput

    // Validate status transition if changing status
    if (body.status) {
      const { data: current } = await supabaseAdmin
        .from('fitness_appointments')
        .select('status')
        .eq('id', id)
        .single()

      if (current) {
        const validTransitions: Record<string, string[]> = {
          scheduled: ['confirmed', 'cancelled', 'no_show', 'reschedule_requested'],
          confirmed: ['completed', 'cancelled', 'no_show', 'reschedule_requested'],
          reschedule_requested: ['scheduled', 'confirmed', 'cancelled'],
          completed: [],
          cancelled: ['scheduled'],
          no_show: ['scheduled'],
        }
        const allowed = validTransitions[current.status as string] || []
        if (!allowed.includes(body.status)) {
          return NextResponse.json(
            { success: false, error: `Transição de status inválida: ${current.status} → ${body.status}` },
            { status: 400 }
          )
        }
      }
    }

    // Validate appointment_type if provided
    if (body.appointment_type && !['presencial', 'online'].includes(body.appointment_type)) {
      return NextResponse.json(
        { success: false, error: 'Tipo de consulta inválido' },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }

    if (body.appointment_type !== undefined) updateData.appointment_type = body.appointment_type
    if (body.meeting_link !== undefined) updateData.meeting_link = body.meeting_link
    if (body.date !== undefined) updateData.date = body.date
    if (body.start_time !== undefined) updateData.start_time = body.start_time
    if (body.end_time !== undefined) updateData.end_time = body.end_time
    if (body.location !== undefined) updateData.location = body.location
    if (body.status !== undefined) updateData.status = body.status
    if (body.notes !== undefined) updateData.notes = body.notes

    const { data: updated, error } = await supabaseAdmin
      .from('fitness_appointments')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar consulta:', error)
      return NextResponse.json({ success: false, error: 'Erro ao atualizar consulta' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('Erro na API de consultas:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}

// DELETE - Cancelar consulta (soft delete → status 'cancelled')
export async function DELETE(
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

    // Verificar permissão (admin apenas)
    const { data: profile } = await supabaseAdmin
      .from('fitness_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.role === 'super_admin' || profile?.role === 'admin'

    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Apenas admin pode cancelar consultas' }, { status: 403 })
    }

    const { data: updated, error } = await supabaseAdmin
      .from('fitness_appointments')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao cancelar consulta:', error)
      return NextResponse.json({ success: false, error: 'Erro ao cancelar consulta' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('Erro na API de consultas:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}
