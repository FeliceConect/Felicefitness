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
