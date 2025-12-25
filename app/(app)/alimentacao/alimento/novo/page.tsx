"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Save, Camera, Barcode, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useFoods } from '@/hooks/use-foods'
import type { FoodCategory } from '@/lib/nutrition/types'
import { foodCategoryLabels } from '@/lib/nutrition/types'
import { cn } from '@/lib/utils'

const categories: FoodCategory[] = [
  'proteina',
  'carboidrato',
  'gordura',
  'vegetal',
  'fruta',
  'laticinio',
  'suplemento',
  'bebida',
  'outros'
]

const units: Array<'g' | 'ml' | 'unidade'> = ['g', 'ml', 'unidade']

export default function NewFoodPage() {
  const router = useRouter()
  const { addFood } = useFoods()

  const [nome, setNome] = useState('')
  const [marca, setMarca] = useState('')
  const [categoria, setCategoria] = useState<FoodCategory>('outros')
  const [porcaoPadrao, setPorcaoPadrao] = useState('100')
  const [unidade, setUnidade] = useState<'g' | 'ml' | 'unidade'>('g')
  const [calorias, setCalorias] = useState('')
  const [proteinas, setProteinas] = useState('')
  const [carboidratos, setCarboidratos] = useState('')
  const [gorduras, setGorduras] = useState('')
  const [fibras, setFibras] = useState('')
  const [sodio, setSodio] = useState('')
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!nome.trim()) {
      newErrors.nome = 'Nome é obrigatório'
    }

    if (!porcaoPadrao || parseFloat(porcaoPadrao) <= 0) {
      newErrors.porcaoPadrao = 'Porção deve ser maior que zero'
    }

    if (!calorias || parseFloat(calorias) < 0) {
      newErrors.calorias = 'Calorias inválidas'
    }

    if (!proteinas || parseFloat(proteinas) < 0) {
      newErrors.proteinas = 'Proteínas inválidas'
    }

    if (!carboidratos || parseFloat(carboidratos) < 0) {
      newErrors.carboidratos = 'Carboidratos inválidos'
    }

    if (!gorduras || parseFloat(gorduras) < 0) {
      newErrors.gorduras = 'Gorduras inválidas'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return

    setSaving(true)
    try {
      await addFood({
        nome: nome.trim(),
        marca: marca.trim() || undefined,
        categoria,
        porcao_padrao: parseFloat(porcaoPadrao),
        unidade,
        calorias: parseFloat(calorias),
        proteinas: parseFloat(proteinas),
        carboidratos: parseFloat(carboidratos),
        gorduras: parseFloat(gorduras),
        fibras: fibras ? parseFloat(fibras) : undefined,
        sodio: sodio ? parseFloat(sodio) : undefined,
        is_favorite: false,
        is_user_created: true
      })
      router.push('/alimentacao/alimento')
    } catch (error) {
      console.error('Error saving food:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] pb-32">
      {/* Header */}
      <div className="px-4 pt-12 pb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Voltar</span>
        </button>

        <h1 className="text-2xl font-bold text-white">Novo Alimento</h1>
        <p className="text-slate-400 text-sm">Cadastre um alimento personalizado</p>
      </div>

      {/* Quick scan options */}
      <div className="px-4 mb-6">
        <div className="grid grid-cols-2 gap-3">
          <button className="flex items-center justify-center gap-2 p-4 bg-slate-800/50 border border-dashed border-slate-700 rounded-xl text-slate-400 hover:border-violet-500/50 hover:text-violet-400 transition-all">
            <Camera className="w-5 h-5" />
            <span className="text-sm">Escanear rótulo</span>
          </button>
          <button className="flex items-center justify-center gap-2 p-4 bg-slate-800/50 border border-dashed border-slate-700 rounded-xl text-slate-400 hover:border-violet-500/50 hover:text-violet-400 transition-all">
            <Barcode className="w-5 h-5" />
            <span className="text-sm">Código de barras</span>
          </button>
        </div>
        <p className="text-center text-xs text-slate-600 mt-2">
          Em breve: IA para preencher automaticamente!
        </p>
      </div>

      {/* Form */}
      <div className="px-4 space-y-6">
        {/* Basic info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#14141F] border border-[#2E2E3E] rounded-xl p-4"
        >
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">
            Informações Básicas
          </h3>

          <div className="space-y-4">
            <div>
              <Label htmlFor="nome">Nome do alimento *</Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Frango grelhado"
                className={cn(errors.nome && 'border-red-500')}
              />
              {errors.nome && (
                <p className="text-red-400 text-xs mt-1">{errors.nome}</p>
              )}
            </div>

            <div>
              <Label htmlFor="marca">Marca (opcional)</Label>
              <Input
                id="marca"
                value={marca}
                onChange={(e) => setMarca(e.target.value)}
                placeholder="Ex: Sadia, Seara..."
              />
            </div>

            <div>
              <Label>Categoria</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {categories.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoria(cat)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all',
                      categoria === cat
                        ? 'bg-violet-500 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    )}
                  >
                    <span>{foodCategoryLabels[cat].icon}</span>
                    <span>{foodCategoryLabels[cat].label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Portion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#14141F] border border-[#2E2E3E] rounded-xl p-4"
        >
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">
            Porção de Referência
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="porcao">Quantidade *</Label>
              <Input
                id="porcao"
                type="number"
                value={porcaoPadrao}
                onChange={(e) => setPorcaoPadrao(e.target.value)}
                placeholder="100"
                className={cn(errors.porcaoPadrao && 'border-red-500')}
              />
              {errors.porcaoPadrao && (
                <p className="text-red-400 text-xs mt-1">{errors.porcaoPadrao}</p>
              )}
            </div>

            <div>
              <Label>Unidade</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {units.map(u => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setUnidade(u)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-sm transition-all',
                      unidade === u
                        ? 'bg-violet-500 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    )}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Macros */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#14141F] border border-[#2E2E3E] rounded-xl p-4"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">
              Informação Nutricional
            </h3>
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <Info className="w-3 h-3" />
              <span>por porção</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="calorias">Calorias (kcal) *</Label>
              <Input
                id="calorias"
                type="number"
                value={calorias}
                onChange={(e) => setCalorias(e.target.value)}
                placeholder="0"
                className={cn(errors.calorias && 'border-red-500')}
              />
              {errors.calorias && (
                <p className="text-red-400 text-xs mt-1">{errors.calorias}</p>
              )}
            </div>

            <div>
              <Label htmlFor="proteinas">Proteínas (g) *</Label>
              <Input
                id="proteinas"
                type="number"
                step="0.1"
                value={proteinas}
                onChange={(e) => setProteinas(e.target.value)}
                placeholder="0"
                className={cn(errors.proteinas && 'border-red-500')}
              />
              {errors.proteinas && (
                <p className="text-red-400 text-xs mt-1">{errors.proteinas}</p>
              )}
            </div>

            <div>
              <Label htmlFor="carboidratos">Carboidratos (g) *</Label>
              <Input
                id="carboidratos"
                type="number"
                step="0.1"
                value={carboidratos}
                onChange={(e) => setCarboidratos(e.target.value)}
                placeholder="0"
                className={cn(errors.carboidratos && 'border-red-500')}
              />
              {errors.carboidratos && (
                <p className="text-red-400 text-xs mt-1">{errors.carboidratos}</p>
              )}
            </div>

            <div>
              <Label htmlFor="gorduras">Gorduras (g) *</Label>
              <Input
                id="gorduras"
                type="number"
                step="0.1"
                value={gorduras}
                onChange={(e) => setGorduras(e.target.value)}
                placeholder="0"
                className={cn(errors.gorduras && 'border-red-500')}
              />
              {errors.gorduras && (
                <p className="text-red-400 text-xs mt-1">{errors.gorduras}</p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Optional macros */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-[#14141F] border border-[#2E2E3E] rounded-xl p-4"
        >
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">
            Informações Adicionais (opcional)
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fibras">Fibras (g)</Label>
              <Input
                id="fibras"
                type="number"
                step="0.1"
                value={fibras}
                onChange={(e) => setFibras(e.target.value)}
                placeholder="0"
              />
            </div>

            <div>
              <Label htmlFor="sodio">Sódio (mg)</Label>
              <Input
                id="sodio"
                type="number"
                value={sodio}
                onChange={(e) => setSodio(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Save button */}
      <div className="fixed bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-[#0A0A0F] via-[#0A0A0F] to-transparent pt-8 z-40">
        <Button
          variant="gradient"
          size="lg"
          className="w-full gap-2"
          onClick={handleSave}
          disabled={saving}
        >
          <Save className="w-5 h-5" />
          {saving ? 'Salvando...' : 'Salvar Alimento'}
        </Button>
      </div>
    </div>
  )
}
