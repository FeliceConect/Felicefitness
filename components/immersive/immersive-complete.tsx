'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Trophy,
  Clock,
  Dumbbell,
  Flame,
  Target,
  Star,
  ChevronRight,
  Share2,
} from 'lucide-react'
import type { WorkoutSummary } from '@/types/immersive'
import confetti from 'canvas-confetti'

interface ImmersiveCompleteProps {
  summary: WorkoutSummary
  onClose: () => void
  onShare?: () => void
  className?: string
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (mins >= 60) {
    const hours = Math.floor(mins / 60)
    const remainingMins = mins % 60
    return `${hours}h ${remainingMins}min`
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function ImmersiveComplete({
  summary,
  onClose,
  onShare,
  className,
}: ImmersiveCompleteProps) {
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    // Celebration confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    })

    const timeout = setTimeout(() => setShowContent(true), 300)
    return () => clearTimeout(timeout)
  }, [])

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 bg-[#1a1615] overflow-y-auto',
        className
      )}
    >
      <div className="min-h-full flex flex-col items-center px-6 py-12">
        {/* Celebration icon */}
        <div
          className={cn(
            'transition-all duration-500',
            showContent ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
          )}
        >
          <div className="h-24 w-24 rounded-full bg-gradient-to-br from-success to-[#5a8d4e] flex items-center justify-center mb-6 shadow-lg shadow-success/20">
            <span className="text-5xl">🎉</span>
          </div>
        </div>

        {/* Title */}
        <h1
          className={cn(
            'text-3xl font-bold text-white font-heading mb-2 transition-all duration-500 delay-100',
            showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          )}
        >
          Treino Concluído!
        </h1>
        <p
          className={cn(
            'text-lg text-white/60 mb-8 transition-all duration-500 delay-200',
            showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          )}
        >
          {summary.workoutName}
        </p>

        {/* Stats grid */}
        <div
          className={cn(
            'grid grid-cols-2 gap-3 w-full max-w-sm mb-6 transition-all duration-500 delay-300',
            showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          )}
        >
          <Card className="bg-white/5 border-[#3d3533]">
            <CardContent className="p-4 text-center">
              <Clock className="h-5 w-5 mx-auto text-dourado mb-1" />
              <p className="text-2xl font-bold text-white">{formatDuration(summary.duration)}</p>
              <p className="text-xs text-white/50">Duração</p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-[#3d3533]">
            <CardContent className="p-4 text-center">
              <Dumbbell className="h-5 w-5 mx-auto text-info mb-1" />
              <p className="text-2xl font-bold text-white">
                {summary.exercisesCompleted}/{summary.totalExercises}
              </p>
              <p className="text-xs text-white/50">Exercícios</p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-[#3d3533]">
            <CardContent className="p-4 text-center">
              <Target className="h-5 w-5 mx-auto text-warning mb-1" />
              <p className="text-2xl font-bold text-white">{summary.setsCompleted}</p>
              <p className="text-xs text-white/50">Séries</p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-[#3d3533]">
            <CardContent className="p-4 text-center">
              <Flame className="h-5 w-5 mx-auto text-error mb-1" />
              <p className="text-2xl font-bold text-white">
                {summary.totalVolume.toLocaleString()}
              </p>
              <p className="text-xs text-white/50">Volume (kg)</p>
            </CardContent>
          </Card>
        </div>

        {/* PRs achieved */}
        {summary.prsAchieved.length > 0 && (
          <Card
            className={cn(
              'w-full max-w-sm mb-6 border-dourado/20 bg-dourado/5 transition-all duration-500 delay-400',
              showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            )}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="h-5 w-5 text-dourado" />
                <span className="font-semibold text-white">PRs Batidos</span>
              </div>
              <div className="space-y-2">
                {summary.prsAchieved.map((pr) => (
                  <div
                    key={pr.exerciseId}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-white/80">{pr.exerciseName}</span>
                    <span className="font-semibold text-dourado">
                      {pr.newRecord}kg{' '}
                      <span className="text-success">(+{pr.improvement})</span>
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* XP earned */}
        <Card
          className={cn(
            'w-full max-w-sm mb-8 border-dourado/20 bg-dourado/5 transition-all duration-500 delay-500',
            showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          )}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Star className="h-5 w-5 text-dourado" />
              <span className="font-semibold text-white">XP Ganho</span>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-white/70">
                <span>Treino completo</span>
                <span>+100 XP</span>
              </div>
              {summary.prsAchieved.length > 0 && (
                <div className="flex justify-between text-white/70">
                  <span>{summary.prsAchieved.length} PRs batidos</span>
                  <span>+{summary.prsAchieved.length * 50} XP</span>
                </div>
              )}
              <div className="flex justify-between text-white/70">
                <span>{summary.setsCompleted} séries</span>
                <span>+{summary.setsCompleted * 5} XP</span>
              </div>
              <div className="border-t border-[#3d3533] pt-1 mt-2 flex justify-between font-semibold">
                <span className="text-white">Total</span>
                <span className="text-dourado">+{summary.xpEarned} XP</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div
          className={cn(
            'w-full max-w-sm space-y-3 transition-all duration-500 delay-600',
            showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          )}
        >
          <Button
            size="lg"
            className="w-full h-14 text-lg font-semibold gap-2"
            onClick={onClose}
          >
            Concluir
            <ChevronRight className="h-5 w-5" />
          </Button>

          {onShare && (
            <Button
              variant="outline"
              size="lg"
              className="w-full h-12 gap-2"
              onClick={onShare}
            >
              <Share2 className="h-5 w-5" />
              Compartilhar
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
