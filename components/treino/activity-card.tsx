"use client"

import { motion } from 'framer-motion'
import { Clock, Flame, MapPin, Trash2 } from 'lucide-react'
import type { Activity } from '@/lib/activity/types'
import { activityTypeLabels, intensityLabels } from '@/lib/activity/types'
import { cn } from '@/lib/utils'

interface ActivityCardProps {
  activity: Activity
  onDelete?: (id: string) => void
  index?: number
}

export function ActivityCard({ activity, onDelete, index = 0 }: ActivityCardProps) {
  const typeInfo = activityTypeLabels[activity.activity_type]
  const intensityInfo = intensityLabels[activity.intensity]

  const displayName = activity.activity_type === 'outro'
    ? activity.custom_name || 'Atividade'
    : typeInfo.label

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white border border-border rounded-xl p-4"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center text-xl',
            typeInfo.color + '/20'
          )}>
            {typeInfo.icon}
          </div>

          {/* Info */}
          <div>
            <h3 className="text-foreground font-medium">{displayName}</h3>
            <div className="flex items-center gap-3 text-sm text-foreground-secondary mt-1">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {activity.duration_minutes} min
              </span>
              <span className={cn('font-medium', intensityInfo.color)}>
                {intensityInfo.label}
              </span>
            </div>
          </div>
        </div>

        {/* Delete button */}
        {onDelete && (
          <button
            onClick={() => onDelete(activity.id)}
            className="p-2 text-foreground-muted hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Extra info */}
      <div className="mt-3 flex flex-wrap gap-3 text-xs">
        {activity.calories_burned && (
          <span className="flex items-center gap-1 text-orange-400">
            <Flame className="w-3.5 h-3.5" />
            {activity.calories_burned} kcal
          </span>
        )}
        {activity.distance_km && (
          <span className="text-dourado">
            {activity.distance_km} km
          </span>
        )}
        {activity.location && (
          <span className="flex items-center gap-1 text-foreground-secondary">
            <MapPin className="w-3.5 h-3.5" />
            {activity.location}
          </span>
        )}
      </div>

      {/* Notes */}
      {activity.notes && (
        <p className="mt-2 text-sm text-foreground-muted italic">
          {activity.notes}
        </p>
      )}
    </motion.div>
  )
}
