"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Search, Scale, Calculator } from 'lucide-react'
import type { AnalysisLoadingProps, AnalysisStep } from '@/types/analysis'
import { cn } from '@/lib/utils'

const ANALYSIS_STEPS: AnalysisStep[] = [
  { id: 'identify', label: 'Identificando alimentos', status: 'pending' },
  { id: 'portions', label: 'Estimando porções', status: 'pending' },
  { id: 'macros', label: 'Calculando macros', status: 'pending' }
]

const TIPS = [
  'A IA está analisando cada alimento visível na foto',
  'Porções são estimadas com base no tamanho do prato',
  'Métodos de preparo afetam os valores nutricionais',
  'Você poderá editar os resultados depois'
]

export function AnalysisLoading({ imagePreview }: AnalysisLoadingProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [tipIndex, setTipIndex] = useState(0)
  const [progress, setProgress] = useState(0)

  // Simular progresso dos steps
  useEffect(() => {
    const stepInterval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev < ANALYSIS_STEPS.length - 1) return prev + 1
        return prev
      })
    }, 2500)

    return () => clearInterval(stepInterval)
  }, [])

  // Animar progresso
  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) return prev
        return prev + Math.random() * 3
      })
    }, 200)

    return () => clearInterval(progressInterval)
  }, [])

  // Rotacionar dicas
  useEffect(() => {
    const tipInterval = setInterval(() => {
      setTipIndex(prev => (prev + 1) % TIPS.length)
    }, 4000)

    return () => clearInterval(tipInterval)
  }, [])

  const getStepStatus = (index: number): AnalysisStep['status'] => {
    if (index < currentStep) return 'completed'
    if (index === currentStep) return 'in_progress'
    return 'pending'
  }

  const getStepIcon = (id: string) => {
    switch (id) {
      case 'identify':
        return Search
      case 'portions':
        return Scale
      case 'macros':
        return Calculator
      default:
        return Sparkles
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Preview da imagem com overlay */}
      <div className="relative aspect-square max-w-[300px] mx-auto mt-8 rounded-2xl overflow-hidden">
        {imagePreview && (
          <img
            src={imagePreview}
            alt="Refeição sendo analisada"
            className="w-full h-full object-cover"
          />
        )}

        {/* Overlay escuro */}
        <div className="absolute inset-0 bg-black/60" />

        {/* Efeito de escaneamento */}
        <motion.div
          className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-dourado to-transparent"
          animate={{
            top: ['0%', '100%', '0%']
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'linear'
          }}
        />

        {/* Ícone central */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
            className="w-20 h-20 rounded-full bg-dourado/30 flex items-center justify-center"
          >
            <Sparkles className="w-10 h-10 text-dourado" />
          </motion.div>
        </div>
      </div>

      {/* Status */}
      <div className="px-6 mt-8 flex-1">
        <h2 className="text-xl font-bold text-foreground text-center mb-2">
          Analisando sua refeição...
        </h2>

        {/* Barra de progresso */}
        <div className="bg-background-elevated rounded-full h-2 mb-6 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-dourado to-dourado/70"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Steps */}
        <div className="space-y-4 mb-8">
          {ANALYSIS_STEPS.map((step, index) => {
            const Icon = getStepIcon(step.id)
            const status = getStepStatus(index)

            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.2 }}
                className="flex items-center gap-3"
              >
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center transition-colors',
                    status === 'completed' && 'bg-emerald-500',
                    status === 'in_progress' && 'bg-dourado',
                    status === 'pending' && 'bg-border'
                  )}
                >
                  {status === 'completed' ? (
                    <motion.svg
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-4 h-4 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </motion.svg>
                  ) : status === 'in_progress' ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <Icon className="w-4 h-4 text-white" />
                    </motion.div>
                  ) : (
                    <Icon className="w-4 h-4 text-foreground-muted" />
                  )}
                </div>

                <span
                  className={cn(
                    'text-sm font-medium',
                    status === 'completed' && 'text-emerald-400',
                    status === 'in_progress' && 'text-foreground',
                    status === 'pending' && 'text-foreground-muted'
                  )}
                >
                  {step.label}
                </span>

                {status === 'in_progress' && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="text-dourado text-sm"
                  >
                    ...
                  </motion.span>
                )}
              </motion.div>
            )
          })}
        </div>

        {/* Dica rotativa */}
        <motion.div
          key={tipIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="bg-white border border-border rounded-xl p-4"
        >
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-dourado/20 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-dourado" />
            </div>
            <p className="text-foreground-secondary text-sm">{TIPS[tipIndex]}</p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
