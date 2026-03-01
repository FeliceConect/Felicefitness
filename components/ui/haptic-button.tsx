'use client'

import { forwardRef, useState, ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import { useHaptic } from '@/hooks/use-haptic'

type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error'

interface HapticButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  hapticType?: HapticType
  variant?: 'default' | 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  isLoading?: boolean
  showRipple?: boolean
}

const variantStyles = {
  default: 'bg-background-card border border-border text-foreground hover:bg-background-elevated',
  primary: 'bg-dourado text-white hover:bg-primary-hover',
  secondary: 'bg-background-elevated text-foreground hover:bg-border',
  ghost: 'bg-transparent text-foreground-muted hover:bg-background-elevated hover:text-foreground',
  danger: 'bg-error/10 border border-error/30 text-error hover:bg-error/20'
}

const sizeStyles = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-4 py-2 text-base rounded-xl',
  lg: 'px-6 py-3 text-lg rounded-xl',
  icon: 'p-2 rounded-xl'
}

export const HapticButton = forwardRef<HTMLButtonElement, HapticButtonProps>(
  (
    {
      children,
      hapticType = 'light',
      variant = 'default',
      size = 'md',
      isLoading = false,
      showRipple = true,
      className,
      disabled,
      onClick,
      ...props
    },
    ref
  ) => {
    const { haptic } = useHaptic()
    const [isPressed, setIsPressed] = useState(false)
    const [ripple, setRipple] = useState<{ x: number; y: number } | null>(null)

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled || isLoading) return

      // Trigger haptic feedback
      haptic(hapticType)

      // Add ripple effect
      if (showRipple) {
        const rect = e.currentTarget.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        setRipple({ x, y })

        setTimeout(() => setRipple(null), 600)
      }

      onClick?.(e)
    }

    return (
      <button
        ref={ref}
        className={cn(
          'relative overflow-hidden font-medium transition-all focus:outline-none focus:ring-2 focus:ring-dourado/50 focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed',
          variantStyles[variant],
          sizeStyles[size],
          isPressed && 'scale-[0.97]',
          className
        )}
        disabled={disabled || isLoading}
        onClick={handleClick}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onMouseLeave={() => setIsPressed(false)}
        {...props}
      >
        {/* Ripple effect */}
        {ripple && (
          <span
            className="absolute rounded-full bg-white/20 pointer-events-none animate-ripple"
            style={{
              left: ripple.x,
              top: ripple.y,
              transform: 'translate(-50%, -50%)'
            }}
          />
        )}

        {/* Loading state */}
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span>Carregando...</span>
          </span>
        ) : (
          children
        )}
      </button>
    )
  }
)

HapticButton.displayName = 'HapticButton'

// Botão de ação rápida (FAB)
export function FloatingActionButton({
  children,
  onClick,
  className,
  ...props
}: HapticButtonProps) {
  return (
    <HapticButton
      variant="primary"
      size="icon"
      hapticType="medium"
      className={cn(
        'fixed bottom-24 right-4 w-14 h-14 rounded-full shadow-lg shadow-dourado/25 z-40',
        className
      )}
      onClick={onClick}
      {...props}
    >
      {children}
    </HapticButton>
  )
}

// Botão de incremento (para água, etc.)
export function IncrementButton({
  value,
  unit,
  onClick,
  className,
  ...props
}: HapticButtonProps & { value: number | string; unit?: string }) {
  return (
    <HapticButton
      variant="secondary"
      size="sm"
      hapticType="light"
      className={cn('flex flex-col items-center gap-0.5 min-w-16', className)}
      onClick={onClick}
      {...props}
    >
      <span className="text-dourado font-bold">+{value}</span>
      {unit && <span className="text-xs text-foreground-muted">{unit}</span>}
    </HapticButton>
  )
}

// Botão de toggle
export function ToggleButton({
  isActive,
  children,
  onClick,
  className,
  ...props
}: HapticButtonProps & { isActive: boolean }) {
  return (
    <HapticButton
      variant={isActive ? 'primary' : 'ghost'}
      hapticType={isActive ? 'success' : 'light'}
      className={cn(
        'transition-all',
        isActive && 'ring-2 ring-dourado/30',
        className
      )}
      onClick={onClick}
      {...props}
    >
      {children}
    </HapticButton>
  )
}
