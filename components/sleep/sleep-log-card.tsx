'use client'

import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { formatSleepDuration, formatSleepDate, getQualityStars } from '@/lib/sleep/calculations'
import type { SleepLog } from '@/types/sleep'
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface SleepLogCardProps {
  log: SleepLog
  className?: string
  showLink?: boolean
}

export function SleepLogCard({ log, className, showLink = false }: SleepLogCardProps) {
  const content = (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="font-medium">{formatSleepDate(log.date)}</p>
            <p className="text-2xl font-bold">{formatSleepDuration(log.duration)}</p>
            <p className="text-sm text-muted-foreground">
              {log.bedtime} → {log.wake_time}
            </p>
          </div>

          <div className="text-right space-y-1">
            <p className="text-lg">{getQualityStars(log.quality)}</p>
            {showLink && (
              <ChevronRight className="h-5 w-5 text-muted-foreground ml-auto" />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  if (showLink) {
    return (
      <Link href={`/sono/registro/${log.id}`} className="block">
        {content}
      </Link>
    )
  }

  return content
}
