import { describe, it, expect } from 'vitest'
import { auditParticipant, HONEST_DAILY_CEILING, type AuditTx } from '@/lib/rankings/challenge-audit'

const tx = (points: number, reason: string, category: string, created_at: string): AuditTx => ({
  points, reason, category, reference_id: null, reference_date: null, created_at,
})

const DAY1 = '2026-07-15T12:00:00Z' // 09:00 BRT, dia 2026-07-15
const DAY2 = '2026-07-16T12:00:00Z'

describe('auditParticipant', () => {
  it('participante honesto: sem bandeiras, score correto', () => {
    const txs = [
      tx(15, 'Treino completo', 'workout', DAY1),
      tx(10, 'Todas refeicoes registradas', 'nutrition', DAY1),
      tx(5, 'Meta de agua atingida', 'hydration', DAY1),
    ]
    const a = auditParticipant('u1', 'Ana', txs, null)
    expect(a.score).toBe(30)
    expect(a.totalAll).toBe(30)
    expect(a.maxDayPoints).toBe(30)
    expect(a.daysOverCeiling).toBe(0)
    expect(a.flags).toHaveLength(0)
  })

  it('dia acima do teto → bandeira alta', () => {
    // 100 pts num único dia
    const txs = [
      tx(50, 'Streak de 30 dias consecutivos', 'consistency', DAY1),
      tx(15, 'Treino completo', 'workout', DAY1),
      tx(10, 'Atividade muito intensa', 'workout', DAY1),
      tx(10, 'Atividade muito intensa', 'workout', DAY1),
      tx(10, 'Atividade muito intensa', 'workout', DAY1),
      tx(5, 'Meta de agua atingida', 'hydration', DAY1),
    ]
    const a = auditParticipant('u2', 'Bob', txs, null)
    expect(a.maxDayPoints).toBe(100)
    expect(a.daysOverCeiling).toBe(1)
    expect(a.flags.some(f => f.level === 'alto' && f.text.includes(`${HONEST_DAILY_CEILING}`))).toBe(true)
  })

  it('mais de 2 atividades num dia → bandeira alta de cap', () => {
    const txs = [
      tx(10, 'Atividade muito intensa', 'workout', DAY1),
      tx(10, 'Atividade muito intensa', 'workout', DAY1),
      tx(10, 'Atividade muito intensa', 'workout', DAY1),
    ]
    const a = auditParticipant('u3', 'Cid', txs, null)
    expect(a.flags.some(f => f.text.includes('atividades avulsas'))).toBe(true)
  })

  it('bônus de streak → bandeira média', () => {
    const txs = [tx(15, 'Streak de 7 dias consecutivos', 'consistency', DAY1)]
    const a = auditParticipant('u4', 'Dora', txs, null)
    expect(a.flags.some(f => f.level === 'medio' && f.text.includes('streak'))).toBe(true)
  })

  it('scoring_category filtra o score, mas totalAll conta tudo', () => {
    const txs = [
      tx(15, 'Treino completo', 'workout', DAY1),
      tx(10, 'Todas refeicoes registradas', 'nutrition', DAY2),
    ]
    const a = auditParticipant('u5', 'Edu', txs, 'workout')
    expect(a.score).toBe(15)     // só workout
    expect(a.totalAll).toBe(25)  // tudo
  })
})
