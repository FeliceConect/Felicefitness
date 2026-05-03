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

/**
 * Weekly Adherence Bonus — Runs every Monday at 02:00 UTC (23:00 Sunday BRT).
 *
 * Para cada paciente ativo, avalia a semana que acabou de fechar (Seg-Dom)
 * pelo critério: >=80% dos dias com 3+ refeições registradas. Quem bate
 * recebe 10 pts (categoria nutrition). Dedup por reference_id =
 * "wkadh-{weekStart}" — roda uma vez por semana sem risco de duplicar.
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = getAdminClient()

    // Janela: semana Seg-Dom que acabou (em America/Sao_Paulo)
    // O cron dispara Monday 02:00 UTC = Sunday 23:00 BRT.
    // "Hoje" no fuso BRT ainda é domingo; voltar 6 dias chega na segunda.
    const weekEnd = getTodayDateSP()
    const weekStart = getDateOffsetSP(-6)
    const referenceId = `wkadh-${weekStart}`

    // Pacientes ativos
    const { data: clients } = await db
      .from('fitness_profiles')
      .select('id')
      .eq('role', 'client')

    if (!clients || clients.length === 0) {
      return NextResponse.json({
        success: true,
        weekStart,
        weekEnd,
        awarded: 0,
        message: 'No clients',
      })
    }

    let awardedCount = 0
    let skippedCount = 0

    for (const client of clients) {
      try {
        // Refeições do paciente na semana
        const { data: meals } = await db
          .from('fitness_meals')
          .select('data')
          .eq('user_id', client.id)
          .gte('data', weekStart)
          .lte('data', weekEnd)

        // Conta refeições por dia
        const perDay: Record<string, number> = {}
        for (const m of (meals || [])) {
          perDay[m.data] = (perDay[m.data] || 0) + 1
        }

        // Dias compliant: 3+ refeições
        const compliantDays = Object.values(perDay).filter((c) => (c as number) >= 3).length
        const adherencePct = (compliantDays / 7) * 100

        if (adherencePct >= 80) {
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
      awarded: awardedCount,
      skipped_duplicates: skippedCount,
    })
  } catch (error) {
    console.error('Weekly adherence cron error:', error)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
