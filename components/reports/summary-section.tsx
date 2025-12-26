'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
  Dumbbell,
  Utensils,
  Droplets,
  Scale,
  Trophy
} from 'lucide-react'
import { formatDuration, formatNumber } from '@/lib/reports'
import type { PeriodSummary } from '@/types/reports'

interface SummarySectionProps {
  summary: PeriodSummary
  className?: string
}

export function SummarySection({ summary, className }: SummarySectionProps) {
  return (
    <div className={cn('grid gap-4 md:grid-cols-2 lg:grid-cols-4', className)}>
      {/* Treino */}
      <SummaryCard
        title="Treino"
        icon={<Dumbbell className="h-4 w-4" />}
        iconColor="text-violet-500"
        iconBg="bg-violet-500/10"
        items={[
          { label: 'Treinos', value: `${summary.workouts.completed}/${summary.workouts.planned}` },
          { label: 'Taxa de conclusão', value: `${summary.workouts.completionRate}%` },
          { label: 'Tempo total', value: formatDuration(summary.workouts.totalMinutes) },
          { label: 'PRs batidos', value: summary.workouts.prsCount.toString() }
        ]}
      />

      {/* Nutrição */}
      <SummaryCard
        title="Nutrição"
        icon={<Utensils className="h-4 w-4" />}
        iconColor="text-orange-500"
        iconBg="bg-orange-500/10"
        items={[
          { label: 'Média kcal', value: formatNumber(Math.round(summary.nutrition.avgCalories)) },
          { label: 'Média proteína', value: `${Math.round(summary.nutrition.avgProtein)}g` },
          { label: 'Dias na meta kcal', value: `${summary.nutrition.daysOnCalorieTarget}/7` },
          { label: 'Dias na meta prot', value: `${summary.nutrition.daysOnProteinTarget}/7` }
        ]}
      />

      {/* Hidratação */}
      <SummaryCard
        title="Hidratação"
        icon={<Droplets className="h-4 w-4" />}
        iconColor="text-blue-500"
        iconBg="bg-blue-500/10"
        items={[
          { label: 'Média diária', value: `${summary.hydration.avgDaily.toFixed(1)}L` },
          { label: 'Total período', value: `${summary.hydration.totalLiters.toFixed(1)}L` },
          { label: 'Dias na meta', value: `${summary.hydration.daysOnTarget}/7` },
          { label: 'Taxa de meta', value: `${summary.hydration.targetRate}%` }
        ]}
      />

      {/* Corpo */}
      <SummaryCard
        title="Corpo"
        icon={<Scale className="h-4 w-4" />}
        iconColor="text-green-500"
        iconBg="bg-green-500/10"
        items={[
          {
            label: 'Peso',
            value: summary.body.weightChange !== null
              ? `${summary.body.weightChange > 0 ? '+' : ''}${summary.body.weightChange.toFixed(1)}kg`
              : summary.body.endWeight !== null
                ? `${summary.body.endWeight.toFixed(1)}kg`
                : '-'
          },
          {
            label: 'Gordura',
            value: summary.body.fatChange !== null
              ? `${summary.body.fatChange > 0 ? '+' : ''}${summary.body.fatChange.toFixed(1)}%`
              : summary.body.endFat !== null
                ? `${summary.body.endFat.toFixed(1)}%`
                : '-'
          },
          {
            label: 'Músculo',
            value: summary.body.muscleChange !== null
              ? `${summary.body.muscleChange > 0 ? '+' : ''}${summary.body.muscleChange.toFixed(1)}kg`
              : summary.body.endMuscle !== null
                ? `${summary.body.endMuscle.toFixed(1)}kg`
                : '-'
          },
          { label: '', value: '' }
        ]}
      />
    </div>
  )
}

// Individual summary card
interface SummaryCardProps {
  title: string
  icon: React.ReactNode
  iconColor: string
  iconBg: string
  items: { label: string; value: string }[]
  className?: string
}

export function SummaryCard({
  title,
  icon,
  iconColor,
  iconBg,
  items,
  className
}: SummaryCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <div className={cn('p-1.5 rounded-md', iconBg, iconColor)}>
            {icon}
          </div>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {items.filter(i => i.label).map((item, index) => (
            <div key={index} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{item.label}</span>
              <span className="font-medium">{item.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Gamification summary
interface GamificationSummaryProps {
  xpGained: number
  levelsGained: number
  achievementsUnlocked: number
  currentStreak: number
  bestStreak: number
  className?: string
}

export function GamificationSummary({
  xpGained,
  levelsGained,
  achievementsUnlocked,
  currentStreak,
  bestStreak,
  className
}: GamificationSummaryProps) {
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-500">
            <Trophy className="h-4 w-4" />
          </div>
          Gamificação
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-2xl font-bold text-violet-500">
              +{formatNumber(xpGained)}
            </p>
            <p className="text-xs text-muted-foreground">XP ganho</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-500">
              +{levelsGained}
            </p>
            <p className="text-xs text-muted-foreground">níveis</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-amber-500">
              {achievementsUnlocked}
            </p>
            <p className="text-xs text-muted-foreground">conquistas</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-orange-500">
              {currentStreak}
            </p>
            <p className="text-xs text-muted-foreground">
              streak {bestStreak > currentStreak && `(best: ${bestStreak})`}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
