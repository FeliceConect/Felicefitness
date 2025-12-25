'use client'

import { useEffect, useRef } from 'react'

interface FocusTrapProps {
  children: React.ReactNode
  active?: boolean
  returnFocusOnDeactivate?: boolean
}

export function FocusTrap({
  children,
  active = true,
  returnFocusOnDeactivate = true,
}: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!active) return

    // Store the previously focused element
    previousFocusRef.current = document.activeElement as HTMLElement

    // Focus the first focusable element
    const container = containerRef.current
    if (container) {
      const focusableElements = getFocusableElements(container)
      if (focusableElements.length > 0) {
        focusableElements[0].focus()
      }
    }

    return () => {
      // Return focus to the previously focused element
      if (returnFocusOnDeactivate && previousFocusRef.current) {
        previousFocusRef.current.focus()
      }
    }
  }, [active, returnFocusOnDeactivate])

  useEffect(() => {
    if (!active) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      const container = containerRef.current
      if (!container) return

      const focusableElements = getFocusableElements(container)
      if (focusableElements.length === 0) return

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement.focus()
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [active])

  return <div ref={containerRef}>{children}</div>
}

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const focusableSelectors = [
    'button:not([disabled])',
    'a[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ]

  return Array.from(
    container.querySelectorAll<HTMLElement>(focusableSelectors.join(','))
  ).filter((el) => el.offsetParent !== null) // Filter out hidden elements
}
