'use client'

import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dumbbell, Play, Check, Calendar, Clock } from 'lucide-react'
import type { WidgetSize, WorkoutWidgetData } from '@/types/widgets'

interface WidgetWorkoutProps {
  size: WidgetSize
  data: WorkoutWidgetData
  onStart?: () => void
  onClick?: () => void
}

export function WidgetWorkout({ size, data, onStart, onClick }: WidgetWorkoutProps) {
  const { name, scheduledTime, duration, exercises, status, completedAt } = data

  const getStatusColor = () => {
    switch (status) {
      case 'completed':
        return 'text-green-400'
      case 'in_progress':
        return 'text-yellow-400'
      case 'rest_day':
        return 'text-blue-400'
      default:
        return 'text-purple-400'
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return <Check className="w-4 h-4 text-green-400" />
      case 'in_progress':
        return <Play className="w-4 h-4 text-yellow-400" />
      case 'rest_day':
        return <Calendar className="w-4 h-4 text-blue-400" />
      default:
        return <Dumbbell className="w-4 h-4 text-purple-400" />
    }
  }

  const getStatusLabel = () => {
    switch (status) {
      case 'completed':
        return completedAt
          ? `Concluido as ${completedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
          : 'Concluido'
      case 'in_progress':
        return 'Em andamento'
      case 'rest_day':
        return 'Dia de descanso'
      default:
        return scheduledTime ? `Hoje, ${scheduledTime}` : 'Agendado'
    }
  }

  if (size === 'small') {
    return (
      <Card
        className={cn(
          'relative overflow-hidden bg-card/50 backdrop-blur border-border/50 p-3 cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]'
        )}
        onClick={onClick}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center',
              status === 'completed' && 'bg-green-500/20',
              status === 'in_progress' && 'bg-yellow-500/20',
              status === 'rest_day' && 'bg-blue-500/20',
              status === 'scheduled' && 'bg-purple-500/20'
            )}
          >
            {getStatusIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <p className={cn('text-sm font-medium truncate', getStatusColor())}>
              {status === 'rest_day' ? 'Descanso' : name}
            </p>
            <p className="text-xs text-muted-foreground">{exercises} exercicios</p>
          </div>
        </div>
      </Card>
    )
  }

  if (size === 'medium') {
    return (
      <Card
        className={cn(
          'relative overflow-hidden bg-card/50 backdrop-blur border-border/50 p-4 cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]'
        )}
        onClick={onClick}
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                Proximo Treino
              </span>
            </div>
            {getStatusIcon()}
          </div>

          <div>
            <p className={cn('text-lg font-bold', getStatusColor())}>
              {status === 'rest_day' ? 'Dia de Descanso' : name}
            </p>
            <p className="text-sm text-muted-foreground">{getStatusLabel()}</p>
          </div>

          {status !== 'rest_day' && (
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Dumbbell className="w-3 h-3" />
                {exercises} exercicios
              </span>
              {duration && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {duration}min
                </span>
              )}
            </div>
          )}

          {status === 'scheduled' && onStart && (
            <Button
              size="sm"
              className="w-full h-9 bg-purple-600 hover:bg-purple-700 text-white"
              onClick={(e) => {
                e.stopPropagation()
                onStart()
              }}
            >
              <Play className="w-4 h-4 mr-2" />
              Iniciar Treino
            </Button>
          )}
        </div>
      </Card>
    )
  }

  // Large size
  return (
    <Card
      className={cn(
        'relative overflow-hidden bg-card/50 backdrop-blur border-border/50 p-5 cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]'
      )}
      onClick={onClick}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-purple-400" />
            <span className="text-sm text-muted-foreground font-medium uppercase tracking-wide">
              Proximo Treino
            </span>
          </div>
          <div
            className={cn(
              'px-2 py-1 rounded-full text-xs font-medium',
              status === 'completed' && 'bg-green-500/20 text-green-400',
              status === 'in_progress' && 'bg-yellow-500/20 text-yellow-400',
              status === 'rest_day' && 'bg-blue-500/20 text-blue-400',
              status === 'scheduled' && 'bg-purple-500/20 text-purple-400'
            )}
          >
            {status === 'completed' && 'Concluido'}
            {status === 'in_progress' && 'Em andamento'}
            {status === 'rest_day' && 'Descanso'}
            {status === 'scheduled' && 'Agendado'}
          </div>
        </div>

        <div className="text-center py-4">
          <div
            className={cn(
              'w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-3',
              status === 'completed' && 'bg-green-500/20',
              status === 'in_progress' && 'bg-yellow-500/20',
              status === 'rest_day' && 'bg-blue-500/20',
              status === 'scheduled' && 'bg-purple-500/20'
            )}
          >
            {status === 'rest_day' ? (
              <span className="text-3xl">🛌</span>
            ) : (
              <Dumbbell className={cn('w-8 h-8', getStatusColor())} />
            )}
          </div>
          <p className={cn('text-xl font-bold', getStatusColor())}>
            {status === 'rest_day' ? 'Dia de Descanso' : name}
          </p>
          <p className="text-sm text-muted-foreground mt-1">{getStatusLabel()}</p>
        </div>

        {status !== 'rest_day' && (
          <div className="flex justify-center gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Dumbbell className="w-4 h-4" />
              {exercises} exercicios
            </span>
            {duration && (
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {duration}min
              </span>
            )}
          </div>
        )}

        {status === 'scheduled' && onStart && (
          <Button
            size="lg"
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            onClick={(e) => {
              e.stopPropagation()
              onStart()
            }}
          >
            <Play className="w-5 h-5 mr-2" />
            Iniciar Treino
          </Button>
        )}
      </div>
    </Card>
  )
}
