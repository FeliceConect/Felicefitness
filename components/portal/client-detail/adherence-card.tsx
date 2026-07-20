'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, TrendingUp, Loader2 } from 'lucide-react'
import { getMealTypeLabel } from '@/lib/nutrition/types'
import { cn } from '@/lib/utils'

interface ConsumedFood {
  name: string
  quantity: number
  unit: string
  calories: number
}

interface MealStatus {
  plan_meal_id: string
  meal_type: string
  meal_name: string | null
  scheduled_time: string | null
  status: 'seguiu' | 'substituiu' | 'pulou' | 'nao_registrado'
  consumed: { calories: number; notes?: string | null; foods: ConsumedFood[] } | null
}

interface AdherenceDay {
  date: string
  day_of_week: number
  planned: number
  completed: number
  pct: number
  meals: MealStatus[]
}

interface AdherenceData {
  plan: { id: string; name: string } | null
  days: AdherenceDay[]
  summary: { avg_pct: number; seguiu: number; substituiu: number; pulou: number; nao_registrado: number } | null
}

const STATUS_CONFIG: Record<MealStatus['status'], { label: string; cls: string }> = {
  seguiu: { label: 'Seguiu', cls: 'bg-green-500/15 text-green-600' },
  substituiu: { label: 'Substituiu', cls: 'bg-dourado/15 text-dourado' },
  pulou: { label: 'Pulou', cls: 'bg-amber-500/15 text-amber-600' },
  nao_registrado: { label: 'Não registrou', cls: 'bg-gray-500/10 text-foreground-muted' },
}

const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

/** Aderência real ao plano nos últimos 7 dias — visão da nutricionista. */
export function AdherenceCard({ patientId }: { patientId: string }) {
  const [data, setData] = useState<AdherenceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedDay, setExpandedDay] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/portal/adherence?clientId=${patientId}&days=7`)
      .then(r => r.json())
      .then(res => {
        if (!cancelled && res.success) setData(res)
      })
      .catch(() => { /* silencioso */ })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [patientId])

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-border p-6 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-dourado animate-spin" />
      </div>
    )
  }

  if (!data?.plan || !data.summary || data.days.length === 0) {
    return null
  }

  const { summary } = data

  return (
    <div className="bg-white rounded-xl border border-border p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-dourado" />
          Aderência ao plano (7 dias)
        </h3>
        <span className={cn(
          'text-lg font-bold',
          summary.avg_pct >= 80 ? 'text-green-600' : summary.avg_pct >= 50 ? 'text-dourado' : 'text-red-500'
        )}>
          {summary.avg_pct}%
        </span>
      </div>

      {/* Resumo por status */}
      <div className="grid grid-cols-4 gap-2 text-center">
        {(['seguiu', 'substituiu', 'pulou', 'nao_registrado'] as const).map(key => (
          <div key={key} className="bg-background rounded-lg p-2">
            <p className="text-lg font-bold text-foreground">{summary[key]}</p>
            <p className="text-[10px] text-foreground-secondary leading-tight">{STATUS_CONFIG[key].label}</p>
          </div>
        ))}
      </div>

      {/* Dias */}
      <div className="space-y-2">
        {data.days.map(day => (
          <div key={day.date} className="border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => setExpandedDay(expandedDay === day.date ? null : day.date)}
              className="w-full flex items-center justify-between px-3 py-2 hover:bg-background transition-colors"
            >
              <span className="text-sm text-foreground">
                {DAY_LABELS[day.day_of_week]} {day.date.slice(8, 10)}/{day.date.slice(5, 7)}
              </span>
              <span className="flex items-center gap-2">
                <span className={cn(
                  'text-sm font-medium',
                  day.pct >= 80 ? 'text-green-600' : day.pct >= 50 ? 'text-dourado' : 'text-red-500'
                )}>
                  {day.completed}/{day.planned}
                </span>
                {expandedDay === day.date
                  ? <ChevronUp className="w-4 h-4 text-foreground-muted" />
                  : <ChevronDown className="w-4 h-4 text-foreground-muted" />}
              </span>
            </button>
            {expandedDay === day.date && (
              <div className="px-3 pb-3 space-y-2">
                {day.meals.map(meal => (
                  <div key={meal.plan_meal_id} className="bg-background rounded-lg p-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm text-foreground truncate">
                        {meal.meal_name || getMealTypeLabel(meal.meal_type)}
                        {meal.scheduled_time && (
                          <span className="text-foreground-muted"> • {meal.scheduled_time.slice(0, 5)}</span>
                        )}
                      </span>
                      <span className={cn('px-2 py-0.5 rounded text-xs font-medium flex-shrink-0', STATUS_CONFIG[meal.status].cls)}>
                        {STATUS_CONFIG[meal.status].label}
                      </span>
                    </div>
                    {meal.status === 'substituiu' && meal.consumed && meal.consumed.foods.length > 0 && (
                      <p className="mt-1.5 text-xs text-foreground-secondary">
                        Comeu: {meal.consumed.foods.map(f => `${f.name} (${f.quantity}${f.unit})`).join(', ')}
                        {' '}— {Math.round(meal.consumed.calories)} kcal
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
