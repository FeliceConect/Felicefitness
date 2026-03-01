"use client"

import { motion } from 'framer-motion'
import { Flame, Activity, Droplets, Target } from 'lucide-react'
import type { AdditionalBodyData } from '@/lib/body/types'
import { interpretGorduraVisceral } from '@/lib/body/references'
import { calculateMetabolicAge } from '@/lib/body/calculations'
import { cn } from '@/lib/utils'

interface AdditionalMetricsCardProps {
  data: AdditionalBodyData
  className?: string
}

export function AdditionalMetricsCard({ data, className }: AdditionalMetricsCardProps) {
  const gorduraVisceralInfo = interpretGorduraVisceral(data.nivel_gordura_visceral)
  const idadeMetabolica = calculateMetabolicAge(data.taxa_metabolica_basal, data.idade)

  const metrics = [
    {
      label: 'Taxa Metabólica Basal',
      valor: data.taxa_metabolica_basal,
      unidade: 'kcal',
      descricao: 'Calorias queimadas em repouso',
      icon: Flame,
      cor: '#F97316'
    },
    {
      label: 'Gordura Visceral',
      valor: data.nivel_gordura_visceral,
      unidade: '',
      descricao: gorduraVisceralInfo.descricao,
      icon: Target,
      cor: gorduraVisceralInfo.cor,
      badge: gorduraVisceralInfo.categoria
    },
    {
      label: 'Massa Magra',
      valor: data.massa_magra,
      unidade: 'kg',
      descricao: 'Peso sem gordura',
      icon: Activity,
      cor: '#8B5CF6'
    },
    {
      label: 'Água Corporal',
      valor: data.agua_intracelular + data.agua_extracelular,
      unidade: 'L',
      descricao: `IC: ${data.agua_intracelular.toFixed(1)}L | EC: ${data.agua_extracelular.toFixed(1)}L`,
      icon: Droplets,
      cor: '#06B6D4'
    }
  ]

  return (
    <div className={cn('bg-white border border-border rounded-2xl p-4', className)}>
      <h3 className="text-sm font-semibold text-foreground-secondary uppercase tracking-wide mb-4">
        Métricas Adicionais
      </h3>

      <div className="grid grid-cols-2 gap-3">
        {metrics.map((metric, index) => {
          const Icon = metric.icon
          return (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="bg-background rounded-xl p-3"
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${metric.cor}20` }}
                >
                  <Icon className="w-4 h-4" style={{ color: metric.cor }} />
                </div>
                {metric.badge && (
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded"
                    style={{
                      backgroundColor: `${metric.cor}20`,
                      color: metric.cor
                    }}
                  >
                    {metric.badge}
                  </span>
                )}
              </div>
              <p className="text-xs text-foreground-muted mb-0.5">{metric.label}</p>
              <p className="text-lg font-bold text-foreground">
                {metric.valor.toFixed(metric.unidade === '' ? 0 : 1)}
                <span className="text-sm text-foreground-secondary ml-0.5">{metric.unidade}</span>
              </p>
              <p className="text-[10px] text-foreground-muted mt-1">{metric.descricao}</p>
            </motion.div>
          )
        })}
      </div>

      {/* Idade Metabólica */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.5 }}
        className="mt-4 pt-4 border-t border-border flex items-center justify-between"
      >
        <div>
          <p className="text-xs text-foreground-muted">Idade Metabólica Estimada</p>
          <p className="text-xl font-bold text-foreground">
            {idadeMetabolica.idadeMetabolica} anos
          </p>
        </div>
        <div
          className="px-3 py-1 rounded-lg text-sm font-medium"
          style={{
            backgroundColor: idadeMetabolica.diferenca > 0 ? '#10B98120' : idadeMetabolica.diferenca < 0 ? '#EF444420' : '#64748B20',
            color: idadeMetabolica.diferenca > 0 ? '#10B981' : idadeMetabolica.diferenca < 0 ? '#EF4444' : '#64748B'
          }}
        >
          {idadeMetabolica.diferenca > 0 ? (
            <>{idadeMetabolica.diferenca} anos mais jovem</>
          ) : idadeMetabolica.diferenca < 0 ? (
            <>{Math.abs(idadeMetabolica.diferenca)} anos mais velho</>
          ) : (
            <>Igual à idade real</>
          )}
        </div>
      </motion.div>

      {/* Relação cintura-quadril */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.6 }}
        className="mt-3 flex items-center justify-between text-sm"
      >
        <span className="text-foreground-muted">Relação Cintura-Quadril</span>
        <span className={cn(
          'font-medium',
          data.relacao_cintura_quadril <= 0.90 ? 'text-emerald-400' :
          data.relacao_cintura_quadril <= 0.95 ? 'text-amber-400' : 'text-red-400'
        )}>
          {data.relacao_cintura_quadril.toFixed(2)}
        </span>
      </motion.div>
    </div>
  )
}
