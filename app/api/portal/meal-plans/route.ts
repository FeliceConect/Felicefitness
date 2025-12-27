// @ts-nocheck - Tipos do Supabase serao gerados apos rodar a migration
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Listar planos alimentares do profissional
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

    // Parâmetros de busca
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')
    const templateOnly = searchParams.get('templateOnly') === 'true'
    const activeOnly = searchParams.get('activeOnly') === 'true'

    // Buscar planos
    let query = supabase
      .from('fitness_meal_plans')
      .select(`
        *,
        client:fitness_profiles!client_id(id, nome, email, avatar_url)
      `)
      .eq('professional_id', professional.id)
      .order('created_at', { ascending: false })

    if (clientId) {
      query = query.eq('client_id', clientId)
    }

    if (templateOnly) {
      query = query.eq('is_template', true)
    }

    if (activeOnly) {
      query = query.eq('is_active', true)
    }

    const { data: plans, error } = await query

    if (error) {
      console.error('Erro ao buscar planos:', error)
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar planos alimentares' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      plans: plans || []
    })

  } catch (error) {
    console.error('Erro ao processar requisição:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Criar novo plano alimentar
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

    const body = await request.json()
    const {
      name,
      description,
      clientId,
      goal,
      caloriesTarget,
      proteinTarget,
      carbsTarget,
      fatTarget,
      fiberTarget,
      waterTarget,
      durationWeeks,
      isTemplate,
      startsAt,
      endsAt,
      notes,
      days // Array de dias com refeições
    } = body

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Nome do plano é obrigatório' },
        { status: 400 }
      )
    }

    // Criar plano
    const { data: plan, error: planError } = await supabase
      .from('fitness_meal_plans')
      .insert({
        professional_id: professional.id,
        client_id: clientId || null,
        name,
        description,
        goal,
        calories_target: caloriesTarget,
        protein_target: proteinTarget,
        carbs_target: carbsTarget,
        fat_target: fatTarget,
        fiber_target: fiberTarget,
        water_target: waterTarget,
        duration_weeks: durationWeeks || 4,
        is_template: isTemplate || false,
        is_active: true,
        starts_at: startsAt,
        ends_at: endsAt,
        notes
      })
      .select()
      .single()

    if (planError) {
      console.error('Erro ao criar plano:', planError)
      return NextResponse.json(
        { success: false, error: 'Erro ao criar plano alimentar' },
        { status: 500 }
      )
    }

    // Criar dias e refeições se fornecidos
    if (days && Array.isArray(days)) {
      for (const day of days) {
        const { data: planDay, error: dayError } = await supabase
          .from('fitness_meal_plan_days')
          .insert({
            meal_plan_id: plan.id,
            day_of_week: day.dayOfWeek,
            day_name: day.dayName,
            calories_target: day.caloriesTarget,
            notes: day.notes
          })
          .select()
          .single()

        if (dayError) {
          console.error('Erro ao criar dia:', dayError)
          continue
        }

        // Criar refeições do dia
        if (day.meals && Array.isArray(day.meals)) {
          for (const meal of day.meals) {
            await supabase
              .from('fitness_meal_plan_meals')
              .insert({
                meal_plan_day_id: planDay.id,
                meal_type: meal.mealType,
                meal_name: meal.mealName,
                scheduled_time: meal.scheduledTime,
                foods: meal.foods || [],
                total_calories: meal.totalCalories,
                total_protein: meal.totalProtein,
                total_carbs: meal.totalCarbs,
                total_fat: meal.totalFat,
                total_fiber: meal.totalFiber,
                instructions: meal.instructions,
                alternatives: meal.alternatives || [],
                is_optional: meal.isOptional || false,
                order_index: meal.orderIndex || 0
              })
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      plan,
      message: 'Plano alimentar criado com sucesso'
    })

  } catch (error) {
    console.error('Erro ao processar requisição:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PATCH - Atualizar plano alimentar
export async function PATCH(request: NextRequest) {
  try {
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

    const body = await request.json()
    const { planId, ...updateData } = body

    if (!planId) {
      return NextResponse.json(
        { success: false, error: 'ID do plano é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se o plano pertence ao profissional
    const { data: existingPlan } = await supabase
      .from('fitness_meal_plans')
      .select('id')
      .eq('id', planId)
      .eq('professional_id', professional.id)
      .single()

    if (!existingPlan) {
      return NextResponse.json(
        { success: false, error: 'Plano não encontrado' },
        { status: 404 }
      )
    }

    // Preparar dados para atualização
    const updateFields: Record<string, unknown> = {}
    if (updateData.name !== undefined) updateFields.name = updateData.name
    if (updateData.description !== undefined) updateFields.description = updateData.description
    if (updateData.clientId !== undefined) updateFields.client_id = updateData.clientId
    if (updateData.goal !== undefined) updateFields.goal = updateData.goal
    if (updateData.caloriesTarget !== undefined) updateFields.calories_target = updateData.caloriesTarget
    if (updateData.proteinTarget !== undefined) updateFields.protein_target = updateData.proteinTarget
    if (updateData.carbsTarget !== undefined) updateFields.carbs_target = updateData.carbsTarget
    if (updateData.fatTarget !== undefined) updateFields.fat_target = updateData.fatTarget
    if (updateData.fiberTarget !== undefined) updateFields.fiber_target = updateData.fiberTarget
    if (updateData.waterTarget !== undefined) updateFields.water_target = updateData.waterTarget
    if (updateData.durationWeeks !== undefined) updateFields.duration_weeks = updateData.durationWeeks
    if (updateData.isActive !== undefined) updateFields.is_active = updateData.isActive
    if (updateData.startsAt !== undefined) updateFields.starts_at = updateData.startsAt
    if (updateData.endsAt !== undefined) updateFields.ends_at = updateData.endsAt
    if (updateData.notes !== undefined) updateFields.notes = updateData.notes

    const { error: updateError } = await supabase
      .from('fitness_meal_plans')
      .update(updateFields)
      .eq('id', planId)

    if (updateError) {
      console.error('Erro ao atualizar plano:', updateError)
      return NextResponse.json(
        { success: false, error: 'Erro ao atualizar plano' },
        { status: 500 }
      )
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

// DELETE - Remover plano alimentar
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

    const { searchParams } = new URL(request.url)
    const planId = searchParams.get('id')

    if (!planId) {
      return NextResponse.json(
        { success: false, error: 'ID do plano é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se o plano pertence ao profissional
    const { data: existingPlan } = await supabase
      .from('fitness_meal_plans')
      .select('id')
      .eq('id', planId)
      .eq('professional_id', professional.id)
      .single()

    if (!existingPlan) {
      return NextResponse.json(
        { success: false, error: 'Plano não encontrado' },
        { status: 404 }
      )
    }

    // Deletar plano (cascata remove dias e refeições)
    const { error: deleteError } = await supabase
      .from('fitness_meal_plans')
      .delete()
      .eq('id', planId)

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
