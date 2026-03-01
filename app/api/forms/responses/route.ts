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

// POST - Paciente envia respostas do formulário
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
    }

    const supabaseAdmin = getAdminClient()
    const body = await request.json()
    const { assignmentId, responses } = body

    if (!assignmentId || !responses || !Array.isArray(responses) || responses.length === 0) {
      return NextResponse.json(
        { success: false, error: 'assignmentId e responses são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar que o assignment pertence ao paciente e está pendente/em andamento
    const { data: assignment, error: assignError } = await supabaseAdmin
      .from('fitness_form_assignments')
      .select('id, status, template_id, professional_id')
      .eq('id', assignmentId)
      .eq('client_id', user.id)
      .single()

    if (assignError || !assignment) {
      return NextResponse.json({ success: false, error: 'Formulário não encontrado' }, { status: 404 })
    }

    if (assignment.status === 'completed') {
      return NextResponse.json({ success: false, error: 'Este formulário já foi preenchido' }, { status: 409 })
    }

    if (assignment.status === 'expired') {
      return NextResponse.json({ success: false, error: 'Este formulário expirou' }, { status: 410 })
    }

    // Buscar as perguntas do template para criar snapshots
    const questionIds = responses.map((r: { questionId: string }) => r.questionId)
    const { data: questions, error: questionsError } = await supabaseAdmin
      .from('fitness_form_questions')
      .select('*')
      .eq('template_id', assignment.template_id)
      .in('id', questionIds)

    if (questionsError || !questions) {
      return NextResponse.json({ success: false, error: 'Erro ao buscar perguntas' }, { status: 500 })
    }

    const questionMap = new Map(questions.map(q => [q.id, q]))

    // Validar perguntas obrigatórias
    const { data: allQuestions } = await supabaseAdmin
      .from('fitness_form_questions')
      .select('id, is_required, question_type')
      .eq('template_id', assignment.template_id)

    const requiredQuestions = (allQuestions || []).filter(
      q => q.is_required && q.question_type !== 'section_header'
    )
    const answeredIds = new Set(questionIds)
    const missing = requiredQuestions.filter(q => !answeredIds.has(q.id))

    if (missing.length > 0) {
      return NextResponse.json(
        { success: false, error: `${missing.length} pergunta(s) obrigatória(s) não respondida(s)` },
        { status: 400 }
      )
    }

    // Montar registros de resposta com snapshot da pergunta
    const responseRecords = responses
      .filter((r: { questionId: string }) => questionMap.has(r.questionId))
      .map((r: { questionId: string; value: unknown }) => ({
        assignment_id: assignmentId,
        question_id: r.questionId,
        question_snapshot: questionMap.get(r.questionId),
        response_value: r.value,
        responded_at: new Date().toISOString(),
      }))

    // Inserir respostas
    const { error: insertError } = await supabaseAdmin
      .from('fitness_form_responses')
      .insert(responseRecords)

    if (insertError) {
      console.error('Erro ao inserir respostas:', insertError)
      return NextResponse.json({ success: false, error: 'Erro ao salvar respostas' }, { status: 500 })
    }

    // Atualizar status do assignment para 'completed'
    const { error: updateError } = await supabaseAdmin
      .from('fitness_form_assignments')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', assignmentId)

    if (updateError) {
      console.error('Erro ao atualizar status:', updateError)
    }

    // Limpar rascunho se existir
    await supabaseAdmin
      .from('fitness_form_drafts')
      .delete()
      .eq('assignment_id', assignmentId)
      .eq('client_id', user.id)

    // Enviar push notification para o profissional
    if (validatePushConfig()) {
      try {
        // Buscar dados do profissional e template
        const { data: profData } = await supabaseAdmin
          .from('fitness_professionals')
          .select('user_id')
          .eq('id', assignment.professional_id)
          .single()

        const { data: templateData } = await supabaseAdmin
          .from('fitness_form_templates')
          .select('name')
          .eq('id', assignment.template_id)
          .single()

        const { data: clientProfile } = await supabaseAdmin
          .from('fitness_profiles')
          .select('nome')
          .eq('id', user.id)
          .single()

        if (profData?.user_id) {
          const formName = templateData?.name || 'Formulário'
          const clientName = clientProfile?.nome || 'Paciente'
          const payload = notificationTemplates.formulario.preenchido(formName, clientName)

          // Buscar subscriptions do profissional
          const { data: subs } = await supabaseAdmin
            .from('fitness_push_subscriptions')
            .select('*')
            .eq('user_id', profData.user_id)
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
              user_id: profData.user_id,
              type: 'formulario',
              title: payload.title,
              body: payload.body,
              sent_at: new Date().toISOString(),
            })
        }
      } catch (notifError) {
        console.error('Erro ao notificar profissional:', notifError)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Formulário enviado com sucesso!',
    })
  } catch (error) {
    console.error('Erro ao enviar respostas:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}
