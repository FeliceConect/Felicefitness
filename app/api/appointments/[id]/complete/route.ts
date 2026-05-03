import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
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

// POST - Profissional marca consulta como realizada
// Sem pontuação: presença em consulta é compulsória do programa
// e não deve impactar o ranking (decidido em 2026-05-01).
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

    // Verificar se é profissional ou admin
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

      // Consultas de serviço só podem ser concluídas pelo admin
      if (!appointment.professional_id) {
        return NextResponse.json({ success: false, error: 'Sem permissão' }, { status: 403 })
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

    // Buscar consulta
    const { data: appointment, error: fetchError } = await supabaseAdmin
      .from('fitness_appointments')
      .select('id, patient_id, status')
      .eq('id', id)
      .single()

    if (fetchError || !appointment) {
      return NextResponse.json({ success: false, error: 'Consulta não encontrada' }, { status: 404 })
    }

    if (!['scheduled', 'confirmed'].includes(appointment.status)) {
      return NextResponse.json(
        { success: false, error: 'Consulta não pode ser marcada como realizada com o status atual' },
        { status: 400 }
      )
    }

    // Marcar como realizada (only if still in schedulable status to prevent race condition)
    const { data: updated, error } = await supabaseAdmin
      .from('fitness_appointments')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .in('status', ['scheduled', 'confirmed'])
      .select()
      .single()

    if (error) {
      console.error('Erro ao completar consulta:', error)
      return NextResponse.json({ success: false, error: 'Consulta já foi completada ou não pode ser alterada' }, { status: 409 })
    }

    // Notifica o paciente sobre a presença confirmada (sem menção a pts)
    if (validatePushConfig()) {
      const prof = await getProfessionalNameForNotification(supabaseAdmin, updated.professional_id)
      const payload = notificationTemplates.consulta.realizada(prof)
      sendNotificationToUser(supabaseAdmin, appointment.patient_id, payload).catch(() => {})
    }

    return NextResponse.json({
      success: true,
      data: updated,
    })
  } catch (error) {
    console.error('Erro na API de completar consulta:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}

async function getProfessionalNameForNotification(
  supabase: ReturnType<typeof getAdminClient>,
  professionalId: string
): Promise<string> {
  const { data } = await supabase
    .from('fitness_professionals')
    .select('display_name')
    .eq('id', professionalId)
    .single()
  return data?.display_name || 'Profissional'
}

async function sendNotificationToUser(
  supabase: ReturnType<typeof getAdminClient>,
  userId: string,
  payload: ReturnType<typeof notificationTemplates.consulta.realizada>
) {
  const { data: subs } = await supabase
    .from('fitness_push_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('active', true)

  if (!subs) return
  for (const sub of subs) {
    const pushSub: PushSubscription = {
      id: sub.id, userId: sub.user_id, endpoint: sub.endpoint,
      keys: { p256dh: sub.keys_p256dh, auth: sub.keys_auth },
      createdAt: new Date(sub.created_at), active: sub.active,
    }
    await sendPushNotification(pushSub, payload)
  }
}
