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

// GET - Obter template com todas as perguntas
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
    const templateId = params.id

    // Buscar template
    const { data: template, error: templateError } = await supabaseAdmin
      .from('fitness_form_templates')
      .select('*')
      .eq('id', templateId)
      .single()

    if (templateError || !template) {
      return NextResponse.json({ success: false, error: 'Template não encontrado' }, { status: 404 })
    }

    // Verificar acesso: sistema (todos) ou do profissional
    if (!template.is_system_template) {
      const { data: professional } = await supabaseAdmin
        .from('fitness_professionals')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!professional || template.professional_id !== professional.id) {
        return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 })
      }
    }

    // Buscar perguntas ordenadas
    const { data: questions, error: questionsError } = await supabaseAdmin
      .from('fitness_form_questions')
      .select('*')
      .eq('template_id', templateId)
      .order('order_index', { ascending: true })

    if (questionsError) {
      console.error('Erro ao buscar perguntas:', questionsError)
      return NextResponse.json({ success: false, error: 'Erro ao buscar perguntas' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        ...template,
        questions: questions || [],
      }
    })
  } catch (error) {
    console.error('Erro na API de template:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}

// PATCH - Atualizar template customizado (nome, descrição, tipo e/ou substituir perguntas)
export async function PATCH(
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
    const templateId = params.id

    // Buscar template e validar ownership
    const { data: template, error: templateError } = await supabaseAdmin
      .from('fitness_form_templates')
      .select('id, professional_id, is_system_template')
      .eq('id', templateId)
      .single()

    if (templateError || !template) {
      return NextResponse.json({ success: false, error: 'Template não encontrado' }, { status: 404 })
    }

    if (template.is_system_template) {
      return NextResponse.json({ success: false, error: 'Templates do sistema não podem ser editados' }, { status: 403 })
    }

    const { data: professional } = await supabaseAdmin
      .from('fitness_professionals')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!professional || template.professional_id !== professional.id) {
      return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, form_type, questions } = body

    // Atualizar campos do template
    const updates: Record<string, unknown> = {}
    if (typeof name === 'string' && name.trim()) updates.name = name.trim()
    if (description !== undefined) updates.description = description?.trim() || null
    if (form_type) updates.form_type = form_type

    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabaseAdmin
        .from('fitness_form_templates')
        .update(updates)
        .eq('id', templateId)

      if (updateError) {
        console.error('Erro ao atualizar template:', updateError)
        return NextResponse.json({ success: false, error: 'Erro ao atualizar template' }, { status: 500 })
      }
    }

    // Substituir perguntas (se enviadas)
    if (Array.isArray(questions)) {
      if (questions.length === 0) {
        return NextResponse.json({ success: false, error: 'Adicione pelo menos uma pergunta' }, { status: 400 })
      }

      // Apagar perguntas existentes
      const { error: deleteQErr } = await supabaseAdmin
        .from('fitness_form_questions')
        .delete()
        .eq('template_id', templateId)

      if (deleteQErr) {
        console.error('Erro ao apagar perguntas antigas:', deleteQErr)
        return NextResponse.json({ success: false, error: 'Erro ao atualizar perguntas' }, { status: 500 })
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const questionsToInsert = questions.map((q: any, index: number) => ({
        template_id: templateId,
        question_text: q.question_text,
        question_type: q.question_type,
        options: q.options || null,
        config: q.config || {},
        is_required: q.is_required ?? false,
        order_index: index,
        section: q.section || null,
        conditional_on: null,
      }))

      const { error: insertQErr } = await supabaseAdmin
        .from('fitness_form_questions')
        .insert(questionsToInsert)

      if (insertQErr) {
        console.error('Erro ao inserir perguntas:', insertQErr)
        return NextResponse.json({ success: false, error: 'Erro ao salvar perguntas' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true, message: 'Template atualizado' })
  } catch (error) {
    console.error('Erro na API de template (PATCH):', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}

// DELETE - Remover template customizado (somente do próprio profissional)
export async function DELETE(
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
    const templateId = params.id

    const { data: template, error: templateError } = await supabaseAdmin
      .from('fitness_form_templates')
      .select('id, professional_id, is_system_template')
      .eq('id', templateId)
      .single()

    if (templateError || !template) {
      return NextResponse.json({ success: false, error: 'Template não encontrado' }, { status: 404 })
    }

    if (template.is_system_template) {
      return NextResponse.json({ success: false, error: 'Templates do sistema não podem ser removidos' }, { status: 403 })
    }

    const { data: professional } = await supabaseAdmin
      .from('fitness_professionals')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!professional || template.professional_id !== professional.id) {
      return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 })
    }

    // Bloquear se houver formulários enviados usando este template
    const { count: assignmentCount } = await supabaseAdmin
      .from('fitness_form_assignments')
      .select('id', { count: 'exact', head: true })
      .eq('template_id', templateId)

    if ((assignmentCount || 0) > 0) {
      return NextResponse.json({
        success: false,
        error: 'Não é possível remover: este template já foi enviado para pacientes.'
      }, { status: 409 })
    }

    // Apagar perguntas antes do template (FK)
    await supabaseAdmin
      .from('fitness_form_questions')
      .delete()
      .eq('template_id', templateId)

    const { error: deleteError } = await supabaseAdmin
      .from('fitness_form_templates')
      .delete()
      .eq('id', templateId)

    if (deleteError) {
      console.error('Erro ao deletar template:', deleteError)
      return NextResponse.json({ success: false, error: 'Erro ao remover template' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Template removido' })
  } catch (error) {
    console.error('Erro na API de template (DELETE):', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}
