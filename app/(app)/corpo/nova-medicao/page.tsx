"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Scale, Camera, Smartphone, Check, ChevronDown, ChevronUp } from 'lucide-react'
import { format } from 'date-fns'
import { useBodyComposition } from '@/hooks/use-body-composition'
import type { NewMeasurementInput } from '@/lib/body/types'
import { cn } from '@/lib/utils'

type FonteType = 'inbody' | 'manual' | 'balanca_smart'

// Only numeric fields that can be used in input forms
type NumericFormField = 'peso' | 'altura' | 'agua_total' | 'proteina' | 'minerais' |
  'gordura_corporal' | 'massa_muscular_esqueletica' | 'imc' | 'percentual_gordura' |
  'taxa_metabolica_basal' | 'nivel_gordura_visceral' | 'massa_magra' | 'massa_muscular'

interface FormField {
  key: NumericFormField
  label: string
  unidade: string
  placeholder: string
  required?: boolean
  step?: string
  min?: number
  max?: number
}

const basicFields: FormField[] = [
  { key: 'peso', label: 'Peso', unidade: 'kg', placeholder: '82.5', required: true, step: '0.1', min: 30, max: 200 },
  { key: 'altura', label: 'Altura', unidade: 'cm', placeholder: '180', required: true, min: 100, max: 250 }
]

const inbodyFields: FormField[] = [
  { key: 'agua_total', label: 'Água Corporal Total', unidade: 'L', placeholder: '49.5', step: '0.1' },
  { key: 'proteina', label: 'Proteína', unidade: 'kg', placeholder: '13.8', step: '0.1' },
  { key: 'minerais', label: 'Minerais', unidade: 'kg', placeholder: '4.6', step: '0.1' },
  { key: 'gordura_corporal', label: 'Massa de Gordura', unidade: 'kg', placeholder: '14.2', step: '0.1' },
  { key: 'massa_muscular_esqueletica', label: 'Massa Muscular Esquelética', unidade: 'kg', placeholder: '38.5', step: '0.1' },
  { key: 'imc', label: 'IMC', unidade: '', placeholder: '25.3', step: '0.1' },
  { key: 'percentual_gordura', label: 'Percentual de Gordura', unidade: '%', placeholder: '17.3', step: '0.1' },
  { key: 'taxa_metabolica_basal', label: 'Taxa Metabólica Basal', unidade: 'kcal', placeholder: '1948', min: 1000, max: 3000 },
  { key: 'nivel_gordura_visceral', label: 'Nível de Gordura Visceral', unidade: '', placeholder: '7', min: 1, max: 20 },
  { key: 'massa_magra', label: 'Massa Magra Total', unidade: 'kg', placeholder: '67.9', step: '0.1' },
  { key: 'massa_muscular', label: 'Massa Muscular Total', unidade: 'kg', placeholder: '64.5', step: '0.1' }
]

export default function NovaMedicaoPage() {
  const router = useRouter()
  const { addMeasurement } = useBodyComposition()

  const [fonte, setFonte] = useState<FonteType>('inbody')
  const [data, setData] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [formData, setFormData] = useState<Record<NumericFormField, number | undefined>>({} as Record<NumericFormField, number | undefined>)
  const [notas, setNotas] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleFieldChange = (key: NumericFormField, value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value)
    setFormData(prev => ({ ...prev, [key]: numValue }))
    // Clear error when user types
    if (errors[key]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[key]
        return newErrors
      })
    }
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.peso) {
      newErrors.peso = 'Peso é obrigatório'
    }
    if (!formData.altura) {
      newErrors.altura = 'Altura é obrigatória'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return

    setIsSubmitting(true)

    try {
      if (!formData.peso || !formData.altura) {
        return
      }

      const input: NewMeasurementInput = {
        data,
        peso: formData.peso,
        altura: formData.altura,
        fonte,
        notas: notas || undefined,
        agua_total: formData.agua_total,
        proteina: formData.proteina,
        minerais: formData.minerais,
        gordura_corporal: formData.gordura_corporal,
        massa_muscular_esqueletica: formData.massa_muscular_esqueletica,
        imc: formData.imc,
        percentual_gordura: formData.percentual_gordura,
        taxa_metabolica_basal: formData.taxa_metabolica_basal,
        nivel_gordura_visceral: formData.nivel_gordura_visceral,
        massa_magra: formData.massa_magra,
        massa_muscular: formData.massa_muscular
      }

      const success = await addMeasurement(input)

      if (success) {
        router.push('/corpo')
      }
    } catch (error) {
      console.error('Erro ao salvar medição:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const fonteOptions = [
    { value: 'inbody' as FonteType, label: 'InBody', icon: Camera, desc: 'Dados completos do InBody' },
    { value: 'manual' as FonteType, label: 'Manual', icon: Scale, desc: 'Inserir dados manualmente' },
    { value: 'balanca_smart' as FonteType, label: 'Balança Smart', icon: Smartphone, desc: 'Sincronizar com balança' }
  ]

  return (
    <div className="min-h-screen bg-[#0A0A0F] pb-24">
      {/* Header */}
      <div className="px-4 pt-12 pb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Voltar</span>
        </button>

        <h1 className="text-2xl font-bold text-white">Nova Medição</h1>
        <p className="text-slate-400 text-sm">Registre sua composição corporal</p>
      </div>

      {/* Fonte selector */}
      <div className="px-4 mb-6">
        <p className="text-sm text-slate-400 mb-3">Fonte dos dados</p>
        <div className="grid grid-cols-3 gap-2">
          {fonteOptions.map(option => {
            const Icon = option.icon
            const isSelected = fonte === option.value
            return (
              <button
                key={option.value}
                onClick={() => setFonte(option.value)}
                className={cn(
                  'p-3 rounded-xl border transition-all text-center',
                  isSelected
                    ? 'border-violet-500 bg-violet-500/10'
                    : 'border-[#2E2E3E] bg-[#14141F] hover:border-violet-500/30'
                )}
              >
                <Icon className={cn(
                  'w-5 h-5 mx-auto mb-1',
                  isSelected ? 'text-violet-400' : 'text-slate-400'
                )} />
                <p className={cn(
                  'text-xs font-medium',
                  isSelected ? 'text-violet-400' : 'text-slate-300'
                )}>
                  {option.label}
                </p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Date */}
      <div className="px-4 mb-6">
        <label className="text-sm text-slate-400 mb-2 block">Data da medição</label>
        <input
          type="date"
          value={data}
          onChange={(e) => setData(e.target.value)}
          max={format(new Date(), 'yyyy-MM-dd')}
          className="w-full bg-[#14141F] border border-[#2E2E3E] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500"
        />
      </div>

      {/* Basic fields */}
      <div className="px-4 mb-6">
        <p className="text-sm text-slate-400 mb-3">Dados básicos</p>
        <div className="bg-[#14141F] border border-[#2E2E3E] rounded-xl p-4 space-y-4">
          {basicFields.map(field => (
            <div key={field.key}>
              <label className="text-sm text-slate-400 mb-1 block">
                {field.label} {field.required && <span className="text-red-400">*</span>}
              </label>
              <div className="relative">
                <input
                  type="number"
                  step={field.step || '1'}
                  min={field.min}
                  max={field.max}
                  placeholder={field.placeholder}
                  value={formData[field.key] ?? ''}
                  onChange={(e) => handleFieldChange(field.key, e.target.value)}
                  className={cn(
                    'w-full bg-[#0A0A0F] border rounded-xl px-4 py-3 text-white focus:outline-none',
                    errors[field.key] ? 'border-red-500' : 'border-[#2E2E3E] focus:border-violet-500'
                  )}
                />
                {field.unidade && (
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">
                    {field.unidade}
                  </span>
                )}
              </div>
              {errors[field.key] && (
                <p className="text-red-400 text-xs mt-1">{errors[field.key]}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* InBody fields (expandable) */}
      {fonte === 'inbody' && (
        <div className="px-4 mb-6">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center justify-between w-full text-sm text-slate-400 mb-3"
          >
            <span>Dados do InBody (opcional)</span>
            {showAdvanced ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {showAdvanced && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-[#14141F] border border-[#2E2E3E] rounded-xl p-4 space-y-4"
            >
              {inbodyFields.map(field => (
                <div key={field.key}>
                  <label className="text-sm text-slate-400 mb-1 block">
                    {field.label}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step={field.step || '1'}
                      min={field.min}
                      max={field.max}
                      placeholder={field.placeholder}
                      value={formData[field.key] ?? ''}
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                      className="w-full bg-[#0A0A0F] border border-[#2E2E3E] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500"
                    />
                    {field.unidade && (
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">
                        {field.unidade}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </div>
      )}

      {/* Notes */}
      <div className="px-4 mb-6">
        <label className="text-sm text-slate-400 mb-2 block">Observações (opcional)</label>
        <textarea
          placeholder="Ex: Medição após treino, em jejum..."
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          rows={3}
          className="w-full bg-[#14141F] border border-[#2E2E3E] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 resize-none"
        />
      </div>

      {/* Submit button */}
      <div className="px-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSubmit}
          disabled={isSubmitting}
          className={cn(
            'w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all',
            isSubmitting
              ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-violet-600 to-cyan-500 text-white'
          )}
        >
          {isSubmitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Check className="w-5 h-5" />
              Salvar Medição
            </>
          )}
        </motion.button>
      </div>
    </div>
  )
}
