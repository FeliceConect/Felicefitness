"use client"

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Calendar, UserCog, Plus, Save } from 'lucide-react'

interface MedicalRecord {
  id: string
  user_id: string
  program_name: string
  program_start_date: string | null
  program_duration_months: number
  assigned_super_admin_id: string | null
}

interface SuperAdmin {
  id: string
  name: string
}

interface ProgramHeaderProps {
  userId: string
  onOpenNewConsultation: () => void
  onRecordLoaded?: (record: MedicalRecord) => void
}

const PROGRAM_LABELS: Record<string, string> = {
  felice_wellness: 'Felice Wellness',
  wellness_performance: 'Wellness Performance',
  felicita_wellness: 'Felicita Wellness',
}

function calcCurrentMonth(startDate: string | null): number | null {
  if (!startDate) return null
  const start = new Date(startDate)
  const now = new Date()
  if (isNaN(start.getTime())) return null
  let diff = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth())
  if (now.getDate() < start.getDate()) diff -= 1
  return diff < 0 ? 1 : diff + 1
}

export function ProgramHeader({ userId, onOpenNewConsultation, onRecordLoaded }: ProgramHeaderProps) {
  const [record, setRecord] = useState<MedicalRecord | null>(null)
  const [superAdmins, setSuperAdmins] = useState<SuperAdmin[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)

  // edit form state
  const [programName, setProgramName] = useState('felice_wellness')
  const [startDate, setStartDate] = useState('')
  const [duration, setDuration] = useState(6)
  const [assignedId, setAssignedId] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [recRes, admRes] = await Promise.all([
          fetch(`/api/admin/medical-records/${userId}`),
          fetch(`/api/admin/super-admins`),
        ])
        const recJson = await recRes.json()
        const admJson = await admRes.json()
        if (recJson.success && recJson.record) {
          setRecord(recJson.record)
          setProgramName(recJson.record.program_name || 'felice_wellness')
          setStartDate(recJson.record.program_start_date || '')
          setDuration(recJson.record.program_duration_months || 6)
          setAssignedId(recJson.record.assigned_super_admin_id || '')
          onRecordLoaded?.(recJson.record)
        }
        if (admJson.success) setSuperAdmins(admJson.superAdmins || [])
      } catch (err) {
        console.error('Erro ao carregar programa:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/medical-records/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          program_name: programName,
          program_start_date: startDate || null,
          program_duration_months: duration,
          assigned_super_admin_id: assignedId || null,
        }),
      })
      const json = await res.json()
      if (json.success && json.record) {
        setRecord(json.record)
        setEditing(false)
        onRecordLoaded?.(json.record)
        toast.success('Programa atualizado')
      } else {
        toast.error(json.error || 'Erro ao salvar programa')
      }
    } catch (err) {
      console.error('Erro ao salvar programa:', err)
      toast.error('Erro ao salvar programa')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-border p-6 animate-pulse">
        <div className="h-6 w-48 bg-background-elevated rounded mb-2" />
        <div className="h-4 w-32 bg-background-elevated rounded" />
      </div>
    )
  }

  const currentMonth = calcCurrentMonth(record?.program_start_date || null)
  const programLabel = PROGRAM_LABELS[record?.program_name || 'felice_wellness']
  const assignedName = superAdmins.find(s => s.id === record?.assigned_super_admin_id)?.name

  return (
    <div className="bg-gradient-to-br from-dourado/10 via-white to-white rounded-xl border border-dourado/30 p-6">
      <div className="flex flex-col lg:flex-row lg:items-center gap-4 justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-5 h-5 text-dourado" />
            <h2 className="text-xl font-bold text-foreground">{programLabel}</h2>
            {currentMonth !== null && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-dourado/20 text-dourado border border-dourado/30">
                Mês {currentMonth} de {record?.program_duration_months || 6}
              </span>
            )}
          </div>
          {record?.program_start_date && (
            <p className="text-sm text-foreground-secondary">
              Início: {new Date(record.program_start_date).toLocaleDateString('pt-BR')}
            </p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <UserCog className="w-4 h-4 text-foreground-muted" />
            <span className="text-sm text-foreground-muted">
              Responsável: <strong className="text-foreground">{assignedName || 'Não atribuído'}</strong>
            </span>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setEditing(!editing)}
            className="px-4 py-2 bg-background-elevated hover:bg-border text-foreground rounded-lg text-sm font-medium transition-colors"
          >
            {editing ? 'Cancelar' : 'Editar programa'}
          </button>
          <button
            onClick={onOpenNewConsultation}
            className="inline-flex items-center gap-2 px-4 py-2 bg-dourado hover:bg-dourado/90 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nova Consulta
          </button>
        </div>
      </div>

      {editing && (
        <div className="mt-5 pt-5 border-t border-dourado/20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-foreground-secondary mb-1">Programa</label>
            <select
              value={programName}
              onChange={(e) => setProgramName(e.target.value)}
              className="w-full px-3 py-2 bg-background-elevated border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-dourado/50"
            >
              <option value="felice_wellness">Felice Wellness</option>
              <option value="wellness_performance">Wellness Performance</option>
              <option value="felicita_wellness">Felicita Wellness</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground-secondary mb-1">Início</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 bg-background-elevated border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-dourado/50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground-secondary mb-1">Duração (meses)</label>
            <input
              type="number"
              min={1}
              max={24}
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value) || 6)}
              className="w-full px-3 py-2 bg-background-elevated border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-dourado/50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground-secondary mb-1">Responsável</label>
            <select
              value={assignedId}
              onChange={(e) => setAssignedId(e.target.value)}
              className="w-full px-3 py-2 bg-background-elevated border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-dourado/50"
            >
              <option value="">Não atribuído</option>
              {superAdmins.map(sa => (
                <option key={sa.id} value={sa.id}>{sa.name}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
            <button
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 bg-dourado hover:bg-dourado/90 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
