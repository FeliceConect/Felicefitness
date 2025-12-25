"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell } from 'lucide-react'
import Link from 'next/link'
import { useNotifications } from '@/hooks/use-notifications'
import { cn } from '@/lib/utils'

interface NotificationBellProps {
  className?: string
}

export function NotificationBell({ className }: NotificationBellProps) {
  const { unreadCount, loadHistory, isSubscribed } = useNotifications()
  const [showBadge, setShowBadge] = useState(false)

  // Carregar histórico ao montar
  useEffect(() => {
    if (isSubscribed) {
      loadHistory({ limit: 10 })
    }
  }, [isSubscribed, loadHistory])

  // Animar badge quando há novas notificações
  useEffect(() => {
    if (unreadCount > 0) {
      setShowBadge(true)
    }
  }, [unreadCount])

  return (
    <Link href="/notificacoes">
      <motion.div
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className={cn(
          'relative p-2 rounded-xl bg-[#14141F] border border-[#2E2E3E] text-slate-400 hover:text-white transition-colors',
          className
        )}
      >
        <Bell className="w-5 h-5" />

        {/* Badge */}
        <AnimatePresence>
          {showBadge && unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-violet-500 flex items-center justify-center"
            >
              <span className="text-[10px] font-bold text-white px-1">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Ping animation for new notifications */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
          </span>
        )}
      </motion.div>
    </Link>
  )
}
