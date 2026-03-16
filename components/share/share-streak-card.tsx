'use client'

import { ShareCard, CardDate } from './share-card'
import { getThemeColors } from '@/lib/share/templates'
import type { ShareTheme, ShareFormat, StreakShareData } from '@/types/share'

interface ShareStreakCardProps {
  data: StreakShareData
  theme: ShareTheme
  format: ShareFormat
  showDate?: boolean
}

export function ShareStreakCard({ data, theme, format, showDate = true }: ShareStreakCardProps) {
  const colors = getThemeColors(theme)
  const isDark = theme === 'power' || theme === 'gradient' || theme === 'fire'
  const isRecord = data.days >= data.record && data.days > 0

  return (
    <ShareCard theme={theme} format={format}>
      {/* Warm glow behind the number */}
      <div
        className="absolute"
        style={{
          top: '40%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 240,
          height: 240,
          background: `radial-gradient(circle, rgba(194, 152, 99, 0.2) 0%, transparent 70%)`,
        }}
      />

      <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
        {/* Top label */}
        <span
          className="text-[11px] font-semibold tracking-[0.2em] uppercase"
          style={{ color: colors.accent, opacity: 0.8 }}
        >
          Sequencia Ativa
        </span>

        {/* Flame icon — refined, not bouncing */}
        <div className="mt-4 text-4xl">🔥</div>

        {/* Hero Number */}
        <div className="mt-3 flex items-baseline gap-2">
          <span
            className="text-8xl font-heading font-black tracking-tighter leading-none"
            style={{ color: colors.text }}
          >
            {data.days}
          </span>
        </div>
        <span
          className="text-lg font-medium tracking-wide mt-1"
          style={{ color: colors.secondary }}
        >
          {data.days === 1 ? 'dia' : 'dias'}
        </span>

        {/* Decorative divider */}
        <div className="mt-5 flex items-center gap-3">
          <div className="w-6 h-[1px]" style={{ backgroundColor: colors.accent, opacity: 0.3 }} />
          <div className="w-1 h-1 rounded-full" style={{ backgroundColor: colors.accent, opacity: 0.5 }} />
          <div className="w-6 h-[1px]" style={{ backgroundColor: colors.accent, opacity: 0.3 }} />
        </div>

        {/* Message */}
        <p
          className="mt-4 text-center text-base font-medium max-w-[220px] leading-relaxed"
          style={{ color: colors.secondary, opacity: 0.9 }}
        >
          {data.message}
        </p>

        {/* Record badge */}
        {isRecord && (
          <div
            className="mt-5 flex items-center gap-2 px-4 py-2 rounded-full"
            style={{
              backgroundColor: isDark ? 'rgba(194, 152, 99, 0.15)' : 'rgba(194, 152, 99, 0.1)',
              borderWidth: 1,
              borderColor: isDark ? 'rgba(194, 152, 99, 0.25)' : 'rgba(194, 152, 99, 0.2)',
            }}
          >
            <span className="text-sm">🏆</span>
            <span
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: colors.accent }}
            >
              Novo Recorde
            </span>
          </div>
        )}

        {/* Previous record — only if not current record */}
        {!isRecord && data.record > 0 && (
          <div className="mt-4">
            <span
              className="text-xs tracking-wide"
              style={{ color: colors.secondary, opacity: 0.5 }}
            >
              Recorde: {data.record} dias
            </span>
          </div>
        )}

        {/* Date */}
        {showDate && (
          <div className="mt-5">
            <CardDate date={new Date().toLocaleDateString('pt-BR')} theme={theme} />
          </div>
        )}
      </div>
    </ShareCard>
  )
}
