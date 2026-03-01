'use client'

import { cn } from '@/lib/utils'
import { WidgetDailyProgress } from './widget-daily-progress'
import { WidgetWater } from './widget-water'
import { WidgetWorkout } from './widget-workout'
import { WidgetStreak } from './widget-streak'
import { WidgetMacros } from './widget-macros'
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
  macros: {
    protein: { current: 120, goal: 170 },
    carbs: { current: 180, goal: 250 },
    fat: { current: 55, goal: 80 },
    calories: { current: 1850, goal: 2500 },
  },
  goals: {
    goals: [
      { id: '1', name: 'Perder 5kg', current: 3.2, target: 5, unit: 'kg', deadline: new Date('2025-03-01') },
      { id: '2', name: 'Supino 100kg', current: 85, target: 100, unit: 'kg' },
      { id: '3', name: 'Correr 5km', current: 4.2, target: 5, unit: 'km' },
    ],
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
      case 'macros':
        return <WidgetMacros size={size} data={mockData.macros} />
      case 'goals':
        return <WidgetGoals size={size} data={mockData.goals} />
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
