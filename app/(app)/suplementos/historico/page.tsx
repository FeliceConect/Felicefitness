'use client'

import { useState } from 'react'
import { useSupplementHistory } from '@/hooks/use-supplement-history'
import { AppHeader } from '@/components/layout/app-header'
import { BottomNav } from '@/components/layout/bottom-nav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { SupplementHistory, SupplementStatsCard } from '@/components/supplements'
import { Calendar, TrendingUp, Pill } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function HistoricoPage() {
  const {
    stats,
    calendarData,
    adherenceBySuplement,
    supplements,
    selectedMonth,
    isLoading,
    changeMonth,
  } = useSupplementHistory(30)

  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const handleDayClick = (date: string) => {
    setSelectedDate(date === selectedDate ? null : date)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader title="Histórico" showBack />
        <main className="container max-w-lg mx-auto px-4 py-6 pb-24 space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
        </main>
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="Histórico" showBack />

      <main className="container max-w-lg mx-auto px-4 py-6 pb-24 space-y-6">
        {/* Stats Card */}
        <SupplementStatsCard stats={stats} />

        {/* Calendar */}
        <SupplementHistory
          calendarData={calendarData}
          month={selectedMonth}
          onMonthChange={changeMonth}
          onDayClick={handleDayClick}
        />

        {/* Selected Day Details */}
        {selectedDate && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const dayData = calendarData.find(d => d.date === selectedDate)
                if (!dayData) return null

                return (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Doses tomadas</span>
                      <span className="font-medium">
                        {dayData.taken}/{dayData.total}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full',
                          dayData.status === 'complete' ? 'bg-green-500' :
                          dayData.status === 'partial' ? 'bg-yellow-500' : 'bg-red-500'
                        )}
                        style={{
                          width: `${dayData.total > 0 ? (dayData.taken / dayData.total) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                )
              })()}
            </CardContent>
          </Card>
        )}

        {/* Adherence by Supplement */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Pill className="h-4 w-4" />
              Aderência por Suplemento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {supplements.map(supplement => {
              const adherence = adherenceBySuplement[supplement.id] || 0
              return (
                <div key={supplement.id} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium truncate">{supplement.nome}</span>
                    <span
                      className={cn(
                        'font-medium',
                        adherence >= 90 ? 'text-green-500' :
                        adherence >= 70 ? 'text-yellow-500' : 'text-red-500'
                      )}
                    >
                      {adherence}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full',
                        adherence >= 90 ? 'bg-green-500' :
                        adherence >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                      )}
                      style={{ width: `${adherence}%` }}
                    />
                  </div>
                </div>
              )
            })}

            {supplements.length === 0 && (
              <p className="text-center text-muted-foreground py-4">
                Nenhum suplemento cadastrado
              </p>
            )}
          </CardContent>
        </Card>

        {/* Tips */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Dicas para Melhorar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.adherenceRate < 70 && (
              <div className="p-3 bg-red-500/10 rounded-lg">
                <p className="text-sm">
                  Sua aderência está abaixo de 70%. Tente configurar lembretes ou vincular a tomada a uma rotina existente.
                </p>
              </div>
            )}

            {stats.currentStreak > 0 && stats.currentStreak >= 3 && (
              <div className="p-3 bg-green-500/10 rounded-lg">
                <p className="text-sm">
                  Você está em uma sequência de {stats.currentStreak} dias! Continue assim para manter o hábito.
                </p>
              </div>
            )}

            {stats.currentStreak === 0 && (
              <div className="p-3 bg-yellow-500/10 rounded-lg">
                <p className="text-sm">
                  Sua sequência foi quebrada. Não desanime, comece novamente hoje!
                </p>
              </div>
            )}

            <div className="p-3 bg-blue-500/10 rounded-lg">
              <p className="text-sm">
                Tomar suplementos sempre no mesmo horário ajuda a criar um hábito consistente.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>

      <BottomNav />
    </div>
  )
}
