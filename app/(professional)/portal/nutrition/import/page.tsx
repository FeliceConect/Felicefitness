'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Upload,
  FileText,
  Camera,
  Check,
  Loader2,
  ChevronDown,
  ChevronUp,
  AlertCircle
} from 'lucide-react'
import { useProfessional } from '@/hooks/use-professional'

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
    quantity?: number
    unit?: string
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    setError(null)
    setParsedPlan(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/meal-plan/import', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (!response.ok) {
        const errorMsg = result.error || 'Erro ao importar'
        const details = result.details ? ` (${result.details})` : ''
        const hint = result.hint ? `\n${result.hint}` : ''
        throw new Error(`${errorMsg}${details}${hint}`)
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

      router.push('/portal/nutrition')
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
          <p className="text-foreground-secondary">Faça upload de PDF, imagem ou foto do plano</p>
        </div>
      </div>

      {/* Upload Section */}
      {!parsedPlan && (
        <div className="bg-white rounded-xl p-6 border border-border">
          <h2 className="text-lg font-semibold text-foreground mb-4">Upload do Plano</h2>
          <p className="text-sm text-foreground-secondary mb-6">
            A IA irá extrair automaticamente todas as informações do plano alimentar.
            Formatos suportados: PDF, JPG, PNG.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <label className={`flex flex-col items-center justify-center p-8 border-2 border-dashed border-border rounded-xl cursor-pointer transition-colors ${
              importing ? 'opacity-50 cursor-not-allowed' : 'hover:border-green-500 hover:bg-green-50'
            }`}>
              <FileText className="h-10 w-10 text-foreground-muted mb-3" />
              <span className="text-sm font-medium text-foreground">PDF</span>
              <span className="text-xs text-foreground-muted mt-1">Documento</span>
              <input
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={handleFileUpload}
                disabled={importing}
              />
            </label>

            <label className={`flex flex-col items-center justify-center p-8 border-2 border-dashed border-border rounded-xl cursor-pointer transition-colors ${
              importing ? 'opacity-50 cursor-not-allowed' : 'hover:border-green-500 hover:bg-green-50'
            }`}>
              <Upload className="h-10 w-10 text-foreground-muted mb-3" />
              <span className="text-sm font-medium text-foreground">Imagem</span>
              <span className="text-xs text-foreground-muted mt-1">JPG, PNG</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
                disabled={importing}
              />
            </label>

            <label className={`flex flex-col items-center justify-center p-8 border-2 border-dashed border-border rounded-xl cursor-pointer transition-colors ${
              importing ? 'opacity-50 cursor-not-allowed' : 'hover:border-green-500 hover:bg-green-50'
            }`}>
              <Camera className="h-10 w-10 text-foreground-muted mb-3" />
              <span className="text-sm font-medium text-foreground">Câmera</span>
              <span className="text-xs text-foreground-muted mt-1">Tirar foto</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileUpload}
                disabled={importing}
              />
            </label>
          </div>

          {importing && (
            <div className="flex items-center justify-center gap-3 mt-6 py-4">
              <Loader2 className="h-5 w-5 animate-spin text-green-500" />
              <span className="text-sm text-foreground-secondary">Analisando plano com IA...</span>
            </div>
          )}

          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
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
                          Opção {option.option} - {option.name}
                        </p>
                        <ul className="space-y-1">
                          {option.foods.map((food, foodIndex) => (
                            <li key={foodIndex} className="text-xs text-foreground-secondary flex items-start gap-1">
                              <span className="text-green-600">•</span>
                              {food.quantity && `${food.quantity}${food.unit ? food.unit : ''} `}
                              {food.name}
                            </li>
                          ))}
                        </ul>
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
                  Salvar Plano
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
