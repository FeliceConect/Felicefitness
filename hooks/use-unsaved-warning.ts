'use client'

import { useEffect } from 'react'

/**
 * Mostra o prompt nativo do browser ("Sair? As alterações não salvas podem
 * ser perdidas") quando `hasUnsavedChanges` é true. Cobre close de aba,
 * reload manual e navegação para URL externa. Browsers modernos ignoram
 * mensagens custom — só o `returnValue = ''` já basta para o prompt aparecer.
 */
export function useUnsavedWarning(hasUnsavedChanges: boolean) {
  useEffect(() => {
    if (!hasUnsavedChanges) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
      return ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [hasUnsavedChanges])
}
