'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ThumbsUp, ThumbsDown } from 'lucide-react'

interface CoachFeedbackProps {
  messageId: string
  onFeedback?: (messageId: string, positive: boolean) => void
  className?: string
}

export function CoachFeedback({
  messageId,
  onFeedback,
  className,
}: CoachFeedbackProps) {
  const [feedback, setFeedback] = useState<'positive' | 'negative' | null>(null)

  const handleFeedback = (positive: boolean) => {
    const newFeedback = positive ? 'positive' : 'negative'
    setFeedback(newFeedback)
    onFeedback?.(messageId, positive)
  }

  if (feedback) {
    return (
      <p className={cn('text-xs text-muted-foreground', className)}>
        Obrigado pelo feedback!
      </p>
    )
  }

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <span className="text-xs text-muted-foreground mr-1">Útil?</span>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={() => handleFeedback(true)}
      >
        <ThumbsUp className="h-3 w-3" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={() => handleFeedback(false)}
      >
        <ThumbsDown className="h-3 w-3" />
      </Button>
    </div>
  )
}
