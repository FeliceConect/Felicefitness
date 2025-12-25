"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Bell,
  BellOff,
  Settings,
  CheckCheck,
  Trash2,
  Filter,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useNotifications } from '@/hooks/use-notifications'
import { NotificationCard, NotificationToggle } from '@/components/notifications'
import { getNotificationTypeIcon } from '@/lib/notifications/templates'
import type { NotificationType } from '@/types/notifications'
import { cn } from '@/lib/utils'

const FILTER_OPTIONS: { value: NotificationType | 'all'; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'treino', label: 'Treino' },
  { value: 'refeicao', label: 'Refeição' },
  { value: 'agua', label: 'Água' },
  { value: 'medicamento', label: 'Medicamento' },
  { value: 'conquista', label: 'Conquistas' }
]

export default function NotificationsPage() {
  const router = useRouter()
  const {
    history,
    unreadCount,
    isLoadingHistory,
    isSubscribed,
    loadHistory,
    markAsRead,
    markAllAsRead,
    clearHistory
  } = useNotifications()

  const [filter, setFilter] = useState<NotificationType | 'all'>('all')
  const [showFilter, setShowFilter] = useState(false)

  // Carregar histórico
  useEffect(() => {
    const type = filter === 'all' ? undefined : filter
    loadHistory({ limit: 50, type })
  }, [filter, loadHistory])

  // Filtrar notificações localmente
  const filteredHistory = filter === 'all'
    ? history
    : history.filter(n => n.type === filter)

  const handleMarkAsRead = async (id: string) => {
    await markAsRead([id])
  }

  const handleMarkAllAsRead = async () => {
    await markAllAsRead()
  }

  const handleClearAll = async () => {
    if (confirm('Tem certeza que deseja limpar todo o histórico?')) {
      await clearHistory()
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] pb-24">
      {/* Header */}
      <div className="px-4 pt-12 pb-4">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Voltar</span>
          </button>

          <div className="flex items-center gap-2">
            <Link
              href="/configuracoes/notificacoes"
              className="p-2 rounded-xl bg-[#14141F] border border-[#2E2E3E] text-slate-400 hover:text-white transition-colors"
            >
              <Settings className="w-5 h-5" />
            </Link>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Notificações</h1>
            <p className="text-slate-400 text-sm mt-1">
              {unreadCount > 0 ? `${unreadCount} não lidas` : 'Todas lidas'}
            </p>
          </div>

          {/* Filter button */}
          <button
            onClick={() => setShowFilter(!showFilter)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors',
              showFilter
                ? 'bg-violet-500 text-white'
                : 'bg-[#14141F] border border-[#2E2E3E] text-slate-400'
            )}
          >
            <Filter className="w-4 h-4" />
            <span>Filtrar</span>
          </button>
        </div>
      </div>

      {/* Filter options */}
      <AnimatePresence>
        {showFilter && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden px-4 pb-4"
          >
            <div className="flex gap-2 flex-wrap">
              {FILTER_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFilter(option.value)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors',
                    filter === option.value
                      ? 'bg-violet-500 text-white'
                      : 'bg-[#14141F] border border-[#2E2E3E] text-slate-400 hover:text-white'
                  )}
                >
                  {option.value !== 'all' && (
                    <span>{getNotificationTypeIcon(option.value)}</span>
                  )}
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions bar */}
      {filteredHistory.length > 0 && (
        <div className="px-4 pb-4 flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#14141F] border border-[#2E2E3E] text-slate-400 hover:text-white text-sm transition-colors"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Marcar todas como lidas</span>
            </button>
          )}

          <button
            onClick={handleClearAll}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#14141F] border border-[#2E2E3E] text-slate-400 hover:text-red-400 text-sm transition-colors ml-auto"
          >
            <Trash2 className="w-4 h-4" />
            <span>Limpar</span>
          </button>
        </div>
      )}

      {/* Content */}
      <div className="px-4">
        {/* Not subscribed message */}
        {!isSubscribed && (
          <div className="bg-[#14141F] border border-[#2E2E3E] rounded-xl p-6 text-center">
            <BellOff className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <h3 className="text-white font-semibold mb-2">Notificações desativadas</h3>
            <p className="text-slate-400 text-sm mb-4">
              Ative para receber lembretes de treino, refeições e mais.
            </p>
            <NotificationToggle showLabel={false} />
          </div>
        )}

        {/* Loading */}
        {isLoadingHistory && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
          </div>
        )}

        {/* Empty state */}
        {!isLoadingHistory && isSubscribed && filteredHistory.length === 0 && (
          <div className="bg-[#14141F] border border-[#2E2E3E] rounded-xl p-6 text-center">
            <Bell className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <h3 className="text-white font-semibold mb-2">Nenhuma notificação</h3>
            <p className="text-slate-400 text-sm">
              {filter !== 'all'
                ? 'Nenhuma notificação deste tipo.'
                : 'Você receberá notificações aqui.'}
            </p>
          </div>
        )}

        {/* Notifications list */}
        {!isLoadingHistory && filteredHistory.length > 0 && (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredHistory.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={() => handleMarkAsRead(notification.id)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}
