// Sistema de Níveis - Complexo Wellness Gamification

import type { Level } from '@/types/gamification'

/**
 * Definição dos 10 níveis do sistema
 * Progressão exponencial de XP necessário
 */
export const LEVELS: Level[] = [
  { level: 1, name: 'Iniciante', minXP: 0, maxXP: 499, color: '#6B7280' },        // Cinza
  { level: 2, name: 'Aprendiz', minXP: 500, maxXP: 1499, color: '#10B981' },      // Verde
  { level: 3, name: 'Dedicado', minXP: 1500, maxXP: 3499, color: '#3B82F6' },     // Azul
  { level: 4, name: 'Focado', minXP: 3500, maxXP: 6999, color: '#8B5CF6' },       // Violeta
  { level: 5, name: 'Guerreiro', minXP: 7000, maxXP: 11999, color: '#F59E0B' },   // Laranja
  { level: 6, name: 'Atleta', minXP: 12000, maxXP: 19999, color: '#EF4444' },     // Vermelho
  { level: 7, name: 'Elite', minXP: 20000, maxXP: 34999, color: '#EC4899' },      // Rosa
  { level: 8, name: 'Campeão', minXP: 35000, maxXP: 59999, color: '#14B8A6' },    // Teal
  { level: 9, name: 'Lenda', minXP: 60000, maxXP: 99999, color: '#F97316' },      // Laranja forte
  { level: 10, name: 'Imortal', minXP: 100000, maxXP: Infinity, color: '#FFD700' } // Dourado
]

/**
 * Obtém o nível atual baseado no XP total
 */
export function getLevelFromXP(totalXP: number): Level {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (totalXP >= LEVELS[i].minXP) {
      return LEVELS[i]
    }
  }
  return LEVELS[0]
}

/**
 * Obtém um nível específico pelo número
 */
export function getLevelByNumber(levelNumber: number): Level | undefined {
  return LEVELS.find(l => l.level === levelNumber)
}

/**
 * Calcula o XP necessário para o próximo nível
 */
export function getXPToNextLevel(totalXP: number): number {
  const currentLevel = getLevelFromXP(totalXP)

  // Se já está no nível máximo
  if (currentLevel.level === 10) {
    return 0
  }

  return currentLevel.maxXP + 1 - totalXP
}

/**
 * Calcula o progresso percentual dentro do nível atual (0-100)
 */
export function getLevelProgress(totalXP: number): number {
  const currentLevel = getLevelFromXP(totalXP)

  // Se já está no nível máximo
  if (currentLevel.level === 10) {
    return 100
  }

  const levelXPRange = currentLevel.maxXP - currentLevel.minXP + 1
  const xpInCurrentLevel = totalXP - currentLevel.minXP

  return Math.min(100, Math.floor((xpInCurrentLevel / levelXPRange) * 100))
}

/**
 * Verifica se houve level up ao adicionar XP
 */
export function checkLevelUp(previousXP: number, newXP: number): Level | null {
  const previousLevel = getLevelFromXP(previousXP)
  const newLevel = getLevelFromXP(newXP)

  if (newLevel.level > previousLevel.level) {
    return newLevel
  }

  return null
}

/**
 * Obtém informações completas de progressão
 */
export function getLevelInfo(totalXP: number): {
  currentLevel: Level
  xpToNextLevel: number
  levelProgress: number
  xpInCurrentLevel: number
  xpNeededForLevel: number
} {
  const currentLevel = getLevelFromXP(totalXP)
  const xpToNextLevel = getXPToNextLevel(totalXP)
  const levelProgress = getLevelProgress(totalXP)
  const xpInCurrentLevel = totalXP - currentLevel.minXP
  const xpNeededForLevel = currentLevel.maxXP - currentLevel.minXP + 1

  return {
    currentLevel,
    xpToNextLevel,
    levelProgress,
    xpInCurrentLevel,
    xpNeededForLevel
  }
}

/**
 * Formata XP para exibição (ex: 1.5k, 10k)
 */
export function formatXP(xp: number): string {
  if (xp >= 1000000) {
    return `${(xp / 1000000).toFixed(1)}M`
  }
  if (xp >= 1000) {
    return `${(xp / 1000).toFixed(1)}k`
  }
  return xp.toString()
}

/**
 * Obtém cor do nível com gradiente
 */
export function getLevelGradient(level: Level): string {
  const baseColor = level.color

  // Gradientes personalizados por tier
  const gradients: Record<number, string> = {
    1: `linear-gradient(135deg, ${baseColor} 0%, #4B5563 100%)`,
    2: `linear-gradient(135deg, ${baseColor} 0%, #059669 100%)`,
    3: `linear-gradient(135deg, ${baseColor} 0%, #2563EB 100%)`,
    4: `linear-gradient(135deg, ${baseColor} 0%, #7C3AED 100%)`,
    5: `linear-gradient(135deg, ${baseColor} 0%, #D97706 100%)`,
    6: `linear-gradient(135deg, ${baseColor} 0%, #DC2626 100%)`,
    7: `linear-gradient(135deg, ${baseColor} 0%, #DB2777 100%)`,
    8: `linear-gradient(135deg, ${baseColor} 0%, #0D9488 100%)`,
    9: `linear-gradient(135deg, ${baseColor} 0%, #EA580C 100%)`,
    10: `linear-gradient(135deg, ${baseColor} 0%, #FCD34D 50%, #F59E0B 100%)`
  }

  return gradients[level.level] || `linear-gradient(135deg, ${baseColor} 0%, ${baseColor} 100%)`
}

/**
 * Obtém emoji do nível para exibição
 */
export function getLevelEmoji(level: Level): string {
  const emojis: Record<number, string> = {
    1: '🌱',
    2: '📚',
    3: '💪',
    4: '🎯',
    5: '⚔️',
    6: '🏃',
    7: '⭐',
    8: '🏆',
    9: '👑',
    10: '🔱'
  }

  return emojis[level.level] || '🌱'
}
