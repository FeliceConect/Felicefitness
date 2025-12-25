'use client'

import { Moon, Sun, Monitor } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ThemeSelectorProps {
  currentTheme: 'light' | 'dark' | 'system'
  onSelect: (theme: 'light' | 'dark' | 'system') => void
}

export function ThemeSelector({ currentTheme, onSelect }: ThemeSelectorProps) {
  const themes = [
    {
      id: 'dark' as const,
      label: 'Escuro',
      icon: Moon,
      preview: 'bg-zinc-900'
    },
    {
      id: 'light' as const,
      label: 'Claro',
      icon: Sun,
      preview: 'bg-white'
    },
    {
      id: 'system' as const,
      label: 'Sistema',
      icon: Monitor,
      preview: 'bg-gradient-to-r from-zinc-900 to-white'
    }
  ]

  return (
    <div className="grid grid-cols-3 gap-3">
      {themes.map((theme) => (
        <button
          key={theme.id}
          onClick={() => onSelect(theme.id)}
          className={cn(
            'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors',
            currentTheme === theme.id
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50'
          )}
        >
          <div className={cn(
            'w-12 h-12 rounded-lg border',
            theme.preview
          )}>
            <div className="w-full h-full flex items-center justify-center">
              <theme.icon className={cn(
                'h-5 w-5',
                theme.id === 'light' ? 'text-zinc-900' : 'text-white'
              )} />
            </div>
          </div>
          <span className="text-sm font-medium">{theme.label}</span>
          {currentTheme === theme.id && (
            <div className="w-2 h-2 rounded-full bg-primary" />
          )}
        </button>
      ))}
    </div>
  )
}
