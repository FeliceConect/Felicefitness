'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { useMonthlyReport } from '@/hooks/use-monthly-report'
import { MonthPicker } from '@/components/reports/period-selector'
import { StatCard } from '@/components/reports/stat-card'
import '@/components/reports/trend-indicator'
import { InsightList } from '@/components/reports/insight-card'
import { ScoreDisplay } from '@/components/reports/score-display'
import { SummarySection, GamificationSummary } from '@/components/reports/summary-section'
import { PRList } from '@/components/reports/pr-list'
import { LineChart } from '@/components/charts/line-chart'
import { BarChart } from '@/components/charts/bar-chart'
import { ActivityHeatmap } from '@/components/charts/activity-heatmap'
import { RadarChart } from '@/components/charts/radar-chart'
import '@/lib/reports'
import {
  FileText,
  Download,
  ChevronLeft,
  Dumbbell,
  Utensils,
  Scale,
  Trophy,
  Star
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const monthNames = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

export default function RelatorioMensalPage() {
  const {
    report,
    loading,
    currentMonth,
    currentYear,
    goToMonth,
    nextMonth,
    previousMonth,
    exportPDF
  } = useMonthlyReport()

  const handleExportPDF = async () => {
    const blob = await exportPDF()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `relatorio-${monthNames[currentMonth - 1].toLowerCase()}-${currentYear}.pdf`
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
        <Skeleton className="h-48" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
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
              <FileText className="h-6 w-6 text-green-500" />
              Relatório Mensal
            </h1>
            {report && (
              <p className="text-muted-foreground">
                {monthNames[report.month - 1]} {report.year}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <MonthPicker
            month={currentMonth}
            year={currentYear}
            onMonthChange={goToMonth}
            onPrevious={previousMonth}
            onNext={nextMonth}
          />
          <Button variant="outline" onClick={handleExportPDF}>
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
        </div>
      </div>

      {report && (
        <>
          {/* Executive Summary */}
          <Card className="bg-gradient-to-r from-violet-500/10 to-blue-500/10 border-violet-500/20">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <ScoreDisplay score={report.overallScore} size="lg" showGrade />
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-xl font-semibold mb-2">Resumo Executivo</h2>
                  <p className="text-muted-foreground mb-3">{report.executiveSummary}</p>
                  <Badge variant="secondary" className="gap-1">
                    <Star className="h-3 w-3" />
                    {report.ranking}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Treinos Completos"
              value={report.summary.workouts.completed}
              subtitle={`${report.summary.workouts.completionRate}% de conclusão`}
              icon={<Dumbbell className="h-4 w-4" />}
              trend={report.comparison.workouts}
            />
            <StatCard
              title="PRs Batidos"
              value={report.prs.length}
              subtitle="novos recordes"
              icon={<Trophy className="h-4 w-4" />}
            />
            <StatCard
              title="Média de Proteína"
              value={`${report.summary.nutrition.avgProtein}g`}
              subtitle="por dia"
              icon={<Utensils className="h-4 w-4" />}
              trend={report.comparison.protein}
            />
            <StatCard
              title="Variação de Peso"
              value={
                report.summary.body.weightChange !== null
                  ? `${report.summary.body.weightChange > 0 ? '+' : ''}${report.summary.body.weightChange}kg`
                  : '-'
              }
              subtitle="no mês"
              icon={<Scale className="h-4 w-4" />}
              trend={report.comparison.weight}
              higherIsBetter={false}
            />
          </div>

          {/* Weekly Progression and Radar */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Weekly Progression */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Progressão Semanal</CardTitle>
                <CardDescription>Evolução ao longo do mês</CardDescription>
              </CardHeader>
              <CardContent>
                <BarChart
                  data={report.weeklyProgression.map(w => ({
                    label: `S${w.week}`,
                    value: w.score,
                    color: w.score >= 80 ? '#22c55e' : w.score >= 60 ? '#eab308' : '#ef4444'
                  }))}
                  height={200}
                  valueFormatter={(v) => `${v}pts`}
                />
                <div className="grid grid-cols-4 gap-2 mt-4">
                  {report.weeklyProgression.map(w => (
                    <div key={w.week} className="text-center">
                      <p className="text-xs text-muted-foreground">Semana {w.week}</p>
                      <p className="text-sm font-medium">{w.workouts} treinos</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Performance Radar */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Performance Geral</CardTitle>
                <CardDescription>Visão radar das métricas</CardDescription>
              </CardHeader>
              <CardContent>
                <RadarChart
                  data={[
                    { metric: 'Treino', value: report.summary.workouts.completionRate, fullMark: 100 },
                    { metric: 'Nutrição', value: Math.min((report.summary.nutrition.avgProtein / 170) * 100, 100), fullMark: 100 },
                    { metric: 'Hidratação', value: report.summary.hydration.targetRate, fullMark: 100 },
                    { metric: 'Consistência', value: report.overallScore, fullMark: 100 },
                    { metric: 'PRs', value: Math.min(report.prs.length * 25, 100), fullMark: 100 }
                  ]}
                  height={250}
                />
              </CardContent>
            </Card>
          </div>

          {/* Activity Heatmap */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Mapa de Atividades</CardTitle>
              <CardDescription>Visualização diária de atividades</CardDescription>
            </CardHeader>
            <CardContent>
              <ActivityHeatmap
                data={report.activityHeatmap.map(day => ({
                  date: day.date,
                  value: day.activities,
                  label: `${day.activities} atividades - ${day.score}pts`
                }))}
                weeks={6}
              />
            </CardContent>
          </Card>

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
                height={250}
                showGrid
                dateFormatter={(d) => format(new Date(d), 'dd', { locale: ptBR })}
              />
            </CardContent>
          </Card>

          {/* PRs and Insights */}
          <div className="grid gap-6 lg:grid-cols-2">
            <PRList prs={report.prs} title="PRs do Mês" showImprovement />

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Insights do Mês</CardTitle>
              </CardHeader>
              <CardContent>
                <InsightList insights={report.insights} maxItems={6} />
              </CardContent>
            </Card>
          </div>

          {/* Full Summary */}
          <SummarySection summary={report.summary} />

          {/* Gamification */}
          <GamificationSummary
            xpGained={report.summary.gamification.xpGained}
            levelsGained={report.summary.gamification.levelsGained}
            achievementsUnlocked={report.summary.gamification.achievementsUnlocked}
            currentStreak={report.summary.gamification.currentStreak}
            bestStreak={report.summary.gamification.bestStreak}
          />
        </>
      )}
    </div>
  )
}
