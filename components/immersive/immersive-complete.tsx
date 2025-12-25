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
        'fixed inset-0 z-50 bg-background overflow-y-auto',
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
          <div className="h-24 w-24 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center mb-6 shadow-lg">
            <span className="text-5xl">🎉</span>
          </div>
        </div>

        {/* Title */}
        <h1
          className={cn(
            'text-3xl font-bold mb-2 transition-all duration-500 delay-100',
            showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          )}
        >
          Treino Concluído!
        </h1>
        <p
          className={cn(
            'text-lg text-muted-foreground mb-8 transition-all duration-500 delay-200',
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
          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="h-5 w-5 mx-auto text-primary mb-1" />
              <p className="text-2xl font-bold">{formatDuration(summary.duration)}</p>
              <p className="text-xs text-muted-foreground">Duração</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <Dumbbell className="h-5 w-5 mx-auto text-blue-500 mb-1" />
              <p className="text-2xl font-bold">
                {summary.exercisesCompleted}/{summary.totalExercises}
              </p>
              <p className="text-xs text-muted-foreground">Exercícios</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <Target className="h-5 w-5 mx-auto text-orange-500 mb-1" />
              <p className="text-2xl font-bold">{summary.setsCompleted}</p>
              <p className="text-xs text-muted-foreground">Séries</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <Flame className="h-5 w-5 mx-auto text-red-500 mb-1" />
              <p className="text-2xl font-bold">
                {summary.totalVolume.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">Volume (kg)</p>
            </CardContent>
          </Card>
        </div>

        {/* PRs achieved */}
        {summary.prsAchieved.length > 0 && (
          <Card
            className={cn(
              'w-full max-w-sm mb-6 border-amber-500/20 bg-amber-500/5 transition-all duration-500 delay-400',
              showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            )}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="h-5 w-5 text-amber-500" />
                <span className="font-semibold">PRs Batidos</span>
              </div>
              <div className="space-y-2">
                {summary.prsAchieved.map((pr) => (
                  <div
                    key={pr.exerciseId}
                    className="flex items-center justify-between text-sm"
                  >
                    <span>{pr.exerciseName}</span>
                    <span className="font-semibold text-amber-500">
                      {pr.newRecord}kg{' '}
                      <span className="text-green-500">(+{pr.improvement})</span>
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
            'w-full max-w-sm mb-8 border-primary/20 bg-primary/5 transition-all duration-500 delay-500',
            showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          )}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Star className="h-5 w-5 text-primary" />
              <span className="font-semibold">XP Ganho</span>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Treino completo</span>
                <span>+100 XP</span>
              </div>
              {summary.prsAchieved.length > 0 && (
                <div className="flex justify-between">
                  <span>{summary.prsAchieved.length} PRs batidos</span>
                  <span>+{summary.prsAchieved.length * 50} XP</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>{summary.setsCompleted} séries</span>
                <span>+{summary.setsCompleted * 5} XP</span>
              </div>
              <div className="border-t pt-1 mt-2 flex justify-between font-semibold">
                <span>Total</span>
                <span className="text-primary">+{summary.xpEarned} XP</span>
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
