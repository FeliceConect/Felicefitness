'use client'

import { ShareCard } from './share-card'
import { getThemeColors } from '@/lib/share/templates'
import type { ShareTheme, ShareFormat, StreakShareData } from '@/types/share'

interface ShareStreakCardProps {
  data: StreakShareData
  theme: ShareTheme
  format: ShareFormat
}

export function ShareStreakCard({ data, theme, format }: ShareStreakCardProps) {
  const colors = getThemeColors(theme)

  // Flame size based on streak
  const flameSize = data.days >= 30 ? 'text-8xl' : data.days >= 14 ? 'text-7xl' : 'text-6xl'

  return (
    <ShareCard theme={theme} format={format}>
      {/* Fire glow effect */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at 50% 40%, rgba(251, 146, 60, 0.3) 0%, transparent 60%)`,
        }}
      />

      <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
        {/* Flame with pulse effect */}
        <div className="relative">
          <div className={`${flameSize} animate-bounce`} style={{ animationDuration: '1s' }}>
            🔥
          </div>
          {/* Glow behind flame */}
          <div
            className="absolute inset-0 blur-xl opacity-50"
            style={{
              background: 'radial-gradient(circle, #f97316 0%, transparent 70%)',
            }}
          />
        </div>

        {/* Streak Number */}
        <div className="mt-4 flex items-baseline">
          <span className="text-7xl font-black" style={{ color: colors.text }}>
            {data.days}
          </span>
          <span className="text-3xl font-bold ml-2" style={{ color: colors.secondary }}>
            dias
          </span>
        </div>

        {/* Message */}
        <div
          className="mt-6 text-xl font-medium text-center max-w-xs"
          style={{ color: colors.text }}
        >
          {data.message}
        </div>

        {/* Record badge */}
        {data.days >= data.record && data.days > 0 && (
          <div
            className="mt-4 px-4 py-2 rounded-full text-sm font-bold"
            style={{
              backgroundColor: 'rgba(251, 146, 60, 0.2)',
              color: '#fb923c',
            }}
          >
            🏆 Novo Recorde!
          </div>
        )}

        {/* Previous record */}
        {data.days < data.record && (
          <div className="mt-4 text-sm" style={{ color: colors.secondary }}>
            Recorde: {data.record} dias
          </div>
        )}
      </div>
    </ShareCard>
  )
}
