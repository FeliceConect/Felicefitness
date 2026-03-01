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

// POST - Criar template customizado com perguntas
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
      .select('id, type')
      .eq('user_id', user.id)
      .single()

    if (!professional) {
      return NextResponse.json({ success: false, error: 'Acesso restrito a profissionais' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, form_type, questions } = body

    // Validações
    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: 'Nome do template é obrigatório' }, { status: 400 })
    }

    if (!form_type) {
      return NextResponse.json({ success: false, error: 'Tipo do formulário é obrigatório' }, { status: 400 })
    }

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ success: false, error: 'Adicione pelo menos uma pergunta' }, { status: 400 })
    }

    // Criar o template
    const { data: template, error: templateError } = await supabaseAdmin
      .from('fitness_form_templates')
      .insert({
        professional_id: professional.id,
        name: name.trim(),
        description: description?.trim() || null,
        specialty: professional.type,
        form_type,
        is_system_template: false,
        is_active: true,
        version: 1,
      })
      .select()
      .single()

    if (templateError) {
      console.error('Erro ao criar template:', templateError)
      return NextResponse.json({ success: false, error: 'Erro ao criar template' }, { status: 500 })
    }

    // Inserir perguntas
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const questionsToInsert = questions.map((q: any, index: number) => ({
      template_id: template.id,
      question_text: q.question_text,
      question_type: q.question_type,
      options: q.options || null,
      config: q.config || {},
      is_required: q.is_required ?? false,
      order_index: index,
      section: q.section || null,
      conditional_on: null,
    }))

    const { error: questionsError } = await supabaseAdmin
      .from('fitness_form_questions')
      .insert(questionsToInsert)

    if (questionsError) {
      console.error('Erro ao inserir perguntas:', questionsError)
      // Rollback: deletar template sem perguntas
      await supabaseAdmin.from('fitness_form_templates').delete().eq('id', template.id)
      return NextResponse.json({ success: false, error: 'Erro ao salvar perguntas' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: { ...template, question_count: questionsToInsert.length },
      message: `Template "${name}" criado com ${questionsToInsert.length} perguntas`
    })
  } catch (error) {
    console.error('Erro ao criar template customizado:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}
