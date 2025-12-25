'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Pill, Check, Clock, AlertTriangle, Coffee } from 'lucide-react'
import type { WidgetSize, RevoladeWidgetData, RevoladeState } from '@/types/widgets'

interface WidgetRevoladeProps {
  size: WidgetSize
  data: RevoladeWidgetData
  onMarkTaken?: () => void
  onClick?: () => void
}

export function WidgetRevolade({ size, data, onMarkTaken, onClick }: WidgetRevoladeProps) {
  const { state, takenToday, takenAt, schedule, fastingStart, restrictionEnd, nextPhaseIn, nextPhaseLabel } = data
  const [timeRemaining, setTimeRemaining] = useState(nextPhaseIn)

  useEffect(() => {
    if (timeRemaining <= 0) return

    const timer = setInterval(() => {
      setTimeRemaining((prev) => Math.max(0, prev - 1))
    }, 60000) // Update every minute

    return () => clearInterval(timer)
  }, [timeRemaining])

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}min`
    }
    return `${mins}min`
  }

  const getStateConfig = (currentState: RevoladeState) => {
    switch (currentState) {
      case 'before_fast':
        return {
          icon: <Coffee className="w-5 h-5 text-green-400" />,
          title: 'Pode comer!',
          subtitle: `Jejum comeca as ${fastingStart}`,
          color: 'text-green-400',
          bgColor: 'bg-green-500/20',
          borderColor: 'border-green-500/30',
        }
      case 'fasting':
        return {
          icon: <AlertTriangle className="w-5 h-5 text-yellow-400" />,
          title: 'Jejum',
          subtitle: `Revolade as ${schedule}`,
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-500/20',
          borderColor: 'border-yellow-500/30',
        }
      case 'take_now':
        return {
          icon: <Pill className="w-5 h-5 text-red-400 animate-bounce" />,
          title: 'TOME AGORA!',
          subtitle: 'Hora do Revolade',
          color: 'text-red-400',
          bgColor: 'bg-red-500/20',
          borderColor: 'border-red-500/50',
        }
      case 'restriction':
        return {
          icon: <Clock className="w-5 h-5 text-orange-400" />,
          title: 'Sem laticinios',
          subtitle: `Liberado as ${restrictionEnd}`,
          color: 'text-orange-400',
          bgColor: 'bg-orange-500/20',
          borderColor: 'border-orange-500/30',
        }
      case 'free':
        return {
          icon: <Check className="w-5 h-5 text-green-400" />,
          title: 'Tudo liberado!',
          subtitle: takenAt
            ? `Tomado as ${takenAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
            : 'Dia completo',
          color: 'text-green-400',
          bgColor: 'bg-green-500/20',
          borderColor: 'border-green-500/30',
        }
    }
  }

  const config = getStateConfig(state)

  if (size === 'small') {
    return (
      <Card
        className={cn(
          'relative overflow-hidden bg-card/50 backdrop-blur border-border/50 p-3 cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]',
          config.borderColor
        )}
        onClick={onClick}
      >
        <div className="flex items-center gap-3">
          <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', config.bgColor)}>
            {config.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className={cn('text-sm font-medium truncate', config.color)}>{config.title}</p>
            {timeRemaining > 0 && (
              <p className="text-xs text-muted-foreground">{formatTime(timeRemaining)}</p>
            )}
          </div>
          {takenToday && <Check className="w-4 h-4 text-green-400" />}
        </div>
      </Card>
    )
  }

  if (size === 'medium') {
    return (
      <Card
        className={cn(
          'relative overflow-hidden bg-card/50 backdrop-blur p-4 cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]',
          config.borderColor,
          'border'
        )}
        onClick={onClick}
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Pill className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                Revolade
              </span>
            </div>
            {takenToday && (
              <span className="flex items-center gap-1 text-xs text-green-400">
                <Check className="w-3 h-3" />
                Tomado
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className={cn('w-12 h-12 rounded-full flex items-center justify-center', config.bgColor)}>
              {config.icon}
            </div>
            <div>
              <p className={cn('text-lg font-bold', config.color)}>{config.title}</p>
              <p className="text-sm text-muted-foreground">{config.subtitle}</p>
            </div>
          </div>

          {/* Timeline */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{fastingStart}</span>
              <span>{schedule}</span>
              <span>{restrictionEnd}</span>
            </div>
            <div className="relative h-2 bg-muted/30 rounded-full overflow-hidden">
              <div
                className={cn(
                  'absolute inset-y-0 left-0 rounded-full transition-all duration-500',
                  state === 'before_fast' && 'bg-green-500 w-[10%]',
                  state === 'fasting' && 'bg-yellow-500 w-[40%]',
                  state === 'take_now' && 'bg-red-500 w-[50%]',
                  state === 'restriction' && 'bg-orange-500 w-[80%]',
                  state === 'free' && 'bg-green-500 w-full'
                )}
              />
            </div>
          </div>

          {state === 'take_now' && !takenToday && onMarkTaken && (
            <Button
              size="sm"
              className="w-full h-9 bg-red-600 hover:bg-red-700 text-white animate-pulse"
              onClick={(e) => {
                e.stopPropagation()
                onMarkTaken()
              }}
            >
              <Pill className="w-4 h-4 mr-2" />
              Marcar como tomado
            </Button>
          )}

          {timeRemaining > 0 && state !== 'free' && (
            <p className="text-center text-sm text-muted-foreground">
              {nextPhaseLabel} em <span className={config.color}>{formatTime(timeRemaining)}</span>
            </p>
          )}
        </div>
      </Card>
    )
  }

  // Large size
  return (
    <Card
      className={cn(
        'relative overflow-hidden bg-card/50 backdrop-blur p-5 cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]',
        config.borderColor,
        'border'
      )}
      onClick={onClick}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Pill className="w-5 h-5 text-purple-400" />
            <span className="text-sm text-muted-foreground font-medium uppercase tracking-wide">
              Revolade
            </span>
          </div>
          {takenToday && (
            <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/20 text-xs text-green-400">
              <Check className="w-3 h-3" />
              Tomado
            </span>
          )}
        </div>

        <div className="text-center py-4">
          <div className={cn('w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-3', config.bgColor)}>
            {state === 'take_now' ? (
              <Pill className="w-8 h-8 text-red-400 animate-bounce" />
            ) : (
              <span className="text-3xl">💊</span>
            )}
          </div>
          <p className={cn('text-2xl font-bold', config.color)}>{config.title}</p>
          <p className="text-sm text-muted-foreground mt-1">{config.subtitle}</p>
        </div>

        {/* Detailed Timeline */}
        <div className="space-y-3 bg-muted/10 rounded-lg p-4">
          <div className="flex justify-between text-xs">
            <div className={cn('text-center', state === 'before_fast' && 'text-green-400')}>
              <p className="font-medium">Pode comer</p>
              <p className="text-muted-foreground">ate {fastingStart}</p>
            </div>
            <div className={cn('text-center', state === 'fasting' && 'text-yellow-400')}>
              <p className="font-medium">Jejum</p>
              <p className="text-muted-foreground">{fastingStart}-{schedule}</p>
            </div>
            <div className={cn('text-center', state === 'take_now' && 'text-red-400')}>
              <p className="font-medium">Revolade</p>
              <p className="text-muted-foreground">{schedule}</p>
            </div>
            <div className={cn('text-center', state === 'restriction' && 'text-orange-400')}>
              <p className="font-medium">Restricao</p>
              <p className="text-muted-foreground">ate {restrictionEnd}</p>
            </div>
          </div>

          <div className="relative h-3 bg-muted/30 rounded-full overflow-hidden">
            <div
              className={cn(
                'absolute inset-y-0 left-0 rounded-full transition-all duration-500',
                state === 'before_fast' && 'bg-gradient-to-r from-green-500 to-green-400 w-[15%]',
                state === 'fasting' && 'bg-gradient-to-r from-green-500 via-yellow-500 to-yellow-400 w-[40%]',
                state === 'take_now' && 'bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 w-[50%]',
                state === 'restriction' && 'bg-gradient-to-r from-green-500 via-yellow-500 via-red-500 to-orange-400 w-[80%]',
                state === 'free' && 'bg-gradient-to-r from-green-500 via-yellow-500 via-red-500 via-orange-500 to-green-400 w-full'
              )}
            />
            {/* Current position marker */}
            <div
              className={cn(
                'absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white shadow-lg transition-all duration-500',
                config.bgColor,
                state === 'before_fast' && 'left-[15%]',
                state === 'fasting' && 'left-[40%]',
                state === 'take_now' && 'left-[50%]',
                state === 'restriction' && 'left-[80%]',
                state === 'free' && 'left-[95%]'
              )}
            />
          </div>
        </div>

        {/* Restrictions info */}
        {state === 'restriction' && (
          <div className="bg-orange-500/10 rounded-lg p-3 border border-orange-500/30">
            <p className="text-xs font-medium text-orange-400 mb-2">Evitar ate {restrictionEnd}:</p>
            <div className="flex flex-wrap gap-2">
              {['Leite', 'Queijo', 'Iogurte', 'Whey com leite'].map((item) => (
                <span key={item} className="text-xs px-2 py-1 rounded-full bg-orange-500/20 text-orange-300">
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}

        {state === 'free' && (
          <div className="bg-green-500/10 rounded-lg p-3 border border-green-500/30">
            <p className="text-xs font-medium text-green-400 mb-2">Liberado:</p>
            <div className="flex flex-wrap gap-2">
              {['Whey com leite', 'Iogurte', 'Queijo', 'Tudo!'].map((item) => (
                <span key={item} className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-300">
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}

        {state === 'take_now' && !takenToday && onMarkTaken && (
          <Button
            size="lg"
            className="w-full bg-red-600 hover:bg-red-700 text-white animate-pulse"
            onClick={(e) => {
              e.stopPropagation()
              onMarkTaken()
            }}
          >
            <Pill className="w-5 h-5 mr-2" />
            Marcar como tomado
          </Button>
        )}

        {timeRemaining > 0 && state !== 'free' && (
          <p className="text-center text-sm text-muted-foreground">
            {nextPhaseLabel} em <span className={cn('font-medium', config.color)}>{formatTime(timeRemaining)}</span>
          </p>
        )}
      </div>
    </Card>
  )
}
