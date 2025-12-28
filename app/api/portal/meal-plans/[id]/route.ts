// @ts-nocheck - Tipos do Supabase serao gerados apos rodar a migration
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Buscar plano alimentar completo com dias e refeições
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Verificar se é nutricionista ou cliente do plano
    const { data: professional } = await supabase
      .from('fitness_professionals')
      .select('id, type')
      .eq('user_id', user.id)
      .single()

    // Buscar plano
    const { data: plan, error: planError } = await supabase
      .from('fitness_meal_plans')
      .select(`
        *,
        client:fitness_profiles!client_id(id, nome, email)
      `)
      .eq('id', id)
      .single()

    if (planError || !plan) {
      return NextResponse.json(
        { success: false, error: 'Plano não encontrado' },
        { status: 404 }
      )
    }

    // Verificar permissão
    const isProfessionalOwner = professional && plan.professional_id === professional.id
    const isClient = plan.client_id === user.id

    if (!isProfessionalOwner && !isClient) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado' },
        { status: 403 }
      )
    }

    // Buscar dias do plano
    const { data: days } = await supabase
      .from('fitness_meal_plan_days')
      .select('*')
      .eq('meal_plan_id', id)
      .order('day_of_week', { ascending: true })

    // Buscar refeições de cada dia
    const daysWithMeals = await Promise.all(
      (days || []).map(async (day) => {
        const { data: meals } = await supabase
          .from('fitness_meal_plan_meals')
          .select('*')
          .eq('meal_plan_day_id', day.id)
          .order('order_index', { ascending: true })

        return {
          ...day,
          meals: meals || []
        }
      })
    )

    return NextResponse.json({
      success: true,
      plan: {
        ...plan,
        days: daysWithMeals
      }
    })

  } catch (error) {
    console.error('Erro ao processar requisição:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar plano completo (incluindo dias e refeições)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Verificar se é nutricionista
    const { data: professional } = await supabase
      .from('fitness_professionals')
      .select('id, type')
      .eq('user_id', user.id)
      .single()

    if (!professional || professional.type !== 'nutritionist') {
      return NextResponse.json(
        { success: false, error: 'Acesso restrito a nutricionistas' },
        { status: 403 }
      )
    }

    // Verificar se o plano pertence ao profissional
    const { data: existingPlan } = await supabase
      .from('fitness_meal_plans')
      .select('id')
      .eq('id', id)
      .eq('professional_id', professional.id)
      .single()

    if (!existingPlan) {
      return NextResponse.json(
        { success: false, error: 'Plano não encontrado' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { days, ...planData } = body

    // Atualizar dados do plano
    const updateFields: Record<string, unknown> = {}
    if (planData.name !== undefined) updateFields.name = planData.name
    if (planData.description !== undefined) updateFields.description = planData.description
    if (planData.clientId !== undefined) updateFields.client_id = planData.clientId
    if (planData.goal !== undefined) updateFields.goal = planData.goal
    if (planData.caloriesTarget !== undefined) updateFields.calories_target = planData.caloriesTarget
    if (planData.proteinTarget !== undefined) updateFields.protein_target = planData.proteinTarget
    if (planData.carbsTarget !== undefined) updateFields.carbs_target = planData.carbsTarget
    if (planData.fatTarget !== undefined) updateFields.fat_target = planData.fatTarget
    if (planData.fiberTarget !== undefined) updateFields.fiber_target = planData.fiberTarget
    if (planData.waterTarget !== undefined) updateFields.water_target = planData.waterTarget
    if (planData.durationWeeks !== undefined) updateFields.duration_weeks = planData.durationWeeks
    if (planData.isActive !== undefined) updateFields.is_active = planData.isActive
    if (planData.startsAt !== undefined) updateFields.starts_at = planData.startsAt
    if (planData.endsAt !== undefined) updateFields.ends_at = planData.endsAt
    if (planData.notes !== undefined) updateFields.notes = planData.notes

    if (Object.keys(updateFields).length > 0) {
      await supabase
        .from('fitness_meal_plans')
        .update(updateFields)
        .eq('id', id)
    }

    // Se dias foram fornecidos, atualizar estrutura
    if (days && Array.isArray(days)) {
      // Deletar dias existentes (cascata remove refeições)
      await supabase
        .from('fitness_meal_plan_days')
        .delete()
        .eq('meal_plan_id', id)

      // Criar novos dias e refeições
      for (const day of days) {
        const { data: planDay, error: dayError } = await supabase
          .from('fitness_meal_plan_days')
          .insert({
            meal_plan_id: id,
            day_of_week: day.dayOfWeek ?? day.day_of_week,
            day_name: day.dayName ?? day.day_name,
            calories_target: day.caloriesTarget ?? day.calories_target,
            notes: day.notes
          })
          .select()
          .single()

        if (dayError) {
          console.error('Erro ao criar dia:', dayError)
          continue
        }

        // Criar refeições do dia
        const meals = day.meals || []
        for (const meal of meals) {
          await supabase
            .from('fitness_meal_plan_meals')
            .insert({
              meal_plan_day_id: planDay.id,
              meal_type: meal.mealType ?? meal.meal_type,
              meal_name: meal.mealName ?? meal.meal_name,
              scheduled_time: meal.scheduledTime ?? meal.scheduled_time,
              foods: meal.foods || [],
              total_calories: meal.totalCalories ?? meal.total_calories,
              total_protein: meal.totalProtein ?? meal.total_protein,
              total_carbs: meal.totalCarbs ?? meal.total_carbs,
              total_fat: meal.totalFat ?? meal.total_fat,
              total_fiber: meal.totalFiber ?? meal.total_fiber,
              instructions: meal.instructions,
              alternatives: meal.alternatives || [],
              is_optional: meal.isOptional ?? meal.is_optional ?? false,
              order_index: meal.orderIndex ?? meal.order_index ?? 0
            })
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Plano atualizado com sucesso'
    })

  } catch (error) {
    console.error('Erro ao processar requisição:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Remover plano
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Verificar se é nutricionista
    const { data: professional } = await supabase
      .from('fitness_professionals')
      .select('id, type')
      .eq('user_id', user.id)
      .single()

    if (!professional || professional.type !== 'nutritionist') {
      return NextResponse.json(
        { success: false, error: 'Acesso restrito a nutricionistas' },
        { status: 403 }
      )
    }

    // Verificar se o plano pertence ao profissional
    const { data: existingPlan } = await supabase
      .from('fitness_meal_plans')
      .select('id')
      .eq('id', id)
      .eq('professional_id', professional.id)
      .single()

    if (!existingPlan) {
      return NextResponse.json(
        { success: false, error: 'Plano não encontrado' },
        { status: 404 }
      )
    }

    // Deletar plano
    const { error: deleteError } = await supabase
      .from('fitness_meal_plans')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Erro ao deletar plano:', deleteError)
      return NextResponse.json(
        { success: false, error: 'Erro ao deletar plano' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Plano removido com sucesso'
    })

  } catch (error) {
    console.error('Erro ao processar requisição:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
