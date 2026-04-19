/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

/**
 * POST /api/portal/meal-plans/[id]/clone
 *
 * Clona um plano (geralmente um template) para atribuir a um paciente.
 * O novo plano vira um plano comum (is_template=false, is_active=true) vinculado
 * ao clientId informado, preservando dias, refeições, foods e alternatives.
 *
 * Body: { clientId?: string, name?: string }
 * - Se clientId não for fornecido, o clone mantém client_id=NULL (útil pra
 *   duplicar um template num novo template).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
    }

    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

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

    const body = await request.json().catch(() => ({}))
    const clientId: string | null = body.clientId || null
    const customName: string | null = body.name || null

    // Plano original (precisa pertencer ao profissional)
    const { data: srcPlan, error: srcErr } = await supabaseAdmin
      .from('fitness_meal_plans')
      .select('*')
      .eq('id', id)
      .eq('professional_id', professional.id)
      .single()

    if (srcErr || !srcPlan) {
      return NextResponse.json(
        { success: false, error: 'Plano original não encontrado' },
        { status: 404 }
      )
    }

    // Criar plano novo
    const { data: newPlan, error: insertErr } = await supabaseAdmin
      .from('fitness_meal_plans')
      .insert({
        professional_id: professional.id,
        client_id: clientId,
        name: customName || (clientId ? srcPlan.name : `${srcPlan.name} (cópia)`),
        description: srcPlan.description,
        goal: srcPlan.goal,
        calories_target: srcPlan.calories_target,
        protein_target: srcPlan.protein_target,
        carbs_target: srcPlan.carbs_target,
        fat_target: srcPlan.fat_target,
        fiber_target: srcPlan.fiber_target,
        water_target: srcPlan.water_target,
        duration_weeks: srcPlan.duration_weeks,
        is_template: clientId ? false : srcPlan.is_template,
        is_active: true,
        notes: srcPlan.notes
      })
      .select()
      .single()

    if (insertErr || !newPlan) {
      console.error('Erro ao clonar plano:', insertErr)
      return NextResponse.json(
        { success: false, error: 'Erro ao clonar plano' },
        { status: 500 }
      )
    }

    // Copiar dias + refeições
    const { data: srcDays } = await supabaseAdmin
      .from('fitness_meal_plan_days')
      .select('*')
      .eq('meal_plan_id', id)
      .order('day_of_week', { ascending: true })

    for (const srcDay of srcDays || []) {
      const { data: newDay, error: dayErr } = await supabaseAdmin
        .from('fitness_meal_plan_days')
        .insert({
          meal_plan_id: newPlan.id,
          day_of_week: srcDay.day_of_week,
          day_name: srcDay.day_name,
          calories_target: srcDay.calories_target,
          notes: srcDay.notes
        })
        .select()
        .single()

      if (dayErr || !newDay) continue

      const { data: srcMeals } = await supabaseAdmin
        .from('fitness_meal_plan_meals')
        .select('*')
        .eq('meal_plan_day_id', srcDay.id)
        .order('order_index', { ascending: true })

      if (srcMeals && srcMeals.length > 0) {
        const mealsToInsert = srcMeals.map(m => ({
          meal_plan_day_id: newDay.id,
          meal_type: m.meal_type,
          meal_name: m.meal_name,
          scheduled_time: m.scheduled_time,
          foods: m.foods,
          total_calories: m.total_calories,
          total_protein: m.total_protein,
          total_carbs: m.total_carbs,
          total_fat: m.total_fat,
          total_fiber: m.total_fiber,
          instructions: m.instructions,
          alternatives: m.alternatives,
          is_optional: m.is_optional,
          order_index: m.order_index
        }))

        await supabaseAdmin.from('fitness_meal_plan_meals').insert(mealsToInsert)
      }
    }

    return NextResponse.json({
      success: true,
      planId: newPlan.id,
      plan: newPlan
    })
  } catch (error) {
    console.error('Erro em clone:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
