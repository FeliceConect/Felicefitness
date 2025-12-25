import webpush from 'web-push'
import type { NotificationPayload, PushSubscription } from '@/types/notifications'

// Configure web-push with VAPID keys
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:felice@feliceconect.com.br'

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    vapidSubject,
    vapidPublicKey,
    vapidPrivateKey
  )
}

/**
 * Valida se as chaves VAPID estão configuradas
 */
export function validatePushConfig(): boolean {
  return !!(vapidPublicKey && vapidPrivateKey)
}

/**
 * Envia uma notificação push para uma subscription
 */
export async function sendPushNotification(
  subscription: PushSubscription,
  payload: NotificationPayload
): Promise<{ success: boolean; error?: string }> {
  if (!validatePushConfig()) {
    return { success: false, error: 'VAPID keys not configured' }
  }

  try {
    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth
      }
    }

    await webpush.sendNotification(
      pushSubscription,
      JSON.stringify(payload),
      {
        TTL: 60 * 60, // 1 hour
        urgency: mapPriorityToUrgency(payload.priority || 'normal')
      }
    )

    return { success: true }
  } catch (error) {
    console.error('Error sending push notification:', error)

    // Check if subscription is expired/invalid
    if (isSubscriptionError(error)) {
      return { success: false, error: 'subscription_expired' }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Envia notificação para múltiplas subscriptions
 */
export async function sendPushToMultiple(
  subscriptions: PushSubscription[],
  payload: NotificationPayload
): Promise<{
  successful: string[]
  failed: { id: string; error: string }[]
}> {
  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      const result = await sendPushNotification(sub, payload)
      return { id: sub.id, ...result }
    })
  )

  const successful: string[] = []
  const failed: { id: string; error: string }[] = []

  results.forEach((result, index) => {
    if (result.status === 'fulfilled' && result.value.success) {
      successful.push(subscriptions[index].id)
    } else {
      const error = result.status === 'rejected'
        ? result.reason?.message || 'Unknown error'
        : result.value.error || 'Unknown error'
      failed.push({ id: subscriptions[index].id, error })
    }
  })

  return { successful, failed }
}

/**
 * Mapeia prioridade para urgency do web-push
 */
function mapPriorityToUrgency(priority: string): 'very-low' | 'low' | 'normal' | 'high' {
  switch (priority) {
    case 'low': return 'low'
    case 'high': return 'high'
    case 'urgent': return 'high'
    default: return 'normal'
  }
}

/**
 * Verifica se o erro é de subscription inválida
 */
function isSubscriptionError(error: unknown): boolean {
  if (error && typeof error === 'object' && 'statusCode' in error) {
    const statusCode = (error as { statusCode: number }).statusCode
    return statusCode === 404 || statusCode === 410
  }
  return false
}

/**
 * Retorna a chave pública VAPID para uso no client
 */
export function getVapidPublicKey(): string | undefined {
  return vapidPublicKey
}
