"use client"

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Trophy, Flame, Target, Star, Medal } from 'lucide-react'
import Link from 'next/link'
import { useGamification } from '@/hooks/use-gamification'
import {
  LevelBadge,
  XPProgress,
  StreakCounter,
  DailyScore,
  AchievementCard,
  ChallengeCard,
  LevelUpModal,
  AchievementModal
} from '@/components/gamification'
import {
  getAchievementsByCategory,
  countAchievementsByCategory,
  getEmptyBreakdown
} from '@/lib/gamification'
import type { AchievementCategory } from '@/types/gamification'

type TabType = 'overview' | 'achievements' | 'challenges'

const categoryLabels: Record<AchievementCategory, { label: string; icon: string }> = {
  streak: { label: 'Sequência', icon: '🔥' },
  workout: { label: 'Treino', icon: '💪' },
  nutrition: { label: 'Nutrição', icon: '🥗' },
  hydration: { label: 'Hidratação', icon: '💧' },
  body: { label: 'Corpo', icon: '📊' },
  consistency: { label: 'Consistência', icon: '⭐' },
  special: { label: 'Especiais', icon: '🌟' }
}

export default function ConquistasPage() {
  const gamification = useGamification()
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | 'all'>('all')

  const {
    totalXP,
    currentLevel,
    xpToNextLevel,
    levelProgress,
    streak,
    achievements,
    unlockedAchievements,
    todayScore,
    activeChallenges,
    loading,
    showLevelUp,
    newLevel,
    showAchievement,
    dismissLevelUp,
    dismissAchievement
  } = gamification

  // Filtrar conquistas por categoria
  const filteredAchievements = useMemo(() => {
    if (selectedCategory === 'all') {
      return achievements
    }
    return getAchievementsByCategory(selectedCategory)
  }, [achievements, selectedCategory])

  // Contar conquistas por categoria
  const achievementCounts = useMemo(() => countAchievementsByCategory(), [])

  // Contagem de desbloqueadas por categoria
  const unlockedCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    unlockedAchievements.forEach(ua => {
      const achievement = achievements.find(a => a.id === ua.achievementId)
      if (achievement) {
        counts[achievement.category] = (counts[achievement.category] || 0) + 1
      }
    })
    return counts
  }, [unlockedAchievements, achievements])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-xl font-bold">Conquistas</h1>
          </div>
          <Link
            href="/ranking"
            className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-yellow-500 to-amber-500 text-white rounded-lg text-sm font-medium hover:from-yellow-400 hover:to-amber-400 transition-all"
          >
            <Medal className="w-4 h-4" />
            Ranking
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex px-4 pb-2 gap-2">
          {(['overview', 'achievements', 'challenges'] as TabType[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab === 'overview' && 'Visão Geral'}
              {tab === 'achievements' && 'Conquistas'}
              {tab === 'challenges' && 'Desafios'}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="p-4 space-y-6"
          >
            {/* Level e XP */}
            <div className="p-4 rounded-2xl bg-card border border-border/50 space-y-4">
              <div className="flex items-center justify-between">
                <LevelBadge level={currentLevel} size="lg" animate />
                <div className="text-right">
                  <p className="text-2xl font-bold">{totalXP.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">XP Total</p>
                </div>
              </div>
              <XPProgress
                currentXP={totalXP}
                xpToNextLevel={xpToNextLevel}
                levelProgress={levelProgress}
                currentLevel={currentLevel}
              />
            </div>

            {/* Streak */}
            <div className="p-4 rounded-2xl bg-card border border-border/50">
              <div className="flex items-center gap-2 mb-4">
                <Flame className="w-5 h-5 text-orange-500" />
                <h2 className="font-semibold">Sequência</h2>
              </div>
              <StreakCounter streak={streak} size="md" showMessage showBest />
            </div>

            {/* Score de Hoje */}
            <div className="p-4 rounded-2xl bg-card border border-border/50">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-primary" />
                <h2 className="font-semibold">Score de Hoje</h2>
              </div>
              <DailyScore
                breakdown={todayScore || getEmptyBreakdown()}
                size="md"
                showBreakdown
              />
            </div>

            {/* Resumo de Conquistas */}
            <div className="p-4 rounded-2xl bg-card border border-border/50">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  <h2 className="font-semibold">Conquistas</h2>
                </div>
                <span className="text-sm text-muted-foreground">
                  {unlockedAchievements.length}/{achievements.length}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(categoryLabels) as AchievementCategory[]).map(category => (
                  <div
                    key={category}
                    className="flex items-center gap-2 p-2 rounded-lg bg-muted/50"
                  >
                    <span>{categoryLabels[category].icon}</span>
                    <span className="text-sm flex-1">{categoryLabels[category].label}</span>
                    <span className="text-xs text-muted-foreground">
                      {unlockedCounts[category] || 0}/{achievementCounts[category]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Achievements Tab */}
        {activeTab === 'achievements' && (
          <motion.div
            key="achievements"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="p-4 space-y-4"
          >
            {/* Filtro por Categoria */}
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                Todas
              </button>
              {(Object.keys(categoryLabels) as AchievementCategory[]).map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {categoryLabels[category].icon} {categoryLabels[category].label}
                </button>
              ))}
            </div>

            {/* Lista de Conquistas */}
            <div className="grid gap-3">
              {filteredAchievements.map(achievement => {
                const userAchievement = unlockedAchievements.find(
                  ua => ua.achievementId === achievement.id
                )
                return (
                  <AchievementCard
                    key={achievement.id}
                    achievement={achievement}
                    userAchievement={userAchievement}
                  />
                )
              })}
            </div>
          </motion.div>
        )}

        {/* Challenges Tab */}
        {activeTab === 'challenges' && (
          <motion.div
            key="challenges"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="p-4 space-y-4"
          >
            {/* Desafios Diários */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Star className="w-5 h-5 text-violet-500" />
                <h2 className="font-semibold">Desafios Diários</h2>
              </div>
              <div className="grid gap-3">
                {activeChallenges
                  .filter(c => c.type === 'daily')
                  .map(challenge => (
                    <ChallengeCard key={challenge.id} challenge={challenge} />
                  ))}
              </div>
            </div>

            {/* Desafios Semanais */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="w-5 h-5 text-blue-500" />
                <h2 className="font-semibold">Desafios Semanais</h2>
              </div>
              <div className="grid gap-3">
                {activeChallenges
                  .filter(c => c.type === 'weekly')
                  .map(challenge => (
                    <ChallengeCard key={challenge.id} challenge={challenge} />
                  ))}
              </div>
            </div>

            {/* Desafios Especiais */}
            {activeChallenges.filter(c => c.type === 'special').length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">🌟</span>
                  <h2 className="font-semibold">Desafios Especiais</h2>
                </div>
                <div className="grid gap-3">
                  {activeChallenges
                    .filter(c => c.type === 'special')
                    .map(challenge => (
                      <ChallengeCard key={challenge.id} challenge={challenge} />
                    ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <LevelUpModal
        isOpen={showLevelUp}
        level={newLevel}
        onClose={dismissLevelUp}
      />
      <AchievementModal
        isOpen={!!showAchievement}
        achievement={showAchievement}
        onClose={dismissAchievement}
      />
    </div>
  )
}
