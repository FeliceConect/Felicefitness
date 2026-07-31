/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { getTodayDateSP, getDateOffsetSP } from '@/lib/utils/date'
import { mealTypeToPT, mealTypeToEN } from '@/lib/nutrition/meal-type'

// POST - Registrar refeição do plano como completada (ou pulada)
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

    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const body = await request.json()
    const {
      planMealId,      // ID da refeição do plano
      date,            // Data em que foi feita
      completedFoods,  // Alimentos realmente consumidos (pode ser diferente do plano)
      notes,           // Observações
      usedAlternative, // Se usou alternativa
      skipped,         // true = paciente pulou esta refeição (registro explícito)
      adherence        // 'seguiu' | 'substituiu' — como o consumo se relaciona ao plano
    } = body

    if (!planMealId || !date) {
      return NextResponse.json(
        { success: false, error: 'Dados obrigatórios faltando' },
        { status: 400 }
      )
    }

    // Só aceita registro de hoje ou ontem (SP). Bloqueia backdatar/adiantar a
    // data para farmar crédito de refeição em datas fora da janela plausível.
    const todaySP = getTodayDateSP()
    if (date > todaySP || date < getDateOffsetSP(-1)) {
      return NextResponse.json(
        { success: false, error: 'Data inválida: registre apenas o dia atual ou o anterior.' },
        { status: 400 }
      )
    }

    // Buscar a refeição do plano para obter os dados
    const { data: planMeal, error: mealError } = await admin
      .from('fitness_meal_plan_meals')
      .select(`
        *,
        meal_plan_day:fitness_meal_plan_days!meal_plan_day_id(
          meal_plan_id,
          meal_plan:fitness_meal_plans!meal_plan_id(
            client_id
          )
        )
      `)
      .eq('id', planMealId)
      .single()

    if (mealError || !planMeal) {
      return NextResponse.json(
        { success: false, error: 'Refeição do plano não encontrada' },
        { status: 404 }
      )
    }

    // Verificar se o plano pertence ao usuário
    if (planMeal.meal_plan_day?.meal_plan?.client_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado' },
        { status: 403 }
      )
    }

    // Status de aderência ao plano (colunas da fase 4; insert tem fallback)
    const adherenceStatus = skipped
      ? 'pulou'
      : (adherence === 'substituiu' ? 'substituiu' : 'seguiu')

    // Usar os alimentos do plano ou os alimentos completados
    const foodsToRegister = skipped ? [] : (completedFoods || planMeal.foods || [])

    // Calcular totais
    const totalCalories = foodsToRegister.reduce((sum: number, f: { calories?: number }) => sum + (f.calories || 0), 0)
    const totalProtein = foodsToRegister.reduce((sum: number, f: { protein?: number }) => sum + (f.protein || 0), 0)
    const totalCarbs = foodsToRegister.reduce((sum: number, f: { carbs?: number }) => sum + (f.carbs || 0), 0)
    const totalFat = foodsToRegister.reduce((sum: number, f: { fat?: number }) => sum + (f.fat || 0), 0)

    const baseMealRow = {
      user_id: user.id,
      // Diário do paciente é PT canônico; o plano usa EN internamente
      tipo_refeicao: mealTypeToPT(planMeal.meal_type),
      data: date,
      horario: planMeal.scheduled_time?.substring(0, 5) || new Date().toTimeString().substring(0, 5),
      status: skipped ? 'pulado' : 'concluido',
      calorias_total: totalCalories,
      proteinas_total: totalProtein,
      carboidratos_total: totalCarbs,
      gorduras_total: totalFat,
      notas: skipped
        ? `[Refeição pulada] ${planMeal.meal_name || planMeal.meal_type}`
        : (notes || `Refeição do plano: ${planMeal.meal_name || planMeal.meal_type}${usedAlternative ? ' (alternativa)' : ''}`)
    }

    // Insert com as colunas de aderência (fase 4); se a migration ainda não
    // rodou (coluna inexistente, 42703), refaz sem elas para não quebrar.
    let meal = null
    let createError = null
    {
      const res = await admin
        .from('fitness_meals')
        .insert({ ...baseMealRow, plan_meal_id: planMealId, adherence_status: adherenceStatus })
        .select()
        .single()
      meal = res.data
      createError = res.error
      if (createError && (createError.code === '42703' || createError.code === 'PGRST204')) {
        const retry = await admin.from('fitness_meals').insert(baseMealRow).select().single()
        meal = retry.data
        createError = retry.error
      }
    }

    if (createError) {
      console.error('Erro ao criar refeição:', createError)
      return NextResponse.json(
        { success: false, error: 'Erro ao registrar refeição: ' + createError.message },
        { status: 500 }
      )
    }

    // Criar itens da refeição em lote (ou todos, ou nenhum)
    if (foodsToRegister.length > 0) {
      const itemsToInsert = foodsToRegister.map((food: {
        name?: string; quantity?: number; unit?: string
        calories?: number; protein?: number; carbs?: number; fat?: number
      }) => ({
        meal_id: meal.id,
        nome_alimento: food.name || 'Alimento',
        quantidade: food.quantity ?? 100,
        unidade: food.unit || 'g',
        calorias: food.calories || 0,
        proteinas: food.protein || 0,
        carboidratos: food.carbs || 0,
        gorduras: food.fat || 0
      }))

      const { error: itemsError } = await admin
        .from('fitness_meal_items')
        .insert(itemsToInsert)

      if (itemsError) {
        console.error('Erro ao salvar itens da refeição do plano:', itemsError)
        await admin.from('fitness_meals').delete().eq('id', meal.id)
        return NextResponse.json(
          { success: false, error: 'Erro ao registrar itens da refeição' },
          { status: 500 }
        )
      }
    }

    // Os 10 pts de "Todas refeicoes registradas" são creditados pelo TRIGGER
    // no banco (fn_auto_award_meals_logged), com reference_date = data da
    // refeição. NÃO creditar aqui de novo: o award manual usava reference_date =
    // hoje, o que duplicava (data≠hoje) e ainda ocupava o slot de hoje,
    // fazendo o crédito legítimo de hoje ser perdido no ON CONFLICT.

    return NextResponse.json({
      success: true,
      meal,
      message: skipped ? 'Refeição marcada como pulada' : 'Refeição registrada com sucesso'
    })

  } catch (error) {
    console.error('Erro ao processar requisição:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// GET - Buscar refeições completadas do plano em uma data
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

    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') || getTodayDateSP()

    // Buscar refeições completadas nesta data COM os itens (alimentos reais consumidos)
    const { data: completedMeals, error } = await admin
      .from('fitness_meals')
      .select(`
        id,
        tipo_refeicao,
        status,
        notas,
        horario,
        calorias_total,
        proteinas_total,
        carboidratos_total,
        gorduras_total,
        fitness_meal_items (
          id,
          nome_alimento,
          quantidade,
          unidade,
          calorias,
          proteinas,
          carboidratos,
          gorduras
        )
      `)
      .eq('user_id', user.id)
      .eq('data', date)

    if (error) {
      console.error('Erro ao buscar refeições completadas:', error)
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar refeições' },
        { status: 500 }
      )
    }

    const allMeals = completedMeals || []
    const doneMeals = allMeals.filter(m => m.status !== 'pulado')
    const skippedMeals = allMeals.filter(m => m.status === 'pulado')

    // Formatar dados das refeições completadas com os alimentos reais
    const completedMealsData: Record<string, {
      id: string
      meal_type: string
      time: string
      total_calories: number
      total_protein: number
      total_carbs: number
      total_fat: number
      foods: Array<{
        name: string
        quantity: number
        unit: string
        calories: number
        protein: number
        carbs: number
        fat: number
      }>
      notes?: string
    }> = {}

    for (const meal of doneMeals) {
      // Resposta no vocabulário do PLANO (EN) — é o que o card compara.
      // Cobre tanto linhas novas (PT) quanto antigas (EN) pré-migration.
      const planType = mealTypeToEN(meal.tipo_refeicao)
      completedMealsData[planType] = {
        id: meal.id,
        meal_type: planType,
        time: meal.horario || '',
        total_calories: meal.calorias_total || 0,
        total_protein: meal.proteinas_total || 0,
        total_carbs: meal.carboidratos_total || 0,
        total_fat: meal.gorduras_total || 0,
        foods: (meal.fitness_meal_items || []).map((item: {
          nome_alimento: string
          quantidade: number
          unidade: string
          calorias: number
          proteinas: number
          carboidratos: number
          gorduras: number
        }) => ({
          name: item.nome_alimento,
          quantity: item.quantidade,
          unit: item.unidade || 'g',
          calories: item.calorias || 0,
          protein: item.proteinas || 0,
          carbs: item.carboidratos || 0,
          fat: item.gorduras || 0
        })),
        notes: meal.notas
      }
    }

    return NextResponse.json({
      success: true,
      completedMealIds: Object.keys(completedMealsData),
      completedMealTypes: doneMeals.map(m => mealTypeToEN(m.tipo_refeicao)),
      skippedMealTypes: skippedMeals.map(m => mealTypeToEN(m.tipo_refeicao)),
      completedMealsData // Dados completos das refeições com alimentos reais
    })

  } catch (error) {
    console.error('Erro ao processar requisição:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
