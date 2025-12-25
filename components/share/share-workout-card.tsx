'use client'

import { ShareCard, StatBox, CardTitle, CardSubtitle, CardDate } from './share-card'
import type { ShareTheme, ShareFormat, WorkoutShareData } from '@/types/share'

interface ShareWorkoutCardProps {
  data: WorkoutShareData
  theme: ShareTheme
  format: ShareFormat
  showStats?: boolean
  showDate?: boolean
}

export function ShareWorkoutCard({
  data,
  theme,
  format,
  showStats = true,
  showDate = true,
}: ShareWorkoutCardProps) {
  const isStory = format === 'story'

  return (
    <ShareCard theme={theme} format={format}>
      <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
        {/* Title */}
        <CardTitle icon="🏋️" text="Treino Concluido" theme={theme} />

        {/* Workout Name */}
        <div className="mt-4">
          <CardSubtitle text={data.workoutName} theme={theme} />
        </div>

        {/* Stats Grid */}
        {showStats && (
          <div className={`grid ${isStory ? 'grid-cols-2 gap-4' : 'grid-cols-4 gap-3'} mt-8`}>
            <StatBox label="Duracao" value={data.duration} theme={theme} />
            <StatBox label="Exercicios" value={data.exercises} theme={theme} />
            <StatBox label="Series" value={data.sets} theme={theme} />
            <StatBox label="Calorias" value={`${data.calories}kcal`} theme={theme} />
          </div>
        )}

        {/* PRs */}
        {data.prs > 0 && (
          <div className="mt-6 text-2xl">
            🏆 {data.prs} {data.prs === 1 ? 'PR batido' : 'PRs batidos'}!
          </div>
        )}

        {/* Date */}
        {showDate && (
          <div className="mt-6">
            <CardDate date={data.date} theme={theme} />
          </div>
        )}
      </div>
    </ShareCard>
  )
}
