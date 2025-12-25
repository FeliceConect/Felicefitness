import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendPushNotification, validatePushConfig } from '@/lib/notifications/push'
import type { NotificationPayload, PushSubscription } from '@/types/notifications'

// NOTE: Tables need to be created in Supabase.
// Using type assertions until types are generated.

export async function POST(request: NextRequest) {
  try {
    // Verificar configuração do VAPID
    if (!validatePushConfig()) {
      return NextResponse.json(
        { success: false, error: 'Push não configurado' },
        { status: 500 }
      )
    }

    // Verificar autenticação
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Obter payload do request
    const body = await request.json()
    const { payload, targetUserId } = body as {
      payload: NotificationPayload
      targetUserId?: string
    }

    if (!payload || !payload.title || !payload.body) {
      return NextResponse.json(
        { success: false, error: 'Payload inválido' },
        { status: 400 }
      )
    }

    // Determinar usuário alvo (próprio usuário se não especificado)
    const userId = targetUserId || user.id

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any

    // Buscar subscriptions ativas do usuário
    const { data: subscriptions, error: subError } = await db
      .from('fitness_push_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('active', true)

    if (subError) {
      console.error('Erro ao buscar subscriptions:', subError)
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar subscriptions' },
        { status: 500 }
      )
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Nenhuma subscription ativa encontrada'
      })
    }

    // Enviar para todas as subscriptions
    const results = await Promise.allSettled(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      subscriptions.map(async (sub: any) => {
        const subscription: PushSubscription = {
          id: sub.id,
          userId: sub.user_id,
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.keys_p256dh,
            auth: sub.keys_auth
          },
          createdAt: new Date(sub.created_at),
          lastUsed: sub.last_used ? new Date(sub.last_used) : undefined,
          userAgent: sub.user_agent,
          active: sub.active
        }

        const result = await sendPushNotification(subscription, payload)

        // Se a subscription expirou, desativar
        if (result.error === 'subscription_expired') {
          await db
            .from('fitness_push_subscriptions')
            .update({ active: false })
            .eq('id', sub.id)
        } else if (result.success) {
          // Atualizar last_used
          await db
            .from('fitness_push_subscriptions')
            .update({ last_used: new Date().toISOString() })
            .eq('id', sub.id)
        }

        return { id: sub.id, ...result }
      })
    )

    // Salvar no histórico de notificações
    await db
      .from('fitness_notification_history')
      .insert({
        user_id: userId,
        type: payload.type,
        title: payload.title,
        body: payload.body,
        sent_at: new Date().toISOString()
      })

    // Contabilizar resultados
    const successful = results.filter(
      r => r.status === 'fulfilled' && r.value.success
    ).length
    const failed = results.length - successful

    return NextResponse.json({
      success: true,
      sent: successful,
      failed,
      total: subscriptions.length
    })

  } catch (error) {
    console.error('Erro ao enviar notificação:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
