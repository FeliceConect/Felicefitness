"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { getRevoladeStatus, type RevoladeStatus } from '@/lib/utils/calculations'
import { formatMinutesToTime } from '@/lib/utils/date'
import { cn } from '@/lib/utils'

interface RevoladeWidgetProps {
  config: {
    nome: string
    horario: string
    jejumAntes: number
    restricaoDepois: number
    restricaoTipo: string
  }
  tomadoHoje: boolean
  onMarcarTomado: () => void
}

const statusConfig: Record<RevoladeStatus, {
  bgClass: string
  borderClass: string
  iconBg: string
}> = {
  nao_configurado: {
    bgClass: '',
    borderClass: 'border-[#2E2E3E]',
    iconBg: 'bg-slate-500/20'
  },
  antes_jejum: {
    bgClass: '',
    borderClass: 'border-[#2E2E3E]',
    iconBg: 'bg-slate-500/20'
  },
  jejum: {
    bgClass: 'bg-gradient-to-br from-amber-500/10 to-transparent',
    borderClass: 'border-amber-500/30',
    iconBg: 'bg-amber-500/20'
  },
  tomar_agora: {
    bgClass: 'bg-gradient-to-br from-violet-500/10 to-transparent',
    borderClass: 'border-violet-500/30',
    iconBg: 'bg-violet-500/20'
  },
  restricao: {
    bgClass: 'bg-gradient-to-br from-orange-500/10 to-transparent',
    borderClass: 'border-orange-500/30',
    iconBg: 'bg-orange-500/20'
  },
  liberado: {
    bgClass: 'bg-gradient-to-br from-emerald-500/10 to-transparent',
    borderClass: 'border-emerald-500/30',
    iconBg: 'bg-emerald-500/20'
  }
}

export function RevoladeWidget({ config, tomadoHoje, onMarcarTomado }: RevoladeWidgetProps) {
  const [statusInfo, setStatusInfo] = useState(() => getRevoladeStatus({
    usaMedicamento: true,
    horario: config.horario,
    jejumAntesHoras: config.jejumAntes,
    restricaoDepoisHoras: config.restricaoDepois,
    restricaoTipo: config.restricaoTipo,
    tomadoHoje
  }))

  // Atualizar status a cada minuto
  useEffect(() => {
    const updateStatus = () => {
      setStatusInfo(getRevoladeStatus({
        usaMedicamento: true,
        horario: config.horario,
        jejumAntesHoras: config.jejumAntes,
        restricaoDepoisHoras: config.restricaoDepois,
        restricaoTipo: config.restricaoTipo,
        tomadoHoje
      }))
    }

    updateStatus()
    const interval = setInterval(updateStatus, 60000) // Atualizar a cada minuto

    return () => clearInterval(interval)
  }, [config, tomadoHoje])

  const styles = statusConfig[statusInfo.status]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
      className={cn(
        'bg-[#14141F] border rounded-2xl p-4',
        styles.bgClass,
        styles.borderClass
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={cn('w-8 h-8 rounded-full flex items-center justify-center', styles.iconBg)}>
            <span className="text-lg">💊</span>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">
              {config.nome}
            </h3>
            <p className="text-xs text-slate-500">
              Horário: {config.horario}
            </p>
          </div>
        </div>
        {tomadoHoje && (
          <span className="text-emerald-400 text-lg">✅</span>
        )}
      </div>

      {/* Status Content */}
      <div className="space-y-2">
        {statusInfo.status === 'antes_jejum' && (
          <>
            <p className="text-slate-300 text-sm">
              {statusInfo.mensagem}
            </p>
            {statusInfo.tempoRestante && (
              <p className="text-xs text-slate-500">
                Faltam {formatMinutesToTime(statusInfo.tempoRestante)} para o jejum
              </p>
            )}
          </>
        )}

        {statusInfo.status === 'jejum' && (
          <>
            <div className="flex items-center gap-2">
              <motion.span
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="text-amber-400"
              >
                ⚠️
              </motion.span>
              <p className="text-amber-400 text-sm font-medium">
                Período de jejum
              </p>
            </div>
            {statusInfo.tempoRestante && (
              <p className="text-xs text-slate-400">
                Tomar em {formatMinutesToTime(statusInfo.tempoRestante)}
              </p>
            )}
          </>
        )}

        {statusInfo.status === 'tomar_agora' && !tomadoHoje && (
          <>
            <motion.p
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="text-violet-400 text-sm font-bold"
            >
              Hora de tomar!
            </motion.p>
            <Button
              variant="gradient"
              size="sm"
              onClick={onMarcarTomado}
              className="w-full mt-2"
            >
              Marcar como tomado
            </Button>
          </>
        )}

        {statusInfo.status === 'restricao' && (
          <>
            <p className="text-slate-300 text-sm">
              ✓ Tomado às {config.horario}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-orange-400">⚠️</span>
              <p className="text-orange-400 text-sm font-medium">
                SEM {config.restricaoTipo.toUpperCase()} até {statusInfo.horarioLiberacao}
              </p>
            </div>
            {statusInfo.tempoRestante && (
              <p className="text-xs text-slate-400">
                Faltam {formatMinutesToTime(statusInfo.tempoRestante)}
              </p>
            )}
          </>
        )}

        {statusInfo.status === 'liberado' && tomadoHoje && (
          <p className="text-emerald-400 text-sm">
            ✓ {statusInfo.mensagem}
          </p>
        )}

        {statusInfo.status === 'liberado' && !tomadoHoje && (
          <p className="text-slate-400 text-sm">
            {statusInfo.mensagem}
          </p>
        )}
      </div>
    </motion.div>
  )
}
