'use client'

import { ShareCard } from './share-card'
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
      <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
        {/* Top label */}
        <span
          className="text-[11px] font-semibold tracking-[0.2em] uppercase"
          style={{ color: colors.accent, opacity: 0.8 }}
        >
          Transformacao
        </span>

        {/* Photos Container */}
        <div className={`mt-6 flex ${isStory ? 'flex-col' : 'flex-row'} gap-3 items-center justify-center`}>
          {/* Before Photo */}
          <div className="relative">
            <div
              className={`${isStory ? 'w-36 h-48' : 'w-28 h-40'} rounded-xl overflow-hidden`}
              style={{
                backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                borderWidth: 1,
                borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
              }}
            >
              {data.beforePhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={data.beforePhoto}
                  alt="Antes"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-3xl"
                  style={{ opacity: 0.3 }}
                >
                  👤
                </div>
              )}
            </div>
            <div
              className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
              style={{
                backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                color: colors.secondary,
                borderWidth: 1,
                borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)',
              }}
            >
              Antes
            </div>
          </div>

          {/* Arrow */}
          <div className="text-xl" style={{ color: colors.accent, opacity: 0.5 }}>
            {isStory ? '↓' : '→'}
          </div>

          {/* After Photo */}
          <div className="relative">
            <div
              className={`${isStory ? 'w-36 h-48' : 'w-28 h-40'} rounded-xl overflow-hidden`}
              style={{
                borderWidth: 2,
                borderColor: `${colors.accent}40`,
                boxShadow: `0 0 20px ${colors.accent}15`,
              }}
            >
              {data.afterPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={data.afterPhoto}
                  alt="Depois"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-3xl"
                  style={{
                    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                    opacity: 0.3,
                  }}
                >
                  💪
                </div>
              )}
            </div>
            <div
              className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
              style={{
                backgroundColor: `${colors.accent}20`,
                color: colors.accent,
                borderWidth: 1,
                borderColor: `${colors.accent}30`,
              }}
            >
              Depois
            </div>
          </div>
        </div>

        {/* Days Badge */}
        <div
          className="mt-7 text-center"
          style={{ color: colors.text }}
        >
          <span className="text-3xl font-heading font-bold">{data.daysBetween}</span>
          <span className="text-base font-medium ml-1.5" style={{ color: colors.secondary }}>dias</span>
        </div>

        {/* Stats Comparison — glass morphism chips */}
        {showStats && data.stats && (
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {data.stats.weight && (
              <StatChip
                label="Peso"
                before={data.stats.weight.before}
                after={data.stats.weight.after}
                unit="kg"
                isDark={isDark}
                colors={colors}
              />
            )}
            {data.stats.fat && (
              <StatChip
                label="Gordura"
                before={data.stats.fat.before}
                after={data.stats.fat.after}
                unit="%"
                invertPositive
                isDark={isDark}
                colors={colors}
              />
            )}
            {data.stats.muscle && (
              <StatChip
                label="Musculo"
                before={data.stats.muscle.before}
                after={data.stats.muscle.after}
                unit="kg"
                isDark={isDark}
                colors={colors}
              />
            )}
          </div>
        )}
      </div>
    </ShareCard>
  )
}

// Compact stat chip
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
      className="flex flex-col items-center px-3 py-2 rounded-xl"
      style={{
        backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
        borderWidth: 1,
        borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
      }}
    >
      <span
        className="text-[9px] uppercase tracking-wider"
        style={{ color: colors.secondary, opacity: 0.6 }}
      >
        {label}
      </span>
      <span
        className="text-sm font-bold mt-0.5"
        style={{ color: changeColor }}
      >
        {sign}{change.toFixed(1)}{unit}
      </span>
    </div>
  )
}
