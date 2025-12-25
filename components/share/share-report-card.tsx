'use client'

import { ShareCard, StatBox, CardTitle, CardDate } from './share-card'
import { getThemeColors } from '@/lib/share/templates'
import type { ShareTheme, ShareFormat, WeeklyShareData } from '@/types/share'

interface ShareReportCardProps {
  data: WeeklyShareData
  theme: ShareTheme
  format: ShareFormat
  showDate?: boolean
}

export function ShareReportCard({
  data,
  theme,
  format,
  showDate = true,
}: ShareReportCardProps) {
  const colors = getThemeColors(theme)
  const isStory = format === 'story'

  // Calculate completion percentage
  const completionRate = data.workoutsPlanned > 0
    ? Math.round((data.workoutsCompleted / data.workoutsPlanned) * 100)
    : 0

  return (
    <ShareCard theme={theme} format={format}>
      <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
        {/* Title */}
        <CardTitle icon="📊" text="Resumo Semanal" theme={theme} />

        {/* Week Range */}
        <div
          className="mt-2 text-sm font-medium"
          style={{ color: colors.secondary }}
        >
          {data.weekStart} - {data.weekEnd}
        </div>

        {/* Completion Ring */}
        <div className="mt-6 relative w-28 h-28">
          <svg className="w-full h-full transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="56"
              cy="56"
              r="48"
              fill="none"
              stroke={colors.secondary}
              strokeWidth="8"
              strokeOpacity="0.2"
            />
            {/* Progress circle */}
            <circle
              cx="56"
              cy="56"
              r="48"
              fill="none"
              stroke={colors.primary}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${completionRate * 3.02} 302`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-black" style={{ color: colors.text }}>
              {completionRate}%
            </span>
            <span className="text-xs" style={{ color: colors.secondary }}>
              completo
            </span>
          </div>
        </div>

        {/* Workouts completed */}
        <div className="mt-4 text-lg font-medium" style={{ color: colors.text }}>
          {data.workoutsCompleted}/{data.workoutsPlanned} treinos
        </div>

        {/* Stats Grid */}
        <div className={`grid ${isStory ? 'grid-cols-2 gap-3' : 'grid-cols-4 gap-2'} mt-6 w-full max-w-sm`}>
          <StatBox
            label="Total"
            value={data.totalDuration}
            theme={theme}
          />
          <StatBox
            label="Calorias"
            value={`${data.totalCalories}kcal`}
            theme={theme}
          />
          <StatBox
            label="Series"
            value={String(data.totalSets)}
            theme={theme}
          />
          <StatBox
            label="PRs"
            value={String(data.prsSet)}
            theme={theme}
          />
        </div>

        {/* Highlights */}
        {data.highlights && data.highlights.length > 0 && (
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {data.highlights.slice(0, 3).map((highlight, index) => (
              <div
                key={index}
                className="px-3 py-1 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: `${colors.primary}20`,
                  color: colors.primary,
                }}
              >
                {highlight}
              </div>
            ))}
          </div>
        )}

        {/* Date */}
        {showDate && (
          <div className="mt-6">
            <CardDate date={new Date().toISOString()} theme={theme} />
          </div>
        )}
      </div>
    </ShareCard>
  )
}
