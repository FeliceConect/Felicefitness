'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ChevronLeft, Calendar } from 'lucide-react'
import { useWellness } from '@/hooks/use-wellness'
import { useMoodTracking } from '@/hooks/use-mood-tracking'
import {
  MoodDisplay,
  MoodHistoryChart,
  FactorsDisplay,
  WellnessStreak,
  StressGauge,
  EnergyDisplay,
} from '@/components/wellness'

export default function WellnessHistoryPage() {
  const wellness = useWellness()
  const moodTracking = useMoodTracking()

  if (wellness.loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-40 bg-muted rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 pb-24 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/bem-estar">
          <Button variant="ghost" size="icon">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold">Histórico</h1>
          <p className="text-sm text-muted-foreground">
            Seu histórico de bem-estar
          </p>
        </div>
      </div>

      {/* Streak */}
      <div className="flex justify-center">
        <WellnessStreak streak={wellness.checkinStreak} size="lg" />
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{moodTracking.weeklyAverage || '-'}</p>
            <p className="text-xs text-muted-foreground">Média semanal</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{moodTracking.monthlyAverage || '-'}</p>
            <p className="text-xs text-muted-foreground">Média mensal</p>
          </CardContent>
        </Card>
      </div>

      {/* Week chart */}
      <MoodHistoryChart data={moodTracking.weekMoods} title="Esta Semana" />

      {/* Recent check-ins */}
      <div className="space-y-3">
        <h2 className="font-medium flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Check-ins Recentes
        </h2>

        {wellness.history.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <p>Nenhum check-in registrado ainda.</p>
              <Link href="/bem-estar/checkin">
                <Button variant="link" className="mt-2">
                  Fazer primeiro check-in
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          wellness.history.slice(0, 14).map((checkin) => {
            const date = new Date(checkin.data)
            const formattedDate = date.toLocaleDateString('pt-BR', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
            })

            return (
              <Card key={checkin.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-medium capitalize">{formattedDate}</p>
                      {checkin.horario && (
                        <p className="text-xs text-muted-foreground">
                          às {checkin.horario}
                        </p>
                      )}
                    </div>
                    <MoodDisplay value={checkin.humor} size="sm" showLabel />
                  </div>

                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Stress:</span>
                      <StressGauge value={checkin.stress} size="sm" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Energia:</span>
                      <EnergyDisplay value={checkin.energia} size="sm" showLabel={false} />
                    </div>
                  </div>

                  <FactorsDisplay
                    positiveFactors={checkin.fatoresPositivos}
                    negativeFactors={checkin.fatoresNegativos}
                  />

                  {checkin.notas && (
                    <p className="text-sm text-muted-foreground mt-2 italic">
                      &quot;{checkin.notas}&quot;
                    </p>
                  )}
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
