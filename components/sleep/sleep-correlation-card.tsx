'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { POSITIVE_FACTORS, NEGATIVE_FACTORS, type FactorImpact } from '@/types/sleep'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface SleepCorrelationCardProps {
  factorImpacts: FactorImpact[]
  className?: string
}

export function SleepCorrelationCard({ factorImpacts, className }: SleepCorrelationCardProps) {
  const positiveImpacts = factorImpacts
    .filter(f => f.impact > 5)
    .sort((a, b) => b.impact - a.impact)
    .slice(0, 5)

  const negativeImpacts = factorImpacts
    .filter(f => f.impact < -5)
    .sort((a, b) => a.impact - b.impact)
    .slice(0, 5)

  const getFactorLabel = (factorId: string): { label: string; icon: string } => {
    const positive = POSITIVE_FACTORS.find(f => f.id === factorId)
    if (positive) return { label: positive.label, icon: positive.icon }

    const negative = NEGATIVE_FACTORS.find(f => f.id === factorId)
    if (negative) return { label: negative.label, icon: negative.icon }

    return { label: factorId, icon: '❓' }
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Positive Factors */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-500" />
            Fatores Positivos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {positiveImpacts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Continue registrando para ver correlações
            </p>
          ) : (
            <div className="space-y-3">
              {positiveImpacts.map((impact, index) => {
                const { label, icon } = getFactorLabel(impact.factor)
                return (
                  <div key={impact.factor} className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground w-4">
                      {index + 1}.
                    </span>
                    <span className="text-lg">{icon}</span>
                    <span className="flex-1 text-sm">{label}</span>
                    <span className="text-sm font-medium text-green-500">
                      +{impact.impact}%
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Negative Factors */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-red-500" />
            Fatores Negativos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {negativeImpacts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Continue registrando para ver correlações
            </p>
          ) : (
            <div className="space-y-3">
              {negativeImpacts.map((impact, index) => {
                const { label, icon } = getFactorLabel(impact.factor)
                return (
                  <div key={impact.factor} className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground w-4">
                      {index + 1}.
                    </span>
                    <span className="text-lg">{icon}</span>
                    <span className="flex-1 text-sm">{label}</span>
                    <span className="text-sm font-medium text-red-500">
                      {impact.impact}%
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
