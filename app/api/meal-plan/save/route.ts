import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

// Tipos
interface MealOption {
  option: string
  name: string
  foods: Array<{
    name: string
    quantity?: number
    unit?: string
    calories?: number
    protein?: number
    carbs?: number
    fat?: number
  }>
}

interface MealSlot {
  type: string
  name: string
  time: string
  target_protein?: number
  target_carbs?: number
  target_fat?: number
  is_optional: boolean
  is_training_day_only: boolean
  restrictions?: string[]
  notes?: string
  options: MealOption[]
}

interface ParsedMealPlan {
  name: string
  description?: string
  daily_targets: {
    calories: number
    protein: number
    carbs: number
    fat: number
  }
  special_rules: Array<{
    time?: string
    rule: string
  }>
  meals: MealSlot[]
}

// Mapear tipos de refeição para meal_type do banco
const MEAL_TYPE_MAP: Record<string, string> = {
  'wake_up': 'wake_up',
  'breakfast': 'breakfast',
  'morning_snack': 'morning_snack',
  'lunch': 'lunch',
  'afternoon_snack': 'afternoon_snack',
  'pre_workout': 'pre_workout',
  'dinner': 'dinner',
  'supper': 'supper'
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Admin client for bypassing RLS
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

    // Check permissions
    const { data: profile } = await supabaseAdmin
      .from('fitness_profiles')
      .select('role, email')
      .eq('id', user.id)
      .single()

    const isSuperAdmin = profile?.email === 'felicemed@gmail.com' || profile?.role === 'super_admin'

    const { data: professional } = await supabaseAdmin
      .from('fitness_professionals')
      .select('id, type')
      .eq('user_id', user.id)
      .single()

    const isNutritionist = professional?.type === 'nutritionist'

    if (!isSuperAdmin && !isNutritionist) {
      return NextResponse.json(
        { error: 'Acesso restrito' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { plan, clientId, assignToSelf } = body as {
      plan: ParsedMealPlan
      clientId?: string
      assignToSelf?: boolean
    }

    if (!plan) {
      return NextResponse.json(
        { error: 'Plano alimentar não fornecido' },
        { status: 400 }
      )
    }

    // Determinar o professional_id
    let professionalId = professional?.id

    // Se superadmin sem professional, criar um do tipo "admin" (não aparece no portal)
    if (!professionalId && isSuperAdmin) {
      // Verificar se já existe um professional para este usuário
      const { data: existingProf } = await supabaseAdmin
        .from('fitness_professionals')
        .select('id, type')
        .eq('user_id', user.id)
        .single()

      if (existingProf) {
        professionalId = existingProf.id
      } else {
        // Criar professional do tipo "admin" - NÃO aparece no portal (só nutritionist/trainer)
        const { data: newProf, error: profError } = await supabaseAdmin
          .from('fitness_professionals')
          .insert({
            user_id: user.id,
            type: 'admin', // Tipo especial que não é reconhecido pelo portal
            specialty: 'Administrador do Sistema',
            is_active: false // Inativo para não aparecer em listagens
          })
          .select('id')
          .single()

        if (profError) {
          console.error('Error creating admin professional:', profError)
          return NextResponse.json(
            { error: 'Erro ao criar registro administrativo', details: profError.message },
            { status: 500 }
          )
        }
        professionalId = newProf.id
      }
    }

    // Determinar client_id
    const targetClientId = assignToSelf ? user.id : clientId || null

    // Criar o plano principal
    const { data: mealPlan, error: planError } = await supabaseAdmin
      .from('fitness_meal_plans')
      .insert({
        professional_id: professionalId,
        client_id: targetClientId,
        name: plan.name,
        description: plan.description,
        goal: 'custom',
        calories_target: plan.daily_targets.calories,
        protein_target: plan.daily_targets.protein,
        carbs_target: plan.daily_targets.carbs,
        fat_target: plan.daily_targets.fat,
        is_template: !targetClientId,
        is_active: true,
        notes: plan.special_rules?.map(r => `${r.time ? r.time + ': ' : ''}${r.rule}`).join('\n')
      })
      .select()
      .single()

    if (planError) {
      console.error('Error creating meal plan:', planError)
      return NextResponse.json(
        { error: 'Erro ao criar plano alimentar' },
        { status: 500 }
      )
    }

    // Criar dias da semana (0-6, Dom-Sáb)
    // Para planos sem variação por dia, criar um "dia padrão" ou todos os 7 dias
    const dayPromises = []
    for (let day = 0; day <= 6; day++) {
      const dayName = day === 4 ? 'Quinta-feira (Feirinha)' :
                      day === 1 || day === 6 ? 'Dia de Beach Tennis' : 'Dia Normal'

      dayPromises.push(
        supabaseAdmin
          .from('fitness_meal_plan_days')
          .insert({
            meal_plan_id: mealPlan.id,
            day_of_week: day,
            day_name: dayName,
            calories_target: plan.daily_targets.calories
          })
          .select()
          .single()
      )
    }

    const dayResults = await Promise.all(dayPromises)
    const days = dayResults.map(r => r.data).filter(Boolean)

    if (days.length === 0) {
      console.error('No days created')
      return NextResponse.json(
        { error: 'Erro ao criar dias do plano' },
        { status: 500 }
      )
    }

    // Criar refeições para cada dia
    for (const day of days) {
      if (!day) continue

      const mealPromises = plan.meals.map((meal, index) => {
        // Extrair horário
        const timeMatch = meal.time.match(/(\d{1,2}:\d{2})/)
        const scheduledTime = timeMatch ? timeMatch[1] + ':00' : null

        // Primary option (A) vai em foods, resto em alternatives
        const primaryOption = meal.options[0]
        const alternatives = meal.options.slice(1).map(opt => ({
          option: opt.option,
          name: opt.name,
          foods: opt.foods
        }))

        // Calcular totais aproximados da opção primária
        let totalCalories = 0
        let totalProtein = 0
        let totalCarbs = 0
        let totalFat = 0

        primaryOption?.foods.forEach(food => {
          totalCalories += food.calories || 0
          totalProtein += food.protein || 0
          totalCarbs += food.carbs || 0
          totalFat += food.fat || 0
        })

        // Se não tiver valores, usar targets ou calcular a partir de macros
        if (totalProtein === 0 && meal.target_protein) {
          totalProtein = meal.target_protein
        }
        if (totalCarbs === 0 && meal.target_carbs) {
          totalCarbs = meal.target_carbs
        }
        if (totalFat === 0 && meal.target_fat) {
          totalFat = meal.target_fat
        }

        // Se não tiver calorias mas tiver macros, calcular aproximadamente
        if (totalCalories === 0 && (totalProtein > 0 || totalCarbs > 0 || totalFat > 0)) {
          totalCalories = Math.round(totalProtein * 4 + totalCarbs * 4 + totalFat * 9)
        }

        return supabaseAdmin
          .from('fitness_meal_plan_meals')
          .insert({
            meal_plan_day_id: day.id,
            meal_type: MEAL_TYPE_MAP[meal.type] || meal.type,
            meal_name: meal.name,
            scheduled_time: scheduledTime,
            foods: primaryOption?.foods || [],
            total_calories: totalCalories,
            total_protein: totalProtein,
            total_carbs: totalCarbs,
            total_fat: totalFat,
            instructions: meal.notes,
            alternatives: alternatives,
            is_optional: meal.is_optional,
            order_index: index
          })
      })

      await Promise.all(mealPromises)
    }

    return NextResponse.json({
      success: true,
      message: 'Plano alimentar salvo com sucesso',
      plan_id: mealPlan.id,
      client_id: targetClientId
    })

  } catch (error) {
    console.error('Save meal plan error:', error)
    return NextResponse.json({
      error: 'Erro interno ao salvar plano alimentar',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
