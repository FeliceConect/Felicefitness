/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
/**
 * Server-side Point Attribution
 *
 * Reusable helper for awarding points from server contexts (API routes, crons,
 * webhooks) without going through HTTP. Mirrors the dedup + ranking + challenge
 * + tier logic of /api/points/award. The HTTP route delegates to this module.
 */
import { createClient as createAdminClient } from '@supabase/supabase-js'

export type PointAction =
  | 'workout_completed'
  | 'all_meals_logged'
  | 'water_goal_met'
  | 'sleep_logged'
  | 'pr_achieved'
  | 'post_created'
  | 'comment_or_reaction'
  | 'form_completed'
  | 'streak_7'
  | 'streak_30'
  | 'weekly_adherence'

export interface PointActionConfig {
  points: number
  category: string
  reason: string
}

export const POINT_VALUES: Record<PointAction, PointActionConfig> = {
  workout_completed: { points: 15, category: 'workout', reason: 'Treino completo' },
  all_meals_logged: { points: 10, category: 'nutrition', reason: 'Todas refeicoes registradas' },
  water_goal_met: { points: 5, category: 'hydration', reason: 'Meta de agua atingida' },
  sleep_logged: { points: 3, category: 'sleep', reason: 'Sono registrado' },
  pr_achieved: { points: 10, category: 'workout', reason: 'Personal Record' },
  post_created: { points: 4, category: 'social', reason: 'Post no feed' },
  comment_or_reaction: { points: 1, category: 'social', reason: 'Interacao no feed' },
  form_completed: { points: 5, category: 'form_completion', reason: 'Formulario preenchido' },
  streak_7: { points: 15, category: 'consistency', reason: 'Streak de 7 dias consecutivos' },
  streak_30: { points: 50, category: 'consistency', reason: 'Streak de 30 dias consecutivos' },
  weekly_adherence: { points: 10, category: 'nutrition', reason: 'Aderencia ao plano alimentar (semana)' },
}

const TX_TO_RANKING_CATEGORIES: Record<string, string[]> = {
  nutrition: ['nutrition'],
  workout: ['workout'],
  consistency: ['consistency'],
  sleep: ['consistency'],
  wellness: ['consistency'],
  hydration: ['consistency'],
}

export interface AwardPointsServerResult {
  success: boolean
  duplicate?: boolean
  points?: number
  message?: string
  error?: string
  transaction?: unknown
}

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

/**
 * Award points to a user for an action (server-side).
 * Bypasses auth — caller is responsible for verifying the action belongs to userId.
 *
 * @param userId  Target user ID
 * @param action  Action name (key of POINT_VALUES)
 * @param referenceId Optional ID to dedup by (e.g. workout id, set id, post id).
 *                    If omitted, dedup is per-day (action is awarded at most once per day).
 */
export async function awardPointsServer(
  userId: string,
  action: PointAction,
  referenceId?: string
): Promise<AwardPointsServerResult> {
  const config = POINT_VALUES[action]
  if (!config) {
    return { success: false, error: 'Acao invalida' }
  }

  const supabaseAdmin = getAdminClient()

  // Dedup by reference_id (specific event)
  if (referenceId) {
    const { data: existing } = await supabaseAdmin
      .from('fitness_point_transactions')
      .select('id')
      .eq('user_id', userId)
      .eq('reference_id', referenceId)
      .eq('category', config.category)
      .limit(1)

    if (existing && existing.length > 0) {
      return { success: true, duplicate: true, message: 'Pontos ja atribuidos para esta acao' }
    }
  } else {
    // Dedup per-day (one award per action+source per day)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const { data: todayExisting } = await supabaseAdmin
      .from('fitness_point_transactions')
      .select('id')
      .eq('user_id', userId)
      .eq('reason', config.reason)
      .eq('source', 'automatic')
      .gte('created_at', today.toISOString())
      .limit(1)

    if (todayExisting && todayExisting.length > 0) {
      return { success: true, duplicate: true, message: 'Pontos ja atribuidos hoje para esta acao' }
    }
  }

  // Insert transaction
  const { data: transaction, error: insertError } = await supabaseAdmin
    .from('fitness_point_transactions')
    .insert({
      user_id: userId,
      points: config.points,
      reason: config.reason,
      category: config.category,
      source: 'automatic',
      reference_id: referenceId || null,
    })
    .select()
    .single()

  if (insertError) {
    console.error('Erro ao atribuir pontos:', insertError)
    return { success: false, error: 'Erro ao atribuir pontos' }
  }

  // Atomic ranking update via RPC
  const allowedRankingCategories = TX_TO_RANKING_CATEGORIES[config.category] || null
  const { error: rpcError } = await supabaseAdmin.rpc('fitness_award_points_to_user', {
    p_user_id: userId,
    p_delta: config.points,
    p_allowed_ranking_categories: allowedRankingCategories,
  })
  if (rpcError) {
    console.error('fitness_award_points_to_user falhou:', rpcError)
  }

  // Update active challenge scores (best-effort)
  const today = new Date().toISOString().split('T')[0]
  const { data: userChallenges } = await supabaseAdmin
    .from('fitness_challenge_participants')
    .select('challenge_id')
    .eq('user_id', userId)

  if (userChallenges && userChallenges.length > 0) {
    const challengeIds = userChallenges.map((c: { challenge_id: string }) => c.challenge_id)
    const { data: activeChallenges } = await supabaseAdmin
      .from('fitness_challenges')
      .select('id, scoring_category')
      .in('id', challengeIds)
      .eq('is_active', true)
      .lte('start_date', today)
      .gte('end_date', today)

    for (const ch of (activeChallenges || [])) {
      if (ch.scoring_category && ch.scoring_category !== config.category) continue

      const { data: participant } = await supabaseAdmin
        .from('fitness_challenge_participants')
        .select('score')
        .eq('challenge_id', ch.id)
        .eq('user_id', userId)
        .single()

      if (participant) {
        await supabaseAdmin
          .from('fitness_challenge_participants')
          .update({ score: (participant.score || 0) + config.points })
          .eq('challenge_id', ch.id)
          .eq('user_id', userId)
      }
    }
  }

  // Tier update (never demotes)
  try {
    await supabaseAdmin.rpc('update_user_tier', { p_user_id: userId })
  } catch {
    // best-effort
  }

  return {
    success: true,
    transaction,
    points: config.points,
    message: `+${config.points} pontos: ${config.reason}`,
  }
}
