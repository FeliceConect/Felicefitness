/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { sendPushNotification, validatePushConfig } from '@/lib/notifications/push'
import { notificationTemplates } from '@/lib/notifications/templates'

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// POST - Enviar formulário para um ou mais clientes
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
    }

    const supabaseAdmin = getAdminClient()

    // Verificar se é profissional
    const { data: professional } = await supabaseAdmin
      .from('fitness_professionals')
      .select('id, type, display_name')
      .eq('user_id', user.id)
      .single()

    if (!professional) {
      return NextResponse.json({ success: false, error: 'Acesso restrito a profissionais' }, { status: 403 })
    }

    const body = await request.json()
    const { templateId, clientIds, dueDate, notes } = body

    if (!templateId || !clientIds || !Array.isArray(clientIds) || clientIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'templateId e clientIds são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se o template existe e pegar versão
    const { data: template, error: templateError } = await supabaseAdmin
      .from('fitness_form_templates')
      .select('id, name, version, specialty')
      .eq('id', templateId)
      .single()

    if (templateError || !template) {
      return NextResponse.json({ success: false, error: 'Template não encontrado' }, { status: 404 })
    }

    const { data: assignedClients } = await supabaseAdmin
      .from('fitness_client_assignments')
      .select('client_id')
      .eq('professional_id', professional.id)
      .in('client_id', clientIds)

    const validClientIds = (assignedClients || []).map(c => c.client_id)

    if (validClientIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Nenhum dos clientes informados pertence a este profissional' },
        { status: 400 }
      )
    }

    const assignments = validClientIds.map((clientId: string) => ({
      template_id: templateId,
      template_version: template.version,
      professional_id: professional.id,
      client_id: clientId,
      status: 'pending',
      due_date: dueDate || null,
      notes: notes || null,
    }))

    const { data: created, error: insertError } = await supabaseAdmin
      .from('fitness_form_assignments')
      .insert(assignments)
      .select()

    if (insertError) {
      console.error('Erro ao criar assignments:', insertError)
      return NextResponse.json(
        { success: false, error: 'Erro ao enviar formulários' },
        { status: 500 }
      )
    }

    // Enviar push notification para cada cliente
    if (validatePushConfig()) {
      const profName = professional.display_name || 'Seu profissional'
      const formName = template.name || 'Formulário'
      const payload = notificationTemplates.formulario.enviado(formName, profName)

      for (const clientId of validClientIds) {
        try {
          // Buscar subscriptions do cliente
          const { data: subs } = await supabaseAdmin
            .from('fitness_push_subscriptions')
            .select('*')
            .eq('user_id', clientId)
            .eq('active', true)

          if (subs && subs.length > 0) {
            for (const sub of subs) {
              await sendPushNotification(
                {
                  id: sub.id,
                  userId: sub.user_id,
                  endpoint: sub.endpoint,
                  keys: { p256dh: sub.keys_p256dh, auth: sub.keys_auth },
                  createdAt: new Date(sub.created_at),
                  active: true,
                },
                payload
              )
            }
          }

          // Salvar no histórico
          await supabaseAdmin
            .from('fitness_notification_history')
            .insert({
              user_id: clientId,
              type: 'formulario',
              title: payload.title,
              body: payload.body,
              sent_at: new Date().toISOString(),
            })
        } catch (notifError) {
          console.error('Erro ao enviar notificação para cliente:', clientId, notifError)
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: created,
      message: `Formulário enviado para ${created.length} cliente(s)`
    })
  } catch (error) {
    console.error('Erro ao enviar formulário:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}
