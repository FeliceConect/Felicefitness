import { describe, it, expect } from 'vitest'
import { applicableTotal, spDay, FEED_DAILY_CAP, FEED_REASONS } from '@/lib/rankings/resync'

const tx = (id: string, points: number, category: string) => ({ id, points, category })

describe('applicableTotal — reconstrução do total de um usuário por ranking', () => {
  it('ranking global soma todas as categorias', () => {
    const txs = [tx('a', 15, 'workout'), tx('b', 10, 'nutrition'), tx('c', 5, 'hydration')]
    expect(applicableTotal(txs, { type: 'global', category: null }, new Set())).toBe(30)
  })

  it('ranking de categoria conta só as transações que mapeiam para ela', () => {
    const txs = [tx('a', 15, 'workout'), tx('b', 10, 'nutrition'), tx('c', 3, 'sleep')]
    // 'consistency' recebe sleep (mapeia p/ consistency), não workout/nutrition
    expect(applicableTotal(txs, { type: 'category', category: 'consistency' }, new Set())).toBe(3)
    expect(applicableTotal(txs, { type: 'category', category: 'workout' }, new Set())).toBe(15)
    expect(applicableTotal(txs, { type: 'category', category: 'nutrition' }, new Set())).toBe(10)
  })

  it('ignora transações no conjunto removed (duplicatas/inválidas)', () => {
    const txs = [tx('a', 15, 'workout'), tx('b', 10, 'workout')]
    expect(applicableTotal(txs, { type: 'global', category: null }, new Set(['b']))).toBe(15)
  })

  it('nunca fica abaixo de zero (piso no total final)', () => {
    const txs = [tx('a', -100, 'workout'), tx('b', 5, 'workout')]
    expect(applicableTotal(txs, { type: 'global', category: null }, new Set())).toBe(0)
  })
})

describe('spDay — dia em America/Sao_Paulo a partir de um timestamp', () => {
  it('converte a virada do dia UTC para o dia correto em SP (BRT -03:00)', () => {
    // 02:00 UTC = 23:00 do dia ANTERIOR em BRT
    expect(spDay('2026-07-30T02:00:00Z')).toBe('2026-07-29')
    // meio-dia UTC = 09:00 BRT, mesmo dia
    expect(spDay('2026-07-30T12:00:00Z')).toBe('2026-07-30')
  })
})

describe('constantes de cap do feed', () => {
  it('cap diário de feed é 2 e cobre as 3 razões de feed', () => {
    expect(FEED_DAILY_CAP).toBe(2)
    expect(FEED_REASONS).toContain('Post no feed')
    expect(FEED_REASONS).toContain('Reacao no feed')
    expect(FEED_REASONS).toContain('Comentario no feed')
  })
})
