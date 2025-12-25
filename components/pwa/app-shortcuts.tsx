'use client'

import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Zap, Droplets, Dumbbell, Utensils, Pill } from 'lucide-react'
import { APP_SHORTCUTS } from '@/types/widgets'

interface AppShortcutsProps {
  className?: string
}

const shortcutIcons: Record<string, React.ReactNode> = {
  'Registrar Água': <Droplets className="w-5 h-5 text-blue-400" />,
  'Iniciar Treino': <Dumbbell className="w-5 h-5 text-purple-400" />,
  'Registrar Refeição': <Utensils className="w-5 h-5 text-green-400" />,
  'Revolade': <Pill className="w-5 h-5 text-orange-400" />,
}

export function AppShortcuts({ className }: AppShortcutsProps) {
  return (
    <Card className={cn('bg-card/50 backdrop-blur border-border/50', className)}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-400" />
          Atalhos Rapidos
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Segure o icone do app para acessar
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {APP_SHORTCUTS.map((shortcut) => (
          <div
            key={shortcut.name}
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 border border-border/30"
          >
            <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center">
              {shortcutIcons[shortcut.name] || <Zap className="w-5 h-5 text-yellow-400" />}
            </div>
            <div className="flex-1">
              <p className="font-medium">{shortcut.name}</p>
              <p className="text-sm text-muted-foreground">{shortcut.description}</p>
            </div>
          </div>
        ))}

        <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3 mt-4">
          <p className="text-sm text-purple-300">
            <strong>Dica:</strong> No Android, segure o icone do FeliceFit na home screen para ver estes atalhos.
            No iOS, os atalhos aparecem com 3D Touch ou Haptic Touch.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
