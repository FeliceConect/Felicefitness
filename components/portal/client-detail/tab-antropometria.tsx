'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Ruler, Plus, TrendingUp, Pencil, Trash2 } from 'lucide-react'

interface AntropometriaRecord {
  id: string
  data: string
  fonte: string
  circ_torax: number | null
  circ_cintura: number | null
  circ_abdome: number | null
  circ_quadril: number | null
  circ_braco_d: number | null
  circ_braco_e: number | null
  circ_braco_contraido_d: number | null
  circ_braco_contraido_e: number | null
  circ_antebraco_d: number | null
  circ_antebraco_e: number | null
  circ_coxa_d: number | null
  circ_coxa_e: number | null
  circ_coxa_medial_d: number | null
  circ_coxa_medial_e: number | null
  circ_panturrilha_d: number | null
  circ_panturrilha_e: number | null
  momento_avaliacao: string | null
  horario_coleta: string | null
}

interface TabAntropometriaProps {
  patientId: string
  canEdit: boolean // nutri, personal, admin, superadmin
}

const FIELDS = [
  { key: 'circ_torax', label: 'Tórax' },
  { key: 'circ_cintura', label: 'Cintura' },
  { key: 'circ_abdome', label: 'Abdome' },
  { key: 'circ_quadril', label: 'Quadril' },
  { key: 'circ_braco_d', label: 'Braço D (relax.)' },
  { key: 'circ_braco_e', label: 'Braço E (relax.)' },
  { key: 'circ_braco_contraido_d', label: 'Braço D (contr.)' },
  { key: 'circ_braco_contraido_e', label: 'Braço E (contr.)' },
  { key: 'circ_antebraco_d', label: 'Antebraço D' },
  { key: 'circ_antebraco_e', label: 'Antebraço E' },
  { key: 'circ_coxa_d', label: 'Coxa prox. D' },
  { key: 'circ_coxa_e', label: 'Coxa prox. E' },
  { key: 'circ_coxa_medial_d', label: 'Coxa med. D' },
  { key: 'circ_coxa_medial_e', label: 'Coxa med. E' },
  { key: 'circ_panturrilha_d', label: 'Panturrilha D' },
  { key: 'circ_panturrilha_e', label: 'Panturrilha E' },
] as const

const MOMENTOS = ['M0', 'M1', 'M2', 'M3', 'M4', 'M5', 'M6'] as const

export function TabAntropometria({ patientId, canEdit }: TabAntropometriaProps) {
  const [records, setRecords] = useState<AntropometriaRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [selectedMetric, setSelectedMetric] = useState<string>('circ_abdome')
  const [editingId, setEditingId] = useState<string | null>(null)

  const fetchRecords = () => {
    fetch(`/api/professional/clients/${patientId}/antropometria`)
      .then(r => r.json())
      .then(data => {
        if (data.success) setRecords(data.records || [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchRecords()
  }, [patientId])

  const openEdit = (record: AntropometriaRecord) => {
    const filled: Record<string, string> = {}
    FIELDS.forEach(f => {
      const v = record[f.key as keyof AntropometriaRecord]
      if (v != null) filled[f.key] = String(v)
    })
    if (record.momento_avaliacao) filled.momento_avaliacao = record.momento_avaliacao
    if (record.horario_coleta) filled.horario_coleta = record.horario_coleta
    if (record.data) filled.data = record.data
    setFormData(filled)
    setEditingId(record.id)
    setShowForm(true)
  }

  const handleDelete = async (recordId: string) => {
    if (!confirm('Remover estas medidas?')) return
    try {
      const res = await fetch(`/api/professional/clients/${patientId}/antropometria/${recordId}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Medidas removidas')
        fetchRecords()
      } else {
        toast.error(data.error || 'Erro ao remover')
      }
    } catch (err) {
      console.error('Erro delete antropometria:', err)
      toast.error('Erro ao remover')
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const body: Record<string, number | string | null> = {}
      FIELDS.forEach(f => {
        const val = formData[f.key]
        body[f.key] = val ? parseFloat(val) : null
      })
      if (formData.momento_avaliacao) body.momento_avaliacao = formData.momento_avaliacao
      if (formData.horario_coleta) body.horario_coleta = formData.horario_coleta
      if (formData.data) body.data = formData.data

      const url = editingId
        ? `/api/professional/clients/${patientId}/antropometria/${editingId}`
        : `/api/professional/clients/${patientId}/antropometria`
      const method = editingId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(editingId ? 'Medidas atualizadas' : 'Medidas registradas')
        setShowForm(false)
        setFormData({})
        setEditingId(null)
        fetchRecords()
      } else {
        toast.error(data.error || 'Erro ao salvar')
      }
    } catch (error) {
      console.error('Erro ao salvar medidas:', error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="bg-white border border-border rounded-xl p-6 h-40 animate-pulse" />
      </div>
    )
  }

  const latest = records[0]
  const formatDate = (d: string) => new Date(d).toLocaleDateString('pt-BR')

  // Chart data
  const getMetricValue = (r: AntropometriaRecord, key: string): number | null => {
    return r[key as keyof AntropometriaRecord] as number | null
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
      {/* Actions */}
      {canEdit && (
        <div className="flex justify-end">
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-dourado hover:bg-dourado/90 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Registrar Medidas
          </button>
        </div>
      )}

      {/* Latest */}
      {latest ? (
        <div className="bg-white border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Ruler className="w-5 h-5 text-dourado" />
            <h3 className="text-lg font-semibold text-foreground">Últimas Medidas</h3>
            <span className="text-sm text-foreground-muted">({formatDate(latest.data)})</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {FIELDS.map(f => {
              const val = getMetricValue(latest, f.key)
              return (
                <div key={f.key} className="text-center p-3 bg-background-elevated rounded-lg">
                  <p className="text-lg font-bold text-foreground">{val != null ? val : '-'}</p>
                  <p className="text-xs text-foreground-muted">{f.label} (cm)</p>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white border border-border rounded-xl p-8 text-center">
          <Ruler className="w-10 h-10 text-foreground-muted mx-auto mb-2" />
          <p className="text-foreground-secondary">Nenhuma medida antropométrica registrada</p>
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
              {FIELDS.map(f => (
                <option key={f.key} value={f.key}>{f.label}</option>
              ))}
            </select>
          </div>

          {chartData.length >= 2 ? (
            <svg viewBox="0 0 400 200" className="w-full h-48">
              {[0, 0.25, 0.5, 0.75, 1].map((p) => (
                <line
                  key={p}
                  x1="40" y1={20 + (160 * p)} x2="390" y2={20 + (160 * p)}
                  stroke="#d4cbc2" strokeWidth="0.5" strokeDasharray="4"
                />
              ))}
              <polyline
                points={chartData.map((d, i) => {
                  const x = 40 + (i * 350 / Math.max(chartData.length - 1, 1))
                  const y = 180 - ((((d.value || 0) - minVal) / range) * 160)
                  return `${x},${y}`
                }).join(' ')}
                fill="none" stroke="#c29863" strokeWidth="2.5"
                strokeLinecap="round" strokeLinejoin="round"
              />
              {chartData.map((d, i) => {
                const x = 40 + (i * 350 / Math.max(chartData.length - 1, 1))
                const y = 180 - ((((d.value || 0) - minVal) / range) * 160)
                return <circle key={i} cx={x} cy={y} r="4" fill="#c29863" stroke="white" strokeWidth="2" />
              })}
              {[0, 0.5, 1].map((p) => (
                <text key={p} x="35" y={24 + (160 * (1 - p))} textAnchor="end" fontSize="10" fill="#7a6e64">
                  {(minVal + range * p).toFixed(1)}
                </text>
              ))}
            </svg>
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
                  <th className="text-left px-3 py-2 text-foreground-secondary font-medium">Data</th>
                  <th className="text-center px-2 py-2 text-foreground-secondary font-medium">Momento</th>
                  {FIELDS.map(f => (
                    <th key={f.key} className="text-right px-3 py-2 text-foreground-secondary font-medium whitespace-nowrap">{f.label}</th>
                  ))}
                  {canEdit && <th className="text-center px-3 py-2 text-foreground-secondary font-medium">Ações</th>}
                </tr>
              </thead>
              <tbody>
                {records.map(r => (
                  <tr key={r.id} className="border-t border-border hover:bg-background-elevated/50">
                    <td className="px-3 py-2 text-foreground whitespace-nowrap">{formatDate(r.data)}</td>
                    <td className="px-2 py-2 text-center text-foreground-secondary text-xs">{r.momento_avaliacao || '-'}</td>
                    {FIELDS.map(f => {
                      const val = getMetricValue(r, f.key)
                      return <td key={f.key} className="px-3 py-2 text-right text-foreground">{val ?? '-'}</td>
                    })}
                    {canEdit && (
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
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">{editingId ? 'Editar Medidas Antropométricas' : 'Registrar Medidas Antropométricas'}</h3>
              <p className="text-sm text-foreground-secondary">Valores em centímetros (cm)</p>
            </div>
            <div className="p-4 space-y-3">
              {/* Metadados da coleta (momento + data + horário) */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs text-foreground-secondary mb-1">Momento</label>
                  <select
                    value={formData.momento_avaliacao || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, momento_avaliacao: e.target.value }))}
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
                    value={formData.data || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, data: e.target.value }))}
                    className="w-full px-2 py-2 border border-border rounded-lg text-sm text-foreground bg-background-input focus:outline-none focus:ring-2 focus:ring-dourado/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-foreground-secondary mb-1">Horário</label>
                  <input
                    type="time"
                    value={formData.horario_coleta || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, horario_coleta: e.target.value }))}
                    className="w-full px-2 py-2 border border-border rounded-lg text-sm text-foreground bg-background-input focus:outline-none focus:ring-2 focus:ring-dourado/50"
                  />
                </div>
              </div>
              <div className="h-px bg-border my-1" />
              {FIELDS.map(f => (
                <div key={f.key} className="flex items-center gap-3">
                  <label className="w-32 text-sm text-foreground-secondary">{f.label}</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData[f.key] || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, [f.key]: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-border rounded-lg text-sm text-foreground bg-background-input focus:outline-none focus:ring-2 focus:ring-dourado/50"
                    placeholder="cm"
                  />
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-border flex gap-3">
              <button
                onClick={() => { setShowForm(false); setFormData({}); setEditingId(null) }}
                className="flex-1 px-4 py-2.5 rounded-lg border border-border text-foreground-secondary text-sm font-medium hover:bg-background-elevated transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-4 py-2.5 rounded-lg bg-dourado text-white text-sm font-medium hover:bg-dourado/90 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
