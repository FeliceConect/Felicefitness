/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// Tipos do Supabase serao gerados apos rodar a migration
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

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

    // Criar admin client para bypass de RLS ao buscar clientes
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

    // Verificar se é nutricionista
    const { data: professional } = await supabaseAdmin
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
    let query = supabaseAdmin
      .from('fitness_meal_plans')
      .select('*')
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

    // Buscar dados dos clientes separadamente
    const clientIds = (plans || [])
      .filter(p => p.client_id)
      .map(p => p.client_id)

    const clientsMap: Record<string, { id: string; nome: string; email: string; avatar_url?: string }> = {}

    if (clientIds.length > 0) {
      // Buscar clientes em fitness_profiles
      const { data: clients } = await supabaseAdmin
        .from('fitness_profiles')
        .select('id, nome, email, avatar_url')
        .in('id', clientIds)

      if (clients) {
        clients.forEach(c => {
          clientsMap[c.id] = c
        })
      }

      // Se algum cliente não foi encontrado, tentar buscar no auth.users
      const missingClientIds = clientIds.filter(id => !clientsMap[id])
      if (missingClientIds.length > 0) {
        // Buscar email dos usuários no auth
        for (const clientId of missingClientIds) {
          const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(clientId)
          if (authUser?.user) {
            clientsMap[clientId] = {
              id: clientId,
              nome: authUser.user.user_metadata?.nome || authUser.user.email?.split('@')[0] || 'Cliente',
              email: authUser.user.email || '',
              avatar_url: authUser.user.user_metadata?.avatar_url
            }
          }
        }
      }
    }

    // Adicionar dados do cliente a cada plano
    const plansWithClients = (plans || []).map(p => ({
      ...p,
      client: p.client_id ? clientsMap[p.client_id] || null : null
    }))

    return NextResponse.json({
      success: true,
      plans: plansWithClients
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

    // Criar admin client para bypass de RLS
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

    // Verificar se é nutricionista
    const { data: professional } = await supabaseAdmin
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
    const { data: existingPlan } = await supabaseAdmin
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

    const { data: updatedPlan, error: updateError } = await supabaseAdmin
      .from('fitness_meal_plans')
      .update(updateFields)
      .eq('id', planId)
      .select()
      .single()

    if (updateError) {
      console.error('Erro ao atualizar plano:', updateError)
      return NextResponse.json(
        { success: false, error: 'Erro ao atualizar plano' },
        { status: 500 }
      )
    }

    // Buscar dados do cliente se existir
    let clientData = null
    if (updatedPlan.client_id) {
      const { data: client } = await supabaseAdmin
        .from('fitness_profiles')
        .select('id, nome, email, avatar_url')
        .eq('id', updatedPlan.client_id)
        .single()
      clientData = client
    }

    return NextResponse.json({
      success: true,
      message: 'Plano atualizado com sucesso',
      plan: {
        ...updatedPlan,
        client: clientData
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
