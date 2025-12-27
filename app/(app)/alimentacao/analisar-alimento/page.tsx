"use client"

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Camera,
  Upload,
  Loader2,
  Sparkles,
  Check,
  Save,
  X,
  AlertCircle,
  ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { foodCategoryLabels } from '@/lib/nutrition/types'
import type { FoodCategory } from '@/lib/nutrition/types'

interface AnalyzedFood {
  nome: string
  categoria: FoodCategory
  descricao?: string
  porcao_padrao: number
  unidade: 'g' | 'ml' | 'unidade'
  calorias: number
  proteinas: number
  carboidratos: number
  gorduras: number
  fibras?: number
  porcoes_comuns?: Array<{
    label: string
    grams: number
    isDefault?: boolean
  }>
}

interface AnalysisResult {
  success: boolean
  error?: string
  food?: AnalyzedFood
  porcao_estimada?: {
    grams: number
    descricao: string
    calorias: number
    proteinas: number
    carboidratos: number
    gorduras: number
  }
  dicas?: string[]
  confidence?: 'alto' | 'medio' | 'baixo'
}

type AnalysisStep = 'capture' | 'analyzing' | 'result' | 'saving'

export default function AnalisarAlimentoPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<AnalysisStep>('capture')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Handle image selection
  const handleImageSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Por favor, selecione uma imagem válida')
      return
    }

    setSelectedFile(file)
    setError(null)

    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }, [])

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleImageSelect(file)
    }
  }

  // Analyze food with AI
  const analyzeFood = async () => {
    if (!selectedFile) return

    setStep('analyzing')
    setError(null)

    try {
      const formData = new FormData()
      formData.append('image', selectedFile)

      const response = await fetch('/api/analyze-food', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (data.success && data.food) {
        setResult(data)
        setStep('result')
      } else {
        setError(data.error || 'Não foi possível analisar o alimento')
        setStep('capture')
      }
    } catch (err) {
      console.error('Erro na análise:', err)
      setError('Erro de conexão. Tente novamente.')
      setStep('capture')
    }
  }

  // Save food to user's database
  const saveFood = async () => {
    if (!result?.food) return

    setStep('saving')
    setError(null)

    try {
      const response = await fetch('/api/user-foods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nome: result.food.nome,
          categoria: result.food.categoria,
          porcao_padrao: result.food.porcao_padrao,
          unidade: result.food.unidade,
          calorias: result.food.calorias,
          proteinas: result.food.proteinas,
          carboidratos: result.food.carboidratos,
          gorduras: result.food.gorduras,
          fibras: result.food.fibras,
          porcoes_comuns: result.food.porcoes_comuns
        })
      })

      const data = await response.json()

      if (data.success) {
        setSaveSuccess(true)
        setTimeout(() => {
          router.push('/alimentacao')
        }, 1500)
      } else {
        setError(data.error || 'Erro ao salvar alimento')
        setStep('result')
      }
    } catch (err) {
      console.error('Erro ao salvar:', err)
      setError('Erro de conexão. Tente novamente.')
      setStep('result')
    }
  }

  // Reset to start
  const reset = () => {
    setStep('capture')
    setImagePreview(null)
    setSelectedFile(null)
    setResult(null)
    setError(null)
    setSaveSuccess(false)
  }

  // Get confidence color
  const getConfidenceColor = (confidence?: string) => {
    switch (confidence) {
      case 'alto': return 'text-emerald-400'
      case 'medio': return 'text-amber-400'
      case 'baixo': return 'text-red-400'
      default: return 'text-slate-400'
    }
  }

  // Get confidence label
  const getConfidenceLabel = (confidence?: string) => {
    switch (confidence) {
      case 'alto': return 'Alta confiança'
      case 'medio': return 'Média confiança'
      case 'baixo': return 'Baixa confiança'
      default: return 'Desconhecido'
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] pb-24">
      {/* Header */}
      <div className="px-4 pt-safe-top pb-4">
        <div className="flex items-center gap-3 mb-2 pt-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">Analisar Alimento</h1>
            <p className="text-sm text-slate-400">Fotografe um alimento para análise</p>
          </div>
        </div>
      </div>

      <div className="px-4">
        <AnimatePresence mode="wait">
          {/* Step 1: Capture */}
          {step === 'capture' && (
            <motion.div
              key="capture"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Preview area */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square bg-[#14141F] border-2 border-dashed border-[#2E2E3E] rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-violet-500/50 transition-colors overflow-hidden"
              >
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-8">
                    <div className="w-20 h-20 rounded-full bg-violet-500/20 flex items-center justify-center mx-auto mb-4">
                      <Camera className="w-10 h-10 text-violet-400" />
                    </div>
                    <p className="text-white font-medium mb-2">Toque para fotografar</p>
                    <p className="text-sm text-slate-400">ou selecionar da galeria</p>
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />

              {/* Error message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3"
                >
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-red-400 text-sm">{error}</p>
                </motion.div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="lg"
                  className="flex-1 gap-2"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-5 h-5" />
                  Galeria
                </Button>
                <Button
                  variant="gradient"
                  size="lg"
                  className="flex-1 gap-2"
                  disabled={!selectedFile}
                  onClick={analyzeFood}
                >
                  <Sparkles className="w-5 h-5" />
                  Analisar
                </Button>
              </div>

              {/* Info card */}
              <div className="bg-[#14141F] border border-[#2E2E3E] rounded-2xl p-4">
                <h3 className="text-sm font-semibold text-white mb-2">Dicas para melhor resultado</h3>
                <ul className="text-sm text-slate-400 space-y-1">
                  <li>- Fotografe apenas UM alimento por vez</li>
                  <li>- Use boa iluminação</li>
                  <li>- Mostre o alimento claramente</li>
                  <li>- Evite fundos muito complexos</li>
                </ul>
              </div>
            </motion.div>
          )}

          {/* Step 2: Analyzing */}
          {step === 'analyzing' && (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <div className="relative mb-6">
                <div className="w-24 h-24 rounded-2xl overflow-hidden">
                  {imagePreview && (
                    <img
                      src={imagePreview}
                      alt="Analisando"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-violet-500 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Analisando...</h2>
              <p className="text-slate-400 text-center">
                A IA está identificando o alimento<br />e calculando os valores nutricionais
              </p>
            </motion.div>
          )}

          {/* Step 3: Result */}
          {step === 'result' && result?.food && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Food card */}
              <div className="bg-gradient-to-br from-violet-500/10 to-cyan-500/5 border border-violet-500/20 rounded-2xl overflow-hidden">
                {/* Image + Name */}
                <div className="flex items-start gap-4 p-4">
                  <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0">
                    {imagePreview && (
                      <img
                        src={imagePreview}
                        alt={result.food.nome}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-bold text-white truncate">{result.food.nome}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-lg">
                        {foodCategoryLabels[result.food.categoria]?.icon}
                      </span>
                      <span className="text-sm text-slate-400">
                        {foodCategoryLabels[result.food.categoria]?.label}
                      </span>
                    </div>
                    <p className={`text-xs mt-1 ${getConfidenceColor(result.confidence)}`}>
                      {getConfidenceLabel(result.confidence)}
                    </p>
                  </div>
                </div>

                {/* Nutrition info */}
                <div className="bg-black/20 p-4">
                  <p className="text-xs text-slate-500 mb-3">
                    Valores nutricionais por {result.food.porcao_padrao}{result.food.unidade}
                  </p>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="bg-slate-800/50 rounded-lg p-2">
                      <p className="text-lg font-bold text-white">{result.food.calorias}</p>
                      <p className="text-[10px] text-slate-400">kcal</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-2">
                      <p className="text-lg font-bold text-violet-400">{result.food.proteinas}g</p>
                      <p className="text-[10px] text-slate-400">prot</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-2">
                      <p className="text-lg font-bold text-cyan-400">{result.food.carboidratos}g</p>
                      <p className="text-[10px] text-slate-400">carb</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-2">
                      <p className="text-lg font-bold text-amber-400">{result.food.gorduras}g</p>
                      <p className="text-[10px] text-slate-400">gord</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Estimated portion */}
              {result.porcao_estimada && (
                <div className="bg-[#14141F] border border-[#2E2E3E] rounded-2xl p-4">
                  <h3 className="text-sm font-semibold text-white mb-2">Porção estimada na foto</h3>
                  <p className="text-slate-400 text-sm mb-3">{result.porcao_estimada.descricao}</p>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div>
                      <p className="text-sm font-bold text-white">{result.porcao_estimada.calorias}</p>
                      <p className="text-[10px] text-slate-500">kcal</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-violet-400">{result.porcao_estimada.proteinas}g</p>
                      <p className="text-[10px] text-slate-500">prot</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-cyan-400">{result.porcao_estimada.carboidratos}g</p>
                      <p className="text-[10px] text-slate-500">carb</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-amber-400">{result.porcao_estimada.gorduras}g</p>
                      <p className="text-[10px] text-slate-500">gord</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Common portions */}
              {result.food.porcoes_comuns && result.food.porcoes_comuns.length > 0 && (
                <div className="bg-[#14141F] border border-[#2E2E3E] rounded-2xl p-4">
                  <h3 className="text-sm font-semibold text-white mb-3">Porções comuns</h3>
                  <div className="flex flex-wrap gap-2">
                    {result.food.porcoes_comuns.map((portion, index) => (
                      <span
                        key={index}
                        className={`px-3 py-1.5 rounded-lg text-sm ${
                          portion.isDefault
                            ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {portion.label} ({portion.grams}{result.food?.unidade})
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Tips */}
              {result.dicas && result.dicas.length > 0 && (
                <div className="bg-[#14141F] border border-[#2E2E3E] rounded-2xl p-4">
                  <h3 className="text-sm font-semibold text-white mb-2">Dicas nutricionais</h3>
                  <ul className="text-sm text-slate-400 space-y-1">
                    {result.dicas.map((dica, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <ChevronRight className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                        <span>{dica}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Error message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3"
                >
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-red-400 text-sm">{error}</p>
                </motion.div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  size="lg"
                  className="flex-1 gap-2"
                  onClick={reset}
                >
                  <X className="w-5 h-5" />
                  Nova análise
                </Button>
                <Button
                  variant="gradient"
                  size="lg"
                  className="flex-1 gap-2"
                  onClick={saveFood}
                >
                  <Save className="w-5 h-5" />
                  Salvar alimento
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 4: Saving */}
          {step === 'saving' && (
            <motion.div
              key="saving"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center justify-center py-20"
            >
              {saveSuccess ? (
                <>
                  <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mb-6">
                    <Check className="w-10 h-10 text-emerald-400" />
                  </div>
                  <h2 className="text-xl font-bold text-white mb-2">Salvo com sucesso!</h2>
                  <p className="text-slate-400 text-center">
                    O alimento foi adicionado à sua lista pessoal
                  </p>
                </>
              ) : (
                <>
                  <Loader2 className="w-12 h-12 text-violet-400 animate-spin mb-6" />
                  <h2 className="text-xl font-bold text-white mb-2">Salvando...</h2>
                  <p className="text-slate-400 text-center">
                    Adicionando à sua lista de alimentos
                  </p>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
