"use client"

import { motion } from 'framer-motion'
import { Plus, History, TrendingUp, ChevronRight, Calendar } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'
import {
  InBodyScoreRing,
  MuscleFatAnalysis,
  BodyCompositionCard,
  AdditionalMetricsCard,
  EvolutionChart
} from '@/components/corpo'
import { useBodyComposition } from '@/hooks/use-body-composition'
import { useBodyEvolution } from '@/hooks/use-body-evolution'
import { cn } from '@/lib/utils'

export default function BodyPage() {
  const {
    measurements,
    latestMeasurement,
    stats,
    isLoading
  } = useBodyComposition()

  const evolution = useBodyEvolution(measurements)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <div className="animate-pulse text-slate-400">Carregando...</div>
      </div>
    )
  }

  if (!latestMeasurement) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] pb-24">
        <div className="px-4 pt-12">
          <h1 className="text-2xl font-bold text-white mb-2">Composição Corporal</h1>
          <p className="text-slate-400">Acompanhe sua evolução</p>
        </div>

        <div className="px-4 mt-12 text-center">
          <div className="bg-[#14141F] border border-[#2E2E3E] rounded-2xl p-8">
            <p className="text-slate-400 mb-4">Nenhuma medição registrada</p>
            <Link href="/corpo/nova-medicao">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 bg-gradient-to-r from-violet-600 to-cyan-500 rounded-xl text-white font-medium"
              >
                Adicionar primeira medição
              </motion.button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] pb-24">
      {/* Header */}
      <div className="px-4 pt-12 pb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-white">Composição Corporal</h1>
          <Link href="/corpo/nova-medicao">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 bg-gradient-to-r from-violet-600 to-cyan-500 rounded-xl"
            >
              <Plus className="w-5 h-5 text-white" />
            </motion.button>
          </Link>
        </div>
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <Calendar className="w-4 h-4" />
          <span>
            Última medição: {format(parseISO(latestMeasurement.data), "d 'de' MMMM", { locale: ptBR })}
          </span>
        </div>
      </div>

      {/* Score Ring */}
      <div className="px-4 mb-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-violet-500/10 to-cyan-500/5 border border-violet-500/20 rounded-2xl p-6"
        >
          <div className="flex justify-center mb-8">
            <InBodyScoreRing
              score={latestMeasurement.score.pontuacao}
              size="lg"
              showLabels
              animated
            />
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-slate-500 text-xs mb-1">Peso</p>
              <p className="text-xl font-bold text-white">
                {latestMeasurement.peso.toFixed(1)}
                <span className="text-sm text-slate-400 ml-0.5">kg</span>
              </p>
              {evolution.evolucaoPeso && (
                <p className={cn(
                  'text-xs',
                  evolution.evolucaoPeso.melhorouPiorou === 'melhorou' ? 'text-emerald-400' :
                  evolution.evolucaoPeso.melhorouPiorou === 'piorou' ? 'text-red-400' : 'text-slate-500'
                )}>
                  {evolution.evolucaoPeso.variacaoFormatada}kg total
                </p>
              )}
            </div>
            <div className="text-center">
              <p className="text-slate-500 text-xs mb-1">Gordura</p>
              <p className="text-xl font-bold text-white">
                {latestMeasurement.musculo_gordura.percentual_gordura.toFixed(1)}
                <span className="text-sm text-slate-400 ml-0.5">%</span>
              </p>
              {evolution.evolucaoGordura && (
                <p className={cn(
                  'text-xs',
                  evolution.evolucaoGordura.melhorouPiorou === 'melhorou' ? 'text-emerald-400' :
                  evolution.evolucaoGordura.melhorouPiorou === 'piorou' ? 'text-red-400' : 'text-slate-500'
                )}>
                  {evolution.evolucaoGordura.variacaoFormatada}% total
                </p>
              )}
            </div>
            <div className="text-center">
              <p className="text-slate-500 text-xs mb-1">Músculo</p>
              <p className="text-xl font-bold text-white">
                {latestMeasurement.musculo_gordura.massa_muscular_esqueletica.toFixed(1)}
                <span className="text-sm text-slate-400 ml-0.5">kg</span>
              </p>
              {evolution.evolucaoMusculo && (
                <p className={cn(
                  'text-xs',
                  evolution.evolucaoMusculo.melhorouPiorou === 'melhorou' ? 'text-emerald-400' :
                  evolution.evolucaoMusculo.melhorouPiorou === 'piorou' ? 'text-red-400' : 'text-slate-500'
                )}>
                  {evolution.evolucaoMusculo.variacaoFormatada}kg total
                </p>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Muscle-Fat Analysis */}
      <div className="px-4 mb-6">
        <MuscleFatAnalysis
          peso={latestMeasurement.peso}
          massaMuscular={latestMeasurement.musculo_gordura.massa_muscular_esqueletica}
          massaGordura={latestMeasurement.musculo_gordura.massa_gordura_corporal}
          imc={latestMeasurement.musculo_gordura.imc}
          percentualGordura={latestMeasurement.musculo_gordura.percentual_gordura}
        />
      </div>

      {/* Body Composition */}
      <div className="px-4 mb-6">
        <BodyCompositionCard
          aguaTotal={latestMeasurement.composicao.agua_total}
          proteina={latestMeasurement.composicao.proteina}
          minerais={latestMeasurement.composicao.minerais}
          gordura={latestMeasurement.composicao.gordura_corporal}
        />
      </div>

      {/* Additional Metrics */}
      <div className="px-4 mb-6">
        <AdditionalMetricsCard data={latestMeasurement.adicional} />
      </div>

      {/* Evolution Chart */}
      {measurements.length > 1 && (
        <div className="px-4 mb-6">
          <EvolutionChart data={evolution.historyData} />
        </div>
      )}

      {/* Navigation Links */}
      <div className="px-4 space-y-3">
        {/* History */}
        <Link href="/corpo/historico">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-[#14141F] border border-[#2E2E3E] rounded-xl p-4 flex items-center justify-between hover:border-violet-500/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center">
                <History className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <p className="text-white font-medium">Histórico de Medições</p>
                <p className="text-sm text-slate-400">{stats.medicoes_total} medições registradas</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-500" />
          </motion.div>
        </Link>

        {/* Evolution */}
        <Link href="/corpo/evolucao">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-[#14141F] border border-[#2E2E3E] rounded-xl p-4 flex items-center justify-between hover:border-cyan-500/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-white font-medium">Análise de Evolução</p>
                <p className="text-sm text-slate-400">{evolution.diasAcompanhamento} dias de acompanhamento</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-500" />
          </motion.div>
        </Link>
      </div>
    </div>
  )
}
