"use client"

import { motion } from 'framer-motion'

interface ProgressRingProps {
  progress: number          // 0-1
  size?: number            // tamanho do círculo
  strokeWidth?: number     // espessura do traço
  color?: string           // cor do progresso
  bgColor?: string         // cor do fundo
  children?: React.ReactNode
  showPercent?: boolean
  className?: string
}

export function ProgressRing({
  progress,
  size = 120,
  strokeWidth = 8,
  color = 'var(--dourado)',
  bgColor = 'var(--border)',
  children,
  showPercent = false,
  className = ''
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDashoffset = circumference - (Math.min(progress, 1) * circumference)

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={bgColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children || (showPercent && (
          <span className="text-lg font-bold text-foreground">
            {Math.round(progress * 100)}%
          </span>
        ))}
      </div>
    </div>
  )
}
