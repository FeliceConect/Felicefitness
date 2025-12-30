"use client"

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Star, Clock, X, Plus, Edit3 } from 'lucide-react'
import type { Food, FoodCategory } from '@/lib/nutrition/types'
import { foodCategoryLabels } from '@/lib/nutrition/types'
import { useFoods } from '@/hooks/use-foods'

interface FoodSearchProps {
  onSelect: (food: Food) => void
  excludeIds?: string[]
  onAddCustomFood?: (name: string) => void
  showAddCustom?: boolean
}

export function FoodSearch({ onSelect, excludeIds = [], onAddCustomFood, showAddCustom = true }: FoodSearchProps) {
  const [query, setQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<FoodCategory | null>(null)
  const { favorites, recent, search, getByCategory } = useFoods()

  // Search results - busca por texto ou por categoria
  const searchResults = useMemo(() => {
    if (selectedCategory) {
      return getByCategory(selectedCategory).filter(f => !excludeIds.includes(f.id))
    }
    if (!query.trim()) return []
    return search(query).filter(f => !excludeIds.includes(f.id))
  }, [query, selectedCategory, search, getByCategory, excludeIds])

  // Filtered favorites and recent
  const filteredFavorites = useMemo(() => {
    return favorites.filter(f => !excludeIds.includes(f.id))
  }, [favorites, excludeIds])

  const filteredRecent = useMemo(() => {
    return recent.filter(f => !excludeIds.includes(f.id))
  }, [recent, excludeIds])

  const handleSelect = (food: Food) => {
    onSelect(food)
    setQuery('')
    setSelectedCategory(null)
  }

  const handleCategoryClick = (category: FoodCategory) => {
    setSelectedCategory(category)
    setQuery('')
  }

  const clearSearch = () => {
    setQuery('')
    setSelectedCategory(null)
  }

  const isSearching = query.trim() || selectedCategory

  return (
    <div className="space-y-4">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
        <input
          type="text"
          value={selectedCategory ? foodCategoryLabels[selectedCategory].label : query}
          onChange={(e) => {
            setSelectedCategory(null)
            setQuery(e.target.value)
          }}
          placeholder="Buscar alimento..."
          className="w-full bg-[#1E1E2E] border border-[#2E2E3E] rounded-xl pl-10 pr-10 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
        {(query || selectedCategory) && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-slate-700 rounded-full"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        )}
      </div>

      {/* Search results */}
      <AnimatePresence>
        {isSearching && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            <h4 className="text-sm font-medium text-slate-400">Resultados</h4>
            {searchResults.length === 0 ? (
              <div className="py-4 text-center space-y-3">
                <p className="text-sm text-slate-500">
                  Nenhum alimento encontrado para "{query || selectedCategory}"
                </p>
                {showAddCustom && query && (
                  <button
                    onClick={() => onAddCustomFood?.(query)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500/20 border border-violet-500/30 text-violet-400 rounded-lg hover:bg-violet-500/30 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar "{query}" manualmente
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {searchResults.map((food) => (
                  <FoodItem key={food.id} food={food} onClick={handleSelect} />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recent foods */}
      {!isSearching && filteredRecent.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-slate-400 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Recentes
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {filteredRecent.slice(0, 5).map((food) => (
              <FoodItem key={food.id} food={food} onClick={handleSelect} />
            ))}
          </div>
        </div>
      )}

      {/* Favorites */}
      {!isSearching && filteredFavorites.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-slate-400 flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-400" />
            Favoritos
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {filteredFavorites.slice(0, 5).map((food) => (
              <FoodItem key={food.id} food={food} onClick={handleSelect} />
            ))}
          </div>
        </div>
      )}

      {/* Categories */}
      {!isSearching && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-slate-400">Categorias</h4>
          <div className="grid grid-cols-4 gap-2">
            {Object.entries(foodCategoryLabels).slice(0, 8).map(([key, { label, icon }]) => (
              <button
                key={key}
                onClick={() => handleCategoryClick(key as FoodCategory)}
                className="flex flex-col items-center gap-1 p-3 bg-slate-800/50 rounded-xl hover:bg-slate-800 transition-colors"
              >
                <span className="text-xl">{icon}</span>
                <span className="text-xs text-slate-400 text-center">{label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Food item component
interface FoodItemProps {
  food: Food
  onClick: (food: Food) => void
}

function FoodItem({ food, onClick }: FoodItemProps) {
  const categoryInfo = foodCategoryLabels[food.categoria]

  return (
    <motion.button
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      onClick={() => onClick(food)}
      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left ${
        food.is_user_created
          ? 'bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/30'
          : 'bg-slate-800/50 hover:bg-slate-800'
      }`}
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
          {food.is_favorite && (
            <Star className="w-3 h-3 text-amber-400 fill-amber-400 flex-shrink-0" />
          )}
        </div>
        <p className="text-sm text-slate-400">
          {food.porcao_padrao}{food.unidade} • {food.calorias} kcal • {food.proteinas}g prot
        </p>
      </div>
    </motion.button>
  )
}
