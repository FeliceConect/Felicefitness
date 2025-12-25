'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Send, Mic } from 'lucide-react'

interface CoachInputProps {
  onSend: (message: string) => void
  disabled?: boolean
  placeholder?: string
}

export function CoachInput({
  onSend,
  disabled = false,
  placeholder = 'Digite sua mensagem...',
}: CoachInputProps) {
  const [message, setMessage] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`
    }
  }, [message])

  const handleSubmit = () => {
    const trimmed = message.trim()
    if (trimmed && !disabled) {
      onSend(trimmed)
      setMessage('')
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="flex items-end gap-2 p-4 bg-background border-t">
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className={cn(
            'w-full resize-none rounded-2xl border bg-muted/50 px-4 py-3 pr-12 text-sm',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
            'placeholder:text-muted-foreground',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'max-h-[120px] overflow-y-auto'
          )}
        />

        {/* Voice button (future feature) */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 bottom-1.5 h-8 w-8 text-muted-foreground hover:text-foreground"
          disabled
        >
          <Mic className="h-4 w-4" />
        </Button>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={disabled || !message.trim()}
        size="icon"
        className="h-12 w-12 rounded-full flex-shrink-0"
      >
        <Send className="h-5 w-5" />
      </Button>
    </div>
  )
}
