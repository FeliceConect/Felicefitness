"use client"

import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Calendar, Trash2 } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  InBodyScoreRing,
  MuscleFatAnalysis,
  BodyCompositionCard,
  SegmentalAnalysis,
  AdditionalMetricsCard,
  MeasurementComparison
} from '@/components/corpo'
import { useBodyComposition } from '@/hooks/use-body-composition'
import { compareMeasurements } from '@/lib/body/calculations'

export default function MedicaoPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const { measurements, deleteMeasurement, isLoading } = useBodyComposition()

  const measurement = measurements.find(m => m.id === id)

  // Find previous measurement for comparison
  const sortedMeasurements = [...measurements].sort((a, b) =>
    parseISO(a.data).getTime() - parseISO(b.data).getTime()
  )
  const currentIndex = sortedMeasurements.findIndex(m => m.id === id)
  const previousMeasurement = currentIndex > 0 ? sortedMeasurements[currentIndex - 1] : null

  const comparison = measurement && previousMeasurement
    ? compareMeasurements(previousMeasurement, measurement)
    : null

  const handleDelete = async () => {
    if (!measurement) return

    const confirmed = window.confirm('Tem certeza que deseja excluir esta medição?')
    if (confirmed) {
      const success = await deleteMeasurement(measurement.id)
      if (success) {
        router.push('/corpo/historico')
      }
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-foreground-secondary">Carregando...</div>
      </div>
    )
  }

  if (!measurement) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="px-4 pt-12">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-foreground-secondary hover:text-foreground-secondary transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Voltar</span>
          </button>
        </div>

        <div className="px-4 text-center mt-12">
          <div className="bg-white border border-border rounded-2xl p-8">
            <p className="text-foreground-secondary">Medição não encontrada</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="px-4 pt-12 pb-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-foreground-secondary hover:text-foreground-secondary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Voltar</span>
          </button>

          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleDelete}
              className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              <Trash2 className="w-5 h-5 text-red-400" />
            </motion.button>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-foreground mb-1">Detalhes da Medição</h1>
        <div className="flex items-center gap-2 text-foreground-secondary text-sm">
          <Calendar className="w-4 h-4" />
          <span>
            {format(parseISO(measurement.data), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </span>
        </div>
      </div>

      {/* Score Ring */}
      <div className="px-4 mb-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-dourado/10 to-dourado/5 border border-dourado/20 rounded-2xl p-6"
        >
          <div className="flex justify-center mb-6">
            <InBodyScoreRing
              score={measurement.score.pontuacao}
              size="lg"
              showLabels
              animated
            />
          </div>

          {/* Quick metrics */}
          <div className="grid grid-cols-4 gap-2 text-center">
            <div>
              <p className="text-foreground-muted text-[10px] mb-0.5">Peso</p>
              <p className="text-sm font-bold text-foreground">{measurement.peso.toFixed(1)}kg</p>
            </div>
            <div>
              <p className="text-foreground-muted text-[10px] mb-0.5">Gordura</p>
              <p className="text-sm font-bold text-foreground">{measurement.musculo_gordura.percentual_gordura.toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-foreground-muted text-[10px] mb-0.5">Músculo</p>
              <p className="text-sm font-bold text-foreground">{measurement.musculo_gordura.massa_muscular_esqueletica.toFixed(1)}kg</p>
            </div>
            <div>
              <p className="text-foreground-muted text-[10px] mb-0.5">IMC</p>
              <p className="text-sm font-bold text-foreground">{measurement.musculo_gordura.imc.toFixed(1)}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Comparison with previous */}
      {comparison && (
        <div className="px-4 mb-6">
          <MeasurementComparison
            comparison={comparison}
            title="Comparação com medição anterior"
          />
        </div>
      )}

      {/* Muscle-Fat Analysis */}
      <div className="px-4 mb-6">
        <MuscleFatAnalysis
          peso={measurement.peso}
          massaMuscular={measurement.musculo_gordura.massa_muscular_esqueletica}
          massaGordura={measurement.musculo_gordura.massa_gordura_corporal}
          imc={measurement.musculo_gordura.imc}
          percentualGordura={measurement.musculo_gordura.percentual_gordura}
        />
      </div>

      {/* Body Composition */}
      <div className="px-4 mb-6">
        <BodyCompositionCard
          aguaTotal={measurement.composicao.agua_total}
          proteina={measurement.composicao.proteina}
          minerais={measurement.composicao.minerais}
          gordura={measurement.composicao.gordura_corporal}
        />
      </div>

      {/* Segmental Analysis */}
      <div className="px-4 mb-6">
        <SegmentalAnalysis data={measurement.segmental} />
      </div>

      {/* Additional Metrics */}
      <div className="px-4 mb-6">
        <AdditionalMetricsCard data={measurement.adicional} />
      </div>

      {/* Notes */}
      {measurement.notas && (
        <div className="px-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-border rounded-2xl p-4"
          >
            <h3 className="text-sm font-semibold text-foreground-secondary uppercase tracking-wide mb-2">
              Observações
            </h3>
            <p className="text-foreground-secondary">{measurement.notas}</p>
          </motion.div>
        </div>
      )}

      {/* Metadata */}
      <div className="px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-border rounded-2xl p-4"
        >
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-foreground-muted text-xs mb-1">Fonte</p>
              <p className="text-foreground capitalize">
                {measurement.fonte === 'inbody' ? 'InBody' :
                 measurement.fonte === 'manual' ? 'Manual' : 'Balança Smart'}
              </p>
            </div>
            <div>
              <p className="text-foreground-muted text-xs mb-1">Horário</p>
              <p className="text-foreground">{measurement.horario || '--'}</p>
            </div>
            <div>
              <p className="text-foreground-muted text-xs mb-1">Altura</p>
              <p className="text-foreground">{measurement.altura}cm</p>
            </div>
            <div>
              <p className="text-foreground-muted text-xs mb-1">Idade</p>
              <p className="text-foreground">{measurement.idade} anos</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
