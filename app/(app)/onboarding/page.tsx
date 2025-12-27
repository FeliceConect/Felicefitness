"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronRight,
  ChevronLeft,
  Target,
  Dumbbell,
  Apple,
  Droplets,
  Moon,
  Trophy,
  Bell,
  Shield,
  Check,
  Loader2
} from 'lucide-react'
import { Logo } from '@/components/shared/logo'

interface OnboardingStep {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  content: React.ReactNode
}

const TERMS_VERSION = '1.0.0'
const PRIVACY_VERSION = '1.0.0'

export default function OnboardingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [saving, setSaving] = useState(false)

  // Form states
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false)
  const [goals, setGoals] = useState<string[]>([])
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)

  const goalOptions = [
    { id: 'perder_peso', label: 'Perder peso', icon: Target },
    { id: 'ganhar_massa', label: 'Ganhar massa muscular', icon: Dumbbell },
    { id: 'saude', label: 'Melhorar saude geral', icon: Apple },
    { id: 'forca', label: 'Aumentar forca', icon: Dumbbell },
    { id: 'resistencia', label: 'Melhorar resistencia', icon: Trophy },
    { id: 'flexibilidade', label: 'Aumentar flexibilidade', icon: Target },
  ]

  const toggleGoal = (goalId: string) => {
    setGoals(prev =>
      prev.includes(goalId)
        ? prev.filter(g => g !== goalId)
        : [...prev, goalId]
    )
  }

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Bem-vindo ao FeliceFit!',
      description: 'Seu app completo de fitness e saude. Vamos configurar sua conta em poucos passos.',
      icon: <Logo size="lg" showText={false} />,
      content: (
        <div className="space-y-6 text-center">
          <div className="grid grid-cols-3 gap-4 mt-8">
            <div className="flex flex-col items-center gap-2 p-4 bg-slate-800/50 rounded-xl">
              <Dumbbell className="w-8 h-8 text-violet-400" />
              <span className="text-sm text-slate-300">Treinos</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 bg-slate-800/50 rounded-xl">
              <Apple className="w-8 h-8 text-green-400" />
              <span className="text-sm text-slate-300">Nutricao</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 bg-slate-800/50 rounded-xl">
              <Droplets className="w-8 h-8 text-blue-400" />
              <span className="text-sm text-slate-300">Hidratacao</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 bg-slate-800/50 rounded-xl">
              <Moon className="w-8 h-8 text-indigo-400" />
              <span className="text-sm text-slate-300">Sono</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 bg-slate-800/50 rounded-xl">
              <Trophy className="w-8 h-8 text-yellow-400" />
              <span className="text-sm text-slate-300">Conquistas</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 bg-slate-800/50 rounded-xl">
              <Target className="w-8 h-8 text-orange-400" />
              <span className="text-sm text-slate-300">Metas</span>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'goals',
      title: 'Quais sao seus objetivos?',
      description: 'Selecione um ou mais objetivos para personalizarmos sua experiencia.',
      icon: <Target className="w-12 h-12 text-violet-400" />,
      content: (
        <div className="grid grid-cols-2 gap-3 mt-6">
          {goalOptions.map(goal => {
            const Icon = goal.icon
            const isSelected = goals.includes(goal.id)
            return (
              <button
                key={goal.id}
                onClick={() => toggleGoal(goal.id)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  isSelected
                    ? 'border-violet-500 bg-violet-500/20'
                    : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                }`}
              >
                <Icon className={`w-6 h-6 ${isSelected ? 'text-violet-400' : 'text-slate-400'}`} />
                <span className={`text-sm text-center ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                  {goal.label}
                </span>
                {isSelected && (
                  <Check className="w-4 h-4 text-violet-400" />
                )}
              </button>
            )
          })}
        </div>
      )
    },
    {
      id: 'notifications',
      title: 'Notificacoes',
      description: 'Receba lembretes e motivacao para manter seu progresso.',
      icon: <Bell className="w-12 h-12 text-violet-400" />,
      content: (
        <div className="space-y-4 mt-6">
          <div
            onClick={() => setNotificationsEnabled(true)}
            className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
              notificationsEnabled
                ? 'border-violet-500 bg-violet-500/20'
                : 'border-slate-700 bg-slate-800/50'
            }`}
          >
            <Bell className={`w-8 h-8 ${notificationsEnabled ? 'text-violet-400' : 'text-slate-400'}`} />
            <div className="flex-1">
              <p className="font-medium text-white">Ativar notificacoes</p>
              <p className="text-sm text-slate-400">Receba lembretes de treino, agua e muito mais</p>
            </div>
            {notificationsEnabled && <Check className="w-5 h-5 text-violet-400" />}
          </div>
          <div
            onClick={() => setNotificationsEnabled(false)}
            className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
              !notificationsEnabled
                ? 'border-violet-500 bg-violet-500/20'
                : 'border-slate-700 bg-slate-800/50'
            }`}
          >
            <Bell className={`w-8 h-8 ${!notificationsEnabled ? 'text-violet-400' : 'text-slate-400'}`} />
            <div className="flex-1">
              <p className="font-medium text-white">Nao, obrigado</p>
              <p className="text-sm text-slate-400">Voce pode ativar depois nas configuracoes</p>
            </div>
            {!notificationsEnabled && <Check className="w-5 h-5 text-violet-400" />}
          </div>
        </div>
      )
    },
    {
      id: 'terms',
      title: 'Termos e Privacidade',
      description: 'Para continuar, aceite nossos termos de uso e politica de privacidade.',
      icon: <Shield className="w-12 h-12 text-violet-400" />,
      content: (
        <div className="space-y-4 mt-6">
          <div
            onClick={() => setAcceptedTerms(!acceptedTerms)}
            className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
              acceptedTerms
                ? 'border-violet-500 bg-violet-500/20'
                : 'border-slate-700 bg-slate-800/50'
            }`}
          >
            <div className={`w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
              acceptedTerms ? 'bg-violet-500 border-violet-500' : 'border-slate-500'
            }`}>
              {acceptedTerms && <Check className="w-4 h-4 text-white" />}
            </div>
            <div className="flex-1">
              <p className="font-medium text-white">Termos de Uso</p>
              <p className="text-sm text-slate-400 mt-1">
                Li e aceito os{' '}
                <a href="/termos" target="_blank" className="text-violet-400 underline">
                  Termos de Uso
                </a>{' '}
                do FeliceFit.
              </p>
            </div>
          </div>

          <div
            onClick={() => setAcceptedPrivacy(!acceptedPrivacy)}
            className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
              acceptedPrivacy
                ? 'border-violet-500 bg-violet-500/20'
                : 'border-slate-700 bg-slate-800/50'
            }`}
          >
            <div className={`w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
              acceptedPrivacy ? 'bg-violet-500 border-violet-500' : 'border-slate-500'
            }`}>
              {acceptedPrivacy && <Check className="w-4 h-4 text-white" />}
            </div>
            <div className="flex-1">
              <p className="font-medium text-white">Politica de Privacidade</p>
              <p className="text-sm text-slate-400 mt-1">
                Li e aceito a{' '}
                <a href="/privacidade" target="_blank" className="text-violet-400 underline">
                  Politica de Privacidade
                </a>{' '}
                e o tratamento dos meus dados conforme a LGPD.
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-500 text-center mt-4">
            Versao dos Termos: {TERMS_VERSION} | Versao da Privacidade: {PRIVACY_VERSION}
          </p>
        </div>
      )
    }
  ]

  const canProceed = () => {
    switch (steps[currentStep].id) {
      case 'welcome':
        return true
      case 'goals':
        return goals.length > 0
      case 'notifications':
        return true
      case 'terms':
        return acceptedTerms && acceptedPrivacy
      default:
        return true
    }
  }

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      await completeOnboarding()
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const completeOnboarding = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goals,
          notificationsEnabled,
          termsVersion: TERMS_VERSION,
          privacyVersion: PRIVACY_VERSION
        })
      })

      const data = await response.json()

      if (data.success) {
        router.push('/dashboard')
      } else {
        console.error('Erro ao completar onboarding:', data.error)
      }
    } catch (error) {
      console.error('Erro:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-slate-800 z-50">
        <motion.div
          className="h-full bg-gradient-to-r from-violet-500 to-purple-500"
          initial={{ width: 0 }}
          animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col px-6 py-8 pt-12">
        {/* Step indicator */}
        <div className="flex justify-center gap-2 mb-8">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentStep
                  ? 'bg-violet-500'
                  : index < currentStep
                  ? 'bg-violet-400'
                  : 'bg-slate-700'
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex flex-col"
          >
            {/* Icon */}
            <div className="flex justify-center mb-6">
              {steps[currentStep].icon}
            </div>

            {/* Title & Description */}
            <h1 className="text-2xl font-bold text-white text-center mb-2">
              {steps[currentStep].title}
            </h1>
            <p className="text-slate-400 text-center mb-6">
              {steps[currentStep].description}
            </p>

            {/* Step content */}
            <div className="flex-1">
              {steps[currentStep].content}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="p-6 border-t border-slate-800">
        <div className="flex gap-4">
          {currentStep > 0 && (
            <button
              onClick={handleBack}
              className="flex-1 py-3 px-6 bg-slate-800 text-white rounded-xl font-medium hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
            >
              <ChevronLeft className="w-5 h-5" />
              Voltar
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={!canProceed() || saving}
            className={`flex-1 py-3 px-6 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${
              canProceed() && !saving
                ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-500 hover:to-purple-500'
                : 'bg-slate-700 text-slate-400 cursor-not-allowed'
            }`}
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Salvando...
              </>
            ) : currentStep === steps.length - 1 ? (
              <>
                Comecar
                <Check className="w-5 h-5" />
              </>
            ) : (
              <>
                Continuar
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
