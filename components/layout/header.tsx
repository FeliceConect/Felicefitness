"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { MessageSquare } from "lucide-react"
import { Logo } from "@/components/shared/logo"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface HeaderProps {
  userName?: string
  userAvatar?: string
}

export function Header({ userName, userAvatar }: HeaderProps) {
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await fetch('/api/chat/conversations')
      const data = await response.json()
      if (data.success && data.conversations) {
        const total = data.conversations.reduce(
          (sum: number, conv: { unreadCount: number }) => sum + conv.unreadCount,
          0
        )
        setUnreadCount(total)
      }
    } catch {
      // Silently fail - user might not be logged in
    }
  }, [])

  useEffect(() => {
    fetchUnreadCount()
    // Polling a cada 30 segundos para atualizar contador
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [fetchUnreadCount])

  const initials = userName
    ? userName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "FF"

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-border" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      <div className="flex items-center justify-between h-14 px-4">
        {/* Logo */}
        <Logo size="sm" showText={false} />

        {/* Right side icons */}
        <div className="flex items-center gap-3">
          {/* Messages Icon */}
          <Link
            href="/mensagens"
            className="relative p-2 rounded-full hover:bg-slate-700/50 transition-colors"
          >
            <MessageSquare className="h-5 w-5 text-slate-300" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold text-white bg-violet-500 rounded-full px-1">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Link>

          {/* Avatar */}
          <Avatar className="h-8 w-8">
            <AvatarImage src={userAvatar} alt={userName || "Usuário"} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  )
}
