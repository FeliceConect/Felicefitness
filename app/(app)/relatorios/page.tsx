'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useAnalytics } from '@/hooks/use-analytics'
import { PeriodSelector } from '@/components/reports/period-selector'
import { StatCard } from '@/components/reports/stat-card'
import { InsightList } from '@/components/reports/insight-card'
import { ScoreDisplay } from '@/components/reports/score-display'
import { SummarySection, GamificationSummary } from '@/components/reports/summary-section'
import { LineChart } from '@/components/charts/line-chart'
import { ActivityHeatmap } from '@/components/charts/activity-heatmap'
import { formatDateRange } from '@/lib/reports'
import {
  Dumbbell,
  Utensils,
  Droplets,
  TrendingUp,
  Calendar,
  FileText,
  ChevronRight,
  BarChart3,
  Target
} from 'lucide-react'
import Link from 'next/link'

export default function RelatoriosPage() {
  const {
    summary,
    trends,
    insights,
    period,
    setPeriod,
    dateRange,
    loading
  } = useAnalytics()

  if (loading) {
    return (
      <div className="container max-w-6xl py-6 pb-24 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  return (
    <div className="container max-w-6xl py-6 pb-24 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-violet-500" />
            Relatórios e Analytics
          </h1>
          <p className="text-muted-foreground">
            {formatDateRange(dateRange)}
          </p>
        </div>
        <PeriodSelector period={period} onPeriodChange={setPeriod} />
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Treinos"
          value={`${summary?.workouts.completed || 0}/${summary?.workouts.planned || 0}`}
          subtitle={`${summary?.workouts.completionRate || 0}% de conclusão`}
          icon={<Dumbbell className="h-4 w-4" />}
          trend={trends.workouts}
        />
        <StatCard
          title="Média de Calorias"
          value={`${summary?.nutrition.avgCalories || 0} kcal`}
          subtitle={`${summary?.nutrition.daysOnCalorieTarget || 0} dias na meta`}
          icon={<Utensils className="h-4 w-4" />}
          trend={trends.calories}
        />
        <StatCard
          title="Média de Proteína"
          value={`${summary?.nutrition.avgProtein || 0}g`}
          subtitle={`${summary?.nutrition.daysOnProteinTarget || 0} dias na meta`}
          icon={<Target className="h-4 w-4" />}
          trend={trends.protein}
        />
        <StatCard
          title="Hidratação"
          value={`${summary?.hydration.avgDaily || 0}L/dia`}
          subtitle={`${summary?.hydration.daysOnTarget || 0} dias na meta`}
          icon={<Droplets className="h-4 w-4" />}
          trend={trends.water}
        />
      </div>

      {/* Score and Insights */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Score Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pontuação do Período</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <ScoreDisplay
              score={summary?.score.average || 0}
              size="lg"
              showGrade
            />
            <div className="grid grid-cols-3 gap-4 mt-6 w-full text-center">
              <div>
                <p className="text-2xl font-bold text-green-500">{summary?.score.best || 0}</p>
                <p className="text-xs text-muted-foreground">Melhor</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{summary?.score.average || 0}</p>
                <p className="text-xs text-muted-foreground">Média</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-500">{summary?.score.worst || 0}</p>
                <p className="text-xs text-muted-foreground">Pior</p>
              </div>
            </div>
            {(summary?.score.perfectDays || 0) > 0 && (
              <p className="text-sm text-violet-500 mt-4">
                {summary?.score.perfectDays} dias perfeitos!
              </p>
            )}
          </CardContent>
        </Card>

        {/* Insights */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Insights</CardTitle>
              <CardDescription>Destaques do período</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <InsightList insights={insights} maxItems={5} />
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Daily Score Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Evolução da Pontuação</CardTitle>
          </CardHeader>
          <CardContent>
            {summary?.score.dailyScores && summary.score.dailyScores.length > 0 ? (
              <LineChart
                data={summary.score.dailyScores.map(s => ({
                  date: s.date,
                  value: s.score
                }))}
                color="#8b5cf6"
                goalValue={80}
                goalLabel="Meta"
                height={200}
                dateFormatter={(d) => d.split('-').slice(1).join('/')}
              />
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                Sem dados de pontuação
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity Heatmap */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Mapa de Atividades</CardTitle>
          </CardHeader>
          <CardContent>
            {summary?.score.dailyScores && summary.score.dailyScores.length > 0 ? (
              <ActivityHeatmap
                data={summary.score.dailyScores.map(s => ({
                  date: s.date,
                  value: Math.floor(s.score / 25), // Convert score to 0-4 scale
                  label: `Pontuação: ${s.score}`
                }))}
                weeks={period === 'week' ? 2 : period === 'month' ? 5 : 12}
              />
            ) : (
              <div className="h-[150px] flex items-center justify-center text-muted-foreground">
                Sem dados de atividade
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Full Summary */}
      {summary && <SummarySection summary={summary} />}

      {/* Gamification */}
      {summary && (
        <GamificationSummary
          xpGained={summary.gamification.xpGained}
          levelsGained={summary.gamification.levelsGained}
          achievementsUnlocked={summary.gamification.achievementsUnlocked}
          currentStreak={summary.gamification.currentStreak}
          bestStreak={summary.gamification.bestStreak}
        />
      )}

      {/* Quick Links to Reports */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/relatorios/semanal">
          <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardContent className="flex items-center justify-between p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">Relatório Semanal</p>
                  <p className="text-sm text-muted-foreground">Análise detalhada</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/relatorios/mensal">
          <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardContent className="flex items-center justify-between p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10 text-green-500">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">Relatório Mensal</p>
                  <p className="text-sm text-muted-foreground">Visão completa</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/relatorios/evolucao">
          <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardContent className="flex items-center justify-between p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-violet-500/10 text-violet-500">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">Evolução</p>
                  <p className="text-sm text-muted-foreground">Gráficos de progresso</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
