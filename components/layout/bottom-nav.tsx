"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Calendar, Globe, Trophy, User } from "lucide-react"
import { cn } from "@/lib/utils"

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

  // Esconder bottom nav em telas com navegação própria (ex: form wizard)
  const hideOnRoutes = ['/formularios/']
  if (hideOnRoutes.some(route => pathname.startsWith(route) && pathname !== '/formularios')) {
    return null
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-border">
      {/* Container dos itens com altura fixa */}
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[64px]",
                isActive
                  ? "text-dourado"
                  : "text-foreground-muted hover:text-foreground"
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5 transition-transform",
                  isActive && "scale-110"
                )}
              />
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
