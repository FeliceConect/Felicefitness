"use client"

import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface LoadingProps {
  className?: string
  size?: "sm" | "md" | "lg"
  text?: string
}

export function Loading({ className, size = "md", text }: LoadingProps) {
  const sizes = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3",
        className
      )}
    >
      <Loader2 className={cn("animate-spin text-primary", sizes[size])} />
      {text && (
        <p className="text-sm text-foreground-secondary">{text}</p>
      )}
    </div>
  )
}

export function FullPageLoading({ text = "Carregando..." }: { text?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Loading size="lg" text={text} />
    </div>
  )
}
