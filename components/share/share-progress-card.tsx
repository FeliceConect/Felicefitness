'use client'

import { ShareCard, BrandMark, OrnamentalDivider, CardLabel, withAlpha } from './share-card'
import { getThemeColors } from '@/lib/share/templates'
import type { ShareTheme, ShareFormat, ProgressShareData } from '@/types/share'

interface ShareProgressCardProps {
  data: ProgressShareData
  theme: ShareTheme
  format: ShareFormat
  showStats?: boolean
}

export function ShareProgressCard({
  data,
  theme,
  format,
  showStats = true,
}: ShareProgressCardProps) {
  const colors = getThemeColors(theme)
  const isDark = theme === 'power' || theme === 'gradient' || theme === 'fire'
  const isStory = format === 'story'

  return (
    <ShareCard theme={theme} format={format}>
      <div className="absolute inset-0 flex flex-col items-center justify-center px-10 py-8">
        <BrandMark theme={theme} />

        <div className="mt-2.5">
          <OrnamentalDivider theme={theme} />
        </div>

        <div className="mt-3">
          <CardLabel text="Transformacao" theme={theme} />
        </div>

        {/* Photos */}
        <div className={`mt-4 flex ${isStory ? 'flex-col' : 'flex-row'} gap-3 items-center`}>
          {/* Before */}
          <div className="relative">
            <div
              className={`${isStory ? 'w-28 h-40' : 'w-22 h-32'} rounded-lg overflow-hidden`}
              style={{
                backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                borderWidth: 1,
                borderStyle: 'solid',
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
              }}
            >
              {data.beforePhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={data.beforePhoto} alt="Antes" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xl opacity-15">👤</div>
              )}
            </div>
            <div
              className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-2 py-px rounded-full"
              style={{
                backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
              }}
            >
              <span className="text-[6px] font-bold uppercase tracking-[0.15em]" style={{ color: colors.secondary, opacity: 0.5 }}>
                Antes
              </span>
            </div>
          </div>

          <span className="text-xs" style={{ color: colors.accent, opacity: 0.3 }}>
            {isStory ? '↓' : '→'}
          </span>

          {/* After */}
          <div className="relative">
            <div
              className={`${isStory ? 'w-28 h-40' : 'w-22 h-32'} rounded-lg overflow-hidden`}
              style={{
                borderWidth: 1.5,
                borderStyle: 'solid',
                borderColor: withAlpha(colors.accent, 0.3),
                boxShadow: `0 0 15px ${withAlpha(colors.accent, 0.1)}`,
              }}
            >
              {data.afterPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={data.afterPhoto} alt="Depois" className="w-full h-full object-cover" />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-xl opacity-15"
                  style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }}
                >
                  💪
                </div>
              )}
            </div>
            <div
              className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-2 py-px rounded-full"
              style={{ backgroundColor: withAlpha(colors.accent, 0.15) }}
            >
              <span className="text-[6px] font-bold uppercase tracking-[0.15em]" style={{ color: colors.accent }}>
                Depois
              </span>
            </div>
          </div>
        </div>

        {/* Days */}
        <div className="mt-5 flex items-baseline gap-1">
          <span className="text-3xl font-heading font-bold" style={{ color: colors.accent }}>
            {data.daysBetween}
          </span>
          <span className="text-sm font-medium" style={{ color: colors.secondary, opacity: 0.6 }}>
            dias
          </span>
        </div>

        {/* Stat chips */}
        {showStats && data.stats && (
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {data.stats.weight && (
              <StatChip label="Peso" before={data.stats.weight.before} after={data.stats.weight.after} unit="kg" isDark={isDark} colors={colors} />
            )}
            {data.stats.fat && (
              <StatChip label="Gordura" before={data.stats.fat.before} after={data.stats.fat.after} unit="%" invertPositive isDark={isDark} colors={colors} />
            )}
            {data.stats.muscle && (
              <StatChip label="Musculo" before={data.stats.muscle.before} after={data.stats.muscle.after} unit="kg" isDark={isDark} colors={colors} />
            )}
          </div>
        )}
      </div>
    </ShareCard>
  )
}

interface StatChipProps {
  label: string
  before: number
  after: number
  unit: string
  invertPositive?: boolean
  isDark: boolean
  colors: ReturnType<typeof getThemeColors>
}

function StatChip({ label, before, after, unit, invertPositive, isDark, colors }: StatChipProps) {
  const change = after - before
  const isPositive = invertPositive ? change < 0 : change > 0
  const changeColor = isPositive ? '#7dad6a' : '#a04045'
  const sign = change > 0 ? '+' : ''

  return (
    <div
      className="flex flex-col items-center px-2.5 py-1.5 rounded-lg"
      style={{
        backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
      }}
    >
      <span className="text-[7px] uppercase tracking-[0.12em]" style={{ color: colors.secondary, opacity: 0.45 }}>
        {label}
      </span>
      <span className="text-[11px] font-bold mt-0.5" style={{ color: changeColor }}>
        {sign}{change.toFixed(1)}{unit}
      </span>
    </div>
  )
}
