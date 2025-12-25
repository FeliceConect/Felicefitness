'use client'

import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Check, X } from 'lucide-react'
import type { WidgetSize, DailyProgressData } from '@/types/widgets'

interface WidgetDailyProgressProps {
  size: WidgetSize
  data: DailyProgressData
  onClick?: () => void
}

export function WidgetDailyProgress({ size, data, onClick }: WidgetDailyProgressProps) {
  const { score, checklist, streak } = data

  const getScoreColor = () => {
    if (score >= 80) return 'text-green-400'
    if (score >= 60) return 'text-yellow-400'
    if (score >= 40) return 'text-orange-400'
    return 'text-red-400'
  }

  const getStrokeColor = () => {
    if (score >= 80) return 'stroke-green-500'
    if (score >= 60) return 'stroke-yellow-500'
    if (score >= 40) return 'stroke-orange-500'
    return 'stroke-red-500'
  }

  const circumference = 2 * Math.PI * 45
  const strokeDashoffset = circumference - (score / 100) * circumference

  const checklistItems = [
    { key: 'workout', label: 'Treino', icon: '🏋️' },
    { key: 'protein', label: 'Proteina', icon: '🥩' },
    { key: 'water', label: 'Agua', icon: '💧' },
    { key: 'revolade', label: 'Revolade', icon: '💊' },
    { key: 'sleep', label: 'Sono', icon: '😴' },
    { key: 'calories', label: 'Calorias', icon: '🔥' },
  ]

  if (size === 'small') {
    return (
      <Card
        className={cn(
          'relative overflow-hidden bg-card/50 backdrop-blur border-border/50 p-3 cursor-pointer transition-transform hover:scale-[1.02]',
          onClick && 'active:scale-[0.98]'
        )}
        onClick={onClick}
      >
        <div className="flex items-center justify-center">
          <div className="relative w-16 h-16">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-muted/20"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                strokeWidth="8"
                strokeLinecap="round"
                className={cn('transition-all duration-1000', getStrokeColor())}
                style={{
                  strokeDasharray: circumference,
                  strokeDashoffset,
                }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={cn('text-lg font-bold', getScoreColor())}>{score}%</span>
            </div>
          </div>
        </div>
      </Card>
    )
  }

  if (size === 'medium') {
    return (
      <Card
        className={cn(
          'relative overflow-hidden bg-card/50 backdrop-blur border-border/50 p-4 cursor-pointer transition-transform hover:scale-[1.02]',
          onClick && 'active:scale-[0.98]'
        )}
        onClick={onClick}
      >
        <div className="flex items-center gap-4">
          <div className="relative w-20 h-20 flex-shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-muted/20"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                strokeWidth="8"
                strokeLinecap="round"
                className={cn('transition-all duration-1000', getStrokeColor())}
                style={{
                  strokeDasharray: circumference,
                  strokeDashoffset,
                }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={cn('text-xl font-bold', getScoreColor())}>{score}%</span>
            </div>
          </div>

          <div className="flex-1 space-y-1">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              Progresso do Dia
            </p>
            <div className="grid grid-cols-2 gap-1">
              {checklistItems.slice(0, 4).map((item) => (
                <div
                  key={item.key}
                  className={cn(
                    'flex items-center gap-1 text-xs',
                    checklist[item.key as keyof typeof checklist]
                      ? 'text-green-400'
                      : 'text-muted-foreground'
                  )}
                >
                  {checklist[item.key as keyof typeof checklist] ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    <X className="w-3 h-3 opacity-50" />
                  )}
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    )
  }

  // Large size
  return (
    <Card
      className={cn(
        'relative overflow-hidden bg-card/50 backdrop-blur border-border/50 p-5 cursor-pointer transition-transform hover:scale-[1.02]',
        onClick && 'active:scale-[0.98]'
      )}
      onClick={onClick}
    >
      <div className="flex flex-col items-center gap-4">
        <p className="text-sm text-muted-foreground font-medium uppercase tracking-wide">
          Progresso do Dia
        </p>

        <div className="relative w-28 h-28">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-muted/20"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              strokeWidth="8"
              strokeLinecap="round"
              className={cn('transition-all duration-1000', getStrokeColor())}
              style={{
                strokeDasharray: circumference,
                strokeDashoffset,
              }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn('text-3xl font-bold', getScoreColor())}>{score}%</span>
            {streak > 0 && (
              <span className="text-xs text-orange-400 flex items-center gap-1">
                <span>🔥</span> {streak} dias
              </span>
            )}
          </div>
        </div>

        <div className="w-full grid grid-cols-3 gap-2">
          {checklistItems.map((item) => (
            <div
              key={item.key}
              className={cn(
                'flex flex-col items-center gap-1 p-2 rounded-lg transition-colors',
                checklist[item.key as keyof typeof checklist]
                  ? 'bg-green-500/10 text-green-400'
                  : 'bg-muted/10 text-muted-foreground'
              )}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="text-xs">{item.label}</span>
              {checklist[item.key as keyof typeof checklist] ? (
                <Check className="w-3 h-3" />
              ) : (
                <X className="w-3 h-3 opacity-50" />
              )}
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}
