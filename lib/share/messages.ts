// Share Messages and Templates

export const SHARE_MESSAGES = {
  workout: {
    default: 'Treino concluido! #{workoutName} no @Complexo Wellness',
    with_prs: 'Treino concluido com {prs} PRs! #{workoutName}',
    morning: 'Comecando o dia com treino! #{workoutName}',
  },

  pr: {
    default: 'Novo recorde pessoal! {exercise}: {weight}kg',
    improvement: '+{improvement}kg no {exercise}! Evolucao constante',
  },

  achievement: {
    default: 'Conquista desbloqueada: {name}!',
    streak: '{days} dias de consistencia! #{name}',
  },

  streak: {
    default: '{days} dias de streak! Consistencia e tudo!',
    milestone: 'Marco atingido: {days} dias de streak!',
    messages: [
      'Consistencia e tudo!',
      'Sem desculpas!',
      'Um dia de cada vez',
      'O segredo e nao parar!',
      'Resultados vem com constancia',
      'Disciplina > Motivacao',
      'Todo dia e dia de evolucao',
      'Mais forte a cada dia',
    ],
  },

  progress: {
    default: '{days} dias de transformacao! Progresso real.',
    with_stats: '-{weight}kg | -{fat}% gordura | +{muscle}kg musculo',
  },

  weekly: {
    default: 'Semana concluida! Score: {score}/100',
    highlights: '{workouts} treinos | {prs} PRs | {streak} dias streak',
  },
}

// Generate share text with variable substitution
export function generateShareText(
  type: string,
  data: Record<string, unknown>,
  templateKey: string = 'default'
): string {
  const templates = SHARE_MESSAGES[type as keyof typeof SHARE_MESSAGES]
  if (!templates) return ''

  const template = (templates as Record<string, string | string[]>)[templateKey] || templates.default
  const templateStr = Array.isArray(template) ? template[0] : template

  // Replace variables
  return templateStr.replace(/\{(\w+)\}/g, (match, key) => {
    const value = data[key]
    return value !== undefined ? String(value) : match
  })
}

// Get random streak message
export function getRandomStreakMessage(): string {
  const messages = SHARE_MESSAGES.streak.messages
  return messages[Math.floor(Math.random() * messages.length)]
}

// Format date for sharing
export function formatShareDate(date: Date): string {
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

// Hashtags
export const HASHTAGS = {
  workout: ['#treino', '#fitness', '#gym', '#workout'],
  pr: ['#pr', '#personalrecord', '#recorde', '#forca'],
  achievement: ['#conquista', '#achievement', '#goals'],
  streak: ['#streak', '#consistencia', '#disciplina'],
  progress: ['#transformacao', '#antesedepois', '#progresso'],
  weekly: ['#resumodasemana', '#fitness', '#metas'],
}

export function getHashtags(type: string, count: number = 3): string[] {
  const tags = HASHTAGS[type as keyof typeof HASHTAGS] || []
  return tags.slice(0, count)
}
