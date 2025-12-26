"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Scale, Camera, Check, ChevronDown, ChevronUp, Scan } from 'lucide-react'
import { format } from 'date-fns'
import { useBodyComposition } from '@/hooks/use-body-composition'
import { InBodyScanner } from '@/components/corpo/inbody-scanner'
import type { NewMeasurementInput } from '@/lib/body/types'
import { cn } from '@/lib/utils'

type FonteType = 'inbody' | 'manual'

// Only numeric fields that can be used in input forms
type NumericFormField = 'peso' | 'altura' | 'agua_total' | 'proteina' | 'minerais' |
  'gordura_corporal' | 'massa_muscular_esqueletica' | 'imc' | 'percentual_gordura' |
  'taxa_metabolica_basal' | 'nivel_gordura_visceral' | 'massa_magra' | 'massa_muscular' |
  'pontuacao_inbody' | 'peso_ideal' | 'controle_peso' | 'controle_gordura' | 'controle_muscular' |
  'massa_magra_braco_direito' | 'massa_magra_braco_esquerdo' | 'massa_magra_tronco' |
  'massa_magra_perna_direita' | 'massa_magra_perna_esquerda' |
  'gordura_braco_direito' | 'gordura_braco_esquerdo' | 'gordura_tronco' |
  'gordura_perna_direita' | 'gordura_perna_esquerda'

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

const composicaoFields: FormField[] = [
  { key: 'agua_total', label: 'Água Corporal Total', unidade: 'L', placeholder: '49.5', step: '0.1' },
  { key: 'proteina', label: 'Proteína', unidade: 'kg', placeholder: '13.8', step: '0.1' },
  { key: 'minerais', label: 'Minerais', unidade: 'kg', placeholder: '4.6', step: '0.1' },
  { key: 'gordura_corporal', label: 'Massa de Gordura', unidade: 'kg', placeholder: '14.2', step: '0.1' },
  { key: 'massa_muscular_esqueletica', label: 'Massa Muscular Esquelética', unidade: 'kg', placeholder: '38.5', step: '0.1' },
  { key: 'massa_magra', label: 'Massa Livre de Gordura', unidade: 'kg', placeholder: '67.9', step: '0.1' },
]

const indicesFields: FormField[] = [
  { key: 'imc', label: 'IMC', unidade: '', placeholder: '25.3', step: '0.1' },
  { key: 'percentual_gordura', label: 'Percentual de Gordura', unidade: '%', placeholder: '17.3', step: '0.1' },
  { key: 'taxa_metabolica_basal', label: 'Taxa Metabólica Basal', unidade: 'kcal', placeholder: '1948', min: 1000, max: 3000 },
  { key: 'nivel_gordura_visceral', label: 'Gordura Visceral', unidade: '', placeholder: '7', min: 1, max: 20 },
  { key: 'pontuacao_inbody', label: 'Pontuação InBody', unidade: '', placeholder: '80', min: 0, max: 100 },
]

const controleFields: FormField[] = [
  { key: 'peso_ideal', label: 'Peso Ideal', unidade: 'kg', placeholder: '78.0', step: '0.1' },
  { key: 'controle_peso', label: 'Controle de Peso', unidade: 'kg', placeholder: '-2.5', step: '0.1' },
  { key: 'controle_gordura', label: 'Controle de Gordura', unidade: 'kg', placeholder: '-4.0', step: '0.1' },
  { key: 'controle_muscular', label: 'Controle Muscular', unidade: 'kg', placeholder: '+1.5', step: '0.1' },
]

const segmentalMagraFields: FormField[] = [
  { key: 'massa_magra_braco_direito', label: 'Braço Direito', unidade: 'kg', placeholder: '3.5', step: '0.1' },
  { key: 'massa_magra_braco_esquerdo', label: 'Braço Esquerdo', unidade: 'kg', placeholder: '3.4', step: '0.1' },
  { key: 'massa_magra_tronco', label: 'Tronco', unidade: 'kg', placeholder: '28.5', step: '0.1' },
  { key: 'massa_magra_perna_direita', label: 'Perna Direita', unidade: 'kg', placeholder: '10.2', step: '0.1' },
  { key: 'massa_magra_perna_esquerda', label: 'Perna Esquerda', unidade: 'kg', placeholder: '10.1', step: '0.1' },
]

// Medidas circunferenciais (manual)
type CircumferenceField = 'circ_torax' | 'circ_abdome' | 'circ_braco_d' | 'circ_braco_e' |
  'circ_antebraco_d' | 'circ_antebraco_e' | 'circ_coxa_d' | 'circ_coxa_e' |
  'circ_panturrilha_d' | 'circ_panturrilha_e'

interface CircumferenceFormField {
  key: CircumferenceField
  label: string
  placeholder: string
}

const circumferenceFields: CircumferenceFormField[] = [
  { key: 'circ_torax', label: 'Tórax', placeholder: '100' },
  { key: 'circ_abdome', label: 'Abdome', placeholder: '85' },
  { key: 'circ_braco_d', label: 'Braço Direito', placeholder: '35' },
  { key: 'circ_braco_e', label: 'Braço Esquerdo', placeholder: '34.5' },
  { key: 'circ_antebraco_d', label: 'Antebraço Direito', placeholder: '28' },
  { key: 'circ_antebraco_e', label: 'Antebraço Esquerdo', placeholder: '27.5' },
  { key: 'circ_coxa_d', label: 'Coxa Direita', placeholder: '58' },
  { key: 'circ_coxa_e', label: 'Coxa Esquerda', placeholder: '57.5' },
  { key: 'circ_panturrilha_d', label: 'Panturrilha Direita', placeholder: '38' },
  { key: 'circ_panturrilha_e', label: 'Panturrilha Esquerda', placeholder: '37.5' },
]

export default function NovaMedicaoPage() {
  const router = useRouter()
  const { addMeasurement } = useBodyComposition()

  const [fonte, setFonte] = useState<FonteType>('inbody')
  const [data, setData] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [formData, setFormData] = useState<Record<NumericFormField, number | undefined>>({} as Record<NumericFormField, number | undefined>)
  const [notas, setNotas] = useState('')
  const [showComposicao, setShowComposicao] = useState(false)
  const [showIndices, setShowIndices] = useState(false)
  const [showControle, setShowControle] = useState(false)
  const [showSegmental, setShowSegmental] = useState(false)
  const [showCircumference, setShowCircumference] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showScanner, setShowScanner] = useState(false)
  const [inbodyImageUrl, setInbodyImageUrl] = useState<string | null>(null)
  const [circumferenceData, setCircumferenceData] = useState<Record<CircumferenceField, number | undefined>>({} as Record<CircumferenceField, number | undefined>)

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

  const handleCircumferenceChange = (key: CircumferenceField, value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value)
    setCircumferenceData(prev => ({ ...prev, [key]: numValue }))
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
        pontuacao_inbody: formData.pontuacao_inbody,
        foto_url: inbodyImageUrl || undefined,
        // Segmental data
        massa_magra_braco_direito: formData.massa_magra_braco_direito,
        massa_magra_braco_esquerdo: formData.massa_magra_braco_esquerdo,
        massa_magra_tronco: formData.massa_magra_tronco,
        massa_magra_perna_direita: formData.massa_magra_perna_direita,
        massa_magra_perna_esquerda: formData.massa_magra_perna_esquerda,
        gordura_braco_direito: formData.gordura_braco_direito,
        gordura_braco_esquerdo: formData.gordura_braco_esquerdo,
        gordura_tronco: formData.gordura_tronco,
        gordura_perna_direita: formData.gordura_perna_direita,
        gordura_perna_esquerda: formData.gordura_perna_esquerda,
        // Controle de peso
        peso_ideal: formData.peso_ideal,
        controle_peso: formData.controle_peso,
        controle_gordura: formData.controle_gordura,
        controle_muscular: formData.controle_muscular,
        // Medidas circunferenciais
        circ_torax: circumferenceData.circ_torax,
        circ_abdome: circumferenceData.circ_abdome,
        circ_braco_d: circumferenceData.circ_braco_d,
        circ_braco_e: circumferenceData.circ_braco_e,
        circ_antebraco_d: circumferenceData.circ_antebraco_d,
        circ_antebraco_e: circumferenceData.circ_antebraco_e,
        circ_coxa_d: circumferenceData.circ_coxa_d,
        circ_coxa_e: circumferenceData.circ_coxa_e,
        circ_panturrilha_d: circumferenceData.circ_panturrilha_d,
        circ_panturrilha_e: circumferenceData.circ_panturrilha_e,
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

  // Handle InBody scanner result
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleInBodyAnalysis = (analysisData: any, imageUrl: string | null) => {
    // Map analysis data to form fields
    setFormData({
      ...formData,
      peso: analysisData.peso ?? formData.peso,
      altura: analysisData.altura_cm ?? formData.altura,
      agua_total: analysisData.agua_corporal_l ?? formData.agua_total,
      proteina: analysisData.proteina_kg ?? formData.proteina,
      minerais: analysisData.minerais_kg ?? formData.minerais,
      gordura_corporal: analysisData.massa_gordura_kg ?? formData.gordura_corporal,
      massa_muscular_esqueletica: analysisData.massa_muscular_esqueletica_kg ?? formData.massa_muscular_esqueletica,
      massa_magra: analysisData.massa_livre_gordura_kg ?? formData.massa_magra,
      imc: analysisData.imc ?? formData.imc,
      percentual_gordura: analysisData.percentual_gordura ?? formData.percentual_gordura,
      taxa_metabolica_basal: analysisData.taxa_metabolica_basal ?? formData.taxa_metabolica_basal,
      nivel_gordura_visceral: analysisData.gordura_visceral ?? formData.nivel_gordura_visceral,
      pontuacao_inbody: analysisData.pontuacao_inbody ?? formData.pontuacao_inbody,
      peso_ideal: analysisData.peso_ideal ?? formData.peso_ideal,
      controle_peso: analysisData.controle_peso ?? formData.controle_peso,
      controle_gordura: analysisData.controle_gordura ?? formData.controle_gordura,
      controle_muscular: analysisData.controle_muscular ?? formData.controle_muscular,
      massa_magra_braco_direito: analysisData.massa_magra_braco_direito ?? formData.massa_magra_braco_direito,
      massa_magra_braco_esquerdo: analysisData.massa_magra_braco_esquerdo ?? formData.massa_magra_braco_esquerdo,
      massa_magra_tronco: analysisData.massa_magra_tronco ?? formData.massa_magra_tronco,
      massa_magra_perna_direita: analysisData.massa_magra_perna_direita ?? formData.massa_magra_perna_direita,
      massa_magra_perna_esquerda: analysisData.massa_magra_perna_esquerda ?? formData.massa_magra_perna_esquerda,
      gordura_braco_direito: analysisData.gordura_braco_direito ?? formData.gordura_braco_direito,
      gordura_braco_esquerdo: analysisData.gordura_braco_esquerdo ?? formData.gordura_braco_esquerdo,
      gordura_tronco: analysisData.gordura_tronco ?? formData.gordura_tronco,
      gordura_perna_direita: analysisData.gordura_perna_direita ?? formData.gordura_perna_direita,
      gordura_perna_esquerda: analysisData.gordura_perna_esquerda ?? formData.gordura_perna_esquerda,
    })

    if (imageUrl) {
      setInbodyImageUrl(imageUrl)
    }

    // Auto-expand sections if we have data
    if (analysisData.agua_corporal_l || analysisData.proteina_kg) {
      setShowComposicao(true)
    }
    if (analysisData.percentual_gordura || analysisData.pontuacao_inbody) {
      setShowIndices(true)
    }
    if (analysisData.controle_peso || analysisData.peso_ideal) {
      setShowControle(true)
    }
    if (analysisData.massa_magra_braco_direito) {
      setShowSegmental(true)
    }

    setShowScanner(false)
  }

  const fonteOptions = [
    { value: 'inbody' as FonteType, label: 'InBody', icon: Camera, desc: 'Dados completos do InBody' },
    { value: 'manual' as FonteType, label: 'Manual', icon: Scale, desc: 'Inserir dados manualmente' },
  ]

  return (
    <>
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
          <div className="grid grid-cols-2 gap-3">
            {fonteOptions.map(option => {
              const Icon = option.icon
              const isSelected = fonte === option.value
              return (
                <button
                  key={option.value}
                  onClick={() => setFonte(option.value)}
                  className={cn(
                    'p-4 rounded-xl border transition-all text-center',
                    isSelected
                      ? 'border-violet-500 bg-violet-500/10'
                      : 'border-[#2E2E3E] bg-[#14141F] hover:border-violet-500/30'
                  )}
                >
                  <Icon className={cn(
                    'w-6 h-6 mx-auto mb-2',
                    isSelected ? 'text-violet-400' : 'text-slate-400'
                  )} />
                  <p className={cn(
                    'text-sm font-medium',
                    isSelected ? 'text-violet-400' : 'text-slate-300'
                  )}>
                    {option.label}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">{option.desc}</p>
                </button>
              )
            })}
          </div>
        </div>

        {/* InBody Scanner Button */}
        {fonte === 'inbody' && (
          <div className="px-4 mb-6">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowScanner(true)}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-semibold flex items-center justify-center gap-3 shadow-lg shadow-violet-500/20"
            >
              <Scan className="w-5 h-5" />
              Escanear Resultado InBody
            </motion.button>
            <p className="text-xs text-slate-500 text-center mt-2">
              Tire uma foto do seu resultado e a IA extrai os dados automaticamente
            </p>
          </div>
        )}

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

        {/* Expandable sections - available for both InBody and Manual */}
        {/* Composição Corporal */}
        <ExpandableSection
          title="Composição Corporal"
          expanded={showComposicao}
          onToggle={() => setShowComposicao(!showComposicao)}
          fields={composicaoFields}
          formData={formData}
          onFieldChange={handleFieldChange}
        />

        {/* Índices */}
        <ExpandableSection
          title="Índices e Pontuação"
          expanded={showIndices}
          onToggle={() => setShowIndices(!showIndices)}
          fields={indicesFields}
          formData={formData}
          onFieldChange={handleFieldChange}
        />

        {/* Controle */}
        <ExpandableSection
          title="Controle de Peso"
          expanded={showControle}
          onToggle={() => setShowControle(!showControle)}
          fields={controleFields}
          formData={formData}
          onFieldChange={handleFieldChange}
        />

        {/* Segmental */}
        <ExpandableSection
          title="Análise Segmentar (Massa Magra)"
          expanded={showSegmental}
          onToggle={() => setShowSegmental(!showSegmental)}
          fields={segmentalMagraFields}
          formData={formData}
          onFieldChange={handleFieldChange}
        />

        {/* Medidas Circunferenciais (always available, manual input) */}
        <div className="px-4 mb-4">
          <button
            onClick={() => setShowCircumference(!showCircumference)}
            className="flex items-center justify-between w-full text-sm text-slate-400 mb-3"
          >
            <span className="flex items-center gap-2">
              Medidas Circunferenciais
              {Object.values(circumferenceData).some(v => v !== undefined) && (
                <span className="w-2 h-2 rounded-full bg-cyan-500" />
              )}
            </span>
            {showCircumference ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          <AnimatePresence>
            {showCircumference && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-[#14141F] border border-[#2E2E3E] rounded-xl p-4"
              >
                <p className="text-xs text-slate-500 mb-4">
                  Medidas em centímetros (cm) - use uma fita métrica
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {circumferenceFields.map(field => (
                    <div key={field.key}>
                      <label className="text-sm text-slate-400 mb-1 block">
                        {field.label}
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.1"
                          min={10}
                          max={200}
                          placeholder={field.placeholder}
                          value={circumferenceData[field.key] ?? ''}
                          onChange={(e) => handleCircumferenceChange(field.key, e.target.value)}
                          className="w-full bg-[#0A0A0F] border border-[#2E2E3E] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                          cm
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

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

      {/* InBody Scanner Modal */}
      <AnimatePresence>
        {showScanner && (
          <InBodyScanner
            onAnalysisComplete={handleInBodyAnalysis}
            onCancel={() => setShowScanner(false)}
          />
        )}
      </AnimatePresence>
    </>
  )
}

// Expandable section component
function ExpandableSection({
  title,
  expanded,
  onToggle,
  fields,
  formData,
  onFieldChange,
}: {
  title: string
  expanded: boolean
  onToggle: () => void
  fields: FormField[]
  formData: Record<NumericFormField, number | undefined>
  onFieldChange: (key: NumericFormField, value: string) => void
}) {
  // Check if any field has data
  const hasData = fields.some(f => formData[f.key] !== undefined && formData[f.key] !== null)

  return (
    <div className="px-4 mb-4">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full text-sm text-slate-400 mb-3"
      >
        <span className="flex items-center gap-2">
          {title}
          {hasData && (
            <span className="w-2 h-2 rounded-full bg-violet-500" />
          )}
        </span>
        {expanded ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-[#14141F] border border-[#2E2E3E] rounded-xl p-4 space-y-4"
          >
            {fields.map(field => (
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
                    onChange={(e) => onFieldChange(field.key, e.target.value)}
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
      </AnimatePresence>
    </div>
  )
}
