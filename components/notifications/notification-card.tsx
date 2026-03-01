"use client"

import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { motion } from 'framer-motion'
import { Check, X, ExternalLink } from 'lucide-react'
import type { NotificationHistory, NotificationType } from '@/types/notifications'
import { getNotificationTypeIcon, getNotificationTypeColor } from '@/lib/notifications/templates'
import { cn } from '@/lib/utils'

interface NotificationCardProps {
  notification: NotificationHistory
  onMarkAsRead?: () => void
  onDelete?: () => void
  onClick?: () => void
}

export function NotificationCard({
  notification,
  onMarkAsRead,
  onDelete,
  onClick
}: NotificationCardProps) {
  const isRead = !!notification.readAt
  const icon = getNotificationTypeIcon(notification.type as NotificationType)
  const color = getNotificationTypeColor(notification.type as NotificationType)

  const timeAgo = formatDistanceToNow(new Date(notification.sentAt), {
    addSuffix: true,
    locale: ptBR
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className={cn(
        'relative bg-background-card border rounded-xl p-4 transition-colors',
        isRead ? 'border-border' : 'border-dourado/30 bg-dourado/5'
      )}
    >
      {/* Unread indicator */}
      {!isRead && (
        <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-dourado" />
      )}

      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
          style={{ backgroundColor: `${color}20` }}
        >
          {icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className={cn(
              'font-medium truncate',
              isRead ? 'text-foreground-secondary' : 'text-foreground'
            )}>
              {notification.title}
            </h4>
          </div>
          <p className={cn(
            'text-sm mb-2 line-clamp-2',
            isRead ? 'text-foreground-muted' : 'text-foreground-secondary'
          )}>
            {notification.body}
          </p>
          <p className="text-xs text-foreground-muted">{timeAgo}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
        {!isRead && onMarkAsRead && (
          <button
            onClick={onMarkAsRead}
            className="flex items-center gap-1 text-xs text-foreground-muted hover:text-foreground transition-colors"
          >
            <Check className="w-3 h-3" />
            Marcar como lida
          </button>
        )}

        {onClick && (
          <button
            onClick={onClick}
            className="flex items-center gap-1 text-xs text-dourado hover:text-dourado/80 transition-colors ml-auto"
          >
            <ExternalLink className="w-3 h-3" />
            Ver mais
          </button>
        )}

        {onDelete && (
          <button
            onClick={onDelete}
            className="flex items-center gap-1 text-xs text-foreground-muted hover:text-error transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    </motion.div>
  )
}
