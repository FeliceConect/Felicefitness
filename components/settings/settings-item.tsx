'use client'

import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface SettingsItemProps {
  icon: React.ReactNode
  title: string
  description?: string
  onClick?: () => void
  href?: string
  rightElement?: React.ReactNode
  danger?: boolean
  className?: string
}

export function SettingsItem({
  icon,
  title,
  description,
  onClick,
  href,
  rightElement,
  danger = false,
  className
}: SettingsItemProps) {
  const content = (
    <div
      className={cn(
        'flex items-center gap-4 p-4 rounded-lg transition-colors',
        onClick || href ? 'hover:bg-muted/50 cursor-pointer active:bg-muted' : '',
        danger && 'text-destructive',
        className
      )}
      onClick={onClick}
    >
      {/* Icon */}
      <div className={cn(
        'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center',
        danger ? 'bg-destructive/10' : 'bg-muted'
      )}>
        {icon}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          'font-medium',
          danger && 'text-destructive'
        )}>
          {title}
        </p>
        {description && (
          <p className="text-sm text-muted-foreground truncate">{description}</p>
        )}
      </div>

      {/* Right element */}
      {rightElement ? (
        rightElement
      ) : (onClick || href) ? (
        <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
      ) : null}
    </div>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }

  return content
}
