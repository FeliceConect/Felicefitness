/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { awardPointsServer, POINT_VALUES, type PointAction } from '@/lib/services/points-server'

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// POST - Award automatic points for an action
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { action, reference_id } = body as { action?: PointAction; reference_id?: string }

    if (!action || !POINT_VALUES[action]) {
      return NextResponse.json(
        { success: false, error: 'Acao invalida' },
        { status: 400 }
      )
    }

    const result = await awardPointsServer(user.id, action, reference_id || undefined)

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }

    if (result.duplicate) {
      return NextResponse.json({ success: true, message: result.message, duplicate: true })
    }

    return NextResponse.json({
      success: true,
      transaction: result.transaction,
      points: result.points,
      message: result.message,
    })
  } catch (error) {
    console.error('Erro na API de pontos:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}

// GET - Get user's point summary and recent transactions
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
    }

    const supabaseAdmin = getAdminClient()
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')

    // Recent transactions
    const { data: transactions } = await supabaseAdmin
      .from('fitness_point_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    // Total points
    const { data: allPoints } = await supabaseAdmin
      .from('fitness_point_transactions')
      .select('points')
      .eq('user_id', user.id)

    const totalPoints = (allPoints || []).reduce((sum, p) => sum + p.points, 0)

    // Points today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const { data: todayPoints } = await supabaseAdmin
      .from('fitness_point_transactions')
      .select('points')
      .eq('user_id', user.id)
      .gte('created_at', today.toISOString())

    const todayTotal = (todayPoints || []).reduce((sum, p) => sum + p.points, 0)

    // Points this month
    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)
    const { data: monthPoints } = await supabaseAdmin
      .from('fitness_point_transactions')
      .select('points')
      .eq('user_id', user.id)
      .gte('created_at', monthStart.toISOString())

    const monthTotal = (monthPoints || []).reduce((sum, p) => sum + p.points, 0)

    return NextResponse.json({
      success: true,
      totalPoints,
      todayTotal,
      monthTotal,
      transactions: transactions || [],
    })
  } catch (error) {
    console.error('Erro na API de pontos:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}
