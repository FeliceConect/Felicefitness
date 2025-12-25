'use client'

import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { UserContext } from '@/types/coach'
import { Flame, Trophy, Mountain } from 'lucide-react'

interface CoachContextCardProps {
  context: UserContext | null
  className?: string
}

export function CoachContextCard({ context, className }: CoachContextCardProps) {
  if (!context) return null

  return (
    <Card className={cn('bg-gradient-to-r from-primary/10 to-primary/5', className)}>
      <CardContent className="p-3">
        <div className="flex items-center justify-between gap-4">
          {/* Streak */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center">
              <Flame className="h-4 w-4 text-orange-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Streak</p>
              <p className="font-semibold text-sm">{context.gamificacao.streak} dias</p>
            </div>
          </div>

          {/* Level */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <Trophy className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Nível</p>
              <p className="font-semibold text-sm">{context.gamificacao.nivel}</p>
            </div>
          </div>

          {/* Ski countdown */}
          {context.diasParaObjetivo > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Mountain className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Esqui</p>
                <p className="font-semibold text-sm">{context.diasParaObjetivo}d</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
