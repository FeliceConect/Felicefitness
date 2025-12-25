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
    background: '#0A0A0A',
    primary: '#8B5CF6',
    secondary: '#A78BFA',
    text: '#FFFFFF',
    accent: '#F59E0B',
  },
  light: {
    background: '#FFFFFF',
    primary: '#7C3AED',
    secondary: '#8B5CF6',
    text: '#1F2937',
    accent: '#F59E0B',
  },
  gradient: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    primary: '#FFFFFF',
    secondary: '#E0E7FF',
    text: '#FFFFFF',
    accent: '#FCD34D',
  },
  fire: {
    background: 'linear-gradient(135deg, #f12711 0%, #f5af19 100%)',
    primary: '#FFFFFF',
    secondary: '#FEF3C7',
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
