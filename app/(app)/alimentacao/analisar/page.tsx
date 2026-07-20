"use client"

import { useState, useRef, useCallback, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Camera,
  Upload,
  Loader2,
  Check,
  RotateCcw,
  Save,
  Sparkles,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Pencil,
  Trash2,
  Plus,
  X as XIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { useDailyMeals } from '@/hooks/use-daily-meals'
import { cn } from '@/lib/utils'
import type { MealType, FoodCategory } from '@/lib/nutrition/types'
import { mealTypeLabels, mealTypeIcons } from '@/lib/nutrition/types'
import { normalizeMealTypePT } from '@/lib/nutrition/meal-type'
import { compressImageClient } from '@/lib/images/compress-client'

interface AnalyzedFood {
  nome: string
  quantidade_g: number
  calorias: number
  proteinas: number
  carboidratos: number
  gorduras: number
  categoria: string
  /** Vínculo com o banco de alimentos, quando a API conseguiu casar */
  food_id?: string
  db_nome?: string
}

const ANALYZE_STEPS = [
  'Enviando...',
  'Identificando alimentos...',
  'Calculando macros...',
  'Quase lá...',
]

interface AnalysisResult {
  alimentos: AnalyzedFood[]
  totais: {
    calorias: number
    proteinas: number
    carboidratos: number
    gorduras: number
  }
  observacoes: string | null
  qualidade: string | null
}

const qualidadeConfig: Record<string, { label: string; color: string; bg: string }> = {
  excelente: { label: 'Excelente', color: 'text-green-600', bg: 'bg-green-100' },
  boa: { label: 'Boa', color: 'text-blue-600', bg: 'bg-blue-100' },
  regular: { label: 'Regular', color: 'text-amber-600', bg: 'bg-amber-100' },
  ruim: { label: 'Precisa melhorar', color: 'text-red-600', bg: 'bg-red-100' },
}

const mealTypes: MealType[] = [
  'cafe_manha', 'lanche_manha', 'almoco', 'lanche_tarde', 'pre_treino', 'jantar', 'ceia'
]

function AnalysisContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { addMeal } = useDailyMeals()

  // tipo pode vir em inglês quando aberto a partir do card do plano
  const initialType = normalizeMealTypePT(searchParams.get('tipo'))

  const [selectedType, setSelectedType] = useState<MealType>(initialType)
  const [mode, setMode] = useState<'foto' | 'texto'>('foto')
  const [description, setDescription] = useState('')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageBase64, setImageBase64] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [usageInfo, setUsageInfo] = useState<{ used: number; limit: number } | null>(null)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [addingNew, setAddingNew] = useState(false)
  const [edited, setEdited] = useState(false)
  const [analyzeStep, setAnalyzeStep] = useState(0)
  const abortRef = useRef<AbortController | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  // Quota do mês visível ANTES da primeira análise
  useEffect(() => {
    let cancelled = false
    fetch('/api/meals/analyze')
      .then(res => res.json())
      .then(data => {
        if (!cancelled && data.success) {
          setUsageInfo({ used: data.used, limit: data.limit })
        }
      })
      .catch(() => { /* silencioso — o contador aparece após a análise */ })
    return () => { cancelled = true }
  }, [])

  const handleImageSelect = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Selecione uma imagem válida')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Imagem muito grande (máx 10MB)')
      return
    }

    // Comprimir antes de gerar base64 — uma foto típica de iPhone (4-8 MB)
    // vira ~300-600 KB, evitando timeout/cancelamento da request em rede móvel
    // (causa raiz do "Erro de conexão" relatado por clientes).
    let processed = file
    try {
      processed = await compressImageClient(file, { maxDimension: 1600, quality: 0.82 })
    } catch (err) {
      // Se a compressão falhar, segue com o arquivo original
      console.warn('Falha ao comprimir imagem, usando original:', err)
    }

    // Show preview (do arquivo comprimido)
    const previewUrl = URL.createObjectURL(processed)
    setImagePreview(previewUrl)
    setResult(null)
    setError(null)

    // Convert to base64
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1]
      setImageBase64(base64)
    }
    reader.readAsDataURL(processed)
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) void handleImageSelect(file)
    e.target.value = ''
  }

  const runAnalysis = async (payload: Record<string, string>) => {
    setAnalyzing(true)
    setError(null)
    setResult(null)
    setEditingIndex(null)
    setAddingNew(false)
    setEdited(false)
    setAnalyzeStep(0)

    const controller = new AbortController()
    abortRef.current = controller
    // Etapas do loading (só feedback visual — a análise é uma request única)
    const stepTimer = setInterval(() => {
      setAnalyzeStep(s => Math.min(s + 1, ANALYZE_STEPS.length - 1))
    }, 3500)

    try {
      const res = await fetch('/api/meals/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      })

      const data = await res.json()

      if (!data.success) {
        if (data.limit_reached) {
          setUsageInfo({ used: data.used, limit: data.limit })
        }
        setError(data.error || 'Erro ao analisar imagem')
        return
      }

      if (data.usage) {
        setUsageInfo(data.usage)
      }

      setResult({
        alimentos: data.alimentos,
        totais: data.totais,
        observacoes: data.observacoes,
        qualidade: data.qualidade,
      })
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // usuário cancelou — sem mensagem de erro
        return
      }
      setError('Erro de conexão. Verifique sua internet e tente novamente.')
    } finally {
      clearInterval(stepTimer)
      setAnalyzing(false)
    }
  }

  const cancelAnalysis = () => {
    abortRef.current?.abort()
  }

  const analyzeImage = () => {
    if (!imageBase64) return
    void runAnalysis({ image_base64: imageBase64 })
  }

  const analyzeText = () => {
    if (description.trim().length < 3) {
      toast.error('Descreva o que você comeu')
      return
    }
    void runAnalysis({ description: description.trim() })
  }

  const recomputeTotals = (alimentos: AnalyzedFood[]) => ({
    calorias: Math.round(alimentos.reduce((s, a) => s + (a.calorias || 0), 0)),
    proteinas: Math.round(alimentos.reduce((s, a) => s + (a.proteinas || 0), 0) * 10) / 10,
    carboidratos: Math.round(alimentos.reduce((s, a) => s + (a.carboidratos || 0), 0) * 10) / 10,
    gorduras: Math.round(alimentos.reduce((s, a) => s + (a.gorduras || 0), 0) * 10) / 10,
  })

  const updateFood = (index: number, updated: AnalyzedFood) => {
    if (!result) return
    const next = [...result.alimentos]
    next[index] = updated
    setResult({ ...result, alimentos: next, totais: recomputeTotals(next) })
    setEdited(true)
  }

  const deleteFood = (index: number) => {
    if (!result) return
    const next = result.alimentos.filter((_, i) => i !== index)
    setResult({ ...result, alimentos: next, totais: recomputeTotals(next) })
    setEdited(true)
    if (editingIndex === index) setEditingIndex(null)
  }

  const addFood = (food: AnalyzedFood) => {
    if (!result) return
    const next = [...result.alimentos, food]
    setResult({ ...result, alimentos: next, totais: recomputeTotals(next) })
    setEdited(true)
  }

  const saveMeal = async () => {
    if (!result) return
    if (result.alimentos.length === 0) {
      toast.error('Adicione ao menos um alimento antes de salvar')
      return
    }

    setSaving(true)
    try {
      const now = new Date()
      const mealData = {
        user_id: '',
        tipo: selectedType,
        data: format(now, 'yyyy-MM-dd'),
        horario_real: format(now, 'HH:mm'),
        status: 'concluido' as const,
        itens: result.alimentos.map((a, idx) => ({
          id: `ai-${idx}`,
          // Usa o vínculo com o banco quando a API conseguiu casar o alimento
          food_id: a.food_id || `ai-${idx}`,
          food: {
            id: a.food_id || `ai-${idx}`,
            nome: a.nome,
            categoria: (a.categoria || 'outros') as FoodCategory,
            porcao_padrao: a.quantidade_g,
            unidade: 'g' as const,
            calorias: a.calorias,
            proteinas: a.proteinas,
            carboidratos: a.carboidratos,
            gorduras: a.gorduras,
            source: 'ai_analysis' as const,
          },
          quantidade: a.quantidade_g,
          calorias: a.calorias,
          proteinas: a.proteinas,
          carboidratos: a.carboidratos,
          gorduras: a.gorduras,
        })),
        calorias_total: result.totais.calorias,
        proteinas_total: result.totais.proteinas,
        carboidratos_total: result.totais.carboidratos,
        gorduras_total: result.totais.gorduras,
        notas: result.observacoes
          ? `[Análise IA${edited ? ' • editada' : ''}] ${result.observacoes}`
          : `[Análise IA${edited ? ' • editada' : ''}]`,
      }

      await addMeal(mealData)
      toast.success('Refeição salva com sucesso!')
      router.push('/alimentacao')
    } catch {
      toast.error('Erro ao salvar refeição')
    } finally {
      setSaving(false)
    }
  }

  const resetAnalysis = () => {
    setImagePreview(null)
    setImageBase64(null)
    setResult(null)
    setError(null)
    setEditingIndex(null)
    setAddingNew(false)
    setEdited(false)
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-dourado" />
              Análise com IA
            </h1>
            <p className="text-xs text-foreground-secondary">
              Tire uma foto do prato para identificar alimentos
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Usage counter */}
        {usageInfo && (
          <div className={cn(
            'flex items-center justify-between px-4 py-2.5 rounded-xl text-sm border',
            usageInfo.used >= usageInfo.limit
              ? 'bg-red-50 border-red-200 text-red-700'
              : 'bg-dourado/10 border-dourado/20 text-foreground-secondary'
          )}>
            <span>Análises este mês</span>
            <span className="font-bold">
              {usageInfo.used}/{usageInfo.limit}
            </span>
          </div>
        )}

        {/* Meal Type Selector */}
        <div>
          <label className="block text-xs font-medium text-foreground-secondary mb-2 uppercase tracking-wide">
            Tipo de refeição
          </label>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {mealTypes.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={cn(
                  'px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                  selectedType === type
                    ? 'bg-dourado text-white'
                    : 'bg-white border border-border text-foreground-secondary'
                )}
              >
                {mealTypeIcons[type]} {mealTypeLabels[type]}
              </button>
            ))}
          </div>
        </div>

        {/* Modo: foto ou descrição em texto */}
        {!result && (
          <div className="grid grid-cols-2 gap-1 bg-white border border-border rounded-xl p-1">
            <button
              onClick={() => { setMode('foto'); setError(null) }}
              className={cn(
                'py-2 rounded-lg text-sm font-medium transition-colors',
                mode === 'foto' ? 'bg-dourado text-white' : 'text-foreground-secondary'
              )}
            >
              📷 Foto
            </button>
            <button
              onClick={() => { setMode('texto'); setError(null) }}
              className={cn(
                'py-2 rounded-lg text-sm font-medium transition-colors',
                mode === 'texto' ? 'bg-dourado text-white' : 'text-foreground-secondary'
              )}
            >
              ✍️ Descrever
            </button>
          </div>
        )}

        {/* Modo texto: descreva a refeição */}
        {mode === 'texto' && !result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-border p-4 space-y-3"
          >
            <p className="text-sm text-foreground-secondary">
              Escreva o que você comeu, com as quantidades aproximadas — a IA identifica os alimentos e calcula os macros.
            </p>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex.: 2 pães franceses na chapa com manteiga e um copo de café com leite"
              rows={4}
              className="w-full bg-background border border-border rounded-xl p-3 text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-dourado resize-none"
            />
            <button
              onClick={analyzeText}
              disabled={analyzing || description.trim().length < 3}
              className="w-full inline-flex items-center justify-center gap-2 py-3 bg-dourado text-white rounded-xl font-medium hover:bg-dourado/90 transition-colors disabled:opacity-50"
            >
              {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {analyzing ? ANALYZE_STEPS[analyzeStep] : 'Analisar descrição'}
            </button>
            {analyzing && (
              <button
                onClick={cancelAnalysis}
                className="w-full text-sm text-foreground-secondary underline"
              >
                Cancelar
              </button>
            )}
          </motion.div>
        )}

        {/* Image capture / preview area */}
        {mode === 'foto' && (!imagePreview ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <div className="bg-gradient-to-br from-dourado/10 to-dourado/5 border-2 border-dashed border-dourado/40 rounded-2xl p-8 text-center">
              <Camera className="w-12 h-12 text-dourado mx-auto mb-3" />
              <p className="text-foreground font-semibold mb-1">Fotografe sua refeição</p>
              <p className="text-sm text-foreground-secondary mb-4">
                A IA vai identificar os alimentos e calcular os macros automaticamente
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-dourado text-white rounded-xl font-medium hover:bg-dourado/90 transition-colors"
                >
                  <Camera className="w-4 h-4" />
                  Tirar Foto
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-border text-foreground rounded-xl font-medium hover:bg-background-elevated transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Galeria
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-border p-4">
              <p className="text-sm text-foreground-secondary">
                <strong className="text-foreground">Dicas para melhor resultado:</strong>
              </p>
              <ul className="mt-2 space-y-1 text-sm text-foreground-secondary">
                <li>- Boa iluminação no prato</li>
                <li>- Foto de cima (visão aérea) é ideal</li>
                <li>- Inclua todo o prato na foto</li>
                <li>- Evite fotos muito escuras ou com flash forte</li>
              </ul>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-4"
          >
            {/* Image preview */}
            <div className="relative rounded-2xl overflow-hidden border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imagePreview}
                alt="Foto da refeição"
                className="w-full h-auto max-h-80 object-cover"
              />
              {analyzing && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <div className="bg-white rounded-2xl px-6 py-4 flex flex-col items-center gap-3">
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-5 h-5 text-dourado animate-spin" />
                      <span className="text-foreground font-medium">{ANALYZE_STEPS[analyzeStep]}</span>
                    </div>
                    <button
                      onClick={cancelAnalysis}
                      className="text-sm text-foreground-secondary underline"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Action buttons (before analysis) */}
            {!result && !analyzing && (
              <div className="flex gap-3">
                <button
                  onClick={resetAnalysis}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-3 bg-white border border-border text-foreground rounded-xl font-medium"
                >
                  <RotateCcw className="w-4 h-4" />
                  Trocar Foto
                </button>
                <button
                  onClick={analyzeImage}
                  disabled={!imageBase64}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-3 bg-dourado text-white rounded-xl font-medium hover:bg-dourado/90 transition-colors disabled:opacity-50"
                >
                  {!imageBase64 ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  {!imageBase64 ? 'Preparando...' : 'Analisar'}
                </button>
              </div>
            )}

          </motion.div>
        ))}

        {/* Error state */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-700 font-medium text-sm">{error}</p>
              <button
                onClick={mode === 'texto' ? analyzeText : analyzeImage}
                className="mt-2 text-sm text-red-600 underline"
              >
                Tentar novamente
              </button>
            </div>
          </motion.div>
        )}

        {/* Analysis Result */}
        {result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Quality badge */}
                {result.qualidade && qualidadeConfig[result.qualidade] && (
                  <div className={cn(
                    'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium',
                    qualidadeConfig[result.qualidade].bg,
                    qualidadeConfig[result.qualidade].color,
                  )}>
                    <Check className="w-4 h-4" />
                    Qualidade: {qualidadeConfig[result.qualidade].label}
                  </div>
                )}

                {/* Macro totals */}
                <div className="bg-gradient-to-r from-dourado/10 to-dourado/5 rounded-xl border border-dourado/20 p-4">
                  <p className="text-xs text-foreground-secondary uppercase tracking-wide mb-3">
                    Total estimado
                  </p>
                  <div className="grid grid-cols-4 gap-3 text-center">
                    <div>
                      <p className="text-xl font-bold text-dourado">{result.totais.calorias}</p>
                      <p className="text-xs text-foreground-secondary">kcal</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-red-400">{result.totais.proteinas}g</p>
                      <p className="text-xs text-foreground-secondary">prot</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-blue-400">{result.totais.carboidratos}g</p>
                      <p className="text-xs text-foreground-secondary">carb</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-amber-400">{result.totais.gorduras}g</p>
                      <p className="text-xs text-foreground-secondary">gord</p>
                    </div>
                  </div>
                </div>

                {/* Observations */}
                {result.observacoes && (
                  <div className="bg-white rounded-xl border border-border p-4">
                    <p className="text-sm text-foreground">{result.observacoes}</p>
                  </div>
                )}

                {/* Food items list */}
                <div className="bg-white rounded-xl border border-border overflow-hidden">
                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-background-elevated transition-colors"
                  >
                    <span className="text-sm font-semibold text-foreground">
                      {result.alimentos.length} alimento{result.alimentos.length !== 1 ? 's' : ''} identificado{result.alimentos.length !== 1 ? 's' : ''}
                    </span>
                    {showDetails
                      ? <ChevronUp className="w-4 h-4 text-foreground-secondary" />
                      : <ChevronDown className="w-4 h-4 text-foreground-secondary" />
                    }
                  </button>

                  <AnimatePresence>
                    {showDetails && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="divide-y divide-border">
                          {result.alimentos.map((food, idx) => (
                            editingIndex === idx ? (
                              <FoodEditRow
                                key={idx}
                                initial={food}
                                onSave={(updated) => { updateFood(idx, updated); setEditingIndex(null) }}
                                onCancel={() => setEditingIndex(null)}
                              />
                            ) : (
                              <div key={idx} className="px-4 py-3 flex items-center justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-foreground truncate">{food.nome}</p>
                                  <p className="text-xs text-foreground-muted">{food.quantidade_g}g</p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <p className="text-sm font-bold text-dourado">{food.calorias} kcal</p>
                                  <p className="text-xs text-foreground-muted">
                                    P:{food.proteinas}g C:{food.carboidratos}g G:{food.gorduras}g
                                  </p>
                                </div>
                                <div className="flex gap-0.5 flex-shrink-0 ml-1">
                                  <button
                                    onClick={() => { setEditingIndex(idx); setAddingNew(false) }}
                                    className="p-2 rounded-lg hover:bg-background-elevated"
                                    aria-label="Editar alimento"
                                    title="Editar"
                                  >
                                    <Pencil className="w-4 h-4 text-foreground-secondary" />
                                  </button>
                                  <button
                                    onClick={() => deleteFood(idx)}
                                    className="p-2 rounded-lg hover:bg-red-50"
                                    aria-label="Remover alimento"
                                    title="Remover"
                                  >
                                    <Trash2 className="w-4 h-4 text-red-500" />
                                  </button>
                                </div>
                              </div>
                            )
                          ))}

                          {addingNew ? (
                            <FoodEditRow
                              initial={{ nome: '', quantidade_g: 100, calorias: 0, proteinas: 0, carboidratos: 0, gorduras: 0, categoria: 'outros' }}
                              onSave={(food) => { addFood(food); setAddingNew(false) }}
                              onCancel={() => setAddingNew(false)}
                            />
                          ) : (
                            <button
                              onClick={() => { setAddingNew(true); setEditingIndex(null) }}
                              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm text-dourado font-medium hover:bg-dourado/5 transition-colors"
                            >
                              <Plus className="w-4 h-4" /> Adicionar alimento
                            </button>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {edited && (
                  <p className="text-[11px] text-foreground-muted text-center -mt-2">
                    Lista ajustada — totais recalculados
                  </p>
                )}

                {/* Action buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={resetAnalysis}
                    className="flex-1 inline-flex items-center justify-center gap-2 py-3 bg-white border border-border text-foreground rounded-xl font-medium"
                  >
                    <RotateCcw className="w-4 h-4" />
                    {mode === 'texto' ? 'Nova Análise' : 'Nova Foto'}
                  </button>
                  <button
                    onClick={saveMeal}
                    disabled={saving}
                    className="flex-1 inline-flex items-center justify-center gap-2 py-3 bg-dourado text-white rounded-xl font-medium hover:bg-dourado/90 transition-colors disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {saving ? 'Salvando...' : 'Salvar Refeição'}
                  </button>
                </div>
              </motion.div>
            )}
      </div>

      {/* Hidden file inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  )
}

interface FoodEditRowProps {
  initial: AnalyzedFood
  onSave: (food: AnalyzedFood) => void
  onCancel: () => void
}

function FoodEditRow({ initial, onSave, onCancel }: FoodEditRowProps) {
  const [nome, setNome] = useState(initial.nome)
  const [quantidade, setQuantidade] = useState(String(initial.quantidade_g ?? 0))
  const [calorias, setCalorias] = useState(String(initial.calorias ?? 0))
  const [proteinas, setProteinas] = useState(String(initial.proteinas ?? 0))
  const [carboidratos, setCarboidratos] = useState(String(initial.carboidratos ?? 0))
  const [gorduras, setGorduras] = useState(String(initial.gorduras ?? 0))

  const num = (v: string) => {
    const n = parseFloat(v.replace(',', '.'))
    return isNaN(n) ? 0 : n
  }

  // Baseline para reescala proporcional: ao mudar a quantidade (g), os macros
  // acompanham (150g → 80g reduz kcal/prot/carb/gord na mesma proporção).
  // Editar um macro manualmente redefine o baseline com os valores atuais.
  const baseRef = useRef({
    q: initial.quantidade_g || 0,
    cal: initial.calorias || 0,
    prot: initial.proteinas || 0,
    carb: initial.carboidratos || 0,
    gord: initial.gorduras || 0,
  })

  const handleQuantityChange = (value: string) => {
    setQuantidade(value)
    const newQ = num(value)
    const base = baseRef.current
    if (newQ > 0 && base.q > 0) {
      const ratio = newQ / base.q
      setCalorias(String(Math.round(base.cal * ratio)))
      setProteinas(String(Math.round(base.prot * ratio * 10) / 10))
      setCarboidratos(String(Math.round(base.carb * ratio * 10) / 10))
      setGorduras(String(Math.round(base.gord * ratio * 10) / 10))
    }
  }

  const handleMacroChange = (
    setter: (v: string) => void,
    field: 'cal' | 'prot' | 'carb' | 'gord'
  ) => (value: string) => {
    setter(value)
    // Sempre atualiza o baseline com o valor digitado; se a quantidade
    // estiver vazia/0 no momento, mantém o q anterior do baseline (senão a
    // próxima edição de gramas descartaria o macro recém-digitado).
    const q = num(quantidade)
    baseRef.current = {
      q: q > 0 ? q : baseRef.current.q,
      cal: field === 'cal' ? num(value) : num(calorias),
      prot: field === 'prot' ? num(value) : num(proteinas),
      carb: field === 'carb' ? num(value) : num(carboidratos),
      gord: field === 'gord' ? num(value) : num(gorduras),
    }
  }

  const handleSave = () => {
    if (!nome.trim()) {
      toast.error('Informe o nome do alimento')
      return
    }
    onSave({
      nome: nome.trim(),
      quantidade_g: num(quantidade),
      calorias: num(calorias),
      proteinas: num(proteinas),
      carboidratos: num(carboidratos),
      gorduras: num(gorduras),
      categoria: initial.categoria || 'outros',
    })
  }

  const inputCls = 'w-full px-2 py-1.5 rounded-lg bg-white border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-dourado'
  const labelCls = 'text-[10px] uppercase tracking-wide text-foreground-muted block mb-0.5'

  return (
    <div className="px-4 py-3 space-y-2 bg-dourado/5">
      <div>
        <label className={labelCls}>Nome</label>
        <input
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Ex.: Arroz integral"
          className={inputCls}
          autoFocus
        />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className={labelCls}>Quant. (g)</label>
          <input type="text" inputMode="decimal" value={quantidade} onChange={(e) => handleQuantityChange(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Kcal</label>
          <input type="text" inputMode="decimal" value={calorias} onChange={(e) => handleMacroChange(setCalorias, 'cal')(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Prot. (g)</label>
          <input type="text" inputMode="decimal" value={proteinas} onChange={(e) => handleMacroChange(setProteinas, 'prot')(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Carb. (g)</label>
          <input type="text" inputMode="decimal" value={carboidratos} onChange={(e) => handleMacroChange(setCarboidratos, 'carb')(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Gord. (g)</label>
          <input type="text" inputMode="decimal" value={gorduras} onChange={(e) => handleMacroChange(setGorduras, 'gord')(e.target.value)} className={inputCls} />
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button
          onClick={onCancel}
          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-lg bg-white border border-border text-sm text-foreground-secondary"
        >
          <XIcon className="w-4 h-4" /> Cancelar
        </button>
        <button
          onClick={handleSave}
          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-lg bg-dourado text-white text-sm font-medium"
        >
          <Check className="w-4 h-4" /> Salvar
        </button>
      </div>
    </div>
  )
}

export default function AnalisarPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-dourado animate-spin" />
      </div>
    }>
      <AnalysisContent />
    </Suspense>
  )
}
