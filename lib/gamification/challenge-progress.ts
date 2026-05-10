/**
 * Calcula o progresso de um desafio baseado em dados reais do paciente.
 *
 * Função pura: recebe o desafio e um contexto com os dados, retorna
 * `{ progress, target, completed }` atualizado.
 *
 * Cobre os critérios mais usados (água, refeições, treinos, PRs, score,
 * streak). Critérios mais específicos (perfect_macros exato, streaks
 * compostos como protein_streak) ficam como progress 0 — não bloqueiam,
 * apenas não atualizam até o cron/trigger evoluir.
 */

import type { Challenge } from '@/types/gamification'

export interface ChallengeProgressContext {
  // Refeições de hoje
  todayMealsCount: number
  /** Refeições registradas hoje com macros (pra critérios específicos). */
  todayMeals: Array<{
    tipo_refeicao: string
    proteinas_total: number
    calorias_total: number
  }>
  /** Total planejado de refeições no plano (para `all_meals`). Padrão 5. */
  plannedMealsCount: number

  // Hidratação de hoje
  todayWaterMl: number
  waterGoalMl: number

  // Macros de hoje (totalizados das refeições)
  todayProteinG: number
  proteinGoalG: number
  todayCaloriesKcal: number
  caloriesGoalKcal: number

  // Treino de hoje
  /** Treino estruturado concluído (status='concluido'). */
  todayWorkoutCompleted: boolean
  /** Todas séries do treino de hoje feitas (proxy: workout concluído). */
  todayWorkoutFull: boolean
  /** Hora do treino concluído de hoje, se houver (HH:MM). */
  todayWorkoutTime?: string

  // Recordes de hoje
  todayPRsCount: number

  // Score de hoje (0-100)
  todayScoreTotal: number

  // Semana
  weeklyWorkoutsCompleted: number
  weeklyPRsCount: number

  // Streak
  currentStreak: number
}

export interface ProgressResult {
  progress: number
  target: number
  completed: boolean
}

/**
 * Helper: refeição com proteína mínima.
 */
function hasMealWithProtein(
  meals: ChallengeProgressContext['todayMeals'],
  mealType: string,
  minProteinG: number
): boolean {
  return meals.some(m => m.tipo_refeicao === mealType && (m.proteinas_total || 0) >= minProteinG)
}

/**
 * Compara hora HH:MM (true se `time` <= `cutoff`).
 */
function isBeforeOrEqual(time: string | undefined, cutoff: string): boolean {
  if (!time) return false
  return time <= cutoff
}

export function computeChallengeProgress(
  challenge: Challenge,
  ctx: ChallengeProgressContext
): ProgressResult {
  const { criteria } = challenge

  switch (criteria.type) {
    // ─── Treino ───────────────────────────────────────────
    case 'early_workout': {
      const cutoff = criteria.time || '07:00'
      const ok = ctx.todayWorkoutCompleted && isBeforeOrEqual(ctx.todayWorkoutTime, cutoff)
      return { progress: ok ? 1 : 0, target: 1, completed: ok }
    }
    case 'full_workout': {
      const ok = ctx.todayWorkoutFull
      return { progress: ok ? 1 : 0, target: 1, completed: ok }
    }
    case 'personal_record': {
      const target = criteria.value || 1
      const progress = Math.min(target, ctx.todayPRsCount)
      return { progress, target, completed: progress >= target }
    }

    // ─── Nutrição ─────────────────────────────────────────
    case 'all_meals': {
      const target = ctx.plannedMealsCount > 0 ? ctx.plannedMealsCount : 5
      const progress = Math.min(target, ctx.todayMealsCount)
      return { progress, target, completed: progress >= target }
    }
    case 'protein_goal': {
      const target = ctx.proteinGoalG
      const progress = Math.min(target, ctx.todayProteinG)
      return { progress: Math.round(progress), target: Math.round(target), completed: target > 0 && progress >= target }
    }
    case 'perfect_macros': {
      // ±5% da meta de calorias
      if (ctx.caloriesGoalKcal <= 0) return { progress: 0, target: 1, completed: false }
      const ratio = ctx.todayCaloriesKcal / ctx.caloriesGoalKcal
      const ok = ratio >= 0.95 && ratio <= 1.05
      return { progress: ok ? 1 : 0, target: 1, completed: ok }
    }
    case 'protein_meal': {
      const meal = criteria.meal || 'cafe_manha'
      const minP = criteria.value || 30
      const ok = hasMealWithProtein(ctx.todayMeals, meal, minP)
      return { progress: ok ? minP : 0, target: minP, completed: ok }
    }

    // ─── Hidratação ───────────────────────────────────────
    case 'water_goal': {
      const target = ctx.waterGoalMl
      const progress = Math.min(target, ctx.todayWaterMl)
      return { progress, target, completed: target > 0 && progress >= target }
    }
    case 'water_overachieve': {
      const overachievePct = criteria.value || 120
      const target = Math.round(ctx.waterGoalMl * (overachievePct / 100))
      const progress = Math.min(target, ctx.todayWaterMl)
      return { progress, target, completed: target > 0 && progress >= target }
    }

    // ─── Score / Extras ───────────────────────────────────
    case 'perfect_score': {
      const ok = ctx.todayScoreTotal >= 100
      return { progress: ctx.todayScoreTotal, target: 100, completed: ok }
    }
    case 'early_checkin': {
      // Sem check-in implementado por enquanto — não progride
      return { progress: 0, target: 1, completed: false }
    }

    // ─── Semanais ─────────────────────────────────────────
    case 'workouts': {
      const target = criteria.value || 5
      const progress = Math.min(target, ctx.weeklyWorkoutsCompleted)
      return { progress, target, completed: progress >= target }
    }
    case 'personal_records': {
      const target = criteria.value || 3
      const progress = Math.min(target, ctx.weeklyPRsCount)
      return { progress, target, completed: progress >= target }
    }
    case 'all_scheduled_workouts': {
      // Placeholder — exige saber quantos foram agendados na semana
      return { progress: ctx.weeklyWorkoutsCompleted, target: ctx.weeklyWorkoutsCompleted || 1, completed: false }
    }

    // ─── Streak / Especiais ───────────────────────────────
    case 'streak': {
      const target = criteria.value || 7
      const progress = Math.min(target, ctx.currentStreak)
      return { progress, target, completed: progress >= target }
    }

    // Critérios ainda não implementados — não bloqueiam, ficam em 0
    default:
      return { progress: 0, target: criteria.value || 1, completed: false }
  }
}
