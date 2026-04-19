'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Utensils, Plus, Calendar, ExternalLink, Link2, X, FileText, Target } from 'lucide-react'
import { toast } from 'sonner'

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

interface TemplatePlan {
  id: string
  name: string
  description?: string | null
  goal?: string | null
  calories_target?: number | null
  created_at: string
}

interface TabPlanoAlimentarProps {
  patientId: string
}

const DAY_LABELS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
const GOAL_LABELS: Record<string, string> = {
  weight_loss: 'Emagrecimento',
  muscle_gain: 'Ganho de Massa',
  maintenance: 'Manutenção',
  health: 'Saúde',
  custom: 'Personalizado'
}

export function TabPlanoAlimentar({ patientId }: TabPlanoAlimentarProps) {
  const router = useRouter()
  const [plans, setPlans] = useState<MealPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [templates, setTemplates] = useState<TemplatePlan[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  const [cloningId, setCloningId] = useState<string | null>(null)

  async function loadPlans() {
    try {
      const r = await fetch(`/api/portal/meal-plans?clientId=${patientId}`)
      const data = await r.json()
      if (data.success) setPlans(data.plans || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPlans()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId])

  async function openTemplateModal() {
    setShowTemplateModal(true)
    if (templates.length > 0) return
    setLoadingTemplates(true)
    try {
      const r = await fetch('/api/portal/meal-plans?templateOnly=true')
      const data = await r.json()
      if (data.success) setTemplates(data.plans || [])
    } catch (err) {
      console.error(err)
      toast.error('Erro ao carregar templates')
    } finally {
      setLoadingTemplates(false)
    }
  }

  async function handleCloneTemplate(templateId: string) {
    setCloningId(templateId)
    try {
      const r = await fetch(`/api/portal/meal-plans/${templateId}/clone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: patientId })
      })
      const data = await r.json()
      if (data.success && data.planId) {
        toast.success('Plano vinculado ao paciente!')
        setShowTemplateModal(false)
        router.push(`/portal/nutrition/${data.planId}`)
      } else {
        toast.error(data.error || 'Erro ao vincular template')
      }
    } catch (err) {
      console.error(err)
      toast.error('Erro ao vincular template')
    } finally {
      setCloningId(null)
    }
  }

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
      <div className="flex justify-end gap-2">
        <button
          onClick={openTemplateModal}
          className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-background-elevated text-foreground rounded-lg text-sm font-medium transition-colors border border-border"
        >
          <Link2 className="w-4 h-4" />
          Vincular Template
        </button>
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
          <p className="text-foreground-secondary mb-4">Nenhum plano alimentar ativo</p>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <button
              onClick={openTemplateModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-background-elevated text-foreground rounded-lg text-sm font-medium transition-colors border border-border"
            >
              <Link2 className="w-4 h-4" />
              Vincular Template
            </button>
            <Link
              href={`/portal/nutrition?clientId=${patientId}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-dourado hover:bg-dourado/90 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Criar Plano
            </Link>
          </div>
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

      {/* Template Selection Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-lg w-full my-8 shadow-xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-border flex-shrink-0">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Vincular Template</h3>
                <p className="text-xs text-foreground-muted">Escolha um template para clonar e atribuir a este paciente</p>
              </div>
              <button
                onClick={() => setShowTemplateModal(false)}
                className="p-1 hover:bg-background-elevated rounded"
              >
                <X className="w-5 h-5 text-foreground-muted" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1">
              {loadingTemplates ? (
                <div className="space-y-2">
                  <div className="bg-background-elevated rounded-lg h-16 animate-pulse" />
                  <div className="bg-background-elevated rounded-lg h-16 animate-pulse" />
                </div>
              ) : templates.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-10 h-10 text-foreground-muted mx-auto mb-2" />
                  <p className="text-foreground-secondary text-sm mb-1">Nenhum template disponível</p>
                  <p className="text-xs text-foreground-muted">
                    Crie um plano e marque como template para reutilizar em outros pacientes.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {templates.map((tpl) => (
                    <button
                      key={tpl.id}
                      onClick={() => handleCloneTemplate(tpl.id)}
                      disabled={cloningId !== null}
                      className="w-full text-left p-4 rounded-lg border border-border hover:border-dourado/50 hover:bg-background-elevated transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-foreground font-medium truncate">{tpl.name}</p>
                          <div className="flex items-center gap-3 text-xs text-foreground-muted mt-1">
                            {tpl.goal && (
                              <span className="flex items-center gap-1">
                                <Target className="w-3 h-3" />
                                {GOAL_LABELS[tpl.goal] || tpl.goal}
                              </span>
                            )}
                            {tpl.calories_target && (
                              <span>{tpl.calories_target} kcal</span>
                            )}
                          </div>
                          {tpl.description && (
                            <p className="text-xs text-foreground-secondary mt-1 truncate">{tpl.description}</p>
                          )}
                        </div>
                        {cloningId === tpl.id ? (
                          <div className="w-5 h-5 border-2 border-dourado/30 border-t-dourado rounded-full animate-spin flex-shrink-0" />
                        ) : (
                          <Link2 className="w-4 h-4 text-dourado flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-border flex-shrink-0">
              <button
                onClick={() => setShowTemplateModal(false)}
                className="w-full px-4 py-2 bg-background-elevated text-foreground rounded-lg hover:bg-border transition-colors border border-border"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
