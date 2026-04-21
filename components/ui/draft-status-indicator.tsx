'use client'

import { Check, Loader2 } from 'lucide-react'
import type { DraftStatus } from '@/hooks/use-draft-autosave'

interface DraftStatusIndicatorProps {
  status: DraftStatus
  lastSavedAt: number | null
}

export function DraftStatusIndicator({ status, lastSavedAt }: DraftStatusIndicatorProps) {
  if (status === 'saving') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-foreground-muted">
        <Loader2 className="w-3 h-3 animate-spin" />
        Salvando rascunho...
      </span>
    )
  }
  if (status === 'saved' && lastSavedAt) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-foreground-muted">
        <Check className="w-3 h-3 text-emerald-600" />
        Rascunho salvo
      </span>
    )
  }
  if (status === 'error') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-red-500">
        Falha ao salvar rascunho
      </span>
    )
  }
  return null
}
