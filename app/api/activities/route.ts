import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import type { ActivityInsert } from '@/lib/activity/types'
import { awardPointsServer, ACTIVITY_INTENSITY_ACTION } from '@/lib/services/points-server'
import { getTodayDateSP, getStartOfTodaySP } from '@/lib/utils/date'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any

// Máximo de atividades avulsas PONTUÁVEIS por dia (decisão de produto).
// Cobre quem legitimamente faz 2 esportes no mesmo dia; corta o farm por
// cadastro em massa. Atividades além disso são salvas, mas não pontuam.
const ACTIVITY_DAILY_CAP = 2

// Razões das atividades avulsas (POINT_VALUES) — usadas no cap e na reversão.
const ACTIVITY_REASONS = [
  'Atividade leve',
  'Atividade moderada',
  'Atividade intensa',
  'Atividade muito intensa',
]

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// GET - Buscar atividades do usuário
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') // Formato: YYYY-MM-DD
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    let query = (supabase as AnySupabase)
      .from('fitness_activities')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (date) {
      query = query.eq('date', date)
    } else if (startDate && endDate) {
      query = query.gte('date', startDate).lte('date', endDate)
    }

    const { data: activities, error } = await query

    if (error) {
      console.error('Erro ao buscar atividades:', error)
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar atividades' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      activities: activities || []
    })

  } catch (error) {
    console.error('Erro ao processar requisição:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Criar nova atividade
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const body: ActivityInsert = await request.json()

    // Validações básicas
    if (!body.activity_type) {
      return NextResponse.json(
        { success: false, error: 'Tipo de atividade é obrigatório' },
        { status: 400 }
      )
    }

    if (!body.duration_minutes || body.duration_minutes <= 0) {
      return NextResponse.json(
        { success: false, error: 'Duração é obrigatória' },
        { status: 400 }
      )
    }

    if (!body.intensity) {
      return NextResponse.json(
        { success: false, error: 'Intensidade é obrigatória' },
        { status: 400 }
      )
    }

    const { data: activity, error } = await (supabase as AnySupabase)
      .from('fitness_activities')
      .insert({
        user_id: user.id,
        activity_type: body.activity_type,
        custom_name: body.custom_name,
        date: body.date || getTodayDateSP(),
        duration_minutes: body.duration_minutes,
        intensity: body.intensity,
        calories_burned: body.calories_burned,
        distance_km: body.distance_km,
        heart_rate_avg: body.heart_rate_avg,
        notes: body.notes,
        location: body.location
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar atividade:', error)
      return NextResponse.json(
        { success: false, error: 'Erro ao criar atividade' },
        { status: 500 }
      )
    }

    // Award por intensidade — respeitando o CAP DIÁRIO. Dedup por activity.id
    // evita duplicar caso o POST seja reenviado para a mesma atividade.
    let pointsAwarded = 0
    let dailyCapReached = false
    const intensityAction = ACTIVITY_INTENSITY_ACTION[body.intensity as keyof typeof ACTIVITY_INTENSITY_ACTION]
    if (intensityAction) {
      // Conta quantas atividades avulsas já pontuaram HOJE (SP). A contagem é
      // por reference_date=hoje (dia do crédito), então backdatar a atividade
      // não escapa do teto. A atividade em si é salva de qualquer forma.
      const capQuery = await (supabase as AnySupabase)
        .from('fitness_point_transactions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('category', 'workout')
        .eq('reference_date', getTodayDateSP())
        .in('reason', ACTIVITY_REASONS)

      // Fallback por created_at se a coluna reference_date ainda não existir
      // (migration 20260730_1 não rodou) — senão o count erraria e o cap
      // falharia ABERTO (voltaria o farm de atividades).
      let awardedToday = capQuery.count
      if (capQuery.error && (capQuery.error.code === '42703' || capQuery.error.code === 'PGRST204')) {
        const fb = await (supabase as AnySupabase)
          .from('fitness_point_transactions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('category', 'workout')
          .gte('created_at', getStartOfTodaySP())
          .in('reason', ACTIVITY_REASONS)
        awardedToday = fb.count
      }

      if ((awardedToday ?? 0) < ACTIVITY_DAILY_CAP) {
        const result = await awardPointsServer(user.id, intensityAction, activity.id)
        if (result.success && !result.duplicate) {
          pointsAwarded = result.points || 0
        }
      } else {
        dailyCapReached = true
      }
    }

    return NextResponse.json({
      success: true,
      activity,
      points_awarded: pointsAwarded,
      daily_cap_reached: dailyCapReached,
      message: 'Atividade registrada com sucesso'
    })

  } catch (error) {
    console.error('Erro ao processar requisição:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PATCH - Editar atividade (mesmo dia apenas; pontos não mexem)
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const activityId = searchParams.get('id')

    if (!activityId) {
      return NextResponse.json({ success: false, error: 'ID da atividade é obrigatório' }, { status: 400 })
    }

    // Carrega atividade pra validar dono e data
    const { data: activity } = await (supabase as AnySupabase)
      .from('fitness_activities')
      .select('id, user_id, date')
      .eq('id', activityId)
      .single()

    if (!activity) {
      return NextResponse.json({ success: false, error: 'Atividade não encontrada' }, { status: 404 })
    }
    if (activity.user_id !== user.id) {
      return NextResponse.json({ success: false, error: 'Sem permissão' }, { status: 403 })
    }
    if (activity.date !== getTodayDateSP()) {
      return NextResponse.json(
        { success: false, error: 'Só é possível editar atividades do dia atual' },
        { status: 403 }
      )
    }

    const body = await request.json()
    // Whitelist de campos editáveis. NÃO aceita data — não muda dia.
    const updates: Record<string, unknown> = {}
    const ALLOWED = [
      'activity_type', 'custom_name', 'duration_minutes', 'intensity',
      'calories_burned', 'distance_km', 'heart_rate_avg', 'notes', 'location',
    ]
    for (const k of ALLOWED) {
      if (k in body) updates[k] = body[k]
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: false, error: 'Nenhum campo válido para atualizar' }, { status: 400 })
    }

    const { data: updated, error } = await (supabase as AnySupabase)
      .from('fitness_activities')
      .update(updates)
      .eq('id', activityId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao editar atividade:', error)
      return NextResponse.json({ success: false, error: 'Erro ao editar atividade' }, { status: 500 })
    }

    return NextResponse.json({ success: true, activity: updated })
  } catch (error) {
    console.error('Erro ao processar requisição:', error)
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// DELETE - Remover atividade (mesmo dia apenas; pontos são revertidos)
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const activityId = searchParams.get('id')

    if (!activityId) {
      return NextResponse.json(
        { success: false, error: 'ID da atividade é obrigatório' },
        { status: 400 }
      )
    }

    // Carrega atividade pra validar dono + data + saber se pontuou
    const { data: activity } = await (supabase as AnySupabase)
      .from('fitness_activities')
      .select('id, user_id, date')
      .eq('id', activityId)
      .single()

    if (!activity) {
      return NextResponse.json({ success: false, error: 'Atividade não encontrada' }, { status: 404 })
    }
    if (activity.user_id !== user.id) {
      return NextResponse.json({ success: false, error: 'Sem permissão' }, { status: 403 })
    }
    if (activity.date !== getTodayDateSP()) {
      return NextResponse.json(
        { success: false, error: 'Só é possível apagar atividades do dia atual' },
        { status: 403 }
      )
    }

    // Reversão ATÔMICA e simétrica (apaga transação + estorna leaderboard com
    // as categorias corretas) via RPC no banco. O client do usuário não tem
    // policy de DELETE em fitness_point_transactions — por isso admin.
    const admin = getAdminClient()
    const { data: reverted } = await admin.rpc('fitness_revert_points_by_reference', {
      p_user_id: user.id,
      p_reference_ids: [activityId],
      p_reasons: ACTIVITY_REASONS,
    })
    const pointsReverted = reverted || 0

    const { error } = await (supabase as AnySupabase)
      .from('fitness_activities')
      .delete()
      .eq('id', activityId)
      .eq('user_id', user.id) // Garante que só pode deletar suas próprias atividades

    if (error) {
      console.error('Erro ao deletar atividade:', error)
      return NextResponse.json(
        { success: false, error: 'Erro ao deletar atividade' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      points_reverted: pointsReverted,
      message: 'Atividade removida com sucesso'
    })

  } catch (error) {
    console.error('Erro ao processar requisição:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
