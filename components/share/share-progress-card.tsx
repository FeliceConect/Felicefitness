'use client'

import { ShareCard, CardTitle } from './share-card'
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
  const isStory = format === 'story'

  return (
    <ShareCard theme={theme} format={format}>
      <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
        {/* Title */}
        <CardTitle icon="📸" text="Transformacao" theme={theme} />

        {/* Photos Container */}
        <div className={`mt-6 flex ${isStory ? 'flex-col' : 'flex-row'} gap-4 items-center justify-center`}>
          {/* Before Photo */}
          <div className="relative">
            <div
              className={`${isStory ? 'w-40 h-52' : 'w-32 h-44'} rounded-xl overflow-hidden bg-muted/30`}
              style={{ border: `2px solid ${colors.secondary}` }}
            >
              {data.beforePhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={data.beforePhoto}
                  alt="Antes"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl">
                  👤
                </div>
              )}
            </div>
            <div
              className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold"
              style={{ backgroundColor: colors.background, color: colors.text }}
            >
              ANTES
            </div>
          </div>

          {/* Arrow */}
          <div className="text-3xl" style={{ color: colors.primary }}>
            {isStory ? '⬇️' : '➡️'}
          </div>

          {/* After Photo */}
          <div className="relative">
            <div
              className={`${isStory ? 'w-40 h-52' : 'w-32 h-44'} rounded-xl overflow-hidden bg-muted/30`}
              style={{ border: `2px solid ${colors.primary}` }}
            >
              {data.afterPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={data.afterPhoto}
                  alt="Depois"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl">
                  💪
                </div>
              )}
            </div>
            <div
              className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold"
              style={{ backgroundColor: colors.primary, color: '#fff' }}
            >
              DEPOIS
            </div>
          </div>
        </div>

        {/* Days Between */}
        <div
          className="mt-8 text-xl font-medium"
          style={{ color: colors.text }}
        >
          {data.daysBetween} dias de transformacao
        </div>

        {/* Stats Comparison */}
        {showStats && data.stats && (
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            {data.stats.weight && (
              <StatComparison
                label="Peso"
                before={`${data.stats.weight.before}kg`}
                after={`${data.stats.weight.after}kg`}
                change={data.stats.weight.after - data.stats.weight.before}
                unit="kg"
                colors={colors}
              />
            )}
            {data.stats.fat && (
              <StatComparison
                label="Gordura"
                before={`${data.stats.fat.before}%`}
                after={`${data.stats.fat.after}%`}
                change={data.stats.fat.after - data.stats.fat.before}
                unit="%"
                colors={colors}
              />
            )}
            {data.stats.muscle && (
              <StatComparison
                label="Musculo"
                before={`${data.stats.muscle.before}kg`}
                after={`${data.stats.muscle.after}kg`}
                change={data.stats.muscle.after - data.stats.muscle.before}
                unit="kg"
                colors={colors}
                positive
              />
            )}
          </div>
        )}
      </div>
    </ShareCard>
  )
}

// Stat Comparison Component
interface StatComparisonProps {
  label: string
  before: string
  after: string
  change: number
  unit: string
  colors: ReturnType<typeof getThemeColors>
  positive?: boolean
}

function StatComparison({ label, before, after, change, unit, colors, positive }: StatComparisonProps) {
  const isPositive = positive ? change > 0 : change < 0
  const changeColor = isPositive ? '#22c55e' : '#ef4444'
  const changeSign = change > 0 ? '+' : ''

  return (
    <div
      className="flex flex-col items-center px-4 py-2 rounded-lg"
      style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
    >
      <span className="text-xs" style={{ color: colors.secondary }}>{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm" style={{ color: colors.secondary }}>{before}</span>
        <span style={{ color: colors.text }}>→</span>
        <span className="text-sm font-bold" style={{ color: colors.text }}>{after}</span>
      </div>
      <span className="text-xs font-bold" style={{ color: changeColor }}>
        {changeSign}{change.toFixed(1)}{unit}
      </span>
    </div>
  )
}
