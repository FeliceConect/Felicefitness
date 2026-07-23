import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { validatePushConfig, sendPushToMultiple } from '@/lib/notifications/push'
import type { PushSubscription } from '@/types/notifications'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAny = any

// Loop sequencial de N pacientes (RPC + insert cada) — dá folga para redes
// grandes de pacientes sem estourar o tempo padrão da function.
export const maxDuration = 60

const MAX_LEN = 2000

/**
 * POST /api/chat/broadcast
 * Envia UMA mensagem para TODOS os pacientes ativos do profissional logado.
 * Cria/reusa a conversa 1:1 de cada paciente e insere a mensagem (o trigger
 * de unread/last_message dispara normalmente), registra o envio em
 * fitness_broadcast_messages para auditoria e notifica via push.
 *
 * Body: { content: string }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
    }

    const { content } = await request.json()
    const text = typeof content === 'string' ? content.trim() : ''
    if (!text) {
      return NextResponse.json({ success: false, error: 'Mensagem vazia' }, { status: 400 })
    }
    if (text.length > MAX_LEN) {
      return NextResponse.json(
        { success: false, error: `Mensagem muito longa (máx ${MAX_LEN} caracteres)` },
        { status: 400 }
      )
    }

    const admin: SupabaseAny = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Quem é o profissional (precisa estar ativo)
    const { data: professional, error: profError } = await admin
      .from('fitness_professionals')
      .select('id, is_active')
      .eq('user_id', user.id)
      .single()

    if (profError || !professional) {
      return NextResponse.json({ success: false, error: 'Você não é um profissional' }, { status: 403 })
    }
    if (professional.is_active === false) {
      return NextResponse.json({ success: false, error: 'Seu acesso de profissional está inativo' }, { status: 403 })
    }

    // Pacientes ativos vinculados a este profissional
    const { data: assignments } = await admin
      .from('fitness_client_assignments')
      .select('client_id')
      .eq('professional_id', professional.id)
      .eq('is_active', true)

    const clientIds = Array.from(new Set((assignments || []).map((a: SupabaseAny) => a.client_id)))
    if (clientIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Você não tem pacientes ativos para enviar a mensagem' },
        { status: 400 }
      )
    }

    // Registro do broadcast (auditoria). Best-effort — não bloqueia o envio.
    let broadcastId: string | null = null
    try {
      const { data: broadcastRow } = await admin
        .from('fitness_broadcast_messages')
        .insert({
          sender_id: user.id,
          title: 'Mensagem do profissional',
          content: text,
          message_type: 'announcement',
          channels: ['push', 'inbox'],
          recipient_count: clientIds.length,
          status: 'sent',
          sent_at: new Date().toISOString(),
        })
        .select('id')
        .single()
      broadcastId = broadcastRow?.id ?? null
    } catch {
      // tabela/coluna divergente — segue sem auditoria
    }

    // Para cada paciente: garante a conversa e insere a mensagem.
    // Processado em lotes concorrentes para não escalar linearmente o tempo
    // (loop puramente sequencial estouraria em redes grandes de pacientes).
    const failed: string[] = []
    const recipientUserIds: string[] = []
    const BATCH = 8

    const deliverOne = async (clientId: string) => {
      const { data: conversationId, error: convError } = await admin.rpc('get_or_create_conversation', {
        p_client_id: clientId,
        p_professional_id: professional.id,
      })
      if (convError || !conversationId) throw convError || new Error('sem conversa')

      const { error: msgError } = await admin
        .from('fitness_messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          sender_type: 'professional',
          content: text,
          message_type: 'text',
          metadata: broadcastId ? { broadcast_id: broadcastId } : null,
        })
      if (msgError) throw msgError
    }

    for (let i = 0; i < clientIds.length; i += BATCH) {
      const chunk = clientIds.slice(i, i + BATCH) as string[]
      const results = await Promise.allSettled(chunk.map(deliverOne))
      results.forEach((r, idx) => {
        if (r.status === 'fulfilled') {
          recipientUserIds.push(chunk[idx])
        } else {
          console.error('Broadcast: falha para paciente', chunk[idx], r.reason)
          failed.push(chunk[idx])
        }
      })
    }

    const sent = recipientUserIds.length

    // Registra os destinatários entregues e ajusta o recipient_count real
    // (o insert inicial usou o total tentado). Best-effort.
    if (broadcastId && recipientUserIds.length > 0) {
      await admin
        .from('fitness_broadcast_recipients')
        .insert(recipientUserIds.map((uid) => ({ broadcast_id: broadcastId, user_id: uid })))
        .then(() => {}, () => {})
      await admin
        .from('fitness_broadcast_messages')
        .update({ recipient_count: sent })
        .eq('id', broadcastId)
        .then(() => {}, () => {})
    }

    // Nenhuma mensagem entregue → sinaliza erro (não "enviado para 0")
    if (sent === 0) {
      return NextResponse.json(
        { success: false, error: 'Não foi possível entregar a mensagem a nenhum paciente' },
        { status: 502 }
      )
    }

    // Push em lote. Awaited (Next 14 não tem `after()`): sem await, a function
    // serverless pode congelar antes do envio. sendPushToMultiple paraleliza
    // internamente e nunca lança, então o custo é baixo.
    if (validatePushConfig() && recipientUserIds.length > 0) {
      try {
        const { data: subs } = await admin
          .from('fitness_push_subscriptions')
          .select('*')
          .in('user_id', recipientUserIds)
          .eq('active', true)
        if (subs && subs.length > 0) {
          const subscriptions: PushSubscription[] = subs.map((sub: SupabaseAny) => ({
            id: sub.id,
            userId: sub.user_id,
            endpoint: sub.endpoint,
            keys: { p256dh: sub.keys_p256dh, auth: sub.keys_auth },
            createdAt: new Date(sub.created_at),
            active: true,
          }))
          await sendPushToMultiple(subscriptions, {
            title: 'Nova mensagem',
            body: text.substring(0, 100),
            type: 'chat_message',
            url: '/chat',
          })
        }
      } catch (err) {
        console.error('Broadcast push falhou:', err)
      }
    }

    return NextResponse.json({
      success: true,
      sent,
      failed: failed.length,
      total: clientIds.length,
    })
  } catch (error) {
    console.error('Erro no broadcast:', error)
    return NextResponse.json({ success: false, error: 'Erro ao enviar mensagem em massa' }, { status: 500 })
  }
}
