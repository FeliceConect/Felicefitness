'use client'

import { useState } from 'react'
import { X, Trophy } from 'lucide-react'

interface AwardPointsModalProps {
  isOpen: boolean
  onClose: () => void
  onAward: (points: number, reason: string) => Promise<void>
  clientName: string
}

export function AwardPointsModal({ isOpen, onClose, onAward, clientName }: AwardPointsModalProps) {
  const [points, setPoints] = useState(20)
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason.trim()) return
    setSaving(true)
    try {
      await onAward(points, reason.trim())
      setPoints(20)
      setReason('')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Trophy className="w-5 h-5 text-dourado" />
            Atribuir Pontos
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-background-elevated rounded-lg">
            <X className="w-5 h-5 text-foreground-secondary" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <p className="text-sm text-foreground-secondary">
            Atribuir pontos bonus para <span className="font-medium text-foreground">{clientName}</span>
          </p>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Pontos: <span className="text-dourado font-bold text-lg">{points}</span>
            </label>
            <input
              type="range"
              min={5}
              max={50}
              step={5}
              value={points}
              onChange={(e) => setPoints(Number(e.target.value))}
              className="w-full accent-dourado"
            />
            <div className="flex justify-between text-xs text-foreground-muted mt-1">
              <span>5</span>
              <span>50</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Motivo</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-background-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-dourado/50"
              placeholder="Ex: Dedicacao extra, aderencia ao plano..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-border text-foreground-secondary text-sm font-medium hover:bg-background-elevated transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!reason.trim() || saving}
              className="flex-1 px-4 py-2.5 rounded-lg bg-dourado text-white text-sm font-medium hover:bg-dourado/90 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Atribuindo...' : `Atribuir ${points} pts`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
