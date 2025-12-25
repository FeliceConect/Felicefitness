'use client'

import { createContext, useContext, useState, useCallback, useEffect } from 'react'

interface AnnouncerContextType {
  announce: (message: string, priority?: 'polite' | 'assertive') => void
}

const AnnouncerContext = createContext<AnnouncerContextType | null>(null)

export function AnnouncerProvider({ children }: { children: React.ReactNode }) {
  const [politeMessage, setPoliteMessage] = useState('')
  const [assertiveMessage, setAssertiveMessage] = useState('')

  const announce = useCallback((msg: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (priority === 'assertive') {
      setAssertiveMessage('')
      // Small delay to ensure screen reader detects the change
      setTimeout(() => setAssertiveMessage(msg), 100)
    } else {
      setPoliteMessage('')
      setTimeout(() => setPoliteMessage(msg), 100)
    }
  }, [])

  // Clear messages after announcement
  useEffect(() => {
    if (politeMessage) {
      const timer = setTimeout(() => setPoliteMessage(''), 1000)
      return () => clearTimeout(timer)
    }
  }, [politeMessage])

  useEffect(() => {
    if (assertiveMessage) {
      const timer = setTimeout(() => setAssertiveMessage(''), 1000)
      return () => clearTimeout(timer)
    }
  }, [assertiveMessage])

  return (
    <AnnouncerContext.Provider value={{ announce }}>
      {children}
      {/* Polite announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {politeMessage}
      </div>
      {/* Assertive announcements */}
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      >
        {assertiveMessage}
      </div>
    </AnnouncerContext.Provider>
  )
}

export function useAnnouncer() {
  const context = useContext(AnnouncerContext)
  if (!context) {
    throw new Error('useAnnouncer must be used within AnnouncerProvider')
  }
  return context
}
