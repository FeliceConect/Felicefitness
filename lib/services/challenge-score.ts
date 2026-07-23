/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import type { SupabaseClient } from '@supabase/supabase-js'
/**
 * Placar de desafios — FONTE ÚNICA DA VERDADE.
 *
 * O score de um participante num desafio é a SOMA dos pontos que ele ganhou
 * DENTRO do período do desafio (tabela fitness_point_transactions) — exatamente
 * a mesma fonte usada pelo ranking geral.
 *
 * Antes, o placar dependia de um contador denormalizado
 * (fitness_challenge_participants.score) incrementado só dentro de
 * awardPointsServer(). Só que água, sono, feed e refeições do dia atribuem
 * pontos por OUTRO caminho (triggers no banco / insert direto nas rotas de
 * feed) que nunca tocava esse contador — subcontando o desafio e até deixando
 * participantes zerados. Calcular ao vivo a partir das transações conserta
 * todos os scores de uma vez, passa a contar TODAS as categorias e elimina a
 * corrida de leitura-escrita do contador.
 */

// scoring_category do desafio (estilo ranking) -> categorias de transação que
// contam. Espelha o inverso de TX_TO_RANKING_CATEGORIES (points-server.ts):
// 'consistency' agrega sleep/hydration/wellness. scoring_category = null conta
// TODAS as categorias.
const CHALLENGE_CATEGORY_TO_TX: Record<string, string[]> = {
  workout: ['workout'],
  nutrition: ['nutrition'],
  consistency: ['consistency', 'sleep', 'hydration', 'wellness'],
  social: ['social'],
  form_completion: ['form_completion'],
  hydration: ['hydration'],
  sleep: ['sleep'],
}

export interface ChallengeWindow {
  start_date: string // YYYY-MM-DD
  end_date: string // YYYY-MM-DD
  scoring_category?: string | null
}

// Início/fim do dia em São Paulo, em ISO UTC. Brasil não tem DST — sempre -03:00.
function startOfDaySP(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00-03:00`).toISOString()
}
function endOfDaySP(dateStr: string): string {
  return new Date(`${dateStr}T23:59:59.999-03:00`).toISOString()
}

/**
 * Soma os pontos de cada usuário dentro da janela do desafio.
 * @returns Record<user_id, score>
 */
export async function computeChallengeScores(
  db: SupabaseClient,
  challenge: ChallengeWindow,
  userIds: string[]
): Promise<Record<string, number>> {
  const scores: Record<string, number> = {}
  if (!userIds || userIds.length === 0) return scores

  const startISO = startOfDaySP(challenge.start_date)
  const endISO = endOfDaySP(challenge.end_date)
  const txCategories = challenge.scoring_category
    ? CHALLENGE_CATEGORY_TO_TX[challenge.scoring_category] || [challenge.scoring_category]
    : null

  // Caminho rápido: uma única agregação SQL (SUM(points) GROUP BY user_id),
  // em vez de N queries. Ver migration 20260723_challenge_scores_rpc.sql.
  const { data: rows, error } = await db.rpc('fitness_challenge_scores', {
    p_user_ids: userIds,
    p_start: startISO,
    p_end: endISO,
    p_categories: txCategories,
  })

  if (!error && Array.isArray(rows)) {
    for (const uid of userIds) scores[uid] = 0
    for (const r of rows as Array<{ user_id: string; score: number | string }>) {
      scores[r.user_id] = Number(r.score) || 0
    }
    return scores
  }

  // Fallback: soma por usuário. supabase-js NÃO lança em erro de query — por
  // isso tratamos `error` acima. Cobre o intervalo em que a RPC ainda não foi
  // aplicada no banco self-hosted (deploy antes da migration).
  await Promise.all(
    userIds.map(async (uid) => {
      let q = db
        .from('fitness_point_transactions')
        .select('points')
        .eq('user_id', uid)
        .gte('created_at', startISO)
        .lte('created_at', endISO)
        .limit(5000)
      if (txCategories) q = q.in('category', txCategories)
      const { data } = await q
      scores[uid] = (data || []).reduce((sum: number, t: { points: number }) => sum + (t.points || 0), 0)
    })
  )

  return scores
}
