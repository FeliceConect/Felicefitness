"use client"

import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  size?: "sm" | "md" | "lg"
  showText?: boolean
}

export function Logo({ className, size = "md", showText = true }: LogoProps) {
  const sizes = {
    sm: { complexo: "text-base", wellness: "text-[10px]" },
    md: { complexo: "text-2xl", wellness: "text-xs" },
    lg: { complexo: "text-4xl", wellness: "text-sm" },
  }

  return (
    <div className={cn("flex flex-col", className)}>
      <span
        className={cn(
          "font-heading font-bold tracking-wider text-dourado leading-none",
          sizes[size].complexo
        )}
      >
        COMPLEXO
      </span>
      {showText && (
        <span
          className={cn(
            "font-sans font-light tracking-[0.25em] text-vinho uppercase leading-tight",
            sizes[size].wellness
          )}
        >
          WELLNESS
        </span>
      )}
    </div>
  )
}
