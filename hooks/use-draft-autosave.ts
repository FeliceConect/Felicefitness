'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

const KEY_PREFIX = 'felice-draft:'
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

export type DraftStatus = 'idle' | 'saving' | 'saved' | 'error'

export interface DraftEntry<T> {
  value: T
  savedAt: number
}

interface Options<T> {
  enabled?: boolean
  debounceMs?: number
  isEmpty?: (value: T) => boolean
}

export interface UseDraftAutosaveReturn<T> {
  status: DraftStatus
  lastSavedAt: number | null
  pendingDraft: DraftEntry<T> | null
  clearDraft: () => void
  dismissPending: () => void
}

/**
 * Autosave em localStorage com debounce. Pensado para proteger formulários
 * longos (prontuário, plano alimentar, antropometria) contra perda de dados
 * por reload inesperado (service worker, crash, fechamento acidental).
 *
 * Uso típico:
 *   const { status, lastSavedAt, pendingDraft, clearDraft, dismissPending } =
 *     useDraftAutosave(`consultation:${patientId}:new`, formValue, {
 *       enabled: modalOpen,
 *       isEmpty: v => !v.anamnese && !v.exames
 *     })
 *
 *   // Ao salvar no servidor com sucesso: clearDraft()
 *   // Ao montar, se pendingDraft != null: renderizar banner de restauração
 */
export function useDraftAutosave<T>(
  key: string,
  value: T,
  options: Options<T> = {}
): UseDraftAutosaveReturn<T> {
  const { enabled = true, debounceMs = 800, isEmpty } = options
  const storageKey = KEY_PREFIX + key

  const [status, setStatus] = useState<DraftStatus>('idle')
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null)
  const [pendingDraft, setPendingDraft] = useState<DraftEntry<T> | null>(null)
  const didReadPending = useRef<string | null>(null)

  // Lê draft pendente quando a chave muda (ex: trocar de paciente / novo vs edit).
  useEffect(() => {
    if (didReadPending.current === storageKey) return
    didReadPending.current = storageKey
    if (typeof window === 'undefined') return
    try {
      const raw = window.localStorage.getItem(storageKey)
      if (!raw) {
        setPendingDraft(null)
        return
      }
      const parsed = JSON.parse(raw) as DraftEntry<T>
      if (!parsed?.savedAt || Date.now() - parsed.savedAt > MAX_AGE_MS) {
        window.localStorage.removeItem(storageKey)
        setPendingDraft(null)
        return
      }
      setPendingDraft(parsed)
    } catch {
      // JSON ruim: ignorar
    }
  }, [storageKey])

  // Autosave debounced
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return
    if (isEmpty && isEmpty(value)) return

    setStatus('saving')
    const t = setTimeout(() => {
      try {
        const savedAt = Date.now()
        const payload: DraftEntry<T> = { value, savedAt }
        window.localStorage.setItem(storageKey, JSON.stringify(payload))
        setLastSavedAt(savedAt)
        setStatus('saved')
      } catch (err) {
        console.warn('[useDraftAutosave] falha ao salvar rascunho:', err)
        setStatus('error')
      }
    }, debounceMs)

    return () => clearTimeout(t)
  }, [value, enabled, debounceMs, storageKey, isEmpty])

  const clearDraft = useCallback(() => {
    if (typeof window !== 'undefined') {
      try { window.localStorage.removeItem(storageKey) } catch { /* noop */ }
    }
    setPendingDraft(null)
    setLastSavedAt(null)
    setStatus('idle')
  }, [storageKey])

  const dismissPending = useCallback(() => {
    setPendingDraft(null)
  }, [])

  return { status, lastSavedAt, pendingDraft, clearDraft, dismissPending }
}
