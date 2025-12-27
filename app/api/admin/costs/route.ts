import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

// GET - Buscar estatísticas de custos de API
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

    // Verificar se é admin
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (supabase as any)
      .from('fitness_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['super_admin', 'admin'].includes(profile.role)) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado' },
        { status: 403 }
      )
    }

    // Parâmetros de busca
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'month' // day, week, month
    const userId = searchParams.get('userId') || ''

    // Usar admin client
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Calcular datas baseado no período
    const now = new Date()
    let startDate: Date
    let previousStartDate: Date
    let previousEndDate: Date

    switch (period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        previousStartDate = new Date(startDate)
        previousStartDate.setDate(previousStartDate.getDate() - 1)
        previousEndDate = new Date(startDate)
        break
      case 'week':
        startDate = new Date(now)
        startDate.setDate(startDate.getDate() - 7)
        previousStartDate = new Date(startDate)
        previousStartDate.setDate(previousStartDate.getDate() - 7)
        previousEndDate = new Date(startDate)
        break
      case 'month':
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        previousStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        previousEndDate = new Date(startDate)
        break
    }

    // Query base
    let query = supabaseAdmin
      .from('fitness_api_usage')
      .select('*')
      .gte('created_at', startDate.toISOString())

    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data: currentUsage, error } = await query

    if (error) {
      console.error('Erro ao buscar uso de API:', error)
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar dados de custos' },
        { status: 500 }
      )
    }

    // Query período anterior para comparação
    let previousQuery = supabaseAdmin
      .from('fitness_api_usage')
      .select('cost_usd')
      .gte('created_at', previousStartDate.toISOString())
      .lt('created_at', previousEndDate.toISOString())

    if (userId) {
      previousQuery = previousQuery.eq('user_id', userId)
    }

    const { data: previousUsage } = await previousQuery

    // Calcular totais
    const exchangeRate = 5.5 // USD para BRL

    const totalCostUSD = currentUsage?.reduce((sum, row) => sum + (parseFloat(row.cost_usd) || 0), 0) || 0
    const totalCostBRL = totalCostUSD * exchangeRate
    const totalTokensInput = currentUsage?.reduce((sum, row) => sum + (row.tokens_input || 0), 0) || 0
    const totalTokensOutput = currentUsage?.reduce((sum, row) => sum + (row.tokens_output || 0), 0) || 0
    const totalRequests = currentUsage?.length || 0

    const previousTotalCostUSD = previousUsage?.reduce((sum, row) => sum + (parseFloat(row.cost_usd) || 0), 0) || 0

    // Calcular variação percentual
    const costChange = previousTotalCostUSD > 0
      ? ((totalCostUSD - previousTotalCostUSD) / previousTotalCostUSD) * 100
      : 0

    // Agrupar por feature
    const byFeature: Record<string, { count: number; costUSD: number; tokens: number }> = {}
    currentUsage?.forEach(row => {
      const feature = row.feature || 'unknown'
      if (!byFeature[feature]) {
        byFeature[feature] = { count: 0, costUSD: 0, tokens: 0 }
      }
      byFeature[feature].count++
      byFeature[feature].costUSD += parseFloat(row.cost_usd) || 0
      byFeature[feature].tokens += (row.tokens_input || 0) + (row.tokens_output || 0)
    })

    // Agrupar por modelo
    const byModel: Record<string, { count: number; costUSD: number }> = {}
    currentUsage?.forEach(row => {
      const model = row.model || 'unknown'
      if (!byModel[model]) {
        byModel[model] = { count: 0, costUSD: 0 }
      }
      byModel[model].count++
      byModel[model].costUSD += parseFloat(row.cost_usd) || 0
    })

    // Agrupar por dia (para gráfico)
    const byDay: Record<string, number> = {}
    currentUsage?.forEach(row => {
      const day = new Date(row.created_at).toISOString().split('T')[0]
      byDay[day] = (byDay[day] || 0) + (parseFloat(row.cost_usd) || 0)
    })

    // Top usuários por custo
    const byUser: Record<string, { costUSD: number; requests: number }> = {}
    currentUsage?.forEach(row => {
      if (!byUser[row.user_id]) {
        byUser[row.user_id] = { costUSD: 0, requests: 0 }
      }
      byUser[row.user_id].costUSD += parseFloat(row.cost_usd) || 0
      byUser[row.user_id].requests++
    })

    // Buscar nomes dos top usuários
    const topUserIds = Object.entries(byUser)
      .sort((a, b) => b[1].costUSD - a[1].costUSD)
      .slice(0, 10)
      .map(([id]) => id)

    const { data: userProfiles } = await supabaseAdmin
      .from('fitness_profiles')
      .select('id, nome, email')
      .in('id', topUserIds)

    const userMap = new Map(userProfiles?.map(u => [u.id, u]) || [])

    const topUsers = topUserIds.map(id => ({
      id,
      nome: userMap.get(id)?.nome || 'Usuário',
      email: userMap.get(id)?.email || '',
      costUSD: byUser[id].costUSD,
      costBRL: byUser[id].costUSD * exchangeRate,
      requests: byUser[id].requests
    }))

    return NextResponse.json({
      success: true,
      summary: {
        totalCostUSD,
        totalCostBRL,
        totalTokensInput,
        totalTokensOutput,
        totalRequests,
        costChange,
        exchangeRate
      },
      byFeature: Object.entries(byFeature).map(([feature, data]) => ({
        feature,
        ...data,
        costBRL: data.costUSD * exchangeRate
      })),
      byModel: Object.entries(byModel).map(([model, data]) => ({
        model,
        ...data,
        costBRL: data.costUSD * exchangeRate
      })),
      byDay: Object.entries(byDay)
        .map(([date, costUSD]) => ({
          date,
          costUSD,
          costBRL: costUSD * exchangeRate
        }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      topUsers
    })

  } catch (error) {
    console.error('Erro ao processar requisição:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
