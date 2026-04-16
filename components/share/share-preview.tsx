'use client'

import { useRef, forwardRef, useImperativeHandle } from 'react'
import type {
  ShareType,
  ShareFormat,
  ShareTheme,
  ShareCardData,
  WorkoutShareData,
  PRShareData,
  StreakShareData,
  AchievementShareData,
  ProgressShareData,
  WeeklyShareData,
} from '@/types/share'
import { ShareWorkoutCard } from './share-workout-card'
import { SharePRCard } from './share-pr-card'
import { ShareStreakCard } from './share-streak-card'
import { ShareAchievementCard } from './share-achievement-card'
import { ShareProgressCard } from './share-progress-card'
import { ShareReportCard } from './share-report-card'

interface SharePreviewProps {
  type: ShareType
  data: ShareCardData
  theme: ShareTheme
  format: ShareFormat
  showStats?: boolean
  showDate?: boolean
}

export interface SharePreviewHandle {
  getElement: () => HTMLDivElement | null
}

export const SharePreview = forwardRef<SharePreviewHandle, SharePreviewProps>(
  function SharePreview({ type, data, theme, format, showStats = true, showDate = true }, ref) {
    const cardRef = useRef<HTMLDivElement>(null)

    useImperativeHandle(ref, () => ({
      getElement: () => cardRef.current,
    }))

    const renderCard = () => {
      switch (type) {
        case 'workout':
          return (
            <ShareWorkoutCard
              data={data as WorkoutShareData}
              theme={theme}
              format={format}
              showStats={showStats}
              showDate={showDate}
            />
          )
        case 'pr':
          return (
            <SharePRCard
              data={data as PRShareData}
              theme={theme}
              format={format}
              showDate={showDate}
            />
          )
        case 'streak':
          return (
            <ShareStreakCard
              data={data as StreakShareData}
              theme={theme}
              format={format}
            />
          )
        case 'achievement':
          return (
            <ShareAchievementCard
              data={data as AchievementShareData}
              theme={theme}
              format={format}
              showDate={showDate}
            />
          )
        case 'progress':
          return (
            <ShareProgressCard
              data={data as ProgressShareData}
              theme={theme}
              format={format}
              showStats={showStats}
            />
          )
        case 'weekly':
          return (
            <ShareReportCard
              data={data as WeeklyShareData}
              theme={theme}
              format={format}
              showDate={showDate}
            />
          )
        default:
          return null
      }
    }

    return (
      <div ref={cardRef} className="flex items-center justify-center">
        {renderCard()}
      </div>
    )
  }
)
