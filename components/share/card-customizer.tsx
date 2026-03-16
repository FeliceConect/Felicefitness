'use client'

import { cn } from '@/lib/utils'
import type { ShareTheme, ShareFormat } from '@/types/share'

interface CardCustomizerProps {
  theme: ShareTheme
  onThemeChange: (theme: ShareTheme) => void
  format?: ShareFormat
  onFormatChange?: (format: ShareFormat) => void
  showStats?: boolean
  showDate?: boolean
  onShowStatsChange?: (show: boolean) => void
  onShowDateChange?: (show: boolean) => void
}

const themes: { id: ShareTheme; name: string; colors: string[] }[] = [
  { id: 'light', name: 'Claro', colors: ['#f7f2ed', '#c29863', '#663739'] },
  { id: 'gradient', name: 'Vinho', colors: ['#663739', '#322b29', '#c29863'] },
]

const formats: { id: ShareFormat; name: string; icon: string; ratio: string }[] = [
  { id: 'square', name: 'Quadrado', icon: '⬜', ratio: '1:1' },
  { id: 'story', name: 'Story', icon: '📱', ratio: '9:16' },
  { id: 'wide', name: 'Wide', icon: '🖼️', ratio: '16:9' },
]

export function CardCustomizer({
  theme,
  onThemeChange,
  format,
  onFormatChange,
  showStats,
  showDate,
  onShowStatsChange,
  onShowDateChange,
}: CardCustomizerProps) {
  return (
    <div className="space-y-5">
      {/* Theme Selection */}
      <div>
        <h4 className="text-sm font-medium mb-3">Tema</h4>
        <div className="flex gap-3">
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => onThemeChange(t.id)}
              className={cn(
                'flex-1 p-3 rounded-xl border-2 transition-all',
                theme === t.id
                  ? 'border-[#c29863] ring-2 ring-[#c29863]/20'
                  : 'border-border hover:border-[#c29863]/50'
              )}
            >
              <div className="flex gap-1 justify-center mb-1.5">
                {t.colors.map((color, i) => (
                  <div
                    key={i}
                    className="w-5 h-5 rounded-full border border-black/5"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <span className="text-xs font-medium">{t.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Format Selection — only shown if onFormatChange is provided */}
      {onFormatChange && format && (
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
                    ? 'border-[#c29863] ring-2 ring-[#c29863]/20'
                    : 'border-border hover:border-[#c29863]/50'
                )}
              >
                <span className="text-xl">{f.icon}</span>
                <span className="text-xs font-medium">{f.name}</span>
                <span className="text-[10px] text-muted-foreground">{f.ratio}</span>
              </button>
            ))}
          </div>
        </div>
      )}

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
