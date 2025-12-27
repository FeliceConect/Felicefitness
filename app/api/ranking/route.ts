import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface ProfileRanking {
  id: string
  xp_total: number | null
  nivel: number | null
  streak_atual: number | null
  apelido_ranking: string | null
}

interface LeaderboardEntry {
  posicao: number
  apelido: string
  xp_total: number
  nivel: number
  streak_atual: number
  total_conquistas: number
}

interface UserRankingData {
  posicao: number
  xp_total: number
  nivel: number
  percentil: number
  total_usuarios: number
  proximo_acima_xp: number | null
  proximo_abaixo_xp: number | null
}

// GET - Obter ranking (leaderboard + posição do usuário)
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
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Obter posição do usuário atual
    let userRankingData: UserRankingData | null = null
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: userRanking, error: userRankError } = await (supabase as any)
        .rpc('get_user_ranking', { p_user_id: user.id })

      if (userRankError) {
        console.error('Erro ao obter ranking do usuário:', userRankError)
      } else if (userRanking && Array.isArray(userRanking) && userRanking.length > 0) {
        userRankingData = userRanking[0] as UserRankingData
      }
    } catch (e) {
      console.error('Erro ao chamar RPC get_user_ranking:', e)
    }

    // Obter leaderboard
    let leaderboardData: LeaderboardEntry[] = []
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: leaderboard, error: leaderboardError } = await (supabase as any)
        .rpc('get_ranking_leaderboard', {
          p_limit: limit,
          p_offset: offset
        })

      if (leaderboardError) {
        console.error('Erro ao obter leaderboard:', leaderboardError)
        // Fallback: buscar direto da tabela
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('fitness_profiles')
          .select('id, xp_total, nivel, streak_atual, apelido_ranking')
          .gt('xp_total', 0)
          .eq('ranking_visivel', true)
          .order('xp_total', { ascending: false })
          .range(offset, offset + limit - 1)

        if (fallbackError) throw fallbackError

        leaderboardData = ((fallbackData || []) as ProfileRanking[]).map((p, index) => ({
          posicao: offset + index + 1,
          apelido: p.apelido_ranking || `Atleta #${p.id.substring(0, 4)}`,
          xp_total: p.xp_total || 0,
          nivel: p.nivel || 1,
          streak_atual: p.streak_atual || 0,
          total_conquistas: 0
        }))
      } else if (leaderboard && Array.isArray(leaderboard)) {
        leaderboardData = leaderboard as LeaderboardEntry[]
      }
    } catch (e) {
      console.error('Erro ao chamar RPC get_ranking_leaderboard:', e)
    }

    return NextResponse.json({
      success: true,
      userRanking: userRankingData,
      leaderboard: leaderboardData,
      hasMore: leaderboardData.length === limit
    })

  } catch (error) {
    console.error('Erro ao obter ranking:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Atualizar apelido do ranking
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

    const body = await request.json()
    const { apelido, ranking_visivel } = body

    const updates: Record<string, unknown> = {}

    if (apelido !== undefined) {
      // Validar apelido (máx 50 chars, sem caracteres especiais perigosos)
      const apelidoClean = apelido?.trim().substring(0, 50).replace(/[<>]/g, '') || null
      updates.apelido_ranking = apelidoClean
    }

    if (ranking_visivel !== undefined) {
      updates.ranking_visivel = Boolean(ranking_visivel)
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: 'Nenhum campo para atualizar' },
        { status: 400 }
      )
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase as any)
      .from('fitness_profiles')
      .update(updates)
      .eq('id', user.id)

    if (updateError) throw updateError

    return NextResponse.json({
      success: true,
      message: 'Configurações de ranking atualizadas'
    })

  } catch (error) {
    console.error('Erro ao atualizar ranking:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
