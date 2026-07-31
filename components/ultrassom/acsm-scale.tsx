'use client'

import { classifyBodyFat, getAcsmBands } from '@/lib/usg/references'
import type { UsgSexo } from '@/lib/usg/types'
import { cn } from '@/lib/utils'

interface AcsmScaleProps {
  percentual: number | null
  sexo: UsgSexo
  className?: string
}

/** Limite superior desenhado na régua (a última faixa é aberta). */
const MAX_ESCALA = 45

/**
 * Régua de classificação de percentual de gordura (ACSM), sensível ao sexo.
 *
 * Ferramenta CLÍNICA: não é usada na tela do paciente. A categorização de
 * gordura corporal é informação que precisa de contexto profissional junto —
 * o paciente vê tendência e interpretação escrita pela nutricionista.
 */
export function AcsmScale({ percentual, sexo, className }: AcsmScaleProps) {
  const bands = getAcsmBands(sexo)
  const faixaAtual = classifyBodyFat(percentual, sexo)

  const posicao =
    percentual === null
      ? null
      : Math.min(100, Math.max(0, (percentual / MAX_ESCALA) * 100))

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-label-sm text-foreground-muted">
          Classificação ACSM ({sexo === 'feminino' ? 'mulheres' : 'homens'})
        </span>
        {faixaAtual && (
          <span className="text-label font-medium" style={{ color: faixaAtual.cor }}>
            {faixaAtual.label}
          </span>
        )}
      </div>

      <div
        className="relative h-3 rounded-full overflow-hidden flex"
        role="img"
        aria-label={
          faixaAtual
            ? `Percentual de gordura ${percentual}%, classificado como ${faixaAtual.label}`
            : 'Percentual de gordura não estimado'
        }
      >
        {bands.map((band) => {
          const fim = Math.min(band.max, MAX_ESCALA)
          const largura = ((fim - band.min) / MAX_ESCALA) * 100
          if (largura <= 0) return null
          return (
            <div
              key={band.categoria}
              style={{ width: `${largura}%`, backgroundColor: band.cor, opacity: 0.35 }}
              title={band.label}
            />
          )
        })}

        {posicao !== null && (
          <div
            className="absolute top-0 bottom-0 w-1 rounded-full bg-cafe"
            style={{ left: `calc(${posicao}% - 2px)` }}
          />
        )}
      </div>

      <div className="flex justify-between mt-1 text-label-sm text-foreground-muted">
        <span>0%</span>
        <span>{MAX_ESCALA}%+</span>
      </div>

      {faixaAtual && (
        <p className="mt-2 text-label-sm text-foreground-secondary">
          {faixaAtual.descricao}
        </p>
      )}
    </div>
  )
}
