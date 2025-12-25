"use client"

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface QuickAction {
  icon: string
  label: string
  href?: string
  onClick?: () => void
  variant?: 'default' | 'primary'
}

interface QuickActionsProps {
  onAddWater?: () => void
  onAddMeal?: () => void
  onTakePhoto?: () => void
  onOpenCoach?: () => void
}

export function QuickActions({
  onAddWater,
  onAddMeal,
  onTakePhoto,
  onOpenCoach
}: QuickActionsProps) {
  const router = useRouter()

  const actions: QuickAction[] = [
    {
      icon: '💧',
      label: 'Água',
      onClick: onAddWater,
      variant: 'default'
    },
    {
      icon: '🍽️',
      label: 'Refeição',
      href: '/alimentacao/refeicao/nova',
      onClick: onAddMeal
    },
    {
      icon: '📸',
      label: 'Foto',
      href: '/progresso/foto',
      onClick: onTakePhoto
    },
    {
      icon: '💬',
      label: 'Coach',
      href: '/coach',
      onClick: onOpenCoach,
      variant: 'primary'
    }
  ]

  const handleClick = (action: QuickAction) => {
    if (action.onClick) {
      action.onClick()
    } else if (action.href) {
      router.push(action.href)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.6 }}
      className="grid grid-cols-4 gap-3"
    >
      {actions.map((action, index) => (
        <motion.button
          key={action.label}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.6 + index * 0.05 }}
          onClick={() => handleClick(action)}
          className={cn(
            'flex flex-col items-center justify-center py-3 rounded-xl',
            'transition-colors duration-200',
            action.variant === 'primary'
              ? 'bg-gradient-to-br from-violet-500/20 to-cyan-500/10 border border-violet-500/30 hover:border-violet-500/50'
              : 'bg-[#14141F] border border-[#2E2E3E] hover:border-[#3E3E4E] hover:bg-[#1E1E2E]'
          )}
        >
          <span className="text-2xl mb-1">{action.icon}</span>
          <span className="text-xs text-slate-400">{action.label}</span>
        </motion.button>
      ))}
    </motion.div>
  )
}
