import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import type { CreateAppointmentInput } from '@/types/appointments'
import { notificationTemplates } from '@/lib/notifications/templates'
import { sendPushNotification, validatePushConfig } from '@/lib/notifications/push'
import type { PushSubscription } from '@/types/notifications'

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// GET - Listar consultas do paciente autenticado
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
    }

    const supabaseAdmin = getAdminClient()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const limit = searchParams.get('limit')

    let query = supabaseAdmin
      .from('fitness_appointments')
      .select('*')
      .eq('patient_id', user.id)
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

    if (limit) {
      query = query.limit(parseInt(limit, 10))
    }

    const { data: appointments, error } = await query

    if (error) {
      console.error('Erro ao buscar consultas:', error)
      return NextResponse.json({ success: false, error: 'Erro ao buscar consultas' }, { status: 500 })
    }

    // Enriquecer com dados dos profissionais
    if (appointments && appointments.length > 0) {
      const professionalIds = Array.from(new Set(appointments.map(a => a.professional_id)))
      const { data: professionals } = await supabaseAdmin
        .from('fitness_professionals')
        .select('id, display_name, type')
        .in('id', professionalIds)

      const profMap = new Map((professionals || []).map(p => [p.id, p]))

      const enriched = appointments.map(a => ({
        ...a,
        professional_name: profMap.get(a.professional_id)?.display_name || 'Profissional',
        professional_type: profMap.get(a.professional_id)?.type || 'trainer',
      }))

      return NextResponse.json({ success: true, data: enriched })
    }

    return NextResponse.json({ success: true, data: appointments || [] })
  } catch (error) {
    console.error('Erro na API de consultas:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}

// POST - Criar consulta (admin ou profissional)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
    }

    const supabaseAdmin = getAdminClient()

    // Verificar se é admin ou profissional
    const { data: profile } = await supabaseAdmin
      .from('fitness_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.role === 'super_admin' || profile?.role === 'admin'

    if (!isAdmin) {
      const { data: professional } = await supabaseAdmin
        .from('fitness_professionals')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single()

      if (!professional) {
        return NextResponse.json({ success: false, error: 'Sem permissão' }, { status: 403 })
      }
    }

    const body = await request.json() as CreateAppointmentInput

    if (!body.patient_id || !body.professional_id || !body.date || !body.start_time || !body.end_time) {
      return NextResponse.json(
        { success: false, error: 'Campos obrigatórios: patient_id, professional_id, date, start_time, end_time' },
        { status: 400 }
      )
    }

    // Validate appointment_type
    const appointmentType = body.appointment_type || 'presencial'
    if (!['presencial', 'online'].includes(appointmentType)) {
      return NextResponse.json(
        { success: false, error: 'Tipo de consulta deve ser "presencial" ou "online"' },
        { status: 400 }
      )
    }

    // Validate end_time > start_time
    if (body.end_time <= body.start_time) {
      return NextResponse.json(
        { success: false, error: 'Horário de fim deve ser após o horário de início' },
        { status: 400 }
      )
    }

    const { data: appointment, error } = await supabaseAdmin
      .from('fitness_appointments')
      .insert({
        patient_id: body.patient_id,
        professional_id: body.professional_id,
        appointment_type: appointmentType,
        meeting_link: body.meeting_link || null,
        date: body.date,
        start_time: body.start_time,
        end_time: body.end_time,
        location: body.location || null,
        notes: body.notes || null,
        status: 'scheduled',
        confirmed_by_patient: false,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar consulta:', error)
      return NextResponse.json({ success: false, error: 'Erro ao criar consulta' }, { status: 500 })
    }

    // Send notification to patient (async, don't block response)
    if (validatePushConfig()) {
      const { data: prof } = await supabaseAdmin
        .from('fitness_professionals')
        .select('display_name')
        .eq('id', body.professional_id)
        .single()

      const dateFormatted = new Date(body.date + 'T12:00:00').toLocaleDateString('pt-BR', {
        day: 'numeric', month: 'long',
      })
      const timeFormatted = body.start_time.slice(0, 5)
      const payload = notificationTemplates.consulta.agendada(
        prof?.display_name || 'Profissional',
        dateFormatted,
        timeFormatted
      )

      const { data: subs } = await supabaseAdmin
        .from('fitness_push_subscriptions')
        .select('*')
        .eq('user_id', body.patient_id)
        .eq('active', true)

      if (subs) {
        for (const sub of subs) {
          const pushSub: PushSubscription = {
            id: sub.id, userId: sub.user_id, endpoint: sub.endpoint,
            keys: { p256dh: sub.keys_p256dh, auth: sub.keys_auth },
            createdAt: new Date(sub.created_at), active: sub.active,
          }
          sendPushNotification(pushSub, payload).catch(() => {})
        }
      }
    }

    return NextResponse.json({ success: true, data: appointment }, { status: 201 })
  } catch (error) {
    console.error('Erro na API de consultas:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}
