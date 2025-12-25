// Wellness tips and recommendations

import type { WellnessTip } from '@/types/wellness'

export const WELLNESS_TIPS: WellnessTip[] = [
  // Mood tips
  {
    id: 'mood_1',
    text: 'Mesmo em dias difíceis, encontre um pequeno momento de alegria. Pode ser um café, uma música, ou um sorriso.',
    category: 'mood',
    icon: '😊',
  },
  {
    id: 'mood_2',
    text: 'Movimentar o corpo libera endorfinas. Até uma caminhada curta pode melhorar seu humor.',
    category: 'mood',
    icon: '🚶',
  },
  {
    id: 'mood_3',
    text: 'Conectar-se com pessoas queridas é um dos melhores remédios para o humor baixo.',
    category: 'mood',
    icon: '❤️',
  },

  // Stress tips
  {
    id: 'stress_1',
    text: 'Quando o stress aumentar, faça uma pausa de 2 minutos. Respire fundo e observe seu ambiente.',
    category: 'stress',
    icon: '🧘',
  },
  {
    id: 'stress_2',
    text: 'Priorize. Nem tudo é urgente. Identifique o que realmente precisa de sua atenção agora.',
    category: 'stress',
    icon: '📋',
  },
  {
    id: 'stress_3',
    text: 'A natureza é um antídoto natural para o stress. Tente passar alguns minutos ao ar livre.',
    category: 'stress',
    icon: '🌳',
  },

  // Energy tips
  {
    id: 'energy_1',
    text: 'Hidratação é fundamental. Muitas vezes o cansaço é desidratação disfarçada.',
    category: 'energy',
    icon: '💧',
  },
  {
    id: 'energy_2',
    text: 'Uma power nap de 20 minutos pode restaurar sua energia sem afetar o sono noturno.',
    category: 'energy',
    icon: '😴',
  },
  {
    id: 'energy_3',
    text: 'Exposição à luz natural pela manhã ajuda a regular seu ritmo circadiano.',
    category: 'energy',
    icon: '☀️',
  },

  // Sleep tips
  {
    id: 'sleep_1',
    text: 'Evite telas pelo menos 30 minutos antes de dormir. A luz azul afeta a produção de melatonina.',
    category: 'sleep',
    icon: '📱',
  },
  {
    id: 'sleep_2',
    text: 'Mantenha horários regulares de sono, mesmo nos fins de semana.',
    category: 'sleep',
    icon: '🛏️',
  },
  {
    id: 'sleep_3',
    text: 'Um ambiente fresco (18-21°C) favorece um sono mais profundo.',
    category: 'sleep',
    icon: '❄️',
  },

  // General tips
  {
    id: 'general_1',
    text: 'Gratidão é uma prática poderosa. Três coisas positivas por dia podem transformar sua perspectiva.',
    category: 'general',
    icon: '🙏',
  },
  {
    id: 'general_2',
    text: 'Seu corpo e mente são conectados. Cuidar de um é cuidar do outro.',
    category: 'general',
    icon: '🧠',
  },
  {
    id: 'general_3',
    text: 'Pequenos progressos são ainda progressos. Celebre cada passo.',
    category: 'general',
    icon: '🎉',
  },
]

export function getRandomTip(category?: string): WellnessTip {
  const tips = category
    ? WELLNESS_TIPS.filter((t) => t.category === category)
    : WELLNESS_TIPS
  return tips[Math.floor(Math.random() * tips.length)]
}

export function getTipForMood(mood: number): WellnessTip {
  if (mood <= 2) {
    return getRandomTip('mood')
  }
  return getRandomTip()
}

export function getTipForStress(stress: number): WellnessTip {
  if (stress >= 4) {
    return getRandomTip('stress')
  }
  return getRandomTip()
}

export function getTipForEnergy(energy: number): WellnessTip {
  if (energy <= 2) {
    return getRandomTip('energy')
  }
  return getRandomTip()
}

// Personalized recommendations based on wellness data
export function getRecommendations(data: {
  avgMood: number
  avgStress: number
  avgEnergy: number
  workoutDays: number
  sleepQuality: number
}): string[] {
  const recommendations: string[] = []

  if (data.avgStress >= 3.5) {
    recommendations.push('Seu nível de stress está elevado. Experimente exercícios de respiração diários.')
  }

  if (data.avgMood < 3) {
    recommendations.push('Seu humor tem estado baixo. Considere adicionar mais atividades prazerosas ao dia.')
  }

  if (data.workoutDays < 3) {
    recommendations.push('Treinar mais vezes por semana pode melhorar significativamente seu humor.')
  }

  if (data.avgEnergy < 3) {
    recommendations.push('Sua energia está baixa. Revise sua qualidade de sono e hidratação.')
  }

  if (data.sleepQuality < 70) {
    recommendations.push('Melhore sua higiene do sono. Tente a meditação de preparação para dormir.')
  }

  if (recommendations.length === 0) {
    recommendations.push('Continue assim! Seus indicadores de bem-estar estão ótimos.')
  }

  return recommendations.slice(0, 3)
}
