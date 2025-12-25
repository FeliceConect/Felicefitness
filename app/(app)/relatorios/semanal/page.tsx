'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { useWeeklyReport } from '@/hooks/use-weekly-report'
import { WeekPicker } from '@/components/reports/period-selector'
import { StatCard } from '@/components/reports/stat-card'
import { TrendIndicator } from '@/components/reports/trend-indicator'
import { InsightList } from '@/components/reports/insight-card'
import { ScoreDisplay, DailyScore } from '@/components/reports/score-display'
import { SummarySection } from '@/components/reports/summary-section'
import { PRList } from '@/components/reports/pr-list'
import { BarChart } from '@/components/charts/bar-chart'
import { LineChart } from '@/components/charts/line-chart'
import { formatDateRange } from '@/lib/reports'
import {
  Calendar,
  Download,
  ChevronLeft,
  Dumbbell,
  Utensils,
  Droplets,
  CheckCircle2,
  XCircle,
  Flame
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function RelatorioSemanalPage() {
  const {
    report,
    loading,
    currentWeek,
    currentYear,
    goToWeek,
    nextWeek,
    previousWeek,
    exportPDF
  } = useWeeklyReport()

  const handleExportPDF = async () => {
    const blob = await exportPDF()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `relatorio-semana-${currentWeek}-${currentYear}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="container max-w-6xl py-6 pb-24 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-64" />
        </div>
        <Skeleton className="h-64" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-6xl py-6 pb-24 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link href="/relatorios">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Calendar className="h-6 w-6 text-blue-500" />
              Relatório Semanal
            </h1>
            {report && (
              <p className="text-muted-foreground">
                {formatDateRange(report.dateRange)}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <WeekPicker
            week={currentWeek}
            year={currentYear}
            onWeekChange={goToWeek}
            onPrevious={previousWeek}
            onNext={nextWeek}
          />
          <Button variant="outline" onClick={handleExportPDF}>
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
        </div>
      </div>

      {report && (
        <>
          {/* Score Overview */}
          <div className="grid gap-6 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Pontuação da Semana</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <ScoreDisplay score={report.summary.score.average} size="lg" showGrade />
                <div className="flex items-center gap-2 mt-4">
                  {report.comparison.score && (
                    <TrendIndicator trend={report.comparison.score} size="md" />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Daily Scores */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Pontuação Diária</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between gap-2">
                  {report.dailyActivity.map((day) => {
                    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
                    const date = new Date(day.date)
                    return (
                      <DailyScore
                        key={day.date}
                        score={day.score}
                        date={dayNames[date.getDay()]}
                        isToday={format(new Date(), 'yyyy-MM-dd') === day.date}
                      />
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Treinos"
              value={`${report.summary.workouts.completed}/${report.summary.workouts.planned}`}
              subtitle={`${report.summary.workouts.completionRate}% concluído`}
              icon={<Dumbbell className="h-4 w-4" />}
              trend={report.comparison.workouts}
            />
            <StatCard
              title="Calorias"
              value={`${report.summary.nutrition.avgCalories} kcal`}
              subtitle="média diária"
              icon={<Flame className="h-4 w-4" />}
              trend={report.comparison.calories}
            />
            <StatCard
              title="Proteína"
              value={`${report.summary.nutrition.avgProtein}g`}
              subtitle="média diária"
              icon={<Utensils className="h-4 w-4" />}
              trend={report.comparison.protein}
            />
            <StatCard
              title="Água"
              value={`${report.summary.hydration.avgDaily}L`}
              subtitle="média diária"
              icon={<Droplets className="h-4 w-4" />}
              trend={report.comparison.water}
            />
          </div>

          {/* Daily Activity Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resumo Diário</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {report.dailyActivity.map((day) => {
                  const date = new Date(day.date)
                  return (
                    <div
                      key={day.date}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-medium w-24">
                          {format(date, 'EEE, dd/MM', { locale: ptBR })}
                        </span>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            {day.workout ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span className="text-sm">Treino</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Utensils className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{day.mealsLogged} refeições</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {day.waterGoalMet ? (
                              <CheckCircle2 className="h-4 w-4 text-blue-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span className="text-sm">Água</span>
                          </div>
                        </div>
                      </div>
                      <Badge
                        variant={day.score >= 80 ? 'default' : day.score >= 60 ? 'secondary' : 'outline'}
                      >
                        {day.score} pts
                      </Badge>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Charts Row */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Score Evolution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Evolução da Pontuação</CardTitle>
              </CardHeader>
              <CardContent>
                <LineChart
                  data={report.summary.score.dailyScores.map(s => ({
                    date: s.date,
                    value: s.score
                  }))}
                  color="#8b5cf6"
                  goalValue={80}
                  height={200}
                  dateFormatter={(d) => {
                    const date = new Date(d)
                    return format(date, 'EEE', { locale: ptBR })
                  }}
                />
              </CardContent>
            </Card>

            {/* Macros Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Média de Macros</CardTitle>
              </CardHeader>
              <CardContent>
                <BarChart
                  data={[
                    { label: 'Proteína', value: report.summary.nutrition.avgProtein, color: '#ef4444' },
                    { label: 'Carbs', value: report.summary.nutrition.avgCarbs, color: '#3b82f6' },
                    { label: 'Gordura', value: report.summary.nutrition.avgFat, color: '#f59e0b' }
                  ]}
                  height={200}
                  valueFormatter={(v) => `${v}g`}
                />
              </CardContent>
            </Card>
          </div>

          {/* PRs and Insights */}
          <div className="grid gap-6 lg:grid-cols-2">
            <PRList prs={report.prs} title="PRs da Semana" />

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Insights da Semana</CardTitle>
              </CardHeader>
              <CardContent>
                <InsightList insights={report.insights} maxItems={5} />
              </CardContent>
            </Card>
          </div>

          {/* Full Summary */}
          <SummarySection summary={report.summary} />
        </>
      )}
    </div>
  )
}
