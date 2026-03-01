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
  AlertCircle,
  Dumbbell,
  Clock,
  Target,
  Calendar,
  Zap
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

// Email do superadmin
const SUPERADMIN_EMAIL = 'felicemed@gmail.com'

interface Exercise {
  name: string
  sets: number
  reps: string
  rest_seconds?: number
  notes?: string
  is_warmup?: boolean
  muscle_group?: string
}

interface TrainingDay {
  day_of_week: number
  day_name: string
  name: string
  muscle_groups: string[]
  estimated_duration: number
  exercises: Exercise[]
  warmup_notes?: string
  cooldown_notes?: string
}

interface TrainingWeek {
  week_number: number
  name: string
  focus?: string
  days: TrainingDay[]
}

interface ParsedTrainingPlan {
  name: string
  description?: string
  goal?: string
  difficulty?: string
  duration_weeks: number
  days_per_week: number
  session_duration: number
  equipment_needed: string[]
  special_rules: Array<{
    rule: string
  }>
  prohibited_exercises?: Array<{
    exercise: string
    reason: string
    substitute?: string
  }>
  weeks: TrainingWeek[]
}

const GOAL_LABELS: Record<string, string> = {
  hypertrophy: 'Hipertrofia',
  strength: 'Forca',
  rehabilitation: 'Reabilitacao',
  endurance: 'Resistencia',
  weight_loss: 'Emagrecimento',
  functional: 'Funcional'
}

const DIFFICULTY_LABELS: Record<string, string> = {
  beginner: 'Iniciante',
  intermediate: 'Intermediario',
  advanced: 'Avancado',
  light: 'Leve'
}

const DAY_NAMES = ['Domingo', 'Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta', 'Sabado']

export default function ImportarTreinoPage() {
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [parsedPlan, setParsedPlan] = useState<ParsedTrainingPlan | null>(null)
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set())
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set())
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

      const response = await fetch('/api/training-plan/import', {
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
      toast.success('Plano de treinos analisado com sucesso!')

      // Expand first week by default
      if (result.data.weeks?.length > 0) {
        setExpandedWeeks(new Set([0]))
      }
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
      const response = await fetch('/api/training-plan/save', {
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

      toast.success('Plano de treinos salvo com sucesso!')
      router.push('/treino')
    } catch (err) {
      console.error('Save error:', err)
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar plano')
    } finally {
      setSaving(false)
    }
  }

  const toggleWeek = (index: number) => {
    const newExpanded = new Set(expandedWeeks)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedWeeks(newExpanded)
  }

  const toggleDay = (weekIndex: number, dayIndex: number) => {
    const key = `${weekIndex}-${dayIndex}`
    const newExpanded = new Set(expandedDays)
    if (newExpanded.has(key)) {
      newExpanded.delete(key)
    } else {
      newExpanded.add(key)
    }
    setExpandedDays(newExpanded)
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
              Esta funcionalidade e exclusiva para superadmins.
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
          <h1 className="font-semibold">Importar Plano de Treinos</h1>
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
                Faca upload de um arquivo PDF ou imagem do plano de treinos.
                A IA ira extrair todas as informacoes automaticamente.
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
                    accept=".pdf,.doc,.docx"
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
                <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-sm whitespace-pre-wrap">
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
                <CardTitle className="text-base flex items-center gap-2">
                  <Dumbbell className="h-5 w-5 text-primary" />
                  {parsedPlan.name}
                </CardTitle>
                {parsedPlan.description && (
                  <p className="text-sm text-muted-foreground">{parsedPlan.description}</p>
                )}
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
                  <div className="p-2 bg-muted rounded-lg">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Calendar className="h-4 w-4 text-primary" />
                    </div>
                    <p className="text-lg font-bold">{parsedPlan.duration_weeks}</p>
                    <p className="text-xs text-muted-foreground">semanas</p>
                  </div>
                  <div className="p-2 bg-muted rounded-lg">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Dumbbell className="h-4 w-4 text-dourado" />
                    </div>
                    <p className="text-lg font-bold">{parsedPlan.days_per_week}x</p>
                    <p className="text-xs text-muted-foreground">por semana</p>
                  </div>
                  <div className="p-2 bg-muted rounded-lg">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Clock className="h-4 w-4 text-amber-500" />
                    </div>
                    <p className="text-lg font-bold">{parsedPlan.session_duration}</p>
                    <p className="text-xs text-muted-foreground">min/sessao</p>
                  </div>
                  <div className="p-2 bg-muted rounded-lg">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Target className="h-4 w-4 text-green-500" />
                    </div>
                    <p className="text-lg font-bold">{GOAL_LABELS[parsedPlan.goal || ''] || parsedPlan.goal}</p>
                    <p className="text-xs text-muted-foreground">objetivo</p>
                  </div>
                </div>

                {/* Difficulty & Equipment */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {parsedPlan.difficulty && (
                    <span className="px-2 py-1 bg-dourado/10 text-dourado rounded-lg text-xs font-medium">
                      {DIFFICULTY_LABELS[parsedPlan.difficulty] || parsedPlan.difficulty}
                    </span>
                  )}
                  {parsedPlan.equipment_needed?.map((eq, i) => (
                    <span key={i} className="px-2 py-1 bg-muted text-muted-foreground rounded-lg text-xs">
                      {eq}
                    </span>
                  ))}
                </div>

                {/* Special Rules */}
                {parsedPlan.special_rules && parsedPlan.special_rules.length > 0 && (
                  <div className="mt-4 space-y-1">
                    <p className="text-sm font-medium">Regras especiais:</p>
                    {parsedPlan.special_rules.map((rule, i) => (
                      <p key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                        <span className="text-amber-500">!</span>
                        {rule.rule}
                      </p>
                    ))}
                  </div>
                )}

                {/* Prohibited Exercises */}
                {parsedPlan.prohibited_exercises && parsedPlan.prohibited_exercises.length > 0 && (
                  <div className="mt-4 p-3 bg-destructive/10 rounded-lg">
                    <p className="text-sm font-medium text-destructive mb-2">Exercicios Proibidos:</p>
                    {parsedPlan.prohibited_exercises.map((ex, i) => (
                      <div key={i} className="text-xs mb-1">
                        <span className="font-medium">{ex.exercise}</span>
                        <span className="text-muted-foreground"> - {ex.reason}</span>
                        {ex.substitute && (
                          <span className="text-green-500"> (usar: {ex.substitute})</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Weeks */}
            <div className="space-y-3">
              <h2 className="font-semibold flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Semanas ({parsedPlan.weeks?.length || 0})
              </h2>

              {parsedPlan.weeks?.map((week, weekIndex) => (
                <Card key={weekIndex}>
                  <button
                    onClick={() => toggleWeek(weekIndex)}
                    className="w-full text-left"
                  >
                    <CardHeader className="py-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-sm">
                            Semana {week.week_number}: {week.name}
                          </CardTitle>
                          {week.focus && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Foco: {week.focus}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {week.days?.length || 0} treinos
                          </span>
                          {expandedWeeks.has(weekIndex) ? (
                            <ChevronUp className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </button>

                  {expandedWeeks.has(weekIndex) && (
                    <CardContent className="pt-0 space-y-3">
                      {week.days?.map((day, dayIndex) => {
                        const dayKey = `${weekIndex}-${dayIndex}`
                        const isExpanded = expandedDays.has(dayKey)

                        return (
                          <div key={dayIndex} className="border rounded-lg overflow-hidden">
                            <button
                              onClick={() => toggleDay(weekIndex, dayIndex)}
                              className="w-full p-3 bg-muted/50 flex items-center justify-between hover:bg-muted transition-colors"
                            >
                              <div className="text-left">
                                <p className="font-medium text-sm">{day.name}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs text-muted-foreground">
                                    {DAY_NAMES[day.day_of_week]}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {day.estimated_duration}min
                                  </span>
                                  {day.muscle_groups?.length > 0 && (
                                    <span className="text-xs text-primary">
                                      {day.muscle_groups.join(', ')}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                                  {day.exercises?.length || 0} exercicios
                                </span>
                                {isExpanded ? (
                                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                )}
                              </div>
                            </button>

                            {isExpanded && (
                              <div className="p-3 space-y-2">
                                {day.warmup_notes && (
                                  <p className="text-xs text-amber-500 bg-amber-500/10 p-2 rounded">
                                    <Zap className="h-3 w-3 inline mr-1" />
                                    Aquecimento: {day.warmup_notes}
                                  </p>
                                )}

                                {day.exercises?.map((ex, exIndex) => (
                                  <div
                                    key={exIndex}
                                    className={cn(
                                      "flex items-center justify-between p-2 rounded-lg",
                                      ex.is_warmup ? "bg-amber-500/10" : "bg-muted/30"
                                    )}
                                  >
                                    <div>
                                      <p className="text-sm font-medium">
                                        {ex.is_warmup && <span className="text-amber-500">[Aquec] </span>}
                                        {ex.name}
                                      </p>
                                      {ex.notes && (
                                        <p className="text-xs text-muted-foreground">{ex.notes}</p>
                                      )}
                                    </div>
                                    <div className="text-right">
                                      <p className="text-sm font-bold text-primary">
                                        {ex.sets}x{ex.reps}
                                      </p>
                                      {ex.rest_seconds && (
                                        <p className="text-xs text-muted-foreground">
                                          {ex.rest_seconds}s descanso
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                ))}

                                {day.cooldown_notes && (
                                  <p className="text-xs text-green-500 bg-green-500/10 p-2 rounded">
                                    Alongamento: {day.cooldown_notes}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })}
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
                      O plano sera associado a sua conta
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
