"use client"

import { motion } from 'framer-motion'
import Link from 'next/link'
import { LevelBadge } from './level-badge'
import { XPProgress } from './xp-progress'
import { StreakCounter } from './streak-counter'
import { DailyScore } from './daily-score'
import type { UseGamificationReturn } from '@/types/gamification'

interface GamificationWidgetProps {
  gamification: UseGamificationReturn
}

export function GamificationWidget({ gamification }: GamificationWidgetProps) {
  const {
    totalXP,
    currentLevel,
    xpToNextLevel,
    levelProgress,
    streak,
    todayScore
  } = gamification

  return (
    <motion.div
      className="p-4 rounded-2xl bg-gradient-to-br from-card to-card/50 border border-border/50 space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header com Level e Streak */}
      <div className="flex items-center justify-between">
        <LevelBadge level={currentLevel} size="md" showName />

        <Link href="/conquistas">
          <StreakCounter streak={streak} size="sm" showMessage={false} />
        </Link>
      </div>

      {/* Barra de XP */}
      <XPProgress
        currentXP={totalXP}
        xpToNextLevel={xpToNextLevel}
        levelProgress={levelProgress}
        currentLevel={currentLevel}
        showDetails
      />

      {/* Score do Dia */}
      {todayScore ? (
        <div className="pt-2 border-t border-border/50">
          <p className="text-sm text-muted-foreground mb-2">Score de Hoje</p>
          <DailyScore breakdown={todayScore} size="sm" showBreakdown={false} animate={false} />
        </div>
      ) : (
        <div className="pt-2 border-t border-border/50">
          <p className="text-sm text-muted-foreground text-center">
            Complete atividades para ganhar pontos!
          </p>
        </div>
      )}

      {/* Link para Conquistas */}
      <Link
        href="/conquistas"
        className="block w-full py-2 px-4 rounded-lg bg-primary/10 text-primary text-center text-sm font-medium hover:bg-primary/20 transition-colors"
      >
        Ver Conquistas →
      </Link>
    </motion.div>
  )
}

/**
 * Versão compacta do widget para mobile
 */
export function GamificationWidgetCompact({ gamification }: GamificationWidgetProps) {
  const {
    currentLevel,
    levelProgress,
    streak,
    todayScore
  } = gamification

  return (
    <Link href="/conquistas">
      <motion.div
        className="flex items-center gap-3 p-3 rounded-xl bg-card/50 border border-border/50"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Level Badge Mini */}
        <LevelBadge level={currentLevel} size="sm" showName={false} />

        {/* Progress e Stats */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium" style={{ color: currentLevel.color }}>
              Nível {currentLevel.level}
            </span>
            <span className="text-xs text-muted-foreground">{levelProgress}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{ width: `${levelProgress}%`, backgroundColor: currentLevel.color }}
            />
          </div>
        </div>

        {/* Streak Mini */}
        <div className="flex items-center gap-1">
          <span className="text-lg">🔥</span>
          <span className="font-bold">{streak.currentStreak}</span>
        </div>

        {/* Score Mini */}
        {todayScore && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10">
            <span className="text-sm font-bold text-primary">{todayScore.total}</span>
            <span className="text-xs text-muted-foreground">/100</span>
          </div>
        )}
      </motion.div>
    </Link>
  )
}
