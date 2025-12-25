'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { FadeIn } from '@/components/ui/animations/fade-in'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { AlertTriangle, WifiOff, Lock, FileQuestion, RefreshCw } from 'lucide-react'

interface ErrorStateProps {
  title?: string
  description?: string
  error?: Error | null
  onRetry?: () => void
  onGoBack?: () => void
  fullPage?: boolean
}

export function ErrorState({
  title = 'Algo deu errado',
  description = 'Ocorreu um erro inesperado. Por favor, tente novamente.',
  error,
  onRetry,
  onGoBack,
  fullPage = false,
}: ErrorStateProps) {
  const prefersReducedMotion = useReducedMotion()
  const containerClass = fullPage
    ? 'min-h-screen flex items-center justify-center'
    : 'py-12'

  const IconWrapper = prefersReducedMotion ? 'div' : motion.div

  return (
    <div className={containerClass}>
      <FadeIn className="flex flex-col items-center justify-center px-4 text-center">
        <IconWrapper
          {...(!prefersReducedMotion && {
            initial: { rotate: 0 },
            animate: { rotate: [0, -10, 10, -10, 0] },
            transition: { duration: 0.5, delay: 0.2 },
          })}
          className="text-6xl mb-4"
        >
          <AlertTriangle className="w-16 h-16 text-error" />
        </IconWrapper>

        <h3 className="text-lg font-semibold text-foreground mb-2">
          {title}
        </h3>

        <p className="text-foreground-muted text-sm max-w-xs mb-6">
          {description}
        </p>

        {/* Show error in dev */}
        {process.env.NODE_ENV === 'development' && error && (
          <pre className="text-xs text-error bg-error/10 p-3 rounded-lg mb-6 max-w-xs overflow-auto text-left">
            {error.message}
          </pre>
        )}

        <div className="flex gap-3">
          {onRetry && (
            <Button onClick={onRetry} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Tentar novamente
            </Button>
          )}

          {onGoBack && (
            <Button variant="outline" onClick={onGoBack}>
              Voltar
            </Button>
          )}
        </div>
      </FadeIn>
    </div>
  )
}

// Specific error states
export function NetworkError({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <FadeIn>
        <WifiOff className="w-16 h-16 text-warning mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Sem conexão
        </h3>
        <p className="text-foreground-muted text-sm max-w-xs mb-6">
          Verifique sua conexão com a internet e tente novamente.
        </p>
        {onRetry && (
          <Button onClick={onRetry} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Tentar novamente
          </Button>
        )}
      </FadeIn>
    </div>
  )
}

export function NotFoundError({ onGoBack }: { onGoBack?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <FadeIn>
        <FileQuestion className="w-16 h-16 text-foreground-muted mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Não encontrado
        </h3>
        <p className="text-foreground-muted text-sm max-w-xs mb-6">
          O conteúdo que você procura não existe ou foi removido.
        </p>
        {onGoBack && (
          <Button variant="outline" onClick={onGoBack}>
            Voltar
          </Button>
        )}
      </FadeIn>
    </div>
  )
}

export function PermissionError() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <FadeIn>
        <Lock className="w-16 h-16 text-error mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Sem permissão
        </h3>
        <p className="text-foreground-muted text-sm max-w-xs">
          Você não tem permissão para acessar este conteúdo.
        </p>
      </FadeIn>
    </div>
  )
}
