"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bell, MessageSquare } from "lucide-react"
import { Logo } from "@/components/shared/logo"

export function Header() {
  const pathname = usePathname()
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

  // Esconder header em telas com navegação própria (ex: form wizard)
  const hideOnRoutes = ['/formularios/']
  if (hideOnRoutes.some(route => pathname.startsWith(route) && pathname !== '/formularios')) {
    return null
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-b border-border" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      <div className="flex items-center justify-between h-14 px-4">
        {/* Logo */}
        <Logo size="sm" />

        {/* Right side icons */}
        <div className="flex items-center gap-1">
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
