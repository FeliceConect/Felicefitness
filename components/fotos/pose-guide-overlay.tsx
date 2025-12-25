"use client"

import { motion } from 'framer-motion'
import { type PhotoType, PHOTO_TYPE_TIPS } from '@/lib/photos/types'
import { cn } from '@/lib/utils'

interface PoseGuideOverlayProps {
  type: PhotoType
  opacity?: number
  showTip?: boolean
  className?: string
}

export function PoseGuideOverlay({
  type,
  opacity = 0.3,
  showTip = true,
  className
}: PoseGuideOverlayProps) {
  // Silhuetas SVG para cada tipo de pose
  const silhouettes = {
    frente: (
      <svg viewBox="0 0 100 200" className="w-full h-full">
        {/* Cabeça */}
        <ellipse cx="50" cy="20" rx="12" ry="14" fill="currentColor" />
        {/* Pescoço */}
        <rect x="45" y="34" width="10" height="10" fill="currentColor" />
        {/* Tronco */}
        <path
          d="M30 44 L70 44 L75 110 L25 110 Z"
          fill="currentColor"
        />
        {/* Braço esquerdo */}
        <path
          d="M30 44 L15 80 L12 110 L20 112 L28 85 L30 50"
          fill="currentColor"
        />
        {/* Braço direito */}
        <path
          d="M70 44 L85 80 L88 110 L80 112 L72 85 L70 50"
          fill="currentColor"
        />
        {/* Perna esquerda */}
        <path
          d="M32 110 L28 180 L38 182 L45 110"
          fill="currentColor"
        />
        {/* Perna direita */}
        <path
          d="M55 110 L62 180 L72 182 L68 110"
          fill="currentColor"
        />
      </svg>
    ),
    lado_esquerdo: (
      <svg viewBox="0 0 100 200" className="w-full h-full">
        {/* Cabeça */}
        <ellipse cx="55" cy="20" rx="10" ry="14" fill="currentColor" />
        {/* Pescoço */}
        <rect x="52" y="34" width="8" height="10" fill="currentColor" />
        {/* Tronco */}
        <path
          d="M45 44 L65 44 L68 110 L42 110 Z"
          fill="currentColor"
        />
        {/* Braço */}
        <path
          d="M50 50 L45 80 L42 110 L50 112 L55 85"
          fill="currentColor"
        />
        {/* Perna */}
        <path
          d="M45 110 L42 180 L58 182 L60 110"
          fill="currentColor"
        />
      </svg>
    ),
    lado_direito: (
      <svg viewBox="0 0 100 200" className="w-full h-full">
        {/* Cabeça */}
        <ellipse cx="45" cy="20" rx="10" ry="14" fill="currentColor" />
        {/* Pescoço */}
        <rect x="40" y="34" width="8" height="10" fill="currentColor" />
        {/* Tronco */}
        <path
          d="M35 44 L55 44 L58 110 L32 110 Z"
          fill="currentColor"
        />
        {/* Braço */}
        <path
          d="M50 50 L55 80 L58 110 L50 112 L45 85"
          fill="currentColor"
        />
        {/* Perna */}
        <path
          d="M40 110 L42 180 L58 182 L55 110"
          fill="currentColor"
        />
      </svg>
    ),
    costas: (
      <svg viewBox="0 0 100 200" className="w-full h-full">
        {/* Cabeça */}
        <ellipse cx="50" cy="20" rx="12" ry="14" fill="currentColor" />
        {/* Pescoço */}
        <rect x="45" y="34" width="10" height="10" fill="currentColor" />
        {/* Tronco (mais largo nos ombros) */}
        <path
          d="M25 44 L75 44 L70 110 L30 110 Z"
          fill="currentColor"
        />
        {/* Braço esquerdo */}
        <path
          d="M25 44 L10 80 L8 110 L16 112 L22 85 L25 50"
          fill="currentColor"
        />
        {/* Braço direito */}
        <path
          d="M75 44 L90 80 L92 110 L84 112 L78 85 L75 50"
          fill="currentColor"
        />
        {/* Perna esquerda */}
        <path
          d="M35 110 L32 180 L42 182 L48 110"
          fill="currentColor"
        />
        {/* Perna direita */}
        <path
          d="M52 110 L58 180 L68 182 L65 110"
          fill="currentColor"
        />
      </svg>
    )
  }

  return (
    <div className={cn('absolute inset-0 pointer-events-none', className)}>
      {/* Silhueta central */}
      <div
        className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-center h-[70%]"
        style={{ opacity }}
      >
        <div className="text-white w-32 h-full">
          {silhouettes[type]}
        </div>
      </div>

      {/* Linhas de alinhamento */}
      <div className="absolute inset-0">
        {/* Linha central vertical */}
        <div
          className="absolute left-1/2 top-0 bottom-0 w-px bg-white/20"
          style={{ transform: 'translateX(-50%)' }}
        />

        {/* Linha horizontal (altura dos ombros) */}
        <div
          className="absolute left-0 right-0 top-[25%] h-px bg-white/10"
        />

        {/* Linha horizontal (cintura) */}
        <div
          className="absolute left-0 right-0 top-[50%] h-px bg-white/10"
        />
      </div>

      {/* Dica de posicionamento */}
      {showTip && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-4 left-4 right-4"
        >
          <div className="bg-black/60 backdrop-blur-sm rounded-xl px-4 py-3">
            <p className="text-white text-sm text-center">
              {PHOTO_TYPE_TIPS[type]}
            </p>
          </div>
        </motion.div>
      )}
    </div>
  )
}
