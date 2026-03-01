import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { sendPushNotification, validatePushConfig } from '@/lib/notifications/push'
import { notificationTemplates } from '@/lib/notifications/templates'
import type { PushSubscription } from '@/types/notifications'

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

/**
 * Converts a UTC Date to America/Sao_Paulo date string (YYYY-MM-DD)
 */
function toBrazilDate(date: Date): string {
  return date.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
}

/**
 * Converts a UTC Date to America/Sao_Paulo time string (HH:MM)
 */
function toBrazilTime(date: Date): string {
  return date.toLocaleTimeString('en-GB', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

/**
 * Cron Job: Appointment Reminders + Auto Form Sending
 * Runs every hour via Vercel Cron
 *
 * Uses ics_data column to track which reminders have been sent (JSON: {r24h, r1h, r15m}).
 * All times are in America/Sao_Paulo.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!validatePushConfig()) {
    return NextResponse.json({ message: 'Push not configured, skipping' })
  }

  const supabase = getAdminClient()
  const now = new Date()
  const todayBR = toBrazilDate(now)
  const nowTimeBR = toBrazilTime(now)
  const nowMinutes = timeToMinutes(nowTimeBR)

  // Tomorrow in Brazil timezone
  const tomorrowDate = new Date(now)
  tomorrowDate.setDate(tomorrowDate.getDate() + 1)
  const tomorrowBR = toBrazilDate(tomorrowDate)

  const results = {
    reminders24h: 0,
    reminders1h: 0,
    reminders15min: 0,
    formsAssigned: 0,
    errors: [] as string[],
  }

  try {
    // Fetch all upcoming appointments (today + tomorrow) that haven't had all reminders sent
    const { data: allAppointments } = await supabase
      .from('fitness_appointments')
      .select('*')
      .in('date', [todayBR, tomorrowBR])
      .in('status', ['scheduled', 'confirmed'])

    if (!allAppointments || allAppointments.length === 0) {
      return NextResponse.json({ success: true, results, message: 'No upcoming appointments' })
    }

    for (const apt of allAppointments) {
      // Parse sent reminders from ics_data
      const sentReminders = parseSentReminders(apt.ics_data)
      const aptDate = apt.date as string
      const aptTime = (apt.start_time as string).slice(0, 5)

      try {
        // ============================
        // 24h Reminder — for tomorrow's appointments
        // ============================
        if (aptDate === tomorrowBR && !sentReminders.r24h) {
          const prof = await getProfessionalName(supabase, apt.professional_id)
          const payload = notificationTemplates.consulta.lembrete24h(prof, aptTime)
          await sendToUser(supabase, apt.patient_id, payload)
          sentReminders.r24h = true
          results.reminders24h++

          // Auto-assign form
          const assigned = await autoAssignForm(supabase, apt)
          if (assigned) results.formsAssigned++
        }

        // ============================
        // 1h Reminder — for today's appointments within 30-90 minutes
        // ============================
        if (aptDate === todayBR && !sentReminders.r1h) {
          const aptMinutes = timeToMinutes(aptTime)
          const diff = aptMinutes - nowMinutes

          if (diff > 0 && diff <= 90) {
            const prof = await getProfessionalName(supabase, apt.professional_id)
            const payload = notificationTemplates.consulta.lembrete1h(prof)
            await sendToUser(supabase, apt.patient_id, payload)
            sentReminders.r1h = true
            results.reminders1h++
          }
        }

        // ============================
        // 15min Reminder — for today's appointments within 5-30 minutes
        // ============================
        if (aptDate === todayBR && !sentReminders.r15m) {
          const aptMinutes = timeToMinutes(aptTime)
          const diff = aptMinutes - nowMinutes

          if (diff > 0 && diff <= 30) {
            const prof = await getProfessionalName(supabase, apt.professional_id)
            const link = apt.appointment_type === 'online' ? apt.meeting_link : undefined
            const payload = notificationTemplates.consulta.lembrete15min(prof, link || undefined)
            await sendToUser(supabase, apt.patient_id, payload)
            sentReminders.r15m = true
            results.reminders15min++
          }
        }

        // Update sent reminders in DB
        if (sentReminders.r24h || sentReminders.r1h || sentReminders.r15m) {
          await supabase
            .from('fitness_appointments')
            .update({ ics_data: JSON.stringify(sentReminders) })
            .eq('id', apt.id)
        }
      } catch (err) {
        results.errors.push(`Appointment ${apt.id}: ${err}`)
      }
    }
  } catch (error) {
    console.error('Cron appointment-reminders error:', error)
    return NextResponse.json({ success: false, error: 'Internal error', results }, { status: 500 })
  }

  return NextResponse.json({ success: true, results })
}

// ============================
// Helpers
// ============================

interface SentReminders {
  r24h: boolean
  r1h: boolean
  r15m: boolean
}

function parseSentReminders(icsData: string | null): SentReminders {
  if (!icsData) return { r24h: false, r1h: false, r15m: false }
  try {
    const parsed = JSON.parse(icsData)
    return {
      r24h: !!parsed.r24h,
      r1h: !!parsed.r1h,
      r15m: !!parsed.r15m,
    }
  } catch {
    return { r24h: false, r1h: false, r15m: false }
  }
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

async function getProfessionalName(
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

async function sendToUser(
  supabase: ReturnType<typeof getAdminClient>,
  userId: string,
  payload: ReturnType<typeof notificationTemplates.consulta.lembrete24h>
) {
  const { data: subscriptions } = await supabase
    .from('fitness_push_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('active', true)

  if (!subscriptions || subscriptions.length === 0) return

  for (const sub of subscriptions) {
    const pushSub: PushSubscription = {
      id: sub.id,
      userId: sub.user_id,
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.keys_p256dh,
        auth: sub.keys_auth,
      },
      createdAt: new Date(sub.created_at),
      active: sub.active,
    }
    const result = await sendPushNotification(pushSub, payload)

    // Clean up expired subscriptions
    if (!result.success && result.error === 'subscription_expired') {
      await supabase
        .from('fitness_push_subscriptions')
        .update({ active: false })
        .eq('id', sub.id)
    }
  }
}

/**
 * Auto-assign a pre-consultation form.
 * Only assigns if there isn't already a pending/in_progress form
 * created in the last 7 days for this patient-professional pair.
 */
async function autoAssignForm(
  supabase: ReturnType<typeof getAdminClient>,
  appointment: { id: string; patient_id: string; professional_id: string }
): Promise<boolean> {
  // Check if there's already a recent (last 7 days) pending form
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const { data: existingAssignment } = await supabase
    .from('fitness_form_assignments')
    .select('id')
    .eq('client_id', appointment.patient_id)
    .eq('professional_id', appointment.professional_id)
    .in('status', ['pending', 'in_progress'])
    .gte('created_at', sevenDaysAgo.toISOString())
    .limit(1)

  if (existingAssignment && existingAssignment.length > 0) return false

  // Check if first time with this professional
  const { data: pastAppointments } = await supabase
    .from('fitness_appointments')
    .select('id')
    .eq('patient_id', appointment.patient_id)
    .eq('professional_id', appointment.professional_id)
    .eq('status', 'completed')
    .limit(1)

  const isFirstTime = !pastAppointments || pastAppointments.length === 0

  const { data: professional } = await supabase
    .from('fitness_professionals')
    .select('id, type')
    .eq('id', appointment.professional_id)
    .single()

  if (!professional) return false

  const formType = isFirstTime ? 'initial_assessment' : 'weekly_checkin'

  const { data: template } = await supabase
    .from('fitness_form_templates')
    .select('id, version')
    .eq('specialty', professional.type)
    .eq('form_type', formType)
    .eq('is_active', true)
    .order('is_system_template', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!template) return false

  const { error } = await supabase
    .from('fitness_form_assignments')
    .insert({
      template_id: template.id,
      template_version: template.version,
      professional_id: appointment.professional_id,
      client_id: appointment.patient_id,
      status: 'pending',
      sent_at: new Date().toISOString(),
      reminder_sent: false,
    })

  if (error) {
    console.error('Error auto-assigning form:', error)
    return false
  }

  return true
}
