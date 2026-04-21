'use client'

import { RotateCcw, X } from 'lucide-react'

interface DraftRestoreBannerProps {
  savedAt: number
  onRestore: () => void
  onDiscard: () => void
  label?: string
}

function formatRelative(ms: number) {
  const diff = Date.now() - ms
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'há instantes'
  if (mins < 60) return `há ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `há ${hours}h`
  const days = Math.floor(hours / 24)
  return `há ${days}d`
}

export function DraftRestoreBanner({
  savedAt,
  onRestore,
  onDiscard,
  label = 'Rascunho não salvo encontrado',
}: DraftRestoreBannerProps) {
  return (
    <div className="flex items-center gap-3 p-3 mb-3 rounded-lg border border-dourado/40 bg-dourado/10">
      <RotateCcw className="w-4 h-4 text-dourado flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-foreground-muted">Salvo {formatRelative(savedAt)}</p>
      </div>
      <button
        type="button"
        onClick={onRestore}
        className="px-3 py-1.5 rounded-lg bg-dourado text-white text-xs font-medium hover:bg-dourado/90 transition-colors"
      >
        Restaurar
      </button>
      <button
        type="button"
        onClick={onDiscard}
        className="p-1.5 rounded-lg hover:bg-background-elevated text-foreground-muted"
        aria-label="Descartar rascunho"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
