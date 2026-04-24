import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

interface Assignment {
  client_id: string
}

interface Meal {
  id: string
  user_id: string
  data: string
  horario: string
  tipo_refeicao: string
  calorias_total: number
  proteinas_total: number
  carboidratos_total: number
  gorduras_total: number
  foto_url: string | null
  notas: string | null
  analise_ia: string | null
  profile?: { id: string; nome: string; email: string } | null
  [key: string]: unknown
}

interface MealItem {
  meal_id: string
  nome_alimento: string
  quantidade: number
  unidade: string
  calorias: number | null
  proteinas: number | null
  carboidratos: number | null
  gorduras: number | null
}

// GET - Listar refeicoes dos clientes do profissional
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

    // Usar admin client para bypass de RLS
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Verificar se e profissional
    const { data: professional } = await supabaseAdmin
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
    const { data: assignments } = await supabaseAdmin
      .from('fitness_client_assignments')
      .select('client_id')
      .eq('professional_id', (professional as { id: string }).id)
      .eq('is_active', true)

    const clientIds = (assignments as Assignment[] | null)?.map(a => a.client_id) || []

    if (clientIds.length === 0) {
      return NextResponse.json({
        success: true,
        meals: [],
        clients: []
      })
    }

    // Buscar informacoes dos clientes
    const { data: clients } = await supabaseAdmin
      .from('fitness_profiles')
      .select('id, nome, email')
      .in('id', clientIds)

    // Construir query de refeicoes
    let query = supabaseAdmin
      .from('fitness_meals')
      .select(`
        *,
        profile:fitness_profiles!user_id(id, nome, email)
      `)
      .in('user_id', clientIds)
      .order('data', { ascending: false })
      .order('horario', { ascending: false })

    // Filtros
    if (clientId && clientIds.includes(clientId)) {
      query = query.eq('user_id', clientId)
    }

    if (date) {
      query = query.eq('data', date)
    } else if (startDate && endDate) {
      query = query.gte('data', startDate).lte('data', endDate)
    } else {
      // Ultimos 7 dias por padrao
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      query = query.gte('data', sevenDaysAgo.toISOString().split('T')[0])
    }

    if (mealType) {
      query = query.eq('tipo_refeicao', mealType)
    }

    // Limitar a 100 registros
    query = query.limit(100)

    const { data: meals, error } = await query

    if (error) {
      console.error('Erro ao buscar refeições:', error)
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar refeições' },
        { status: 500 }
      )
    }

    const mealsTyped = meals as Meal[] | null

    // Buscar itens (alimentos) das refeições encontradas em lote
    const mealIds = (mealsTyped || []).map(m => m.id)
    let itemsByMeal: Record<string, MealItem[]> = {}

    if (mealIds.length > 0) {
      const { data: items } = await supabaseAdmin
        .from('fitness_meal_items')
        .select('meal_id, nome_alimento, quantidade, unidade, calorias, proteinas, carboidratos, gorduras')
        .in('meal_id', mealIds)

      itemsByMeal = ((items as MealItem[] | null) || []).reduce((acc, it) => {
        if (!acc[it.meal_id]) acc[it.meal_id] = []
        acc[it.meal_id].push(it)
        return acc
      }, {} as Record<string, MealItem[]>)
    }

    // Mapear refeições para o formato esperado pela página (EN).
    // A página espera meal_date / meal_time / meal_type / calories / protein / carbs / fat / foods / photo_url / notes / ai_analysis;
    // o banco armazena esses campos em português.
    const mealsMapped = (mealsTyped || []).map(m => {
      const items = itemsByMeal[m.id] || []
      return {
        id: m.id,
        user_id: m.user_id,
        meal_date: m.data,
        meal_time: m.horario,
        meal_type: m.tipo_refeicao,
        description: '',
        calories: Number(m.calorias_total) || 0,
        protein: Number(m.proteinas_total) || 0,
        carbs: Number(m.carboidratos_total) || 0,
        fat: Number(m.gorduras_total) || 0,
        fiber: 0,
        photo_url: m.foto_url || null,
        notes: m.notas || null,
        ai_analysis: m.analise_ia || null,
        profile: m.profile || null,
        foods: items.map(it => ({
          name: it.nome_alimento,
          quantity: Number(it.quantidade) || 0,
          unit: it.unidade || 'g',
          calories: Number(it.calorias) || 0,
          protein: Number(it.proteinas) || 0,
          carbs: Number(it.carboidratos) || 0,
          fat: Number(it.gorduras) || 0,
        })),
      }
    })

    // Calcular estatisticas
    const stats = {
      totalMeals: mealsTyped?.length || 0,
      totalCalories: mealsTyped?.reduce((sum, m) => sum + (m.calorias_total || 0), 0) || 0,
      avgProtein: mealsTyped?.length
        ? Math.round(mealsTyped.reduce((sum, m) => sum + (m.proteinas_total || 0), 0) / mealsTyped.length)
        : 0,
      avgCarbs: mealsTyped?.length
        ? Math.round(mealsTyped.reduce((sum, m) => sum + (m.carboidratos_total || 0), 0) / mealsTyped.length)
        : 0,
      avgFat: mealsTyped?.length
        ? Math.round(mealsTyped.reduce((sum, m) => sum + (m.gorduras_total || 0), 0) / mealsTyped.length)
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
      meals: mealsMapped,
      clients: clients || [],
      stats
    })

  } catch (error) {
    console.error('Erro ao processar requisição:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
