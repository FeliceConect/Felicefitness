'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { CoachSuggestion, CoachAction } from '@/types/coach'
import { Droplets, Dumbbell, UtensilsCrossed, Pill, Heart, Zap } from 'lucide-react'

interface CoachInsightCardProps {
  suggestion: CoachSuggestion
  onActionClick?: (action: CoachAction) => void
  onAskCoach?: (question: string) => void
  className?: string
}

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  hydration: Droplets,
  workout: Dumbbell,
  nutrition: UtensilsCrossed,
  supplement: Pill,
  recovery: Heart,
  general: Zap,
}

const typeColors: Record<string, string> = {
  hydration: 'bg-blue-500/10 text-blue-500',
  workout: 'bg-orange-500/10 text-orange-500',
  nutrition: 'bg-green-500/10 text-green-500',
  supplement: 'bg-purple-500/10 text-purple-500',
  recovery: 'bg-pink-500/10 text-pink-500',
  general: 'bg-primary/10 text-primary',
}

export function CoachInsightCard({
  suggestion,
  onActionClick,
  onAskCoach,
  className,
}: CoachInsightCardProps) {
  const Icon = typeIcons[suggestion.type] || Zap
  const colorClass = typeColors[suggestion.type] || typeColors.general

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
              colorClass
            )}
          >
            <Icon className="h-5 w-5" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm">{suggestion.title}</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              {suggestion.message}
            </p>

            <div className="flex gap-2 mt-2">
              {suggestion.action && onActionClick && (
                <Button
                  variant="link"
                  size="sm"
                  className="p-0 h-auto text-primary"
                  onClick={() => onActionClick(suggestion.action!)}
                >
                  Fazer agora &rarr;
                </Button>
              )}
              {onAskCoach && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-0 h-auto text-muted-foreground hover:text-primary"
                  onClick={() => onAskCoach(suggestion.title)}
                >
                  Perguntar
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
