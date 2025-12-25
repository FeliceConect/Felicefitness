'use client'

import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { WidgetDailyProgress } from './widget-daily-progress'
import { WidgetWater } from './widget-water'
import { WidgetWorkout } from './widget-workout'
import { WidgetStreak } from './widget-streak'
import { WidgetRevolade } from './widget-revolade'
import { WidgetMacros } from './widget-macros'
import { WidgetRecovery } from './widget-recovery'
import { WidgetGoals } from './widget-goals'
import type { WidgetType, WidgetSize } from '@/types/widgets'

interface WidgetPreviewProps {
  type: WidgetType
  size: WidgetSize
  className?: string
}

// Mock data for previews
const mockData = {
  'daily-progress': {
    score: 78,
    checklist: {
      workout: true,
      protein: true,
      water: false,
      revolade: true,
      sleep: true,
      calories: false,
    },
    streak: 12,
  },
  water: {
    current: 2100,
    goal: 3000,
    percentage: 70,
  },
  workout: {
    name: 'Upper + Core',
    scheduledTime: '05:00',
    duration: 60,
    exercises: 6,
    status: 'scheduled' as const,
  },
  streak: {
    current: 12,
    record: 45,
    nextMilestone: 14,
    daysToMilestone: 2,
  },
  revolade: {
    enabled: true,
    state: 'restriction' as const,
    takenToday: true,
    takenAt: new Date('2024-12-25T14:00:00'),
    schedule: '14:00',
    fastingStart: '12:00',
    restrictionEnd: '18:00',
    nextPhaseIn: 120,
    nextPhaseLabel: 'Liberado',
  },
  macros: {
    protein: { current: 120, goal: 170 },
    carbs: { current: 180, goal: 250 },
    fat: { current: 55, goal: 80 },
    calories: { current: 1850, goal: 2500 },
  },
  recovery: {
    score: 82,
    muscleGroups: [
      { name: 'Peito', status: 'recovered' as const, percentage: 95 },
      { name: 'Costas', status: 'recovering' as const, percentage: 75 },
      { name: 'Pernas', status: 'fatigued' as const, percentage: 45 },
      { name: 'Ombros', status: 'recovered' as const, percentage: 90 },
    ],
    suggestion: 'Evite treinar pernas hoje. Foque em upper body.',
  },
  goals: {
    goals: [
      { id: '1', name: 'Perder 5kg', current: 3.2, target: 5, unit: 'kg', deadline: new Date('2025-03-01') },
      { id: '2', name: 'Supino 100kg', current: 85, target: 100, unit: 'kg' },
      { id: '3', name: 'Correr 5km', current: 4.2, target: 5, unit: 'km' },
    ],
  },
  'coach-tip': {
    tip: 'Considere aumentar a carga no supino!',
  },
}

export function WidgetPreview({ type, size, className }: WidgetPreviewProps) {
  const renderWidget = () => {
    switch (type) {
      case 'daily-progress':
        return <WidgetDailyProgress size={size} data={mockData['daily-progress']} />
      case 'water':
        return <WidgetWater size={size} data={mockData.water} interactive={false} />
      case 'workout':
        return <WidgetWorkout size={size} data={mockData.workout} />
      case 'streak':
        return <WidgetStreak size={size} data={mockData.streak} />
      case 'revolade':
        return <WidgetRevolade size={size} data={mockData.revolade} />
      case 'macros':
        return <WidgetMacros size={size} data={mockData.macros} />
      case 'recovery':
        return <WidgetRecovery size={size} data={mockData.recovery} />
      case 'goals':
        return <WidgetGoals size={size} data={mockData.goals} />
      case 'coach-tip':
        return (
          <Card className="p-4 bg-card/50 backdrop-blur border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">💡</span>
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                Dica do Coach
              </span>
            </div>
            <p className="text-sm text-purple-300">{mockData['coach-tip'].tip}</p>
          </Card>
        )
      default:
        return null
    }
  }

  return (
    <div className={cn('pointer-events-none select-none', className)}>
      {renderWidget()}
    </div>
  )
}
