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
// Janela máxima de lançamento retroativo. Protege contra typo de ano/mês
// virando um lançamento em período já encerrado.
const MAX_RETRO_DAYS = 90

// 'YYYY-MM-DD' → 'DD/MM/YYYY' (string pura, sem Date/timezone)
function formatDateBR(date: string): string {
  const [y, m, d] = date.split('-')
  return `${d}/${m}/${y}`
}

// Valida 'YYYY-MM-DD' de verdade (regex deixa passar 2026-02-31; o round-trip
// pelo Date UTC não).
function isValidDateString(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false
  const parsed = new Date(`${date}T00:00:00Z`)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date
}

// POST - Validar post no Instagram com #vivendofelice e atribuir 5 pts.
// Aceita `date` (YYYY-MM-DD, opcional) para lançamento retroativo — o crédito
// entra com created_at dentro do dia escolhido, então conta na janela certa
// do desafio/ranking (placar soma o extrato por created_at).
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

    // super_admin e admin podem lançar; a SECRETÁRIA (admin + admin_type
    // 'secretary') NÃO pode. Antes o check era só role in (super_admin, admin),
    // o que deixava a secretária lançar os 5 pts de Instagram.
    const canAward =
      profile?.role === 'super_admin' ||
      (profile?.role === 'admin' && profile.admin_type !== 'secretary')

    if (!canAward) {
      return NextResponse.json({ success: false, error: 'Acesso restrito' }, { status: 403 })
    }

    const body = await request.json()
    const { clientId, date } = body as { clientId?: string; date?: string }

    if (!clientId) {
      return NextResponse.json(
        { success: false, error: 'clientId é obrigatório' },
        { status: 400 }
      )
    }

    const today = getTodayDateSP()
    const targetDate = date || today

    if (!isValidDateString(targetDate)) {
      return NextResponse.json(
        { success: false, error: 'Data inválida — use o formato AAAA-MM-DD' },
        { status: 400 }
      )
    }
    if (targetDate > today) {
      return NextResponse.json(
        { success: false, error: 'Não é possível lançar pontos em data futura' },
        { status: 400 }
      )
    }
    // Datas string YYYY-MM-DD comparam certo lexicograficamente; o cutoff é
    // calculado em UTC puro a partir do "hoje" de São Paulo.
    const retroCutoff = new Date(
      new Date(`${today}T12:00:00Z`).getTime() - MAX_RETRO_DAYS * 86400000
    ).toISOString().slice(0, 10)
    if (targetDate < retroCutoff) {
      return NextResponse.json(
        { success: false, error: `Lançamento retroativo limitado a ${MAX_RETRO_DAYS} dias` },
        { status: 400 }
      )
    }

    // Cap diário: 1 validação Instagram por paciente por DIA ESCOLHIDO
    // (timezone BR). Dedup por faixa de created_at cobre tanto os lançamentos
    // antigos (created_at = dia validado) quanto os retroativos novos
    // (created_at = meio-dia do dia escolhido). O índice único ux_points_daily
    // não se aplica aqui (só source='automatic'), então este check é a trava.
    const startOfDayBR = fromZonedTime(`${targetDate}T00:00:00`, SAO_PAULO_TIMEZONE)
    // Brasil não tem mais horário de verão — +24h é seguro para o fim do dia.
    const endOfDayBR = new Date(startOfDayBR.getTime() + 86400000)
    const { data: existingOnDay } = await supabaseAdmin
      .from('fitness_point_transactions')
      .select('id')
      .eq('user_id', clientId)
      .eq('reason', REASON)
      .gte('created_at', startOfDayBR.toISOString())
      .lt('created_at', endOfDayBR.toISOString())
      .limit(1)

    if (existingOnDay && existingOnDay.length > 0) {
      return NextResponse.json({
        success: false,
        error: targetDate === today
          ? 'Este paciente já recebeu pontos do #vivendofelice hoje'
          : `Este paciente já recebeu pontos do #vivendofelice em ${formatDateBR(targetDate)}`,
      }, { status: 409 })
    }

    // Retroativo entra com created_at ao meio-dia (SP) do dia escolhido, para
    // o placar do desafio (que soma o extrato por created_at) contar no dia
    // certo. Hoje usa o default now() do banco. reference_date registra o dia
    // creditado; se a coluna ainda não existe (migration 20260730_1 não
    // rodou), refaz sem ela — o lançamento não pode quebrar.
    const baseRow = {
      user_id: clientId,
      points: INSTAGRAM_POINTS,
      reason: REASON,
      category: 'social',
      source: profile.role === 'super_admin' ? 'superadmin' : 'professional',
      awarded_by: user.id,
      ...(targetDate !== today
        ? { created_at: fromZonedTime(`${targetDate}T12:00:00`, SAO_PAULO_TIMEZONE).toISOString() }
        : {}),
    }
    let insertRes = await supabaseAdmin
      .from('fitness_point_transactions')
      .insert({ ...baseRow, reference_date: targetDate })
    if (insertRes.error && (insertRes.error.code === '42703' || insertRes.error.code === 'PGRST204')) {
      insertRes = await supabaseAdmin
        .from('fitness_point_transactions')
        .insert(baseRow)
    }

    if (insertRes.error) {
      console.error('Erro ao validar post Instagram:', insertRes.error)
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
      message: targetDate === today
        ? `${INSTAGRAM_POINTS} pts atribuídos por post no Instagram`
        : `${INSTAGRAM_POINTS} pts atribuídos por post no Instagram (retroativo, dia ${formatDateBR(targetDate)})`,
    })
  } catch (error) {
    console.error('Erro na API:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}
