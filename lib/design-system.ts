/**
 * Complexo Wellness Design System
 * Constantes e tokens de design para consistência visual
 */

// Cores do tema — Paleta Complexo Felice (warm light, base nude/fendi)
export const colors = {
  // Backgrounds
  bg: {
    primary: '#f7f2ed',      // Fundo principal (warm cream)
    secondary: '#ffffff',    // Cards e containers (white)
    tertiary: '#ede7e0',     // Hover states / elevated
    elevated: '#f2ece5',     // Elementos elevados / inputs
  },

  // Bordas
  border: {
    default: '#d4cbc2',
    hover: '#c4bab0',
    focus: 'rgba(194, 152, 99, 0.5)', // dourado
  },

  // Texto
  text: {
    primary: '#322b29',      // café (dark on light)
    secondary: '#7a6e64',    // muted café
    muted: '#ae9b89',        // nude
    disabled: '#c4bab0',
  },

  // Brand colors — Complexo Felice
  brand: {
    cafe: '#322b29',
    vinho: '#663739',
    dourado: '#c29863',
    nude: '#ae9b89',
    fendi: '#cac2b9',
    seda: '#ddd5c7',
  },

  // Status colors
  status: {
    success: '#7dad6a',
    warning: '#d4850f',
    error: '#a04045',
    info: '#6b9bd2',
  },

  // Gradientes
  gradients: {
    primary: 'linear-gradient(135deg, #c29863 0%, #b08850 100%)',
    gold: 'linear-gradient(135deg, #c29863 0%, #ddd5c7 100%)',
    vinho: 'linear-gradient(135deg, #663739 0%, #a04045 100%)',
    subtle: 'linear-gradient(180deg, #ffffff 0%, #f7f2ed 100%)',
    card: 'linear-gradient(135deg, rgba(194, 152, 99, 0.08) 0%, rgba(102, 55, 57, 0.03) 100%)',
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
  sm: '0 1px 3px 0 rgba(50, 43, 41, 0.06)',
  md: '0 4px 6px -1px rgba(50, 43, 41, 0.08)',
  lg: '0 10px 15px -3px rgba(50, 43, 41, 0.1)',
  glow: {
    gold: '0 0 20px rgba(194, 152, 99, 0.2)',
    vinho: '0 0 20px rgba(102, 55, 57, 0.15)',
    success: '0 0 20px rgba(125, 173, 106, 0.2)',
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
    heading: 'Butler, serif',
    sans: 'var(--font-sarabun), Sarabun, sans-serif',
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
  default: 'bg-white border border-border rounded-2xl shadow-sm',
  elevated: 'bg-white border border-border rounded-2xl shadow-md',
  gradient: 'bg-gradient-to-br from-dourado/5 to-vinho/3 border border-dourado/20 rounded-2xl',
  interactive: 'bg-white border border-border rounded-2xl shadow-sm hover:border-dourado/40 hover:shadow-md transition-all cursor-pointer',
} as const

// Button variants
export const buttonVariants = {
  primary: 'bg-gradient-to-r from-dourado to-[#b08850] text-white hover:from-[#b08850] hover:to-dourado',
  secondary: 'bg-background-elevated text-foreground hover:bg-border',
  ghost: 'bg-transparent text-foreground-secondary hover:bg-background-elevated hover:text-foreground',
  danger: 'bg-error/10 border border-error/30 text-error hover:bg-error/20',
  success: 'bg-success/10 border border-success/30 text-success hover:bg-success/20',
} as const

// Utility function to get CSS variable
export function getCssVar(name: string): string {
  if (typeof window === 'undefined') return ''
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

// Utility to create gradient text
export function gradientText(): string {
  return 'bg-gradient-to-r from-dourado to-vinho bg-clip-text text-transparent'
}
