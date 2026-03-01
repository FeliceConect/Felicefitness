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
      return NextResponse.json({ success: false, error: 'Nao autorizado' }, { status: 401 })
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

    // Update points in all active rankings for this user
    const { data: activeRankings } = await supabaseAdmin
      .from('fitness_rankings')
      .select('id')
      .eq('is_active', true)

    if (activeRankings) {
      for (const ranking of activeRankings) {
        const { data: participant } = await supabaseAdmin
          .from('fitness_ranking_participants')
          .select('total_points')
          .eq('ranking_id', ranking.id)
          .eq('user_id', clientId)
          .single()

        if (participant) {
          await supabaseAdmin
            .from('fitness_ranking_participants')
            .update({ total_points: (participant.total_points || 0) + points })
            .eq('ranking_id', ranking.id)
            .eq('user_id', clientId)
        } else {
          // Auto-join and award
          await supabaseAdmin
            .from('fitness_ranking_participants')
            .insert({
              ranking_id: ranking.id,
              user_id: clientId,
              total_points: points,
            })
        }
      }
    }

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
