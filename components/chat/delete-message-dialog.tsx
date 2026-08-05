"use client"

import { useEffect, useRef } from 'react'
import { Loader2, Trash2 } from 'lucide-react'

interface DeleteMessageDialogProps {
  open: boolean
  deleting: boolean
  /** Muda o texto quando a mensagem tem anexo (o arquivo também some) */
  hasAttachment?: boolean
  onCancel: () => void
  onConfirm: () => void
}

/**
 * Confirmação de "apagar mensagem" usada no chat do paciente e no portal do
 * profissional. Apagar é irreversível e vale para os dois lados da conversa,
 * então nunca acontece em um toque só.
 */
export function DeleteMessageDialog({
  open,
  deleting,
  hasAttachment,
  onCancel,
  onConfirm,
}: DeleteMessageDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null)

  // Foco inicial na ação segura + Esc fecha
  useEffect(() => {
    if (!open) return
    cancelRef.current?.focus()

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !deleting) onCancel()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, deleting, onCancel])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-message-title"
      aria-describedby="delete-message-description"
    >
      <div
        className="absolute inset-0 bg-cafe/40 backdrop-blur-sm"
        onClick={deleting ? undefined : onCancel}
      />

      <div className="relative w-full max-w-sm bg-white rounded-2xl border border-border shadow-xl p-6">
        <div className="w-12 h-12 rounded-2xl bg-error/10 flex items-center justify-center mb-4">
          <Trash2 className="w-6 h-6 text-error" />
        </div>

        <h2
          id="delete-message-title"
          className="font-heading font-bold text-lg text-foreground mb-2"
        >
          Apagar mensagem?
        </h2>
        <p
          id="delete-message-description"
          className="text-sm text-foreground-secondary leading-relaxed mb-6"
        >
          {hasAttachment
            ? 'A mensagem e o arquivo somem da conversa para você e para a outra pessoa. Não dá para desfazer.'
            : 'A mensagem some da conversa para você e para a outra pessoa. Não dá para desfazer.'}
        </p>

        <div className="flex gap-2">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="flex-1 py-2.5 rounded-full border border-border text-foreground-secondary text-sm font-medium hover:bg-background-elevated disabled:opacity-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full bg-error text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity active:scale-95"
          >
            {deleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Apagando...
              </>
            ) : (
              'Apagar'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
