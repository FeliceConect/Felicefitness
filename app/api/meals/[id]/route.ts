/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { getTodayDateSP } from '@/lib/utils/date'

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

const ALL_MEALS_REASON = 'Todas refeicoes registradas'

// DELETE - Apaga uma refeição. Só permite se for do dia atual (BR).
// Se o número de refeições restantes do dia cair abaixo de 3, reverte
// os 10 pts da transação "Todas refeicoes registradas" do dia.
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params
    const supabaseAdmin = getAdminClient()

    // Busca a refeição
    const { data: meal } = await supabaseAdmin
      .from('fitness_meals')
      .select('id, user_id, data')
      .eq('id', id)
      .single()

    if (!meal) {
      return NextResponse.json({ success: false, error: 'Refeição não encontrada' }, { status: 404 })
    }

    if (meal.user_id !== user.id) {
      return NextResponse.json({ success: false, error: 'Sem permissão' }, { status: 403 })
    }

    // Trava: só pode apagar refeição do mesmo dia (timezone BR)
    const today = getTodayDateSP()
    if (meal.data !== today) {
      return NextResponse.json(
        { success: false, error: 'Só é possível apagar refeições do dia atual' },
        { status: 403 }
      )
    }

    // Apaga a refeição. fitness_meal_items cascateia via FK.
    const { error: deleteError } = await supabaseAdmin
      .from('fitness_meals')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Erro ao apagar refeição:', deleteError)
      return NextResponse.json({ success: false, error: 'Erro ao apagar refeição' }, { status: 500 })
    }

    // Conta refeições NÃO puladas restantes no dia (mesma condição do trigger de
    // award: COALESCE(status,'') <> 'pulado' — conta status NULL como válida,
    // porque /api/meals grava refeição sem status).
    const { count: afterCount } = await supabaseAdmin
      .from('fitness_meals')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('data', today)
      .or('status.is.null,status.neq.pulado')

    // Se caiu abaixo de 3, a regra "Todas refeicoes registradas" deixa de valer.
    // A RPC reverte de forma atômica e simétrica (só age se a transação existir).
    let pointsReverted = 0
    const after = afterCount ?? 0
    if (after < 3) {
      const { data: reverted } = await supabaseAdmin.rpc('fitness_revert_daily_award', {
        p_user_id: user.id,
        p_reason: ALL_MEALS_REASON,
        p_reference_date: today,
      })
      pointsReverted = reverted || 0
    }

    return NextResponse.json({
      success: true,
      meals_remaining: after,
      points_reverted: pointsReverted,
    })
  } catch (error) {
    console.error('Erro na API de meals/[id]:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}
