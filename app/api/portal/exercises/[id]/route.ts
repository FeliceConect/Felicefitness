/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { getYouTubeThumbnail } from '@/lib/utils/youtube'

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// GET - Single exercise
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Nao autorizado' }, { status: 401 })
    }

    const supabaseAdmin = getAdminClient()
    const { data: exercise, error } = await supabaseAdmin
      .from('fitness_exercises_library')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error || !exercise) {
      return NextResponse.json({ success: false, error: 'Exercicio nao encontrado' }, { status: 404 })
    }

    return NextResponse.json({ success: true, exercise })
  } catch (error) {
    console.error('Erro na API de exercicios:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}

// PATCH - Update exercise (trainers only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Nao autorizado' }, { status: 401 })
    }

    const supabaseAdmin = getAdminClient()
    const { data: professional } = await supabaseAdmin
      .from('fitness_professionals')
      .select('id, type')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (!professional || professional.type !== 'trainer') {
      return NextResponse.json({ success: false, error: 'Acesso restrito' }, { status: 403 })
    }

    const body = await request.json()
    const updateFields: Record<string, unknown> = {}
    if (body.nome !== undefined) updateFields.nome = body.nome
    if (body.nome_en !== undefined) updateFields.nome_en = body.nome_en
    if (body.grupo_muscular !== undefined) updateFields.grupo_muscular = body.grupo_muscular
    if (body.musculos_secundarios !== undefined) updateFields.musculos_secundarios = body.musculos_secundarios
    if (body.equipamento !== undefined) updateFields.equipamento = body.equipamento
    if (body.tipo !== undefined) updateFields.tipo = body.tipo
    if (body.instructions !== undefined) updateFields.instrucoes = body.instructions
    if (body.dificuldade !== undefined) updateFields.dificuldade = body.dificuldade
    if (body.is_composto !== undefined) updateFields.is_composto = body.is_composto

    if (body.video_url !== undefined) {
      updateFields.video_url = body.video_url || null
      updateFields.video_thumbnail = body.video_url ? getYouTubeThumbnail(body.video_url) : null
    }

    const { data: exercise, error } = await supabaseAdmin
      .from('fitness_exercises_library')
      .update(updateFields)
      .eq('id', params.id)
      .select()
      .single()

    if (error || !exercise) {
      return NextResponse.json({ success: false, error: 'Exercicio nao encontrado' }, { status: 404 })
    }

    return NextResponse.json({ success: true, exercise })
  } catch (error) {
    console.error('Erro na API de exercicios:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}

// DELETE - Delete exercise (trainers only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Nao autorizado' }, { status: 401 })
    }

    const supabaseAdmin = getAdminClient()
    const { data: professional } = await supabaseAdmin
      .from('fitness_professionals')
      .select('id, type')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (!professional || professional.type !== 'trainer') {
      return NextResponse.json({ success: false, error: 'Acesso restrito' }, { status: 403 })
    }

    const { error } = await supabaseAdmin
      .from('fitness_exercises_library')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Erro ao deletar exercicio:', error)
      return NextResponse.json({ success: false, error: 'Erro ao deletar' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Exercicio removido' })
  } catch (error) {
    console.error('Erro na API de exercicios:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}
