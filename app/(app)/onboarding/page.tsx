"use client"

import { useState } from 'react'
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
      title: 'Bem-vindo ao Complexo Wellness!',
      description: 'Seu app completo de fitness e saude.',
      icon: <Logo size="lg" showText={false} />,
      content: (
        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col items-center gap-1 p-3 bg-white/50 rounded-xl">
            <Dumbbell className="w-6 h-6 text-dourado" />
            <span className="text-xs text-foreground-secondary">Treinos</span>
          </div>
          <div className="flex flex-col items-center gap-1 p-3 bg-white/50 rounded-xl">
            <Apple className="w-6 h-6 text-green-400" />
            <span className="text-xs text-foreground-secondary">Nutricao</span>
          </div>
          <div className="flex flex-col items-center gap-1 p-3 bg-white/50 rounded-xl">
            <Droplets className="w-6 h-6 text-blue-400" />
            <span className="text-xs text-foreground-secondary">Hidratacao</span>
          </div>
          <div className="flex flex-col items-center gap-1 p-3 bg-white/50 rounded-xl">
            <Moon className="w-6 h-6 text-indigo-400" />
            <span className="text-xs text-foreground-secondary">Sono</span>
          </div>
          <div className="flex flex-col items-center gap-1 p-3 bg-white/50 rounded-xl">
            <Trophy className="w-6 h-6 text-yellow-400" />
            <span className="text-xs text-foreground-secondary">Conquistas</span>
          </div>
          <div className="flex flex-col items-center gap-1 p-3 bg-white/50 rounded-xl">
            <Target className="w-6 h-6 text-orange-400" />
            <span className="text-xs text-foreground-secondary">Metas</span>
          </div>
        </div>
      )
    },
    {
      id: 'goals',
      title: 'Quais sao seus objetivos?',
      description: 'Selecione um ou mais objetivos para personalizarmos sua experiencia.',
      icon: <Target className="w-12 h-12 text-dourado" />,
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
                    ? 'border-dourado bg-dourado/20'
                    : 'border-border bg-white/50 hover:border-border'
                }`}
              >
                <Icon className={`w-6 h-6 ${isSelected ? 'text-dourado' : 'text-foreground-secondary'}`} />
                <span className={`text-sm text-center ${isSelected ? 'text-white' : 'text-foreground-secondary'}`}>
                  {goal.label}
                </span>
                {isSelected && (
                  <Check className="w-4 h-4 text-dourado" />
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
      icon: <Bell className="w-12 h-12 text-dourado" />,
      content: (
        <div className="space-y-4 mt-6">
          <div
            onClick={() => setNotificationsEnabled(true)}
            className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
              notificationsEnabled
                ? 'border-dourado bg-dourado/20'
                : 'border-border bg-white/50'
            }`}
          >
            <Bell className={`w-8 h-8 ${notificationsEnabled ? 'text-dourado' : 'text-foreground-secondary'}`} />
            <div className="flex-1">
              <p className="font-medium text-white">Ativar notificacoes</p>
              <p className="text-sm text-foreground-secondary">Receba lembretes de treino, agua e muito mais</p>
            </div>
            {notificationsEnabled && <Check className="w-5 h-5 text-dourado" />}
          </div>
          <div
            onClick={() => setNotificationsEnabled(false)}
            className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
              !notificationsEnabled
                ? 'border-dourado bg-dourado/20'
                : 'border-border bg-white/50'
            }`}
          >
            <Bell className={`w-8 h-8 ${!notificationsEnabled ? 'text-dourado' : 'text-foreground-secondary'}`} />
            <div className="flex-1">
              <p className="font-medium text-white">Nao, obrigado</p>
              <p className="text-sm text-foreground-secondary">Voce pode ativar depois nas configuracoes</p>
            </div>
            {!notificationsEnabled && <Check className="w-5 h-5 text-dourado" />}
          </div>
        </div>
      )
    },
    {
      id: 'terms',
      title: 'Termos e Privacidade',
      description: 'Para continuar, aceite nossos termos de uso e politica de privacidade.',
      icon: <Shield className="w-12 h-12 text-dourado" />,
      content: (
        <div className="space-y-4 mt-6">
          <div
            onClick={() => setAcceptedTerms(!acceptedTerms)}
            className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
              acceptedTerms
                ? 'border-dourado bg-dourado/20'
                : 'border-border bg-white/50'
            }`}
          >
            <div className={`w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
              acceptedTerms ? 'bg-dourado border-dourado' : 'border-border'
            }`}>
              {acceptedTerms && <Check className="w-4 h-4 text-white" />}
            </div>
            <div className="flex-1">
              <p className="font-medium text-white">Termos de Uso</p>
              <p className="text-sm text-foreground-secondary mt-1">
                Li e aceito os{' '}
                <a href="/termos" target="_blank" className="text-dourado underline">
                  Termos de Uso
                </a>{' '}
                do Complexo Wellness.
              </p>
            </div>
          </div>

          <div
            onClick={() => setAcceptedPrivacy(!acceptedPrivacy)}
            className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
              acceptedPrivacy
                ? 'border-dourado bg-dourado/20'
                : 'border-border bg-white/50'
            }`}
          >
            <div className={`w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
              acceptedPrivacy ? 'bg-dourado border-dourado' : 'border-border'
            }`}>
              {acceptedPrivacy && <Check className="w-4 h-4 text-white" />}
            </div>
            <div className="flex-1">
              <p className="font-medium text-white">Politica de Privacidade</p>
              <p className="text-sm text-foreground-secondary mt-1">
                Li e aceito a{' '}
                <a href="/privacidade" target="_blank" className="text-dourado underline">
                  Politica de Privacidade
                </a>{' '}
                e o tratamento dos meus dados conforme a LGPD.
              </p>
            </div>
          </div>

          <p className="text-xs text-foreground-muted text-center mt-4">
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

  const [error, setError] = useState<string | null>(null)

  const completeOnboarding = async () => {
    console.log('Iniciando completeOnboarding...')
    setSaving(true)
    setError(null)
    try {
      console.log('Enviando dados:', { goals, notificationsEnabled, termsVersion: TERMS_VERSION, privacyVersion: PRIVACY_VERSION })
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

      console.log('Response status:', response.status)
      const data = await response.json()
      console.log('Response data:', data)

      if (data.success) {
        console.log('Sucesso! Redirecionando...')
        // Usar window.location para forçar reload completo (bypass cache do middleware)
        window.location.href = '/dashboard'
        return // Evitar continuar execução
      } else {
        console.error('Erro ao completar onboarding:', data.error)
        setError(data.error || 'Erro ao salvar. Tente novamente.')
      }
    } catch (err) {
      console.error('Erro:', err)
      setError('Erro de conexao. Verifique sua internet.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-background flex flex-col z-[100]">
      {/* Safe area top spacer for iOS notch */}
      <div className="pt-safe bg-background" />

      {/* Progress bar */}
      <div className="h-1 bg-white">
        <motion.div
          className="h-full bg-gradient-to-r from-dourado to-dourado"
          initial={{ width: 0 }}
          animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Content - flex grow to fill space */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {/* Step indicator */}
        <div className="flex justify-center gap-2 mb-3">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentStep
                  ? 'bg-dourado'
                  : index < currentStep
                  ? 'bg-dourado'
                  : 'bg-background-elevated'
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
          >
            {/* Icon */}
            <div className="flex justify-center mb-3">
              {steps[currentStep].icon}
            </div>

            {/* Title & Description */}
            <h1 className="text-xl font-bold text-foreground text-center mb-1">
              {steps[currentStep].title}
            </h1>
            <p className="text-foreground-secondary text-center text-sm mb-3">
              {steps[currentStep].description}
            </p>

            {/* Step content */}
            <div>
              {steps[currentStep].content}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation - always visible at bottom */}
      <div className="p-4 pb-safe border-t border-border bg-background flex-shrink-0">
        {error && (
          <div className="mb-3 p-3 bg-red-500/20 border border-red-500 rounded-xl text-red-400 text-sm text-center">
            {error}
          </div>
        )}
        <div className="flex gap-3">
          {currentStep > 0 && (
            <button
              onClick={handleBack}
              className="flex-1 py-3 px-4 bg-background-elevated text-foreground rounded-xl font-medium hover:bg-background-elevated/80 transition-colors flex items-center justify-center gap-2"
            >
              <ChevronLeft className="w-5 h-5" />
              Voltar
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={!canProceed() || saving}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${
              canProceed() && !saving
                ? 'bg-gradient-to-r from-dourado to-dourado text-white hover:from-dourado/90 hover:to-dourado/80'
                : 'bg-background-elevated text-foreground-secondary cursor-not-allowed'
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
