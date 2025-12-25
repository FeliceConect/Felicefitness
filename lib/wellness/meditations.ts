// Meditation definitions

import type { Meditation, MeditationCategory } from '@/types/wellness'

export const MEDITATIONS: Meditation[] = [
  {
    id: 'morning_intention',
    name: 'Intenção Matinal',
    description: 'Comece o dia com clareza e propósito',
    duration: 5,
    category: 'morning',
    icon: '🌅',
    steps: [
      'Sente-se confortavelmente e feche os olhos',
      'Faça 3 respirações profundas',
      'Pense: "O que eu quero realizar hoje?"',
      'Visualize seu dia ideal',
      'Defina uma intenção clara para o dia',
      'Abra os olhos lentamente',
    ],
  },
  {
    id: 'body_scan',
    name: 'Escaneamento Corporal',
    description: 'Relaxe cada parte do corpo',
    duration: 10,
    category: 'relax',
    icon: '🧘',
    steps: [
      'Deite-se ou sente-se confortavelmente',
      'Feche os olhos e respire profundamente',
      'Leve a atenção aos pés. Relaxe.',
      'Suba para as pernas. Solte a tensão.',
      'Abdômen e peito. Respire.',
      'Ombros e braços. Relaxe.',
      'Pescoço e rosto. Solte.',
      'Sinta todo o corpo relaxado',
    ],
  },
  {
    id: 'focus_5min',
    name: 'Foco em 5 Minutos',
    description: 'Restaure o foco antes de tarefas importantes',
    duration: 5,
    category: 'focus',
    icon: '🎯',
    steps: [
      'Sente-se com a coluna ereta',
      'Feche os olhos',
      'Foque apenas na sua respiração',
      'Quando pensamentos vierem, volte à respiração',
      'Não julgue, apenas observe',
      'Abra os olhos renovado',
    ],
  },
  {
    id: 'gratitude_meditation',
    name: 'Meditação de Gratidão',
    description: 'Cultive gratidão e positividade',
    duration: 7,
    category: 'gratitude',
    icon: '🙏',
    steps: [
      'Feche os olhos e respire',
      'Pense em algo pelo qual é grato hoje',
      'Sinta a gratidão no peito',
      'Pense em uma pessoa que você aprecia',
      'Envie mentalmente bons desejos a ela',
      'Agradeça a si mesmo pelo autocuidado',
      'Abra os olhos com um sorriso',
    ],
  },
  {
    id: 'pre_sleep',
    name: 'Preparação para Dormir',
    description: 'Acalme a mente antes de dormir',
    duration: 10,
    category: 'sleep',
    icon: '🌙',
    steps: [
      'Deite-se na cama confortavelmente',
      'Feche os olhos',
      'Faça respirações lentas e profundas',
      'Solte as preocupações do dia',
      'Imagine um lugar tranquilo e seguro',
      'Sinta seu corpo pesado e relaxado',
      'Continue respirando lentamente...',
      'Deixe-se adormecer naturalmente',
    ],
  },
  {
    id: 'stress_relief',
    name: 'Alívio de Stress',
    description: 'Reduza o stress rapidamente',
    duration: 5,
    category: 'relax',
    icon: '💆',
    steps: [
      'Pare o que está fazendo',
      'Feche os olhos',
      'Inspire contando até 4',
      'Segure contando até 4',
      'Expire contando até 6',
      'Repita 5 vezes',
      'Solte ombros e mandíbula',
      'Abra os olhos renovado',
    ],
  },
]

export function getMeditation(id: string): Meditation | undefined {
  return MEDITATIONS.find((m) => m.id === id)
}

export function getMeditationsByCategory(category: MeditationCategory): Meditation[] {
  return MEDITATIONS.filter((m) => m.category === category)
}

export function getCategoryLabel(category: MeditationCategory): string {
  switch (category) {
    case 'focus':
      return 'Foco'
    case 'relax':
      return 'Relaxamento'
    case 'sleep':
      return 'Sono'
    case 'morning':
      return 'Manhã'
    case 'gratitude':
      return 'Gratidão'
    default:
      return category
  }
}

export function getCategoryIcon(category: MeditationCategory): string {
  switch (category) {
    case 'focus':
      return '🎯'
    case 'relax':
      return '🧘'
    case 'sleep':
      return '🌙'
    case 'morning':
      return '🌅'
    case 'gratitude':
      return '🙏'
    default:
      return '🧘'
  }
}

export function suggestMeditation(mood: number, stress: number, energy: number): Meditation {
  // High stress -> stress relief
  if (stress >= 4) {
    return MEDITATIONS.find((m) => m.id === 'stress_relief')!
  }

  // Low mood -> gratitude
  if (mood <= 2) {
    return MEDITATIONS.find((m) => m.id === 'gratitude_meditation')!
  }

  // Low energy -> energizing focus
  if (energy <= 2) {
    return MEDITATIONS.find((m) => m.id === 'focus_5min')!
  }

  // Default based on time of day
  const hour = new Date().getHours()
  if (hour < 10) {
    return MEDITATIONS.find((m) => m.id === 'morning_intention')!
  }
  if (hour >= 21) {
    return MEDITATIONS.find((m) => m.id === 'pre_sleep')!
  }

  // Default
  return MEDITATIONS.find((m) => m.id === 'focus_5min')!
}
