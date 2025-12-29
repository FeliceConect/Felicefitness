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
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
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
          className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-400" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Importar Plano Alimentar</h1>
          <p className="text-slate-400">Faça upload de PDF, imagem ou foto do plano</p>
        </div>
      </div>

      {/* Upload Section */}
      {!parsedPlan && (
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h2 className="text-lg font-semibold text-white mb-4">Upload do Plano</h2>
          <p className="text-sm text-slate-400 mb-6">
            A IA irá extrair automaticamente todas as informações do plano alimentar.
            Formatos suportados: PDF, JPG, PNG.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <label className={`flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-600 rounded-xl cursor-pointer transition-colors ${
              importing ? 'opacity-50 cursor-not-allowed' : 'hover:border-green-500 hover:bg-green-500/5'
            }`}>
              <FileText className="h-10 w-10 text-slate-400 mb-3" />
              <span className="text-sm font-medium text-white">PDF</span>
              <span className="text-xs text-slate-400 mt-1">Documento</span>
              <input
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={handleFileUpload}
                disabled={importing}
              />
            </label>

            <label className={`flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-600 rounded-xl cursor-pointer transition-colors ${
              importing ? 'opacity-50 cursor-not-allowed' : 'hover:border-green-500 hover:bg-green-500/5'
            }`}>
              <Upload className="h-10 w-10 text-slate-400 mb-3" />
              <span className="text-sm font-medium text-white">Imagem</span>
              <span className="text-xs text-slate-400 mt-1">JPG, PNG</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
                disabled={importing}
              />
            </label>

            <label className={`flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-600 rounded-xl cursor-pointer transition-colors ${
              importing ? 'opacity-50 cursor-not-allowed' : 'hover:border-green-500 hover:bg-green-500/5'
            }`}>
              <Camera className="h-10 w-10 text-slate-400 mb-3" />
              <span className="text-sm font-medium text-white">Câmera</span>
              <span className="text-xs text-slate-400 mt-1">Tirar foto</span>
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
              <span className="text-sm text-slate-300">Analisando plano com IA...</span>
            </div>
          )}

          {error && (
            <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}
        </div>
      )}

      {/* Preview Section */}
      {parsedPlan && (
        <>
          {/* Summary */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <h2 className="text-lg font-semibold text-white mb-4">{parsedPlan.name}</h2>

            <div className="grid grid-cols-4 gap-3 mb-4">
              <div className="bg-slate-900 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-white">{parsedPlan.daily_targets.calories}</p>
                <p className="text-xs text-slate-400">kcal</p>
              </div>
              <div className="bg-slate-900 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-red-400">{parsedPlan.daily_targets.protein}g</p>
                <p className="text-xs text-slate-400">proteína</p>
              </div>
              <div className="bg-slate-900 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-amber-400">{parsedPlan.daily_targets.carbs}g</p>
                <p className="text-xs text-slate-400">carbs</p>
              </div>
              <div className="bg-slate-900 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-blue-400">{parsedPlan.daily_targets.fat}g</p>
                <p className="text-xs text-slate-400">gordura</p>
              </div>
            </div>

            {parsedPlan.special_rules && parsedPlan.special_rules.length > 0 && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-300">Regras especiais:</p>
                {parsedPlan.special_rules.map((rule, i) => (
                  <p key={i} className="text-xs text-slate-400">
                    {rule.time && <span className="text-green-400">{rule.time}: </span>}
                    {rule.rule}
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* Meals */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-white">
              Refeições ({parsedPlan.meals.length})
            </h2>

            {parsedPlan.meals.map((meal, index) => (
              <div key={index} className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                <button
                  onClick={() => toggleMeal(index)}
                  className="w-full p-4 text-left flex items-center justify-between hover:bg-slate-700/50 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">{meal.name}</span>
                      {meal.is_optional && (
                        <span className="text-xs bg-slate-700 px-2 py-0.5 rounded text-slate-300">Opcional</span>
                      )}
                      {meal.is_training_day_only && (
                        <span className="text-xs bg-green-500/20 px-2 py-0.5 rounded text-green-400">Dia treino</span>
                      )}
                    </div>
                    <p className="text-sm text-slate-400 mt-1">
                      {meal.time} • {meal.options.length} opções
                    </p>
                  </div>
                  {expandedMeals.has(index) ? (
                    <ChevronUp className="h-5 w-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-slate-400" />
                  )}
                </button>

                {expandedMeals.has(index) && (
                  <div className="px-4 pb-4 space-y-3">
                    {meal.options.map((option, optIndex) => (
                      <div key={optIndex} className="p-3 bg-slate-900 rounded-lg">
                        <p className="text-sm font-medium text-white mb-2">
                          Opção {option.option} - {option.name}
                        </p>
                        <ul className="space-y-1">
                          {option.foods.map((food, foodIndex) => (
                            <li key={foodIndex} className="text-xs text-slate-400 flex items-start gap-1">
                              <span className="text-green-400">•</span>
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
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <h2 className="text-lg font-semibold text-white mb-4">Atribuir a Cliente</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Selecionar cliente</label>
                <select
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-green-500"
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
                <label className="flex items-center gap-3 p-3 bg-slate-900 rounded-lg">
                  <input
                    type="checkbox"
                    checked={saveAsTemplate}
                    onChange={(e) => setSaveAsTemplate(e.target.checked)}
                    className="w-5 h-5 rounded border-slate-600"
                  />
                  <div>
                    <p className="font-medium text-white">Salvar como template</p>
                    <p className="text-xs text-slate-400">
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
              className="flex-1 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors disabled:opacity-50"
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
