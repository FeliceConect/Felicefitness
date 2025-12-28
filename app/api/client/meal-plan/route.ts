/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Buscar plano alimentar ativo do cliente
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

    // Buscar plano alimentar ativo do cliente
    const { data: plan, error: planError } = await supabase
      .from('fitness_meal_plans')
      .select(`
        *,
        professional:fitness_professionals!professional_id(
          id,
          display_name,
          specialty
        )
      `)
      .eq('client_id', user.id)
      .eq('is_active', true)
      .single()

    if (planError && planError.code !== 'PGRST116') {
      console.error('Erro ao buscar plano:', planError)
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar plano alimentar' },
        { status: 500 }
      )
    }

    if (!plan) {
      return NextResponse.json({
        success: true,
        plan: null,
        message: 'Nenhum plano alimentar ativo encontrado'
      })
    }

    // Buscar dias do plano
    const { data: days } = await supabase
      .from('fitness_meal_plan_days')
      .select('*')
      .eq('meal_plan_id', plan.id)
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
