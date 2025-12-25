"use client"

import { motion } from 'framer-motion'
import { StatCard } from '@/components/shared'

interface StatsOverviewProps {
  stats: {
    totalTreinos: number
    streakAtual: number
    prsEsteMes: number
  }
}

export function StatsOverview({ stats }: StatsOverviewProps) {
  const statsData = [
    { icon: '🏋️', value: stats.totalTreinos, label: 'treinos' },
    { icon: '📅', value: stats.streakAtual, label: 'streak' },
    { icon: '🏆', value: stats.prsEsteMes, label: 'PRs mês' }
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.55 }}
      className="grid grid-cols-3 gap-3"
    >
      {statsData.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.55 + index * 0.1 }}
        >
          <StatCard
            icon={stat.icon}
            value={stat.value}
            label={stat.label}
          />
        </motion.div>
      ))}
    </motion.div>
  )
}
