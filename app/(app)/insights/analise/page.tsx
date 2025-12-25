'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AIReportCard } from '@/components/insights/ai-report'
import { PatternCard, CorrelationCard, WeeklyPatternChart } from '@/components/insights/pattern-card'
import { useAIAnalysis } from '@/hooks/use-ai-analysis'
import { usePatterns } from '@/hooks/use-patterns'
import { ArrowLeft, Sparkles, Loader2 } from 'lucide-react'

export default function AnalysisPage() {
  const router = useRouter()
  const { report, generateReport, loading: reportLoading, error } = useAIAnalysis()
  const { patterns, correlations, trends, loading: patternsLoading } = usePatterns()

  const [generating, setGenerating] = useState(false)

  const handleGenerateReport = async () => {
    setGenerating(true)
    try {
      await generateReport('weekly')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-bold">Análise Detalhada</h1>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateReport}
            disabled={generating || reportLoading}
          >
            {generating ? (
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-1" />
            )}
            {generating ? 'Gerando...' : 'Gerar Relatório'}
          </Button>
        </div>
      </header>

      <main className="p-4 space-y-6">
        {/* Relatório IA */}
        {report && (
          <div>
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Relatório da IA
            </h2>
            <AIReportCard report={report} />
          </div>
        )}

        {/* Padrões Identificados */}
        {patterns && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold">Padrões Identificados</h2>

            {/* Melhores dias */}
            {patterns.bestWorkoutDays.length > 0 && (
              <PatternCard
                title="Seus Melhores Dias"
                icon="📅"
                description={`Você tende a ter melhor humor e energia em ${patterns.bestWorkoutDays.join(' e ')}.`}
                data={[
                  {
                    label: 'Melhores',
                    value: patterns.bestWorkoutDays.join(', '),
                    highlight: true,
                  },
                  {
                    label: 'Mais difíceis',
                    value: patterns.worstWorkoutDays.join(', '),
                  },
                ]}
              />
            )}

            {/* Horário de treino */}
            {patterns.optimalWorkoutTime && (
              <PatternCard
                title="Horário Ideal de Treino"
                icon="⏰"
                description={`A maioria dos seus treinos são realizados às ${patterns.optimalWorkoutTime}. Isso pode indicar seu horário mais produtivo.`}
                data={[
                  {
                    label: 'Horário mais comum',
                    value: patterns.optimalWorkoutTime,
                    highlight: true,
                  },
                ]}
              />
            )}

            {/* Padrão semanal */}
            {patterns.weeklyPatterns.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <span>📊</span>
                    Padrão Semanal de Humor
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <WeeklyPatternChart
                    data={patterns.weeklyPatterns.map((p) => ({
                      dayOfWeek: p.dayOfWeek,
                      value: p.avgMood,
                    }))}
                    maxValue={5}
                    color="primary"
                  />
                </CardContent>
              </Card>
            )}

            {/* Fatores de humor */}
            {patterns.moodFactors.length > 0 && (
              <PatternCard
                title="Fatores que Afetam seu Humor"
                icon="🧠"
                description="Estes são os fatores mais frequentes que você registra."
                data={patterns.moodFactors.map((f) => ({
                  label: f.impact === 'positive' ? '✅' : '⚠️',
                  value: f.factor,
                  highlight: f.impact === 'positive',
                }))}
              />
            )}
          </div>
        )}

        {/* Correlações */}
        {correlations.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold">Correlações Descobertas</h2>
            {correlations.map((corr, index) => (
              <CorrelationCard
                key={index}
                metric1={corr.metric1}
                metric2={corr.metric2}
                coefficient={corr.coefficient}
                interpretation={corr.interpretation}
              />
            ))}
          </div>
        )}

        {/* Tendências */}
        {(trends.workout || trends.sleep || trends.wellness) && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold">Tendências</h2>
            <div className="grid grid-cols-2 gap-2">
              {trends.workout && (
                <Card>
                  <CardContent className="p-3">
                    <p className="text-xs text-muted-foreground">Volume de Treino</p>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-lg">
                        {trends.workout.direction === 'up'
                          ? '📈'
                          : trends.workout.direction === 'down'
                            ? '📉'
                            : '➡️'}
                      </span>
                      <span className="font-medium">
                        {trends.workout.percentage.toFixed(0)}%
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {trends.sleep && (
                <Card>
                  <CardContent className="p-3">
                    <p className="text-xs text-muted-foreground">Qualidade do Sono</p>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-lg">
                        {trends.sleep.direction === 'up'
                          ? '📈'
                          : trends.sleep.direction === 'down'
                            ? '📉'
                            : '➡️'}
                      </span>
                      <span className="font-medium">
                        {trends.sleep.percentage.toFixed(0)}%
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {trends.wellness && (
                <Card>
                  <CardContent className="p-3">
                    <p className="text-xs text-muted-foreground">Bem-estar</p>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-lg">
                        {trends.wellness.direction === 'up'
                          ? '📈'
                          : trends.wellness.direction === 'down'
                            ? '📉'
                            : '➡️'}
                      </span>
                      <span className="font-medium">
                        {trends.wellness.percentage.toFixed(0)}%
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Estado vazio */}
        {!report && !patterns && !patternsLoading && (
          <Card>
            <CardContent className="py-8 text-center">
              <div className="text-4xl mb-2">📊</div>
              <p className="text-muted-foreground mb-4">
                Gere um relatório para ver sua análise completa
              </p>
              <Button onClick={handleGenerateReport} disabled={generating}>
                <Sparkles className="w-4 h-4 mr-2" />
                Gerar Análise
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Loading */}
        {(patternsLoading || reportLoading) && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}

        {/* Erro */}
        {error && (
          <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
            <CardContent className="py-4 text-center">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
