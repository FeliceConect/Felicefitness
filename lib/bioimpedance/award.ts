/**
 * Integração do calculador de pontos com a tabela fitness_point_transactions
 * e o ranking (fitness_ranking_participants).
 *
 * A award aqui é DINÂMICA (valor depende do delta) e pode ser NEGATIVA,
 * por isso não usa a rota genérica /api/points/award (que é baseada em
 * actions fixas). Também precisa rodar em contexto server-side pois o
 * "user" autenticado é o profissional, não o paciente.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { calculateBioimpedancePoints, type BioSnapshot, type PointsBreakdown } from './points-calculator'

type AdminClient = any

/**
 * Busca o registro anterior (data mais próxima antes da data passada)
 * do mesmo paciente.
 */
export async function getPreviousRecord(
  supabaseAdmin: AdminClient,
  userId: string,
  currentRecordId: string,
  currentDate: string
): Promise<BioSnapshot | null> {
  // Busca o registro anterior do mesmo paciente por data.
  // Ordenação secundária por created_at garante determinismo quando há
  // múltiplas medições na mesma data.
  const { data } = await supabaseAdmin
    .from('fitness_body_compositions')
    .select('peso, massa_muscular_esqueletica_kg, gordura_visceral')
    .eq('user_id', userId)
    .neq('id', currentRecordId)
    .lt('data', currentDate)
    .order('data', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return data || null
}

/**
 * Remove a transação de pontos associada a um registro (por reference_id).
 * Retorna quantos pontos foram removidos (pode ser negativo — então somar ao ranking "reverte").
 */
export async function removeBioimpedanceTransaction(
  supabaseAdmin: AdminClient,
  recordId: string
): Promise<number> {
  const { data: existing } = await supabaseAdmin
    .from('fitness_point_transactions')
    .select('id, points, user_id')
    .eq('reference_id', recordId)
    .eq('category', 'bioimpedance')

  if (!existing || existing.length === 0) return 0

  let pointsRemoved = 0
  const userId = existing[0].user_id
  for (const tx of existing) {
    pointsRemoved += tx.points
  }

  await supabaseAdmin
    .from('fitness_point_transactions')
    .delete()
    .eq('reference_id', recordId)
    .eq('category', 'bioimpedance')

  // Reverte do ranking (subtrai os pontos)
  if (pointsRemoved !== 0 && userId) {
    await decrementRankingPoints(supabaseAdmin, userId, pointsRemoved)
  }

  return pointsRemoved
}

/**
 * Concede pontos ao paciente baseado no delta entre uma nova medição e a anterior.
 * Insere UMA transação em fitness_point_transactions (signed) e ajusta o ranking.
 * Retorna o breakdown para uso pelo caller (UI / notificação).
 */
export async function awardBioimpedancePoints(
  supabaseAdmin: AdminClient,
  params: {
    patientId: string
    recordId: string
    current: BioSnapshot
    currentDate: string
  }
): Promise<PointsBreakdown | null> {
  const previous = await getPreviousRecord(
    supabaseAdmin,
    params.patientId,
    params.recordId,
    params.currentDate
  )
  const breakdown = calculateBioimpedancePoints(previous, params.current)
  if (!breakdown || breakdown.total === 0) return breakdown

  // Insert transaction (pode ser negativa)
  await supabaseAdmin
    .from('fitness_point_transactions')
    .insert({
      user_id: params.patientId,
      points: breakdown.total,
      reason: breakdown.reason,
      category: 'bioimpedance',
      source: 'automatic',
      reference_id: params.recordId,
    })

  // Atualiza rankings
  await incrementRankingPoints(supabaseAdmin, params.patientId, breakdown.total)

  return breakdown
}

/**
 * Recalcula em cadeia os pontos de TODAS as medições do paciente com data >= fromDate.
 *
 * Motivação: quando uma medição antiga é editada ou deletada, as medições posteriores
 * que usaram o anterior dela como base têm seus deltas alterados. Essa função zera e
 * recalcula a cadeia inteira a partir daquele ponto.
 *
 * IMPORTANTE: se fromDate = data da editada, ela própria é recalculada também — chame
 * esta função APÓS ter chamado `awardBioimpedancePoints` na editada, passando a data
 * do dia SEGUINTE (ou passe a data da editada e deixe recalcular tudo, idempotente).
 */
export async function recalculateChainFrom(
  supabaseAdmin: AdminClient,
  patientId: string,
  fromDate: string
): Promise<number> {
  const { data: chain } = await supabaseAdmin
    .from('fitness_body_compositions')
    .select('id, data, peso, massa_muscular_esqueletica_kg, gordura_visceral')
    .eq('user_id', patientId)
    .gte('data', fromDate)
    .order('data', { ascending: true })
    .order('created_at', { ascending: true })

  if (!chain || chain.length === 0) return 0

  let recomputed = 0
  for (const row of chain) {
    await removeBioimpedanceTransaction(supabaseAdmin, row.id)
    await awardBioimpedancePoints(supabaseAdmin, {
      patientId,
      recordId: row.id,
      currentDate: row.data,
      current: {
        peso: row.peso,
        massa_muscular_esqueletica_kg: row.massa_muscular_esqueletica_kg,
        gordura_visceral: row.gordura_visceral,
      },
    })
    recomputed++
  }
  return recomputed
}

/** Incrementa total_points em todos os rankings ativos do usuário (criando participant se preciso) */
async function incrementRankingPoints(
  supabaseAdmin: AdminClient,
  userId: string,
  delta: number
): Promise<void> {
  const { data: activeRankings } = await supabaseAdmin
    .from('fitness_rankings')
    .select('id, type, category')
    .eq('is_active', true)

  if (!activeRankings || activeRankings.length === 0) return

  for (const ranking of activeRankings) {
    // Rankings de categoria: só aplica se a categoria 'bioimpedance' estiver mapeada.
    // O categoryMap original não inclui bioimpedance — aplicamos apenas em rankings globais.
    if (ranking.type === 'category' && ranking.category) continue

    // Garante participant
    const { data: existing } = await supabaseAdmin
      .from('fitness_ranking_participants')
      .select('id, total_points')
      .eq('ranking_id', ranking.id)
      .eq('user_id', userId)
      .maybeSingle()

    if (!existing) {
      await supabaseAdmin
        .from('fitness_ranking_participants')
        .insert({
          ranking_id: ranking.id,
          user_id: userId,
          total_points: Math.max(0, delta), // não cria com negativo
        })
      continue
    }

    const newTotal = Math.max(0, (existing.total_points || 0) + delta)
    await supabaseAdmin
      .from('fitness_ranking_participants')
      .update({ total_points: newTotal })
      .eq('id', existing.id)
  }
}

async function decrementRankingPoints(
  supabaseAdmin: AdminClient,
  userId: string,
  delta: number
): Promise<void> {
  // Decrementar é simplesmente incrementar com valor negativo
  await incrementRankingPoints(supabaseAdmin, userId, -delta)
}
