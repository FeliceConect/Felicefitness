/**
 * Notificação ao paciente quando uma nova bioimpedância é registrada pelo profissional.
 * Fire-and-forget. Inclui os pontos ganhos/perdidos.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { createClient as createAdminClient } from '@supabase/supabase-js'
import { sendPushNotification, validatePushConfig } from './push'
import type { NotificationPayload, PushSubscription } from '@/types/notifications'
import type { PointsBreakdown } from '@/lib/bioimpedance/points-calculator'

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function notifyBioimpedanceRegistered(
  patientId: string,
  recordId: string,
  breakdown: PointsBreakdown | null
): Promise<void> {
  try {
    if (!validatePushConfig()) return

    let body = 'Seu resultado já está disponível no app.'
    if (breakdown && breakdown.total !== 0) {
      const sign = breakdown.total > 0 ? '+' : ''
      body = `${sign}${breakdown.total} pts · ${breakdown.reason}`
    }

    const payload: NotificationPayload = {
      title: '📊 Nova avaliação registrada',
      body,
      type: 'bioimpedance_registered',
      url: '/corpo',
      priority: 'normal',
      tag: `bio-${recordId}`,
    }

    const db = getAdminClient()
    const { data: subscriptions } = await (db as any)
      .from('fitness_push_subscriptions')
      .select('*')
      .eq('user_id', patientId)
      .eq('active', true)

    if (subscriptions && subscriptions.length > 0) {
      await Promise.allSettled(
        subscriptions.map(async (sub: any) => {
          const subscription: PushSubscription = {
            id: sub.id,
            userId: sub.user_id,
            endpoint: sub.endpoint,
            keys: { p256dh: sub.keys_p256dh, auth: sub.keys_auth },
            createdAt: new Date(sub.created_at),
            active: sub.active,
          }
          const result = await sendPushNotification(subscription, payload)
          if (result.error === 'subscription_expired') {
            await (db as any)
              .from('fitness_push_subscriptions')
              .update({ active: false })
              .eq('id', sub.id)
          }
        })
      )
    }

    // Log no histórico (melhor-esforço)
    await (db as any)
      .from('fitness_notification_history')
      .insert({
        user_id: patientId,
        type: payload.type,
        title: payload.title,
        body: payload.body,
        sent_at: new Date().toISOString(),
      })
      .then(() => {}, () => {})
  } catch {
    // silent
  }
}
