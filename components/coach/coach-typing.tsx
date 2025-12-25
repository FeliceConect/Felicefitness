'use client'

import { CoachAvatar } from './coach-avatar'

export function CoachTyping() {
  return (
    <div className="flex items-start gap-3">
      <CoachAvatar size="sm" animated />
      <div className="bg-muted rounded-2xl rounded-tl-none px-4 py-3">
        <div className="flex items-center gap-1">
          <span
            className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce"
            style={{ animationDelay: '0ms' }}
          />
          <span
            className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce"
            style={{ animationDelay: '150ms' }}
          />
          <span
            className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce"
            style={{ animationDelay: '300ms' }}
          />
        </div>
      </div>
    </div>
  )
}
