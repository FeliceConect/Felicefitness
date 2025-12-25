'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Minus, Target, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PredictionCardProps {
  title: string
  icon: string
  current: number
  target: number
  unit: string
  predictedDate?: Date
  confidence?: number
  trend?: 'up' | 'down' | 'stable'
  description?: string
}

export function PredictionCard({
  title,
  icon,
  current,
  target,
  unit,
  predictedDate,
  confidence,
  trend,
  description,
}: PredictionCardProps) {
  const progress = target > 0 ? Math.min(100, (current / target) * 100) : 0
  const isAchieved = current >= target

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <span>{icon}</span>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Valores atuais */}
        <div className="flex items-baseline justify-between">
          <div>
            <span className="text-2xl font-bold">{current.toFixed(1)}</span>
            <span className="text-sm text-muted-foreground ml-1">{unit}</span>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1">
              <Target className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {target.toFixed(1)} {unit}
              </span>
            </div>
            {trend && (
              <div className="flex items-center justify-end gap-1 mt-1">
                {trend === 'up' && (
                  <TrendingUp className="w-3 h-3 text-green-500" />
                )}
                {trend === 'down' && (
                  <TrendingDown className="w-3 h-3 text-red-500" />
                )}
                {trend === 'stable' && (
                  <Minus className="w-3 h-3 text-yellow-500" />
                )}
                <span
                  className={cn(
                    'text-xs',
                    trend === 'up' && 'text-green-500',
                    trend === 'down' && 'text-red-500',
                    trend === 'stable' && 'text-yellow-500'
                  )}
                >
                  {trend === 'up' ? 'Subindo' : trend === 'down' ? 'Descendo' : 'Estável'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Barra de progresso */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progresso</span>
            <span>{progress.toFixed(0)}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                isAchieved ? 'bg-green-500' : 'bg-primary'
              )}
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </div>
        </div>

        {/* Previsão */}
        {predictedDate && !isAchieved && (
          <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Previsão</p>
              <p className="text-sm font-medium">{formatDate(predictedDate)}</p>
            </div>
            {confidence !== undefined && (
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Confiança</p>
                <p className="text-sm font-medium">{(confidence * 100).toFixed(0)}%</p>
              </div>
            )}
          </div>
        )}

        {/* Estado atingido */}
        {isAchieved && (
          <div className="flex items-center gap-2 p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <span className="text-lg">🎉</span>
            <p className="text-sm font-medium text-green-700 dark:text-green-400">
              Meta atingida!
            </p>
          </div>
        )}

        {/* Descrição */}
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  )
}

interface SkiReadinessCardProps {
  percentage: number
  daysRemaining: number
  components: {
    legStrength: number
    core: number
    endurance: number
    bodyComposition: number
  }
  recommendations: string[]
}

export function SkiReadinessCard({
  percentage,
  daysRemaining,
  components,
  recommendations,
}: SkiReadinessCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <span>🎿</span>
          Preparação para Esqui
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Círculo de progresso */}
        <div className="flex justify-center">
          <div className="relative w-24 h-24">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="40"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-muted"
              />
              <circle
                cx="48"
                cy="48"
                r="40"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeDasharray={`${percentage * 2.51} 251`}
                strokeLinecap="round"
                className="text-primary"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold">{percentage}%</span>
              <span className="text-xs text-muted-foreground">Preparado</span>
            </div>
          </div>
        </div>

        {/* Dias restantes */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            <Calendar className="w-4 h-4 inline mr-1" />
            {daysRemaining} dias restantes
          </p>
        </div>

        {/* Componentes */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Componentes</p>
          <div className="space-y-2">
            <ComponentBar label="Força Pernas" value={components.legStrength} />
            <ComponentBar label="Core" value={components.core} />
            <ComponentBar label="Resistência" value={components.endurance} />
            <ComponentBar label="Composição" value={components.bodyComposition} />
          </div>
        </div>

        {/* Recomendações */}
        {recommendations.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Recomendações</p>
            <ul className="text-xs space-y-1">
              {recommendations.slice(0, 3).map((rec, i) => (
                <li key={i} className="flex items-start gap-1">
                  <span className="text-primary">•</span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ComponentBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all',
            value >= 80 ? 'bg-green-500' : value >= 60 ? 'bg-yellow-500' : 'bg-red-500'
          )}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}
