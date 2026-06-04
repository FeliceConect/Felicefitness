import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { getTodayDateSP, getDateOffsetSP, getMonthStartSP } from '@/lib/utils/date'

export async function GET() {
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

    // Usar admin client para buscar dados de todos os usuários
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

    // Buscar estatísticas
    const today = getTodayDateSP()
    const threeDaysAgo = getDateOffsetSP(-3)

    // Clientes = somente quem tem role 'client'. Profissionais e admins NÃO
    // são pacientes e não devem entrar nas métricas/alertas de clientes.
    const { data: clientRows } = await supabaseAdmin
      .from('fitness_profiles')
      .select('id')
      .eq('role', 'client')
    const clientIds = (clientRows || []).map((c: { id: string }) => c.id)
    const clientIdSet = new Set(clientIds)
    const totalClients = clientIds.length

    // user_ids de CLIENTES com qualquer atividade (treino, refeição, água ou
    // sono) desde uma data (YYYY-MM-DD em fuso SP). Considera todas as formas
    // de atividade, não só treino.
    // Cada fonte de atividade com sua respectiva coluna de data (a maioria usa
    // 'data'; fitness_activities usa 'date').
    const activitySources = [
      { table: 'fitness_workouts', dateCol: 'data' },
      { table: 'fitness_meals', dateCol: 'data' },
      { table: 'fitness_water_logs', dateCol: 'data' },
      { table: 'fitness_sleep_logs', dateCol: 'data' },
      { table: 'fitness_activities', dateCol: 'date' },
    ]
    const clientsActiveSince = async (sinceDate: string): Promise<Set<string>> => {
      const active = new Set<string>()
      for (const { table, dateCol } of activitySources) {
        const { data } = await supabaseAdmin
          .from(table)
          .select('user_id')
          .gte(dateCol, sinceDate)
        for (const row of ((data || []) as { user_id: string }[])) {
          if (clientIdSet.has(row.user_id)) active.add(row.user_id)
        }
      }
      return active
    }

    // Total de profissionais
    const { count: totalProfessionals } = await supabaseAdmin
      .from('fitness_professionals')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    // Clientes ativos hoje (qualquer atividade registrada na data de hoje, SP)
    const activeToday = (await clientsActiveSince(today)).size

    // Calcular taxa de adesão (treinos concluídos / treinos planejados nos últimos 7 dias)
    const weekAgo = getDateOffsetSP(-7)

    const { count: totalWorkoutsWeek } = await supabaseAdmin
      .from('fitness_workouts')
      .select('*', { count: 'exact', head: true })
      .gte('data', weekAgo)

    const { count: completedWorkoutsWeek } = await supabaseAdmin
      .from('fitness_workouts')
      .select('*', { count: 'exact', head: true })
      .gte('data', weekAgo)
      .eq('status', 'concluido')

    const complianceRate = totalWorkoutsWeek && totalWorkoutsWeek > 0
      ? Math.round((completedWorkoutsWeek || 0) / totalWorkoutsWeek * 100)
      : 0

    // Custo de API no mês atual — usa início do mês em SP (não UTC do
    // servidor, que vira "novo mês" 3h antes do real em BRT)
    const startOfMonthSP = new Date(`${getMonthStartSP()}T00:00:00-03:00`).toISOString()

    const { data: apiUsageData } = await supabaseAdmin
      .from('fitness_api_usage')
      .select('cost_usd')
      .gte('created_at', startOfMonthSP)

    const apiCostMonth = apiUsageData
      ? apiUsageData.reduce((sum, row) => sum + (parseFloat(row.cost_usd) || 0), 0) * 5.5 // Converter para BRL
      : 0

    // Clientes em risco: role 'client' SEM nenhuma atividade (treino, refeição,
    // água ou sono) nos últimos 3 dias.
    const activeRecentSet = await clientsActiveSince(threeDaysAgo)
    const clientsAtRisk = clientIds.filter((id) => !activeRecentSet.has(id)).length

    // Top performers (ranking)
    const { data: activeRankings } = await supabaseAdmin
      .from('fitness_rankings')
      .select('id')
      .eq('is_active', true)
      .limit(1)

    let topPerformers: Array<{ name: string; points: number; position: number }> = []
    if (activeRankings && activeRankings.length > 0) {
      const { data: topParticipants } = await supabaseAdmin
        .from('fitness_ranking_participants')
        .select('user_id, total_points')
        .eq('ranking_id', activeRankings[0].id)
        .order('total_points', { ascending: false })
        .limit(5)

      if (topParticipants && topParticipants.length > 0) {
        const topUserIds = topParticipants.map(p => p.user_id)
        const { data: topProfiles } = await supabaseAdmin
          .from('fitness_profiles')
          .select('id, nome, display_name, apelido_ranking')
          .in('id', topUserIds)

        const profileMap: Record<string, string> = {}
        for (const p of (topProfiles || [])) {
          profileMap[p.id] = p.display_name || p.apelido_ranking || p.nome?.split(' ')[0] || 'Anônimo'
        }

        topPerformers = topParticipants.map((p, i) => ({
          name: profileMap[p.user_id] || 'Anônimo',
          points: p.total_points || 0,
          position: i + 1
        }))
      }
    }

    // Próximas consultas de hoje
    const { data: todayAppointments } = await supabaseAdmin
      .from('fitness_appointments')
      .select('id, patient_id, professional_id, date, start_time, appointment_type, status')
      .eq('date', today)
      .in('status', ['scheduled', 'confirmed'])
      .order('start_time', { ascending: true })
      .limit(5)

    // Atividade recente (últimas 10)
    const { data: recentWorkouts } = await supabaseAdmin
      .from('fitness_workouts')
      .select(`
        id,
        nome,
        data,
        hora_inicio,
        user_id,
        fitness_profiles!inner(nome)
      `)
      .order('created_at', { ascending: false })
      .limit(5)

    const { data: recentMeals } = await supabaseAdmin
      .from('fitness_meals')
      .select(`
        id,
        tipo_refeicao,
        data,
        horario,
        user_id,
        fitness_profiles!inner(nome)
      `)
      .order('created_at', { ascending: false })
      .limit(5)

    // Formatar atividade recente
    const recentActivity = [
      ...(recentWorkouts || []).map(w => ({
        id: w.id,
        type: 'workout' as const,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        userName: (w as any).fitness_profiles?.nome || 'Usuário',
        description: `Treino: ${w.nome}`,
        time: w.hora_inicio
          ? new Date(w.hora_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
          : w.data
      })),
      ...(recentMeals || []).map(m => ({
        id: m.id,
        type: 'meal' as const,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        userName: (m as any).fitness_profiles?.nome || 'Usuário',
        description: `Refeição: ${m.tipo_refeicao}`,
        time: m.horario || m.data
      }))
    ]
      .sort((a, b) => b.time.localeCompare(a.time))
      .slice(0, 10)

    return NextResponse.json({
      success: true,
      stats: {
        totalClients: totalClients || 0,
        totalProfessionals: totalProfessionals || 0,
        activeToday,
        complianceRate,
        apiCostMonth,
        clientsAtRisk
      },
      recentActivity,
      topPerformers,
      todayAppointments: todayAppointments || []
    })

  } catch (error) {
    console.error('Erro ao buscar dados do dashboard:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
