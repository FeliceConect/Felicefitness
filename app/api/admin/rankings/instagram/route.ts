/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { fromZonedTime } from 'date-fns-tz'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { getTodayDateSP, SAO_PAULO_TIMEZONE } from '@/lib/utils/date'

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

const INSTAGRAM_POINTS = 5
const REASON = 'Post no Instagram com #vivendofelice'

// POST - Validar post no Instagram com #vivendofelice e atribuir 5 pts
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
    }

    const supabaseAdmin = getAdminClient()

    const { data: profile } = await supabaseAdmin
      .from('fitness_profiles')
      .select('role, admin_type')
      .eq('id', user.id)
      .single()

    if (!profile || !['super_admin', 'admin'].includes(profile.role)) {
      return NextResponse.json({ success: false, error: 'Acesso restrito' }, { status: 403 })
    }

    const body = await request.json()
    const { clientId } = body as { clientId?: string }

    if (!clientId) {
      return NextResponse.json(
        { success: false, error: 'clientId é obrigatório' },
        { status: 400 }
      )
    }

    // Cap diário: 1 validação Instagram por paciente por dia (timezone BR).
    // Sem URL pra deduplicar, evita que o mesmo post seja validado várias
    // vezes ou que o admin clique 5x sem perceber.
    const startOfDayBR = fromZonedTime(`${getTodayDateSP()}T00:00:00`, SAO_PAULO_TIMEZONE)
    const { data: existingToday } = await supabaseAdmin
      .from('fitness_point_transactions')
      .select('id')
      .eq('user_id', clientId)
      .eq('reason', REASON)
      .gte('created_at', startOfDayBR.toISOString())
      .limit(1)

    if (existingToday && existingToday.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Este paciente já recebeu pontos do #vivendofelice hoje',
      }, { status: 409 })
    }

    const { error: insertError } = await supabaseAdmin
      .from('fitness_point_transactions')
      .insert({
        user_id: clientId,
        points: INSTAGRAM_POINTS,
        reason: REASON,
        category: 'social',
        source: profile.role === 'super_admin' ? 'superadmin' : 'professional',
        awarded_by: user.id,
      })

    if (insertError) {
      console.error('Erro ao validar post Instagram:', insertError)
      return NextResponse.json({ success: false, error: 'Erro ao validar post' }, { status: 500 })
    }

    // Sincroniza com leaderboard (rankings globais)
    await supabaseAdmin.rpc('fitness_award_points_to_user', {
      p_user_id: clientId,
      p_delta: INSTAGRAM_POINTS,
      p_allowed_ranking_categories: null,
    })

    return NextResponse.json({
      success: true,
      points: INSTAGRAM_POINTS,
      message: `${INSTAGRAM_POINTS} pts atribuídos por post no Instagram`,
    })
  } catch (error) {
    console.error('Erro na API:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}
