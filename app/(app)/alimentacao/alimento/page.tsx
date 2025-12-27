"use client"

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Search, Plus, Star, Heart, Clock, Filter, X, Pencil, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useFoods } from '@/hooks/use-foods'
import type { FoodCategory, Food } from '@/lib/nutrition/types'
import { foodCategoryLabels } from '@/lib/nutrition/types'
import { cn } from '@/lib/utils'

type Tab = 'todos' | 'favoritos' | 'recentes' | 'meus'
type SortBy = 'nome' | 'calorias' | 'proteinas'

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

export default function FoodDatabasePage() {
  const router = useRouter()
  const { foods, favorites, recent, userFoods, toggleFavorite, deleteFood, updateFood } = useFoods()

  const [activeTab, setActiveTab] = useState<Tab>('todos')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<FoodCategory | null>(null)
  const [sortBy, setSortBy] = useState<SortBy>('nome')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedFood, setSelectedFood] = useState<Food | null>(null)

  // Filtrar e ordenar alimentos
  const filteredFoods = useMemo(() => {
    let result: Food[] = []

    // Selecionar base de acordo com a tab
    switch (activeTab) {
      case 'favoritos':
        result = favorites
        break
      case 'recentes':
        result = recent
        break
      case 'meus':
        result = userFoods
        break
      default:
        result = foods
    }

    // Aplicar busca
    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase()
      result = result.filter(
        f =>
          f.nome.toLowerCase().includes(lowerQuery) ||
          f.marca?.toLowerCase().includes(lowerQuery)
      )
    }

    // Aplicar filtro de categoria
    if (selectedCategory) {
      result = result.filter(f => f.categoria === selectedCategory)
    }

    // Ordenar
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'calorias':
          return b.calorias - a.calorias
        case 'proteinas':
          return b.proteinas - a.proteinas
        default:
          return a.nome.localeCompare(b.nome)
      }
    })

    return result
  }, [activeTab, foods, favorites, recent, userFoods, searchQuery, selectedCategory, sortBy])

  // Agrupar por categoria
  const groupedFoods = useMemo(() => {
    if (selectedCategory) return null

    const groups: Record<FoodCategory, Food[]> = {} as Record<FoodCategory, Food[]>

    filteredFoods.forEach(food => {
      if (!groups[food.categoria]) {
        groups[food.categoria] = []
      }
      groups[food.categoria].push(food)
    })

    return groups
  }, [filteredFoods, selectedCategory])

  const handleToggleFavorite = async (foodId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    await toggleFavorite(foodId)
  }

  const handleDelete = async (foodId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('Tem certeza que deseja excluir este alimento?')) {
      await deleteFood(foodId)
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] pb-24">
      {/* Header */}
      <div className="px-4 pt-12 pb-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Voltar</span>
        </button>

        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Banco de Alimentos</h1>
            <p className="text-slate-400 text-sm">{foods.length} alimentos cadastrados</p>
          </div>
          <Button
            variant="gradient"
            size="sm"
            onClick={() => router.push('/alimentacao/alimento/novo')}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Novo
          </Button>
        </div>
      </div>

      {/* Search bar */}
      <div className="px-4 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar alimento..."
            className="w-full bg-[#14141F] border border-[#2E2E3E] rounded-xl pl-10 pr-10 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-800 rounded-lg"
            >
              <X className="w-4 h-4 text-slate-500" />
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 mb-4">
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
          <TabButton
            active={activeTab === 'todos'}
            onClick={() => setActiveTab('todos')}
            icon={<Search className="w-4 h-4" />}
            label="Todos"
          />
          <TabButton
            active={activeTab === 'favoritos'}
            onClick={() => setActiveTab('favoritos')}
            icon={<Heart className="w-4 h-4" />}
            label={`Favoritos (${favorites.length})`}
          />
          <TabButton
            active={activeTab === 'recentes'}
            onClick={() => setActiveTab('recentes')}
            icon={<Clock className="w-4 h-4" />}
            label="Recentes"
          />
          <TabButton
            active={activeTab === 'meus'}
            onClick={() => setActiveTab('meus')}
            icon={<Star className="w-4 h-4" />}
            label={`Meus (${userFoods.length})`}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-xl transition-all',
              showFilters
                ? 'bg-violet-500 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            )}
          >
            <Filter className="w-4 h-4" />
            <span className="text-sm">Filtros</span>
          </button>

          {selectedCategory && (
            <button
              onClick={() => setSelectedCategory(null)}
              className="flex items-center gap-2 px-3 py-2 bg-violet-500/20 text-violet-400 rounded-xl"
            >
              <span className="text-sm">{foodCategoryLabels[selectedCategory].label}</span>
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Filter panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 bg-[#14141F] border border-[#2E2E3E] rounded-xl p-4"
            >
              <div className="mb-4">
                <p className="text-sm text-slate-400 mb-2">Categoria</p>
                <div className="flex flex-wrap gap-2">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all',
                        selectedCategory === cat
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

              <div>
                <p className="text-sm text-slate-400 mb-2">Ordenar por</p>
                <div className="flex gap-2">
                  {[
                    { value: 'nome', label: 'Nome' },
                    { value: 'calorias', label: 'Calorias' },
                    { value: 'proteinas', label: 'Proteína' }
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => setSortBy(option.value as SortBy)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-sm transition-all',
                        sortBy === option.value
                          ? 'bg-violet-500 text-white'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Food list */}
      <div className="px-4">
        {filteredFoods.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-400 mb-4">
              {searchQuery
                ? 'Nenhum alimento encontrado'
                : activeTab === 'meus'
                ? 'Você ainda não cadastrou nenhum alimento'
                : activeTab === 'favoritos'
                ? 'Nenhum alimento favorito'
                : activeTab === 'recentes'
                ? 'Nenhum alimento recente'
                : 'Nenhum alimento'}
            </p>
            {activeTab === 'meus' && (
              <Button
                variant="gradient"
                onClick={() => router.push('/alimentacao/alimento/novo')}
              >
                Cadastrar Alimento
              </Button>
            )}
          </div>
        ) : selectedCategory || searchQuery ? (
          // Lista simples quando há filtro
          <div className="space-y-2">
            {filteredFoods.map((food, index) => (
              <FoodCard
                key={food.id}
                food={food}
                index={index}
                onToggleFavorite={handleToggleFavorite}
                onDelete={food.is_user_created ? handleDelete : undefined}
                onClick={() => setSelectedFood(food)}
              />
            ))}
          </div>
        ) : (
          // Lista agrupada por categoria
          <div className="space-y-6">
            {groupedFoods && Object.entries(groupedFoods).map(([category, foods]) => (
              <div key={category}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">{foodCategoryLabels[category as FoodCategory].icon}</span>
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">
                    {foodCategoryLabels[category as FoodCategory].label}
                  </h3>
                  <span className="text-xs text-slate-500">({foods.length})</span>
                </div>
                <div className="space-y-2">
                  {foods.map((food, index) => (
                    <FoodCard
                      key={food.id}
                      food={food}
                      index={index}
                      onToggleFavorite={handleToggleFavorite}
                      onDelete={food.is_user_created ? handleDelete : undefined}
                      onClick={() => setSelectedFood(food)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Food detail modal */}
      <AnimatePresence>
        {selectedFood && (
          <FoodDetailModal
            food={selectedFood}
            onClose={() => setSelectedFood(null)}
            onToggleFavorite={() => toggleFavorite(selectedFood.id)}
            onUpdate={async (data) => {
              await updateFood(selectedFood.id, data)
              // Atualizar o food selecionado com os novos dados
              setSelectedFood({ ...selectedFood, ...data })
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// Tab button component
function TabButton({
  active,
  onClick,
  icon,
  label
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all',
        active
          ? 'bg-violet-500 text-white'
          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
      )}
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </button>
  )
}

// Food card component
function FoodCard({
  food,
  index,
  onToggleFavorite,
  onDelete,
  onClick
}: {
  food: Food
  index: number
  onToggleFavorite: (id: string, e: React.MouseEvent) => void
  onDelete?: (id: string, e: React.MouseEvent) => void
  onClick: () => void
}) {
  const categoryInfo = foodCategoryLabels[food.categoria]

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 p-3 bg-[#14141F] border rounded-xl hover:border-violet-500/30 transition-colors cursor-pointer",
        food.is_user_created
          ? "border-violet-500/30"
          : "border-[#2E2E3E]"
      )}
    >
      <span className="text-xl">{categoryInfo.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-white font-medium truncate">{food.nome}</p>
          {food.is_user_created && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-violet-500/20 text-violet-400 flex-shrink-0">
              Meu
            </span>
          )}
        </div>
        <p className="text-sm text-slate-400">
          {food.porcao_padrao}{food.unidade} • {food.calorias} kcal • {food.proteinas}g prot
        </p>
        {food.marca && (
          <p className="text-xs text-slate-500">{food.marca}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={(e) => onToggleFavorite(food.id, e)}
          className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <Heart
            className={cn(
              'w-4 h-4',
              food.is_favorite ? 'text-red-400 fill-red-400' : 'text-slate-500'
            )}
          />
        </button>
        {onDelete && (
          <button
            onClick={(e) => onDelete(food.id, e)}
            className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-red-400" />
          </button>
        )}
      </div>
    </motion.div>
  )
}

// Food detail modal
function FoodDetailModal({
  food,
  onClose,
  onToggleFavorite,
  onUpdate
}: {
  food: Food
  onClose: () => void
  onToggleFavorite: () => void
  onUpdate?: (data: Partial<Food>) => Promise<void>
}) {
  const categoryInfo = foodCategoryLabels[food.categoria]
  const [isEditingName, setIsEditingName] = useState(false)
  const [editedName, setEditedName] = useState(food.nome)
  const [isSaving, setIsSaving] = useState(false)

  const handleSaveName = async () => {
    if (!editedName.trim() || editedName === food.nome) {
      setIsEditingName(false)
      setEditedName(food.nome)
      return
    }

    if (onUpdate) {
      setIsSaving(true)
      await onUpdate({ nome: editedName.trim() })
      setIsSaving(false)
    }
    setIsEditingName(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 z-50 flex items-end justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-[#14141F] rounded-t-3xl p-6"
      >
        {/* Handle */}
        <div className="w-12 h-1 bg-slate-700 rounded-full mx-auto mb-6" />

        {/* Header */}
        {isEditingName ? (
          // Modo de edição - layout diferente
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center">
                <span className="text-2xl">{categoryInfo.icon}</span>
              </div>
              <div>
                <p className="text-sm text-slate-400">Editando nome</p>
                <p className="text-xs text-slate-500">{categoryInfo.label}</p>
              </div>
            </div>
            <input
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              autoFocus
              placeholder="Nome do alimento"
              className="w-full bg-slate-800 border border-violet-500 rounded-xl px-4 py-3 text-white font-bold text-lg focus:outline-none mb-4"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveName()
                if (e.key === 'Escape') {
                  setIsEditingName(false)
                  setEditedName(food.nome)
                }
              }}
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setIsEditingName(false)
                  setEditedName(food.nome)
                }}
                className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl text-slate-300 font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveName}
                disabled={isSaving}
                className="flex-1 px-4 py-3 bg-violet-500 hover:bg-violet-600 rounded-xl text-white font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5" />
                {isSaving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        ) : (
          // Modo normal
          <div className="flex items-start gap-4 mb-6">
            <div className="w-14 h-14 rounded-xl bg-slate-800 flex items-center justify-center">
              <span className="text-3xl">{categoryInfo.icon}</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">{food.nome}</h2>
                {food.is_user_created && onUpdate && (
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <Pencil className="w-4 h-4 text-slate-400" />
                  </button>
                )}
                {food.is_user_created && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-violet-500/20 text-violet-400">
                    Meu
                  </span>
                )}
              </div>
              {food.marca && (
                <p className="text-slate-400">{food.marca}</p>
              )}
              <p className="text-sm text-slate-500">{categoryInfo.label}</p>
            </div>
            <button
              onClick={onToggleFavorite}
              className="p-2 hover:bg-slate-800 rounded-lg"
            >
              <Heart
                className={cn(
                  'w-6 h-6',
                  food.is_favorite ? 'text-red-400 fill-red-400' : 'text-slate-500'
                )}
              />
            </button>
          </div>
        )}

        {/* Portion info */}
        <div className="bg-slate-800/50 rounded-xl p-4 mb-6">
          <p className="text-sm text-slate-400 mb-1">Porção padrão</p>
          <p className="text-lg font-bold text-white">
            {food.porcao_padrao}{food.unidade}
          </p>
        </div>

        {/* Macros */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{food.calorias}</p>
            <p className="text-xs text-slate-500">kcal</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-violet-400">{food.proteinas}g</p>
            <p className="text-xs text-slate-500">prot</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-cyan-400">{food.carboidratos}g</p>
            <p className="text-xs text-slate-500">carb</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-400">{food.gorduras}g</p>
            <p className="text-xs text-slate-500">gord</p>
          </div>
        </div>

        {/* Additional info */}
        {(food.fibras || food.sodio) && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            {food.fibras && (
              <div className="bg-slate-800/50 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-emerald-400">{food.fibras}g</p>
                <p className="text-xs text-slate-500">fibras</p>
              </div>
            )}
            {food.sodio && (
              <div className="bg-slate-800/50 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-slate-400">{food.sodio}mg</p>
                <p className="text-xs text-slate-500">sódio</p>
              </div>
            )}
          </div>
        )}

        {/* Close button */}
        <Button variant="outline" size="lg" className="w-full" onClick={onClose}>
          Fechar
        </Button>
      </motion.div>
    </motion.div>
  )
}
