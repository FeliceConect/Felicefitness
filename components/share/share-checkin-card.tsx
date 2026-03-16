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
    { key: 'treino', label: 'Treino', done: data.treino },
    { key: 'nutricao', label: 'Nutrição', done: data.nutricao },
    { key: 'hidratacao', label: 'Água', done: data.hidratacao },
    { key: 'sono', label: 'Sono', done: data.sono },
  ]

  const completedCount = dimensions.filter(d => d.done).length

  return (
    <ShareCard theme={theme} format={format}>
      <div className="absolute inset-0 flex flex-col items-center justify-center px-10 py-8">
        <BrandMark theme={theme} />

        <div className="mt-2.5">
          <OrnamentalDivider theme={theme} />
        </div>

        {/* Level badge */}
        <div
          className="mt-4 flex items-center gap-2 px-4 py-1.5 rounded-full"
          style={{
            backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
            borderWidth: 1,
            borderStyle: 'solid',
            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
          }}
        >
          <span className="text-base">{data.levelEmoji}</span>
          <span
            className="text-[9px] font-semibold uppercase tracking-[0.12em]"
            style={{ color: colors.secondary }}
          >
            Nível {data.level} · {data.levelName}
          </span>
        </div>

        {/* Hero — Journey day counter */}
        <div className="mt-5 flex flex-col items-center">
          <span
            className="text-[10px] font-semibold tracking-[0.25em] uppercase"
            style={{ color: colors.accent }}
          >
            Dia
          </span>
          <span
            className="text-8xl font-heading font-black tracking-tighter leading-none mt-1"
            style={{
              color: colors.accent,
              textShadow: `0 0 50px ${withAlpha(colors.accent, 0.45)}`,
            }}
          >
            {data.journeyDays}
          </span>
          {data.streak > 1 && (
            <div className="flex items-center gap-1 mt-1.5">
              <span className="text-xs">🔥</span>
              <span
                className="text-[9px] font-bold"
                style={{ color: colors.accent, opacity: 0.7 }}
              >
                {data.streak} dias seguidos
              </span>
            </div>
          )}
        </div>

        {/* Wellness grid — 2x2 */}
        <div className="mt-5 grid grid-cols-2 gap-2">
          {dimensions.map((dim) => (
            <div
              key={dim.key}
              className="flex items-center gap-2 px-3 py-2 rounded-lg min-w-[100px]"
              style={{
                backgroundColor: dim.done
                  ? withAlpha(colors.accent, isDark ? 0.1 : 0.08)
                  : isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                borderWidth: 1,
                borderStyle: 'solid',
                borderColor: dim.done
                  ? withAlpha(colors.accent, 0.2)
                  : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
              }}
            >
              {/* Check circle */}
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  backgroundColor: dim.done ? withAlpha(colors.accent, 0.2) : 'transparent',
                  borderWidth: dim.done ? 0 : 1.5,
                  borderStyle: 'solid',
                  borderColor: dim.done ? 'transparent' : withAlpha(colors.secondary, 0.2),
                }}
              >
                {dim.done && (
                  <span
                    className="text-[10px] font-bold"
                    style={{ color: colors.accent }}
                  >
                    ✓
                  </span>
                )}
              </div>
              <span
                className="text-[10px] font-semibold"
                style={{
                  color: dim.done ? colors.accent : colors.secondary,
                  opacity: dim.done ? 1 : 0.4,
                }}
              >
                {dim.label}
              </span>
            </div>
          ))}
        </div>

        {/* Score pill */}
        {data.todayScore !== undefined && (
          <div
            className="mt-3 flex items-center gap-1.5"
            style={{ color: colors.secondary, opacity: 0.5 }}
          >
            <span className="text-[9px] tracking-wide">
              {completedCount}/4 dimensões · Score {data.todayScore}/100
            </span>
          </div>
        )}

        {/* ═══ VIVENDO FELICE! — The tagline ═══ */}
        <div className="mt-5 flex flex-col items-center">
          <span
            className="text-lg font-heading font-bold italic tracking-wide"
            style={{
              color: colors.accent,
              textShadow: `0 0 30px ${withAlpha(colors.accent, 0.3)}`,
            }}
          >
            Vivendo Felice!
          </span>
          <span
            className="mt-1 text-[8px] tracking-[0.15em]"
            style={{ color: colors.secondary, opacity: 0.4 }}
          >
            #VivendoFelice
          </span>
        </div>
      </div>
    </ShareCard>
  )
}
