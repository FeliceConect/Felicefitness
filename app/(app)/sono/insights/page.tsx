'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, TrendingUp, Lightbulb, BarChart3 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useSleep } from '@/hooks/use-sleep'
import { useSleepCorrelations } from '@/hooks/use-sleep-correlations'
import { SleepCorrelationCard, SleepTipsCard, SleepPatternChart } from '@/components/sleep'

export default function InsightsSonoPage() {
  const router = useRouter()
  const { sleepLogs, patterns, loading: loadingSleep } = useSleep(90)
  const { correlations, tips, loading: loadingCorrelations } = useSleepCorrelations()

  const loading = loadingSleep || loadingCorrelations

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="p-4 space-y-4">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b">
        <div className="flex items-center gap-3 p-4">
          <button onClick={() => router.back()} className="p-2 -ml-2 hover:bg-muted rounded-lg">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="font-semibold flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Insights de Sono
          </h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Best Times */}
        {correlations && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Melhores Horários
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-muted text-center">
                  <p className="text-sm text-muted-foreground mb-1">Melhor hora para dormir</p>
                  <p className="text-2xl font-bold">{correlations.bestBedtime}</p>
                </div>
                <div className="p-4 rounded-xl bg-muted text-center">
                  <p className="text-sm text-muted-foreground mb-1">Melhor hora para acordar</p>
                  <p className="text-2xl font-bold">{correlations.bestWakeTime}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Weekday vs Weekend */}
        {patterns && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Semana vs Fim de Semana</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Dias úteis</p>
                  <div className="p-3 rounded-lg bg-muted space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Média</span>
                      <span className="font-medium">
                        {Math.floor(patterns.weekdayAvg.duration / 60)}h{patterns.weekdayAvg.duration % 60}min
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Qualidade</span>
                      <span className="font-medium">{patterns.weekdayAvg.quality}/5</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Horário</span>
                      <span className="font-medium">{patterns.weekdayAvg.bedtime} - {patterns.weekdayAvg.wakeTime}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Fim de semana</p>
                  <div className="p-3 rounded-lg bg-muted space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Média</span>
                      <span className="font-medium">
                        {Math.floor(patterns.weekendAvg.duration / 60)}h{patterns.weekendAvg.duration % 60}min
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Qualidade</span>
                      <span className="font-medium">{patterns.weekendAvg.quality}/5</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Horário</span>
                      <span className="font-medium">{patterns.weekendAvg.bedtime} - {patterns.weekendAvg.wakeTime}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sleep Pattern */}
        {sleepLogs.length >= 3 && (
          <SleepPatternChart logs={sleepLogs.slice(0, 7)} />
        )}

        {/* Correlation with Training */}
        {correlations && correlations.sleepVsWorkoutPerformance !== 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Correlação: Sono x Treino</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Quando você dorme 7h+:
              </p>

              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span>💪</span>
                      <span>Volume de treino</span>
                    </span>
                    <span className="font-medium text-green-500">+15%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: '75%' }} />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span>🏆</span>
                      <span>Chance de PR</span>
                    </span>
                    <span className="font-medium text-green-500">+{correlations.sleepVsPRChance}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: `${50 + correlations.sleepVsPRChance}%` }} />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span>⚡</span>
                      <span>Energia no treino</span>
                    </span>
                    <span className="font-medium text-green-500">+20%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: '80%' }} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Factor Impacts */}
        {correlations && correlations.factorImpacts.length > 0 && (
          <SleepCorrelationCard factorImpacts={correlations.factorImpacts} />
        )}

        {/* Tips */}
        {tips.length > 0 && (
          <SleepTipsCard tips={tips} />
        )}

        {/* Insufficient Data Message */}
        {sleepLogs.length < 7 && (
          <Card>
            <CardContent className="p-6 text-center">
              <Lightbulb className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
              <p className="font-medium mb-2">Dados insuficientes</p>
              <p className="text-sm text-muted-foreground">
                Continue registrando seu sono por mais {7 - sleepLogs.length} dias
                para ver insights detalhados.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
