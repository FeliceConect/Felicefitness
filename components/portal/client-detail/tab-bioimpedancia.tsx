'use client'

import { useState, useEffect } from 'react'
import { Activity, TrendingUp, Scale } from 'lucide-react'

interface BioimpedanceRecord {
  id: string
  data: string
  peso: number | null
  massa_muscular: number | null
  gordura_corporal: number | null
  agua_corporal: number | null
  massa_ossea: number | null
  metabolismo_basal: number | null
  gordura_visceral: number | null
  score_inbody: number | null
  imc: number | null
}

interface TabBioimpedanciaProps {
  patientId: string
}

const METRICS = [
  { key: 'peso', label: 'Peso (kg)', color: 'text-foreground' },
  { key: 'massa_muscular', label: 'Massa Muscular (kg)', color: 'text-blue-500' },
  { key: 'gordura_corporal', label: 'Gordura (%)', color: 'text-amber-500' },
  { key: 'agua_corporal', label: 'Água (%)', color: 'text-cyan-500' },
  { key: 'imc', label: 'IMC', color: 'text-purple-500' },
  { key: 'metabolismo_basal', label: 'TMB (kcal)', color: 'text-green-500' },
  { key: 'gordura_visceral', label: 'Gord. Visceral', color: 'text-red-500' },
  { key: 'score_inbody', label: 'Score InBody', color: 'text-dourado' },
] as const

export function TabBioimpedancia({ patientId }: TabBioimpedanciaProps) {
  const [records, setRecords] = useState<BioimpedanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMetric, setSelectedMetric] = useState<string>('peso')

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

  // Simple sparkline chart data
  const getMetricValue = (r: BioimpedanceRecord, key: string): number | null => {
    return r[key as keyof BioimpedanceRecord] as number | null
  }

  const chartData = [...records].reverse().map(r => ({
    date: formatDate(r.data),
    value: getMetricValue(r, selectedMetric),
  })).filter(d => d.value != null)

  const maxVal = Math.max(...chartData.map(d => d.value || 0), 1)
  const minVal = Math.min(...chartData.map(d => d.value || 0), 0)
  const range = maxVal - minVal || 1

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
            <span className="text-sm text-foreground-muted">({formatDate(latest.data)})</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Peso', value: latest.peso, unit: 'kg', color: 'text-foreground' },
              { label: 'Massa Muscular', value: latest.massa_muscular, unit: 'kg', color: 'text-blue-500' },
              { label: 'Gordura', value: latest.gordura_corporal, unit: '%', color: 'text-amber-500' },
              { label: 'Água', value: latest.agua_corporal, unit: '%', color: 'text-cyan-500' },
              { label: 'IMC', value: latest.imc, unit: '', color: 'text-purple-500' },
              { label: 'TMB', value: latest.metabolismo_basal, unit: 'kcal', color: 'text-green-500' },
              { label: 'Gord. Visceral', value: latest.gordura_visceral, unit: '', color: 'text-red-500' },
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

      {/* Evolution Chart */}
      {records.length >= 2 && (
        <div className="bg-white border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-dourado" />
              <h3 className="text-lg font-semibold text-foreground">Evolução</h3>
            </div>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="text-sm border border-border rounded-lg px-3 py-1.5 bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-dourado/50"
            >
              {METRICS.map(m => (
                <option key={m.key} value={m.key}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* Simple SVG Chart */}
          {chartData.length >= 2 ? (
            <div className="relative">
              <svg viewBox="0 0 400 200" className="w-full h-48">
                {/* Grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((p) => (
                  <line
                    key={p}
                    x1="40" y1={20 + (160 * p)} x2="390" y2={20 + (160 * p)}
                    stroke="#d4cbc2" strokeWidth="0.5" strokeDasharray="4"
                  />
                ))}

                {/* Line */}
                <polyline
                  points={chartData.map((d, i) => {
                    const x = 40 + (i * 350 / Math.max(chartData.length - 1, 1))
                    const y = 180 - ((((d.value || 0) - minVal) / range) * 160)
                    return `${x},${y}`
                  }).join(' ')}
                  fill="none"
                  stroke="#c29863"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Points */}
                {chartData.map((d, i) => {
                  const x = 40 + (i * 350 / Math.max(chartData.length - 1, 1))
                  const y = 180 - ((((d.value || 0) - minVal) / range) * 160)
                  return (
                    <circle key={i} cx={x} cy={y} r="4" fill="#c29863" stroke="white" strokeWidth="2" />
                  )
                })}

                {/* Y-axis labels */}
                {[0, 0.5, 1].map((p) => (
                  <text
                    key={p}
                    x="35" y={24 + (160 * (1 - p))}
                    textAnchor="end" fontSize="10" fill="#7a6e64"
                  >
                    {(minVal + range * p).toFixed(1)}
                  </text>
                ))}

                {/* X-axis labels */}
                {chartData.filter((_, i) => i === 0 || i === chartData.length - 1 || chartData.length <= 5).map((d, i) => {
                  const idx = chartData.indexOf(d)
                  const x = 40 + (idx * 350 / Math.max(chartData.length - 1, 1))
                  return (
                    <text key={i} x={x} y="198" textAnchor="middle" fontSize="9" fill="#ae9b89">
                      {d.date}
                    </text>
                  )
                })}
              </svg>
            </div>
          ) : (
            <p className="text-sm text-foreground-muted text-center py-4">Dados insuficientes para gráfico</p>
          )}
        </div>
      )}

      {/* History Table */}
      {records.length > 0 && (
        <div className="bg-white border border-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="text-lg font-semibold text-foreground">Histórico</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-background-elevated">
                  <th className="text-left px-4 py-2 text-foreground-secondary font-medium">Data</th>
                  <th className="text-right px-4 py-2 text-foreground-secondary font-medium">Peso</th>
                  <th className="text-right px-4 py-2 text-foreground-secondary font-medium">Musc.</th>
                  <th className="text-right px-4 py-2 text-foreground-secondary font-medium">Gord.%</th>
                  <th className="text-right px-4 py-2 text-foreground-secondary font-medium">Água%</th>
                  <th className="text-right px-4 py-2 text-foreground-secondary font-medium">IMC</th>
                  <th className="text-right px-4 py-2 text-foreground-secondary font-medium">TMB</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id} className="border-t border-border hover:bg-background-elevated/50">
                    <td className="px-4 py-2.5 text-foreground">{formatDate(r.data)}</td>
                    <td className="px-4 py-2.5 text-right text-foreground">{r.peso ?? '-'}</td>
                    <td className="px-4 py-2.5 text-right text-blue-500">{r.massa_muscular ?? '-'}</td>
                    <td className="px-4 py-2.5 text-right text-amber-500">{r.gordura_corporal ?? '-'}</td>
                    <td className="px-4 py-2.5 text-right text-cyan-500">{r.agua_corporal ?? '-'}</td>
                    <td className="px-4 py-2.5 text-right text-purple-500">{r.imc ?? '-'}</td>
                    <td className="px-4 py-2.5 text-right text-green-500">{r.metabolismo_basal ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
