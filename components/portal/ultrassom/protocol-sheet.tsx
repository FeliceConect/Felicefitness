'use client'

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { SiteIllustration } from '@/components/ultrassom'
import { USG_SITES } from '@/lib/usg/protocols'
import type { UsgSiteCode } from '@/lib/usg/types'

interface ProtocolSheetProps {
  site: UsgSiteCode | null
  onClose: () => void
}

/** Regras que valem para todos os sítios, sempre repetidas no rodapé da folha. */
const REGRAS_GERAIS = [
  'Lado direito do corpo, sempre.',
  'Camada generosa de gel (3 a 5 mm).',
  'Pressão mínima — apertar o transdutor reduz a espessura medida em até um terço.',
  'Transdutor perpendicular à pele.',
  'Duas medidas por ponto; três se houver diferença.',
]

/**
 * Folha inferior com a descrição anatômica completa do ponto.
 *
 * Fica sob demanda porque a instrução completa é longa demais para ocupar
 * espaço permanente na tela de coleta, mas curta demais para virar uma página.
 */
export function ProtocolSheet({ site, onClose }: ProtocolSheetProps) {
  const prefereMenosMovimento = useReducedMotion()
  const fecharRef = useRef<HTMLButtonElement>(null)
  const definicao = site ? USG_SITES[site] : null

  useEffect(() => {
    if (!site) return
    fecharRef.current?.focus()

    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [site, onClose])

  return (
    <AnimatePresence>
      {definicao && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-cafe/50"
            aria-hidden="true"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`Como medir ${definicao.label}`}
            initial={prefereMenosMovimento ? { opacity: 0 } : { y: '100%' }}
            animate={prefereMenosMovimento ? { opacity: 1 } : { y: 0 }}
            exit={prefereMenosMovimento ? { opacity: 0 } : { y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 bg-background-card rounded-t-2xl border-t border-border max-h-[85vh] overflow-y-auto safe-bottom"
          >
            <div className="flex items-start justify-between p-4 border-b border-border">
              <div>
                <h2 className="font-heading text-title-sm text-foreground">
                  {definicao.label}
                </h2>
                <p className="text-label-sm text-foreground-muted">
                  {definicao.tecido === 'gordura'
                    ? 'Gordura subcutânea'
                    : 'Espessura muscular'}
                </p>
              </div>
              <button
                ref={fecharRef}
                type="button"
                onClick={onClose}
                aria-label="Fechar instruções"
                className="p-2 -m-2 rounded-lg text-foreground-secondary hover:bg-background-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dourado"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <div className="p-4 flex gap-4">
              <SiteIllustration site={definicao.code} size={96} />
              <p className="text-body-md text-foreground-secondary flex-1">
                {definicao.landmark}
              </p>
            </div>

            <div className="px-4 pb-6">
              <h3 className="text-label text-foreground-muted uppercase tracking-wide mb-2">
                Padronização da coleta
              </h3>
              <ul className="space-y-1.5">
                {REGRAS_GERAIS.map((regra) => (
                  <li
                    key={regra}
                    className="text-body-md text-foreground-secondary flex gap-2"
                  >
                    <span className="text-dourado" aria-hidden="true">
                      •
                    </span>
                    {regra}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
