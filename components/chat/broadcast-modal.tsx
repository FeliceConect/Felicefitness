"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, Loader2, Megaphone, Check } from 'lucide-react'
import { toast } from 'sonner'

interface BroadcastModalProps {
  isOpen: boolean
  onClose: () => void
}

const MAX_LEN = 2000

/**
 * Modal para o profissional enviar uma mensagem única a todos os seus
 * pacientes ativos de uma vez. Cai na conversa individual de cada paciente.
 */
export function BroadcastModal({ isOpen, onClose }: BroadcastModalProps) {
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const reset = () => {
    setContent('')
    setConfirming(false)
    setSending(false)
  }

  const handleClose = () => {
    if (sending) return
    reset()
    onClose()
  }

  const handleSend = async () => {
    const text = content.trim()
    if (!text) {
      toast.error('Escreva a mensagem antes de enviar')
      return
    }
    if (!confirming) {
      setConfirming(true)
      return
    }

    setSending(true)
    try {
      const res = await fetch('/api/chat/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text }),
      })
      const data = await res.json()
      if (data.success) {
        const falhas = data.failed > 0 ? ` (${data.failed} não entregues)` : ''
        toast.success(`Mensagem enviada para ${data.sent} paciente${data.sent !== 1 ? 's' : ''}${falhas}`)
        reset()
        onClose()
      } else {
        toast.error(data.error || 'Erro ao enviar mensagem')
        setConfirming(false)
      }
    } catch {
      toast.error('Erro de conexão. Tente novamente.')
      setConfirming(false)
    } finally {
      setSending(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 60 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl p-6 space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-dourado/15 flex items-center justify-center">
                <Megaphone className="w-5 h-5 text-dourado" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Mensagem para todos</h2>
                <p className="text-xs text-foreground-secondary">
                  Enviada individualmente para cada paciente ativo
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={sending}
              className="p-2 hover:bg-background-elevated rounded-lg transition-colors disabled:opacity-50"
              aria-label="Fechar"
            >
              <X className="w-5 h-5 text-foreground-secondary" />
            </button>
          </div>

          <textarea
            value={content}
            onChange={(e) => { setContent(e.target.value); setConfirming(false) }}
            placeholder="Ex.: Pessoal, lembrem de preencher o formulário antes da consulta desta semana. Qualquer dúvida, me chamem por aqui!"
            rows={5}
            maxLength={MAX_LEN}
            disabled={sending}
            className="w-full bg-background border border-border rounded-xl p-3 text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-dourado resize-none disabled:opacity-60"
          />
          <div className="flex items-center justify-between text-xs text-foreground-muted -mt-2">
            <span>Cada paciente recebe como mensagem privada e pode responder individualmente.</span>
            <span>{content.length}/{MAX_LEN}</span>
          </div>

          {confirming && !sending && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
              <p className="text-sm text-amber-700">
                Confirmar o envio desta mensagem para <strong>todos os seus pacientes ativos</strong>?
                Toque em &ldquo;Confirmar envio&rdquo; novamente.
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleClose}
              disabled={sending}
              className="flex-1 py-3 bg-background text-foreground-secondary rounded-xl font-medium hover:bg-background-elevated transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSend}
              disabled={sending || !content.trim()}
              className="flex-1 inline-flex items-center justify-center gap-2 py-3 bg-dourado text-white rounded-xl font-medium hover:bg-dourado/90 transition-colors disabled:opacity-50"
            >
              {sending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : confirming ? (
                <Check className="w-5 h-5" />
              ) : (
                <Send className="w-5 h-5" />
              )}
              {sending ? 'Enviando...' : confirming ? 'Confirmar envio' : 'Enviar para todos'}
            </button>
          </div>
        </motion.div>
      </motion.div>
      )}
    </AnimatePresence>
  )
}
