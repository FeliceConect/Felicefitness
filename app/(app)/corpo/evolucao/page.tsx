"use client"

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Calendar, TrendingUp, TrendingDown, Minus, Trophy, Target } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { EvolutionChart, MeasurementComparison } from '@/components/corpo'
import { useBodyComposition } from '@/hooks/use-body-composition'
import { useBodyEvolution } from '@/hooks/use-body-evolution'

export default function EvolucaoPage() {
  const router = useRouter()
  const { measurements, goals, isLoading } = useBodyComposition()
  const evolution = useBodyEvolution(measurements)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <div className="animate-pulse text-slate-400">Carregando...</div>
      </div>
    )
  }

  if (measurements.length < 2) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] pb-24">
        <div className="px-4 pt-12">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Voltar</span>
          </button>
          <h1 className="text-2xl font-bold text-white mb-2">Análise de Evolução</h1>
        </div>

        <div className="px-4 mt-12 text-center">
          <div className="bg-[#14141F] border border-[#2E2E3E] rounded-2xl p-8">
            <TrendingUp className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">Você precisa de pelo menos 2 medições para ver a evolução</p>
          </div>
        </div>
      </div>
    )
  }

  const getTrendIcon = (tendencia: 'subindo' | 'estavel' | 'descendo') => {
    switch (tendencia) {
      case 'subindo': return TrendingUp
      case 'descendo': return TrendingDown
      default: return Minus
    }
  }

  const metricsEvolution = [
    evolution.evolucaoPeso,
    evolution.evolucaoGordura,
    evolution.evolucaoMusculo,
    evolution.evolucaoScore,
    evolution.evolucaoGorduraVisceral
  ].filter(Boolean)

  return (
    <div className="min-h-screen bg-[#0A0A0F] pb-24">
      {/* Header */}
      <div className="px-4 pt-12 pb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Voltar</span>
        </button>

        <h1 className="text-2xl font-bold text-white">Análise de Evolução</h1>
        <p className="text-slate-400 text-sm">{evolution.periodoTotal}</p>
      </div>

      {/* Period summary */}
      <div className="px-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-violet-500/10 to-cyan-500/5 border border-violet-500/20 rounded-2xl p-4"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-violet-400" />
              <span className="text-sm text-slate-400">Período de acompanhamento</span>
            </div>
            <span className="text-white font-semibold">{evolution.diasAcompanhamento} dias</span>
          </div>

          <div className="text-center py-4 border-t border-[#2E2E3E]">
            <p className="text-slate-500 text-xs mb-1">Número de medições</p>
            <p className="text-3xl font-bold text-white">{measurements.length}</p>
          </div>
        </motion.div>
      </div>

      {/* Evolution metrics */}
      <div className="px-4 mb-6">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
          Sua Evolução
        </h3>

        <div className="space-y-3">
          {metricsEvolution.map((metric, index) => {
            if (!metric) return null
            const Icon = getTrendIcon(metric.tendencia)

            return (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="bg-[#14141F] border border-[#2E2E3E] rounded-xl p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm mb-1">{metric.label}</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-white">
                        {metric.valorAtual.toFixed(1)}{metric.unidade}
                      </span>
                      <span className="text-slate-500 text-sm">
                        (inicial: {metric.valorInicial.toFixed(1)}{metric.unidade})
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg"
                      style={{
                        backgroundColor: `${metric.corTendencia}20`,
                        color: metric.corTendencia
                      }}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="font-semibold">
                        {metric.variacaoFormatada}{metric.unidade}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {metric.melhorouPiorou === 'melhorou' ? 'Melhora' :
                       metric.melhorouPiorou === 'piorou' ? 'Piora' : 'Estável'}
                    </p>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Evolution chart */}
      <div className="px-4 mb-6">
        <EvolutionChart data={evolution.historyData} />
      </div>

      {/* Comparisons */}
      {evolution.comparacaoInicio && (
        <div className="px-4 mb-6">
          <MeasurementComparison
            comparison={evolution.comparacaoInicio}
            title="Desde o início"
          />
        </div>
      )}

      {evolution.comparacaoUltimaMes && (
        <div className="px-4 mb-6">
          <MeasurementComparison
            comparison={evolution.comparacaoUltimaMes}
            title="Último mês"
          />
        </div>
      )}

      {/* Goals progress */}
      {goals.peso_meta && (
        <div className="px-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#14141F] border border-[#2E2E3E] rounded-2xl p-4"
          >
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">
                Progresso das Metas
              </h3>
            </div>

            <div className="space-y-4">
              {/* Weight goal */}
              {goals.peso_meta && (
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-400">Peso</span>
                    <span className="text-white">
                      {evolution.evolucaoPeso?.valorAtual.toFixed(1)}kg
                      <span className="text-slate-500"> / {goals.peso_meta}kg</span>
                    </span>
                  </div>
                  <div className="h-2 bg-[#0A0A0F] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.min(100, Math.max(0,
                          ((evolution.evolucaoPeso?.valorInicial || 0) - (evolution.evolucaoPeso?.valorAtual || 0)) /
                          ((evolution.evolucaoPeso?.valorInicial || 0) - goals.peso_meta) * 100
                        ))}%`
                      }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full"
                    />
                  </div>
                </div>
              )}

              {/* Body fat goal */}
              {goals.gordura_meta && (
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-400">Gordura</span>
                    <span className="text-white">
                      {evolution.evolucaoGordura?.valorAtual.toFixed(1)}%
                      <span className="text-slate-500"> / {goals.gordura_meta}%</span>
                    </span>
                  </div>
                  <div className="h-2 bg-[#0A0A0F] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.min(100, Math.max(0,
                          ((evolution.evolucaoGordura?.valorInicial || 0) - (evolution.evolucaoGordura?.valorAtual || 0)) /
                          ((evolution.evolucaoGordura?.valorInicial || 0) - goals.gordura_meta) * 100
                        ))}%`
                      }}
                      transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
                      className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                    />
                  </div>
                </div>
              )}

              {/* Muscle goal */}
              {goals.musculo_meta && (
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-400">Músculo</span>
                    <span className="text-white">
                      {evolution.evolucaoMusculo?.valorAtual.toFixed(1)}kg
                      <span className="text-slate-500"> / {goals.musculo_meta}kg</span>
                    </span>
                  </div>
                  <div className="h-2 bg-[#0A0A0F] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.min(100, Math.max(0,
                          ((evolution.evolucaoMusculo?.valorAtual || 0) - (evolution.evolucaoMusculo?.valorInicial || 0)) /
                          (goals.musculo_meta - (evolution.evolucaoMusculo?.valorInicial || 0)) * 100
                        ))}%`
                      }}
                      transition={{ duration: 1, ease: 'easeOut', delay: 0.4 }}
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                    />
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Achievements/Milestones */}
      {evolution.marcos.length > 0 && (
        <div className="px-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#14141F] border border-[#2E2E3E] rounded-2xl p-4"
          >
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">
                Conquistas
              </h3>
            </div>

            <div className="space-y-3">
              {evolution.marcos.slice(0, 5).map((marco, index) => (
                <motion.div
                  key={`${marco.data}-${marco.titulo}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.1 }}
                  className="flex items-start gap-3 pb-3 border-b border-[#2E2E3E] last:border-0"
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0"
                    style={{ backgroundColor: `${marco.cor}20` }}
                  >
                    {marco.icone}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium">{marco.titulo}</p>
                    <p className="text-slate-500 text-xs">{marco.descricao}</p>
                    <p className="text-slate-600 text-xs mt-1">
                      {format(parseISO(marco.data), "d 'de' MMMM, yyyy", { locale: ptBR })}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
