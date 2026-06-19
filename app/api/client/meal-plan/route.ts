/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { deactivateOtherActivePlans } from '@/lib/meal-plans/ensure-single-active'

// GET - Buscar plano alimentar ativo do cliente
export async function GET() {
  try {
    // Auth: verificar sessão do usuário
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Usar service role para bypass RLS (dados já filtrados por user.id)
    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Buscar plano alimentar ativo do cliente.
    // Usa o mais recente: se houver mais de um plano ativo (ex.: plano antigo
    // não desativado ao atribuir um novo), o paciente vê o último — em vez de
    // .single() quebrar com "múltiplas linhas" e não mostrar nada.
    const { data: plan, error: planError } = await admin
      .from('fitness_meal_plans')
      .select('*')
      .eq('client_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (planError) {
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

    // Auto-correção: garante só um plano ativo por cliente (desativa planos
    // antigos que tenham ficado ativos). Best-effort, não bloqueia a resposta.
    await deactivateOtherActivePlans(admin, plan.client_id, plan.id)

    // Buscar profissional
    let professional = null
    if (plan.professional_id) {
      const { data: prof } = await admin
        .from('fitness_professionals')
        .select('id, display_name, specialty')
        .eq('id', plan.professional_id)
        .single()
      professional = prof
    }

    // Buscar dias do plano
    const { data: days } = await admin
      .from('fitness_meal_plan_days')
      .select('*')
      .eq('meal_plan_id', plan.id)
      .order('day_of_week', { ascending: true })

    // Buscar refeições de cada dia
    const daysWithMeals = await Promise.all(
      (days || []).map(async (day) => {
        const { data: meals } = await admin
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
        professional,
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
