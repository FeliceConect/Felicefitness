// Breathing exercise patterns

import type { BreathingPattern } from '@/types/wellness'

export const BREATHING_PATTERNS: BreathingPattern[] = [
  {
    id: 'box',
    name: 'Respiração Quadrada',
    description: 'Técnica usada por Navy SEALs para acalmar',
    duration: 4,
    icon: '⬜',
    phases: {
      inhale: 4,
      holdIn: 4,
      exhale: 4,
      holdOut: 4,
    },
    cycles: 6,
    benefits: ['Reduz stress', 'Aumenta foco', 'Acalma a mente'],
  },
  {
    id: '478',
    name: 'Respiração 4-7-8',
    description: 'Técnica do Dr. Andrew Weil para relaxamento',
    duration: 5,
    icon: '🌙',
    phases: {
      inhale: 4,
      holdIn: 7,
      exhale: 8,
      holdOut: 0,
    },
    cycles: 4,
    benefits: ['Ajuda a dormir', 'Reduz ansiedade', 'Relaxamento profundo'],
  },
  {
    id: 'energizing',
    name: 'Respiração Energizante',
    description: 'Para aumentar energia e alerta',
    duration: 3,
    icon: '⚡',
    phases: {
      inhale: 4,
      holdIn: 0,
      exhale: 2,
      holdOut: 0,
    },
    cycles: 10,
    benefits: ['Aumenta energia', 'Melhora alerta', 'Pré-treino'],
  },
  {
    id: 'calm',
    name: 'Respiração Calmante',
    description: 'Expiração longa para ativar sistema parassimpático',
    duration: 5,
    icon: '🧘',
    phases: {
      inhale: 4,
      holdIn: 2,
      exhale: 6,
      holdOut: 2,
    },
    cycles: 6,
    benefits: ['Acalma nervos', 'Reduz frequência cardíaca', 'Pós-stress'],
  },
  {
    id: 'quick',
    name: 'Reset Rápido',
    description: '1 minuto para resetar',
    duration: 1,
    icon: '🔄',
    phases: {
      inhale: 3,
      holdIn: 3,
      exhale: 3,
      holdOut: 0,
    },
    cycles: 4,
    benefits: ['Rápido', 'Qualquer momento', 'Reset mental'],
  },
]

export function getBreathingPattern(id: string): BreathingPattern | undefined {
  return BREATHING_PATTERNS.find((p) => p.id === id)
}

export function getPhaseLabel(phase: string): string {
  switch (phase) {
    case 'inhale':
      return 'INSPIRE'
    case 'holdIn':
      return 'SEGURE'
    case 'exhale':
      return 'EXPIRE'
    case 'holdOut':
      return 'AGUARDE'
    default:
      return ''
  }
}

export function getPhaseColor(phase: string): string {
  switch (phase) {
    case 'inhale':
      return '#22C55E' // green
    case 'holdIn':
      return '#3B82F6' // blue
    case 'exhale':
      return '#8B5CF6' // purple
    case 'holdOut':
      return '#6B7280' // gray
    default:
      return '#6B7280'
  }
}

export function calculateTotalDuration(pattern: BreathingPattern): number {
  const { inhale, holdIn, exhale, holdOut } = pattern.phases
  const cycleTime = inhale + holdIn + exhale + holdOut
  return cycleTime * pattern.cycles
}
