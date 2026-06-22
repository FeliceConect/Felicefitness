'use client'

import { useState, useEffect, Fragment } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Sparkles,
  Check,
  Loader2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Pencil,
  Plus,
  X
} from 'lucide-react'
import { useProfessional } from '@/hooks/use-professional'
import { formatFoodAmount } from '@/lib/nutrition/meal-foods'

interface Client {
  id: string
  nome: string
  email: string
  avatar_url?: string
}

interface PreviewFood {
  name: string
  quantity?: number | null
  unit?: string | null
  group?: string | null
  choice?: boolean
  calories?: number
  protein?: number
  carbs?: number
  fat?: number
}

interface MealOption {
  option: string
  name: string
  foods: PreviewFood[]
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
  const [editingFood, setEditingFood] = useState<{ mealIndex: number; optIndex: number; foodIndex: number; isNew: boolean } | null>(null)

  // --- Edição da prévia (antes de salvar) ---
  const clonePlan = (p: ParsedMealPlan): ParsedMealPlan => JSON.parse(JSON.stringify(p))

  function setPlanName(name: string) {
    setParsedPlan(prev => (prev ? { ...prev, name } : prev))
  }

  function setTarget(key: 'calories' | 'protein' | 'carbs' | 'fat', value: number) {
    setParsedPlan(prev => (prev ? { ...prev, daily_targets: { ...prev.daily_targets, [key]: value } } : prev))
  }

  function saveFood(mealIndex: number, optIndex: number, foodIndex: number, isNew: boolean, food: PreviewFood) {
    setParsedPlan(prev => {
      if (!prev) return prev
      const next = clonePlan(prev)
      const foods = next.meals[mealIndex].options[optIndex].foods
      if (isNew) foods.push(food)
      else foods[foodIndex] = food
      return next
    })
    setEditingFood(null)
  }

  function removeFoodFromPreview(mealIndex: number, optIndex: number, foodIndex: number) {
    setParsedPlan(prev => {
      if (!prev) return prev
      const next = clonePlan(prev)
      next.meals[mealIndex].options[optIndex].foods.splice(foodIndex, 1)
      return next
    })
  }

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
            <input
              value={parsedPlan.name}
              onChange={(e) => setPlanName(e.target.value)}
              className="text-lg font-semibold text-foreground mb-4 w-full bg-transparent border-b border-transparent hover:border-border focus:border-dourado focus:outline-none transition-colors"
              placeholder="Nome do plano"
            />

            <div className="grid grid-cols-4 gap-3 mb-4">
              {([
                { key: 'calories', label: 'kcal', color: 'text-foreground' },
                { key: 'protein', label: 'proteína', color: 'text-red-600' },
                { key: 'carbs', label: 'carbs', color: 'text-amber-600' },
                { key: 'fat', label: 'gordura', color: 'text-blue-600' },
              ] as const).map((t) => (
                <div key={t.key} className="bg-background-elevated rounded-lg p-3 text-center">
                  <input
                    type="number"
                    min="0"
                    value={parsedPlan.daily_targets[t.key] ?? ''}
                    onChange={(e) => setTarget(t.key, e.target.value === '' ? 0 : Math.max(0, Math.round(Number(e.target.value))))}
                    className={`text-xl font-bold ${t.color} w-full text-center bg-transparent focus:outline-none`}
                  />
                  <p className="text-xs text-foreground-muted">{t.label}</p>
                </div>
              ))}
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
                        <div className="space-y-1.5">
                          {option.foods.map((food, fi) => {
                            // Cabeçalho do grupo de escolha quando começa um novo group
                            const prevGroup = fi > 0 ? option.foods[fi - 1].group : undefined
                            const showGroupHeader = !!food.group && food.group !== prevGroup
                            const groupCount = food.group ? option.foods.filter(f => f.group === food.group).length : 0
                            return (
                              <Fragment key={fi}>
                                {showGroupHeader && (
                                  <p className="text-[11px] font-semibold text-dourado uppercase tracking-wide pt-1">
                                    {food.group}{groupCount > 1 ? ' · escolha 1' : ''}
                                  </p>
                                )}
                                <div className="flex items-center justify-between gap-2 text-xs bg-white rounded px-2 py-1.5 border border-border">
                                  <span className="text-foreground-secondary">
                                    {food.group ? '• ' : ''}{food.name} <span className="text-foreground-muted">({formatFoodAmount(food)})</span>
                                  </span>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    <button
                                      onClick={() => setEditingFood({ mealIndex: index, optIndex, foodIndex: fi, isNew: false })}
                                      className="text-foreground-muted hover:text-dourado"
                                      title="Editar"
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => removeFoodFromPreview(index, optIndex, fi)}
                                      className="text-red-500 hover:text-red-600"
                                      title="Remover"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </Fragment>
                            )
                          })}
                          <button
                            onClick={() => setEditingFood({ mealIndex: index, optIndex, foodIndex: option.foods.length, isNew: true })}
                            className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 pt-1"
                          >
                            <Plus className="w-3.5 h-3.5" /> Adicionar alimento
                          </button>
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
            Você pode <strong>editar aqui mesmo</strong> (nome, metas, alimentos e quantidades) antes de salvar. Ao salvar, o plano abre no editor para ajustes finais.
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

      {/* Modal de edição de alimento na prévia */}
      {editingFood && parsedPlan && (
        <PreviewFoodModal
          food={editingFood.isNew
            ? { name: '', quantity: null, unit: '', group: null }
            : parsedPlan.meals[editingFood.mealIndex].options[editingFood.optIndex].foods[editingFood.foodIndex]}
          onClose={() => setEditingFood(null)}
          onSave={(f) => saveFood(editingFood.mealIndex, editingFood.optIndex, editingFood.foodIndex, editingFood.isNew, f)}
        />
      )}
    </div>
  )
}

// Modal para editar/adicionar um alimento na prévia da importação
function PreviewFoodModal({
  food,
  onClose,
  onSave,
}: {
  food: PreviewFood
  onClose: () => void
  onSave: (food: PreviewFood) => void
}) {
  const [form, setForm] = useState({
    name: food.name || '',
    quantity: food.quantity != null ? String(food.quantity) : '',
    unit: food.unit || '',
    group: food.group || '',
    calories: food.calories != null ? String(food.calories) : '',
    protein: food.protein != null ? String(food.protein) : '',
    carbs: food.carbs != null ? String(food.carbs) : '',
    fat: food.fat != null ? String(food.fat) : '',
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    const num = (v: string) => (v.trim() === '' ? undefined : parseFloat(v))
    onSave({
      name: form.name.trim(),
      quantity: form.quantity.trim() === '' ? null : parseFloat(form.quantity),
      unit: form.unit.trim() || null,
      group: form.group.trim() || null,
      calories: num(form.calories) ?? 0,
      protein: num(form.protein) ?? 0,
      carbs: num(form.carbs) ?? 0,
      fat: num(form.fat) ?? 0,
    })
  }

  const inputClass = 'w-full px-3 py-2 bg-white border border-border rounded-lg text-foreground placeholder-foreground-muted focus:outline-none focus:border-dourado'

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">{food.name ? 'Editar Alimento' : 'Adicionar Alimento'}</h3>
          <button onClick={onClose} className="p-1 hover:bg-background-elevated rounded">
            <X className="w-5 h-5 text-foreground-muted" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Nome *</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Quantidade</label>
              <input type="number" step="any" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} placeholder="(vazio = à vontade)" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Medida</label>
              <input type="text" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="g, ml, colher de sopa..." className={inputClass} />
            </div>
          </div>

          <div>
            <label className="block text-xs text-foreground-muted mb-1">
              Grupo de escolha (opcional — ex.: &quot;Proteína&quot;, &quot;Carboidrato&quot;)
            </label>
            <input type="text" value={form.group} onChange={(e) => setForm({ ...form, group: e.target.value })} placeholder="deixe vazio para alimento fixo" className={inputClass} />
            <p className="text-[10px] text-foreground-muted mt-1">Alimentos com o mesmo grupo viram opções &quot;escolha 1&quot;.</p>
          </div>

          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-foreground-muted mb-1">Kcal</label>
              <input type="number" step="any" value={form.calories} onChange={(e) => setForm({ ...form, calories: e.target.value })} className={`${inputClass} text-sm`} />
            </div>
            <div>
              <label className="block text-xs text-foreground-muted mb-1">Prot.</label>
              <input type="number" step="any" value={form.protein} onChange={(e) => setForm({ ...form, protein: e.target.value })} className={`${inputClass} text-sm`} />
            </div>
            <div>
              <label className="block text-xs text-foreground-muted mb-1">Carb.</label>
              <input type="number" step="any" value={form.carbs} onChange={(e) => setForm({ ...form, carbs: e.target.value })} className={`${inputClass} text-sm`} />
            </div>
            <div>
              <label className="block text-xs text-foreground-muted mb-1">Gord.</label>
              <input type="number" step="any" value={form.fat} onChange={(e) => setForm({ ...form, fat: e.target.value })} className={`${inputClass} text-sm`} />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 bg-background-elevated text-foreground rounded-lg hover:bg-border transition-colors">
              Cancelar
            </button>
            <button type="submit" className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:opacity-90 transition-colors flex items-center justify-center gap-2">
              <Check className="w-4 h-4" />
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
