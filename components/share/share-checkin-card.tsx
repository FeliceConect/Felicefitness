'use client'

import { ShareCard, BrandMark, OrnamentalDivider, withAlpha } from './share-card'
import { getThemeColors } from '@/lib/share/templates'
import type { ShareTheme, ShareFormat, CheckinShareData } from '@/types/share'

interface ShareCheckinCardProps {
  data: CheckinShareData
  theme: ShareTheme
  format: ShareFormat
}

export function ShareCheckinCard({ data, theme, format }: ShareCheckinCardProps) {
  const colors = getThemeColors(theme)
  const isDark = theme === 'power' || theme === 'gradient' || theme === 'fire'

  const dimensions = [
    { key: 'treino', label: 'Treino', icon: '💪', done: data.treino },
    { key: 'nutricao', label: 'Nutrição', icon: '🥗', done: data.nutricao },

    { key: 'hidratacao', label: 'Água', icon: '💧', done: data.hidratacao },
    { key: 'sono', label: 'Sono', icon: '🌙', done: data.sono },
  ]

  return (
    <ShareCard theme={theme} format={format}>
      {/* Use justify-between so brand stays at top, tagline at bottom, hero in middle */}
      <div className="absolute inset-0 flex flex-col items-center justify-between px-7 pt-8 pb-10">

        {/* === TOP: Brand + Level === */}
        <div className="flex flex-col items-center">
          <BrandMark theme={theme} />

          <div className="mt-4">
            <OrnamentalDivider theme={theme} />
          </div>

          {/* Level badge */}
          <div
            className="mt-4 flex items-center gap-2 px-4 py-1.5 rounded-full"
            style={{
              backgroundColor: withAlpha(colors.accent, isDark ? 0.08 : 0.06),
              borderWidth: 1,
              borderStyle: 'solid',
              borderColor: withAlpha(colors.accent, 0.15),
            }}
          >
            <span className="text-sm">{data.levelEmoji}</span>
            <span
              className="text-[8px] font-bold uppercase tracking-[0.12em]"
              style={{ color: colors.accent }}
            >
              Nível {data.level} · {data.levelName}
            </span>
          </div>
        </div>

        {/* === MIDDLE: Hero day counter + Wellness grid === */}
        <div className="flex flex-col items-center">
          {/* Hero — Journey day counter */}
          <span
            className="text-[9px] font-bold tracking-[0.3em] uppercase"
            style={{ color: colors.secondary, opacity: 0.5 }}
          >
            Minha Jornada
          </span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span
              className="text-[12px] font-heading font-bold uppercase tracking-[0.15em]"
              style={{ color: colors.accent }}
            >
              Dia
            </span>
            <span
              className="text-8xl font-heading font-black tracking-tighter leading-none"
              style={{
                color: colors.accent,
                textShadow: `0 0 45px ${withAlpha(colors.accent, 0.35)}`,
              }}
            >
              {data.journeyDays}
            </span>
          </div>
          {data.streak > 1 && (
            <div className="flex items-center gap-1 mt-2">
              <span className="text-[10px]">🔥</span>
              <span
                className="text-[8px] font-bold tracking-wide"
                style={{ color: colors.accent, opacity: 0.7 }}
              >
                {data.streak} dias seguidos
              </span>
            </div>
          )}

          {/* Gold filete separator */}
          <div className="mt-6">
            <OrnamentalDivider theme={theme} />
          </div>

          {/* Wellness grid — 2x2 */}
          <div className="mt-5 grid grid-cols-2 gap-2">
            {dimensions.map((dim) => (
              <div
                key={dim.key}
                className="flex items-center gap-2 px-3 py-2 rounded-lg min-w-[100px]"
                style={{
                  backgroundColor: dim.done
                    ? withAlpha(colors.accent, isDark ? 0.1 : 0.07)
                    : isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)',
                  borderWidth: 1,
                  borderStyle: 'solid',
                  borderColor: dim.done
                    ? withAlpha(colors.accent, 0.2)
                    : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                }}
              >
                <span className="text-[11px]">{dim.icon}</span>
                <span
                  className="text-[9px] font-bold tracking-wide"
                  style={{
                    color: dim.done ? colors.accent : colors.secondary,
                    opacity: dim.done ? 1 : 0.35,
                    textDecoration: dim.done ? 'none' : 'line-through',
                  }}
                >
                  {dim.label}
                </span>
                {dim.done && (
                  <span
                    className="text-[8px] ml-auto font-bold"
                    style={{ color: '#7dad6a' }}
                  >
                    ✓
                  </span>
                )}
              </div>
            ))}
          </div>
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
