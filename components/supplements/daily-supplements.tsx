'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { SupplementSchedule } from '@/types/supplements'
import { getSupplementTypeIcon, formatTimeRemaining } from '@/lib/supplements/calculations'
import { Check, Clock } from 'lucide-react'

interface DailySupplementsProps {
  schedule: SupplementSchedule[]
  onToggleTaken: (supplementId: string, time: string, taken: boolean) => void
  className?: string
}

export function DailySupplements({
  schedule,
  onToggleTaken,
  className,
}: DailySupplementsProps) {
  // Group by time
  const groupedByTime: Record<string, SupplementSchedule[]> = {}
  for (const item of schedule) {
    if (!groupedByTime[item.time]) {
      groupedByTime[item.time] = []
    }
    groupedByTime[item.time].push(item)
  }

  const times = Object.keys(groupedByTime).sort()
  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()

  // Find next time slot
  let nextTimeSlot: string | null = null
  for (const time of times) {
    const [h, m] = time.split(':').map(Number)
    const timeMinutes = h * 60 + m
    const items = groupedByTime[time]
    const allTaken = items.every(i => i.taken)

    if (!allTaken && timeMinutes >= currentMinutes - 30) {
      nextTimeSlot = time
      break
    }
  }

  if (schedule.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Nenhum suplemento programado para hoje
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn(className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Cronograma do Dia
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {times.map((time) => {
          const items = groupedByTime[time]
          const allTaken = items.every(i => i.taken)
          const [h, m] = time.split(':').map(Number)
          const timeMinutes = h * 60 + m
          const isPast = timeMinutes < currentMinutes - 30
          const isNext = time === nextTimeSlot

          return (
            <div
              key={time}
              className={cn(
                'relative pl-6 pb-4 border-l-2',
                allTaken ? 'border-green-500' : isPast ? 'border-muted' : 'border-primary',
                isNext && 'bg-primary/5 -mx-4 px-4 py-2 rounded-lg border-l-0'
              )}
            >
              {/* Time indicator */}
              <div
                className={cn(
                  'absolute left-0 -translate-x-1/2 w-3 h-3 rounded-full',
                  allTaken
                    ? 'bg-green-500'
                    : isPast
                    ? 'bg-muted-foreground'
                    : 'bg-primary'
                )}
              />

              {/* Time label */}
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={cn(
                    'font-medium',
                    allTaken && 'text-green-500',
                    isNext && 'text-primary'
                  )}
                >
                  {time}
                </span>
                {allTaken && (
                  <span className="text-xs text-green-500">✓ Completo</span>
                )}
                {isNext && !allTaken && (
                  <span className="text-xs text-primary font-medium">
                    {formatTimeRemaining(timeMinutes - currentMinutes)}
                  </span>
                )}
              </div>

              {/* Supplements at this time */}
              <div className="space-y-2">
                {items.map((item) => {
                  const icon = getSupplementTypeIcon(item.supplement.tipo)
                  return (
                    <div
                      key={`${item.supplement.id}-${item.time}`}
                      className="flex items-center gap-3"
                    >
                      <Button
                        variant={item.taken ? 'default' : 'outline'}
                        size="sm"
                        className={cn(
                          'w-8 h-8 p-0',
                          item.taken && 'bg-green-500 hover:bg-green-600'
                        )}
                        onClick={() =>
                          onToggleTaken(item.supplement.id, item.time, !item.taken)
                        }
                      >
                        {item.taken ? (
                          <Check className="h-4 w-4" />
                        ) : null}
                      </Button>

                      <span className="text-lg">{icon}</span>

                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            'text-sm font-medium truncate',
                            item.taken && 'line-through text-muted-foreground'
                          )}
                        >
                          {item.supplement.nome}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.supplement.dosagem}
                        </p>
                      </div>

                      {item.supplement.prioridade === 'alta' && (
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: item.supplement.cor }}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
