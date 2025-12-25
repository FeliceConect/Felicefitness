// Exercise animations mapping for immersive mode

// Map exercise slugs/ids to animation files
export const EXERCISE_ANIMATIONS: Record<string, string> = {
  // Peito
  supino_reto: '/animations/bench-press.json',
  supino_inclinado: '/animations/incline-bench.json',
  supino_declinado: '/animations/decline-bench.json',
  crucifixo: '/animations/chest-fly.json',
  crucifixo_inclinado: '/animations/incline-fly.json',
  flexao: '/animations/pushup.json',
  crossover: '/animations/cable-crossover.json',

  // Costas
  remada_curvada: '/animations/bent-over-row.json',
  puxada_frontal: '/animations/lat-pulldown.json',
  puxada_supinada: '/animations/close-grip-pulldown.json',
  remada_unilateral: '/animations/single-arm-row.json',
  remada_cavalinho: '/animations/t-bar-row.json',
  pulldown: '/animations/straight-arm-pulldown.json',
  barra_fixa: '/animations/pullup.json',
  terra: '/animations/deadlift.json',

  // Pernas
  leg_press: '/animations/leg-press.json',
  agachamento: '/animations/squat.json',
  agachamento_frontal: '/animations/front-squat.json',
  hack_squat: '/animations/hack-squat.json',
  extensora: '/animations/leg-extension.json',
  flexora: '/animations/leg-curl.json',
  afundo: '/animations/lunge.json',
  passada: '/animations/walking-lunge.json',
  stiff: '/animations/stiff-leg-deadlift.json',
  panturrilha: '/animations/calf-raise.json',
  adutor: '/animations/hip-adduction.json',
  abdutor: '/animations/hip-abduction.json',

  // Ombros
  desenvolvimento: '/animations/shoulder-press.json',
  desenvolvimento_halteres: '/animations/dumbbell-press.json',
  elevacao_lateral: '/animations/lateral-raise.json',
  elevacao_frontal: '/animations/front-raise.json',
  crucifixo_invertido: '/animations/reverse-fly.json',
  encolhimento: '/animations/shrug.json',
  face_pull: '/animations/face-pull.json',

  // Bíceps
  rosca_direta: '/animations/bicep-curl.json',
  rosca_alternada: '/animations/alternating-curl.json',
  rosca_martelo: '/animations/hammer-curl.json',
  rosca_scott: '/animations/preacher-curl.json',
  rosca_concentrada: '/animations/concentration-curl.json',

  // Tríceps
  triceps_pulley: '/animations/tricep-pushdown.json',
  triceps_corda: '/animations/rope-pushdown.json',
  triceps_testa: '/animations/skull-crusher.json',
  triceps_frances: '/animations/french-press.json',
  mergulho: '/animations/dip.json',

  // Core
  prancha: '/animations/plank.json',
  prancha_lateral: '/animations/side-plank.json',
  abdominal: '/animations/crunch.json',
  abdominal_infra: '/animations/leg-raise.json',
  russian_twist: '/animations/russian-twist.json',
  bicycle: '/animations/bicycle-crunch.json',
  mountain_climber: '/animations/mountain-climber.json',
}

// Default animation for exercises without specific animation
export const DEFAULT_ANIMATION = '/animations/generic-exercise.json'

// Get animation URL for an exercise
export function getExerciseAnimation(exerciseId: string): string {
  // Normalize the exercise ID (lowercase, replace spaces with underscores)
  const normalizedId = exerciseId.toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_')

  return EXERCISE_ANIMATIONS[normalizedId] || DEFAULT_ANIMATION
}

// Check if exercise has a specific animation
export function hasExerciseAnimation(exerciseId: string): boolean {
  const normalizedId = exerciseId.toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_')
  return normalizedId in EXERCISE_ANIMATIONS
}

// Muscle group icons
export const MUSCLE_GROUP_ICONS: Record<string, string> = {
  peito: '💪',
  costas: '🔙',
  pernas: '🦵',
  ombros: '🎯',
  biceps: '💪',
  triceps: '💪',
  core: '🔥',
  abdomen: '🔥',
  gluteos: '🍑',
  antebraco: '✊',
  panturrilha: '🦶',
  cardio: '❤️',
}

// Get muscle group icon
export function getMuscleGroupIcon(muscleGroup: string): string {
  const normalized = muscleGroup.toLowerCase()
  return MUSCLE_GROUP_ICONS[normalized] || '💪'
}
