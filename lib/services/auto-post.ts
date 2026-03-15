/**
 * Auto-Post Service
 *
 * Fire-and-forget functions that create auto-generated feed posts
 * when users complete activities (workouts, check-ins, achievements, level-ups).
 * Respects the user's auto_publish_feed setting.
 */

import { getSupabase } from './base'

// ========== Internal helpers ==========

async function isAutoPublishEnabled(): Promise<boolean> {
  try {
    const supabase = getSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (supabase as any)
      .from('fitness_profiles')
      .select('auto_publish_feed')
      .eq('id', user.id)
      .single()

    // Default to enabled if column is null
    return profile?.auto_publish_feed !== false
  } catch {
    return true
  }
}

async function createAutoPost(
  postType: string,
  content: string,
  metadata?: Record<string, unknown>,
  relatedId?: string
): Promise<boolean> {
  try {
    const enabled = await isAutoPublishEnabled()
    if (!enabled) return false

    const response = await fetch('/api/feed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        post_type: postType,
        content,
        metadata: metadata || {},
        related_id: relatedId,
        is_auto_generated: true,
      }),
    })

    return response.ok
  } catch {
    return false
  }
}

/** Fire-and-forget wrapper — never blocks the caller */
function postInBackground(
  postType: string,
  content: string,
  metadata?: Record<string, unknown>,
  relatedId?: string
): void {
  createAutoPost(postType, content, metadata, relatedId).catch(() => {})
}

// ========== Public API ==========

/** Auto-post when a workout is completed */
export function autoPostWorkout(data: {
  workoutName: string
  duration: number
  exercises: number
  volume: number
  calories: number
  energy?: number
  prs?: Array<{ exercise: string; weight: number; reps: number }>
  workoutId?: string
}): void {
  const prText =
    data.prs && data.prs.length > 0
      ? ` 🏆 ${data.prs.length} PR${data.prs.length > 1 ? 's' : ''}!`
      : ''

  postInBackground(
    'workout',
    `Completei meu treino "${data.workoutName}"! 💪 ${data.duration}min, ${data.exercises} exercícios, ${Math.round(data.volume)}kg de volume.${prText}`,
    {
      duracao_min: data.duration,
      exercicios: data.exercises,
      volume_total: Math.round(data.volume),
      calorias: data.calories,
      energia: data.energy,
      prs: data.prs,
    },
    data.workoutId
  )
}

/** Auto-post when an achievement is unlocked */
export function autoPostAchievement(data: {
  name: string
  description: string
  icon: string
  tier: string
  xpReward: number
}): void {
  postInBackground(
    'achievement',
    `Desbloqueei a conquista "${data.name}"! ${data.icon} +${data.xpReward} XP`,
    {
      titulo: data.name,
      descricao: data.description,
      icone: data.icon,
      tier: data.tier,
      xp: data.xpReward,
    }
  )
}

/** Auto-post when the user levels up */
export function autoPostLevelUp(data: {
  level: number
  name: string
}): void {
  postInBackground(
    'level_up',
    `Subi para o Nível ${data.level} — ${data.name}! ⬆️`,
    {
      nivel: data.level,
      nome_nivel: data.name,
    }
  )
}

/** Auto-post when a meal is logged */
export function autoPostMeal(data: {
  mealType: string
  calories: number
  protein: number
  carbs: number
  fat: number
}): void {
  const typeLabels: Record<string, string> = {
    cafe_da_manha: 'Café da Manhã',
    lanche_manha: 'Lanche da Manhã',
    almoco: 'Almoço',
    lanche_tarde: 'Lanche da Tarde',
    jantar: 'Jantar',
    ceia: 'Ceia',
    pre_treino: 'Pré-Treino',
    pos_treino: 'Pós-Treino',
  }

  const label = typeLabels[data.mealType] || 'Refeição'

  postInBackground(
    'meal',
    `Registrei meu ${label}! 🍽️ ${data.calories}kcal, ${data.protein}g proteína`,
    {
      tipo_refeicao: data.mealType,
      calorias: data.calories,
      proteinas: data.protein,
      carboidratos: data.carbs,
      gorduras: data.fat,
    }
  )
}

/** Auto-post when a wellness check-in is completed */
export function autoPostCheckin(data: {
  humor: number
  energia: number
  stress: number
}): void {
  const moodEmoji = ['😢', '😕', '😐', '🙂', '😊'][data.humor - 1] || '😐'
  const energyEmoji = ['😴', '😐', '🙂', '😊', '🔥'][data.energia - 1] || '😐'

  postInBackground(
    'check_in',
    `Check-in de bem-estar: ${moodEmoji} humor, ${energyEmoji} energia`,
    {
      humor: data.humor,
      energia: data.energia,
      stress: data.stress,
    }
  )
}

/** Auto-post when a streak milestone is reached */
export function autoPostStreakMilestone(streak: number): void {
  const messages: Record<number, string> = {
    7: 'Uma semana completa!',
    14: 'Duas semanas invicto!',
    30: 'UM MÊS de disciplina!',
    60: 'Dois meses consecutivos!',
    90: 'Três meses — Trimestre de Ouro!',
    180: 'Meio ano invicto!',
    365: 'UM ANO COMPLETO!',
  }

  const message = messages[streak]
  if (!message) return

  postInBackground(
    'achievement',
    `🔥 ${streak} dias de streak! ${message}`,
    {
      titulo: `${streak} dias de streak`,
      tipo: 'streak_milestone',
      streak,
    }
  )
}
