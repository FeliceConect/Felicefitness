import type { CardTemplate, ThemeColors, ShareTheme } from '@/types/share'

// Card Templates
export const CARD_TEMPLATES: Record<string, CardTemplate> = {
  workout: {
    id: 'workout',
    name: 'Treino Concluido',
    sizes: {
      square: { width: 1080, height: 1080 },
      story: { width: 1080, height: 1920 },
      wide: { width: 1200, height: 630 },
    },
    elements: [
      'background',
      'title',
      'workout_name',
      'stats',
      'date',
      'watermark',
    ],
  },

  pr: {
    id: 'pr',
    name: 'Novo Recorde',
    sizes: {
      square: { width: 1080, height: 1080 },
      story: { width: 1080, height: 1920 },
      wide: { width: 1200, height: 630 },
    },
    elements: [
      'background_celebration',
      'trophy_icon',
      'exercise_name',
      'new_weight',
      'improvement',
      'date',
      'watermark',
    ],
  },

  achievement: {
    id: 'achievement',
    name: 'Conquista',
    sizes: {
      square: { width: 1080, height: 1080 },
      story: { width: 1080, height: 1920 },
      wide: { width: 1200, height: 630 },
    },
    elements: [
      'background_achievement',
      'badge_icon',
      'achievement_name',
      'achievement_description',
      'date',
      'watermark',
    ],
  },

  streak: {
    id: 'streak',
    name: 'Streak',
    sizes: {
      square: { width: 1080, height: 1080 },
      story: { width: 1080, height: 1920 },
      wide: { width: 1200, height: 630 },
    },
    elements: [
      'background_fire',
      'flame_icon',
      'streak_number',
      'streak_text',
      'watermark',
    ],
  },

  progress: {
    id: 'progress',
    name: 'Progresso',
    sizes: {
      square: { width: 1080, height: 1080 },
      story: { width: 1080, height: 1920 },
      wide: { width: 1200, height: 630 },
    },
    elements: [
      'background',
      'before_photo',
      'after_photo',
      'stats_comparison',
      'timeframe',
      'watermark',
    ],
  },

  weekly: {
    id: 'weekly',
    name: 'Resumo da Semana',
    sizes: {
      square: { width: 1080, height: 1080 },
      story: { width: 1080, height: 1920 },
      wide: { width: 1200, height: 630 },
    },
    elements: [
      'background',
      'week_title',
      'score',
      'highlights',
      'stats_grid',
      'watermark',
    ],
  },
}

// Theme Colors
export const TEMPLATE_THEMES: Record<ShareTheme, ThemeColors> = {
  power: {
    background: '#1a1615',
    primary: '#c29863',
    secondary: '#ae9b89',
    text: '#FFFFFF',
    accent: '#c29863',
  },
  light: {
    background: '#f7f2ed',
    primary: '#663739',
    secondary: '#ae9b89',
    text: '#322b29',
    accent: '#c29863',
  },
  gradient: {
    background: 'linear-gradient(135deg, #663739 0%, #322b29 100%)',
    primary: '#c29863',
    secondary: '#ddd5c7',
    text: '#FFFFFF',
    accent: '#c29863',
  },
  fire: {
    background: 'linear-gradient(135deg, #c29863 0%, #663739 100%)',
    primary: '#FFFFFF',
    secondary: '#ddd5c7',
    text: '#FFFFFF',
    accent: '#FFFFFF',
  },
}

// Get theme colors
export function getThemeColors(theme: ShareTheme): ThemeColors {
  return TEMPLATE_THEMES[theme] || TEMPLATE_THEMES.power
}

// Get template
export function getTemplate(type: string): CardTemplate | undefined {
  return CARD_TEMPLATES[type]
}

// Format sizes
export const FORMAT_SIZES = {
  square: { width: 1080, height: 1080, label: 'Post (1:1)' },
  story: { width: 1080, height: 1920, label: 'Story (9:16)' },
  wide: { width: 1200, height: 630, label: 'Twitter/Link (1.91:1)' },
}
