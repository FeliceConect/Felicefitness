// Constantes e helpers compartilhados de CARDIO.
// Fonte única usada pelo construtor do personal (portal), pela conversão
// do programa no app do paciente e pelo modal de registro de cardio.

import type { CardioExerciseType, CardioIntensity } from './types'

/** Equipamentos/tipos de cardio (mesma lista do cardio-input-modal). */
export const CARDIO_EQUIPMENT: { value: CardioExerciseType; label: string; icon: string }[] = [
  { value: 'esteira', label: 'Esteira', icon: '🏃' },
  { value: 'bicicleta', label: 'Bicicleta', icon: '🚴' },
  { value: 'eliptico', label: 'Elíptico', icon: '🔄' },
  { value: 'transport', label: 'Transport', icon: '🚶' },
  { value: 'step', label: 'Step', icon: '🪜' },
  { value: 'remo', label: 'Remo', icon: '🚣' },
  { value: 'escada', label: 'Escada', icon: '🪜' },
  { value: 'pular_corda', label: 'Corda', icon: '🪢' },
  { value: 'outro', label: 'Outro', icon: '💪' },
]

/** Níveis de intensidade — mesmo domínio de fitness_activities. */
export const CARDIO_INTENSITY: { value: CardioIntensity; label: string; emoji: string }[] = [
  { value: 'leve', label: 'Leve', emoji: '😊' },
  { value: 'moderado', label: 'Moderado', emoji: '😤' },
  { value: 'intenso', label: 'Intenso', emoji: '🥵' },
  { value: 'muito_intenso', label: 'Máximo', emoji: '🔥' },
]

export function cardioEquipmentLabel(value?: string | null): string {
  return CARDIO_EQUIPMENT.find(e => e.value === value)?.label ?? 'Cardio'
}

export function cardioEquipmentIcon(value?: string | null): string {
  return CARDIO_EQUIPMENT.find(e => e.value === value)?.icon ?? '🏃'
}

export function cardioIntensityLabel(value?: string | null): string {
  return CARDIO_INTENSITY.find(i => i.value === value)?.label ?? '—'
}

/**
 * Um exercício do programa é cardio quando:
 *  - set_type === 'cardio' (novo tipo explícito), OU
 *  - exercise_category === 'cardio' / muscle_group === 'cardio' (legado —
 *    cardio criado antes deste recurso, que ficava como exercício de força).
 * Assim os cardios já cadastrados também passam a aparecer certo no app.
 */
export function isCardioExercise(ex: {
  set_type?: string | null
  exercise_category?: string | null
  muscle_group?: string | null
}): boolean {
  return ex.set_type === 'cardio'
    || ex.exercise_category === 'cardio'
    || ex.muscle_group === 'cardio'
}
