'use client'

import { FadeIn } from '@/components/ui/animations/fade-in'
import { Clock } from 'lucide-react'

interface ComingSoonProps {
  title?: string
  description?: string
}

export function ComingSoon({
  title = 'Em breve',
  description = 'Esta funcionalidade está em desenvolvimento e será lançada em breve.',
}: ComingSoonProps) {
  return (
    <FadeIn className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="relative mb-4">
        <Clock className="w-16 h-16 text-primary" />
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full animate-pulse" />
      </div>

      <h3 className="text-lg font-semibold text-foreground mb-2">
        {title}
      </h3>

      <p className="text-foreground-muted text-sm max-w-xs">
        {description}
      </p>
    </FadeIn>
  )
}
