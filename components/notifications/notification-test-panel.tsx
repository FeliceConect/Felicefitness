"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Dumbbell,
  Utensils,
  Droplets,
  Pill,
  Moon,
  Trophy,
  Send,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { useNotifications } from '@/hooks/use-notifications'
import { cn } from '@/lib/utils'

const TEST_TYPES = [
  { id: 'boas_vindas', label: 'Boas-vindas', icon: Send, color: 'violet' },
  { id: 'treino', label: 'Treino', icon: Dumbbell, color: 'violet' },
  { id: 'refeicao', label: 'Refeição', icon: Utensils, color: 'amber' },
  { id: 'agua', label: 'Água', icon: Droplets, color: 'cyan' },
  { id: 'medicamento', label: 'Medicamento', icon: Pill, color: 'red' },
  { id: 'sono', label: 'Sono', icon: Moon, color: 'indigo' },
  { id: 'conquista', label: 'Conquista', icon: Trophy, color: 'emerald' }
]

export function NotificationTestPanel() {
  const { sendTestNotification, isSubscribed, testError } = useNotifications()
  const [selectedType, setSelectedType] = useState('boas_vindas')
  const [isSending, setIsSending] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSendTest = async () => {
    setIsSending(true)
    setSuccess(false)

    const result = await sendTestNotification(selectedType)

    setIsSending(false)
    if (result) {
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    }
  }

  if (!isSubscribed) {
    return (
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-400 font-medium">Notificações não ativadas</p>
            <p className="text-amber-400/80 text-sm">
              Ative as notificações primeiro para poder testar.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-foreground-secondary mb-3">
          Selecione o tipo de notificação para testar:
        </p>

        <div className="grid grid-cols-2 gap-2">
          {TEST_TYPES.map((type) => {
            const Icon = type.icon
            const isSelected = selectedType === type.id

            return (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={cn(
                  'flex items-center gap-2 p-3 rounded-xl border transition-all text-left',
                  isSelected
                    ? 'bg-dourado/15 border-dourado/50 text-foreground'
                    : 'bg-background-card border-border text-foreground-muted hover:text-foreground'
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{type.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Send button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleSendTest}
        disabled={isSending}
        className={cn(
          'w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors',
          success
            ? 'bg-success text-white'
            : 'bg-dourado text-white'
        )}
      >
        {isSending ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Enviando...
          </>
        ) : success ? (
          <>
            <CheckCircle className="w-5 h-5" />
            Enviado!
          </>
        ) : (
          <>
            <Send className="w-5 h-5" />
            Enviar Notificação de Teste
          </>
        )}
      </motion.button>

      {/* Error message */}
      {testError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-400 text-sm">{testError}</p>
          </div>
        </div>
      )}

      {/* Info */}
      <p className="text-xs text-foreground-muted text-center">
        A notificação será enviada para este dispositivo em poucos segundos.
      </p>
    </div>
  )
}
