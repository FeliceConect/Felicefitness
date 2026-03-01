"use client"

import { useCallback, useEffect, useState } from 'react'
import { useDashboardData } from '@/hooks/use-dashboard-data'
import { useGamification } from '@/hooks/use-gamification'
import { useWaterLog } from '@/hooks/use-water-log'
import { Calendar, Trophy, Globe, Droplets, Utensils, Dumbbell, MapPin, Video, ChevronRight, ClipboardList } from 'lucide-react'
import Link from 'next/link'
import {
  GreetingHeader,
  StreakBadge,
  DailyScore,
  WorkoutCard,
  WaterCard,
  MealsCard,
  StatsOverview,
} from './components'
import dynamic from 'next/dynamic'
import { GamificationWidgetCompact } from '@/components/gamification'

// Lazy load celebration modals — rare events
const LevelUpModal = dynamic(() => import('@/components/gamification/level-up-modal').then(m => ({ default: m.LevelUpModal })), { ssr: false })
const AchievementModal = dynamic(() => import('@/components/gamification/achievement-modal').then(m => ({ default: m.AchievementModal })), { ssr: false })

export function DashboardContent() {
  const {
    profile,
    todayWorkout,
    todayMeals,
    waterGoal,
    streak,
    caloriesConsumed,
    caloriesGoal,
    proteinConsumed,
    proteinGoal,
    workoutStats,
    loading,
    refresh
  } = useDashboardData()

  // Refresh automático quando o app volta ao foco
  useEffect(() => {
    let lastRefresh = Date.now()

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const now = Date.now()
        const lastDate = new Date(lastRefresh).toDateString()
        const currentDate = new Date().toDateString()
        const timeSinceLastRefresh = now - lastRefresh

        if (lastDate !== currentDate || timeSinceLastRefresh > 5 * 60 * 1000) {
          refresh()
          lastRefresh = now
        }
      }
    }

    const handleFocus = () => {
      const now = Date.now()
      const lastDate = new Date(lastRefresh).toDateString()
      const currentDate = new Date().toDateString()
      const timeSinceLastRefresh = now - lastRefresh

      if (lastDate !== currentDate || timeSinceLastRefresh > 5 * 60 * 1000) {
        refresh()
        lastRefresh = now
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)
    window.addEventListener('pageshow', handleFocus)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('pageshow', handleFocus)
    }
  }, [refresh])

  // Next appointment
  const [nextAppointment, setNextAppointment] = useState<{
    professional_name: string
    professional_type: string
    date: string
    start_time: string
    appointment_type: 'presencial' | 'online'
    location: string | null
    status: string
  } | null>(null)

  // Pending forms
  const [pendingFormsCount, setPendingFormsCount] = useState(0)

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    fetch(`/api/appointments?status=scheduled,confirmed&dateFrom=${today}&limit=1`)
      .then(r => r.json())
      .then(data => {
        if (data.success && data.data && data.data.length > 0) {
          setNextAppointment(data.data[0])
        }
      })
      .catch(() => {})

    // Check pending forms
    fetch('/api/forms/assignments?status=pending')
      .then(r => r.json())
      .then(data => {
        if (data.success && data.data) {
          setPendingFormsCount(data.data.length)
        }
      })
      .catch(() => {})
  }, [])

  // Gamification
  const gamification = useGamification()

  // Water
  const { todayTotal: waterTotal, addWater, isAdding: isAddingWater } = useWaterLog()

  const handleAddWater = useCallback(async (ml: number): Promise<boolean> => {
    return await addWater(ml)
  }, [addWater])

  // Dados para o score diário
  const scoreData = {
    treinoConcluido: todayWorkout?.status === 'concluido',
    alimentacaoPercent: caloriesGoal > 0 ? caloriesConsumed / caloriesGoal : 0,
    aguaPercent: waterGoal > 0 ? waterTotal / waterGoal : 0,
    sonoRegistrado: false
  }

  // Stats
  const stats = {
    totalTreinos: workoutStats.totalWorkouts,
    streakAtual: streak,
    prsEsteMes: workoutStats.prsThisMonth
  }

  if (loading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Greeting Header */}
      <GreetingHeader
        userName={profile?.nome || 'Paciente'}
        currentPhase="base"
      />

      {/* Main Content */}
      <main className="px-4 space-y-4">
        {/* Gamification Widget */}
        <GamificationWidgetCompact gamification={gamification} />

        {/* Formulários pendentes */}
        {pendingFormsCount > 0 && (
          <Link href="/formularios">
            <div className="bg-dourado/10 border border-dourado/30 rounded-2xl p-4 hover:bg-dourado/15 transition-all">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-dourado/20 flex items-center justify-center">
                  <ClipboardList className="w-5 h-5 text-dourado" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {pendingFormsCount === 1
                      ? 'Voce tem 1 formulario pendente'
                      : `Voce tem ${pendingFormsCount} formularios pendentes`}
                  </p>
                  <p className="text-xs text-foreground-secondary">Toque para preencher</p>
                </div>
                <ChevronRight className="w-4 h-4 text-dourado flex-shrink-0" />
              </div>
            </div>
          </Link>
        )}

        {/* Streak e Score lado a lado */}
        <div className="flex gap-3">
          <StreakBadge
            currentStreak={streak}
            maxStreak={profile?.maior_streak || 0}
          />
          <DailyScore data={scoreData} />
        </div>

        {/* Proxima consulta */}
        <Link href="/agenda">
          <div className="bg-white border border-border rounded-2xl p-4 hover:border-dourado/30 hover:shadow-md transition-all shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-dourado/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-dourado" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-foreground-muted uppercase tracking-wide">Próxima consulta</p>
                {nextAppointment ? (
                  <>
                    <p className="text-sm font-medium text-foreground truncate">
                      {nextAppointment.professional_name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-foreground-secondary">
                        {new Date(nextAppointment.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })}
                        {' às '}
                        {nextAppointment.start_time.slice(0, 5)}
                      </span>
                      {nextAppointment.appointment_type === 'online' ? (
                        <Video className="w-3 h-3 text-foreground-muted" />
                      ) : (
                        <MapPin className="w-3 h-3 text-foreground-muted" />
                      )}
                    </div>
                  </>
                ) : (
                  <p className="text-sm font-medium text-foreground">Nenhuma agendada</p>
                )}
              </div>
              <ChevronRight className="w-4 h-4 text-foreground-muted flex-shrink-0" />
            </div>
          </div>
        </Link>

        {/* Treino do dia */}
        <WorkoutCard workout={todayWorkout} />

        {/* Grid: Agua e Alimentacao */}
        <div className="grid grid-cols-2 gap-3">
          <WaterCard
            currentMl={waterTotal}
            goalMl={waterGoal}
            onAddWater={handleAddWater}
            isAdding={isAddingWater}
          />
          <MealsCard
            meals={todayMeals}
            totalCalorias={caloriesConsumed}
            metaCalorias={caloriesGoal}
            totalProteinas={proteinConsumed}
            metaProteinas={proteinGoal}
          />
        </div>

        {/* Ranking + Feed placeholders */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/ranking">
            <div className="bg-white border border-border rounded-2xl p-4 hover:border-dourado/30 hover:shadow-md transition-all shadow-sm h-full">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-4 h-4 text-dourado" />
                <span className="text-xs text-foreground-muted uppercase tracking-wide">Ranking</span>
              </div>
              <p className="font-heading text-2xl font-bold text-dourado">--</p>
              <p className="text-xs text-foreground-secondary mt-1">Em breve</p>
            </div>
          </Link>
          <Link href="/feed">
            <div className="bg-white border border-border rounded-2xl p-4 hover:border-dourado/30 hover:shadow-md transition-all shadow-sm h-full">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="w-4 h-4 text-foreground-secondary" />
                <span className="text-xs text-foreground-muted uppercase tracking-wide">Feed</span>
              </div>
              <p className="text-sm text-foreground-secondary">Nenhuma atividade recente</p>
            </div>
          </Link>
        </div>

        {/* Stats */}
        <StatsOverview stats={stats} />

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => handleAddWater(250)}
            disabled={isAddingWater}
            className="flex flex-col items-center gap-2 p-4 bg-white border border-border rounded-2xl hover:border-dourado/30 hover:shadow-md transition-all shadow-sm active:scale-95"
          >
            <Droplets className="w-5 h-5 text-blue-500" />
            <span className="text-xs text-foreground-secondary">+250ml</span>
          </button>
          <Link href="/alimentacao/refeicao/nova" className="flex flex-col items-center gap-2 p-4 bg-white border border-border rounded-2xl hover:border-dourado/30 hover:shadow-md transition-all shadow-sm active:scale-95">
            <Utensils className="w-5 h-5 text-dourado" />
            <span className="text-xs text-foreground-secondary">Refeicao</span>
          </Link>
          <Link href="/treino" className="flex flex-col items-center gap-2 p-4 bg-white border border-border rounded-2xl hover:border-dourado/30 hover:shadow-md transition-all shadow-sm active:scale-95">
            <Dumbbell className="w-5 h-5 text-vinho" />
            <span className="text-xs text-foreground-secondary">Treinar</span>
          </Link>
        </div>
      </main>

      {/* Gamification Modals */}
      <LevelUpModal
        isOpen={gamification.showLevelUp}
        level={gamification.newLevel}
        onClose={gamification.dismissLevelUp}
      />
      <AchievementModal
        isOpen={!!gamification.showAchievement}
        achievement={gamification.showAchievement}
        onClose={gamification.dismissAchievement}
      />
    </div>
  )
}

// Skeleton para loading
function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-4 pt-4 pb-2">
        <div className="h-8 w-48 bg-background-elevated rounded animate-pulse" />
        <div className="h-4 w-36 bg-background-elevated rounded mt-2 animate-pulse" />
      </div>

      <main className="px-4 space-y-4">
        <div className="flex gap-3">
          <div className="flex-1 h-24 bg-white border border-border rounded-2xl animate-pulse" />
          <div className="flex-1 h-24 bg-white border border-border rounded-2xl animate-pulse" />
        </div>

        <div className="h-16 bg-white border border-border rounded-2xl animate-pulse" />

        <div className="h-40 bg-white border border-border rounded-2xl animate-pulse" />

        <div className="grid grid-cols-2 gap-3">
          <div className="h-52 bg-white border border-border rounded-2xl animate-pulse" />
          <div className="h-52 bg-white border border-border rounded-2xl animate-pulse" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="h-24 bg-white border border-border rounded-2xl animate-pulse" />
          <div className="h-24 bg-white border border-border rounded-2xl animate-pulse" />
        </div>
      </main>
    </div>
  )
}
