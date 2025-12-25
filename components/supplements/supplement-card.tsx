'use client'

import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { Supplement, SupplementSchedule } from '@/types/supplements'
import { getSupplementTypeIcon } from '@/lib/supplements/calculations'
import { ChevronRight, Check } from 'lucide-react'
import Link from 'next/link'

interface SupplementCardProps {
  supplement: Supplement
  schedules?: SupplementSchedule[]
  showLink?: boolean
  className?: string
}

export function SupplementCard({
  supplement,
  schedules,
  showLink = true,
  className,
}: SupplementCardProps) {
  const icon = getSupplementTypeIcon(supplement.tipo)

  // Calculate today's status
  const todaySchedules = schedules || []
  const taken = todaySchedules.filter(s => s.taken).length
  const total = todaySchedules.length

  const content = (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          {/* Color indicator */}
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
            style={{ backgroundColor: `${supplement.cor}20` }}
          >
            {icon}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium truncate">{supplement.nome}</h3>
              {supplement.prioridade === 'alta' && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-red-500/20 text-red-500">
                  Importante
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground truncate">
              {supplement.dosagem}
            </p>
            {total > 0 && (
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden max-w-20">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(taken / total) * 100}%`,
                      backgroundColor: supplement.cor,
                    }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">
                  {taken}/{total}
                </span>
              </div>
            )}
          </div>

          {/* Status or chevron */}
          {total > 0 && taken === total ? (
            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
              <Check className="h-4 w-4 text-green-500" />
            </div>
          ) : showLink ? (
            <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          ) : null}
        </div>
      </CardContent>
    </Card>
  )

  if (showLink) {
    return (
      <Link href={`/suplementos/${supplement.id}`} className="block">
        {content}
      </Link>
    )
  }

  return content
}
