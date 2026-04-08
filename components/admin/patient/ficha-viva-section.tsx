"use client"

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { ClipboardList, ChevronDown, ChevronUp, Save, Heart, Activity, AlertTriangle, Target } from 'lucide-react'

interface MedicalRecord {
  id: string
  user_id: string
  objectives: Record<string, unknown>
  health_history: Record<string, unknown>
  lifestyle: Record<string, unknown>
  difficulties: Record<string, unknown>
}

interface FichaVivaSectionProps {
  userId: string
}

type JsonObj = Record<string, string>

function TextArea({ label, value, onChange, rows = 3 }: {
  label: string; value: string; onChange: (v: string) => void; rows?: number
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-foreground-secondary mb-1">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full px-3 py-2 bg-background-elevated border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-dourado/50 resize-y"
      />
    </div>
  )
}

function SubBlock({ title, icon: Icon, children }: {
  title: string; icon: React.ElementType; children: React.ReactNode
}) {
  return (
    <div className="bg-background-elevated/50 rounded-lg p-4 border border-border/50">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-dourado" />
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

export function FichaVivaSection({ userId }: FichaVivaSectionProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [record, setRecord] = useState<MedicalRecord | null>(null)

  const [objectives, setObjectives] = useState<JsonObj>({})
  const [health, setHealth] = useState<JsonObj>({})
  const [lifestyle, setLifestyle] = useState<JsonObj>({})
  const [difficulties, setDifficulties] = useState<JsonObj>({})

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const res = await fetch(`/api/admin/medical-records/${userId}`)
        const json = await res.json()
        if (json.success && json.record) {
          setRecord(json.record)
          setObjectives((json.record.objectives || {}) as JsonObj)
          setHealth((json.record.health_history || {}) as JsonObj)
          setLifestyle((json.record.lifestyle || {}) as JsonObj)
          setDifficulties((json.record.difficulties || {}) as JsonObj)
        }
      } catch (err) {
        console.error('Erro ao carregar ficha:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [userId])

  const setField = (setter: React.Dispatch<React.SetStateAction<JsonObj>>) =>
    (key: string) => (v: string) => setter(prev => ({ ...prev, [key]: v }))

  const setObj = setField(setObjectives)
  const setHlt = setField(setHealth)
  const setLif = setField(setLifestyle)
  const setDif = setField(setDifficulties)

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/medical-records/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          objectives,
          health_history: health,
          lifestyle,
          difficulties,
        }),
      })
      const json = await res.json()
      if (json.success) {
        setRecord(json.record)
        toast.success('Ficha salva com sucesso')
        setOpen(false)
      } else {
        toast.error(json.error || 'Erro ao salvar ficha')
      }
    } catch (err) {
      console.error('Erro ao salvar ficha:', err)
      toast.error('Erro ao salvar ficha')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-border overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-background-elevated transition-colors"
      >
        <div className="flex items-center gap-3">
          <ClipboardList className="w-5 h-5 text-dourado" />
          <h2 className="text-lg font-semibold text-foreground">Ficha Viva do Paciente</h2>
          <span className="text-xs text-foreground-muted">(só superadmin)</span>
        </div>
        {open ? <ChevronUp className="w-5 h-5 text-foreground-secondary" /> : <ChevronDown className="w-5 h-5 text-foreground-secondary" />}
      </button>

      {open && (
        <div className="px-6 pb-6 space-y-4">
          {loading ? (
            <div className="py-8 text-center text-foreground-muted text-sm">Carregando ficha...</div>
          ) : !record ? (
            <div className="py-8 text-center text-red-400 text-sm">Erro ao carregar</div>
          ) : (
            <>
              <SubBlock title="Objetivos & Motivação" icon={Target}>
                <TextArea label="Objetivo principal ao entrar no Wellness" value={objectives.main || ''} onChange={setObj('main')} />
                <TextArea label="Objetivos secundários" value={objectives.secondary || ''} onChange={setObj('secondary')} />
                <TextArea label="O que já tentou antes e não funcionou" value={objectives.previous_attempts || ''} onChange={setObj('previous_attempts')} />
                <TextArea label="Expectativa de resultado" value={objectives.expectation || ''} onChange={setObj('expectation')} rows={2} />
                <TextArea label="Nível de motivação (1-10) e observações" value={objectives.motivation || ''} onChange={setObj('motivation')} rows={2} />
              </SubBlock>

              <SubBlock title="Histórico de Saúde" icon={Heart}>
                <TextArea label="Problemas de saúde atuais" value={health.current_conditions || ''} onChange={setHlt('current_conditions')} />
                <TextArea label="Cirurgias prévias" value={health.surgeries || ''} onChange={setHlt('surgeries')} />
                <TextArea label="Medicamentos em uso" value={health.medications || ''} onChange={setHlt('medications')} />
                <TextArea label="Alergias / intolerâncias" value={health.allergies || ''} onChange={setHlt('allergies')} />
                <TextArea label="Histórico familiar (diabetes, hipertensão, etc.)" value={health.family_history || ''} onChange={setHlt('family_history')} />
                <TextArea label="Histórico ginecológico / hormonal" value={health.hormonal || ''} onChange={setHlt('hormonal')} />
              </SubBlock>

              <SubBlock title="Rotina & Estilo de Vida" icon={Activity}>
                <TextArea label="Sono (horas, qualidade, dificuldades)" value={lifestyle.sleep || ''} onChange={setLif('sleep')} />
                <TextArea label="Hidratação (litros/dia estimados)" value={lifestyle.hydration || ''} onChange={setLif('hydration')} rows={2} />
                <TextArea label="Alimentação (padrão atual, compulsões, beliscos)" value={lifestyle.food || ''} onChange={setLif('food')} />
                <TextArea label="Exercícios (frequência, tipos, histórico)" value={lifestyle.exercise || ''} onChange={setLif('exercise')} />
                <TextArea label="Trabalho (sedentário/ativo, carga horária, estresse)" value={lifestyle.work || ''} onChange={setLif('work')} />
                <TextArea label="Álcool, tabaco, outros" value={lifestyle.substances || ''} onChange={setLif('substances')} rows={2} />
                <TextArea label="Lazer e bem-estar (hobbies, tempo pra si)" value={lifestyle.leisure || ''} onChange={setLif('leisure')} rows={2} />
              </SubBlock>

              <SubBlock title="Dificuldades & Barreiras" icon={AlertTriangle}>
                <TextArea label="Maiores dificuldades percebidas pelo paciente" value={difficulties.main || ''} onChange={setDif('main')} />
                <TextArea label="Gatilhos emocionais (ansiedade → comida?)" value={difficulties.triggers || ''} onChange={setDif('triggers')} />
                <TextArea label="Rede de apoio familiar" value={difficulties.support || ''} onChange={setDif('support')} rows={2} />
              </SubBlock>

              <div className="flex justify-end">
                <button
                  onClick={save}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-dourado hover:bg-dourado/90 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Salvando...' : 'Salvar ficha'}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
