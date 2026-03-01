"use client"

import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, Clock, Droplets } from 'lucide-react'
import { getDropletCount } from '@/lib/water/calculations'

// Formata horário para exibição - aceita HH:mm ou timestamp ISO
// Usa o timezone local do dispositivo do usuário
function formatTime(horario: string): string {
  // Se já está no formato HH:mm, retorna como está
  if (/^\d{2}:\d{2}$/.test(horario)) {
    return horario
  }
  // Se é um timestamp ISO, converte para horário local do dispositivo
  try {
    const date = new Date(horario)
    if (isNaN(date.getTime())) return horario
    // Usa toLocaleTimeString para pegar o horário local do dispositivo
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  } catch {
    return horario
  }
}

interface WaterLogItem {
  id: string
  horario: string
  quantidade_ml: number
}

interface WaterLogListProps {
  logs: WaterLogItem[]
  onDelete?: (id: string) => void
  showTotal?: boolean
}

export function WaterLogList({ logs, onDelete, showTotal = true }: WaterLogListProps) {
  const total = logs.reduce((sum, log) => sum + log.quantidade_ml, 0)

  if (logs.length === 0) {
    return (
      <div className="bg-white border border-border rounded-xl p-6 text-center">
        <Droplets className="w-10 h-10 text-foreground-muted mx-auto mb-3" />
        <p className="text-foreground-secondary">Nenhum registro hoje</p>
        <p className="text-sm text-foreground-muted mt-1">
          Adicione água para começar a rastrear
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-foreground-muted" />
          <span className="text-sm font-medium text-foreground-secondary">
            Registros de hoje
          </span>
        </div>
        <span className="text-sm text-foreground-muted">
          {logs.length} {logs.length === 1 ? 'registro' : 'registros'}
        </span>
      </div>

      {/* Log items */}
      <div className="divide-y divide-border">
        <AnimatePresence initial={false}>
          {logs.map((log, index) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20, height: 0 }}
              transition={{ duration: 0.2, delay: index * 0.03 }}
              className="flex items-center justify-between px-4 py-3 hover:bg-background-elevated transition-colors group"
            >
              <div className="flex items-center gap-3">
                {/* Time */}
                <span className="text-foreground-muted text-sm w-12">
                  {formatTime(log.horario)}
                </span>

                {/* Droplets indicator */}
                <div className="flex gap-0.5">
                  {Array.from({ length: getDropletCount(log.quantidade_ml) }).map((_, i) => (
                    <span key={i} className="text-xs">💧</span>
                  ))}
                </div>

                {/* Amount */}
                <span className="text-foreground font-medium">
                  +{log.quantidade_ml}ml
                </span>
              </div>

              {/* Delete button */}
              {onDelete && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => onDelete(log.id)}
                  className="p-2 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </motion.button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Total */}
      {showTotal && (
        <div className="px-4 py-3 border-t border-border bg-background flex items-center justify-between">
          <span className="text-sm text-foreground-secondary">Total do dia</span>
          <span className="font-bold text-dourado">
            {total >= 1000 ? `${(total / 1000).toFixed(1)}L` : `${total}ml`}
          </span>
        </div>
      )}
    </div>
  )
}
