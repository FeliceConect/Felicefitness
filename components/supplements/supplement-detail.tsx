'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Supplement, SupplementSchedule } from '@/types/supplements'
import { getSupplementTypeIcon } from '@/lib/supplements/calculations'
import { WEEKDAYS, MEAL_RELATION_OPTIONS } from '@/types/supplements'
import {
  Edit,
  Clock,
  Package,
  Calendar,
  AlertTriangle,
  Pill,
  Info
} from 'lucide-react'
import Link from 'next/link'

interface SupplementDetailProps {
  supplement: Supplement
  todaySchedule?: SupplementSchedule[]
  adherenceRate?: number
  className?: string
}

export function SupplementDetail({
  supplement,
  todaySchedule = [],
  adherenceRate,
  className,
}: SupplementDetailProps) {
  const icon = getSupplementTypeIcon(supplement.tipo)
  const mealOption = MEAL_RELATION_OPTIONS.find(m => m.value === supplement.com_refeicao)

  const takenToday = todaySchedule.filter(s => s.taken).length
  const totalToday = todaySchedule.length

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
              style={{ backgroundColor: `${supplement.cor}20` }}
            >
              {icon}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl font-bold">{supplement.nome}</h1>
                {supplement.prioridade === 'alta' && (
                  <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-500">
                    Importante
                  </span>
                )}
              </div>
              <p className="text-muted-foreground">{supplement.dosagem}</p>

              {/* Today's progress */}
              {totalToday > 0 && (
                <div className="mt-3">
                  <div className="flex items-center gap-2 text-sm mb-1">
                    <span className="text-muted-foreground">Hoje:</span>
                    <span className="font-medium">
                      {takenToday}/{totalToday} doses
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden w-32">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(takenToday / totalToday) * 100}%`,
                        backgroundColor: supplement.cor,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            <Button variant="outline" size="icon" asChild>
              <Link href={`/suplementos/${supplement.id}/editar`}>
                <Edit className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Schedule Info */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Horários
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {supplement.horarios.map(horario => (
              <span
                key={horario}
                className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary font-medium"
              >
                {horario}
              </span>
            ))}
          </div>

          {supplement.frequencia === 'dias_especificos' && supplement.dias_semana && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Dias da semana:</p>
              <div className="flex gap-1">
                {WEEKDAYS.map(day => (
                  <span
                    key={day.value}
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-xs',
                      supplement.dias_semana?.includes(day.value)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {day.short}
                  </span>
                ))}
              </div>
            </div>
          )}

          {mealOption && mealOption.value !== 'indiferente' && (
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <span className="text-lg">{mealOption.icon}</span>
              <span className="text-sm">{mealOption.label}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stock Info */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4" />
            Estoque
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">{supplement.quantidade_estoque}</p>
              <p className="text-sm text-muted-foreground">unidades</p>
            </div>

            {supplement.quantidade_estoque <= supplement.alerta_estoque_minimo && (
              <div className="flex items-center gap-2 text-orange-500">
                <AlertTriangle className="h-5 w-5" />
                <span className="text-sm font-medium">Estoque baixo</span>
              </div>
            )}
          </div>

          <div className="mt-3 pt-3 border-t">
            <p className="text-xs text-muted-foreground">
              Alerta quando chegar a {supplement.alerta_estoque_minimo} unidades
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Adherence */}
      {adherenceRate !== undefined && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Aderência (30 dias)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  'text-3xl font-bold',
                  adherenceRate >= 90 ? 'text-green-500' :
                  adherenceRate >= 70 ? 'text-yellow-500' : 'text-red-500'
                )}
              >
                {adherenceRate}%
              </div>
              <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full',
                    adherenceRate >= 90 ? 'bg-green-500' :
                    adherenceRate >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                  )}
                  style={{ width: `${adherenceRate}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Restrictions */}
      {supplement.restricoes && supplement.restricoes.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Pill className="h-4 w-4" />
              Restrições
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {supplement.restricoes.map(restricao => (
                <span
                  key={restricao}
                  className="px-3 py-1 rounded-full bg-orange-500/20 text-orange-600 dark:text-orange-400 text-sm"
                >
                  {restricao}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {supplement.notas && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Info className="h-4 w-4" />
              Observações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {supplement.notas}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
