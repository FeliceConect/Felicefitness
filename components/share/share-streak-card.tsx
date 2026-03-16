'use client'

import { ShareCard, BrandMark, OrnamentalDivider, CardLabel, CardDate, withAlpha } from './share-card'
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
  const isRecord = data.days >= data.record && data.days > 0

  return (
    <ShareCard theme={theme} format={format}>
      <div className="absolute inset-0 flex flex-col items-center justify-center px-10 py-8">
        <BrandMark theme={theme} />

        <div className="mt-3">
          <OrnamentalDivider theme={theme} />
        </div>

        <div className="mt-3.5">
          <CardLabel text="Sequencia" theme={theme} />
        </div>

        {/* Flame */}
        <div className="mt-3 text-4xl">🔥</div>

        {/* Hero number — massive */}
        <div className="mt-2 flex items-baseline gap-1">
          <span
            className="text-8xl font-heading font-black tracking-tighter leading-none"
            style={{ color: colors.accent, textShadow: `0 0 50px ${withAlpha(colors.accent, 0.45)}` }}
          >
            {data.days}
          </span>
        </div>
        <span
          className="text-sm font-heading font-medium mt-1"
          style={{ color: colors.secondary }}
        >
          {data.days === 1 ? 'dia' : 'dias'}
        </span>

        {/* Message */}
        <p
          className="mt-4 text-center text-[10px] leading-relaxed max-w-[180px]"
          style={{ color: colors.secondary, opacity: 0.65 }}
        >
          {data.message}
        </p>

        {/* Record badge */}
        {isRecord && (
          <div
            className="mt-4 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full"
            style={{
              backgroundColor: withAlpha(colors.accent, 0.1),
              borderWidth: 1,
              borderStyle: 'solid',
              borderColor: withAlpha(colors.accent, 0.2),
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

        {!isRecord && data.record > 0 && (
          <span
            className="mt-3 text-[9px]"
            style={{ color: colors.secondary, opacity: 0.4 }}
          >
            Recorde: {data.record} dias
          </span>
        )}

        {showDate && (
          <div className="mt-4">
            <CardDate date={new Date().toLocaleDateString('pt-BR')} theme={theme} />
          </div>
        )}
      </div>
    </ShareCard>
  )
}
