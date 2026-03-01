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

// GET - Points history for a client
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')
    if (!clientId) {
      return NextResponse.json({ success: false, error: 'clientId obrigatorio' }, { status: 400 })
    }

    const { data: points, error } = await supabaseAdmin
      .from('fitness_point_transactions')
      .select('*')
      .eq('user_id', clientId)
      .eq('awarded_by', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Erro ao buscar pontos:', error)
      return NextResponse.json({ success: false, error: 'Erro ao buscar pontos' }, { status: 500 })
    }

    // Total bonus points given by this professional
    const totalBonus = (points || []).reduce((sum, p) => sum + p.points, 0)

    return NextResponse.json({ success: true, points: points || [], totalBonus })
  } catch (error) {
    console.error('Erro na API de pontos:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}

// POST - Award bonus points
export async function POST(request: NextRequest) {
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

    if (!professional) {
      return NextResponse.json({ success: false, error: 'Acesso restrito' }, { status: 403 })
    }

    const body = await request.json()
    const { clientId, points, reason } = body

    if (!clientId || !points || !reason) {
      return NextResponse.json(
        { success: false, error: 'clientId, points e reason sao obrigatorios' },
        { status: 400 }
      )
    }

    if (points < 5 || points > 50) {
      return NextResponse.json(
        { success: false, error: 'Pontos devem estar entre 5 e 50' },
        { status: 400 }
      )
    }

    // Verify client is assigned
    const { data: assignment } = await supabaseAdmin
      .from('fitness_client_assignments')
      .select('id')
      .eq('professional_id', professional.id)
      .eq('client_id', clientId)
      .eq('is_active', true)
      .limit(1)
      .single()

    if (!assignment) {
      return NextResponse.json(
        { success: false, error: 'Paciente nao esta vinculado a voce' },
        { status: 403 }
      )
    }

    const { data: transaction, error: insertError } = await supabaseAdmin
      .from('fitness_point_transactions')
      .insert({
        user_id: clientId,
        points,
        reason,
        category: 'bonus',
        source: 'professional',
        awarded_by: user.id,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Erro ao atribuir pontos:', insertError)
      return NextResponse.json({ success: false, error: 'Erro ao atribuir pontos' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      transaction,
      message: `${points} pontos atribuidos com sucesso`,
    })
  } catch (error) {
    console.error('Erro na API de pontos:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}
