"use client"

import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  size?: "sm" | "md" | "lg"
  showText?: boolean
}

export function Logo({ className, size = "md", showText = true }: LogoProps) {
  const sizes = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16",
  }

  const textSizes = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl",
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className={cn(
          "flex items-center justify-center rounded-xl bg-gradient-primary",
          sizes[size]
        )}
      >
        <span className={cn("font-bold text-white", textSizes[size])}>FF</span>
      </div>
      {showText && (
        <span className={cn("font-bold text-foreground", textSizes[size])}>
          Felice<span className="text-gradient">Fit</span>
        </span>
      )}
    </div>
  )
}
