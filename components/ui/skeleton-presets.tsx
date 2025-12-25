'use client'

import { Skeleton } from './skeleton'
import { cn } from '@/lib/utils'

// Skeleton para Cards de estatísticas
export function StatCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('bg-[#14141F] border border-[#2E2E3E] rounded-2xl p-4', className)}>
      <div className="flex items-center gap-3 mb-3">
        <Skeleton className="w-10 h-10 rounded-full" />
        <Skeleton className="h-4 w-20" />
      </div>
      <Skeleton className="h-8 w-24 mb-2" />
      <Skeleton className="h-3 w-16" />
    </div>
  )
}

// Skeleton para card de treino
export function WorkoutCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('bg-[#14141F] border border-[#2E2E3E] rounded-2xl p-4', className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Skeleton className="w-12 h-12 rounded-xl" />
          <div>
            <Skeleton className="h-5 w-32 mb-2" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <Skeleton className="w-20 h-8 rounded-full" />
      </div>
      <div className="flex gap-4">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  )
}

// Skeleton para card de refeição
export function MealCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('bg-[#14141F] border border-[#2E2E3E] rounded-xl p-3', className)}>
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-lg" />
        <div className="flex-1">
          <Skeleton className="h-4 w-24 mb-1" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="w-6 h-6 rounded-full" />
      </div>
    </div>
  )
}

// Skeleton para lista de refeições
export function MealListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <MealCardSkeleton key={i} />
      ))}
    </div>
  )
}

// Skeleton para card de água
export function WaterCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('bg-[#14141F] border border-[#2E2E3E] rounded-2xl p-4', className)}>
      <div className="flex items-center gap-2 mb-4">
        <Skeleton className="w-5 h-5 rounded" />
        <Skeleton className="h-4 w-12" />
      </div>
      <div className="flex items-center justify-center mb-4">
        <Skeleton className="w-32 h-32 rounded-full" />
      </div>
      <div className="flex gap-2 justify-center">
        <Skeleton className="w-16 h-10 rounded-xl" />
        <Skeleton className="w-16 h-10 rounded-xl" />
        <Skeleton className="w-16 h-10 rounded-xl" />
      </div>
    </div>
  )
}

// Skeleton para gamification widget
export function GamificationSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('bg-gradient-to-r from-violet-500/10 to-cyan-500/10 border border-violet-500/20 rounded-2xl p-4', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="w-12 h-12 rounded-full" />
          <div>
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
        <div className="text-right">
          <Skeleton className="h-6 w-16 mb-1" />
          <Skeleton className="h-3 w-12" />
        </div>
      </div>
    </div>
  )
}

// Skeleton para perfil header
export function ProfileHeaderSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-4', className)}>
      <Skeleton className="w-20 h-20 rounded-full" />
      <div>
        <Skeleton className="h-6 w-32 mb-2" />
        <Skeleton className="h-4 w-48 mb-1" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  )
}

// Skeleton para gráfico
export function ChartSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('bg-[#14141F] border border-[#2E2E3E] rounded-2xl p-4', className)}>
      <Skeleton className="h-5 w-40 mb-4" />
      <div className="flex items-end gap-2 h-40">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton
            key={i}
            className="flex-1 rounded-t"
            style={{ height: `${30 + Math.random() * 70}%` }}
          />
        ))}
      </div>
      <div className="flex justify-between mt-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-8" />
        ))}
      </div>
    </div>
  )
}

// Skeleton para exercício na lista
export function ExerciseSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('bg-[#14141F] border border-[#2E2E3E] rounded-xl p-4', className)}>
      <div className="flex items-center gap-4">
        <Skeleton className="w-12 h-12 rounded-lg" />
        <div className="flex-1">
          <Skeleton className="h-5 w-40 mb-2" />
          <div className="flex gap-4">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <Skeleton className="w-8 h-8 rounded-full" />
      </div>
    </div>
  )
}

// Skeleton para lista de exercícios
export function ExerciseListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <ExerciseSkeleton key={i} />
      ))}
    </div>
  )
}

// Skeleton para insight card
export function InsightSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('bg-[#14141F] border border-[#2E2E3E] rounded-xl p-4', className)}>
      <div className="flex items-start gap-3">
        <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />
        <div className="flex-1">
          <Skeleton className="h-4 w-32 mb-2" />
          <Skeleton className="h-3 w-full mb-1" />
          <Skeleton className="h-3 w-3/4" />
        </div>
      </div>
    </div>
  )
}

// Skeleton para página inteira do dashboard
export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-[#0A0A0F] pb-24">
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-36" />
      </div>

      <div className="px-4 space-y-4">
        {/* Gamification */}
        <GamificationSkeleton />

        {/* Streak e Score */}
        <div className="flex gap-3">
          <StatCardSkeleton className="flex-1" />
          <StatCardSkeleton className="flex-1" />
        </div>

        {/* Treino */}
        <WorkoutCardSkeleton />

        {/* Água e Alimentação */}
        <div className="grid grid-cols-2 gap-3">
          <WaterCardSkeleton />
          <div className="bg-[#14141F] border border-[#2E2E3E] rounded-2xl p-4">
            <Skeleton className="h-4 w-24 mb-4" />
            <MealListSkeleton count={3} />
          </div>
        </div>
      </div>
    </div>
  )
}

// Skeleton para página de alimentação
export function AlimentacaoSkeleton() {
  return (
    <div className="min-h-screen bg-[#0A0A0F] pb-24">
      <div className="px-4 pt-4 pb-6">
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-4 w-48" />
      </div>

      <div className="px-4 space-y-6">
        {/* Macros */}
        <div className="bg-[#14141F] border border-[#2E2E3E] rounded-2xl p-4">
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="text-center">
                <Skeleton className="w-16 h-16 rounded-full mx-auto mb-2" />
                <Skeleton className="h-3 w-12 mx-auto" />
              </div>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <MealListSkeleton count={6} />
      </div>
    </div>
  )
}

// Skeleton para página de treino
export function TreinoSkeleton() {
  return (
    <div className="min-h-screen bg-[#0A0A0F] pb-24">
      <div className="px-4 pt-4 pb-6">
        <Skeleton className="h-8 w-40 mb-2" />
        <Skeleton className="h-4 w-32" />
      </div>

      <div className="px-4 space-y-4">
        <WorkoutCardSkeleton />
        <ExerciseListSkeleton count={6} />
      </div>
    </div>
  )
}
