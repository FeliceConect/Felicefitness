'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Calendar, Moon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useSleep } from '@/hooks/use-sleep'
import { SleepLogCard, SleepChart } from '@/components/sleep'
import { formatSleepDuration, formatSleepDate } from '@/lib/sleep/calculations'

type Period = 'week' | 'month' | '3months' | 'year'

export default function HistoricoSonoPage() {
  const router = useRouter()
  const [period, setPeriod] = useState<Period>('month')

  const daysMap = {
    week: 7,
    month: 30,
    '3months': 90,
    year: 365,
  }

  const { sleepLogs, stats, loading } = useSleep(daysMap[period])

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="p-4 space-y-4">
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    )
  }

  const periodLabels = {
    week: 'Semana',
    month: 'Mês',
    '3months': '3 Meses',
    year: 'Ano',
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
            <Calendar className="h-5 w-5" />
            Histórico de Sono
          </h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Period Selector */}
        <div className="flex gap-2">
          {(Object.keys(periodLabels) as Period[]).map((p) => (
            <Button
              key={p}
              variant={period === p ? 'default' : 'outline'}
              size="sm"
              className="flex-1"
              onClick={() => setPeriod(p)}
            >
              {periodLabels[p]}
            </Button>
          ))}
        </div>

        {/* Summary */}
        {stats && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                Resumo - {periodLabels[period]}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Média de sono</p>
                  <p className="text-xl font-bold">{formatSleepDuration(stats.averageDuration)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Qualidade média</p>
                  <p className="text-xl font-bold">{stats.averageQuality.toFixed(1)}/5</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Dias na meta</p>
                  <p className="text-xl font-bold">
                    {stats.daysOnGoal}/{stats.totalDays}
                    <span className="text-sm font-normal text-muted-foreground ml-1">
                      ({Math.round((stats.daysOnGoal / stats.totalDays) * 100)}%)
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Consistência</p>
                  <p className="text-xl font-bold">{stats.consistencyScore}%</p>
                </div>
              </div>

              {/* Best and Worst */}
              {stats.bestNight && stats.worstNight && (
                <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Melhor noite</p>
                    <p className="font-medium">{formatSleepDuration(stats.bestNight.duration)}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatSleepDate(stats.bestNight.date)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pior noite</p>
                    <p className="font-medium">{formatSleepDuration(stats.worstNight.duration)}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatSleepDate(stats.worstNight.date)}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Duration Chart */}
        {sleepLogs.length > 0 && (
          <SleepChart logs={sleepLogs.slice(0, 7)} goalHours={7} />
        )}

        {/* Quality Chart */}
        {sleepLogs.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Qualidade do Sono</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between gap-1 h-24">
                {sleepLogs.slice(0, 14).reverse().map((log, index) => {
                  const heightPercent = (log.quality / 5) * 100
                  return (
                    <div
                      key={log.id || index}
                      className="flex-1 flex flex-col items-center"
                    >
                      <div className="relative w-full h-20 flex items-end justify-center">
                        <div
                          className={`w-full max-w-4 rounded-t-sm transition-all ${
                            log.quality >= 4 ? 'bg-green-500' :
                            log.quality >= 3 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ height: `${heightPercent}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>14 dias atrás</span>
                <span>Hoje</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Logs */}
        <div className="space-y-3">
          <h2 className="font-semibold">Registros Recentes</h2>

          {sleepLogs.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <Moon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhum registro encontrado</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {sleepLogs.slice(0, 10).map((log) => (
                <SleepLogCard key={log.id} log={log} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
