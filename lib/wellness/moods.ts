// Mood, stress, and energy level definitions

import type { MoodLevel, StressLevel, EnergyLevel, MoodFactor } from '@/types/wellness'

export const MOOD_LEVELS: MoodLevel[] = [
  {
    value: 1,
    emoji: '😫',
    label: 'Muito mal',
    color: '#EF4444',
    description: 'Dia muito difícil',
  },
  {
    value: 2,
    emoji: '😕',
    label: 'Mal',
    color: '#F97316',
    description: 'Não está bom',
  },
  {
    value: 3,
    emoji: '😐',
    label: 'Neutro',
    color: '#EAB308',
    description: 'Normal, ok',
  },
  {
    value: 4,
    emoji: '🙂',
    label: 'Bem',
    color: '#22C55E',
    description: 'Bom dia',
  },
  {
    value: 5,
    emoji: '😄',
    label: 'Muito bem',
    color: '#06B6D4',
    description: 'Excelente!',
  },
]

export const STRESS_LEVELS: StressLevel[] = [
  { value: 1, label: 'Muito baixo', color: '#22C55E' },
  { value: 2, label: 'Baixo', color: '#84CC16' },
  { value: 3, label: 'Moderado', color: '#EAB308' },
  { value: 4, label: 'Alto', color: '#F97316' },
  { value: 5, label: 'Muito alto', color: '#EF4444' },
]

export const ENERGY_LEVELS: EnergyLevel[] = [
  { value: 1, emoji: '🪫', label: 'Exausto' },
  { value: 2, emoji: '😴', label: 'Cansado' },
  { value: 3, emoji: '😐', label: 'Normal' },
  { value: 4, emoji: '⚡', label: 'Energizado' },
  { value: 5, emoji: '🔥', label: 'Super energizado' },
]

export const POSITIVE_FACTORS: MoodFactor[] = [
  { id: 'good_sleep', label: 'Dormi bem', icon: '😴' },
  { id: 'workout', label: 'Treinei', icon: '💪' },
  { id: 'good_food', label: 'Comi bem', icon: '🥗' },
  { id: 'social', label: 'Tempo com família/amigos', icon: '👨‍👩‍👧' },
  { id: 'nature', label: 'Contato com natureza', icon: '🌳' },
  { id: 'achievement', label: 'Realizei algo', icon: '🎯' },
  { id: 'relaxed', label: 'Momento de relaxar', icon: '🧘' },
  { id: 'productive', label: 'Dia produtivo', icon: '✅' },
]

export const NEGATIVE_FACTORS: MoodFactor[] = [
  { id: 'poor_sleep', label: 'Dormi mal', icon: '😫' },
  { id: 'work_stress', label: 'Stress do trabalho', icon: '💼' },
  { id: 'health', label: 'Problema de saúde', icon: '🤒' },
  { id: 'conflict', label: 'Conflito/discussão', icon: '😤' },
  { id: 'anxiety', label: 'Ansiedade', icon: '😰' },
  { id: 'tired', label: 'Muito cansado', icon: '😩' },
  { id: 'overwhelmed', label: 'Sobrecarregado', icon: '🤯' },
  { id: 'lonely', label: 'Solidão', icon: '😔' },
]

export function getMoodLevel(value: number): MoodLevel | undefined {
  return MOOD_LEVELS.find((m) => m.value === value)
}

export function getStressLevel(value: number): StressLevel | undefined {
  return STRESS_LEVELS.find((s) => s.value === value)
}

export function getEnergyLevel(value: number): EnergyLevel | undefined {
  return ENERGY_LEVELS.find((e) => e.value === value)
}

export function getMoodColor(value: number): string {
  return getMoodLevel(value)?.color || '#6B7280'
}

export function getStressColor(value: number): string {
  return getStressLevel(value)?.color || '#6B7280'
}
