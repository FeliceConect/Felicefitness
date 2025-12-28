import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface Assignment {
  client_id: string
}

interface Meal {
  id: string
  user_id: string
  meal_date: string
  meal_time: string
  meal_type: string
  calories: number
  protein: number
  carbs: number
  fat: number
  [key: string]: unknown
}

// GET - Listar refeicoes dos clientes do profissional
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Nao autorizado' },
        { status: 401 }
      )
    }

    // Verificar se e profissional
    const { data: professional } = await supabase
      .from('fitness_professionals')
      .select('id, type')
      .eq('user_id', user.id)
      .single()

    if (!professional) {
      return NextResponse.json(
        { success: false, error: 'Acesso restrito a profissionais' },
        { status: 403 }
      )
    }

    // Parametros de busca
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')
    const date = searchParams.get('date')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const mealType = searchParams.get('mealType')

    // Buscar clientes vinculados ao profissional
    const { data: assignments } = await supabase
      .from('fitness_professional_assignments')
      .select('client_id')
      .eq('professional_id', (professional as { id: string }).id)
      .eq('status', 'active')

    const clientIds = (assignments as Assignment[] | null)?.map(a => a.client_id) || []

    if (clientIds.length === 0) {
      return NextResponse.json({
        success: true,
        meals: [],
        clients: []
      })
    }

    // Buscar informacoes dos clientes
    const { data: clients } = await supabase
      .from('fitness_profiles')
      .select('id, nome, email')
      .in('id', clientIds)

    // Construir query de refeicoes
    let query = supabase
      .from('fitness_meals')
      .select(`
        *,
        profile:fitness_profiles!user_id(id, nome, email)
      `)
      .in('user_id', clientIds)
      .order('meal_date', { ascending: false })
      .order('meal_time', { ascending: false })

    // Filtros
    if (clientId && clientIds.includes(clientId)) {
      query = query.eq('user_id', clientId)
    }

    if (date) {
      query = query.eq('meal_date', date)
    } else if (startDate && endDate) {
      query = query.gte('meal_date', startDate).lte('meal_date', endDate)
    } else {
      // Ultimos 7 dias por padrao
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      query = query.gte('meal_date', sevenDaysAgo.toISOString().split('T')[0])
    }

    if (mealType) {
      query = query.eq('meal_type', mealType)
    }

    // Limitar a 100 registros
    query = query.limit(100)

    const { data: meals, error } = await query

    if (error) {
      console.error('Erro ao buscar refeicoes:', error)
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar refeicoes' },
        { status: 500 }
      )
    }

    const mealsTyped = meals as Meal[] | null

    // Calcular estatisticas
    const stats = {
      totalMeals: mealsTyped?.length || 0,
      totalCalories: mealsTyped?.reduce((sum, m) => sum + (m.calories || 0), 0) || 0,
      avgProtein: mealsTyped?.length
        ? Math.round(mealsTyped.reduce((sum, m) => sum + (m.protein || 0), 0) / mealsTyped.length)
        : 0,
      avgCarbs: mealsTyped?.length
        ? Math.round(mealsTyped.reduce((sum, m) => sum + (m.carbs || 0), 0) / mealsTyped.length)
        : 0,
      avgFat: mealsTyped?.length
        ? Math.round(mealsTyped.reduce((sum, m) => sum + (m.fat || 0), 0) / mealsTyped.length)
        : 0,
      mealsPerClient: {} as Record<string, number>
    }

    // Contar refeicoes por cliente
    mealsTyped?.forEach(meal => {
      const cid = meal.user_id
      stats.mealsPerClient[cid] = (stats.mealsPerClient[cid] || 0) + 1
    })

    return NextResponse.json({
      success: true,
      meals: mealsTyped || [],
      clients: clients || [],
      stats
    })

  } catch (error) {
    console.error('Erro ao processar requisicao:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
