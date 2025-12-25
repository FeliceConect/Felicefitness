'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { CoachMessage } from './coach-message'
import { CoachTyping } from './coach-typing'
import { CoachInput } from './coach-input'
import { CoachSuggestions } from './coach-suggestions'
import { CoachContextCard } from './coach-context-card'
import { CoachAvatar } from './coach-avatar'
import type { CoachMessage as MessageType, CoachAction, UserContext } from '@/types/coach'
import { QUICK_SUGGESTIONS } from '@/types/coach'

interface CoachChatProps {
  messages: MessageType[]
  isLoading: boolean
  context: UserContext | null
  onSendMessage: (message: string) => void
  onActionClick: (action: CoachAction) => void
  className?: string
}

export function CoachChat({
  messages,
  isLoading,
  context,
  onSendMessage,
  onActionClick,
  className,
}: CoachChatProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const showSuggestions = messages.length === 0

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Context card */}
      <div className="px-4 py-2">
        <CoachContextCard context={context} />
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Welcome message if no messages */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center text-center py-8">
            <CoachAvatar size="lg" />
            <h2 className="font-semibold text-lg mt-4">FeliceCoach</h2>
            <p className="text-muted-foreground text-sm mt-1 max-w-[280px]">
              Seu coach pessoal de fitness. Pergunte qualquer coisa sobre treino,
              nutrição ou seu progresso.
            </p>
          </div>
        )}

        {/* Messages */}
        {messages.map((message) => (
          <CoachMessage
            key={message.id}
            message={message}
            onActionClick={onActionClick}
          />
        ))}

        {/* Typing indicator */}
        {isLoading && <CoachTyping />}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {showSuggestions && (
        <div className="px-4 pb-2">
          <p className="text-xs text-muted-foreground mb-2">Sugestões:</p>
          <CoachSuggestions
            suggestions={QUICK_SUGGESTIONS.slice(0, 4)}
            onSelect={onSendMessage}
          />
        </div>
      )}

      {/* Input */}
      <CoachInput
        onSend={onSendMessage}
        disabled={isLoading}
        placeholder="Pergunte ao seu coach..."
      />
    </div>
  )
}
