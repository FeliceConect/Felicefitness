'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, Share2, TrendingUp, TrendingDown, Minus, Calendar, Star } from 'lucide-react'
import type { AIReport } from '@/types/insights'
import { cn } from '@/lib/utils'

interface AIReportProps {
  report: AIReport
  onExport?: () => void
  onShare?: () => void
}

export function AIReportCard({ report, onExport, onShare }: AIReportProps) {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
    })
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-bold">
                Relatório {report.type === 'weekly' ? 'Semanal' : 'Mensal'}
              </h2>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDate(report.periodStart)} - {formatDate(report.periodEnd)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {onExport && (
                <Button variant="outline" size="icon" onClick={onExport}>
                  <Download className="w-4 h-4" />
                </Button>
              )}
              {onShare && (
                <Button variant="outline" size="icon" onClick={onShare}>
                  <Share2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Score */}
          <div className="mt-4 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-16 h-16 rounded-full bg-background flex items-center justify-center border-4 border-primary">
                <span className="text-xl font-bold">{report.score}</span>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Score geral</p>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={cn(
                        'w-4 h-4',
                        star <= Math.round(report.score / 20)
                          ? 'fill-yellow-500 text-yellow-500'
                          : 'text-muted'
                      )}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo Executivo */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <span>📋</span>
            Resumo Executivo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">{report.summary}</p>
        </CardContent>
      </Card>

      {/* Destaques Positivos */}
      {report.highlights.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <span>✅</span>
              Destaques Positivos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {report.highlights.map((highlight, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 text-sm"
                >
                  <span className="text-green-500">•</span>
                  {highlight}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Pontos de Atenção */}
      {report.warnings.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <span>⚠️</span>
              Pontos de Atenção
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {report.warnings.map((warning, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 text-sm"
                >
                  <span className="text-orange-500">•</span>
                  {warning}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Seções detalhadas */}
      {report.sections.map((section, index) => (
        <Card key={index}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <span>{section.icon}</span>
              {section.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">{section.content}</p>

            {section.metrics && section.metrics.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {section.metrics.map((metric, i) => (
                  <div key={i} className="p-2 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">{metric.label}</p>
                    <div className="flex items-center gap-1">
                      <p className="font-medium">{metric.value}</p>
                      {metric.trend && (
                        <span>
                          {metric.trend === 'up' && (
                            <TrendingUp className="w-3 h-3 text-green-500" />
                          )}
                          {metric.trend === 'down' && (
                            <TrendingDown className="w-3 h-3 text-red-500" />
                          )}
                          {metric.trend === 'stable' && (
                            <Minus className="w-3 h-3 text-yellow-500" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Recomendações */}
      {report.recommendations.length > 0 && (
        <Card className="border-primary/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <span>🎯</span>
              Recomendações para a Próxima Semana
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2">
              {report.recommendations.map((rec, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 text-sm"
                >
                  <span className="font-medium text-primary">{index + 1}.</span>
                  {rec}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

interface WeeklyDigestProps {
  report: AIReport
  compact?: boolean
}

export function WeeklyDigest({ report, compact = false }: WeeklyDigestProps) {
  if (compact) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xl font-bold">{report.score}</span>
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-sm">Resumo da Semana</h4>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {report.summary}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return <AIReportCard report={report} />
}
