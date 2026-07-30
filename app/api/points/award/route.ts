/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { getStartOfTodaySP, getMonthStartSP } from '@/lib/utils/date'

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// POST - DESATIVADO.
// Este endpoint creditava pontos a partir da AÇÃO enviada no corpo, sem
// reconferir que a ação aconteceu — qualquer paciente autenticado podia
// creditar streak_30 (50 pts), workout_completed (15 pts) etc. à vontade
// ("impressora de pontos"). Cada crédito agora vem do caminho que EXECUTA e
// VERIFICA o fato no servidor:
//   • água / refeição / sono → triggers no banco (20260429 + 20260730_2)
//   • treino / PR / cardio / streak → /api/points/award-workout-complete
//     (deriva tudo do banco) e trigger de streak (20260730_3)
//   • atividade avulsa → /api/activities (com cap diário)
//   • feed → rotas de feed
// Não há mais caminho genérico de crédito disparável pelo cliente.
export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: 'Endpoint desativado. Pontos são creditados automaticamente pela ação correspondente.',
    },
    { status: 410 }
  )
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

    // Points today — usa início do dia em SP (servidor é UTC, e new Date()
    // + setHours(0) retorna meia-noite UTC = 21h BRT do dia anterior)
    const { data: todayPoints } = await supabaseAdmin
      .from('fitness_point_transactions')
      .select('points')
      .eq('user_id', user.id)
      .gte('created_at', getStartOfTodaySP())

    const todayTotal = (todayPoints || []).reduce((sum, p) => sum + p.points, 0)

    // Points this month — primeiro dia do mês em SP
    const monthStartSP = `${getMonthStartSP()}T00:00:00-03:00`
    const { data: monthPoints } = await supabaseAdmin
      .from('fitness_point_transactions')
      .select('points')
      .eq('user_id', user.id)
      .gte('created_at', new Date(monthStartSP).toISOString())

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
