'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  FileText,
  Camera,
  Check,
  Loader2,
  ChevronDown,
  ChevronUp,
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

// Email do superadmin
const SUPERADMIN_EMAIL = 'felicemed@gmail.com'

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

export default function ImportarPlanoPage() {
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [parsedPlan, setParsedPlan] = useState<ParsedMealPlan | null>(null)
  const [expandedMeals, setExpandedMeals] = useState<Set<number>>(new Set())
  const [assignToSelf, setAssignToSelf] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      // Check if superadmin
      if (user.email === SUPERADMIN_EMAIL) {
        setIsAuthorized(true)
      } else {
        // Check role in profile
        const { data: profile } = await supabase
          .from('fitness_profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        const profileData = profile as unknown as { role?: string } | null
        if (profileData?.role === 'super_admin') {
          setIsAuthorized(true)
        }
      }

      setLoading(false)
    }

    checkAuth()
  }, [router])

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
      toast.success('Plano analisado com sucesso!')

      // Expand all meals by default
      setExpandedMeals(new Set(result.data.meals.map((_: MealSlot, i: number) => i)))
    } catch (err) {
      console.error('Import error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      toast.error(errorMessage)
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
          assignToSelf
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao salvar')
      }

      toast.success('Plano alimentar salvo com sucesso!')
      router.push('/alimentacao')
    } catch (err) {
      console.error('Save error:', err)
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar plano')
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Acesso Restrito</h2>
            <p className="text-muted-foreground mb-4">
              Esta funcionalidade é exclusiva para superadmins.
            </p>
            <Button onClick={() => router.back()}>Voltar</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b">
        <div className="flex items-center gap-3 p-4">
          <button onClick={() => router.back()} className="p-2 -ml-2 hover:bg-muted rounded-lg">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="font-semibold">Importar Plano Alimentar</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Upload Section */}
        {!parsedPlan && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Upload do Plano</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Faça upload de um arquivo PDF ou imagem do plano alimentar.
                A IA irá extrair todas as informações automaticamente.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <label className={cn(
                  "flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-colors",
                  importing ? "opacity-50 cursor-not-allowed" : "hover:border-primary hover:bg-primary/5"
                )}>
                  <FileText className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-sm font-medium">PDF</span>
                  <span className="text-xs text-muted-foreground">Arrastar ou clicar</span>
                  <input
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={importing}
                  />
                </label>

                <label className={cn(
                  "flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-colors",
                  importing ? "opacity-50 cursor-not-allowed" : "hover:border-primary hover:bg-primary/5"
                )}>
                  <Camera className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-sm font-medium">Foto</span>
                  <span className="text-xs text-muted-foreground">Tirar ou escolher</span>
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
                <div className="flex items-center justify-center gap-2 py-4">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-sm">Analisando plano com IA...</span>
                </div>
              )}

              {error && (
                <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-sm">
                  {error}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Preview Section */}
        {parsedPlan && (
          <>
            {/* Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{parsedPlan.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="p-2 bg-muted rounded-lg">
                    <p className="text-lg font-bold">{parsedPlan.daily_targets.calories}</p>
                    <p className="text-xs text-muted-foreground">kcal</p>
                  </div>
                  <div className="p-2 bg-muted rounded-lg">
                    <p className="text-lg font-bold text-red-500">{parsedPlan.daily_targets.protein}g</p>
                    <p className="text-xs text-muted-foreground">proteína</p>
                  </div>
                  <div className="p-2 bg-muted rounded-lg">
                    <p className="text-lg font-bold text-amber-500">{parsedPlan.daily_targets.carbs}g</p>
                    <p className="text-xs text-muted-foreground">carbs</p>
                  </div>
                  <div className="p-2 bg-muted rounded-lg">
                    <p className="text-lg font-bold text-blue-500">{parsedPlan.daily_targets.fat}g</p>
                    <p className="text-xs text-muted-foreground">gordura</p>
                  </div>
                </div>

                {parsedPlan.special_rules && parsedPlan.special_rules.length > 0 && (
                  <div className="mt-4 space-y-1">
                    <p className="text-sm font-medium">Regras especiais:</p>
                    {parsedPlan.special_rules.map((rule, i) => (
                      <p key={i} className="text-xs text-muted-foreground">
                        {rule.time && <span className="font-medium">{rule.time}: </span>}
                        {rule.rule}
                      </p>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Meals */}
            <div className="space-y-3">
              <h2 className="font-semibold">Refeições ({parsedPlan.meals.length})</h2>

              {parsedPlan.meals.map((meal, index) => (
                <Card key={index}>
                  <button
                    onClick={() => toggleMeal(index)}
                    className="w-full text-left"
                  >
                    <CardHeader className="py-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-sm flex items-center gap-2">
                            {meal.name}
                            {meal.is_optional && (
                              <span className="text-xs bg-muted px-2 py-0.5 rounded">Opcional</span>
                            )}
                            {meal.is_training_day_only && (
                              <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">Dia treino</span>
                            )}
                          </CardTitle>
                          <p className="text-xs text-muted-foreground mt-1">
                            {meal.time} • {meal.options.length} opções
                          </p>
                        </div>
                        {expandedMeals.has(index) ? (
                          <ChevronUp className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </CardHeader>
                  </button>

                  {expandedMeals.has(index) && (
                    <CardContent className="pt-0 space-y-3">
                      {meal.options.map((option, optIndex) => (
                        <div key={optIndex} className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-sm font-medium mb-2">
                            Opção {option.option} - {option.name}
                          </p>
                          <ul className="space-y-1">
                            {option.foods.map((food, foodIndex) => (
                              <li key={foodIndex} className="text-xs text-muted-foreground flex items-start gap-1">
                                <span className="text-primary">•</span>
                                {food.quantity && `${food.quantity}${food.unit ? food.unit : ''} `}
                                {food.name}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}

                      {meal.restrictions && meal.restrictions.length > 0 && (
                        <p className="text-xs text-amber-500">
                          Restrições: {meal.restrictions.join(', ')}
                        </p>
                      )}
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>

            {/* Options */}
            <Card>
              <CardContent className="p-4">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={assignToSelf}
                    onChange={(e) => setAssignToSelf(e.target.checked)}
                    className="w-5 h-5 rounded border-border"
                  />
                  <div>
                    <p className="font-medium">Atribuir para mim</p>
                    <p className="text-xs text-muted-foreground">
                      O plano será associado à sua conta
                    </p>
                  </div>
                </label>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setParsedPlan(null)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Salvar Plano
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
