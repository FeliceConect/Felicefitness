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

// GET - Buscar rascunho de um assignment específico
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
    }

    const supabaseAdmin = getAdminClient()
    const { searchParams } = new URL(request.url)
    const assignmentId = searchParams.get('assignmentId')

    if (!assignmentId) {
      return NextResponse.json({ success: false, error: 'assignmentId é obrigatório' }, { status: 400 })
    }

    // Verificar que o assignment pertence ao paciente
    const { data: assignment } = await supabaseAdmin
      .from('fitness_form_assignments')
      .select('id')
      .eq('id', assignmentId)
      .eq('client_id', user.id)
      .single()

    if (!assignment) {
      return NextResponse.json({ success: false, error: 'Formulário não encontrado' }, { status: 404 })
    }

    // Buscar rascunho
    const { data: draft, error } = await supabaseAdmin
      .from('fitness_form_drafts')
      .select('*')
      .eq('assignment_id', assignmentId)
      .eq('client_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Erro ao buscar rascunho:', error)
      return NextResponse.json({ success: false, error: 'Erro ao buscar rascunho' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: draft || null,
    })
  } catch (error) {
    console.error('Erro na API de rascunhos:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}

// POST - Criar ou atualizar rascunho (auto-save)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
    }

    const supabaseAdmin = getAdminClient()
    const body = await request.json()
    const { assignmentId, draftData, currentStep } = body

    if (!assignmentId || draftData === undefined) {
      return NextResponse.json(
        { success: false, error: 'assignmentId e draftData são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar que o assignment pertence ao paciente e está aberto
    const { data: assignment } = await supabaseAdmin
      .from('fitness_form_assignments')
      .select('id, status')
      .eq('id', assignmentId)
      .eq('client_id', user.id)
      .single()

    if (!assignment) {
      return NextResponse.json({ success: false, error: 'Formulário não encontrado' }, { status: 404 })
    }

    if (assignment.status === 'completed') {
      return NextResponse.json({ success: false, error: 'Formulário já foi enviado' }, { status: 409 })
    }

    // Upsert do rascunho (usa UNIQUE constraint de assignment_id + client_id)
    const { data: draft, error: upsertError } = await supabaseAdmin
      .from('fitness_form_drafts')
      .upsert(
        {
          assignment_id: assignmentId,
          client_id: user.id,
          draft_data: draftData,
          current_step: currentStep || 0,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'assignment_id,client_id' }
      )
      .select()
      .single()

    if (upsertError) {
      console.error('Erro ao salvar rascunho:', upsertError)
      return NextResponse.json({ success: false, error: 'Erro ao salvar rascunho' }, { status: 500 })
    }

    // Se o assignment estava 'pending', atualizar para 'in_progress'
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
      data: draft,
    })
  } catch (error) {
    console.error('Erro ao salvar rascunho:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}
