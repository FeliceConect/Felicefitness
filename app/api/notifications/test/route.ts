import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendPushNotification, validatePushConfig } from '@/lib/notifications/push'
import { notificationTemplates } from '@/lib/notifications/templates'
import type { PushSubscription } from '@/types/notifications'

// NOTE: Table fitness_push_subscriptions needs to be created in Supabase.
// Using type assertions until types are generated.

export async function POST(request: NextRequest) {
  try {
    // Verificar configuração do VAPID
    if (!validatePushConfig()) {
      return NextResponse.json(
        { success: false, error: 'Push não configurado. Verifique as chaves VAPID.' },
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

    // Obter tipo de teste do request
    const body = await request.json()
    const { testType = 'boas_vindas' } = body

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any

    // Buscar uma subscription ativa do usuário
    const { data: subscriptions, error: subError } = await db
      .from('fitness_push_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('active', true)
      .limit(1)

    if (subError) {
      console.error('Erro ao buscar subscription:', subError)
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar subscription' },
        { status: 500 }
      )
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Nenhuma subscription ativa. Ative as notificações primeiro.'
      })
    }

    const sub = subscriptions[0]
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

    // Gerar payload baseado no tipo de teste
    let payload
    switch (testType) {
      case 'treino':
        payload = notificationTemplates.treino.lembrete('Treino de Força', 30)
        break
      case 'refeicao':
        payload = notificationTemplates.refeicao.lembrete('Almoço')
        break
      case 'agua':
        payload = notificationTemplates.agua.lembrete(4, 8)
        break
      case 'medicamento':
        payload = notificationTemplates.medicamento.lembrete('Medicamento', '09:00')
        break
      case 'conquista':
        payload = notificationTemplates.conquista.nova('Primeira Semana', 'Completou 7 dias de treino!')
        break
      case 'sono':
        payload = notificationTemplates.sono.horaDormir('22:00')
        break
      default:
        payload = notificationTemplates.sistema.boas_vindas('Leonardo')
    }

    // Enviar notificação de teste
    const result = await sendPushNotification(subscription, payload)

    if (!result.success) {
      // Se subscription expirou, desativar
      if (result.error === 'subscription_expired') {
        await db
          .from('fitness_push_subscriptions')
          .update({ active: false })
          .eq('id', sub.id)

        return NextResponse.json({
          success: false,
          error: 'Subscription expirada. Por favor, reative as notificações.'
        })
      }

      return NextResponse.json({
        success: false,
        error: result.error || 'Erro ao enviar notificação'
      })
    }

    // Atualizar last_used
    await db
      .from('fitness_push_subscriptions')
      .update({ last_used: new Date().toISOString() })
      .eq('id', sub.id)

    return NextResponse.json({
      success: true,
      message: 'Notificação de teste enviada com sucesso!',
      testType
    })

  } catch (error) {
    console.error('Erro no teste de notificação:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
