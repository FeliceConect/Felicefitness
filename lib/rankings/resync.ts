/**
 * Reconstrução do ranking a partir do extrato de pontos.
 *
 * Duas coisas distintas acontecem aqui:
 *
 * 1. REMOÇÃO de transações inválidas:
 *    - "PR fantasma": Personal Record da PRIMEIRA vez que o paciente faz um
 *      exercício. Na estreia todo peso é recorde, então isso pontuava sem
 *      mérito. Só é removido quando dá para provar que não havia PR anterior
 *      daquele exercício em outro treino — se o set foi apagado e não é
 *      possível validar, a transação é MANTIDA (conservador).
 *    - Excedente de feed: mais de FEED_DAILY_CAP reações/posts/comentários por
 *      usuário, por razão, por dia (fuso de São Paulo). Mantém os primeiros.
 *
 * 2. RECONSTRUÇÃO de total_points = max(0, soma das transações aplicáveis).
 *    O piso zero é aplicado no total final, não a cada passo.
 *
 * Rode o recálculo de bioimpedância ANTES (lib/bioimpedance/award.ts), para que
 * o extrato de bio já esteja correto. Esta lógica não mexe na bio.
 *
 * Extraído da rota /api/admin/rankings/resync para que preview e aplicação
 * compartilhem exatamente o mesmo código.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { TX_TO_RANKING_CATEGORIES } from '@/lib/services/points-server'

type AdminClient = any

export const FEED_REASONS = ['Post no feed', 'Reacao no feed', 'Comentario no feed']
export const FEED_DAILY_CAP = 2

export interface RemovableTx {
  id: string
  user_id: string
  points: number
}

export interface RankingUpdate {
  ranking_id: string
  user_id: string
  nome: string
  before: number
  after: number
}

/** Paginação genérica (contorna o limite de 1000 linhas do PostgREST). */
export async function loadAll(makeQuery: (from: number, to: number) => any): Promise<any[]> {
  const all: any[] = []
  const page = 1000
  let from = 0
  for (;;) {
    const { data, error } = await makeQuery(from, from + page - 1)
    if (error) throw error
    const rows = data || []
    all.push(...rows)
    if (rows.length < page) break
    from += page
  }
  return all
}

/** Dia em America/Sao_Paulo (YYYY-MM-DD) a partir de um timestamp. */
export function spDay(ts: string): string {
  return new Date(ts).toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
}

/** Calcula as transações a remover: PR fantasma + excedente de feed. */
export async function computeRemovals(
  supabaseAdmin: AdminClient
): Promise<{ removePR: RemovableTx[]; removeFeed: RemovableTx[] }> {
  // --- PR fantasma (Personal Record de primeira vez, sem histórico real) ---
  const prTx = await loadAll((f, t) => supabaseAdmin
    .from('fitness_point_transactions')
    .select('id, user_id, points, reference_id')
    .eq('category', 'workout').eq('reason', 'Personal Record').eq('source', 'automatic')
    .order('id', { ascending: true }).range(f, t))

  // set -> (exercicio_nome, workout_id)
  const setIds = Array.from(new Set(prTx.map(t => t.reference_id).filter(Boolean)))
  const setMap = new Map<string, { exercicio_nome: string; workout_id: string }>()
  for (let i = 0; i < setIds.length; i += 300) {
    const chunk = setIds.slice(i, i + 300)
    const { data: sets } = await supabaseAdmin
      .from('fitness_exercise_sets').select('id, workout_exercise_id').in('id', chunk)
    const weIds = Array.from(new Set((sets || []).map((s: any) => s.workout_exercise_id).filter(Boolean)))
    const weMap = new Map<string, { exercicio_nome: string; workout_id: string }>()
    for (let j = 0; j < weIds.length; j += 300) {
      const { data: wes } = await supabaseAdmin
        .from('fitness_workout_exercises').select('id, exercicio_nome, workout_id').in('id', weIds.slice(j, j + 300))
      for (const we of (wes || [])) weMap.set(we.id, { exercicio_nome: we.exercicio_nome, workout_id: we.workout_id })
    }
    for (const s of (sets || [])) {
      const we = weMap.get(s.workout_exercise_id)
      if (we) setMap.set(s.id, we)
    }
  }

  // histórico: (user|exercício) -> conjunto de workout_ids com PR registrado
  const prs = await loadAll((f, t) => supabaseAdmin
    .from('fitness_personal_records')
    .select('user_id, exercicio_nome, workout_id')
    .eq('tipo_record', 'carga_maxima')
    .order('user_id', { ascending: true }).range(f, t))
  const histMap = new Map<string, Set<string>>()
  for (const pr of prs) {
    if (!pr.workout_id) continue
    const key = `${pr.user_id}|${pr.exercicio_nome}`
    if (!histMap.has(key)) histMap.set(key, new Set())
    histMap.get(key)!.add(pr.workout_id)
  }

  const removePR: RemovableTx[] = []
  for (const t of prTx) {
    const we = t.reference_id ? setMap.get(t.reference_id) : null
    if (!we) continue // não dá pra validar (set apagado) — conservador: mantém
    const workouts = histMap.get(`${t.user_id}|${we.exercicio_nome}`) || new Set<string>()
    const hasOther = Array.from(workouts).some((wid) => wid !== we.workout_id)
    if (!hasOther) removePR.push(t) // primeira vez = fantasma
  }

  // --- excedente de feed (mantém os FEED_DAILY_CAP primeiros por usuário/razão/dia) ---
  const feedTx = await loadAll((f, t) => supabaseAdmin
    .from('fitness_point_transactions')
    .select('id, user_id, points, reason, created_at')
    .eq('category', 'social').in('reason', FEED_REASONS).eq('source', 'automatic')
    .order('created_at', { ascending: true }).range(f, t))
  const seen = new Map<string, number>()
  const removeFeed: RemovableTx[] = []
  for (const t of feedTx) {
    const key = `${t.user_id}|${t.reason}|${spDay(t.created_at)}`
    const c = (seen.get(key) || 0) + 1
    seen.set(key, c)
    if (c > FEED_DAILY_CAP) removeFeed.push(t)
  }

  return { removePR, removeFeed }
}

/** Soma aplicável de um usuário para um ranking (respeitando categoria), com piso 0. */
export function applicableTotal(txs: any[], ranking: any, removed: Set<string>): number {
  let sum = 0
  const isGlobal = ranking.type !== 'category'
  for (const t of txs) {
    if (removed.has(t.id)) continue
    if (isGlobal) { sum += t.points; continue }
    if (!ranking.category) continue
    const allowed = TX_TO_RANKING_CATEGORIES[t.category] || null
    if (allowed && allowed.includes(ranking.category)) sum += t.points
  }
  return Math.max(0, sum)
}

/** Monta o "antes → depois" de cada participante de cada ranking ativo. */
export async function buildReport(supabaseAdmin: AdminClient, removedIds: Set<string>): Promise<RankingUpdate[]> {
  const allTx = await loadAll((f, t) => supabaseAdmin
    .from('fitness_point_transactions').select('id, user_id, points, category')
    .order('id', { ascending: true }).range(f, t))
  const txByUser = new Map<string, any[]>()
  for (const t of allTx) {
    if (!txByUser.has(t.user_id)) txByUser.set(t.user_id, [])
    txByUser.get(t.user_id)!.push(t)
  }

  const rankings = (await supabaseAdmin
    .from('fitness_rankings').select('id, type, category').eq('is_active', true)).data || []

  const nomes = new Map<string, string>()
  const userIds = Array.from(txByUser.keys())
  for (let i = 0; i < userIds.length; i += 300) {
    const { data: profs } = await supabaseAdmin
      .from('fitness_profiles').select('id, nome').in('id', userIds.slice(i, i + 300))
    for (const p of (profs || [])) nomes.set(p.id, p.nome)
  }

  const updates: RankingUpdate[] = []
  for (const r of rankings) {
    const parts = await loadAll((f, t) => supabaseAdmin
      .from('fitness_ranking_participants').select('user_id, total_points')
      .eq('ranking_id', r.id).order('user_id', { ascending: true }).range(f, t))
    for (const p of parts) {
      const after = applicableTotal(txByUser.get(p.user_id) || [], r, removedIds)
      updates.push({
        ranking_id: r.id, user_id: p.user_id, nome: nomes.get(p.user_id) || p.user_id,
        before: p.total_points || 0, after,
      })
    }
  }
  return updates
}

/** DRY-RUN: o que seria removido e o antes→depois, sem gravar nada. */
export async function previewResync(supabaseAdmin: AdminClient) {
  const { removePR, removeFeed } = await computeRemovals(supabaseAdmin)
  const removedIds = new Set<string>([...removePR, ...removeFeed].map(t => t.id))
  const updates = await buildReport(supabaseAdmin, removedIds)
  const changed = updates
    .filter(u => u.before !== u.after)
    .sort((a, b) => (a.after - a.before) - (b.after - b.before))

  return {
    remocoes: {
      pr_fantasma: { transacoes: removePR.length, pontos: removePR.reduce((s, t) => s + t.points, 0) },
      feed_excedente: { transacoes: removeFeed.length, pontos: removeFeed.reduce((s, t) => s + t.points, 0) },
    },
    participantes_alterados: changed.length,
    mudancas: changed,
  }
}

/** APLICA: remove as transações inválidas e reconstrói total_points. */
export async function applyResync(supabaseAdmin: AdminClient) {
  const { removePR, removeFeed } = await computeRemovals(supabaseAdmin)
  const removeIds = [...removePR, ...removeFeed].map(t => t.id)

  // 1) Apaga as transações inválidas (em lotes)
  for (let i = 0; i < removeIds.length; i += 200) {
    const { error } = await supabaseAdmin
      .from('fitness_point_transactions').delete().in('id', removeIds.slice(i, i + 200))
    // supabase-js não lança em erro de query — sem esta checagem um delete que
    // falha deixaria total_points reconstruído sobre um extrato ainda sujo.
    if (error) throw new Error('Falha ao remover transações: ' + error.message)
  }

  // 2) Reconstrói total_points do extrato já limpo (removed vazio)
  const updates = await buildReport(supabaseAdmin, new Set<string>())
  let applied = 0
  for (const u of updates) {
    if (u.before === u.after) continue
    const { error } = await supabaseAdmin
      .from('fitness_ranking_participants')
      .update({ total_points: u.after })
      .eq('ranking_id', u.ranking_id)
      .eq('user_id', u.user_id)
    if (error) throw new Error(`Falha ao atualizar ${u.nome}: ${error.message}`)
    applied++
  }

  return {
    removidas: { pr_fantasma: removePR.length, feed_excedente: removeFeed.length },
    participantes_atualizados: applied,
  }
}
