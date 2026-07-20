/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { getTodayDateSP, getDateOffsetSP } from '@/lib/utils/date'

/**
 * GET /api/portal/adherence?clientId=...&days=7
 *
 * Aderência REAL do paciente ao plano alimentar, calculada ao vivo dos
 * registros: por dia, cada refeição prescrita vira
 *   seguiu | substituiu | pulou | nao_registrado
 * com o que foi realmente consumido quando houve substituição.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
    }

    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data: professional } = await admin
      .from('fitness_professionals')
      .select('id, type')
      .eq('user_id', user.id)
      .single()

    if (!professional || !['nutritionist', 'super_admin'].includes(professional.type)) {
      return NextResponse.json({ success: false, error: 'Acesso restrito' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')
    const daysWindow = Math.min(parseInt(searchParams.get('days') || '7'), 30)
    if (!clientId) {
      return NextResponse.json({ success: false, error: 'clientId obrigatório' }, { status: 400 })
    }

    // Vínculo profissional-paciente obrigatório (super_admin vê todos)
    if (professional.type !== 'super_admin') {
      const { data: assignment } = await admin
        .from('fitness_client_assignments')
        .select('client_id')
        .eq('professional_id', professional.id)
        .eq('client_id', clientId)
        .eq('is_active', true)
        .maybeSingle()

      if (!assignment) {
        return NextResponse.json({ success: false, error: 'Paciente não vinculado' }, { status: 403 })
      }
    }

    // Plano ativo do paciente
    const { data: plan } = await admin
      .from('fitness_meal_plans')
      .select('id, name')
      .eq('client_id', clientId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!plan) {
      return NextResponse.json({ success: true, plan: null, days: [], summary: null })
    }

    // Estrutura do plano (dias + refeições não-opcionais)
    const { data: planDays } = await admin
      .from('fitness_meal_plan_days')
      .select('id, day_of_week')
      .eq('meal_plan_id', plan.id)

    const dayIds = (planDays || []).map(d => d.id)
    const { data: planMeals } = dayIds.length > 0
      ? await admin
          .from('fitness_meal_plan_meals')
          .select('id, meal_plan_day_id, meal_type, meal_name, scheduled_time, is_optional')
          .in('meal_plan_day_id', dayIds)
          .order('order_index', { ascending: true })
      : { data: [] }

    const mealsByDow: Record<number, Array<{ id: string; meal_type: string; meal_name: string | null; scheduled_time: string | null }>> = {}
    for (const d of (planDays || [])) {
      mealsByDow[d.day_of_week] = (planMeals || [])
        .filter(m => m.meal_plan_day_id === d.id && !m.is_optional)
        .map(m => ({ id: m.id, meal_type: m.meal_type, meal_name: m.meal_name, scheduled_time: m.scheduled_time }))
    }

    // Registros do paciente na janela
    const endDate = getTodayDateSP()
    const startDate = getDateOffsetSP(-(daysWindow - 1))
    const { data: loggedMeals } = await admin
      .from('fitness_meals')
      .select(`
        id, data, status, tipo_refeicao, plan_meal_id, adherence_status,
        calorias_total, notas,
        fitness_meal_items ( nome_alimento, quantidade, unidade, calorias )
      `)
      .eq('user_id', clientId)
      .gte('data', startDate)
      .lte('data', endDate)
      .order('data', { ascending: false })

    const logged = loggedMeals || []

    // Monta o dia a dia
    const days = []
    const counters = { seguiu: 0, substituiu: 0, pulou: 0, nao_registrado: 0 }
    let pctSum = 0
    let pctDays = 0

    for (let offset = 0; offset < daysWindow; offset++) {
      const date = getDateOffsetSP(-offset)
      const dow = new Date(date + 'T12:00:00Z').getUTCDay()
      const planned = mealsByDow[dow] || []
      if (planned.length === 0) continue

      const dateMeals = logged.filter(m => m.data === date)
      const usedMealIds = new Set<string>()

      const mealStatuses = planned.map(pm => {
        // 1º: match por plan_meal_id; 2º: por tipo_refeicao (registros antigos)
        const match =
          dateMeals.find(m => m.plan_meal_id === pm.id && !usedMealIds.has(m.id)) ||
          dateMeals.find(m => m.tipo_refeicao === pm.meal_type && !usedMealIds.has(m.id))

        if (!match) {
          counters.nao_registrado++
          return { plan_meal_id: pm.id, meal_type: pm.meal_type, meal_name: pm.meal_name, scheduled_time: pm.scheduled_time, status: 'nao_registrado', consumed: null }
        }
        usedMealIds.add(match.id)

        let status: string
        if (match.status === 'pulado' || match.adherence_status === 'pulou') {
          status = 'pulou'
        } else if (match.adherence_status === 'substituiu') {
          status = 'substituiu'
        } else if (match.adherence_status === 'seguiu') {
          status = 'seguiu'
        } else {
          // registro antigo sem status: considera seguiu se veio marcado do plano
          status = match.plan_meal_id ? 'seguiu' : 'substituiu'
        }
        counters[status === 'pulou' ? 'pulou' : status === 'substituiu' ? 'substituiu' : 'seguiu']++

        return {
          plan_meal_id: pm.id,
          meal_type: pm.meal_type,
          meal_name: pm.meal_name,
          scheduled_time: pm.scheduled_time,
          status,
          consumed: status === 'pulou' ? null : {
            calories: Number(match.calorias_total) || 0,
            notes: match.notas,
            foods: (match.fitness_meal_items || []).map(i => ({
              name: i.nome_alimento,
              quantity: i.quantidade,
              unit: i.unidade || 'g',
              calories: Number(i.calorias) || 0,
            })),
          },
        }
      })

      const completed = mealStatuses.filter(m => m.status === 'seguiu' || m.status === 'substituiu').length
      const pct = planned.length > 0 ? (completed / planned.length) * 100 : 0
      pctSum += pct
      pctDays++

      days.push({
        date,
        day_of_week: dow,
        planned: planned.length,
        completed,
        pct: Math.round(pct),
        meals: mealStatuses,
      })
    }

    return NextResponse.json({
      success: true,
      plan: { id: plan.id, name: plan.name },
      days,
      summary: {
        avg_pct: pctDays > 0 ? Math.round(pctSum / pctDays) : 0,
        ...counters,
      },
    })
  } catch (error) {
    console.error('Erro ao calcular aderência:', error)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}
