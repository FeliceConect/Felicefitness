"use client"

import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export function MainContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const isFormWizard = pathname.startsWith('/formularios/') && pathname !== '/formularios'
  const isImmersiveWorkout = /^\/treino\/[^/]+\/imersivo/.test(pathname)
  const isFullscreen = isFormWizard || isImmersiveWorkout

  return (
    <main className={cn(!isFullscreen && "content-safe-top content-safe-bottom")}>
      {children}
    </main>
  )
}
