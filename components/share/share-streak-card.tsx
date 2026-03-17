'use client'

import { ShareCard, BrandMark, OrnamentalDivider, withAlpha } from './share-card'
import { getThemeColors } from '@/lib/share/templates'
import type { ShareTheme, ShareFormat, StreakShareData } from '@/types/share'

interface ShareStreakCardProps {
  data: StreakShareData
  theme: ShareTheme
  format: ShareFormat
  showDate?: boolean
}

export function ShareStreakCard({ data, theme, format }: ShareStreakCardProps) {
  const colors = getThemeColors(theme)
  const isDark = theme === 'power' || theme === 'gradient' || theme === 'fire'
  const isRecord = data.days >= data.record && data.days > 0

  return (
    <ShareCard theme={theme} format={format}>
      <div className="absolute inset-0 flex flex-col items-center justify-between px-7 pt-8 pb-10">

        {/* === TOP: Brand === */}
        <div className="flex flex-col items-center">
          <BrandMark theme={theme} />

          <div className="mt-4">
            <OrnamentalDivider theme={theme} />
          </div>

          <span
            className="mt-4 text-[10px] font-semibold tracking-[0.2em] uppercase"
            style={{ color: colors.accent }}
          >
            Sequência
          </span>
        </div>

        {/* === MIDDLE: Hero === */}
        <div className="flex flex-col items-center">
          {/* Flame */}
          <div className="text-4xl mb-1">🔥</div>

          {/* Hero number */}
          <span
            className="text-8xl font-heading font-black tracking-tighter leading-none"
            style={{
              color: colors.accent,
              textShadow: `0 0 50px ${withAlpha(colors.accent, 0.4)}`,
            }}
          >
            {data.days}
          </span>
          <span
            className="text-sm font-heading font-medium mt-1"
            style={{ color: colors.secondary }}
          >
            {data.days === 1 ? 'dia' : 'dias seguidos'}
          </span>

          {/* Gold filete separator */}
          <div className="mt-5">
            <OrnamentalDivider theme={theme} />
          </div>

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
              className="mt-3 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full"
              style={{
                backgroundColor: withAlpha(colors.accent, isDark ? 0.1 : 0.07),
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
        </div>

        {/* === BOTTOM: Tagline === */}
        <div className="flex flex-col items-center">
          <span
            className="text-[19px] font-heading font-bold italic"
            style={{
              color: colors.accent,
              textShadow: `0 0 30px ${withAlpha(colors.accent, 0.25)}`,
            }}
          >
            Vivendo Felice!
          </span>
          <span
            className="mt-1.5 text-[7px] font-bold tracking-[0.2em] uppercase"
            style={{ color: colors.secondary, opacity: 0.35 }}
          >
            #VivendoFelice
          </span>
        </div>
      </div>
    </ShareCard>
  )
}
