/**
 * Auditoria de um desafio — procura, participante por participante, os padrões
 * que a limpeza automática NÃO consegue distinguir de pontos legítimos (o farm
 * antigo: endpoint aberto, atividades sem cap, streak forjado, dedup furado).
 *
 * A limpeza (migration 1 + resync) tira duplicata estrutural e PR fantasma. O
 * que sobra são transações "normais" demais para uma regra automática decidir —
 * por isso aqui a gente MOSTRA os sinais e deixa o Leonardo/Marinella julgarem.
 *
 * Puro (sem I/O) para ser testável. A rota /api/admin/rankings/challenge-audit
 * alimenta com as transações do período.
 */
import { spDay } from '@/lib/rankings/resync'

// Teto honesto de pontos num único dia. Um dia perfeito rende ~40–50 pts.
export const HONEST_DAILY_CEILING = 60

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

export interface ParticipantAudit {
  user_id: string
  nome: string
  score: number       // pontos que CONTAM para o desafio (filtrado pela scoring_category)
  totalAll: number    // todos os pontos do período (todas as categorias)
  byReason: Array<{ reason: string; count: number; points: number }>
  maxDayPoints: number
  daysOverCeiling: number
  flags: AuditFlag[]
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
  const reasonMap = new Map<string, { count: number; points: number }>()
  const dayPoints = new Map<string, number>()     // dia REAL (created_at, SP) -> pontos
  const activityByDay = new Map<string, number>() // dia REAL -> nº de atividades avulsas
  let streakBonuses = 0

  for (const t of txs) {
    const p = t.points || 0
    totalAll += p
    if (!allowed || allowed.includes(t.category)) score += p

    const rm = reasonMap.get(t.reason) || { count: 0, points: 0 }
    rm.count += 1
    rm.points += p
    reasonMap.set(t.reason, rm)

    const d = spDay(t.created_at)
    dayPoints.set(d, (dayPoints.get(d) || 0) + p)
    if (ACTIVITY_REASONS.has(t.reason)) {
      activityByDay.set(d, (activityByDay.get(d) || 0) + 1)
    }
    if (t.reason.startsWith('Streak de')) streakBonuses += 1
  }

  let maxDayPoints = 0
  let daysOverCeiling = 0
  for (const v of Array.from(dayPoints.values())) {
    if (v > maxDayPoints) maxDayPoints = v
    if (v > HONEST_DAILY_CEILING) daysOverCeiling += 1
  }
  let maxActivityInADay = 0
  for (const v of Array.from(activityByDay.values())) {
    if (v > maxActivityInADay) maxActivityInADay = v
  }

  const flags: AuditFlag[] = []
  if (daysOverCeiling > 0) {
    flags.push({
      level: 'alto',
      text: `${daysOverCeiling} dia(s) com mais de ${HONEST_DAILY_CEILING} pts num dia só (teto honesto ~40–50)`,
    })
  }
  if (maxActivityInADay > 2) {
    flags.push({
      level: 'alto',
      text: `${maxActivityInADay} atividades avulsas pontuadas num único dia (o cap agora é 2)`,
    })
  }
  if (streakBonuses > 2) {
    flags.push({
      level: 'medio',
      text: `${streakBonuses} bônus de streak no período — conferir se o streak é real`,
    })
  } else if (streakBonuses > 0) {
    flags.push({
      level: 'medio',
      text: `recebeu bônus de streak — conferir se o streak é real`,
    })
  }

  const byReason = Array.from(reasonMap.entries())
    .map(([reason, v]) => ({ reason, count: v.count, points: v.points }))
    .sort((a, b) => b.points - a.points)

  return { user_id, nome, score, totalAll, byReason, maxDayPoints, daysOverCeiling, flags }
}
