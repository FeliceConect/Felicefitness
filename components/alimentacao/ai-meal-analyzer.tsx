"use client"

import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Camera,
  ImageIcon,
  ArrowLeft,
  Sparkles,
  AlertCircle
} from 'lucide-react'
import { useMealAnalysis } from '@/hooks/use-meal-analysis'
import { AnalysisLoading } from './analysis-loading'
import { AnalysisResult } from './analysis-result'
import type { MealAnalysisResult, AnalyzedFoodItem } from '@/types/analysis'

interface AIMealAnalyzerProps {
  onAnalysisComplete: (result: MealAnalysisResult) => void
  onCancel: () => void
}

type AnalyzerStep = 'capture' | 'analyzing' | 'result'

const PHOTO_TIPS = [
  { icon: '📸', text: 'Tire a foto de cima (bird\'s eye view)' },
  { icon: '💡', text: 'Use boa iluminação natural' },
  { icon: '🍽️', text: 'Mostre todos os alimentos no quadro' },
  { icon: '📏', text: 'Inclua o prato como referência de tamanho' }
]

export function AIMealAnalyzer({ onAnalysisComplete, onCancel }: AIMealAnalyzerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<AnalyzerStep>('capture')

  const {
    isAnalyzing,
    result,
    error,
    imagePreview,
    analyzeImage,
    clearResult,
    updateItem,
    removeItem,
    addItem,
    getUpdatedResult
  } = useMealAnalysis()

  // Processar arquivo selecionado
  const handleFileSelect = async (file: File) => {
    if (!file) return

    setStep('analyzing')
    await analyzeImage(file)

    // Verificar resultado
    const analysisResult = getUpdatedResult()
    if (analysisResult?.success) {
      setStep('result')
    } else {
      setStep('capture')
    }
  }

  // Selecionar da galeria
  const handleGallerySelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  // Tirar foto com câmera
  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  // Salvar resultado
  const handleSave = () => {
    const finalResult = getUpdatedResult()
    if (finalResult) {
      onAnalysisComplete(finalResult)
    }
  }

  // Tentar novamente
  const handleRetry = () => {
    clearResult()
    setStep('capture')
  }

  // Adicionar novo item (manual)
  const handleAddItem = () => {
    const newItem: Omit<AnalyzedFoodItem, 'id'> = {
      name: 'Novo alimento',
      portion_grams: 100,
      calories: 100,
      protein: 5,
      carbs: 10,
      fat: 3,
      confidence: 'baixo',
      edited: true
    }
    addItem(newItem)
  }

  // Renderizar etapa atual
  const renderStep = () => {
    // Analisando
    if (step === 'analyzing' || isAnalyzing) {
      return <AnalysisLoading imagePreview={imagePreview || ''} />
    }

    // Resultado
    if (step === 'result' && result?.success) {
      return (
        <AnalysisResult
          result={result}
          imageUrl={imagePreview || ''}
          onEditItem={updateItem}
          onRemoveItem={removeItem}
          onAddItem={handleAddItem}
          onSave={handleSave}
          onRetry={handleRetry}
        />
      )
    }

    // Captura (padrão)
    return (
      <div className="min-h-screen bg-[#0A0A0F]">
        {/* Header */}
        <div className="px-4 pt-12 pb-6">
          <button
            onClick={onCancel}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Voltar</span>
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Analisar Refeição</h1>
              <p className="text-slate-400 text-sm">IA identifica alimentos e macros</p>
            </div>
          </div>
        </div>

        {/* Área de captura */}
        <div className="px-4 mb-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="aspect-square bg-[#14141F] border-2 border-dashed border-[#2E2E3E] rounded-2xl flex flex-col items-center justify-center"
          >
            <div className="w-20 h-20 rounded-full bg-violet-500/20 flex items-center justify-center mb-4">
              <Camera className="w-10 h-10 text-violet-400" />
            </div>
            <p className="text-white font-medium mb-1">Tire uma foto da refeição</p>
            <p className="text-slate-500 text-sm">ou selecione da galeria</p>
          </motion.div>
        </div>

        {/* Erro */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="px-4 mb-4"
            >
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <div>
                  <p className="text-red-400 font-medium">Erro na análise</p>
                  <p className="text-red-400/80 text-sm">{error}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Botões de captura */}
        <div className="px-4 mb-6">
          <div className="grid grid-cols-2 gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => cameraInputRef.current?.click()}
              className="py-4 bg-gradient-to-r from-violet-600 to-cyan-500 text-white rounded-xl font-medium flex items-center justify-center gap-2"
            >
              <Camera className="w-5 h-5" />
              <span>Câmera</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => fileInputRef.current?.click()}
              className="py-4 bg-[#1E1E2E] text-white rounded-xl font-medium border border-[#2E2E3E] flex items-center justify-center gap-2"
            >
              <ImageIcon className="w-5 h-5" />
              <span>Galeria</span>
            </motion.button>
          </div>

          {/* Inputs hidden */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleCameraCapture}
            className="hidden"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleGallerySelect}
            className="hidden"
          />
        </div>

        {/* Dicas */}
        <div className="px-4">
          <div className="bg-[#14141F] border border-[#2E2E3E] rounded-xl p-4">
            <h3 className="text-white font-medium mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-400" />
              Dicas para melhor análise
            </h3>
            <div className="space-y-2">
              {PHOTO_TIPS.map((tip, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <span className="text-lg">{tip.icon}</span>
                  <span className="text-slate-400 text-sm">{tip.text}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return <AnimatePresence mode="wait">{renderStep()}</AnimatePresence>
}
