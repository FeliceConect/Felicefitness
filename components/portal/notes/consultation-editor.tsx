'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { getSectionsForType, getConsultationLabel } from './consultation-sections'

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
}

export function ConsultationEditor({ isOpen, onClose, onSave, initialData, saving, professionalType }: ConsultationEditorProps) {
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

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!anamnese.trim() && !exames.trim() && !diagnostico.trim() && !conduta.trim()) return
    onSave({
      anamnese: anamnese.trim(),
      exames: exames.trim(),
      diagnostico: diagnostico.trim(),
      conduta: conduta.trim(),
    })
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
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-border text-foreground-secondary text-sm font-medium hover:bg-background-elevated transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 rounded-lg bg-dourado text-white text-sm font-medium hover:bg-dourado/90 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Salvando...' : `Salvar ${label}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
