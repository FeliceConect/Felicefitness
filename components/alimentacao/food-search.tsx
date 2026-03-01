"use client"

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Star, Clock, X, Plus } from 'lucide-react'
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
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-foreground-muted" />
        <input
          type="text"
          value={selectedCategory ? foodCategoryLabels[selectedCategory].label : query}
          onChange={(e) => {
            setSelectedCategory(null)
            setQuery(e.target.value)
          }}
          placeholder="Buscar alimento..."
          className="w-full bg-white border border-border rounded-xl pl-10 pr-10 py-3 text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-dourado"
        />
        {(query || selectedCategory) && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-background-elevated rounded-full"
          >
            <X className="w-4 h-4 text-foreground-muted" />
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
            <h4 className="text-sm font-medium text-foreground-secondary">Resultados</h4>
            {searchResults.length === 0 ? (
              <div className="py-4 text-center space-y-3">
                <p className="text-sm text-foreground-muted">
                  Nenhum alimento encontrado para &ldquo;{query || selectedCategory}&rdquo;
                </p>
                {showAddCustom && query && (
                  <button
                    onClick={() => onAddCustomFood?.(query)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-dourado/20 border border-dourado/30 text-dourado rounded-lg hover:bg-dourado/30 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar &ldquo;{query}&rdquo; manualmente
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
          <h4 className="text-sm font-medium text-foreground-secondary flex items-center gap-2">
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
          <h4 className="text-sm font-medium text-foreground-secondary flex items-center gap-2">
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
          <h4 className="text-sm font-medium text-foreground-secondary">Categorias</h4>
          <div className="grid grid-cols-4 gap-2">
            {Object.entries(foodCategoryLabels).slice(0, 8).map(([key, { label, icon }]) => (
              <button
                key={key}
                onClick={() => handleCategoryClick(key as FoodCategory)}
                className="flex flex-col items-center gap-1 p-3 bg-white/50 rounded-xl hover:bg-white transition-colors"
              >
                <span className="text-xl">{icon}</span>
                <span className="text-xs text-foreground-secondary text-center">{label}</span>
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
          ? 'bg-dourado/10 hover:bg-dourado/20 border border-dourado/30'
          : 'bg-white/50 hover:bg-white'
      }`}
    >
      <span className="text-xl">{categoryInfo.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-foreground font-medium truncate">{food.nome}</p>
          {food.is_user_created && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-dourado/20 text-dourado flex-shrink-0">
              Meu
            </span>
          )}
          {food.is_favorite && (
            <Star className="w-3 h-3 text-amber-400 fill-amber-400 flex-shrink-0" />
          )}
        </div>
        <p className="text-sm text-foreground-secondary">
          {food.porcao_padrao}{food.unidade} • {food.calorias} kcal • {food.proteinas}g prot
        </p>
      </div>
    </motion.button>
  )
}
