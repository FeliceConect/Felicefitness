'use client'

import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Droplets, Plus } from 'lucide-react'
import type { WidgetSize, WaterWidgetData } from '@/types/widgets'

interface WidgetWaterProps {
  size: WidgetSize
  data: WaterWidgetData
  onAdd?: (amount: number) => void
  interactive?: boolean
}

export function WidgetWater({ size, data, onAdd, interactive = true }: WidgetWaterProps) {
  const { current, goal, percentage } = data

  const getWaterColor = () => {
    if (percentage >= 100) return 'from-blue-400 to-cyan-400'
    if (percentage >= 70) return 'from-blue-500 to-blue-400'
    if (percentage >= 50) return 'from-blue-600 to-blue-500'
    return 'from-blue-700 to-blue-600'
  }

  if (size === 'small') {
    return (
      <Card
        className={cn(
          'relative overflow-hidden bg-card/50 backdrop-blur border-border/50 p-3',
          interactive && onAdd && 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]'
        )}
        onClick={interactive && onAdd ? () => onAdd(250) : undefined}
      >
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
            <Droplets className="w-5 h-5 text-blue-400" />
            <div
              className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-500 to-blue-400 rounded-b-full transition-all duration-500"
              style={{ height: `${Math.min(100, percentage)}%` }}
            />
          </div>
          <div>
            <p className="text-lg font-bold text-blue-400">
              {(current / 1000).toFixed(1)}L
            </p>
            <p className="text-xs text-muted-foreground">{percentage}%</p>
          </div>
        </div>
      </Card>
    )
  }

  // Medium size
  return (
    <Card className="relative overflow-hidden bg-card/50 backdrop-blur border-border/50 p-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Droplets className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              Agua
            </span>
          </div>
          <span className="text-sm font-medium text-blue-400">{percentage}%</span>
        </div>

        <div className="space-y-2">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-blue-400">
              {(current / 1000).toFixed(1)}
            </span>
            <span className="text-sm text-muted-foreground">
              / {(goal / 1000).toFixed(1)}L
            </span>
          </div>

          <div className="relative h-3 bg-muted/30 rounded-full overflow-hidden">
            <div
              className={cn(
                'absolute inset-y-0 left-0 bg-gradient-to-r rounded-full transition-all duration-500',
                getWaterColor()
              )}
              style={{ width: `${Math.min(100, percentage)}%` }}
            >
              {/* Wave animation */}
              <div className="absolute inset-0 opacity-30">
                <div
                  className="absolute inset-0 animate-pulse"
                  style={{
                    background:
                      'repeating-linear-gradient(90deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)',
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {interactive && onAdd && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-8 text-xs border-blue-500/30 hover:bg-blue-500/10"
              onClick={(e) => {
                e.stopPropagation()
                onAdd(250)
              }}
            >
              <Plus className="w-3 h-3 mr-1" />
              250ml
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-8 text-xs border-blue-500/30 hover:bg-blue-500/10"
              onClick={(e) => {
                e.stopPropagation()
                onAdd(500)
              }}
            >
              <Plus className="w-3 h-3 mr-1" />
              500ml
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}
