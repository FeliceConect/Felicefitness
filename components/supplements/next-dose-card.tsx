'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { NextDose } from '@/types/supplements'
import { getSupplementTypeIcon, formatTimeRemaining } from '@/lib/supplements/calculations'
import { Bell, Check } from 'lucide-react'

interface NextDoseCardProps {
  nextDose: NextDose | null
  onMarkTaken: (supplementId: string, time: string) => void
  className?: string
}

export function NextDoseCard({
  nextDose,
  onMarkTaken,
  className,
}: NextDoseCardProps) {
  if (!nextDose) {
    return (
      <Card className={cn('bg-green-500/10 border-green-500/20', className)}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
              <Check className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="font-medium text-green-600 dark:text-green-400">
                Tudo em dia!
              </p>
              <p className="text-sm text-muted-foreground">
                Todas as doses de hoje foram tomadas
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const icon = getSupplementTypeIcon(nextDose.supplement.tipo)
  const isNow = nextDose.inMinutes <= 0
  const isUrgent = nextDose.inMinutes <= 15

  return (
    <Card
      className={cn(
        'border-2',
        isNow ? 'border-primary bg-primary/5' : 'border-transparent',
        className
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
              style={{ backgroundColor: `${nextDose.supplement.cor}20` }}
            >
              {icon}
            </div>

            <div>
              <div className="flex items-center gap-2">
                {isNow && <Bell className="h-4 w-4 text-primary animate-pulse" />}
                <span className="text-sm text-muted-foreground">Próxima dose</span>
              </div>
              <p className="font-semibold">{nextDose.supplement.nome}</p>
              <p className="text-sm text-muted-foreground">
                {nextDose.time} • {nextDose.supplement.dosagem}
              </p>
            </div>
          </div>

          <div className="text-right">
            <p
              className={cn(
                'font-bold text-lg',
                isNow ? 'text-primary' : isUrgent ? 'text-orange-500' : ''
              )}
            >
              {formatTimeRemaining(nextDose.inMinutes)}
            </p>
            <Button
              size="sm"
              className="mt-2"
              onClick={() => onMarkTaken(nextDose.supplement.id, nextDose.time)}
            >
              <Check className="h-4 w-4 mr-1" />
              Tomei
            </Button>
          </div>
        </div>

        {/* Meal relation note */}
        {nextDose.supplement.com_refeicao !== 'indiferente' && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-xs text-muted-foreground">
              {nextDose.supplement.com_refeicao === 'jejum' && '⚠️ Tomar em jejum'}
              {nextDose.supplement.com_refeicao === 'com_refeicao' && '🍽️ Tomar com refeição'}
              {nextDose.supplement.com_refeicao === 'com_gordura' && '🥑 Tomar com gordura'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
