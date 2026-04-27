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

// POST - Award bioimpedance points (superadmin only)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
    }

    const supabaseAdmin = getAdminClient()

    // Check superadmin
    const { data: profile } = await supabaseAdmin
      .from('fitness_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'super_admin') {
      return NextResponse.json({ success: false, error: 'Apenas super admin pode atribuir pontos de bioimpedancia' }, { status: 403 })
    }

    const body = await request.json()
    const { clientId, points, reason } = body

    if (!clientId || !points || !reason) {
      return NextResponse.json({ success: false, error: 'Campos obrigatorios faltando' }, { status: 400 })
    }

    if (points < 20 || points > 50) {
      return NextResponse.json({ success: false, error: 'Pontos devem estar entre 20 e 50' }, { status: 400 })
    }

    // Insert point transaction
    const { data: transaction, error: insertError } = await supabaseAdmin
      .from('fitness_point_transactions')
      .insert({
        user_id: clientId,
        points,
        reason: `Bioimpedancia: ${reason}`,
        category: 'bioimpedance',
        source: 'superadmin',
        awarded_by: user.id,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Erro ao atribuir pontos:', insertError)
      return NextResponse.json({ success: false, error: 'Erro ao atribuir pontos' }, { status: 500 })
    }

    // Atualiza ranking via RPC atômica (substitui o read-then-update,
    // que sofria de race condition em concessões concorrentes).
    // Bioimpedância só pontua em rankings globais → null.
    await supabaseAdmin.rpc('fitness_award_points_to_user', {
      p_user_id: clientId,
      p_delta: points,
      p_allowed_ranking_categories: null,
    })

    return NextResponse.json({
      success: true,
      transaction,
      message: `${points} pontos de bioimpedancia atribuidos`,
    })
  } catch (error) {
    console.error('Erro na API:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}
