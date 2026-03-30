/**
 * Social Notifications — Server-side helpers
 *
 * Send push notifications when someone reacts to or comments on a post.
 * Professional users (nutri, trainer, coach, super_admin) get special treatment.
 */

import { createClient as createAdminClient } from '@supabase/supabase-js'
import { sendPushNotification, validatePushConfig } from './push'
import type { NotificationPayload, PushSubscription } from '@/types/notifications'

const PROFESSIONAL_ROLES = ['super_admin', 'admin', 'nutritionist', 'trainer', 'coach']

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Admin',
  admin: 'Admin',
  nutritionist: 'Nutricionista',
  trainer: 'Personal',
  coach: 'Coach',
}

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

/** Get display name and role for a user */
async function getUserInfo(userId: string) {
  const db = getAdminClient()
  const { data } = await db
    .from('fitness_profiles')
    .select('nome, display_name, apelido_ranking, role')
    .eq('id', userId)
    .single()

  if (!data) return null

  const displayName = data.display_name || data.apelido_ranking || data.nome?.split(' ')[0] || 'Alguém'
  const role = data.role || 'client'
  const isProfessional = PROFESSIONAL_ROLES.includes(role)
  const roleLabel = ROLE_LABELS[role] || ''

  return { displayName, role, isProfessional, roleLabel }
}

/** Send push notification to a target user (fire-and-forget, never throws) */
async function sendToUser(targetUserId: string, payload: NotificationPayload): Promise<void> {
  try {
    if (!validatePushConfig()) return

    const db = getAdminClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: subscriptions } = await (db as any)
      .from('fitness_push_subscriptions')
      .select('*')
      .eq('user_id', targetUserId)
      .eq('active', true)

    if (!subscriptions || subscriptions.length === 0) return

    // Send to all active subscriptions
    await Promise.allSettled(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (db as any)
            .from('fitness_push_subscriptions')
            .update({ active: false })
            .eq('id', sub.id)
        }
      })
    )

    // Log to notification history
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db as any)
      .from('fitness_notification_history')
      .insert({
        user_id: targetUserId,
        type: payload.type,
        title: payload.title,
        body: payload.body,
        sent_at: new Date().toISOString(),
      })
  } catch (err) {
    console.error('Social notification error:', err)
  }
}

const REACTION_EMOJIS: Record<string, string> = {
  fire: '🔥',
  heart: '❤️',
  strength: '💪',
  clap: '👏',
  star: '⭐',
}

/** Notify post author that someone reacted to their post */
export async function notifyReaction(
  postAuthorId: string,
  reactorId: string,
  reactionType: string,
): Promise<void> {
  // Don't notify yourself
  if (postAuthorId === reactorId) return

  const userInfo = await getUserInfo(reactorId)
  if (!userInfo) return

  const emoji = REACTION_EMOJIS[reactionType] || '👍'
  const prefix = userInfo.isProfessional ? `${userInfo.roleLabel} ` : ''

  await sendToUser(postAuthorId, {
    title: `${emoji} Nova reação`,
    body: `${prefix}${userInfo.displayName} reagiu ao seu post`,
    type: 'feed_reaction',
    url: '/feed',
    tag: `reaction-${postAuthorId}`,
    data: {
      reactorId,
      reactionType,
      isProfessional: userInfo.isProfessional,
      role: userInfo.role,
    },
  })
}

/** Notify post author that someone commented on their post */
export async function notifyComment(
  postAuthorId: string,
  commenterId: string,
  commentPreview: string,
): Promise<void> {
  // Don't notify yourself
  if (postAuthorId === commenterId) return

  const userInfo = await getUserInfo(commenterId)
  if (!userInfo) return

  const prefix = userInfo.isProfessional ? `${userInfo.roleLabel} ` : ''
  const preview = commentPreview.length > 60 ? commentPreview.slice(0, 57) + '...' : commentPreview

  await sendToUser(postAuthorId, {
    title: '💬 Novo comentário',
    body: `${prefix}${userInfo.displayName}: ${preview}`,
    type: 'feed_comment',
    url: '/feed',
    tag: `comment-${postAuthorId}`,
    data: {
      commenterId,
      isProfessional: userInfo.isProfessional,
      role: userInfo.role,
    },
  })
}

const POST_TYPE_LABELS: Record<string, string> = {
  free_text: 'publicou no feed',
  workout: 'compartilhou um treino',
  meal: 'compartilhou uma refeição',
  achievement: 'desbloqueou uma conquista',
  check_in: 'fez um check-in',
  level_up: 'subiu de nível',
}

/** Notify all other users that someone posted in the feed (fire-and-forget) */
export async function notifyNewPost(
  authorId: string,
  postType: string,
): Promise<void> {
  try {
    if (!validatePushConfig()) return

    const userInfo = await getUserInfo(authorId)
    if (!userInfo) return

    const db = getAdminClient()

    // Get all distinct user IDs with active push subscriptions (except the author)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: subscriptions } = await (db as any)
      .from('fitness_push_subscriptions')
      .select('user_id')
      .neq('user_id', authorId)
      .eq('active', true)

    if (!subscriptions || subscriptions.length === 0) return

    // Deduplicate user IDs
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userIds = Array.from(new Set((subscriptions as any[]).map((s: any) => s.user_id)))

    const prefix = userInfo.isProfessional ? `${userInfo.roleLabel} ` : ''
    const action = POST_TYPE_LABELS[postType] || 'publicou no feed'
    const emoji = userInfo.isProfessional ? '⭐' : '📣'

    const payload = {
      title: `${emoji} Nova atividade no Feed`,
      body: `${prefix}${userInfo.displayName} ${action}`,
      type: 'feed_new_post' as const,
      url: '/feed',
      tag: 'feed-new-post',
      data: {
        authorId,
        postType,
        isProfessional: userInfo.isProfessional,
        role: userInfo.role,
      },
    }

    // Send to each user via sendToUser (handles subscription lookup + history)
    await Promise.allSettled(
      userIds.map((userId: string) => sendToUser(userId, payload))
    )
  } catch (err) {
    console.error('Notify new post error:', err)
  }
}

/** Notify user their streak is at risk (no activity today) — called from cron */
export async function notifyStreakRisk(userId: string, currentStreak: number): Promise<void> {
  await sendToUser(userId, {
    title: '🔥 Seu streak está em risco!',
    body: `Você tem ${currentStreak} dias de streak. Faça uma atividade hoje para manter!`,
    type: 'streak_risk',
    url: '/dashboard',
    priority: 'high',
    tag: `streak-risk-${userId}`,
    actions: [
      { action: 'checkin', title: 'Fazer Check-in' },
      { action: 'treinar', title: 'Treinar' },
    ],
  })
}
