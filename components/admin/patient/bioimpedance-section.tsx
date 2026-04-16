"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Activity, Plus, Loader2, Camera, Sparkles, X, Pencil, Trash2, TrendingUp, GitCompare, ArrowUp, ArrowDown, Minus } from 'lucide-react'

interface BioRecord {
  id: string
  data: string
  fonte: string | null
  momento_avaliacao: string | null
  horario_coleta: string | null
  peso: number | null
  altura_cm: number | null
  idade: number | null
  percentual_gordura: number | null
  massa_muscular_esqueletica_kg: number | null
  massa_gordura_kg: number | null
  massa_livre_gordura_kg: number | null
  agua_corporal_l: number | null
  proteina_kg: number | null
  minerais_kg: number | null
  imc: number | null
  taxa_metabolica_basal: number | null
  gordura_visceral: number | null
  pontuacao_inbody: number | null
  idade_metabolica: number | null
  relacao_cintura_quadril: number | null
  grau_obesidade: number | null
  peso_ideal: number | null
  controle_peso: number | null
  controle_gordura: number | null
  controle_muscular: number | null
  massa_magra_braco_direito: number | null
  massa_magra_braco_direito_percent: number | null
  massa_magra_braco_esquerdo: number | null
  massa_magra_braco_esquerdo_percent: number | null
  massa_magra_tronco: number | null
  massa_magra_tronco_percent: number | null
  massa_magra_perna_direita: number | null
  massa_magra_perna_direita_percent: number | null
  massa_magra_perna_esquerda: number | null
  massa_magra_perna_esquerda_percent: number | null
  gordura_braco_direito: number | null
  gordura_braco_direito_percent: number | null
  gordura_braco_esquerdo: number | null
  gordura_braco_esquerdo_percent: number | null
  gordura_tronco: number | null
  gordura_tronco_percent: number | null
  gordura_perna_direita: number | null
  gordura_perna_direita_percent: number | null
  gordura_perna_esquerda: number | null
  gordura_perna_esquerda_percent: number | null
  impedancia_dados: { '20khz'?: Record<string, number | null>; '100khz'?: Record<string, number | null> } | null
  foto_url: string | null
  notas: string | null
}

interface BioimpedanceSectionProps {
  patientId: string
}

const MOMENTOS = ['M0', 'M1', 'M2', 'M3', 'M4', 'M5', 'M6'] as const

type FormState = Record<string, string | number | null>

interface CampoDef {
  key: string
  label: string
  step?: string
}

interface GrupoDef {
  group: string
  rows: CampoDef[][]
}

const CAMPOS: GrupoDef[] = [
  { group: 'Básicos', rows: [
    [
      { key: 'peso', label: 'Peso (kg)', step: '0.1' },
      { key: 'altura_cm', label: 'Altura (cm)' },
      { key: 'idade', label: 'Idade' },
    ],
  ] },
  { group: 'Composição corporal', rows: [
    [
      { key: 'agua_corporal_l', label: 'Água (L)', step: '0.1' },
      { key: 'proteina_kg', label: 'Proteína (kg)', step: '0.1' },
      { key: 'minerais_kg', label: 'Minerais (kg)', step: '0.1' },
    ],
    [
      { key: 'massa_gordura_kg', label: 'Massa Gordura (kg)', step: '0.1' },
      { key: 'massa_muscular_esqueletica_kg', label: 'Massa Musc. Esq. (kg)', step: '0.1' },
      { key: 'massa_livre_gordura_kg', label: 'Massa Livre Gordura (kg)', step: '0.1' },
    ],
  ] },
  { group: 'Índices', rows: [
    [
      { key: 'imc', label: 'IMC', step: '0.1' },
      { key: 'percentual_gordura', label: '% Gordura', step: '0.1' },
      { key: 'taxa_metabolica_basal', label: 'TMB (kcal)' },
    ],
    [
      { key: 'gordura_visceral', label: 'Gordura Visceral' },
      { key: 'pontuacao_inbody', label: 'Pontuação InBody' },
      { key: 'idade_metabolica', label: 'Idade Metabólica' },
    ],
    [
      { key: 'relacao_cintura_quadril', label: 'Cintura/Quadril', step: '0.01' },
      { key: 'grau_obesidade', label: 'Grau Obesidade (%)', step: '0.1' },
    ],
  ] },
  { group: 'Controle', rows: [
    [
      { key: 'peso_ideal', label: 'Peso Ideal (kg)', step: '0.1' },
      { key: 'controle_peso', label: 'Controle Peso (kg)', step: '0.1' },
      { key: 'controle_gordura', label: 'Controle Gordura (kg)', step: '0.1' },
      { key: 'controle_muscular', label: 'Controle Muscular (kg)', step: '0.1' },
    ],
  ] },
  { group: 'Massa Magra Segmentar', rows: [
    [
      { key: 'massa_magra_braco_direito', label: 'Braço D (kg)', step: '0.01' },
      { key: 'massa_magra_braco_direito_percent', label: 'Braço D (%)', step: '0.1' },
      { key: 'massa_magra_braco_esquerdo', label: 'Braço E (kg)', step: '0.01' },
      { key: 'massa_magra_braco_esquerdo_percent', label: 'Braço E (%)', step: '0.1' },
    ],
    [
      { key: 'massa_magra_tronco', label: 'Tronco (kg)', step: '0.01' },
      { key: 'massa_magra_tronco_percent', label: 'Tronco (%)', step: '0.1' },
    ],
    [
      { key: 'massa_magra_perna_direita', label: 'Perna D (kg)', step: '0.01' },
      { key: 'massa_magra_perna_direita_percent', label: 'Perna D (%)', step: '0.1' },
      { key: 'massa_magra_perna_esquerda', label: 'Perna E (kg)', step: '0.01' },
      { key: 'massa_magra_perna_esquerda_percent', label: 'Perna E (%)', step: '0.1' },
    ],
  ] },
  { group: 'Gordura Segmentar', rows: [
    [
      { key: 'gordura_braco_direito', label: 'Braço D (kg)', step: '0.01' },
      { key: 'gordura_braco_direito_percent', label: 'Braço D (%)', step: '0.1' },
      { key: 'gordura_braco_esquerdo', label: 'Braço E (kg)', step: '0.01' },
      { key: 'gordura_braco_esquerdo_percent', label: 'Braço E (%)', step: '0.1' },
    ],
    [
      { key: 'gordura_tronco', label: 'Tronco (kg)', step: '0.01' },
      { key: 'gordura_tronco_percent', label: 'Tronco (%)', step: '0.1' },
    ],
    [
      { key: 'gordura_perna_direita', label: 'Perna D (kg)', step: '0.01' },
      { key: 'gordura_perna_direita_percent', label: 'Perna D (%)', step: '0.1' },
      { key: 'gordura_perna_esquerda', label: 'Perna E (kg)', step: '0.01' },
      { key: 'gordura_perna_esquerda_percent', label: 'Perna E (%)', step: '0.1' },
    ],
  ] },
  { group: 'Impedância Z (Ω) — 20 kHz', rows: [
    [
      { key: 'z20_bd', label: 'Braço D', step: '0.1' },
      { key: 'z20_be', label: 'Braço E', step: '0.1' },
      { key: 'z20_tr', label: 'Tronco', step: '0.1' },
      { key: 'z20_pd', label: 'Perna D', step: '0.1' },
      { key: 'z20_pe', label: 'Perna E', step: '0.1' },
    ],
  ] },
  { group: 'Impedância Z (Ω) — 100 kHz', rows: [
    [
      { key: 'z100_bd', label: 'Braço D', step: '0.1' },
      { key: 'z100_be', label: 'Braço E', step: '0.1' },
      { key: 'z100_tr', label: 'Tronco', step: '0.1' },
      { key: 'z100_pd', label: 'Perna D', step: '0.1' },
      { key: 'z100_pe', label: 'Perna E', step: '0.1' },
    ],
  ] },
]

// campos "z20_*" e "z100_*" são auxiliares de UI — são agregados em "impedancia_dados" (JSONB) antes do POST
const Z_KEYS = ['z20_bd', 'z20_be', 'z20_tr', 'z20_pd', 'z20_pe', 'z100_bd', 'z100_be', 'z100_tr', 'z100_pd', 'z100_pe']

function round1(n: number): number {
  return Math.round(n * 10) / 10
}

export function BioimpedanceSection({ patientId }: BioimpedanceSectionProps) {
  const [records, setRecords] = useState<BioRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [form, setForm] = useState<FormState>({})
  const [fotoUrl, setFotoUrl] = useState<string | null>(null)
  const [fonte, setFonte] = useState<'inbody' | 'inbody_ia' | 'manual'>('inbody')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showCompare, setShowCompare] = useState(false)
  const [compareA, setCompareA] = useState<string>('')
  const [compareB, setCompareB] = useState<string>('')
  const [chartMetric, setChartMetric] = useState<'peso' | 'massa_muscular_esqueletica_kg' | 'percentual_gordura' | 'gordura_visceral'>('peso')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchRecords = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/patients/${patientId}/bioimpedance`)
      const json = await res.json()
      if (json.success) setRecords(json.records || [])
    } catch (err) {
      console.error('Erro ao buscar bioimpedâncias:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecords()
  }, [patientId]) // eslint-disable-line react-hooks/exhaustive-deps

  const resetForm = () => {
    setForm({})
    setFotoUrl(null)
    setFonte('inbody')
    setEditingId(null)
  }

  const handleAnalyzeWithAI = async (file: File) => {
    setAnalyzing(true)
    try {
      const fd = new FormData()
      fd.append('image', file)
      const res = await fetch('/api/inbody/analyze', {
        method: 'POST',
        body: fd,
      })
      const json = await res.json()
      if (!json.success) {
        toast.error(json.error || 'Erro ao analisar imagem')
        return
      }
      // preenche o form com o que IA retornou
      const ai = json.data || {}
      const filled: FormState = {}
      Object.keys(ai).forEach(k => {
        if (k === 'confidence' || ai[k] == null) return
        // Desempacota impedância em campos auxiliares do form
        if (k === 'impedancia_20khz' && typeof ai[k] === 'object') {
          const z = ai[k] as Record<string, number | null>
          if (z.BD != null) filled.z20_bd = z.BD
          if (z.BE != null) filled.z20_be = z.BE
          if (z.TR != null) filled.z20_tr = z.TR
          if (z.PD != null) filled.z20_pd = z.PD
          if (z.PE != null) filled.z20_pe = z.PE
          return
        }
        if (k === 'impedancia_100khz' && typeof ai[k] === 'object') {
          const z = ai[k] as Record<string, number | null>
          if (z.BD != null) filled.z100_bd = z.BD
          if (z.BE != null) filled.z100_be = z.BE
          if (z.TR != null) filled.z100_tr = z.TR
          if (z.PD != null) filled.z100_pd = z.PD
          if (z.PE != null) filled.z100_pe = z.PE
          return
        }
        filled[k] = ai[k]
      })
      setForm(filled)
      setFotoUrl(json.image_url || null)
      setFonte('inbody_ia')
      const conf = ai.confidence != null ? ` (confiança ${Math.round(ai.confidence * 100)}%)` : ''
      toast.success(`Dados extraídos pela IA${conf}. Revise antes de salvar.`)
    } catch (err) {
      console.error('Erro OCR:', err)
      toast.error('Erro ao analisar imagem')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    handleAnalyzeWithAI(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const openEdit = (record: BioRecord) => {
    const filled: FormState = {}
    // Copia os campos diretos
    const skipKeys = new Set(['id', 'fonte', 'foto_url', 'impedancia_dados'])
    Object.entries(record).forEach(([k, v]) => {
      if (skipKeys.has(k)) return
      if (v != null) filled[k] = v as string | number
    })
    // Desempacota impedancia_dados nos campos auxiliares z20_* / z100_*
    const imp = record.impedancia_dados
    if (imp) {
      const z20 = imp['20khz']
      if (z20) {
        if (z20.BD != null) filled.z20_bd = z20.BD
        if (z20.BE != null) filled.z20_be = z20.BE
        if (z20.TR != null) filled.z20_tr = z20.TR
        if (z20.PD != null) filled.z20_pd = z20.PD
        if (z20.PE != null) filled.z20_pe = z20.PE
      }
      const z100 = imp['100khz']
      if (z100) {
        if (z100.BD != null) filled.z100_bd = z100.BD
        if (z100.BE != null) filled.z100_be = z100.BE
        if (z100.TR != null) filled.z100_tr = z100.TR
        if (z100.PD != null) filled.z100_pd = z100.PD
        if (z100.PE != null) filled.z100_pe = z100.PE
      }
    }
    setForm(filled)
    setFotoUrl(record.foto_url)
    setFonte((record.fonte as 'inbody' | 'inbody_ia' | 'manual') || 'inbody')
    setEditingId(record.id)
    setShowForm(true)
  }

  const handleDelete = async (recordId: string) => {
    if (!confirm('Remover esta bioimpedância? Os pontos concedidos também serão revertidos.')) return
    try {
      const res = await fetch(`/api/admin/patients/${patientId}/bioimpedance/${recordId}`, {
        method: 'DELETE',
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Bioimpedância removida')
        fetchRecords()
      } else {
        toast.error(json.error || 'Erro ao remover')
      }
    } catch (err) {
      console.error('Erro delete bioimpedância:', err)
      toast.error('Erro ao remover')
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const body: Record<string, unknown> = { fonte, foto_url: fotoUrl }
      Object.keys(form).forEach(k => {
        const v = form[k]
        if (v === '' || v == null) return
        // Campos de impedância Z são agregados depois — pular aqui
        if (Z_KEYS.includes(k)) return
        body[k] = typeof v === 'string' ? parseFloat(v) : v
      })
      if (form.momento_avaliacao) body.momento_avaliacao = form.momento_avaliacao
      if (form.data) body.data = form.data
      if (form.horario_coleta) body.horario_coleta = form.horario_coleta

      // Agrega impedância Z em JSONB se algum valor foi preenchido
      const toNum = (k: string): number | null => {
        const v = form[k]
        if (v === '' || v == null) return null
        return typeof v === 'string' ? parseFloat(v) : v
      }
      const z20 = { BD: toNum('z20_bd'), BE: toNum('z20_be'), TR: toNum('z20_tr'), PD: toNum('z20_pd'), PE: toNum('z20_pe') }
      const z100 = { BD: toNum('z100_bd'), BE: toNum('z100_be'), TR: toNum('z100_tr'), PD: toNum('z100_pd'), PE: toNum('z100_pe') }
      const hasZ20 = Object.values(z20).some(v => v != null)
      const hasZ100 = Object.values(z100).some(v => v != null)
      if (hasZ20 || hasZ100) {
        body.impedancia_dados = {
          ...(hasZ20 ? { '20khz': z20 } : {}),
          ...(hasZ100 ? { '100khz': z100 } : {}),
        }
      }

      const url = editingId
        ? `/api/admin/patients/${patientId}/bioimpedance/${editingId}`
        : `/api/admin/patients/${patientId}/bioimpedance`
      const method = editingId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (json.success) {
        const pts = json.points
        if (pts && pts.total !== 0) {
          const sign = pts.total > 0 ? '+' : ''
          toast.success(`${editingId ? 'Atualizada' : 'Registrada'} · ${sign}${pts.total} pts`)
        } else {
          toast.success(editingId ? 'Bioimpedância atualizada' : 'Bioimpedância registrada')
        }
        setShowForm(false)
        resetForm()
        fetchRecords()
      } else {
        toast.error(json.error || 'Erro ao salvar')
      }
    } catch (err) {
      console.error('Erro ao salvar bioimpedância:', err)
      toast.error('Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString('pt-BR')

  // Deltas vs. linha imediatamente mais antiga (records[i+1], já vem ordenado DESC)
  const deltas = useMemo(() => {
    const out: Record<string, { peso: number | null; musc: number | null; gord: number | null; visceral: number | null }> = {}
    for (let i = 0; i < records.length - 1; i++) {
      const curr = records[i]
      const prev = records[i + 1]
      out[curr.id] = {
        peso: curr.peso != null && prev.peso != null ? round1(curr.peso - prev.peso) : null,
        musc: curr.massa_muscular_esqueletica_kg != null && prev.massa_muscular_esqueletica_kg != null ? round1(curr.massa_muscular_esqueletica_kg - prev.massa_muscular_esqueletica_kg) : null,
        gord: curr.percentual_gordura != null && prev.percentual_gordura != null ? round1(curr.percentual_gordura - prev.percentual_gordura) : null,
        visceral: curr.gordura_visceral != null && prev.gordura_visceral != null ? curr.gordura_visceral - prev.gordura_visceral : null,
      }
    }
    return out
  }, [records])

  // Série cronológica para gráfico (asc por data)
  const chartSeries = useMemo(() => {
    return [...records].reverse().map(r => ({
      date: formatDate(r.data),
      value: r[chartMetric] as number | null,
      momento: r.momento_avaliacao,
    })).filter(p => p.value != null)
  }, [records, chartMetric])

  const chartMinMax = useMemo(() => {
    if (chartSeries.length === 0) return { min: 0, max: 1, range: 1 }
    const values = chartSeries.map(p => p.value as number)
    const min = Math.min(...values)
    const max = Math.max(...values)
    const range = max - min || 1
    return { min, max, range }
  }, [chartSeries])

  const compareRecords = useMemo(() => {
    const a = records.find(r => r.id === compareA)
    const b = records.find(r => r.id === compareB)
    return { a, b }
  }, [records, compareA, compareB])

  return (
    <div>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Activity className="w-5 h-5 text-dourado" />
          Bioimpedância (InBody)
        </h2>
        <div className="flex items-center gap-2">
          {records.length >= 2 && (
            <button
              onClick={() => {
                setShowCompare(!showCompare)
                if (!showCompare && records.length >= 2) {
                  setCompareA(records[records.length - 1].id) // mais antigo
                  setCompareB(records[0].id) // mais novo
                }
              }}
              className="inline-flex items-center gap-2 px-3 py-2 border border-border bg-white hover:bg-background-elevated text-foreground rounded-lg text-sm font-medium transition-colors"
            >
              <GitCompare className="w-4 h-4" />
              Comparar
            </button>
          )}
          <button
            onClick={() => { resetForm(); setShowForm(true) }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-dourado hover:bg-dourado/90 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nova Bioimpedância
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-border p-8 text-center">
          <Loader2 className="w-5 h-5 animate-spin inline-block mr-2 text-foreground-muted" />
          <span className="text-sm text-foreground-muted">Carregando...</span>
        </div>
      ) : records.length === 0 ? (
        <div className="bg-white rounded-xl border border-border p-8 text-center">
          <Activity className="w-10 h-10 text-foreground-muted mx-auto mb-2" />
          <p className="text-foreground-secondary text-sm">Nenhuma bioimpedância registrada</p>
        </div>
      ) : (
        <>
        {/* Gráfico de evolução */}
        {chartSeries.length >= 2 && (
          <div className="bg-white rounded-xl border border-border p-4 mb-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-dourado" />
                <h3 className="text-sm font-semibold text-foreground">Evolução</h3>
              </div>
              <select
                value={chartMetric}
                onChange={(e) => setChartMetric(e.target.value as typeof chartMetric)}
                className="text-xs border border-border rounded-lg px-2 py-1 bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-dourado/50"
              >
                <option value="peso">Peso (kg)</option>
                <option value="massa_muscular_esqueletica_kg">Massa Muscular Esq. (kg)</option>
                <option value="percentual_gordura">% Gordura</option>
                <option value="gordura_visceral">Gordura Visceral</option>
              </select>
            </div>
            <svg viewBox="0 0 400 160" className="w-full h-40">
              {[0, 0.25, 0.5, 0.75, 1].map((p) => (
                <line key={p} x1="36" y1={16 + (128 * p)} x2="392" y2={16 + (128 * p)} stroke="#d4cbc2" strokeWidth="0.5" strokeDasharray="4" />
              ))}
              <polyline
                points={chartSeries.map((d, i) => {
                  const x = 36 + (i * 356 / Math.max(chartSeries.length - 1, 1))
                  const y = 144 - ((((d.value || 0) - chartMinMax.min) / chartMinMax.range) * 128)
                  return `${x},${y}`
                }).join(' ')}
                fill="none"
                stroke="#c29863"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {chartSeries.map((d, i) => {
                const x = 36 + (i * 356 / Math.max(chartSeries.length - 1, 1))
                const y = 144 - ((((d.value || 0) - chartMinMax.min) / chartMinMax.range) * 128)
                return (
                  <g key={i}>
                    <circle cx={x} cy={y} r="4" fill="#c29863" stroke="white" strokeWidth="2" />
                    <text x={x} y={y - 8} textAnchor="middle" fontSize="9" fill="#322b29" fontWeight="600">{d.value}</text>
                    {d.momento && <text x={x} y="158" textAnchor="middle" fontSize="9" fill="#ae9b89">{d.momento}</text>}
                  </g>
                )
              })}
              {[0, 0.5, 1].map((p) => (
                <text key={p} x="32" y={20 + (128 * (1 - p))} textAnchor="end" fontSize="9" fill="#7a6e64">
                  {round1(chartMinMax.min + chartMinMax.range * p)}
                </text>
              ))}
            </svg>
          </div>
        )}

        {/* Comparador inline */}
        {showCompare && compareRecords.a && compareRecords.b && (
          <div className="bg-white rounded-xl border border-dourado/40 p-4 mb-3">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <GitCompare className="w-4 h-4 text-dourado" />
                Comparação entre coletas
              </h3>
              <button onClick={() => setShowCompare(false)} className="text-foreground-muted hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs text-foreground-muted mb-1">De:</label>
                <select value={compareA} onChange={(e) => setCompareA(e.target.value)} className="w-full px-2 py-1.5 border border-border rounded-lg text-sm bg-white">
                  {records.map(r => (
                    <option key={r.id} value={r.id}>{r.momento_avaliacao ? `${r.momento_avaliacao} · ` : ''}{formatDate(r.data)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-foreground-muted mb-1">Para:</label>
                <select value={compareB} onChange={(e) => setCompareB(e.target.value)} className="w-full px-2 py-1.5 border border-border rounded-lg text-sm bg-white">
                  {records.map(r => (
                    <option key={r.id} value={r.id}>{r.momento_avaliacao ? `${r.momento_avaliacao} · ` : ''}{formatDate(r.data)}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-background-elevated">
                    <th className="text-left px-2 py-1.5 text-foreground-secondary font-medium">Métrica</th>
                    <th className="text-right px-2 py-1.5 text-foreground-secondary font-medium">De</th>
                    <th className="text-right px-2 py-1.5 text-foreground-secondary font-medium">Para</th>
                    <th className="text-right px-2 py-1.5 text-foreground-secondary font-medium">Δ</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { key: 'peso', label: 'Peso (kg)', inverse: true },
                    { key: 'percentual_gordura', label: '% Gordura', inverse: true },
                    { key: 'massa_gordura_kg', label: 'Massa Gordura (kg)', inverse: true },
                    { key: 'massa_muscular_esqueletica_kg', label: 'Massa Muscular Esq. (kg)', inverse: false },
                    { key: 'massa_livre_gordura_kg', label: 'Massa Livre Gordura (kg)', inverse: false },
                    { key: 'imc', label: 'IMC', inverse: true },
                    { key: 'taxa_metabolica_basal', label: 'TMB (kcal)', inverse: false },
                    { key: 'gordura_visceral', label: 'Gordura Visceral', inverse: true },
                    { key: 'pontuacao_inbody', label: 'Pontuação InBody', inverse: false },
                    { key: 'relacao_cintura_quadril', label: 'Cintura/Quadril', inverse: true },
                  ].map(m => {
                    const va = compareRecords.a![m.key as keyof BioRecord] as number | null
                    const vb = compareRecords.b![m.key as keyof BioRecord] as number | null
                    if (va == null && vb == null) return null
                    const diff = va != null && vb != null ? round1(vb - va) : null
                    const isBetter = diff != null ? (m.inverse ? diff < 0 : diff > 0) : null
                    return (
                      <tr key={m.key} className="border-t border-border">
                        <td className="px-2 py-1.5 text-foreground">{m.label}</td>
                        <td className="px-2 py-1.5 text-right text-foreground-muted">{va ?? '-'}</td>
                        <td className="px-2 py-1.5 text-right text-foreground">{vb ?? '-'}</td>
                        <td className={`px-2 py-1.5 text-right font-semibold ${isBetter === true ? 'text-green-600' : isBetter === false ? 'text-red-600' : 'text-foreground-muted'}`}>
                          {diff == null ? '-' : `${diff > 0 ? '+' : ''}${diff}`}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-background-elevated">
                  <th className="text-left px-4 py-2 text-foreground-secondary font-medium">Data</th>
                  <th className="text-center px-3 py-2 text-foreground-secondary font-medium">Momento</th>
                  <th className="text-right px-3 py-2 text-foreground-secondary font-medium">Peso <span className="text-[10px] text-foreground-muted">Δ</span></th>
                  <th className="text-right px-3 py-2 text-foreground-secondary font-medium">% Gord. <span className="text-[10px] text-foreground-muted">Δ</span></th>
                  <th className="text-right px-3 py-2 text-foreground-secondary font-medium">Musc. Esq. <span className="text-[10px] text-foreground-muted">Δ</span></th>
                  <th className="text-right px-3 py-2 text-foreground-secondary font-medium">IMC</th>
                  <th className="text-right px-3 py-2 text-foreground-secondary font-medium">TMB</th>
                  <th className="text-right px-3 py-2 text-foreground-secondary font-medium">Visceral <span className="text-[10px] text-foreground-muted">Δ</span></th>
                  <th className="text-right px-3 py-2 text-foreground-secondary font-medium">Score</th>
                  <th className="text-center px-3 py-2 text-foreground-secondary font-medium">Foto</th>
                  <th className="text-center px-3 py-2 text-foreground-secondary font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {records.map(r => {
                  const d = deltas[r.id]
                  const renderDelta = (v: number | null | undefined, inverse: boolean) => {
                    if (v == null || v === 0) return null
                    const good = inverse ? v < 0 : v > 0
                    const Icon = v > 0 ? ArrowUp : v < 0 ? ArrowDown : Minus
                    return (
                      <span className={`inline-flex items-center gap-0.5 text-[10px] ${good ? 'text-green-600' : 'text-red-600'} ml-1`}>
                        <Icon className="w-2.5 h-2.5" />
                        {Math.abs(v)}
                      </span>
                    )
                  }
                  return (
                    <tr key={r.id} className="border-t border-border hover:bg-background-elevated/50">
                      <td className="px-4 py-2 text-foreground whitespace-nowrap">{formatDate(r.data)}</td>
                      <td className="px-3 py-2 text-center text-foreground-secondary text-xs">{r.momento_avaliacao || '-'}</td>
                      <td className="px-3 py-2 text-right whitespace-nowrap">{r.peso ?? '-'}{renderDelta(d?.peso, true)}</td>
                      <td className="px-3 py-2 text-right text-amber-600 whitespace-nowrap">{r.percentual_gordura ?? '-'}{renderDelta(d?.gord, true)}</td>
                      <td className="px-3 py-2 text-right text-blue-600 whitespace-nowrap">{r.massa_muscular_esqueletica_kg ?? '-'}{renderDelta(d?.musc, false)}</td>
                      <td className="px-3 py-2 text-right text-purple-600">{r.imc ?? '-'}</td>
                      <td className="px-3 py-2 text-right text-green-600">{r.taxa_metabolica_basal ?? '-'}</td>
                      <td className="px-3 py-2 text-right text-red-600 whitespace-nowrap">{r.gordura_visceral ?? '-'}{renderDelta(d?.visceral, true)}</td>
                      <td className="px-3 py-2 text-right text-dourado font-semibold">{r.pontuacao_inbody ?? '-'}</td>
                      <td className="px-3 py-2 text-center">
                        {r.foto_url ? (
                          <button onClick={() => setPreviewUrl(r.foto_url)} className="text-dourado hover:underline text-xs">ver</button>
                        ) : '-'}
                      </td>
                      <td className="px-3 py-2 text-center whitespace-nowrap">
                        <button
                          onClick={() => openEdit(r)}
                          className="inline-flex items-center justify-center w-7 h-7 rounded-lg hover:bg-dourado/10 text-dourado transition-colors"
                          aria-label="Editar"
                          title="Editar"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(r.id)}
                          className="inline-flex items-center justify-center w-7 h-7 rounded-lg hover:bg-red-50 text-red-500 transition-colors ml-1"
                          aria-label="Excluir"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
        </>
      )}

      {/* Modal de cadastro */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-foreground">{editingId ? 'Editar Bioimpedância' : 'Nova Bioimpedância'}</h3>
                <p className="text-xs text-foreground-secondary">
                  {editingId
                    ? 'Ao salvar, os pontos concedidos serão recalculados.'
                    : 'Preencha manualmente ou envie a foto do InBody para extração automática'}
                </p>
              </div>
              <button onClick={() => { setShowForm(false); resetForm() }} className="p-1.5 hover:bg-background-elevated rounded-lg">
                <X className="w-5 h-5 text-foreground-secondary" />
              </button>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              {/* OCR upload */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={analyzing}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-dourado/10 hover:bg-dourado/20 text-dourado text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {analyzing ? 'Analisando foto com IA...' : 'Enviar foto do InBody (IA preenche)'}
                </button>
                {fotoUrl && (
                  <button onClick={() => setPreviewUrl(fotoUrl)} className="inline-flex items-center gap-1.5 text-xs text-dourado hover:underline">
                    <Camera className="w-3.5 h-3.5" />
                    Ver foto enviada
                  </button>
                )}
                <span className="text-[11px] text-foreground-muted ml-auto">
                  Fonte: {fonte === 'inbody_ia' ? '🤖 InBody + IA' : fonte === 'inbody' ? 'InBody (manual)' : 'Manual'}
                </span>
              </div>

              {/* Metadados da coleta */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs text-foreground-secondary mb-1">Momento</label>
                  <select
                    value={(form.momento_avaliacao as string) || ''}
                    onChange={(e) => setForm(prev => ({ ...prev, momento_avaliacao: e.target.value }))}
                    className="w-full px-2 py-2 border border-border rounded-lg text-sm text-foreground bg-background-input focus:outline-none focus:ring-2 focus:ring-dourado/50"
                  >
                    <option value="">—</option>
                    {MOMENTOS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-foreground-secondary mb-1">Data</label>
                  <input
                    type="date"
                    value={(form.data as string) || ''}
                    onChange={(e) => setForm(prev => ({ ...prev, data: e.target.value }))}
                    className="w-full px-2 py-2 border border-border rounded-lg text-sm text-foreground bg-background-input focus:outline-none focus:ring-2 focus:ring-dourado/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-foreground-secondary mb-1">Horário</label>
                  <input
                    type="time"
                    value={(form.horario_coleta as string) || ''}
                    onChange={(e) => setForm(prev => ({ ...prev, horario_coleta: e.target.value }))}
                    className="w-full px-2 py-2 border border-border rounded-lg text-sm text-foreground bg-background-input focus:outline-none focus:ring-2 focus:ring-dourado/50"
                  />
                </div>
              </div>

              {/* Grupos de campos */}
              {CAMPOS.map(grupo => (
                <div key={grupo.group}>
                  <h4 className="text-xs font-semibold text-foreground-secondary uppercase tracking-wider mb-2">{grupo.group}</h4>
                  <div className="space-y-2">
                    {grupo.rows.map((row, i) => (
                      <div key={i} className={`grid gap-2`} style={{ gridTemplateColumns: `repeat(${row.length}, minmax(0, 1fr))` }}>
                        {row.map(f => (
                          <div key={f.key}>
                            <label className="block text-[11px] text-foreground-muted mb-0.5">{f.label}</label>
                            <input
                              type="number"
                              step={f.step || '1'}
                              value={(form[f.key] as string | number) ?? ''}
                              onChange={(e) => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                              className="w-full px-2 py-1.5 border border-border rounded-lg text-sm text-foreground bg-background-input focus:outline-none focus:ring-2 focus:ring-dourado/50"
                            />
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-border flex gap-3 flex-shrink-0">
              <button
                onClick={() => { setShowForm(false); resetForm() }}
                className="flex-1 px-4 py-2.5 rounded-lg border border-border text-foreground-secondary text-sm font-medium hover:bg-background-elevated transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-4 py-2.5 rounded-lg bg-dourado text-white text-sm font-medium hover:bg-dourado/90 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Salvar bioimpedância'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview modal */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewUrl(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt="Preview" className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg" />
          <button
            onClick={() => setPreviewUrl(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 text-white hover:bg-white/30"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  )
}
