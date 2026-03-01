'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Camera, Upload, X, Loader2, Check, AlertCircle, RotateCcw, Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'

interface InBodyData {
  // Basic
  peso: number | null
  altura_cm: number | null
  idade: number | null

  // Composition
  agua_corporal_l: number | null
  proteina_kg: number | null
  minerais_kg: number | null
  massa_gordura_kg: number | null
  massa_muscular_esqueletica_kg: number | null
  massa_livre_gordura_kg: number | null

  // Indices
  imc: number | null
  percentual_gordura: number | null
  taxa_metabolica_basal: number | null
  gordura_visceral: number | null
  pontuacao_inbody: number | null

  // Segmental lean mass
  massa_magra_braco_direito: number | null
  massa_magra_braco_esquerdo: number | null
  massa_magra_tronco: number | null
  massa_magra_perna_direita: number | null
  massa_magra_perna_esquerda: number | null

  // Segmental fat
  gordura_braco_direito: number | null
  gordura_braco_esquerdo: number | null
  gordura_tronco: number | null
  gordura_perna_direita: number | null
  gordura_perna_esquerda: number | null

  // Control
  controle_peso: number | null
  controle_gordura: number | null
  controle_muscular: number | null
  peso_ideal: number | null

  // Confidence
  confidence: number
}

interface InBodyScannerProps {
  onAnalysisComplete: (data: InBodyData, imageUrl: string | null) => void
  onCancel: () => void
}

type AnalysisStep = 'capture' | 'analyzing' | 'result' | 'error'

export function InBodyScanner({ onAnalysisComplete, onCancel }: InBodyScannerProps) {
  const [step, setStep] = useState<AnalysisStep>('capture')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_imageFile, setImageFile] = useState<File | null>(null)
  const [analysisResult, setAnalysisResult] = useState<InBodyData | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      processImage(file)
    }
  }

  const processImage = async (file: File) => {
    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
    setImageFile(file)

    // Start analysis
    setStep('analyzing')
    setError(null)

    try {
      const formData = new FormData()
      formData.append('image', file)

      const response = await fetch('/api/inbody/analyze', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao analisar imagem')
      }

      setAnalysisResult(result.data)
      setImageUrl(result.image_url)
      setStep('result')
    } catch (err) {
      console.error('InBody analysis error:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
      setStep('error')
    }
  }

  const handleConfirm = () => {
    if (analysisResult) {
      onAnalysisComplete(analysisResult, imageUrl)
    }
  }

  // Update a field in the analysis result
  const updateField = (field: keyof InBodyData, value: number | null) => {
    if (analysisResult) {
      setAnalysisResult({
        ...analysisResult,
        [field]: value
      })
    }
  }

  const handleRetry = () => {
    setStep('capture')
    setImagePreview(null)
    setImageFile(null)
    setAnalysisResult(null)
    setError(null)
  }

  // Render capture step
  if (step === 'capture') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-black/90 z-50 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 pt-12">
          <button
            onClick={onCancel}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <h2 className="text-lg font-semibold text-white">Escanear InBody</h2>
          <div className="w-10" />
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="w-24 h-24 rounded-full bg-dourado/20 flex items-center justify-center mb-6">
            <Camera className="w-12 h-12 text-dourado" />
          </div>

          <h3 className="text-xl font-bold text-white mb-2">
            Fotografe seu resultado InBody
          </h3>
          <p className="text-foreground-secondary text-center mb-8 max-w-sm">
            Posicione a câmera sobre o resultado impresso do InBody.
            A IA vai extrair automaticamente todos os dados.
          </p>

          {/* Tips */}
          <div className="bg-white/50 rounded-xl p-4 mb-8 max-w-sm">
            <p className="text-sm font-medium text-white mb-2">Dicas:</p>
            <ul className="text-sm text-foreground-secondary space-y-1">
              <li>- Boa iluminação ajuda na precisão</li>
              <li>- Enquadre todo o resultado na foto</li>
              <li>- Evite reflexos e sombras</li>
            </ul>
          </div>

          {/* Action buttons */}
          <div className="w-full max-w-sm space-y-3">
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-dourado to-dourado text-white font-semibold flex items-center justify-center gap-2"
            >
              <Camera className="w-5 h-5" />
              Tirar Foto
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-4 rounded-xl bg-background-elevated text-white font-semibold flex items-center justify-center gap-2"
            >
              <Upload className="w-5 h-5" />
              Selecionar da Galeria
            </button>
          </div>

          {/* Hidden inputs */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileSelect}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>
      </motion.div>
    )
  }

  // Render analyzing step
  if (step === 'analyzing') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center px-6"
      >
        {imagePreview && (
          <div className="relative w-48 h-48 rounded-xl overflow-hidden mb-8 opacity-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imagePreview}
              alt="InBody"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          </div>
        )}

        <Loader2 className="w-12 h-12 text-dourado animate-spin mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">Analisando...</h3>
        <p className="text-foreground-secondary text-center">
          Extraindo dados do seu resultado InBody
        </p>

        <div className="mt-8 flex items-center gap-2 text-sm text-foreground-muted">
          <div className="w-2 h-2 rounded-full bg-dourado animate-pulse" />
          Processando com IA
        </div>
      </motion.div>
    )
  }

  // Render error step
  if (step === 'error') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center px-6"
      >
        <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mb-6">
          <AlertCircle className="w-10 h-10 text-red-400" />
        </div>

        <h3 className="text-xl font-bold text-white mb-2">Erro na análise</h3>
        <p className="text-foreground-secondary text-center mb-6 max-w-sm">
          {error || 'Não foi possível extrair os dados. Tente novamente com uma foto mais clara.'}
        </p>

        <div className="w-full max-w-sm space-y-3">
          <button
            onClick={handleRetry}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-dourado to-dourado text-white font-semibold flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            Tentar Novamente
          </button>

          <button
            onClick={onCancel}
            className="w-full py-4 rounded-xl bg-background-elevated text-white font-semibold"
          >
            Cancelar
          </button>
        </div>
      </motion.div>
    )
  }

  // Render result step
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/90 z-50 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 pt-12">
        <button
          onClick={handleRetry}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <RotateCcw className="w-6 h-6 text-white" />
        </button>
        <h2 className="text-lg font-semibold text-white">Dados Extraídos</h2>
        <button
          onClick={onCancel}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <X className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Content - scrollable */}
      <div className="flex-1 overflow-y-auto px-4 pb-48">
        {/* Confidence indicator and edit hint */}
        {analysisResult && (
          <div className="mb-4 space-y-2">
            <div className={cn(
              'p-3 rounded-xl flex items-center gap-2',
              analysisResult.confidence >= 80 ? 'bg-green-500/20' :
              analysisResult.confidence >= 50 ? 'bg-yellow-500/20' : 'bg-red-500/20'
            )}>
              <Check className={cn(
                'w-5 h-5',
                analysisResult.confidence >= 80 ? 'text-green-400' :
                analysisResult.confidence >= 50 ? 'text-yellow-400' : 'text-red-400'
              )} />
              <span className="text-sm text-white">
                Confiança: {analysisResult.confidence}%
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-foreground-secondary">
              <Pencil className="w-3 h-3" />
              <span>Toque em qualquer valor para editar</span>
            </div>
          </div>
        )}

        {/* Preview image */}
        {imagePreview && (
          <div className="mb-4 rounded-xl overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imagePreview}
              alt="InBody"
              className="w-full max-h-40 object-cover"
            />
          </div>
        )}

        {/* Data display - EDITABLE */}
        {analysisResult && (
          <div className="space-y-4">
            {/* Basic data */}
            <DataSection title="Dados Básicos">
              <EditableDataRow label="Peso" value={analysisResult.peso} unit="kg" field="peso" onUpdate={updateField} />
              <EditableDataRow label="Altura" value={analysisResult.altura_cm} unit="cm" field="altura_cm" onUpdate={updateField} />
              <EditableDataRow label="IMC" value={analysisResult.imc} field="imc" onUpdate={updateField} />
              <EditableDataRow label="Pontuação InBody" value={analysisResult.pontuacao_inbody} field="pontuacao_inbody" onUpdate={updateField} />
            </DataSection>

            {/* Body composition */}
            <DataSection title="Composição Corporal">
              <EditableDataRow label="Água Corporal" value={analysisResult.agua_corporal_l} unit="L" field="agua_corporal_l" onUpdate={updateField} />
              <EditableDataRow label="Proteína" value={analysisResult.proteina_kg} unit="kg" field="proteina_kg" onUpdate={updateField} />
              <EditableDataRow label="Minerais" value={analysisResult.minerais_kg} unit="kg" field="minerais_kg" onUpdate={updateField} />
              <EditableDataRow label="Massa de Gordura" value={analysisResult.massa_gordura_kg} unit="kg" field="massa_gordura_kg" onUpdate={updateField} />
              <EditableDataRow label="Massa Muscular Esq." value={analysisResult.massa_muscular_esqueletica_kg} unit="kg" field="massa_muscular_esqueletica_kg" onUpdate={updateField} />
              <EditableDataRow label="Massa Livre Gordura" value={analysisResult.massa_livre_gordura_kg} unit="kg" field="massa_livre_gordura_kg" onUpdate={updateField} />
            </DataSection>

            {/* Indices */}
            <DataSection title="Índices">
              <EditableDataRow label="% Gordura" value={analysisResult.percentual_gordura} unit="%" field="percentual_gordura" onUpdate={updateField} />
              <EditableDataRow label="Gordura Visceral" value={analysisResult.gordura_visceral} field="gordura_visceral" onUpdate={updateField} highlight />
              <EditableDataRow label="Taxa Metabólica" value={analysisResult.taxa_metabolica_basal} unit="kcal" field="taxa_metabolica_basal" onUpdate={updateField} />
            </DataSection>

            {/* Control */}
            <DataSection title="Controle">
              <EditableDataRow label="Peso Ideal" value={analysisResult.peso_ideal} unit="kg" field="peso_ideal" onUpdate={updateField} />
              <EditableDataRow label="Controle Peso" value={analysisResult.controle_peso} unit="kg" field="controle_peso" onUpdate={updateField} showSign />
              <EditableDataRow label="Controle Gordura" value={analysisResult.controle_gordura} unit="kg" field="controle_gordura" onUpdate={updateField} showSign />
              <EditableDataRow label="Controle Muscular" value={analysisResult.controle_muscular} unit="kg" field="controle_muscular" onUpdate={updateField} showSign />
            </DataSection>

            {/* Segmental - only show if we have data */}
            {(analysisResult.massa_magra_braco_direito || analysisResult.gordura_braco_direito) && (
              <DataSection title="Análise Segmentar">
                <EditableDataRow label="Braço D - Magra" value={analysisResult.massa_magra_braco_direito} unit="kg" field="massa_magra_braco_direito" onUpdate={updateField} />
                <EditableDataRow label="Braço E - Magra" value={analysisResult.massa_magra_braco_esquerdo} unit="kg" field="massa_magra_braco_esquerdo" onUpdate={updateField} />
                <EditableDataRow label="Tronco - Magra" value={analysisResult.massa_magra_tronco} unit="kg" field="massa_magra_tronco" onUpdate={updateField} />
                <EditableDataRow label="Perna D - Magra" value={analysisResult.massa_magra_perna_direita} unit="kg" field="massa_magra_perna_direita" onUpdate={updateField} />
                <EditableDataRow label="Perna E - Magra" value={analysisResult.massa_magra_perna_esquerda} unit="kg" field="massa_magra_perna_esquerda" onUpdate={updateField} />
              </DataSection>
            )}
          </div>
        )}
      </div>

      {/* Fixed bottom button - above bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 p-4 pb-[calc(1rem+env(safe-area-inset-bottom)+80px)] bg-gradient-to-t from-black via-black/95 to-transparent z-[60]">
        <button
          onClick={handleConfirm}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-dourado to-dourado text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-dourado/30"
        >
          <Check className="w-5 h-5" />
          Usar Estes Dados
        </button>
      </div>
    </motion.div>
  )
}

// Helper components
function DataSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white/50 rounded-xl p-4">
      <h4 className="text-sm font-medium text-foreground-secondary mb-3">{title}</h4>
      <div className="space-y-2">
        {children}
      </div>
    </div>
  )
}

function EditableDataRow({
  label,
  value,
  unit,
  showSign,
  field,
  onUpdate,
  highlight
}: {
  label: string
  value: number | null
  unit?: string
  showSign?: boolean
  field: keyof InBodyData
  onUpdate: (field: keyof InBodyData, value: number | null) => void
  highlight?: boolean
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value?.toString() || '')

  const handleSave = () => {
    const numValue = editValue === '' ? null : parseFloat(editValue)
    onUpdate(field, numValue)
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      setEditValue(value?.toString() || '')
      setIsEditing(false)
    }
  }

  if (value === null || value === undefined) {
    // Show empty editable field
    return (
      <div className="flex items-center justify-between">
        <span className="text-sm text-foreground-secondary">{label}</span>
        {isEditing ? (
          <input
            type="number"
            step="0.1"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            autoFocus
            className="w-24 bg-background-elevated border border-dourado rounded px-2 py-1 text-sm text-foreground text-right focus:outline-none"
          />
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="text-sm text-foreground-muted hover:text-dourado transition-colors"
          >
            + adicionar
          </button>
        )}
      </div>
    )
  }

  const formattedValue = showSign && value > 0 ? `+${value}` : value.toString()

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-foreground-secondary">{label}</span>
      {isEditing ? (
        <div className="flex items-center gap-1">
          <input
            type="number"
            step="0.1"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            autoFocus
            className="w-20 bg-background-elevated border border-dourado rounded px-2 py-1 text-sm text-foreground text-right focus:outline-none"
          />
          {unit && <span className="text-xs text-foreground-muted">{unit}</span>}
        </div>
      ) : (
        <button
          onClick={() => {
            setEditValue(value?.toString() || '')
            setIsEditing(true)
          }}
          className={cn(
            'text-sm font-medium flex items-center gap-1 hover:opacity-80 transition-opacity',
            highlight ? 'bg-dourado/20 px-2 py-0.5 rounded' : '',
            showSign && value > 0 ? 'text-green-400' :
            showSign && value < 0 ? 'text-red-400' : 'text-white'
          )}
        >
          {formattedValue}{unit ? ` ${unit}` : ''}
          <Pencil className="w-3 h-3 text-foreground-muted" />
        </button>
      )}
    </div>
  )
}
