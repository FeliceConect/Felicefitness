"use client"

import { motion } from 'framer-motion'
import type { DailyScoreBreakdown } from '@/types/gamification'
import {
  getScoreColor,
  getScoreMessage,
  getScoreEmoji,
  SCORE_WEIGHTS,
  getCategoryProgress
} from '@/lib/gamification'

interface DailyScoreProps {
  breakdown: DailyScoreBreakdown
  size?: 'sm' | 'md' | 'lg'
  showBreakdown?: boolean
  animate?: boolean
}

const categoryLabels = {
  workout: { label: 'Treino', icon: '💪' },
  nutrition: { label: 'Nutrição', icon: '🥗' },
  hydration: { label: 'Hidratação', icon: '💧' },
  extras: { label: 'Extras', icon: '✨' }
}

export function DailyScore({
  breakdown,
  size = 'md',
  showBreakdown = true,
  animate = true
}: DailyScoreProps) {
  const { total } = breakdown
  const color = getScoreColor(total)
  const message = getScoreMessage(total)
  const emoji = getScoreEmoji(total)

  const sizeClasses = {
    sm: { circle: 'w-16 h-16', number: 'text-xl', label: 'text-xs' },
    md: { circle: 'w-24 h-24', number: 'text-3xl', label: 'text-sm' },
    lg: { circle: 'w-32 h-32', number: 'text-4xl', label: 'text-base' }
  }

  // Calcular circunferência para o círculo de progresso
  const circleRadius = size === 'sm' ? 28 : size === 'md' ? 44 : 60
  const circumference = 2 * Math.PI * circleRadius

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Círculo de Score */}
      <div className="relative">
        <svg className={sizeClasses[size].circle} viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r={circleRadius}
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            className="text-muted"
          />
          {/* Progress circle */}
          <motion.circle
            cx="50"
            cy="50"
            r={circleRadius}
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{
              strokeDashoffset: animate
                ? circumference - (total / 100) * circumference
                : circumference - (total / 100) * circumference
            }}
            transition={{ duration: 1, ease: "easeOut" }}
            style={{
              transform: 'rotate(-90deg)',
              transformOrigin: '50% 50%'
            }}
          />
        </svg>

        {/* Score Number */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className={`${sizeClasses[size].number} font-bold`}
            style={{ color }}
            initial={animate ? { scale: 0 } : {}}
            animate={animate ? { scale: 1 } : {}}
            transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
          >
            {total}
          </motion.span>
          <span className={`${sizeClasses[size].label} text-muted-foreground`}>
            pontos
          </span>
        </div>
      </div>

      {/* Message */}
      <motion.div
        className="flex items-center gap-2"
        initial={animate ? { opacity: 0, y: 10 } : {}}
        animate={animate ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.8 }}
      >
        <span className="text-xl">{emoji}</span>
        <span className="font-medium" style={{ color }}>
          {message}
        </span>
      </motion.div>

      {/* Breakdown */}
      {showBreakdown && (
        <motion.div
          className="w-full space-y-2"
          initial={animate ? { opacity: 0 } : {}}
          animate={animate ? { opacity: 1 } : {}}
          transition={{ delay: 1 }}
        >
          {(Object.keys(categoryLabels) as Array<keyof typeof categoryLabels>).map((key) => {
            const { label, icon } = categoryLabels[key]
            const categoryKey = key as keyof Omit<DailyScoreBreakdown, 'total'>
            const progress = getCategoryProgress(categoryKey, breakdown[categoryKey])

            return (
              <div key={key} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1">
                    <span>{icon}</span>
                    <span className="text-muted-foreground">{label}</span>
                  </span>
                  <span className="font-medium">
                    {breakdown[categoryKey]}/{SCORE_WEIGHTS[categoryKey]}
                  </span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: progress.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress.percentage}%` }}
                    transition={{ duration: 0.5, delay: 1 + 0.1 * Object.keys(categoryLabels).indexOf(key) }}
                  />
                </div>
              </div>
            )
          })}
        </motion.div>
      )}
    </div>
  )
}
