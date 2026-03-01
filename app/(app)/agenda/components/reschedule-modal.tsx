'use client'

import { useState } from 'react'
import { X, RefreshCcw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface RescheduleModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (reason: string) => Promise<void>
  professionalName: string
  date: string
  time: string
}

export function RescheduleModal({
  isOpen,
  onClose,
  onSubmit,
  professionalName,
  date,
  time,
}: RescheduleModalProps) {
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!reason.trim()) return
    setSubmitting(true)
    try {
      await onSubmit(reason.trim())
      setReason('')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl p-6 pb-8 max-h-[80vh]"
          >
            {/* Handle */}
            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-4" />

            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <RefreshCcw className="w-5 h-5 text-dourado" />
                <h3 className="font-heading font-bold text-foreground">
                  Solicitar Reagendamento
                </h3>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-background-elevated transition-colors"
              >
                <X className="w-5 h-5 text-foreground-muted" />
              </button>
            </div>

            {/* Info da consulta */}
            <div className="bg-background-elevated rounded-xl p-3 mb-4">
              <p className="text-sm text-foreground">
                <strong>{professionalName}</strong>
              </p>
              <p className="text-xs text-foreground-secondary capitalize">
                {date} às {time}
              </p>
            </div>

            {/* Motivo */}
            <label className="block mb-2 text-sm font-medium text-foreground">
              Motivo do reagendamento
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Descreva o motivo pelo qual precisa reagendar..."
              rows={3}
              className="w-full rounded-xl border border-border bg-background-input px-4 py-3 text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-dourado/30 focus:border-dourado resize-none"
            />

            {/* Botão */}
            <button
              onClick={handleSubmit}
              disabled={!reason.trim() || submitting}
              className="w-full mt-4 py-3 px-4 rounded-xl bg-dourado text-white font-medium text-sm hover:bg-dourado/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Enviando...' : 'Solicitar Reagendamento'}
            </button>

            <p className="text-xs text-foreground-muted text-center mt-3">
              A equipe será notificada e entrará em contato para reagendar.
            </p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
