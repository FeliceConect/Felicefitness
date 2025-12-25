"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Dumbbell, Utensils, BarChart3, User } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  {
    href: "/dashboard",
    icon: Home,
    label: "Início",
  },
  {
    href: "/treino",
    icon: Dumbbell,
    label: "Treino",
  },
  {
    href: "/alimentacao",
    icon: Utensils,
    label: "Alimentação",
  },
  {
    href: "/relatorios",
    icon: BarChart3,
    label: "Relatórios",
  },
  {
    href: "/perfil",
    icon: User,
    label: "Perfil",
  },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="flex items-center justify-around h-16 px-2 pb-safe">
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
                  ? "text-primary"
                  : "text-foreground-muted hover:text-foreground-secondary"
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5 transition-transform",
                  isActive && "scale-110"
                )}
              />
              <span className="text-xs font-medium">{item.label}</span>
              {isActive && (
                <span className="absolute -bottom-0 h-0.5 w-8 rounded-full bg-gradient-primary" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
