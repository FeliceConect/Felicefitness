'use client'

import { Button } from '@/components/ui/button'
import type { CoachAction } from '@/types/coach'
import { ACTION_LABELS } from '@/types/coach'
import {
  Droplets,
  Dumbbell,
  UtensilsCrossed,
  BarChart3,
  Target,
  Pill,
  History,
  ArrowRight,
} from 'lucide-react'

interface CoachActionButtonProps {
  action: CoachAction
  onClick: () => void
}

const actionIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  log_water: Droplets,
  start_workout: Dumbbell,
  log_meal: UtensilsCrossed,
  show_report: BarChart3,
  adjust_goal: Target,
  log_supplement: Pill,
  show_history: History,
  navigate: ArrowRight,
}

export function CoachActionButton({ action, onClick }: CoachActionButtonProps) {
  const Icon = actionIcons[action.type] || ArrowRight
  const label = action.label || ACTION_LABELS[action.type] || 'Ação'

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className="h-8 text-xs gap-1.5"
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </Button>
  )
}
