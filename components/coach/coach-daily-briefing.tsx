'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { DailyBriefing } from '@/types/coach'
import { CoachAvatar } from './coach-avatar'
import { MessageCircle, Lightbulb } from 'lucide-react'
import Link from 'next/link'

interface CoachDailyBriefingProps {
  briefing: DailyBriefing | null
  compact?: boolean
  onAskCoach?: (question: string) => void
  className?: string
}

export function CoachDailyBriefing({
  briefing,
  compact = false,
  onAskCoach,
  className,
}: CoachDailyBriefingProps) {
  if (!briefing) return null

  if (compact) {
    return (
      <Card className={cn('overflow-hidden', className)}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <CoachAvatar size="sm" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{briefing.greeting}</p>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {briefing.tip}
              </p>
            </div>
            {onAskCoach ? (
              <Button size="sm" variant="ghost" onClick={() => onAskCoach(briefing.tip)}>
                <MessageCircle className="h-4 w-4" />
              </Button>
            ) : (
              <Button size="sm" variant="ghost" asChild>
                <Link href="/coach">
                  <MessageCircle className="h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <CoachAvatar size="md" />
          <div>
            <p className="font-semibold">{briefing.greeting}</p>
            <p className="text-xs text-muted-foreground">Seu briefing diário</p>
          </div>
        </div>

        {/* Yesterday summary */}
        {briefing.yesterdaySummary.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Ontem</p>
            <ul className="space-y-1">
              {briefing.yesterdaySummary.map((item, index) => (
                <li key={index} className="text-sm flex items-start gap-2">
                  <span className="text-primary">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Today focus */}
        {briefing.todayFocus.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Foco de hoje</p>
            <ul className="space-y-1">
              {briefing.todayFocus.map((item, index) => (
                <li key={index} className="text-sm flex items-start gap-2">
                  <span className="text-green-500">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Tip */}
        <div className="flex items-start gap-2 p-3 bg-primary/5 rounded-lg">
          <Lightbulb className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
          <p className="text-sm">{briefing.tip}</p>
        </div>

        {/* Motivational message */}
        {briefing.motivationalMessage && (
          <p className="text-sm text-center text-muted-foreground italic">
            &ldquo;{briefing.motivationalMessage}&rdquo;
          </p>
        )}

        {/* CTA */}
        <Button className="w-full" asChild>
          <Link href="/coach">
            <MessageCircle className="h-4 w-4 mr-2" />
            Falar com o Coach
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
