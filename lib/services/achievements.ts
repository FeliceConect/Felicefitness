/**
 * Achievements & Streak Freeze Service
 *
 * Client-side service for managing achievements (Supabase DB)
 * and streak freeze logic (2 grace days per month).
 */

import { getSupabase } from './base'

// ========== Types ==========

export interface AchievementCodeEntry {
  code: string
  unlockedAt: Date
}

export interface FreezeInfo {
  freezeUsed: number
  freezeMonth: string | null
  lastActivityDate: string | null
}

export interface FreezeResult {
  freezesAvailable: number
  freezesUsed: number
  newStreak: number | null
  frozenDays: number
}

// ========== Achievements ==========

/**
 * Fetch all unlocked achievement codes for the current user.
 * Uses RPC function that joins fitness_achievements_users with fitness_achievements.
 */
export async function getUserAchievementCodes(): Promise<AchievementCodeEntry[]> {
  const supabase = getSupabase()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc('get_user_achievement_codes')

  if (error) {
    console.error('Erro ao buscar conquistas do usuário:', error)
    return []
  }

  return (data || []).map((a: { code: string; unlocked_at: string }) => ({
    code: a.code,
    unlockedAt: new Date(a.unlocked_at),
  }))
}

/**
 * Unlock a single achievement by its code.
 * Uses RPC function that looks up the UUID and inserts (ON CONFLICT DO NOTHING).
 */
export async function unlockAchievementByCode(code: string): Promise<boolean> {
  const supabase = getSupabase()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc('unlock_achievement_by_code', {
    p_code: code,
  })

  if (error) {
    console.error(`Erro ao desbloquear conquista "${code}":`, error)
    return false
  }

  return data === true
}

/**
 * Unlock multiple achievements in sequence.
 */
export async function unlockAchievements(codes: string[]): Promise<void> {
  for (const code of codes) {
    await unlockAchievementByCode(code)
  }
}

// ========== Streak Freeze ==========

/**
 * Get the current streak freeze status for the user.
 */
export async function getStreakFreezeStatus(userId: string): Promise<{
  freezesAvailable: number
  freezesUsed: number
}> {
  const supabase = getSupabase()
  const currentMonth = new Date().toISOString().slice(0, 7)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from('fitness_profiles')
    .select('streak_freeze_used, streak_freeze_month')
    .eq('id', userId)
    .single()

  const used =
    profile?.streak_freeze_month === currentMonth
      ? profile?.streak_freeze_used || 0
      : 0

  return { freezesAvailable: 2 - used, freezesUsed: used }
}

/**
 * Check for missed days since last activity and auto-apply streak freezes.
 *
 * Logic:
 * - Calculate days gap between last activity and today
 * - If gap <= 1 (today or yesterday): no action needed
 * - If gap > 1: for each missed day, try to consume a freeze
 * - If enough freezes: streak survives (frozen days inserted in log)
 * - If not enough freezes: streak resets to 0
 *
 * @param userId - The user's ID
 * @param currentStreak - The user's current streak count
 * @param freezeInfo - Current freeze status from profile
 * @returns Updated freeze status and new streak value
 */
export async function applyStreakFreezes(
  userId: string,
  currentStreak: number,
  freezeInfo: FreezeInfo
): Promise<FreezeResult> {
  const supabase = getSupabase()
  const currentMonth = new Date().toISOString().slice(0, 7)

  // Reset monthly counter if new month
  const freezeUsed =
    freezeInfo.freezeMonth === currentMonth ? freezeInfo.freezeUsed : 0
  const freezesAvailable = 2 - freezeUsed

  const lastActivityDate = freezeInfo.lastActivityDate

  // No last activity or streak already 0 → nothing to protect
  if (!lastActivityDate || currentStreak === 0) {
    return {
      freezesAvailable,
      freezesUsed: freezeUsed,
      newStreak: null,
      frozenDays: 0,
    }
  }

  // Calculate missed days
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const lastDate = new Date(lastActivityDate + 'T00:00:00')
  lastDate.setHours(0, 0, 0, 0)

  const daysDiff = Math.floor(
    (today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
  )

  // Last activity was today or yesterday → streak is safe
  if (daysDiff <= 1) {
    return {
      freezesAvailable,
      freezesUsed: freezeUsed,
      newStreak: null,
      frozenDays: 0,
    }
  }

  // Missed days = gap minus 1 (today isn't over yet)
  const missedDays = daysDiff - 1
  const freezesToUse = Math.min(missedDays, freezesAvailable)

  if (freezesToUse < missedDays) {
    // Not enough freezes → streak is lost
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('fitness_profiles')
      .update({
        streak_atual: 0,
        streak_freeze_used: freezeUsed,
        streak_freeze_month: currentMonth,
      })
      .eq('id', userId)

    return {
      freezesAvailable: 2 - freezeUsed,
      freezesUsed: freezeUsed,
      newStreak: 0,
      frozenDays: 0,
    }
  }

  // All missed days covered by freezes → insert freeze entries
  for (let i = 1; i <= missedDays; i++) {
    const missedDate = new Date(lastDate)
    missedDate.setDate(missedDate.getDate() + i)
    const dateStr = missedDate.toISOString().split('T')[0]

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('fitness_streak_freeze_log')
      .insert({
        user_id: userId,
        used_for_date: dateStr,
        streak_at_time: currentStreak,
        month_year: currentMonth,
      })

    // Ignore duplicate errors (23505 = unique_violation)
    if (error && error.code !== '23505') {
      console.error('Erro ao inserir freeze:', error)
    }
  }

  const newFreezeUsed = freezeUsed + missedDays

  // Update profile freeze counter
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from('fitness_profiles')
    .update({
      streak_freeze_used: newFreezeUsed,
      streak_freeze_month: currentMonth,
    })
    .eq('id', userId)

  // Recalculate streak via RPC (accounts for frozen days)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: newStreak } = await (supabase as any).rpc(
    'recalculate_my_streak'
  )

  return {
    freezesAvailable: 2 - newFreezeUsed,
    freezesUsed: newFreezeUsed,
    newStreak: newStreak ?? currentStreak,
    frozenDays: missedDays,
  }
}
