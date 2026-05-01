'use client'

import { useEffect, useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { createClient } from '@/lib/supabase/client'

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            gcTime: 5 * 60 * 1000, // 5 minutes
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  // Limpa o cache do React Query somente quando troca o usuário ativo.
  // SIGNED_IN dispara em qualquer reload (restauração de sessão), então
  // comparamos o user.id pra evitar limpar cache à toa. Sem isso, o snapshot
  // do dashboard de um user pode aparecer brevemente pra outro user no mesmo
  // dispositivo dentro da janela de gcTime.
  useEffect(() => {
    const supabase = createClient()
    let currentUserId: string | null = null
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const nextUserId = session?.user?.id ?? null
      if (event === 'SIGNED_OUT') {
        queryClient.clear()
        currentUserId = null
        return
      }
      if (currentUserId !== null && currentUserId !== nextUserId) {
        // Troca real de usuário no mesmo dispositivo.
        queryClient.clear()
      }
      currentUserId = nextUserId
    })
    return () => subscription.unsubscribe()
  }, [queryClient])

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
