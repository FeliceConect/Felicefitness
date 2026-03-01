/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { SYSTEM_TEMPLATES } from '@/lib/forms/system-templates'

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// Função para popular templates do sistema no banco
async function seedSystemTemplates(supabaseAdmin: ReturnType<typeof getAdminClient>) {
  const results = []
  for (const template of SYSTEM_TEMPLATES) {
    const { data: insertedTemplate, error: templateError } = await supabaseAdmin
      .from('fitness_form_templates')
      .insert({
        professional_id: null,
        name: template.name,
        description: template.description,
        specialty: template.specialty,
        form_type: template.form_type,
        is_system_template: true,
        is_active: true,
        version: 1,
      })
      .select()
      .single()

    if (templateError) {
      console.error('Erro ao inserir template:', template.name, templateError)
      continue
    }

    const questions = template.questions.map(q => ({
      template_id: insertedTemplate.id,
      question_text: q.question_text,
      question_type: q.question_type,
      options: q.options || null,
      config: q.config || {},
      is_required: q.is_required,
      order_index: q.order_index,
      section: q.section,
      conditional_on: null,
    }))

    const { error: questionsError } = await supabaseAdmin
      .from('fitness_form_questions')
      .insert(questions)

    if (questionsError) {
      console.error('Erro ao inserir perguntas:', template.name, questionsError)
    }

    results.push({ name: template.name, id: insertedTemplate.id, questions: questions.length })
  }
  return results
}

// GET - Listar templates disponíveis (sistema + do profissional)
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const specialty = searchParams.get('specialty') || professional.type

    // Auto-seed: se não existem templates do sistema, criar automaticamente
    const { data: checkSystem, error: checkError } = await supabaseAdmin
      .from('fitness_form_templates')
      .select('id')
      .eq('is_system_template', true)
      .limit(1)

    if (!checkError && (!checkSystem || checkSystem.length === 0)) {
      console.log('Auto-seeding system templates...')
      const seeded = await seedSystemTemplates(supabaseAdmin)
      console.log(`Auto-seeded ${seeded.length} templates`)
    }

    // Buscar templates do sistema
    const { data: systemTemplates, error: sysError } = await supabaseAdmin
      .from('fitness_form_templates')
      .select('*, questions:fitness_form_questions(count)')
      .eq('is_system_template', true)
      .eq('specialty', specialty)
      .eq('is_active', true)
      .order('created_at', { ascending: true })

    if (sysError) {
      console.error('Erro ao buscar templates do sistema:', sysError)
    }

    // Buscar templates customizados do profissional
    const { data: customTemplates, error: custError } = await supabaseAdmin
      .from('fitness_form_templates')
      .select('*, questions:fitness_form_questions(count)')
      .eq('professional_id', professional.id)
      .eq('is_system_template', false)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (custError) {
      console.error('Erro ao buscar templates customizados:', custError)
    }

    return NextResponse.json({
      success: true,
      data: {
        system: systemTemplates || [],
        custom: customTemplates || [],
      }
    })
  } catch (error) {
    console.error('Erro na API de templates:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}

// POST - Forçar re-seed dos templates do sistema (para admin ou profissional)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function POST(_request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
    }

    const supabaseAdmin = getAdminClient()

    // Verificar se é profissional (qualquer profissional pode inicializar)
    const { data: professional } = await supabaseAdmin
      .from('fitness_professionals')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!professional) {
      return NextResponse.json({ success: false, error: 'Acesso restrito a profissionais' }, { status: 403 })
    }

    // Verificar se templates já existem
    const { data: existing } = await supabaseAdmin
      .from('fitness_form_templates')
      .select('id')
      .eq('is_system_template', true)
      .limit(1)

    if (existing && existing.length > 0) {
      return NextResponse.json({ success: false, error: 'Templates do sistema já existem' }, { status: 409 })
    }

    const results = await seedSystemTemplates(supabaseAdmin)

    return NextResponse.json({
      success: true,
      data: results,
      message: `${results.length} templates criados com sucesso`
    })
  } catch (error) {
    console.error('Erro ao criar templates:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}
