'use client'

import { cn } from '@/lib/utils'
import type { ShareFormat, ShareTheme } from '@/types/share'

interface CardCustomizerProps {
  theme: ShareTheme
  format: ShareFormat
  onThemeChange: (theme: ShareTheme) => void
  onFormatChange: (format: ShareFormat) => void
  showStats?: boolean
  showDate?: boolean
  onShowStatsChange?: (show: boolean) => void
  onShowDateChange?: (show: boolean) => void
}

const themes: { id: ShareTheme; name: string; colors: string[] }[] = [
  { id: 'power', name: 'Power', colors: ['#0A0A0A', '#8B5CF6', '#F59E0B'] },
  { id: 'light', name: 'Light', colors: ['#FFFFFF', '#3B82F6', '#10B981'] },
  { id: 'fire', name: 'Fire', colors: ['#1A0A00', '#F97316', '#FCD34D'] },
  { id: 'gradient', name: 'Gradient', colors: ['#1E1B4B', '#8B5CF6', '#EC4899'] },
]

const formats: { id: ShareFormat; name: string; icon: string; ratio: string }[] = [
  { id: 'square', name: 'Quadrado', icon: '⬜', ratio: '1:1' },
  { id: 'story', name: 'Story', icon: '📱', ratio: '9:16' },
  { id: 'wide', name: 'Wide', icon: '🖼️', ratio: '16:9' },
]

export function CardCustomizer({
  theme,
  format,
  onThemeChange,
  onFormatChange,
  showStats,
  showDate,
  onShowStatsChange,
  onShowDateChange,
}: CardCustomizerProps) {
  return (
    <div className="space-y-6">
      {/* Theme Selection */}
      <div>
        <h4 className="text-sm font-medium mb-3">Tema</h4>
        <div className="grid grid-cols-4 gap-2">
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => onThemeChange(t.id)}
              className={cn(
                'p-2 rounded-lg border-2 transition-all',
                theme === t.id
                  ? 'border-primary ring-2 ring-primary/20'
                  : 'border-border hover:border-primary/50'
              )}
            >
              <div className="flex gap-0.5 justify-center mb-1">
                {t.colors.map((color, i) => (
                  <div
                    key={i}
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <span className="text-xs">{t.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Format Selection */}
      <div>
        <h4 className="text-sm font-medium mb-3">Formato</h4>
        <div className="grid grid-cols-3 gap-2">
          {formats.map((f) => (
            <button
              key={f.id}
              onClick={() => onFormatChange(f.id)}
              className={cn(
                'p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1',
                format === f.id
                  ? 'border-primary ring-2 ring-primary/20'
                  : 'border-border hover:border-primary/50'
              )}
            >
              <span className="text-xl">{f.icon}</span>
              <span className="text-xs font-medium">{f.name}</span>
              <span className="text-[10px] text-muted-foreground">{f.ratio}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Options */}
      {(onShowStatsChange || onShowDateChange) && (
        <div>
          <h4 className="text-sm font-medium mb-3">Opcoes</h4>
          <div className="space-y-2">
            {onShowStatsChange && (
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showStats}
                  onChange={(e) => onShowStatsChange(e.target.checked)}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                />
                <span className="text-sm">Mostrar estatisticas</span>
              </label>
            )}
            {onShowDateChange && (
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showDate}
                  onChange={(e) => onShowDateChange(e.target.checked)}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                />
                <span className="text-sm">Mostrar data</span>
              </label>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
