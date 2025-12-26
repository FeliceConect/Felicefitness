"use client"

import { Logo } from "@/components/shared/logo"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

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
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-border" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      <div className="flex items-center justify-between h-14 px-4">
        {/* Logo */}
        <Logo size="sm" showText={false} />

        {/* Avatar */}
        <Avatar className="h-8 w-8">
          <AvatarImage src={userAvatar} alt={userName || "Usuário"} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
