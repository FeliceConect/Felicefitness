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

// Point values per action
const POINT_VALUES: Record<string, { points: number; category: string; reason: string }> = {
  workout_completed: { points: 15, category: 'workout', reason: 'Treino completo' },
  all_meals_logged: { points: 10, category: 'nutrition', reason: 'Todas refeicoes registradas' },
  water_goal_met: { points: 5, category: 'hydration', reason: 'Meta de agua atingida' },
  sleep_logged: { points: 3, category: 'sleep', reason: 'Sono registrado' },
  wellness_checkin: { points: 3, category: 'wellness', reason: 'Check-in de bem-estar' },
  pr_achieved: { points: 10, category: 'workout', reason: 'Personal Record' },
  post_created: { points: 2, category: 'social', reason: 'Post no feed' },
  comment_or_reaction: { points: 1, category: 'social', reason: 'Interacao no feed' },
  form_completed: { points: 5, category: 'form_completion', reason: 'Formulario preenchido' },
  streak_7: { points: 15, category: 'consistency', reason: 'Streak de 7 dias consecutivos' },
  streak_30: { points: 50, category: 'consistency', reason: 'Streak de 30 dias consecutivos' },
}

// POST - Award automatic points for an action
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Nao autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { action, reference_id } = body

    if (!action || !POINT_VALUES[action]) {
      return NextResponse.json(
        { success: false, error: 'Acao invalida' },
        { status: 400 }
      )
    }

    const config = POINT_VALUES[action]
    const supabaseAdmin = getAdminClient()

    // Dedup check: prevent awarding same action + reference twice
    if (reference_id) {
      const { data: existing } = await supabaseAdmin
        .from('fitness_point_transactions')
        .select('id')
        .eq('user_id', user.id)
        .eq('reference_id', reference_id)
        .eq('category', config.category)
        .limit(1)

      if (existing && existing.length > 0) {
        return NextResponse.json({
          success: true,
          message: 'Pontos ja atribuidos para esta acao',
          duplicate: true,
        })
      }
    }

    // For daily actions without reference_id, check if already awarded today
    if (!reference_id) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const { data: todayExisting } = await supabaseAdmin
        .from('fitness_point_transactions')
        .select('id')
        .eq('user_id', user.id)
        .eq('reason', config.reason)
        .eq('source', 'automatic')
        .gte('created_at', today.toISOString())
        .limit(1)

      if (todayExisting && todayExisting.length > 0) {
        return NextResponse.json({
          success: true,
          message: 'Pontos ja atribuidos hoje para esta acao',
          duplicate: true,
        })
      }
    }

    // Insert point transaction
    const { data: transaction, error: insertError } = await supabaseAdmin
      .from('fitness_point_transactions')
      .insert({
        user_id: user.id,
        points: config.points,
        reason: config.reason,
        category: config.category,
        source: 'automatic',
        reference_id: reference_id || null,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Erro ao atribuir pontos:', insertError)
      return NextResponse.json({ success: false, error: 'Erro ao atribuir pontos' }, { status: 500 })
    }

    // Auto-join user to all active rankings they're not part of
    const { data: activeRankings } = await supabaseAdmin
      .from('fitness_rankings')
      .select('id, type, category')
      .eq('is_active', true)

    if (activeRankings && activeRankings.length > 0) {
      for (const ranking of activeRankings) {
        // Check if user already participant
        const { data: existing } = await supabaseAdmin
          .from('fitness_ranking_participants')
          .select('id')
          .eq('ranking_id', ranking.id)
          .eq('user_id', user.id)
          .limit(1)

        if (!existing || existing.length === 0) {
          await supabaseAdmin
            .from('fitness_ranking_participants')
            .insert({
              ranking_id: ranking.id,
              user_id: user.id,
              total_points: 0,
            })
        }
      }

      // Update points in relevant rankings
      for (const ranking of activeRankings) {
        // For category rankings, only add if category matches
        if (ranking.type === 'category' && ranking.category) {
          const categoryMap: Record<string, string[]> = {
            nutrition: ['nutrition'],
            workout: ['workout'],
            consistency: ['consistency', 'sleep', 'wellness', 'hydration'],
          }
          const matchingCategories = categoryMap[ranking.category] || []
          if (!matchingCategories.includes(config.category)) continue
        }

        // Increment total_points - direct read + update
        const { data: participant } = await supabaseAdmin
          .from('fitness_ranking_participants')
          .select('total_points')
          .eq('ranking_id', ranking.id)
          .eq('user_id', user.id)
          .single()

        if (participant) {
          await supabaseAdmin
            .from('fitness_ranking_participants')
            .update({ total_points: (participant.total_points || 0) + config.points })
            .eq('ranking_id', ranking.id)
            .eq('user_id', user.id)
        }
      }
    }

    return NextResponse.json({
      success: true,
      transaction,
      points: config.points,
      message: `+${config.points} pontos: ${config.reason}`,
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
      return NextResponse.json({ success: false, error: 'Nao autorizado' }, { status: 401 })
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
