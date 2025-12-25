"use client"

import { Bell } from "lucide-react"
import { Logo } from "@/components/shared/logo"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

interface HeaderProps {
  userName?: string
  userAvatar?: string
}

export function Header({ userName, userAvatar }: HeaderProps) {
  const initials = userName
    ? userName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "FF"

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-border safe-top">
      <div className="flex items-center justify-between h-14 px-4">
        {/* Logo */}
        <Logo size="sm" showText={false} />

        {/* Ações */}
        <div className="flex items-center gap-2">
          {/* Notificações */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5 text-foreground-secondary" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary" />
          </Button>

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
