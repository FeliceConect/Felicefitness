/**
 * Auditoria de um desafio — procura, participante por participante, os padrões
 * que a limpeza automática NÃO consegue distinguir de pontos legítimos (o farm
 * antigo: endpoint aberto, atividades sem cap, streak forjado, dedup furado).
 *
 * A limpeza (migration 1 + resync) tira duplicata estrutural e PR fantasma. O
 * que sobra são transações "normais" demais para uma regra automática decidir —
 * por isso aqui a gente MOSTRA os sinais, DIA A DIA, e deixa o Leonardo/Marinella
 * julgarem (um dia de 75 pts pode ser bio legítima; 200 pts de atividade é farm).
 *
 * Puro (sem I/O) para ser testável. A rota /api/admin/rankings/challenge-audit
 * alimenta com as transações do período.
 */
import { spDay } from '@/lib/rankings/resync'

// Teto honesto de pontos num único dia. Um dia perfeito rende ~40–50 pts.
export const HONEST_DAILY_CEILING = 60
// Cap de atividades avulsas pontuáveis por dia (mesmo do /api/activities).
export const ACTIVITY_DAILY_CAP = 2

// scoring_category do desafio -> categorias de transação (espelha challenge-score.ts).
export const CHALLENGE_CATEGORY_TO_TX: Record<string, string[]> = {
  workout: ['workout'],
  nutrition: ['nutrition'],
  consistency: ['consistency', 'sleep', 'hydration', 'wellness'],
  social: ['social'],
  form_completion: ['form_completion'],
  hydration: ['hydration'],
  sleep: ['sleep'],
}

const ACTIVITY_REASONS = new Set([
  'Atividade leve', 'Atividade moderada', 'Atividade intensa', 'Atividade muito intensa',
])

export interface AuditTx {
  points: number
  reason: string
  category: string
  reference_id: string | null
  reference_date: string | null
  created_at: string
}

export interface AuditFlag {
  level: 'alto' | 'medio'
  text: string
}

export interface DayItem {
  reason: string
  count: number
  points: number
}

export interface AuditDay {
  date: string        // YYYY-MM-DD (dia real em SP, por created_at)
  points: number
  activities: number  // nº de atividades avulsas pontuadas nesse dia
  suspicious: boolean // acima do teto OU acima do cap de atividades
  items: DayItem[]    // detalhamento do dia, ordenado por pontos desc
}

export interface ParticipantAudit {
  user_id: string
  nome: string
  score: number         // pontos que CONTAM para o desafio (filtrado pela scoring_category)
  totalAll: number      // todos os pontos do período (todas as categorias)
  maxDayPoints: number
  daysOverCeiling: number
  activityCount: number // total de atividades avulsas no período
  activityExcess: number // atividades além do cap de 2/dia (somado por dia)
  streakCount: number
  byReason: DayItem[]   // totais do período por origem
  days: AuditDay[]      // dia a dia, ordenado por pontos desc
  flags: AuditFlag[]
}

interface DayAccum {
  points: number
  activities: number
  items: Map<string, { count: number; points: number }>
}

/** Analisa um participante a partir das transações dele no período do desafio. */
export function auditParticipant(
  user_id: string,
  nome: string,
  txs: AuditTx[],
  scoringCategory: string | null
): ParticipantAudit {
  const allowed = scoringCategory
    ? (CHALLENGE_CATEGORY_TO_TX[scoringCategory] || [scoringCategory])
    : null

  let score = 0
  let totalAll = 0
  let activityCount = 0
  let streakCount = 0
  const reasonMap = new Map<string, { count: number; points: number }>()
  const dayMap = new Map<string, DayAccum>()

  for (const t of txs) {
    const p = t.points || 0
    totalAll += p
    if (!allowed || allowed.includes(t.category)) score += p

    const rm = reasonMap.get(t.reason) || { count: 0, points: 0 }
    rm.count += 1
    rm.points += p
    reasonMap.set(t.reason, rm)

    const isActivity = ACTIVITY_REASONS.has(t.reason)
    if (isActivity) activityCount += 1
    if (t.reason.startsWith('Streak de')) streakCount += 1

    const d = spDay(t.created_at)
    const day = dayMap.get(d) || { points: 0, activities: 0, items: new Map() }
    day.points += p
    if (isActivity) day.activities += 1
    const di = day.items.get(t.reason) || { count: 0, points: 0 }
    di.count += 1
    di.points += p
    day.items.set(t.reason, di)
    dayMap.set(d, day)
  }

  let maxDayPoints = 0
  let daysOverCeiling = 0
  let activityExcess = 0
  const days: AuditDay[] = Array.from(dayMap.entries()).map(([date, acc]) => {
    if (acc.points > maxDayPoints) maxDayPoints = acc.points
    if (acc.points > HONEST_DAILY_CEILING) daysOverCeiling += 1
    if (acc.activities > ACTIVITY_DAILY_CAP) activityExcess += acc.activities - ACTIVITY_DAILY_CAP
    const suspicious = acc.points > HONEST_DAILY_CEILING || acc.activities > ACTIVITY_DAILY_CAP
    const items = Array.from(acc.items.entries())
      .map(([reason, v]) => ({ reason, count: v.count, points: v.points }))
      .sort((a, b) => b.points - a.points)
    return { date, points: acc.points, activities: acc.activities, suspicious, items }
  })
  days.sort((a, b) => b.points - a.points)

  const flags: AuditFlag[] = []
  if (activityExcess > 0) {
    flags.push({
      level: 'alto',
      text: `${activityExcess} atividade(s) avulsa(s) além do limite de ${ACTIVITY_DAILY_CAP}/dia (farm de atividade)`,
    })
  }
  if (daysOverCeiling > 0) {
    flags.push({
      level: 'medio',
      text: `${daysOverCeiling} dia(s) acima de ${HONEST_DAILY_CEILING} pts — confira nos dias abaixo (pode ser dia de bioimpedância, que é legítimo)`,
    })
  }
  if (streakCount > 0) {
    flags.push({
      level: 'medio',
      text: `${streakCount} bônus de streak no período — conferir se o streak é real`,
    })
  }

  const byReason = Array.from(reasonMap.entries())
    .map(([reason, v]) => ({ reason, count: v.count, points: v.points }))
    .sort((a, b) => b.points - a.points)

  return {
    user_id, nome, score, totalAll, maxDayPoints, daysOverCeiling,
    activityCount, activityExcess, streakCount, byReason, days, flags,
  }
}
