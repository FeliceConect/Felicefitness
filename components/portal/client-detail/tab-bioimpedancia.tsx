'use client'

import { useState, useEffect } from 'react'
import { Activity, TrendingUp, Scale, ArrowUp, ArrowDown } from 'lucide-react'

interface BioimpedanceRecord {
  id: string
  data: string
  momento: string | null
  peso: number | null
  percentual_gordura: number | null
  massa_gordura_kg: number | null
  massa_muscular: number | null
  massa_magra: number | null
  agua_corporal: number | null
  proteina: number | null
  minerais: number | null
  imc: number | null
  metabolismo_basal: number | null
  gordura_visceral: number | null
  cintura_quadril: number | null
  score_inbody: number | null
}

interface TabBioimpedanciaProps {
  patientId: string
}

// Métricas exibidas no painel de evolução (item por item)
const CARD_METRICS = [
  { key: 'peso', label: 'Peso', unit: 'kg' },
  { key: 'percentual_gordura', label: 'Gordura', unit: '%' },
  { key: 'massa_gordura_kg', label: 'Massa Gorda', unit: 'kg' },
  { key: 'massa_muscular', label: 'Massa Muscular', unit: 'kg' },
  { key: 'massa_magra', label: 'Massa Magra', unit: 'kg' },
  { key: 'agua_corporal', label: 'Água', unit: 'L' },
  { key: 'proteina', label: 'Proteína', unit: 'kg' },
  { key: 'minerais', label: 'Minerais', unit: 'kg' },
  { key: 'imc', label: 'IMC', unit: '' },
  { key: 'metabolismo_basal', label: 'TMB', unit: 'kcal' },
  { key: 'gordura_visceral', label: 'Gord. Visceral', unit: '' },
  { key: 'cintura_quadril', label: 'Cintura/Quadril', unit: '' },
  { key: 'score_inbody', label: 'Score InBody', unit: '' },
] as const

// Métricas em que MENOR é melhor (queda = melhora → seta verde).
// As demais (massa muscular/magra, água, proteína, minerais, TMB, score)
// seguem "maior é melhor".
const LOWER_IS_BETTER = new Set<string>([
  'peso',
  'percentual_gordura',
  'massa_gordura_kg',
  'imc',
  'gordura_visceral',
  'cintura_quadril',
])

const round1 = (n: number) => Math.round(n * 10) / 10

// Seta de variação vs. a medição anterior (mais antiga). Verde = melhorou,
// vermelho = piorou. Não renderiza nada quando não há base de comparação.
function DeltaArrow({ field, curr, prev }: { field: string; curr: number | null; prev: number | null }) {
  if (curr == null || prev == null) return null
  const diff = round1(curr - prev)
  if (diff === 0) return null
  const good = LOWER_IS_BETTER.has(field) ? diff < 0 : diff > 0
  const Icon = diff > 0 ? ArrowUp : ArrowDown
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] ml-1 ${good ? 'text-green-600' : 'text-red-600'}`}>
      <Icon className="w-2.5 h-2.5" />
      {Math.abs(diff)}
    </span>
  )
}

// Mini-gráfico de tendência (cronológico). Cor verde quando o conjunto
// indica melhora, vermelha quando piora.
function Sparkline({ values, improved }: { values: number[]; improved: boolean | null }) {
  if (values.length < 2) return null
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const w = 100
  const h = 28
  const color = improved === null ? '#c29863' : improved ? '#7dad6a' : '#a04045'
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w
      const y = h - 3 - ((v - min) / range) * (h - 6)
      return `${x},${y}`
    })
    .join(' ')
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-7 mt-2" preserveAspectRatio="none" aria-hidden="true">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {values.map((v, i) => {
        const x = (i / (values.length - 1)) * w
        const y = h - 3 - ((v - min) / range) * (h - 6)
        return <circle key={i} cx={x} cy={y} r="1.6" fill={color} />
      })}
    </svg>
  )
}

// Card de evolução de uma métrica: valor atual + variação desde a 1ª avaliação + sparkline.
function MetricEvolutionCard({
  label,
  unit,
  metricKey,
  series,
}: {
  label: string
  unit: string
  metricKey: string
  series: number[]
}) {
  const latestVal = series.length > 0 ? series[series.length - 1] : null
  const firstVal = series.length > 0 ? series[0] : null
  const delta = series.length >= 2 && firstVal != null && latestVal != null ? round1(latestVal - firstVal) : null
  const improved = delta == null || delta === 0 ? null : (LOWER_IS_BETTER.has(metricKey) ? delta < 0 : delta > 0)
  const DeltaIcon = delta != null && delta > 0 ? ArrowUp : ArrowDown

  return (
    <div className="p-3 bg-background-elevated rounded-lg">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs text-foreground-muted truncate">{label}</span>
        {delta != null && delta !== 0 && (
          <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${improved ? 'text-green-600' : 'text-red-600'}`}>
            <DeltaIcon className="w-3 h-3" />
            {Math.abs(delta)}
          </span>
        )}
      </div>
      <p className="text-lg font-bold text-foreground mt-0.5">
        {latestVal != null ? latestVal : '-'}
        {latestVal != null && unit && <span className="text-xs font-normal text-foreground-muted ml-0.5">{unit}</span>}
      </p>
      <Sparkline values={series} improved={improved} />
    </div>
  )
}

export function TabBioimpedancia({ patientId }: TabBioimpedanciaProps) {
  const [records, setRecords] = useState<BioimpedanceRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/professional/clients/${patientId}/bioimpedance`)
      .then(r => r.json())
      .then(data => {
        if (data.success) setRecords(data.records || [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [patientId])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="bg-white border border-border rounded-xl p-6 h-40 animate-pulse" />
        <div className="bg-white border border-border rounded-xl p-6 h-64 animate-pulse" />
      </div>
    )
  }

  const latest = records[0]
  const formatDate = (d: string) => new Date(d).toLocaleDateString('pt-BR')

  // Registros em ordem cronológica (mais antigo → mais novo) para a evolução
  const chrono = [...records].reverse()
  // Série de valores não-nulos de uma métrica, em ordem cronológica
  const seriesFor = (key: string): number[] =>
    chrono
      .map(r => r[key as keyof BioimpedanceRecord] as number | null)
      .filter((v): v is number => v != null)

  const firstMomento = chrono.find(r => r.momento)?.momento
  const lastMomento = latest?.momento

  return (
    <div className="space-y-6">
      {/* Latest Reading */}
      {latest ? (
        <div className="bg-white border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-dourado" />
            <h3 className="text-lg font-semibold text-foreground">
              Última Bioimpedância
            </h3>
            <span className="text-sm text-foreground-muted">
              ({latest.momento ? `${latest.momento} • ` : ''}{formatDate(latest.data)})
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Peso', value: latest.peso, unit: 'kg', color: 'text-foreground' },
              { label: 'Gordura', value: latest.percentual_gordura, unit: '%', color: 'text-amber-500' },
              { label: 'Massa Gorda', value: latest.massa_gordura_kg, unit: 'kg', color: 'text-amber-600' },
              { label: 'Massa Muscular', value: latest.massa_muscular, unit: 'kg', color: 'text-blue-500' },
              { label: 'Massa Magra', value: latest.massa_magra, unit: 'kg', color: 'text-blue-600' },
              { label: 'Água', value: latest.agua_corporal, unit: 'L', color: 'text-cyan-500' },
              { label: 'Proteína', value: latest.proteina, unit: 'kg', color: 'text-emerald-500' },
              { label: 'Minerais', value: latest.minerais, unit: 'kg', color: 'text-purple-400' },
              { label: 'IMC', value: latest.imc, unit: '', color: 'text-purple-500' },
              { label: 'TMB', value: latest.metabolismo_basal, unit: 'kcal', color: 'text-green-500' },
              { label: 'Gord. Visceral', value: latest.gordura_visceral, unit: '', color: 'text-red-500' },
              { label: 'Cintura/Quadril', value: latest.cintura_quadril, unit: '', color: 'text-orange-500' },
              { label: 'Score InBody', value: latest.score_inbody, unit: '', color: 'text-dourado' },
            ].map((item) => (
              <div key={item.label} className="text-center p-3 bg-background-elevated rounded-lg">
                <p className={`text-xl font-bold ${item.color}`}>
                  {item.value != null ? item.value : '-'}
                  {item.value != null && item.unit && <span className="text-xs font-normal ml-0.5">{item.unit}</span>}
                </p>
                <p className="text-xs text-foreground-muted">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white border border-border rounded-xl p-8 text-center">
          <Scale className="w-10 h-10 text-foreground-muted mx-auto mb-2" />
          <p className="text-foreground-secondary">Nenhuma bioimpedância registrada</p>
        </div>
      )}

      {/* Evolução — item por item */}
      {records.length >= 2 && (
        <div className="bg-white border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-5 h-5 text-dourado" />
            <h3 className="text-lg font-semibold text-foreground">Evolução</h3>
          </div>
          <p className="text-xs text-foreground-muted mb-4">
            Variação da primeira{firstMomento ? ` (${firstMomento})` : ''} até a última
            {lastMomento ? ` (${lastMomento})` : ''} avaliação · verde = melhora, vermelho = piora
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {CARD_METRICS.map((m) => {
              const series = seriesFor(m.key)
              if (series.length === 0) return null
              return (
                <MetricEvolutionCard
                  key={m.key}
                  label={m.label}
                  unit={m.unit}
                  metricKey={m.key}
                  series={series}
                />
              )
            })}
          </div>
        </div>
      )}

      {/* History Table */}
      {records.length > 0 && (
        <div className="bg-white border border-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="text-lg font-semibold text-foreground">Histórico</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm whitespace-nowrap">
              <thead>
                <tr className="bg-background-elevated">
                  <th className="text-left px-3 py-2 text-foreground-secondary font-medium">Momento</th>
                  <th className="text-left px-3 py-2 text-foreground-secondary font-medium">Data</th>
                  <th className="text-right px-3 py-2 text-foreground-secondary font-medium">Peso</th>
                  <th className="text-right px-3 py-2 text-foreground-secondary font-medium">Gord.%</th>
                  <th className="text-right px-3 py-2 text-foreground-secondary font-medium">Gord. (kg)</th>
                  <th className="text-right px-3 py-2 text-foreground-secondary font-medium">Musc.</th>
                  <th className="text-right px-3 py-2 text-foreground-secondary font-medium">Magra</th>
                  <th className="text-right px-3 py-2 text-foreground-secondary font-medium">Água (L)</th>
                  <th className="text-right px-3 py-2 text-foreground-secondary font-medium">Proteína</th>
                  <th className="text-right px-3 py-2 text-foreground-secondary font-medium">Minerais</th>
                  <th className="text-right px-3 py-2 text-foreground-secondary font-medium">IMC</th>
                  <th className="text-right px-3 py-2 text-foreground-secondary font-medium">TMB</th>
                  <th className="text-right px-3 py-2 text-foreground-secondary font-medium">Visceral</th>
                  <th className="text-right px-3 py-2 text-foreground-secondary font-medium">C/Q</th>
                  <th className="text-right px-3 py-2 text-foreground-secondary font-medium">Score</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r, i) => {
                  // Comparação com a medição anterior (mais antiga = próxima linha,
                  // pois a lista está ordenada do mais recente para o mais antigo).
                  const prev = records[i + 1]
                  return (
                    <tr key={r.id} className="border-t border-border hover:bg-background-elevated/50">
                      <td className="px-3 py-2.5 text-foreground-secondary font-medium">{r.momento ?? '-'}</td>
                      <td className="px-3 py-2.5 text-foreground">{formatDate(r.data)}</td>
                      <td className="px-3 py-2.5 text-right text-foreground">{r.peso ?? '-'}<DeltaArrow field="peso" curr={r.peso} prev={prev?.peso ?? null} /></td>
                      <td className="px-3 py-2.5 text-right text-amber-500">{r.percentual_gordura ?? '-'}<DeltaArrow field="percentual_gordura" curr={r.percentual_gordura} prev={prev?.percentual_gordura ?? null} /></td>
                      <td className="px-3 py-2.5 text-right text-amber-600">{r.massa_gordura_kg ?? '-'}<DeltaArrow field="massa_gordura_kg" curr={r.massa_gordura_kg} prev={prev?.massa_gordura_kg ?? null} /></td>
                      <td className="px-3 py-2.5 text-right text-blue-500">{r.massa_muscular ?? '-'}<DeltaArrow field="massa_muscular" curr={r.massa_muscular} prev={prev?.massa_muscular ?? null} /></td>
                      <td className="px-3 py-2.5 text-right text-blue-600">{r.massa_magra ?? '-'}<DeltaArrow field="massa_magra" curr={r.massa_magra} prev={prev?.massa_magra ?? null} /></td>
                      <td className="px-3 py-2.5 text-right text-cyan-500">{r.agua_corporal ?? '-'}<DeltaArrow field="agua_corporal" curr={r.agua_corporal} prev={prev?.agua_corporal ?? null} /></td>
                      <td className="px-3 py-2.5 text-right text-emerald-500">{r.proteina ?? '-'}<DeltaArrow field="proteina" curr={r.proteina} prev={prev?.proteina ?? null} /></td>
                      <td className="px-3 py-2.5 text-right text-purple-400">{r.minerais ?? '-'}<DeltaArrow field="minerais" curr={r.minerais} prev={prev?.minerais ?? null} /></td>
                      <td className="px-3 py-2.5 text-right text-purple-500">{r.imc ?? '-'}<DeltaArrow field="imc" curr={r.imc} prev={prev?.imc ?? null} /></td>
                      <td className="px-3 py-2.5 text-right text-green-500">{r.metabolismo_basal ?? '-'}<DeltaArrow field="metabolismo_basal" curr={r.metabolismo_basal} prev={prev?.metabolismo_basal ?? null} /></td>
                      <td className="px-3 py-2.5 text-right text-red-500">{r.gordura_visceral ?? '-'}<DeltaArrow field="gordura_visceral" curr={r.gordura_visceral} prev={prev?.gordura_visceral ?? null} /></td>
                      <td className="px-3 py-2.5 text-right text-orange-500">{r.cintura_quadril ?? '-'}<DeltaArrow field="cintura_quadril" curr={r.cintura_quadril} prev={prev?.cintura_quadril ?? null} /></td>
                      <td className="px-3 py-2.5 text-right text-dourado">{r.score_inbody ?? '-'}<DeltaArrow field="score_inbody" curr={r.score_inbody} prev={prev?.score_inbody ?? null} /></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
