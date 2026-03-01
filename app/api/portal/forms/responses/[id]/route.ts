/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// GET - Profissional visualiza respostas de um assignment específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
    }

    const supabaseAdmin = getAdminClient()
    const assignmentId = params.id

    // Verificar se é profissional
    const { data: professional } = await supabaseAdmin
      .from('fitness_professionals')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!professional) {
      return NextResponse.json({ success: false, error: 'Acesso restrito a profissionais' }, { status: 403 })
    }

    // Buscar assignment com dados do template e verificar propriedade
    const { data: assignment, error: assignError } = await supabaseAdmin
      .from('fitness_form_assignments')
      .select(`
        *,
        template:fitness_form_templates(id, name, description, specialty, form_type)
      `)
      .eq('id', assignmentId)
      .eq('professional_id', professional.id)
      .single()

    if (assignError || !assignment) {
      return NextResponse.json({ success: false, error: 'Formulário não encontrado' }, { status: 404 })
    }

    // Buscar dados do cliente
    const { data: client } = await supabaseAdmin
      .from('fitness_profiles')
      .select('id, nome, email')
      .eq('id', assignment.client_id)
      .single()

    // Buscar perguntas do template (ordenadas)
    const { data: questions } = await supabaseAdmin
      .from('fitness_form_questions')
      .select('*')
      .eq('template_id', assignment.template_id)
      .order('order_index', { ascending: true })

    // Buscar respostas do paciente
    const { data: responses } = await supabaseAdmin
      .from('fitness_form_responses')
      .select('*')
      .eq('assignment_id', assignmentId)

    // Organizar respostas por pergunta para fácil visualização
    const responseMap = new Map((responses || []).map(r => [r.question_id, r]))

    const organizedData = (questions || []).map(question => ({
      question: {
        id: question.id,
        text: question.question_text,
        type: question.question_type,
        options: question.options,
        config: question.config,
        section: question.section,
        is_required: question.is_required,
      },
      response: responseMap.get(question.id) || null,
    }))

    // Buscar rascunho (se existir, indica que paciente começou mas não terminou)
    let draft = null
    if (assignment.status !== 'completed') {
      const { data: draftData } = await supabaseAdmin
        .from('fitness_form_drafts')
        .select('current_step, updated_at')
        .eq('assignment_id', assignmentId)
        .single()
      draft = draftData
    }

    return NextResponse.json({
      success: true,
      data: {
        assignment: {
          ...assignment,
          client: client || { id: assignment.client_id, nome: 'Cliente', email: '' },
        },
        questions: organizedData,
        draft,
        summary: {
          totalQuestions: (questions || []).filter(q => q.question_type !== 'section_header').length,
          answeredQuestions: (responses || []).length,
          completedAt: assignment.completed_at,
        },
      },
    })
  } catch (error) {
    console.error('Erro ao buscar respostas:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}
