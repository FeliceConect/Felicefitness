"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Calendar, Globe, Trophy, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { useUnreadFeed } from "@/hooks/use-unread-feed"

const navItems = [
  {
    href: "/dashboard",
    icon: Home,
    label: "Home",
  },
  {
    href: "/agenda",
    icon: Calendar,
    label: "Agenda",
  },
  {
    href: "/feed",
    icon: Globe,
    label: "Feed",
  },
  {
    href: "/ranking",
    icon: Trophy,
    label: "Ranking",
  },
  {
    href: "/perfil",
    icon: User,
    label: "Eu",
  },
]

export function BottomNav() {
  const pathname = usePathname()
  const { unreadCount, hasInteractions, details, markAsRead } = useUnreadFeed()

  // Esconder bottom nav em telas fullscreen (form wizard, treino imersivo)
  const isFormWizard = pathname.startsWith('/formularios/') && pathname !== '/formularios'
  const isImmersiveWorkout = /^\/treino\/[^/]+\/imersivo/.test(pathname)
  if (isFormWizard || isImmersiveWorkout) {
    return null
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-border">
      {/* Container dos itens com altura fixa */}
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
          const Icon = item.icon
          const isFeed = item.href === '/feed'
          const showBadge = isFeed && unreadCount > 0 && !isActive

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={isFeed ? markAsRead : undefined}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[64px]",
                isActive
                  ? "text-dourado"
                  : "text-foreground-muted hover:text-foreground"
              )}
            >
              <div className="relative">
                <Icon
                  className={cn(
                    "h-5 w-5 transition-transform",
                    isActive && "scale-110"
                  )}
                />
                {showBadge && hasInteractions && details.new_posts === 0 ? (
                  <>
                    <span className="absolute -top-2.5 -right-4 min-w-[20px] h-[20px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] px-1 shadow-md shadow-red-500/50 border-2 border-white">
                      ❤️
                    </span>
                    <span className="absolute -top-2.5 -right-4 min-w-[20px] h-[20px] rounded-full bg-red-500 animate-ping opacity-40" />
                  </>
                ) : showBadge ? (
                  <>
                    <span className="absolute -top-2.5 -right-4 min-w-[20px] h-[20px] flex items-center justify-center rounded-full bg-dourado text-white text-[11px] font-bold px-1.5 shadow-md shadow-dourado/50 border-2 border-white">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                    <span className="absolute -top-2.5 -right-4 min-w-[20px] h-[20px] rounded-full bg-dourado animate-ping opacity-40" />
                  </>
                ) : null}
              </div>
              <span className="text-[11px] font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
      {/* Safe area padding separado para iOS */}
      <div className="h-[env(safe-area-inset-bottom,0px)]" />
    </nav>
  )
}
