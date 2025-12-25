'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { TrainingRecommendation as TrainingRec } from '@/types/sleep'
import { CheckCircle, AlertCircle, XCircle, Zap } from 'lucide-react'

interface TrainingRecommendationProps {
  recommendation: TrainingRec
  className?: string
}

export function TrainingRecommendation({ recommendation, className }: TrainingRecommendationProps) {
  const getIntensityIcon = () => {
    switch (recommendation.intensity) {
      case 'rest':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'light':
        return <AlertCircle className="h-5 w-5 text-orange-500" />
      case 'normal':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'hard':
        return <Zap className="h-5 w-5 text-yellow-500" />
    }
  }

  const getIntensityBg = () => {
    switch (recommendation.intensity) {
      case 'rest':
        return 'bg-red-500/10 border-red-500/20'
      case 'light':
        return 'bg-orange-500/10 border-orange-500/20'
      case 'normal':
        return 'bg-green-500/10 border-green-500/20'
      case 'hard':
        return 'bg-yellow-500/10 border-yellow-500/20'
    }
  }

  const getIntensityLabel = () => {
    switch (recommendation.intensity) {
      case 'rest':
        return 'Descanso'
      case 'light':
        return 'Treino Leve'
      case 'normal':
        return 'Treino Normal'
      case 'hard':
        return 'Treino Intenso'
    }
  }

  return (
    <Card className={cn(className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          📋 Recomendação de Treino
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main recommendation */}
        <div className={cn('p-4 rounded-xl border', getIntensityBg())}>
          <div className="flex items-center gap-3 mb-2">
            {getIntensityIcon()}
            <span className="font-semibold">{getIntensityLabel()}</span>
          </div>
          <p className="text-sm text-muted-foreground">{recommendation.message}</p>
        </div>

        {/* Notes */}
        {recommendation.notes.length > 0 && (
          <div className="space-y-2">
            {recommendation.notes.map((note, index) => (
              <div
                key={index}
                className="flex items-start gap-2 text-sm"
              >
                <span className="text-primary mt-0.5">
                  {recommendation.trainingReady ? '✅' : '⚠️'}
                </span>
                <span className="text-muted-foreground">{note}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
