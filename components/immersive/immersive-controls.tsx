'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Pause, X, Settings } from 'lucide-react'

interface ImmersiveControlsProps {
  onPause: () => void
  onExit: () => void
  onSettings?: () => void
  className?: string
}

export function ImmersiveControls({
  onPause,
  onExit,
  onSettings,
  className,
}: ImmersiveControlsProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between w-full',
        className
      )}
    >
      {/* Exit button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onExit}
        className="h-10 w-10 text-muted-foreground"
      >
        <X className="h-5 w-5" />
        <span className="sr-only">Sair</span>
      </Button>

      <div className="flex items-center gap-2">
        {/* Settings button */}
        {onSettings && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onSettings}
            className="h-10 w-10 text-muted-foreground"
          >
            <Settings className="h-5 w-5" />
            <span className="sr-only">Configurações</span>
          </Button>
        )}

        {/* Pause button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onPause}
          className="h-10 w-10 text-muted-foreground"
        >
          <Pause className="h-5 w-5" />
          <span className="sr-only">Pausar</span>
        </Button>
      </div>
    </div>
  )
}
