/**
 * FeliceFit Design System
 * Constantes e tokens de design para consistência visual
 */

// Cores do tema
export const colors = {
  // Backgrounds
  bg: {
    primary: '#0A0A0F',      // Fundo principal
    secondary: '#14141F',    // Cards e containers
    tertiary: '#1E1E2E',     // Hover states
    elevated: '#2E2E3E',     // Elementos elevados
  },

  // Bordas
  border: {
    default: '#2E2E3E',
    hover: '#3E3E4E',
    focus: 'rgba(139, 92, 246, 0.5)',
  },

  // Texto
  text: {
    primary: '#FFFFFF',
    secondary: '#A1A1AA',    // slate-400
    muted: '#71717A',        // slate-500
    disabled: '#52525B',     // slate-600
  },

  // Brand colors
  brand: {
    violet: {
      50: '#f5f3ff',
      100: '#ede9fe',
      200: '#ddd6fe',
      300: '#c4b5fd',
      400: '#a78bfa',
      500: '#8b5cf6',
      600: '#7c3aed',
      700: '#6d28d9',
    },
    cyan: {
      400: '#22d3ee',
      500: '#06b6d4',
      600: '#0891b2',
    },
  },

  // Status colors
  status: {
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },

  // Gradientes
  gradients: {
    primary: 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)',
    violet: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)',
    dark: 'linear-gradient(180deg, #0A0A0F 0%, #14141F 100%)',
    card: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(6, 182, 212, 0.05) 100%)',
  },
} as const

// Espaçamentos
export const spacing = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '3rem',   // 48px
} as const

// Border radius
export const radius = {
  sm: '0.5rem',    // 8px
  md: '0.75rem',   // 12px
  lg: '1rem',      // 16px
  xl: '1.25rem',   // 20px
  '2xl': '1.5rem', // 24px
  full: '9999px',
} as const

// Shadows
export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  glow: {
    violet: '0 0 20px rgba(139, 92, 246, 0.3)',
    cyan: '0 0 20px rgba(6, 182, 212, 0.3)',
    success: '0 0 20px rgba(16, 185, 129, 0.3)',
  },
} as const

// Transições
export const transitions = {
  fast: '150ms ease',
  normal: '200ms ease',
  slow: '300ms ease',
  spring: {
    type: 'spring',
    stiffness: 400,
    damping: 30,
  },
} as const

// Breakpoints
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
} as const

// Z-index scale
export const zIndex = {
  dropdown: 50,
  sticky: 100,
  fixed: 200,
  modal: 300,
  popover: 400,
  toast: 500,
} as const

// Typography
export const typography = {
  fontFamily: {
    sans: 'var(--font-geist-sans), system-ui, sans-serif',
    mono: 'var(--font-geist-mono), monospace',
  },
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],
    sm: ['0.875rem', { lineHeight: '1.25rem' }],
    base: ['1rem', { lineHeight: '1.5rem' }],
    lg: ['1.125rem', { lineHeight: '1.75rem' }],
    xl: ['1.25rem', { lineHeight: '1.75rem' }],
    '2xl': ['1.5rem', { lineHeight: '2rem' }],
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
} as const

// Animations presets
export const animations = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.2 },
  },
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
    transition: { duration: 0.3 },
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
    transition: { duration: 0.2 },
  },
  stagger: {
    container: {
      animate: {
        transition: {
          staggerChildren: 0.05,
        },
      },
    },
    item: {
      initial: { opacity: 0, y: 10 },
      animate: { opacity: 1, y: 0 },
    },
  },
} as const

// Icon sizes
export const iconSizes = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
} as const

// Card styles
export const cardStyles = {
  default: 'bg-[#14141F] border border-[#2E2E3E] rounded-2xl',
  elevated: 'bg-[#1E1E2E] border border-[#3E3E4E] rounded-2xl shadow-lg',
  gradient: 'bg-gradient-to-br from-violet-500/10 to-cyan-500/5 border border-violet-500/20 rounded-2xl',
  interactive: 'bg-[#14141F] border border-[#2E2E3E] rounded-2xl hover:border-violet-500/30 transition-colors cursor-pointer',
} as const

// Button variants
export const buttonVariants = {
  primary: 'bg-gradient-to-r from-violet-600 to-violet-500 text-white hover:from-violet-500 hover:to-violet-400',
  secondary: 'bg-[#2E2E3E] text-white hover:bg-[#3E3E4E]',
  ghost: 'bg-transparent text-slate-400 hover:bg-[#14141F] hover:text-white',
  danger: 'bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20',
  success: 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20',
} as const

// Utility function to get CSS variable
export function getCssVar(name: string): string {
  if (typeof window === 'undefined') return ''
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

// Utility to create gradient text
export function gradientText(from = colors.brand.violet[500], to = colors.brand.cyan[400]): string {
  return `bg-gradient-to-r from-[${from}] to-[${to}] bg-clip-text text-transparent`
}
