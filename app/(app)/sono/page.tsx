'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, ChevronRight, Moon, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useSleep } from '@/hooks/use-sleep'
import { useSleepCorrelations } from '@/hooks/use-sleep-correlations'
import {
  SleepStatsCard,
  SleepChart,
  SleepPatternChart,
  SleepTipsCard,
} from '@/components/sleep'
import { formatSleepDuration, getQualityStars, calculateSleepGoalDiff } from '@/lib/sleep/calculations'
import Link from 'next/link'

export default function SonoPage() {
  const router = useRouter()
  const { lastSleep, sleepLogs, stats, loading } = useSleep(30)
  const { tips, loading: loadingCorrelations } = useSleepCorrelations()

  const goalHours = 7

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="p-4 space-y-6">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    )
  }

  const weeklyLogs = sleepLogs.slice(0, 7)
  const weeklyStats = stats ? {
    avgDuration: stats.averageDuration,
    avgQuality: stats.averageQuality,
    daysOnGoal: stats.daysOnGoal,
    totalDays: Math.min(stats.totalDays, 7),
  } : { avgDuration: 0, avgQuality: 0, daysOnGoal: 0, totalDays: 0 }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 -ml-2 hover:bg-muted rounded-lg">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="font-semibold flex items-center gap-2">
              <Moon className="h-5 w-5" />
              Sono
            </h1>
          </div>
          <Link href="/sono/registrar">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Registrar
            </Button>
          </Link>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Last Night */}
        {lastSleep ? (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Última Noite</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-3xl font-bold">{formatSleepDuration(lastSleep.duration)}</p>
                  <p className="text-sm text-muted-foreground">
                    {lastSleep.bedtime} → {lastSleep.wake_time}
                  </p>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-lg">{getQualityStars(lastSleep.quality)}</p>
                  <p className="text-sm text-muted-foreground">
                    Qualidade: {['Péssimo', 'Ruim', 'Regular', 'Bom', 'Excelente'][lastSleep.quality - 1]}
                  </p>
                </div>
              </div>

              {/* Goal comparison */}
              <div className="mt-4 pt-4 border-t">
                {(() => {
                  const { label, onGoal } = calculateSleepGoalDiff(lastSleep.duration, goalHours)
                  return (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">vs Meta ({goalHours}h)</span>
                      <span className={onGoal ? 'text-green-500 font-medium' : 'text-orange-500 font-medium'}>
                        {onGoal ? '✓ Na meta' : label}
                      </span>
                    </div>
                  )
                })()}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <Moon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">Nenhum registro de sono ainda</p>
              <Link href="/sono/registrar">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Registrar primeira noite
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Weekly Stats */}
        {weeklyLogs.length > 0 && (
          <SleepStatsCard
            avgDuration={weeklyStats.avgDuration}
            avgQuality={weeklyStats.avgQuality}
            daysOnGoal={weeklyStats.daysOnGoal}
            totalDays={weeklyStats.totalDays}
          />
        )}

        {/* Duration Chart */}
        {weeklyLogs.length > 0 && (
          <SleepChart logs={weeklyLogs} goalHours={goalHours} />
        )}

        {/* Sleep Pattern */}
        {weeklyLogs.length >= 3 && (
          <SleepPatternChart logs={weeklyLogs} />
        )}

        {/* Tips */}
        {!loadingCorrelations && tips.length > 0 && (
          <SleepTipsCard tips={tips} />
        )}

        {/* Quick Links */}
        <div className="space-y-2">
          <Link href="/sono/historico">
            <Card className="hover:bg-muted/50 transition-colors">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Moon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Histórico de Sono</p>
                    <p className="text-sm text-muted-foreground">
                      {sleepLogs.length} registros
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>

          <Link href="/sono/insights">
            <Card className="hover:bg-muted/50 transition-colors">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Insights e Correlações</p>
                    <p className="text-sm text-muted-foreground">
                      Análise do seu sono
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Register Button */}
        <Link href="/sono/registrar">
          <Button className="w-full" size="lg">
            <Plus className="h-5 w-5 mr-2" />
            Registrar Sono
          </Button>
        </Link>
      </div>
    </div>
  )
}
