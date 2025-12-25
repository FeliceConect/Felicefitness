'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { formatSleepDuration } from '@/lib/sleep/calculations'
import { Clock, Star, Target, TrendingUp } from 'lucide-react'

interface SleepStatsCardProps {
  avgDuration: number
  avgQuality: number
  daysOnGoal: number
  totalDays: number
  className?: string
}

export function SleepStatsCard({
  avgDuration,
  avgQuality,
  daysOnGoal,
  totalDays,
  className,
}: SleepStatsCardProps) {
  const goalPercentage = totalDays > 0 ? Math.round((daysOnGoal / totalDays) * 100) : 0

  return (
    <Card className={cn(className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Esta Semana</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <StatItem
            icon={<Clock className="h-4 w-4" />}
            label="Média de sono"
            value={formatSleepDuration(avgDuration)}
          />
          <StatItem
            icon={<Star className="h-4 w-4" />}
            label="Qualidade média"
            value={`${avgQuality.toFixed(1)}/5`}
          />
          <StatItem
            icon={<Target className="h-4 w-4" />}
            label="Dias na meta"
            value={`${daysOnGoal}/${totalDays}`}
          />
          <StatItem
            icon={<TrendingUp className="h-4 w-4" />}
            label="Taxa de sucesso"
            value={`${goalPercentage}%`}
          />
        </div>
      </CardContent>
    </Card>
  )
}

interface StatItemProps {
  icon: React.ReactNode
  label: string
  value: string
}

function StatItem({ icon, label, value }: StatItemProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  )
}
