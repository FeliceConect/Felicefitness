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

// GET - Single note
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
    const { data: professional } = await supabaseAdmin
      .from('fitness_professionals')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (!professional) {
      return NextResponse.json({ success: false, error: 'Acesso restrito' }, { status: 403 })
    }

    const { data: note, error } = await supabaseAdmin
      .from('fitness_professional_notes')
      .select('*')
      .eq('id', params.id)
      .eq('professional_id', professional.id)
      .single()

    if (error || !note) {
      return NextResponse.json({ success: false, error: 'Nota nao encontrada' }, { status: 404 })
    }

    return NextResponse.json({ success: true, note })
  } catch (error) {
    console.error('Erro na API de notas:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}

// PATCH - Update note
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
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (!professional) {
      return NextResponse.json({ success: false, error: 'Acesso restrito' }, { status: 403 })
    }

    const body = await request.json()
    const updateFields: Record<string, unknown> = {}
    if (body.content !== undefined) updateFields.content = body.content
    if (body.note_type !== undefined) {
      const validTypes = ['observation', 'evolution', 'action_plan', 'alert', 'consultation']
      if (!validTypes.includes(body.note_type)) {
        return NextResponse.json(
          { success: false, error: 'Tipo de nota invalido. Use: observation, evolution, action_plan, alert' },
          { status: 400 }
        )
      }
      updateFields.note_type = body.note_type
    }

    const { data: note, error } = await supabaseAdmin
      .from('fitness_professional_notes')
      .update(updateFields)
      .eq('id', params.id)
      .eq('professional_id', professional.id)
      .select()
      .single()

    if (error || !note) {
      return NextResponse.json({ success: false, error: 'Nota nao encontrada' }, { status: 404 })
    }

    return NextResponse.json({ success: true, note })
  } catch (error) {
    console.error('Erro na API de notas:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}

// DELETE - Delete note
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
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (!professional) {
      return NextResponse.json({ success: false, error: 'Acesso restrito' }, { status: 403 })
    }

    const { error } = await supabaseAdmin
      .from('fitness_professional_notes')
      .delete()
      .eq('id', params.id)
      .eq('professional_id', professional.id)

    if (error) {
      console.error('Erro ao deletar nota:', error)
      return NextResponse.json({ success: false, error: 'Erro ao deletar nota' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Nota removida' })
  } catch (error) {
    console.error('Erro na API de notas:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}
