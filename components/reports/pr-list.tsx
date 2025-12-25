'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Trophy, TrendingUp } from 'lucide-react'
import { formatShortDate } from '@/lib/reports'

interface PR {
  exercise: string
  weight: number
  reps: number
  date: string
  improvement?: number
}

interface PRListProps {
  prs: PR[]
  title?: string
  showImprovement?: boolean
  maxItems?: number
  className?: string
}

export function PRList({
  prs,
  title = 'PRs do Período',
  showImprovement = true,
  maxItems,
  className
}: PRListProps) {
  const displayPRs = maxItems ? prs.slice(0, maxItems) : prs

  if (displayPRs.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-500" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-4">
            <p>Nenhum PR no período</p>
            <p className="text-sm">Continue treinando para bater recordes!</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Trophy className="h-4 w-4 text-amber-500" />
          {title}
          <Badge variant="secondary" className="ml-auto">
            {prs.length} PR{prs.length > 1 ? 's' : ''}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displayPRs.map((pr, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/20 text-amber-500">
                  <Trophy className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium">{pr.exercise}</p>
                  <p className="text-sm text-muted-foreground">
                    {pr.weight}kg × {pr.reps} rep{pr.reps > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">
                  {formatShortDate(pr.date)}
                </p>
                {showImprovement && pr.improvement && (
                  <div className="flex items-center gap-1 text-green-500 text-sm">
                    <TrendingUp className="h-3 w-3" />
                    <span>+{pr.improvement}kg</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Compact PR badge
interface PRBadgeProps {
  exercise: string
  weight: number
  className?: string
}

export function PRBadge({ exercise, weight, className }: PRBadgeProps) {
  return (
    <Badge variant="outline" className={cn('gap-1', className)}>
      <Trophy className="h-3 w-3 text-amber-500" />
      {exercise}: {weight}kg
    </Badge>
  )
}
