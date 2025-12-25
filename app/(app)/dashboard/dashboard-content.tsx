"use client"

import { useState, useCallback } from 'react'
import { useDashboardData } from '@/hooks/use-dashboard-data'
import { useGamification } from '@/hooks/use-gamification'
import { useWaterLog } from '@/hooks/use-water-log'
import {
  GreetingHeader,
  StreakBadge,
  DailyScore,
  WorkoutCard,
  WaterCard,
  MealsCard,
  RevoladeWidget,
  CountdownCard,
  StatsOverview,
  QuickActions
} from './components'
import {
  GamificationWidgetCompact,
  LevelUpModal,
  AchievementModal
} from '@/components/gamification'

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
    loading
  } = useDashboardData()

  // Gamification
  const gamification = useGamification()

  // Water - usando hook real que salva no banco
  const { todayTotal: waterTotal, addWater, isAdding: isAddingWater } = useWaterLog()

  const [medicamentoTomado, setMedicamentoTomado] = useState(false)

  const handleAddWater = useCallback(async (ml: number): Promise<boolean> => {
    return await addWater(ml)
  }, [addWater])

  const handleMarcarMedicamento = useCallback(() => {
    setMedicamentoTomado(true)
    // Aqui salvaria no banco
  }, [])

  // Dados para o score diário
  const scoreData = {
    treinoConcluido: todayWorkout?.status === 'concluido',
    alimentacaoPercent: caloriesGoal > 0 ? caloriesConsumed / caloriesGoal : 0,
    aguaPercent: waterGoal > 0 ? waterTotal / waterGoal : 0,
    sonoRegistrado: false // Por enquanto false
  }

  // Meta de esqui
  const metaEsqui = {
    titulo: 'Esqui na Suíça',
    data: new Date('2026-03-12'),
    icone: '🎿',
    dataInicio: new Date('2024-12-01')
  }

  // Stats from database
  const stats = {
    totalTreinos: workoutStats.totalWorkouts,
    streakAtual: streak,
    prsEsteMes: workoutStats.prsThisMonth
  }

  // Loading state
  if (loading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] pb-24">
      {/* Greeting Header */}
      <GreetingHeader
        userName={profile?.nome || 'Usuário'}
        currentPhase="base"
      />

      {/* Main Content */}
      <main className="px-4 space-y-4">
        {/* Gamification Widget */}
        <GamificationWidgetCompact gamification={gamification} />

        {/* Streak e Score lado a lado */}
        <div className="flex gap-3">
          <StreakBadge
            currentStreak={streak}
            maxStreak={profile?.maior_streak || 0}
          />
          <DailyScore data={scoreData} />
        </div>

        {/* Treino do dia */}
        <WorkoutCard workout={todayWorkout} />

        {/* Revolade Widget (se configurado) */}
        {profile?.usa_medicamento_jejum && profile?.medicamento_nome && (
          <RevoladeWidget
            config={{
              nome: profile.medicamento_nome,
              horario: profile.medicamento_horario || '14:00',
              jejumAntes: profile.medicamento_jejum_antes_horas || 2,
              restricaoDepois: profile.medicamento_restricao_depois_horas || 4,
              restricaoTipo: profile.medicamento_restricao_tipo || 'laticínios'
            }}
            tomadoHoje={medicamentoTomado}
            onMarcarTomado={handleMarcarMedicamento}
          />
        )}

        {/* Grid: Água e Alimentação */}
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

        {/* Countdown */}
        <CountdownCard meta={metaEsqui} />

        {/* Stats */}
        <StatsOverview stats={stats} />

        {/* Quick Actions */}
        <QuickActions
          onAddWater={() => handleAddWater(250)}
        />
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
    <div className="min-h-screen bg-[#0A0A0F] pb-24">
      <div className="px-4 pt-4 pb-2">
        <div className="h-8 w-48 bg-[#1E1E2E] rounded animate-pulse" />
        <div className="h-4 w-36 bg-[#1E1E2E] rounded mt-2 animate-pulse" />
      </div>

      <main className="px-4 space-y-4">
        <div className="flex gap-3">
          <div className="flex-1 h-24 bg-[#14141F] border border-[#2E2E3E] rounded-2xl animate-pulse" />
          <div className="flex-1 h-24 bg-[#14141F] border border-[#2E2E3E] rounded-2xl animate-pulse" />
        </div>

        <div className="h-40 bg-[#14141F] border border-[#2E2E3E] rounded-2xl animate-pulse" />

        <div className="grid grid-cols-2 gap-3">
          <div className="h-52 bg-[#14141F] border border-[#2E2E3E] rounded-2xl animate-pulse" />
          <div className="h-52 bg-[#14141F] border border-[#2E2E3E] rounded-2xl animate-pulse" />
        </div>

        <div className="h-40 bg-[#14141F] border border-[#2E2E3E] rounded-2xl animate-pulse" />

        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-[#14141F] border border-[#2E2E3E] rounded-xl animate-pulse" />
          ))}
        </div>
      </main>
    </div>
  )
}
