/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST - Registrar refeição do plano como completada
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
    const {
      planMealId,      // ID da refeição do plano
      date,            // Data em que foi feita
      completedFoods,  // Alimentos realmente consumidos (pode ser diferente do plano)
      notes,           // Observações
      usedAlternative  // Se usou alternativa
    } = body

    if (!planMealId || !date) {
      return NextResponse.json(
        { success: false, error: 'Dados obrigatórios faltando' },
        { status: 400 }
      )
    }

    // Buscar a refeição do plano para obter os dados
    const { data: planMeal, error: mealError } = await supabase
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

    // Usar os alimentos do plano ou os alimentos completados
    const foodsToRegister = completedFoods || planMeal.foods || []

    // Calcular totais
    const totalCalories = foodsToRegister.reduce((sum: number, f: { calories?: number }) => sum + (f.calories || 0), 0)
    const totalProtein = foodsToRegister.reduce((sum: number, f: { protein?: number }) => sum + (f.protein || 0), 0)
    const totalCarbs = foodsToRegister.reduce((sum: number, f: { carbs?: number }) => sum + (f.carbs || 0), 0)
    const totalFat = foodsToRegister.reduce((sum: number, f: { fat?: number }) => sum + (f.fat || 0), 0)

    // Criar refeição no fitness_meals
    const { data: meal, error: createError } = await supabase
      .from('fitness_meals')
      .insert({
        user_id: user.id,
        tipo_refeicao: planMeal.meal_type,
        data: date,
        horario: planMeal.scheduled_time?.substring(0, 5) || new Date().toTimeString().substring(0, 5),
        calorias_total: totalCalories,
        proteinas_total: totalProtein,
        carboidratos_total: totalCarbs,
        gorduras_total: totalFat,
        notas: notes || `Refeição do plano: ${planMeal.meal_name || planMeal.meal_type}${usedAlternative ? ' (alternativa)' : ''}`
      })
      .select()
      .single()

    if (createError) {
      console.error('Erro ao criar refeição:', createError)
      return NextResponse.json(
        { success: false, error: 'Erro ao registrar refeição: ' + createError.message },
        { status: 500 }
      )
    }

    // Criar itens da refeição
    for (const food of foodsToRegister) {
      await supabase
        .from('fitness_meal_items')
        .insert({
          meal_id: meal.id,
          nome_alimento: food.name,
          quantidade: food.quantity,
          unidade: food.unit || 'g',
          calorias: food.calories || 0,
          proteinas: food.protein || 0,
          carboidratos: food.carbs || 0,
          gorduras: food.fat || 0
        })
    }

    return NextResponse.json({
      success: true,
      meal,
      message: 'Refeição registrada com sucesso'
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

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]

    // Buscar refeições completadas nesta data COM os itens (alimentos reais consumidos)
    const { data: completedMeals, error } = await supabase
      .from('fitness_meals')
      .select(`
        id,
        tipo_refeicao,
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

    for (const meal of completedMeals || []) {
      completedMealsData[meal.tipo_refeicao] = {
        id: meal.id,
        meal_type: meal.tipo_refeicao,
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
      completedMealTypes: (completedMeals || []).map(m => m.tipo_refeicao),
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
