/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { awardPointsServer } from '@/lib/services/points-server'
import { getTodayDateSP, getDateOffsetSP } from '@/lib/utils/date'

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

/** Datas (YYYY-MM-DD) de weekStart até weekEnd inclusive. */
function datesBetween(weekStart: string, weekEnd: string): string[] {
  const out: string[] = []
  const cur = new Date(weekStart + 'T12:00:00Z')
  const end = new Date(weekEnd + 'T12:00:00Z')
  while (cur <= end) {
    out.push(cur.toISOString().slice(0, 10))
    cur.setUTCDate(cur.getUTCDate() + 1)
  }
  return out
}

/**
 * Weekly Adherence Bonus — Runs every Monday at 02:00 UTC (23:00 Sunday BRT).
 *
 * Para pacientes COM plano alimentar ativo: aderência REAL — % das refeições
 * prescritas que foram seguidas ou substituídas com registro (refeições
 * puladas/não registradas não contam). Grava o detalhamento diário em
 * fitness_meal_plan_adherence e premia 10 pts quando a média semanal >= 80%.
 *
 * Para pacientes SEM plano: critério legado — >=80% dos dias (6 de 7) com
 * 3+ refeições registradas.
 *
 * Dedup por reference_id = "wkadh-{weekStart}".
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = getAdminClient()

    // Janela: semana Seg-Dom que acabou (em America/Sao_Paulo)
    const weekEnd = getTodayDateSP()
    const weekStart = getDateOffsetSP(-6)
    const referenceId = `wkadh-${weekStart}`
    const weekDates = datesBetween(weekStart, weekEnd)

    const { data: clients } = await db
      .from('fitness_profiles')
      .select('id')
      .eq('role', 'client')

    if (!clients || clients.length === 0) {
      return NextResponse.json({ success: true, weekStart, weekEnd, awarded: 0, message: 'No clients' })
    }

    let awardedCount = 0
    let skippedCount = 0
    let realAdherenceCount = 0
    let legacyCount = 0

    for (const client of clients) {
      try {
        // Refeições registradas na semana
        const { data: meals } = await db
          .from('fitness_meals')
          .select('data, status, tipo_refeicao, plan_meal_id, adherence_status, calorias_total')
          .eq('user_id', client.id)
          .gte('data', weekStart)
          .lte('data', weekEnd)

        const weekMeals = meals || []

        // Plano alimentar ativo do paciente
        const { data: plan } = await db
          .from('fitness_meal_plans')
          .select('id')
          .eq('client_id', client.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        let qualifies = false

        if (plan) {
          // ===== Aderência REAL ao plano =====
          realAdherenceCount++

          const { data: days } = await db
            .from('fitness_meal_plan_days')
            .select('id, day_of_week')
            .eq('meal_plan_id', plan.id)

          const dayIds = (days || []).map(d => d.id)
          const { data: planMeals } = dayIds.length > 0
            ? await db
                .from('fitness_meal_plan_meals')
                .select('id, meal_plan_day_id, meal_type, is_optional')
                .in('meal_plan_day_id', dayIds)
            : { data: [] }

          const dayByDow: Record<number, { planIds: Set<string>; types: Set<string> }> = {}
          for (const d of (days || [])) {
            const mealsOfDay = (planMeals || []).filter(m => m.meal_plan_day_id === d.id && !m.is_optional)
            dayByDow[d.day_of_week] = {
              planIds: new Set(mealsOfDay.map(m => m.id)),
              types: new Set(mealsOfDay.map(m => m.meal_type)),
            }
          }

          let pctSum = 0
          let pctDays = 0

          for (const date of weekDates) {
            const dow = new Date(date + 'T12:00:00Z').getUTCDay()
            const planned = dayByDow[dow]
            const plannedCount = planned ? planned.planIds.size : 0
            const dateMeals = weekMeals.filter(m => m.data === date)
            const caloriesConsumed = dateMeals
              .filter(m => m.status !== 'pulado')
              .reduce((sum, m) => sum + (Number(m.calorias_total) || 0), 0)

            let completedCount = 0
            if (planned && plannedCount > 0) {
              const satisfiedPlanIds = new Set<string>()
              const satisfiedTypes = new Set<string>()
              for (const m of dateMeals) {
                if (m.status === 'pulado') continue
                if (m.adherence_status === 'pulou') continue
                if (m.plan_meal_id && planned.planIds.has(m.plan_meal_id)) {
                  satisfiedPlanIds.add(m.plan_meal_id)
                } else if (planned.types.has(m.tipo_refeicao)) {
                  // fallback para registros antigos sem plan_meal_id
                  satisfiedTypes.add(m.tipo_refeicao)
                }
              }
              completedCount = Math.min(plannedCount, satisfiedPlanIds.size + satisfiedTypes.size)
              pctSum += (completedCount / plannedCount) * 100
              pctDays++
            }

            // Grava o dia na tabela de aderência (upsert idempotente)
            const { error: upsertError } = await db
              .from('fitness_meal_plan_adherence')
              .upsert({
                meal_plan_id: plan.id,
                client_id: client.id,
                date,
                meals_planned: plannedCount,
                meals_completed: completedCount,
                adherence_percentage: plannedCount > 0
                  ? Math.round((completedCount / plannedCount) * 10000) / 100
                  : null,
                calories_consumed: Math.round(caloriesConsumed),
              }, { onConflict: 'meal_plan_id,client_id,date' })
            if (upsertError) {
              console.error(`Erro no upsert de aderência (${client.id} ${date}):`, upsertError)
            }
          }

          const weeklyPct = pctDays > 0 ? pctSum / pctDays : 0
          qualifies = weeklyPct >= 80
        } else {
          // ===== Critério legado (sem plano): 3+ refeições em >=80% dos dias =====
          legacyCount++
          const perDay: Record<string, number> = {}
          for (const m of weekMeals) {
            if (m.status === 'pulado') continue
            perDay[m.data] = (perDay[m.data] || 0) + 1
          }
          const compliantDays = Object.values(perDay).filter((c) => (c as number) >= 3).length
          qualifies = (compliantDays / 7) * 100 >= 80
        }

        if (qualifies) {
          const result = await awardPointsServer(client.id, 'weekly_adherence', referenceId)
          if (result.success && !result.duplicate) {
            awardedCount++
          } else if (result.duplicate) {
            skippedCount++
          }
        }
      } catch (clientErr) {
        console.error(`Erro ao processar aderência do user ${client.id}:`, clientErr)
      }
    }

    return NextResponse.json({
      success: true,
      weekStart,
      weekEnd,
      total_checked: clients.length,
      with_plan: realAdherenceCount,
      without_plan: legacyCount,
      awarded: awardedCount,
      skipped_duplicates: skippedCount,
    })
  } catch (error) {
    console.error('Weekly adherence cron error:', error)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
