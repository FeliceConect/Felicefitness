'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Trophy, Sparkles, ChevronRight } from 'lucide-react'
import type { NewPR } from '@/types/immersive'
import confetti from 'canvas-confetti'

interface ImmersivePRCelebrationProps {
  pr: NewPR
  onContinue: () => void
  className?: string
}

export function ImmersivePRCelebration({
  pr,
  onContinue,
  className,
}: ImmersivePRCelebrationProps) {
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    // Trigger confetti
    const duration = 2000
    const end = Date.now() + duration

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: ['#FFD700', '#FFA500', '#FF6347'],
      })
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: ['#FFD700', '#FFA500', '#FF6347'],
      })

      if (Date.now() < end) {
        requestAnimationFrame(frame)
      }
    }

    frame()

    // Show content with delay
    const timeout = setTimeout(() => setShowContent(true), 300)
    return () => clearTimeout(timeout)
  }, [])

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 bg-gradient-to-b from-amber-500/20 to-background flex flex-col items-center justify-center px-6',
        className
      )}
    >
      {/* Trophy icon */}
      <div
        className={cn(
          'transition-all duration-500',
          showContent ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
        )}
      >
        <div className="relative">
          <div className="h-32 w-32 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mb-6 shadow-lg shadow-amber-500/30">
            <Trophy className="h-16 w-16 text-white" />
          </div>
          <Sparkles className="absolute -top-2 -right-2 h-8 w-8 text-amber-400 animate-pulse" />
          <Sparkles className="absolute -bottom-2 -left-2 h-6 w-6 text-amber-400 animate-pulse delay-100" />
        </div>
      </div>

      {/* Title */}
      <h1
        className={cn(
          'text-4xl font-bold text-amber-500 mb-2 transition-all duration-500 delay-200',
          showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        )}
      >
        NOVO RECORDE!
      </h1>

      {/* Exercise name */}
      <p
        className={cn(
          'text-xl text-muted-foreground mb-8 transition-all duration-500 delay-300',
          showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        )}
      >
        {pr.exerciseName}
      </p>

      {/* New record */}
      <div
        className={cn(
          'text-center mb-4 transition-all duration-500 delay-400',
          showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        )}
      >
        <span className="text-7xl font-bold">{pr.newRecord}</span>
        <span className="text-3xl text-muted-foreground ml-2">kg</span>
      </div>

      {/* Comparison */}
      <div
        className={cn(
          'text-center mb-8 transition-all duration-500 delay-500',
          showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        )}
      >
        <p className="text-muted-foreground">
          Anterior: {pr.previousRecord || 0} kg
        </p>
        <p className="text-lg text-green-500 font-semibold">
          +{pr.improvement} kg!
        </p>
      </div>

      {/* XP earned */}
      <div
        className={cn(
          'bg-primary/10 rounded-full px-6 py-2 mb-12 transition-all duration-500 delay-600',
          showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        )}
      >
        <span className="text-primary font-semibold">+{pr.xpEarned} XP</span>
      </div>

      {/* Continue button */}
      <Button
        size="lg"
        className={cn(
          'h-14 px-8 text-lg font-semibold gap-2 transition-all duration-500 delay-700',
          showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        )}
        onClick={onContinue}
      >
        Continuar
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>
  )
}
