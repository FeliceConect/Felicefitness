'use client'

import { Dumbbell, Utensils, Trophy, Calendar, Camera, Target } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface ProfileStatsProps {
  stats: {
    treinos_total?: number
    treinos_mes?: number
    prs_total?: number
    dias_registrados?: number
    streak_maximo?: number
    conquistas?: number
    fotos?: number
  }
  className?: string
}

export function ProfileStats({ stats, className }: ProfileStatsProps) {
  const items = [
    {
      label: 'Treinos total',
      value: stats.treinos_total || 0,
      icon: Dumbbell,
      color: 'text-blue-500'
    },
    {
      label: 'Treinos este mês',
      value: stats.treinos_mes || 0,
      icon: Calendar,
      color: 'text-green-500'
    },
    {
      label: 'Recordes pessoais',
      value: stats.prs_total || 0,
      icon: Trophy,
      color: 'text-yellow-500'
    },
    {
      label: 'Dias registrados',
      value: stats.dias_registrados || 0,
      icon: Target,
      color: 'text-purple-500'
    },
    {
      label: 'Maior streak',
      value: `${stats.streak_maximo || 0} dias`,
      icon: Utensils,
      color: 'text-orange-500'
    },
    {
      label: 'Conquistas',
      value: stats.conquistas || 0,
      icon: Trophy,
      color: 'text-amber-500'
    },
    {
      label: 'Fotos de progresso',
      value: stats.fotos || 0,
      icon: Camera,
      color: 'text-pink-500'
    }
  ]

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Estatísticas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {items.map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <div className={cn('p-2 rounded-lg bg-muted', item.color)}>
                <item.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-lg font-semibold">{item.value}</p>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
