"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Check, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { AIMealAnalyzer } from '@/components/alimentacao/ai-meal-analyzer'
import type { MealAnalysisResult } from '@/types/analysis'
import { cn } from '@/lib/utils'

// Tipos de refeição
const MEAL_TYPES = [
  { id: 'cafe_da_manha', label: 'Café da manhã', icon: '🌅' },
  { id: 'lanche_manha', label: 'Lanche manhã', icon: '🍎' },
  { id: 'almoco', label: 'Almoço', icon: '🍽️' },
  { id: 'lanche_tarde', label: 'Lanche tarde', icon: '🍪' },
  { id: 'jantar', label: 'Jantar', icon: '🌙' },
  { id: 'ceia', label: 'Ceia', icon: '🌜' }
]

type Step = 'analyze' | 'confirm'

export default function AnalisarRefeicaoPage() {
  const router = useRouter()

  const [step, setStep] = useState<Step>('analyze')
  const [analysisResult, setAnalysisResult] = useState<MealAnalysisResult | null>(null)
  const [selectedMealType, setSelectedMealType] = useState('almoco')
  const [mealDate, setMealDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [mealTime, setMealTime] = useState(format(new Date(), 'HH:mm'))
  const [isSaving, setIsSaving] = useState(false)

  // Quando análise é concluída
  const handleAnalysisComplete = (result: MealAnalysisResult) => {
    setAnalysisResult(result)
    setStep('confirm')

    // Tentar identificar tipo de refeição pelo horário
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 10) setSelectedMealType('cafe_da_manha')
    else if (hour >= 10 && hour < 12) setSelectedMealType('lanche_manha')
    else if (hour >= 12 && hour < 14) setSelectedMealType('almoco')
    else if (hour >= 14 && hour < 18) setSelectedMealType('lanche_tarde')
    else if (hour >= 18 && hour < 21) setSelectedMealType('jantar')
    else setSelectedMealType('ceia')
  }

  // Cancelar análise
  const handleCancel = () => {
    router.back()
  }

  // Voltar para análise
  const handleBackToAnalysis = () => {
    setStep('analyze')
  }

  // Salvar refeição
  const handleSave = async () => {
    if (!analysisResult) return

    setIsSaving(true)

    try {
      // TODO: Integrar com Supabase para salvar a refeição
      // Por enquanto, apenas simula o salvamento
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Redirecionar para a página de alimentação
      router.push('/alimentacao')
    } catch (error) {
      console.error('Erro ao salvar refeição:', error)
    } finally {
      setIsSaving(false)
    }
  }

  // Renderizar etapa de análise
  if (step === 'analyze') {
    return (
      <AIMealAnalyzer
        onAnalysisComplete={handleAnalysisComplete}
        onCancel={handleCancel}
      />
    )
  }

  // Renderizar etapa de confirmação
  return (
    <div className="min-h-screen bg-[#0A0A0F] pb-32">
      {/* Header */}
      <div className="px-4 pt-12 pb-6">
        <button
          onClick={handleBackToAnalysis}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Voltar</span>
        </button>

        <h1 className="text-2xl font-bold text-white">Confirmar Refeição</h1>
        <p className="text-slate-400 text-sm">
          Revise os dados e salve sua refeição
        </p>
      </div>

      {/* Resumo da análise */}
      {analysisResult && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 mb-6"
        >
          <div className="bg-[#14141F] border border-[#2E2E3E] rounded-2xl p-4">
            <p className="text-slate-400 text-sm mb-3">
              {analysisResult.meal_description || 'Refeição analisada'}
            </p>

            {/* Macros */}
            <div className="grid grid-cols-4 gap-2">
              <div className="bg-[#0A0A0F] rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-white">
                  {analysisResult.totals.calories}
                </p>
                <p className="text-xs text-slate-500">kcal</p>
              </div>
              <div className="bg-[#0A0A0F] rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-cyan-400">
                  {analysisResult.totals.protein.toFixed(0)}g
                </p>
                <p className="text-xs text-slate-500">prot</p>
              </div>
              <div className="bg-[#0A0A0F] rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-amber-400">
                  {analysisResult.totals.carbs.toFixed(0)}g
                </p>
                <p className="text-xs text-slate-500">carb</p>
              </div>
              <div className="bg-[#0A0A0F] rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-rose-400">
                  {analysisResult.totals.fat.toFixed(0)}g
                </p>
                <p className="text-xs text-slate-500">gord</p>
              </div>
            </div>

            {/* Itens */}
            <div className="mt-4 pt-4 border-t border-[#2E2E3E]">
              <p className="text-sm text-slate-400 mb-2">
                {analysisResult.items.length} alimentos identificados
              </p>
              <div className="flex flex-wrap gap-2">
                {analysisResult.items.map((item) => (
                  <span
                    key={item.id}
                    className="px-2 py-1 bg-[#1E1E2E] rounded-lg text-xs text-slate-300"
                  >
                    {item.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Tipo de refeição */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="px-4 mb-6"
      >
        <label className="text-sm text-slate-400 block mb-3">Tipo de refeição</label>
        <div className="grid grid-cols-3 gap-2">
          {MEAL_TYPES.map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedMealType(type.id)}
              className={cn(
                'p-3 rounded-xl border transition-colors text-center',
                selectedMealType === type.id
                  ? 'bg-violet-500/20 border-violet-500 text-white'
                  : 'bg-[#14141F] border-[#2E2E3E] text-slate-400 hover:border-violet-500/50'
              )}
            >
              <span className="text-2xl block mb-1">{type.icon}</span>
              <span className="text-xs">{type.label}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Data e hora */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="px-4 mb-6"
      >
        <label className="text-sm text-slate-400 block mb-3">Data e horário</label>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#14141F] border border-[#2E2E3E] rounded-xl p-3">
            <input
              type="date"
              value={mealDate}
              onChange={(e) => setMealDate(e.target.value)}
              max={format(new Date(), 'yyyy-MM-dd')}
              className="w-full bg-transparent text-white focus:outline-none"
            />
          </div>
          <div className="bg-[#14141F] border border-[#2E2E3E] rounded-xl p-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            <input
              type="time"
              value={mealTime}
              onChange={(e) => setMealTime(e.target.value)}
              className="w-full bg-transparent text-white focus:outline-none"
            />
          </div>
        </div>
      </motion.div>

      {/* Botão fixo de salvar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0A0A0F] via-[#0A0A0F] to-transparent">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          disabled={isSaving}
          className={cn(
            'w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2',
            isSaving
              ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-violet-600 to-cyan-500 text-white'
          )}
        >
          {isSaving ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Check className="w-5 h-5" />
              Salvar Refeição
            </>
          )}
        </motion.button>
      </div>
    </div>
  )
}
