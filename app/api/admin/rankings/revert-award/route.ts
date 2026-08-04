/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Remove lançamentos de pontos por id (superadmin) e estorna o leaderboard.
 * Feito para tirar pontos manuais indevidos (ex.: Instagram lançado pela
 * secretária, que não tinha autoridade). Só super_admin pode.
 *
 * POST { transactionIds: string[] } → apaga cada transação e aplica o delta
 * negativo no ranking com as categorias corretas (simétrico ao crédito).
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { TX_TO_RANKING_CATEGORIES } from '@/lib/services/points-server'

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

async function requireSuperadmin() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 }) }
  }
  const admin = getAdminClient()
  const { data: profile } = await admin.from('fitness_profiles').select('role').eq('id', user.id).single()
  if ((profile as any)?.role !== 'super_admin') {
    return { error: NextResponse.json({ success: false, error: 'Apenas super admin' }, { status: 403 }) }
  }
  return { admin }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireSuperadmin()
    if ('error' in auth) return auth.error
    const admin = auth.admin

    const body = await request.json().catch(() => ({}))
    const ids: string[] = Array.isArray(body?.transactionIds)
      ? body.transactionIds.filter((x: any) => typeof x === 'string')
      : []

    if (ids.length === 0) {
      return NextResponse.json({ success: false, error: 'transactionIds vazio' }, { status: 400 })
    }
    if (ids.length > 500) {
      return NextResponse.json({ success: false, error: 'Máximo 500 por vez' }, { status: 400 })
    }

    const { data: txs } = await admin
      .from('fitness_point_transactions')
      .select('id, user_id, points, category')
      .in('id', ids)

    let removed = 0
    let pointsReverted = 0
    for (const t of (txs || []) as any[]) {
      const { error: delErr } = await admin
        .from('fitness_point_transactions')
        .delete()
        .eq('id', t.id)
      if (delErr) {
        console.error('Falha ao apagar transação', t.id, delErr)
        continue
      }
      const allowed = TX_TO_RANKING_CATEGORIES[t.category] || null
      await admin.rpc('fitness_award_points_to_user', {
        p_user_id: t.user_id,
        p_delta: -(t.points || 0),
        p_allowed_ranking_categories: allowed,
      })
      removed += 1
      pointsReverted += (t.points || 0)
    }

    return NextResponse.json({ success: true, removed, pointsReverted })
  } catch (error) {
    console.error('Erro ao remover lançamentos:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}
