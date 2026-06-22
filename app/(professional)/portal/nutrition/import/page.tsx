'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Sparkles,
  Check,
  Loader2,
  ChevronDown,
  ChevronUp,
  AlertCircle
} from 'lucide-react'
import { useProfessional } from '@/hooks/use-professional'
import { groupPlanFoods, formatFoodAmount } from '@/lib/nutrition/meal-foods'

interface Client {
  id: string
  nome: string
  email: string
  avatar_url?: string
}

interface MealOption {
  option: string
  name: string
  foods: Array<{
    name: string
    quantity?: number | null
    unit?: string | null
    group?: string | null
    choice?: boolean
  }>
}

interface MealSlot {
  type: string
  name: string
  time: string
  target_protein?: number
  target_carbs?: number
  target_fat?: number
  is_optional: boolean
  is_training_day_only: boolean
  restrictions?: string[]
  notes?: string
  options: MealOption[]
}

interface ParsedMealPlan {
  name: string
  description?: string
  daily_targets: {
    calories: number
    protein: number
    carbs: number
    fat: number
  }
  special_rules: Array<{
    time?: string
    rule: string
  }>
  meals: MealSlot[]
}

export default function ImportMealPlanPage() {
  const router = useRouter()
  const { isNutritionist, loading: professionalLoading } = useProfessional()
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClient, setSelectedClient] = useState<string>('')
  const [planText, setPlanText] = useState('')
  const [importing, setImporting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [parsedPlan, setParsedPlan] = useState<ParsedMealPlan | null>(null)
  const [expandedMeals, setExpandedMeals] = useState<Set<number>>(new Set())
  const [saveAsTemplate, setSaveAsTemplate] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!professionalLoading && !isNutritionist) {
      router.push('/portal')
    }
  }, [isNutritionist, professionalLoading, router])

  useEffect(() => {
    fetchClients()
  }, [])

  async function fetchClients() {
    try {
      const response = await fetch('/api/professional/clients')
      const data = await response.json()
      if (data.success) {
        setClients(data.clients || [])
      }
    } catch (error) {
      console.error('Erro ao buscar clientes:', error)
    }
  }

  const handleAnalyze = async () => {
    if (!planText.trim()) {
      setError('Cole o texto do plano alimentar antes de analisar.')
      return
    }

    setImporting(true)
    setError(null)
    setParsedPlan(null)

    try {
      const response = await fetch('/api/meal-plan/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: planText })
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        const errorMsg = result.error || 'Erro ao importar'
        const details = result.details ? ` (${result.details})` : ''
        throw new Error(`${errorMsg}${details}`)
      }

      setParsedPlan(result.data)
      setExpandedMeals(new Set(result.data.meals.map((_: MealSlot, i: number) => i)))
    } catch (err) {
      console.error('Import error:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setImporting(false)
    }
  }

  const handleSave = async () => {
    if (!parsedPlan) return

    setSaving(true)
    try {
      const response = await fetch('/api/meal-plan/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: parsedPlan,
          clientId: selectedClient || null,
          assignToSelf: false
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao salvar')
      }

      // Abre o plano recém-criado no editor para ajustes finais
      if (result.plan_id) {
        router.push(`/portal/nutrition/${result.plan_id}`)
      } else {
        router.push('/portal/nutrition')
      }
    } catch (err) {
      console.error('Save error:', err)
      setError(err instanceof Error ? err.message : 'Erro ao salvar plano')
    } finally {
      setSaving(false)
    }
  }

  const toggleMeal = (index: number) => {
    const newExpanded = new Set(expandedMeals)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedMeals(newExpanded)
  }

  if (professionalLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-dourado" />
      </div>
    )
  }

  if (!isNutritionist) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/portal/nutrition"
          className="p-2 hover:bg-background-elevated rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-foreground-muted" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Importar Plano Alimentar</h1>
          <p className="text-foreground-secondary">Cole o texto do plano e a IA monta tudo</p>
        </div>
      </div>

      {/* Paste Section */}
      {!parsedPlan && (
        <div className="bg-white rounded-xl p-6 border border-border">
          <h2 className="text-lg font-semibold text-foreground mb-2">Colar plano alimentar</h2>
          <p className="text-sm text-foreground-secondary mb-4">
            Cole o plano exatamente como foi escrito (com horários, refeições, opções e quantidades).
            A IA organiza em refeições, opções e estima as calorias/macros. Você revisa antes de salvar.
          </p>

          <textarea
            value={planText}
            onChange={(e) => setPlanText(e.target.value)}
            disabled={importing}
            rows={14}
            placeholder={`07:00 – Café da manhã\nOpção 1\n1 fatia de pão de fermentação natural\n30 g de queijo meia-cura\n...`}
            className="w-full px-4 py-3 bg-background-input border border-border rounded-lg text-foreground placeholder-foreground-muted text-sm focus:outline-none focus:ring-2 focus:ring-dourado/50 font-mono resize-y"
          />

          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-foreground-muted">{planText.length} caracteres</span>
            <button
              onClick={handleAnalyze}
              disabled={importing || planText.trim().length < 20}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {importing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analisando com IA...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Analisar com IA
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600 whitespace-pre-line">{error}</p>
            </div>
          )}
        </div>
      )}

      {/* Preview Section */}
      {parsedPlan && (
        <>
          {/* Summary */}
          <div className="bg-white rounded-xl p-6 border border-border">
            <h2 className="text-lg font-semibold text-foreground mb-4">{parsedPlan.name}</h2>

            <div className="grid grid-cols-4 gap-3 mb-4">
              <div className="bg-background-elevated rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-foreground">{parsedPlan.daily_targets.calories}</p>
                <p className="text-xs text-foreground-muted">kcal</p>
              </div>
              <div className="bg-background-elevated rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-red-600">{parsedPlan.daily_targets.protein}g</p>
                <p className="text-xs text-foreground-muted">proteína</p>
              </div>
              <div className="bg-background-elevated rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-amber-600">{parsedPlan.daily_targets.carbs}g</p>
                <p className="text-xs text-foreground-muted">carbs</p>
              </div>
              <div className="bg-background-elevated rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-blue-600">{parsedPlan.daily_targets.fat}g</p>
                <p className="text-xs text-foreground-muted">gordura</p>
              </div>
            </div>

            {parsedPlan.special_rules && parsedPlan.special_rules.length > 0 && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Regras especiais:</p>
                {parsedPlan.special_rules.map((rule, i) => (
                  <p key={i} className="text-xs text-foreground-secondary">
                    {rule.time && <span className="text-green-600">{rule.time}: </span>}
                    {rule.rule}
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* Meals */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              Refeições ({parsedPlan.meals.length})
            </h2>

            {parsedPlan.meals.map((meal, index) => (
              <div key={index} className="bg-white rounded-xl border border-border overflow-hidden">
                <button
                  onClick={() => toggleMeal(index)}
                  className="w-full p-4 text-left flex items-center justify-between hover:bg-background-elevated transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{meal.name}</span>
                      {meal.is_optional && (
                        <span className="text-xs bg-background-elevated px-2 py-0.5 rounded text-foreground-secondary">Opcional</span>
                      )}
                      {meal.is_training_day_only && (
                        <span className="text-xs bg-green-500/10 px-2 py-0.5 rounded text-green-600">Dia treino</span>
                      )}
                    </div>
                    <p className="text-sm text-foreground-secondary mt-1">
                      {meal.time} • {meal.options.length} opções
                    </p>
                  </div>
                  {expandedMeals.has(index) ? (
                    <ChevronUp className="h-5 w-5 text-foreground-muted" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-foreground-muted" />
                  )}
                </button>

                {expandedMeals.has(index) && (
                  <div className="px-4 pb-4 space-y-3">
                    {meal.options.map((option, optIndex) => (
                      <div key={optIndex} className="p-3 bg-background-elevated rounded-lg">
                        <p className="text-sm font-medium text-foreground mb-2">
                          {meal.options.length > 1 ? `Opção ${option.option} - ` : ''}{option.name}
                        </p>
                        <div className="space-y-2">
                          {groupPlanFoods(option.foods).map((block, bi) => (
                            block.group ? (
                              <div key={bi} className="rounded-md bg-dourado/5 border border-dourado/15 p-2">
                                <p className="text-[11px] font-semibold text-dourado uppercase tracking-wide mb-1">
                                  {block.group}{block.isChoice ? ' · escolha 1' : ''}
                                </p>
                                <ul className="space-y-0.5">
                                  {block.items.map((food, fi) => (
                                    <li key={fi} className="text-xs text-foreground-secondary flex items-start gap-1 pl-1">
                                      <span className="text-dourado">•</span>
                                      {food.name} <span className="text-foreground-muted">({formatFoodAmount(food)})</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ) : (
                              <div key={bi} className="text-xs text-foreground-secondary flex items-start gap-1">
                                <span className="text-green-600">•</span>
                                {block.items[0].name} <span className="text-foreground-muted">({formatFoodAmount(block.items[0])})</span>
                              </div>
                            )
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Client Selection */}
          <div className="bg-white rounded-xl p-6 border border-border">
            <h2 className="text-lg font-semibold text-foreground mb-4">Atribuir a Cliente</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-foreground-secondary mb-2">Selecionar cliente</label>
                <select
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-border rounded-lg text-foreground focus:outline-none focus:border-dourado"
                >
                  <option value="">Nenhum (salvar como template)</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.nome} ({client.email})
                    </option>
                  ))}
                </select>
              </div>

              {!selectedClient && (
                <label className="flex items-center gap-3 p-3 bg-background-elevated rounded-lg">
                  <input
                    type="checkbox"
                    checked={saveAsTemplate}
                    onChange={(e) => setSaveAsTemplate(e.target.checked)}
                    className="w-5 h-5 rounded border-border text-dourado focus:ring-dourado/50"
                  />
                  <div>
                    <p className="font-medium text-foreground">Salvar como template</p>
                    <p className="text-xs text-foreground-secondary">
                      Poderá ser reutilizado para outros clientes
                    </p>
                  </div>
                </label>
              )}
            </div>
          </div>

          {/* Actions */}
          <p className="text-xs text-foreground-secondary text-center">
            Ao salvar, o plano abre no editor — lá você pode <strong>editar tudo</strong> (quantidades, opções, alimentos e metas) antes de o paciente ver.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setParsedPlan(null)}
              disabled={saving}
              className="flex-1 py-3 bg-background-elevated text-foreground rounded-lg hover:bg-border transition-colors disabled:opacity-50 border border-border"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Check className="h-5 w-5" />
                  Salvar e editar
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
