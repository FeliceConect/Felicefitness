'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Utensils, Plus, Calendar, ExternalLink } from 'lucide-react'

interface MealPlan {
  id: string
  name: string
  status: string
  start_date: string | null
  end_date: string | null
  created_at: string
  days: Array<{
    day_of_week: number
    meals: Array<{
      name: string
      time: string | null
      foods: Array<{
        name: string
        quantity: string | null
        calories: number | null
        protein: number | null
      }>
    }>
  }>
}

interface TabPlanoAlimentarProps {
  patientId: string
}

const DAY_LABELS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

export function TabPlanoAlimentar({ patientId }: TabPlanoAlimentarProps) {
  const [plans, setPlans] = useState<MealPlan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/portal/meal-plans?clientId=${patientId}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) setPlans(data.plans || [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [patientId])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="bg-white border border-border rounded-xl p-6 h-40 animate-pulse" />
      </div>
    )
  }

  const activePlan = plans.find(p => p.status === 'active')
  const formatDate = (d: string) => new Date(d).toLocaleDateString('pt-BR')

  return (
    <div className="space-y-6">
      {/* Action */}
      <div className="flex justify-end">
        <Link
          href={`/portal/nutrition?clientId=${patientId}`}
          className="flex items-center gap-2 px-4 py-2 bg-dourado hover:bg-dourado/90 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Criar Plano
        </Link>
      </div>

      {activePlan ? (
        <div className="bg-white border border-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Utensils className="w-5 h-5 text-green-500" />
              <div>
                <h3 className="text-lg font-semibold text-foreground">{activePlan.name}</h3>
                <div className="flex items-center gap-2 text-xs text-foreground-muted">
                  <span className="px-2 py-0.5 bg-green-500/20 text-green-600 rounded-full font-medium">Ativo</span>
                  {activePlan.start_date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(activePlan.start_date)}
                      {activePlan.end_date && ` - ${formatDate(activePlan.end_date)}`}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <Link
              href={`/portal/nutrition/${activePlan.id}`}
              className="flex items-center gap-1 text-sm text-dourado hover:text-dourado/80 transition-colors"
            >
              Editar <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="p-4">
            {activePlan.days && activePlan.days.length > 0 ? (
              <div className="space-y-4">
                {activePlan.days.map((day, idx) => (
                  <div key={idx} className="bg-background-elevated rounded-lg p-3">
                    <h4 className="text-sm font-medium text-foreground mb-2">
                      {DAY_LABELS[day.day_of_week] || `Dia ${day.day_of_week}`}
                    </h4>
                    {day.meals?.map((meal, mIdx) => (
                      <div key={mIdx} className="ml-3 mb-2 last:mb-0">
                        <p className="text-sm text-foreground font-medium">
                          {meal.name}
                          {meal.time && <span className="text-foreground-muted ml-2 text-xs">{meal.time}</span>}
                        </p>
                        {meal.foods?.map((food, fIdx) => (
                          <p key={fIdx} className="text-xs text-foreground-secondary ml-2">
                            - {food.name}
                            {food.quantity && ` (${food.quantity})`}
                            {food.calories && ` | ${food.calories} kcal`}
                          </p>
                        ))}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-foreground-muted text-center py-4">Plano sem refeições configuradas</p>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white border border-border rounded-xl p-8 text-center">
          <Utensils className="w-10 h-10 text-foreground-muted mx-auto mb-2" />
          <p className="text-foreground-secondary mb-3">Nenhum plano alimentar ativo</p>
          <Link
            href={`/portal/nutrition?clientId=${patientId}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-dourado hover:bg-dourado/90 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Criar Plano
          </Link>
        </div>
      )}

      {/* Other Plans */}
      {plans.filter(p => p.status !== 'active').length > 0 && (
        <div className="bg-white border border-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold text-foreground">Planos Anteriores</h3>
          </div>
          <div className="divide-y divide-border">
            {plans.filter(p => p.status !== 'active').map(plan => (
              <Link
                key={plan.id}
                href={`/portal/nutrition/${plan.id}`}
                className="flex items-center justify-between p-4 hover:bg-background-elevated/50 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{plan.name}</p>
                  <p className="text-xs text-foreground-muted">Criado em {formatDate(plan.created_at)}</p>
                </div>
                <span className="text-xs text-foreground-muted bg-background-elevated px-2 py-1 rounded-full capitalize">
                  {plan.status}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
