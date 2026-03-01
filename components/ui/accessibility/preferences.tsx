'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface A11yPreferences {
  reducedMotion: boolean
  highContrast: boolean
  largeText: boolean
  screenReader: boolean
}

interface A11yContextType {
  preferences: A11yPreferences
  setPreference: <K extends keyof A11yPreferences>(key: K, value: A11yPreferences[K]) => void
  resetPreferences: () => void
}

const defaultPreferences: A11yPreferences = {
  reducedMotion: false,
  highContrast: false,
  largeText: false,
  screenReader: false
}

const A11yContext = createContext<A11yContextType | undefined>(undefined)

export function A11yProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<A11yPreferences>(defaultPreferences)

  // Load preferences from localStorage and detect system preferences
  useEffect(() => {
    // Check localStorage
    const saved = localStorage.getItem('a11y-preferences')
    if (saved) {
      try {
        setPreferences(JSON.parse(saved))
      } catch {
        // Invalid JSON, use defaults
      }
    }

    // Detect system preferences
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const prefersContrast = window.matchMedia('(prefers-contrast: more)')

    setPreferences(prev => ({
      ...prev,
      reducedMotion: prev.reducedMotion || prefersReducedMotion.matches,
      highContrast: prev.highContrast || prefersContrast.matches
    }))

    // Listen for changes
    const motionHandler = (e: MediaQueryListEvent) => {
      setPreferences(prev => ({ ...prev, reducedMotion: e.matches }))
    }
    const contrastHandler = (e: MediaQueryListEvent) => {
      setPreferences(prev => ({ ...prev, highContrast: e.matches }))
    }

    prefersReducedMotion.addEventListener('change', motionHandler)
    prefersContrast.addEventListener('change', contrastHandler)

    return () => {
      prefersReducedMotion.removeEventListener('change', motionHandler)
      prefersContrast.removeEventListener('change', contrastHandler)
    }
  }, [])

  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem('a11y-preferences', JSON.stringify(preferences))

    // Apply CSS classes to body
    document.body.classList.toggle('reduced-motion', preferences.reducedMotion)
    document.body.classList.toggle('high-contrast', preferences.highContrast)
    document.body.classList.toggle('large-text', preferences.largeText)
  }, [preferences])

  const setPreference = <K extends keyof A11yPreferences>(
    key: K,
    value: A11yPreferences[K]
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value }))
  }

  const resetPreferences = () => {
    setPreferences(defaultPreferences)
    localStorage.removeItem('a11y-preferences')
  }

  return (
    <A11yContext.Provider value={{ preferences, setPreference, resetPreferences }}>
      {children}
    </A11yContext.Provider>
  )
}

export function useA11yPreferences() {
  const context = useContext(A11yContext)
  if (!context) {
    throw new Error('useA11yPreferences must be used within A11yProvider')
  }
  return context
}

// Hook para verificar se deve usar animações reduzidas
export function useShouldReduceMotion(): boolean {
  const context = useContext(A11yContext)

  // Se não tiver provider, verificar media query diretamente
  if (!context) {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }

  return context.preferences.reducedMotion
}

// Componente de configurações de acessibilidade
export function A11ySettings() {
  const { preferences, setPreference, resetPreferences } = useA11yPreferences()

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-foreground">Acessibilidade</h3>

      <div className="space-y-3">
        <label className="flex items-center justify-between">
          <span className="text-foreground-secondary">Reduzir animações</span>
          <input
            type="checkbox"
            checked={preferences.reducedMotion}
            onChange={(e) => setPreference('reducedMotion', e.target.checked)}
            className="w-5 h-5 rounded bg-background-input border-border text-dourado focus:ring-dourado"
          />
        </label>

        <label className="flex items-center justify-between">
          <span className="text-foreground-secondary">Alto contraste</span>
          <input
            type="checkbox"
            checked={preferences.highContrast}
            onChange={(e) => setPreference('highContrast', e.target.checked)}
            className="w-5 h-5 rounded bg-background-input border-border text-dourado focus:ring-dourado"
          />
        </label>

        <label className="flex items-center justify-between">
          <span className="text-foreground-secondary">Texto maior</span>
          <input
            type="checkbox"
            checked={preferences.largeText}
            onChange={(e) => setPreference('largeText', e.target.checked)}
            className="w-5 h-5 rounded bg-background-input border-border text-dourado focus:ring-dourado"
          />
        </label>
      </div>

      <button
        onClick={resetPreferences}
        className="text-sm text-foreground-muted hover:text-foreground"
      >
        Restaurar padrões
      </button>
    </div>
  )
}
