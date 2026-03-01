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

// GET - Paciente busca um assignment específico com perguntas para preenchimento
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

    // Buscar assignment verificando que pertence ao paciente
    const { data: assignment, error: assignError } = await supabaseAdmin
      .from('fitness_form_assignments')
      .select(`
        *,
        template:fitness_form_templates(id, name, description, specialty, form_type)
      `)
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

    // Buscar dados do profissional que enviou
    const { data: professional } = await supabaseAdmin
      .from('fitness_professionals')
      .select('id, display_name, type')
      .eq('id', assignment.professional_id)
      .single()

    // Buscar perguntas do template ordenadas
    const { data: questions, error: questionsError } = await supabaseAdmin
      .from('fitness_form_questions')
      .select('*')
      .eq('template_id', assignment.template_id)
      .order('order_index', { ascending: true })

    if (questionsError) {
      console.error('Erro ao buscar perguntas:', questionsError)
      return NextResponse.json({ success: false, error: 'Erro ao buscar perguntas' }, { status: 500 })
    }

    // Buscar rascunho existente
    const { data: draft } = await supabaseAdmin
      .from('fitness_form_drafts')
      .select('*')
      .eq('assignment_id', assignmentId)
      .eq('client_id', user.id)
      .single()

    // Agrupar perguntas por seção para o wizard
    const sections: { title: string; subtitle?: string; questions: typeof questions }[] = []
    let currentSection: typeof sections[0] | null = null

    for (const question of questions || []) {
      if (question.question_type === 'section_header') {
        currentSection = {
          title: question.question_text,
          subtitle: question.config?.subtitle || undefined,
          questions: [],
        }
        sections.push(currentSection)
      } else {
        if (!currentSection) {
          currentSection = {
            title: assignment.template?.name || 'Formulário',
            questions: [],
          }
          sections.push(currentSection)
        }
        currentSection.questions.push(question)
      }
    }

    // Se assignment era 'pending', marcar como 'in_progress'
    if (assignment.status === 'pending') {
      await supabaseAdmin
        .from('fitness_form_assignments')
        .update({
          status: 'in_progress',
          started_at: new Date().toISOString(),
        })
        .eq('id', assignmentId)
    }

    return NextResponse.json({
      success: true,
      data: {
        assignment: {
          ...assignment,
          professional: professional || null,
        },
        sections,
        questions: questions || [],
        draft: draft || null,
        totalQuestions: (questions || []).filter(q => q.question_type !== 'section_header').length,
      },
    })
  } catch (error) {
    console.error('Erro ao buscar formulário:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}
