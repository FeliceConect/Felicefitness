'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ChevronLeft, TrendingUp, Lightbulb, Target } from 'lucide-react'
import { useWellnessCorrelations } from '@/hooks/use-wellness-correlations'
import { useMoodTracking } from '@/hooks/use-mood-tracking'
import { CorrelationCard } from '@/components/wellness'

export default function WellnessInsightsPage() {
  const { correlations, patterns, recommendations, loading } =
    useWellnessCorrelations()
  const moodTracking = useMoodTracking()

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-40 bg-muted rounded-xl" />
          <div className="h-32 bg-muted rounded-xl" />
        </div>
      </div>
    )
  }

  const hasEnoughData = correlations !== null && patterns !== null

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
          <h1 className="text-xl font-bold">Insights</h1>
          <p className="text-sm text-muted-foreground">
            Padrões e correlações do seu bem-estar
          </p>
        </div>
      </div>

      {!hasEnoughData ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-4xl mb-4">📊</div>
            <h2 className="font-semibold mb-2">Ainda coletando dados</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Continue fazendo seus check-ins diários. Com pelo menos 7 dias de
              dados, poderemos mostrar insights personalizados sobre seu bem-estar.
            </p>
            <Link href="/bem-estar/checkin">
              <Button>Fazer Check-in</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Correlations */}
          <div className="space-y-3">
            <h2 className="font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Correlações
            </h2>

            {correlations.workoutVsMood !== 0 && (
              <CorrelationCard
                icon="💪"
                title="Treino x Humor"
                description={
                  correlations.workoutVsMood > 0
                    ? 'Seu humor tende a ser melhor em dias que você treina!'
                    : 'Interessante: seu humor não muda muito com treino.'
                }
                correlation={correlations.workoutVsMood}
              />
            )}

            {correlations.sleepVsStress !== 0 && (
              <CorrelationCard
                icon="😴"
                title="Sono x Stress"
                description={
                  correlations.sleepVsStress > 0
                    ? 'Quando você dorme bem, seu stress é menor no dia seguinte.'
                    : 'O sono parece não afetar muito seu stress.'
                }
                correlation={correlations.sleepVsStress}
              />
            )}

            {correlations.morningWorkoutVsMood !== 0 && (
              <CorrelationCard
                icon="☀️"
                title="Treino Matinal x Humor"
                description={
                  correlations.morningWorkoutVsMood > 0
                    ? 'Treinos matinais parecem melhorar seu humor o dia todo!'
                    : 'O horário do treino não afeta muito seu humor.'
                }
                correlation={correlations.morningWorkoutVsMood}
              />
            )}
          </div>

          {/* Patterns */}
          <div className="space-y-3">
            <h2 className="font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              Padrões
            </h2>

            {patterns.bestDays.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📅</span>
                    <div>
                      <p className="font-medium">Melhores dias da semana</p>
                      <p className="text-sm text-muted-foreground">
                        {patterns.bestDays.map((d) => d.day).join(' e ')} (média{' '}
                        {patterns.bestDays[0]?.avgMood.toFixed(1)}/5)
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {patterns.worstDays.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📉</span>
                    <div>
                      <p className="font-medium">Dias mais desafiadores</p>
                      <p className="text-sm text-muted-foreground">
                        {patterns.worstDays.map((d) => d.day).join(' e ')} (média{' '}
                        {patterns.worstDays[0]?.avgMood.toFixed(1)}/5)
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {moodTracking.bestDays.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">⏰</span>
                    <div>
                      <p className="font-medium">Melhor período do dia</p>
                      <p className="text-sm text-muted-foreground">
                        {patterns.bestTimeOfDay}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Recommendations */}
          <div className="space-y-3">
            <h2 className="font-medium flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Recomendações
            </h2>

            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4">
                <p className="text-sm font-medium mb-3">
                  Baseado nos seus dados:
                </p>
                <ul className="space-y-3">
                  {recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <span className="text-primary">{index + 1}.</span>
                      <span className="text-muted-foreground">{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
