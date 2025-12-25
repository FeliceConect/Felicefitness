"use client"

import { cn } from '@/lib/utils'

interface IconBadgeProps {
  icon: string
  label?: string
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
  size?: 'sm' | 'md' | 'lg'
  pulse?: boolean
  className?: string
}

const variantStyles = {
  default: 'bg-[#2E2E3E] text-slate-300',
  success: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  warning: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  error: 'bg-red-500/20 text-red-400 border-red-500/30',
  info: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
}

const sizeStyles = {
  sm: 'text-xs px-2 py-1 gap-1',
  md: 'text-sm px-3 py-1.5 gap-1.5',
  lg: 'text-base px-4 py-2 gap-2'
}

export function IconBadge({
  icon,
  label,
  variant = 'default',
  size = 'md',
  pulse = false,
  className = ''
}: IconBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border border-transparent font-medium',
        variantStyles[variant],
        sizeStyles[size],
        pulse && 'animate-pulse',
        className
      )}
    >
      <span>{icon}</span>
      {label && <span>{label}</span>}
    </span>
  )
}
