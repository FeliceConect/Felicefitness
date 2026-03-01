/**
 * Automatic Point Attribution Service
 *
 * Provides a client-side function to award points for user actions.
 * Calls the /api/points/award endpoint which handles dedup, insertion,
 * and ranking updates.
 *
 * Point values:
 * - Consulta confirmada: 20pts (handled by appointments/[id]/complete API)
 * - Treino completo: 15pts
 * - Refeicoes do dia (>=3): 10pts
 * - Meta agua atingida: 5pts
 * - Sono registrado: 3pts
 * - Check-in bem-estar: 3pts
 * - PR alcancado: 10pts
 * - Post no feed: 2pts (handled by feed API)
 * - Reacao/comentario: 1pt (handled by feed API)
 * - Formulario preenchido: 5pts
 * - Streak 7 dias: 15pts bonus
 * - Streak 30 dias: 50pts bonus
 */

export type PointAction =
  | 'workout_completed'
  | 'all_meals_logged'
  | 'water_goal_met'
  | 'sleep_logged'
  | 'wellness_checkin'
  | 'pr_achieved'
  | 'post_created'
  | 'comment_or_reaction'
  | 'form_completed'
  | 'streak_7'
  | 'streak_30'

export interface AwardPointsResult {
  success: boolean
  points?: number
  message?: string
  duplicate?: boolean
  error?: string
}

/**
 * Award points for a user action.
 * Calls the /api/points/award endpoint which handles:
 * - Dedup checking (prevents double-awarding for same action/reference)
 * - Daily dedup for actions without reference_id
 * - Inserting into fitness_point_transactions
 * - Updating ranking participants
 *
 * @param action - The action type (e.g. 'workout_completed')
 * @param referenceId - Optional reference ID to prevent duplicates (e.g. workout ID)
 * @returns Result of the point award operation
 */
export async function awardPoints(
  action: PointAction,
  referenceId?: string
): Promise<AwardPointsResult> {
  try {
    const response = await fetch('/api/points/award', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        reference_id: referenceId || undefined,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error(`Points award failed for action "${action}":`, data.error)
      return {
        success: false,
        error: data.error || 'Erro ao atribuir pontos',
      }
    }

    if (data.duplicate) {
      return {
        success: true,
        duplicate: true,
        message: data.message,
      }
    }

    return {
      success: true,
      points: data.points,
      message: data.message,
    }
  } catch (error) {
    console.error(`Points award error for action "${action}":`, error)
    return {
      success: false,
      error: 'Erro de rede ao atribuir pontos',
    }
  }
}

/**
 * Award points for completing a workout.
 * 15 points per completed workout.
 */
export function awardWorkoutPoints(workoutId: string): Promise<AwardPointsResult> {
  return awardPoints('workout_completed', workoutId)
}

/**
 * Award points for logging all meals of the day (>=3).
 * 10 points per day (daily dedup, no reference_id needed).
 */
export function awardMealsPoints(): Promise<AwardPointsResult> {
  return awardPoints('all_meals_logged')
}

/**
 * Award points for reaching the daily water goal.
 * 5 points per day.
 */
export function awardWaterGoalPoints(): Promise<AwardPointsResult> {
  return awardPoints('water_goal_met')
}

/**
 * Award points for logging sleep.
 * 3 points per day.
 */
export function awardSleepPoints(): Promise<AwardPointsResult> {
  return awardPoints('sleep_logged')
}

/**
 * Award points for a wellness check-in.
 * 3 points per day.
 */
export function awardWellnessCheckinPoints(): Promise<AwardPointsResult> {
  return awardPoints('wellness_checkin')
}

/**
 * Award points for achieving a personal record.
 * 10 points per PR.
 */
export function awardPRPoints(setId: string): Promise<AwardPointsResult> {
  return awardPoints('pr_achieved', setId)
}

/**
 * Award points for completing a form/questionnaire.
 * 5 points per form.
 */
export function awardFormCompletedPoints(formResponseId: string): Promise<AwardPointsResult> {
  return awardPoints('form_completed', formResponseId)
}

/**
 * Award bonus points for reaching a 7-day streak.
 * 15 bonus points.
 */
export function awardStreak7Points(): Promise<AwardPointsResult> {
  return awardPoints('streak_7')
}

/**
 * Award bonus points for reaching a 30-day streak.
 * 50 bonus points.
 */
export function awardStreak30Points(): Promise<AwardPointsResult> {
  return awardPoints('streak_30')
}
