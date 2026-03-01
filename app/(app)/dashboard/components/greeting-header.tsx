"use client"

import { motion } from 'framer-motion'
import { getGreeting, formatDatePtBr } from '@/lib/utils/date'
import { IconBadge } from '@/components/shared'

interface GreetingHeaderProps {
  userName: string
  currentPhase?: 'base' | 'construcao' | 'pico'
}

const phaseLabels = {
  base: { icon: '🏗️', label: 'Fase Base' },
  construcao: { icon: '💪', label: 'Fase Construção' },
  pico: { icon: '🔥', label: 'Fase Pico' }
}

export function GreetingHeader({ userName, currentPhase = 'base' }: GreetingHeaderProps) {
  const greeting = getGreeting()
  const today = new Date()
  const formattedDate = formatDatePtBr(today)
  const phase = phaseLabels[currentPhase]

  // Pegar primeiro nome
  const firstName = userName.split(' ')[0]

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="px-4 pt-4 pb-2"
    >
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {greeting}, {firstName}!
          </h1>
          <p className="text-foreground-secondary text-sm mt-1 capitalize">
            {formattedDate}
          </p>
        </div>
        <IconBadge
          icon={phase.icon}
          label={phase.label}
          variant="info"
          size="sm"
        />
      </div>
    </motion.div>
  )
}
