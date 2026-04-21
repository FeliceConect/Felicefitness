'use client'

import { useState, useEffect, useMemo } from 'react'
import { X } from 'lucide-react'
import { getSectionsForType, getConsultationLabel } from './consultation-sections'
import { useDraftAutosave } from '@/hooks/use-draft-autosave'
import { useUnsavedWarning } from '@/hooks/use-unsaved-warning'
import { DraftRestoreBanner } from '@/components/ui/draft-restore-banner'
import { DraftStatusIndicator } from '@/components/ui/draft-status-indicator'

interface ConsultationData {
  anamnese: string
  exames: string
  diagnostico: string
  conduta: string
}

interface ConsultationEditorProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: ConsultationData) => void
  initialData?: ConsultationData
  saving?: boolean
  professionalType?: string
  /** Chave única para o rascunho local (ex: "consultation:{patientId}:{noteId|new}"). */
  draftKey?: string
}

export function ConsultationEditor({ isOpen, onClose, onSave, initialData, saving, professionalType, draftKey }: ConsultationEditorProps) {
  const [anamnese, setAnamnese] = useState('')
  const [exames, setExames] = useState('')
  const [diagnostico, setDiagnostico] = useState('')
  const [conduta, setConduta] = useState('')

  const sections = getSectionsForType(professionalType)
  const label = getConsultationLabel(professionalType)

  useEffect(() => {
    if (isOpen) {
      setAnamnese(initialData?.anamnese || '')
      setExames(initialData?.exames || '')
      setDiagnostico(initialData?.diagnostico || '')
      setConduta(initialData?.conduta || '')
    }
  }, [isOpen, initialData])

  const currentValue: ConsultationData = useMemo(
    () => ({ anamnese, exames, diagnostico, conduta }),
    [anamnese, exames, diagnostico, conduta]
  )
  const isEmpty = useMemo(
    () => (v: ConsultationData) =>
      !v.anamnese.trim() && !v.exames.trim() && !v.diagnostico.trim() && !v.conduta.trim(),
    []
  )
  const {
    status: draftStatus,
    lastSavedAt,
    pendingDraft,
    clearDraft,
    dismissPending,
  } = useDraftAutosave<ConsultationData>(
    draftKey || 'consultation:fallback',
    currentValue,
    { enabled: isOpen && !!draftKey, isEmpty }
  )
  useUnsavedWarning(isOpen && !isEmpty(currentValue))

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isEmpty(currentValue)) return
    onSave({
      anamnese: anamnese.trim(),
      exames: exames.trim(),
      diagnostico: diagnostico.trim(),
      conduta: conduta.trim(),
    })
    clearDraft()
  }

  const applyDraft = (draft: ConsultationData) => {
    setAnamnese(draft.anamnese || '')
    setExames(draft.exames || '')
    setDiagnostico(draft.diagnostico || '')
    setConduta(draft.conduta || '')
    dismissPending()
  }

  const stateMap: Record<string, { value: string; setter: (v: string) => void }> = {
    anamnese: { value: anamnese, setter: setAnamnese },
    exames: { value: exames, setter: setExames },
    diagnostico: { value: diagnostico, setter: setDiagnostico },
    conduta: { value: conduta, setter: setConduta },
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-white rounded-t-2xl z-10">
          <h3 className="text-lg font-semibold text-foreground">
            {initialData ? `Editar ${label}` : `Nova ${label}`}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-background-elevated rounded-lg">
            <X className="w-5 h-5 text-foreground-secondary" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {pendingDraft && (
            <DraftRestoreBanner
              savedAt={pendingDraft.savedAt}
              onRestore={() => applyDraft(pendingDraft.value)}
              onDiscard={clearDraft}
            />
          )}
          {sections.map((section) => {
            const state = stateMap[section.key]
            return (
              <div key={section.key}>
                <label className="block text-sm font-medium text-foreground mb-1.5">{section.label}</label>
                <textarea
                  value={state.value}
                  onChange={(e) => state.setter(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-dourado/50 resize-none"
                  placeholder={section.placeholder}
                />
              </div>
            )
          })}
          <div className="flex items-center gap-3 pt-2">
            <DraftStatusIndicator status={draftStatus} lastSavedAt={lastSavedAt} />
            <div className="ml-auto flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-lg border border-border text-foreground-secondary text-sm font-medium hover:bg-background-elevated transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2.5 rounded-lg bg-dourado text-white text-sm font-medium hover:bg-dourado/90 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Salvando...' : `Salvar ${label}`}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
