'use client'

import { ShareCard, BrandMark, OrnamentalDivider, CardLabel, CardDate } from './share-card'
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
      {/* Warm glow behind number */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '42%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 200,
          height: 200,
          background: `radial-gradient(circle, rgba(194, 152, 99, 0.15) 0%, transparent 70%)`,
        }}
      />

      <div className="absolute inset-0 flex flex-col items-center justify-center px-10 py-8">
        {/* Brand mark */}
        <BrandMark theme={theme} />

        {/* Ornamental divider */}
        <div className="mt-2.5">
          <OrnamentalDivider theme={theme} />
        </div>

        {/* Card type label */}
        <div className="mt-4">
          <CardLabel text="Sequencia" theme={theme} />
        </div>

        {/* Flame icon */}
        <div className="mt-3 text-3xl">🔥</div>

        {/* Hero Number */}
        <div className="mt-2 flex items-baseline gap-1.5">
          <span
            className="text-7xl font-heading font-black tracking-tighter leading-none"
            style={{ color: colors.text }}
          >
            {data.days}
          </span>
        </div>
        <span
          className="text-base font-heading font-medium mt-1"
          style={{ color: colors.secondary }}
        >
          {data.days === 1 ? 'dia consecutivo' : 'dias consecutivos'}
        </span>

        {/* Message */}
        <p
          className="mt-4 text-center text-[11px] leading-relaxed max-w-[180px]"
          style={{ color: colors.secondary, opacity: 0.7 }}
        >
          {data.message}
        </p>

        {/* Record badge */}
        {isRecord && (
          <div
            className="mt-4 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full"
            style={{
              backgroundColor: isDark ? 'rgba(194, 152, 99, 0.12)' : 'rgba(194, 152, 99, 0.1)',
              borderWidth: 1,
              borderColor: `${colors.accent}25`,
            }}
          >
            <span className="text-xs">🏆</span>
            <span
              className="text-[9px] font-bold uppercase tracking-[0.15em]"
              style={{ color: colors.accent }}
            >
              Novo Recorde
            </span>
          </div>
        )}

        {/* Previous record */}
        {!isRecord && data.record > 0 && (
          <span
            className="mt-3 text-[9px] tracking-[0.1em]"
            style={{ color: colors.secondary, opacity: 0.4 }}
          >
            Recorde: {data.record} dias
          </span>
        )}

        {/* Date */}
        {showDate && (
          <div className="mt-4">
            <CardDate date={new Date().toLocaleDateString('pt-BR')} theme={theme} />
          </div>
        )}
      </div>
    </ShareCard>
  )
}
