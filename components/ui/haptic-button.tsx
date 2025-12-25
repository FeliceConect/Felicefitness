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
  default: 'bg-[#14141F] border border-[#2E2E3E] text-white hover:bg-[#1E1E2E]',
  primary: 'bg-gradient-to-r from-violet-600 to-violet-500 text-white hover:from-violet-500 hover:to-violet-400',
  secondary: 'bg-[#2E2E3E] text-white hover:bg-[#3E3E4E]',
  ghost: 'bg-transparent text-slate-400 hover:bg-[#14141F] hover:text-white',
  danger: 'bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20'
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
          'relative overflow-hidden font-medium transition-all focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:ring-offset-2 focus:ring-offset-[#0A0A0F] disabled:opacity-50 disabled:cursor-not-allowed',
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
        'fixed bottom-24 right-4 w-14 h-14 rounded-full shadow-lg shadow-violet-500/25 z-40',
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
      <span className="text-cyan-400 font-bold">+{value}</span>
      {unit && <span className="text-xs text-slate-500">{unit}</span>}
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
        isActive && 'ring-2 ring-violet-500/30',
        className
      )}
      onClick={onClick}
      {...props}
    >
      {children}
    </HapticButton>
  )
}
