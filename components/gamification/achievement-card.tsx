"use client"

import { motion } from 'framer-motion'
import type { Achievement, UserAchievement } from '@/types/gamification'
import { TIER_COLORS, TIER_GRADIENTS, getAchievementProgress } from '@/lib/gamification'
import type { UserStats } from '@/types/gamification'

interface AchievementCardProps {
  achievement: Achievement
  userAchievement?: UserAchievement
  stats?: UserStats
  currentLevel?: number
  currentStreak?: number
  onClick?: () => void
}

export function AchievementCard({
  achievement,
  userAchievement,
  stats,
  currentLevel = 1,
  currentStreak = 0,
  onClick
}: AchievementCardProps) {
  const isUnlocked = !!userAchievement
  const tierColor = TIER_COLORS[achievement.tier]
  const tierGradient = TIER_GRADIENTS[achievement.tier]

  // Calcular progresso se não desbloqueada
  let progress = { current: 0, target: 0, percentage: 0 }
  if (!isUnlocked && stats) {
    progress = getAchievementProgress(achievement, stats, currentLevel, currentStreak)
  }

  return (
    <motion.div
      className={`relative p-4 rounded-xl border ${
        isUnlocked
          ? 'bg-gradient-to-br from-card to-card/50 border-primary/30'
          : 'bg-card/50 border-border/50 opacity-60'
      } cursor-pointer hover:border-primary/50 transition-colors`}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Badge de Tier */}
      <div
        className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-xs font-semibold text-black"
        style={{ background: tierGradient }}
      >
        {achievement.tier.charAt(0).toUpperCase() + achievement.tier.slice(1)}
      </div>

      <div className="flex items-start gap-3">
        {/* Ícone */}
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
            isUnlocked ? 'bg-primary/20' : 'bg-muted grayscale'
          }`}
          style={isUnlocked ? { boxShadow: `0 0 15px ${tierColor}40` } : {}}
        >
          {achievement.icon}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold ${isUnlocked ? 'text-foreground' : 'text-muted-foreground'}`}>
            {achievement.name}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {achievement.description}
          </p>

          {/* Progresso ou Data de Desbloqueio */}
          {isUnlocked ? (
            <div className="mt-2 text-xs text-primary">
              Desbloqueada em {new Date(userAchievement.unlockedAt).toLocaleDateString('pt-BR')}
            </div>
          ) : stats && progress.target > 0 ? (
            <div className="mt-2">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>{progress.current}/{progress.target}</span>
                <span>{progress.percentage}%</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: tierGradient }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress.percentage}%` }}
                />
              </div>
            </div>
          ) : null}

          {/* XP Reward */}
          <div className="mt-2 flex items-center gap-1">
            <span className="text-xs">⭐</span>
            <span className="text-xs text-amber-500 font-medium">
              +{achievement.xpReward} XP
            </span>
          </div>
        </div>
      </div>

      {/* Efeito de brilho para desbloqueadas */}
      {isUnlocked && (
        <motion.div
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${tierColor}10 0%, transparent 70%)`
          }}
          animate={{
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}
    </motion.div>
  )
}
