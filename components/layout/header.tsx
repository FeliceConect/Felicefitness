"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bell, MessageSquare, Briefcase, Stethoscope } from "lucide-react"
import { Logo } from "@/components/shared/logo"
import { useProfessional } from "@/hooks/use-professional"

export function Header() {
  const pathname = usePathname()
  const { isSuperAdmin, isMedicoIntegrativo } = useProfessional()
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [unreadNotifications, setUnreadNotifications] = useState(0)

  const fetchUnreadCounts = useCallback(async () => {
    try {
      const response = await fetch('/api/chat/conversations')
      const data = await response.json()
      if (data.success && data.conversations) {
        const total = data.conversations.reduce(
          (sum: number, conv: { unreadCount: number }) => sum + conv.unreadCount,
          0
        )
        setUnreadMessages(total)
      }
    } catch {
      // Silently fail
    }

    try {
      const response = await fetch('/api/notifications/unread-count')
      const data = await response.json()
      if (data.success) {
        setUnreadNotifications(data.count ?? 0)
      }
    } catch {
      // Silently fail
    }
  }, [])

  useEffect(() => {
    fetchUnreadCounts()
    const interval = setInterval(fetchUnreadCounts, 30000)
    return () => clearInterval(interval)
  }, [fetchUnreadCounts])

  // Esconder header em telas fullscreen (form wizard, treino imersivo)
  const isFormWizard = pathname.startsWith('/formularios/') && pathname !== '/formularios'
  const isImmersiveWorkout = /^\/treino\/[^/]+\/imersivo/.test(pathname)
  if (isFormWizard || isImmersiveWorkout) {
    return null
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-b border-border" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      <div className="flex items-center justify-between h-14 px-4">
        {/* Logo */}
        <Logo size="sm" />

        {/* Right side icons */}
        <div className="flex items-center gap-1">
          {/* Admin (somente super_admin) */}
          {isSuperAdmin && (
            <Link
              href="/admin"
              className="flex items-center gap-1.5 px-2.5 py-1.5 mr-1 rounded-full bg-cafe text-seda text-xs font-medium hover:bg-vinho transition-colors"
              title="Ir para o Admin"
            >
              <Briefcase className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Admin</span>
            </Link>
          )}

          {/* Portal (médico integrativo — acessa app e portal) */}
          {isMedicoIntegrativo && (
            <Link
              href="/portal/medico-integrativo"
              className="flex items-center gap-1.5 px-2.5 py-1.5 mr-1 rounded-full bg-cafe text-seda text-xs font-medium hover:bg-vinho transition-colors"
              title="Ir para o Portal"
            >
              <Stethoscope className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Portal</span>
            </Link>
          )}

          {/* Notifications */}
          <Link
            href="/notificacoes"
            className="relative p-2.5 rounded-full hover:bg-background-elevated transition-colors"
          >
            <Bell className="h-5 w-5 text-foreground-secondary" />
            {unreadNotifications > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-[16px] flex items-center justify-center text-[9px] font-bold text-white bg-dourado rounded-full px-0.5">
                {unreadNotifications > 99 ? '99+' : unreadNotifications}
              </span>
            )}
          </Link>

          {/* Messages */}
          <Link
            href="/chat"
            className="relative p-2.5 rounded-full hover:bg-background-elevated transition-colors"
          >
            <MessageSquare className="h-5 w-5 text-foreground-secondary" />
            {unreadMessages > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-[16px] flex items-center justify-center text-[9px] font-bold text-white bg-dourado rounded-full px-0.5">
                {unreadMessages > 99 ? '99+' : unreadMessages}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  )
}
