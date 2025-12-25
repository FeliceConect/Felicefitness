"use client"

import { motion } from 'framer-motion'
import { Droplets, Dumbbell, Bone, Flame } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BodyCompositionCardProps {
  aguaTotal: number
  proteina: number
  minerais: number
  gordura: number
  className?: string
}

export function BodyCompositionCard({
  aguaTotal,
  proteina,
  minerais,
  gordura,
  className
}: BodyCompositionCardProps) {
  const total = aguaTotal + proteina + minerais + gordura

  const items = [
    {
      label: 'Água',
      valor: aguaTotal,
      unidade: 'L',
      percentual: (aguaTotal / total) * 100,
      cor: '#06B6D4', // cyan
      corBg: 'bg-cyan-500/20',
      icon: Droplets
    },
    {
      label: 'Proteína',
      valor: proteina,
      unidade: 'kg',
      percentual: (proteina / total) * 100,
      cor: '#8B5CF6', // violet
      corBg: 'bg-violet-500/20',
      icon: Dumbbell
    },
    {
      label: 'Minerais',
      valor: minerais,
      unidade: 'kg',
      percentual: (minerais / total) * 100,
      cor: '#64748B', // slate
      corBg: 'bg-slate-500/20',
      icon: Bone
    },
    {
      label: 'Gordura',
      valor: gordura,
      unidade: 'kg',
      percentual: (gordura / total) * 100,
      cor: '#F59E0B', // amber
      corBg: 'bg-amber-500/20',
      icon: Flame
    }
  ]

  return (
    <div className={cn('bg-[#14141F] border border-[#2E2E3E] rounded-2xl p-4', className)}>
      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">
        Composição Corporal
      </h3>

      {/* Stacked bar */}
      <div className="h-4 rounded-full overflow-hidden flex mb-4">
        {items.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ width: 0 }}
            animate={{ width: `${item.percentual}%` }}
            transition={{ duration: 0.8, delay: index * 0.1, ease: 'easeOut' }}
            style={{ backgroundColor: item.cor }}
            className="h-full first:rounded-l-full last:rounded-r-full"
          />
        ))}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-3">
        {items.map((item, index) => {
          const Icon = item.icon
          return (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
              className="flex items-center gap-2"
            >
              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', item.corBg)}>
                <Icon className="w-4 h-4" style={{ color: item.cor }} />
              </div>
              <div>
                <p className="text-xs text-slate-500">{item.label}</p>
                <p className="text-sm font-semibold text-white">
                  {item.valor.toFixed(1)}{item.unidade}
                </p>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Total */}
      <div className="mt-4 pt-3 border-t border-[#2E2E3E] text-center">
        <span className="text-slate-500 text-sm">Peso Total: </span>
        <span className="text-white font-bold">{total.toFixed(1)}kg</span>
      </div>
    </div>
  )
}
