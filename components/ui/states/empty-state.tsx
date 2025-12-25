'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { FadeIn } from '@/components/ui/animations/fade-in'
import { useReducedMotion } from '@/hooks/use-reduced-motion'

interface EmptyStateProps {
  icon: string
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
}: EmptyStateProps) {
  const prefersReducedMotion = useReducedMotion()

  const IconWrapper = prefersReducedMotion ? 'div' : motion.div

  return (
    <FadeIn className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <IconWrapper
        {...(!prefersReducedMotion && {
          initial: { scale: 0.8 },
          animate: { scale: 1 },
          transition: { type: 'spring', stiffness: 200, damping: 15 },
        })}
        className="text-6xl mb-4"
      >
        {icon}
      </IconWrapper>

      <h3 className="text-lg font-semibold text-foreground mb-2">
        {title}
      </h3>

      <p className="text-foreground-muted text-sm max-w-xs mb-6">
        {description}
      </p>

      {action && (
        <Button onClick={action.onClick} className="mb-2">
          {action.label}
        </Button>
      )}

      {secondaryAction && (
        <Button variant="ghost" onClick={secondaryAction.onClick}>
          {secondaryAction.label}
        </Button>
      )}
    </FadeIn>
  )
}

// Empty states pre-defined
export const EMPTY_STATES = {
  workouts: {
    icon: '🏋️',
    title: 'Nenhum treino ainda',
    description: 'Comece sua jornada fitness criando seu primeiro treino!',
  },
  meals: {
    icon: '🍽️',
    title: 'Nenhuma refeição registrada',
    description: 'Registre suas refeições para acompanhar sua nutrição.',
  },
  water: {
    icon: '💧',
    title: 'Nenhum registro de água',
    description: 'Mantenha-se hidratado! Registre sua ingestão de água.',
  },
  achievements: {
    icon: '🏆',
    title: 'Nenhuma conquista ainda',
    description: 'Continue treinando para desbloquear conquistas incríveis!',
  },
  photos: {
    icon: '📸',
    title: 'Nenhuma foto de progresso',
    description: 'Tire fotos para acompanhar sua evolução visual.',
  },
  insights: {
    icon: '💡',
    title: 'Sem insights ainda',
    description: 'Continue usando o app para receber insights personalizados.',
  },
  search: {
    icon: '🔍',
    title: 'Nenhum resultado encontrado',
    description: 'Tente buscar com outros termos.',
  },
  notifications: {
    icon: '🔔',
    title: 'Nenhuma notificação',
    description: 'Você está em dia! Todas as notificações foram lidas.',
  },
  exercises: {
    icon: '💪',
    title: 'Nenhum exercício',
    description: 'Adicione exercícios ao seu treino para começar.',
  },
  supplements: {
    icon: '💊',
    title: 'Nenhum suplemento',
    description: 'Adicione seus suplementos para acompanhar o uso.',
  },
  sleep: {
    icon: '😴',
    title: 'Nenhum registro de sono',
    description: 'Registre seu sono para melhorar sua recuperação.',
  },
  history: {
    icon: '📊',
    title: 'Sem histórico',
    description: 'Seus registros aparecerão aqui.',
  },
}
