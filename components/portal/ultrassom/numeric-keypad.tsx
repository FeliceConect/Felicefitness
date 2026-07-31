'use client'

import { useEffect } from 'react'
import { Delete, Check } from 'lucide-react'
import { useHaptic } from '@/hooks/use-haptic'
import { cn } from '@/lib/utils'

interface NumericKeypadProps {
  onDigit: (digito: string) => void
  onBackspace: () => void
  onConfirm: () => void
  confirmDisabled?: boolean
  confirmLabel?: string
  className?: string
}

const TECLAS = ['1', '2', '3', '4', '5', '6', '7', '8', '9']

/**
 * Teclado numérico próprio, ancorado no rodapé.
 *
 * Por que não `<input type="number">`: durante a coleta a nutricionista está
 * em pé, com o transdutor numa mão e o aparelho na outra. O teclado do sistema
 * cobre metade da tela, muda de layout entre aparelhos e rouba o foco quando o
 * passo troca. Teclas de 64px na zona do polegar resolvem os três problemas.
 *
 * A vírgula não existe de propósito: o valor tem sempre uma casa decimal e o
 * último dígito digitado é o decimal (ver `aplicarDigito` no wizard). Digitar
 * "8" e "2" produz 8,2 — dois toques em vez de três.
 */
export function NumericKeypad({
  onDigit,
  onBackspace,
  onConfirm,
  confirmDisabled = false,
  confirmLabel = 'OK',
  className,
}: NumericKeypadProps) {
  const { haptic } = useHaptic()

  // Teclado físico: o portal também é usado em tablet com teclado e em desktop.
  // Sem isto, digitar um número simplesmente não faz nada.
  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      const alvo = e.target as HTMLElement | null
      if (alvo && ['INPUT', 'TEXTAREA'].includes(alvo.tagName)) return

      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault()
        onDigit(e.key)
      } else if (e.key === 'Backspace') {
        e.preventDefault()
        onBackspace()
      } else if (e.key === 'Enter' && !confirmDisabled) {
        e.preventDefault()
        onConfirm()
      }
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [onDigit, onBackspace, onConfirm, confirmDisabled])

  const teclaBase =
    'h-16 rounded-xl font-heading text-2xl transition-colors select-none ' +
    'flex items-center justify-center active:scale-[0.97] ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dourado'

  const pressionar = (acao: () => void, tipo: 'light' | 'medium' = 'light') => () => {
    haptic(tipo)
    acao()
  }

  return (
    <div className={cn('grid grid-cols-3 gap-2', className)}>
      {TECLAS.map((tecla) => (
        <button
          key={tecla}
          type="button"
          onClick={pressionar(() => onDigit(tecla))}
          aria-label={`Dígito ${tecla}`}
          className={cn(teclaBase, 'bg-background-elevated text-foreground hover:bg-seda')}
        >
          {tecla}
        </button>
      ))}

      <button
        type="button"
        onClick={pressionar(onBackspace)}
        aria-label="Apagar último dígito"
        className={cn(teclaBase, 'bg-background-elevated text-foreground-secondary hover:bg-seda')}
      >
        <Delete className="w-6 h-6" aria-hidden="true" />
      </button>

      <button
        type="button"
        onClick={pressionar(() => onDigit('0'))}
        aria-label="Dígito 0"
        className={cn(teclaBase, 'bg-background-elevated text-foreground hover:bg-seda')}
      >
        0
      </button>

      <button
        type="button"
        onClick={pressionar(onConfirm, 'medium')}
        disabled={confirmDisabled}
        aria-label={`${confirmLabel} — confirmar medida`}
        className={cn(
          teclaBase,
          // dourado normal com texto branco dá 2,6:1 — reprova. O tom
          // escurecido dá 5,3:1 e mantém a identidade.
          'bg-dourado-texto text-white gap-1 text-lg disabled:opacity-40 disabled:cursor-not-allowed'
        )}
      >
        <Check className="w-5 h-5" aria-hidden="true" />
        <span className="font-sans">{confirmLabel}</span>
      </button>
    </div>
  )
}
