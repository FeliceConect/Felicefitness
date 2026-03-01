"use client"

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface StatCardProps {
  icon: string
  value: string | number
  label: string
  className?: string
  onClick?: () => void
}

export function StatCard({
  icon,
  value,
  label,
  className = '',
  onClick
}: StatCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        'bg-white border border-border rounded-xl p-4',
        'flex flex-col items-center justify-center text-center',
        'min-w-[100px]',
        onClick && 'cursor-pointer',
        className
      )}
    >
      <span className="text-2xl mb-1">{icon}</span>
      <span className="text-xl font-bold text-foreground">{value}</span>
      <span className="text-xs text-foreground-secondary">{label}</span>
    </motion.div>
  )
}
