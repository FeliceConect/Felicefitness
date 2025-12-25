'use client'

import { cn } from '@/lib/utils'
import { CoachAvatar } from './coach-avatar'
import { CoachActionButton } from './coach-action-button'
import type { CoachMessage as CoachMessageType, CoachAction } from '@/types/coach'
import { User } from 'lucide-react'

interface CoachMessageProps {
  message: CoachMessageType
  onActionClick?: (action: CoachAction) => void
}

export function CoachMessage({ message, onActionClick }: CoachMessageProps) {
  const isUser = message.role === 'user'

  return (
    <div
      className={cn(
        'flex items-start gap-3 animate-in fade-in-0 slide-in-from-bottom-2 duration-300',
        isUser && 'flex-row-reverse'
      )}
    >
      {/* Avatar */}
      {isUser ? (
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
          <User className="h-4 w-4 text-muted-foreground" />
        </div>
      ) : (
        <CoachAvatar size="sm" />
      )}

      {/* Message content */}
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-3',
          isUser
            ? 'bg-primary text-primary-foreground rounded-tr-none'
            : 'bg-muted rounded-tl-none'
        )}
      >
        {/* Message text with markdown-like formatting */}
        <div className="text-sm whitespace-pre-wrap">
          {formatMessage(message.content)}
        </div>

        {/* Actions */}
        {!isUser && message.actions && message.actions.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border/50">
            {message.actions.map((action, index) => (
              <CoachActionButton
                key={index}
                action={action}
                onClick={() => onActionClick?.(action)}
              />
            ))}
          </div>
        )}

        {/* Timestamp */}
        <p
          className={cn(
            'text-[10px] mt-1',
            isUser ? 'text-primary-foreground/70' : 'text-muted-foreground'
          )}
        >
          {formatTime(message.createdAt)}
        </p>
      </div>
    </div>
  )
}

function formatMessage(content: string): React.ReactNode {
  // Split by bold markers **text**
  const parts = content.split(/(\*\*[^*]+\*\*)/g)

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      )
    }
    return part
  })
}

function formatTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}
