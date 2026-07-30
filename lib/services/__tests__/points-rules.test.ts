import { describe, it, expect } from 'vitest'
import { POINT_VALUES, TX_TO_RANKING_CATEGORIES } from '@/lib/services/points-server'

describe('POINT_VALUES — trava de regressão dos valores de pontos', () => {
  it('mantém os valores acordados (mudar aqui = mudar a regra do jogo e a justiça do desafio)', () => {
    expect(POINT_VALUES.workout_completed.points).toBe(15)
    expect(POINT_VALUES.all_meals_logged.points).toBe(10)
    expect(POINT_VALUES.water_goal_met.points).toBe(5)
    expect(POINT_VALUES.sleep_logged.points).toBe(3)
    expect(POINT_VALUES.pr_achieved.points).toBe(3)
    expect(POINT_VALUES.post_created.points).toBe(4)
    expect(POINT_VALUES.comment_or_reaction.points).toBe(1)
    expect(POINT_VALUES.form_completed.points).toBe(5)
    expect(POINT_VALUES.streak_7.points).toBe(15)
    expect(POINT_VALUES.streak_30.points).toBe(50)
    expect(POINT_VALUES.weekly_adherence.points).toBe(10)
    expect(POINT_VALUES.activity_leve.points).toBe(3)
    expect(POINT_VALUES.activity_moderado.points).toBe(5)
    expect(POINT_VALUES.activity_intenso.points).toBe(8)
    expect(POINT_VALUES.activity_muito_intenso.points).toBe(10)
    expect(POINT_VALUES.cardio_leve.points).toBe(3)
    expect(POINT_VALUES.cardio_muito_intenso.points).toBe(10)
  })

  it('toda ação tem points > 0, category válida e reason não-vazio', () => {
    const validCategories = new Set([
      'workout', 'nutrition', 'hydration', 'sleep', 'wellness', 'attendance',
      'social', 'bonus', 'bioimpedance', 'challenge', 'consistency', 'form_completion',
    ])
    for (const [action, cfg] of Object.entries(POINT_VALUES)) {
      expect(cfg.points, action).toBeGreaterThan(0)
      expect(validCategories.has(cfg.category), `${action} tem category inválida: ${cfg.category}`).toBe(true)
      expect(cfg.reason.length, action).toBeGreaterThan(0)
    }
  })
})

describe('TX_TO_RANKING_CATEGORIES — precisa espelhar fitness_ranking_categories_for (SQL 20260730_5)', () => {
  it('mapeia categoria da transação -> categorias de ranking', () => {
    // Se este mapa mudar, atualize também a função SQL fitness_ranking_categories_for
    // na migration 20260730_5_reversal_rpc.sql — senão crédito e estorno divergem.
    expect(TX_TO_RANKING_CATEGORIES.nutrition).toEqual(['nutrition'])
    expect(TX_TO_RANKING_CATEGORIES.workout).toEqual(['workout'])
    expect(TX_TO_RANKING_CATEGORIES.consistency).toEqual(['consistency'])
    expect(TX_TO_RANKING_CATEGORIES.sleep).toEqual(['consistency'])
    expect(TX_TO_RANKING_CATEGORIES.hydration).toEqual(['consistency'])
    expect(TX_TO_RANKING_CATEGORIES.wellness).toEqual(['consistency'])
  })

  it('categorias sem mapa (social/form/bio/bonus) ficam só no ranking global', () => {
    expect(TX_TO_RANKING_CATEGORIES.social).toBeUndefined()
    expect(TX_TO_RANKING_CATEGORIES.form_completion).toBeUndefined()
    expect(TX_TO_RANKING_CATEGORIES.bioimpedance).toBeUndefined()
    expect(TX_TO_RANKING_CATEGORIES.bonus).toBeUndefined()
  })
})
