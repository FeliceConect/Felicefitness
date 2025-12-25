'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { InsightCard } from './insight-card'
import { RefreshCw, Sparkles } from 'lucide-react'
import type { Insight, InsightType, InsightCategory } from '@/types/insights'
import { cn } from '@/lib/utils'

interface InsightsFeedProps {
  insights: Insight[]
  onDismiss?: (id: string) => void
  onMarkAsRead?: (id: string) => void
  onRefresh?: () => Promise<void>
  onGenerate?: () => Promise<void>
  loading?: boolean
  generating?: boolean
}

const filterTabs: { id: string; label: string; icon: string; filter: Partial<{ types: InsightType[]; categories: InsightCategory[] }> }[] = [
  { id: 'all', label: 'Todos', icon: '📋', filter: {} },
  { id: 'alerts', label: 'Alertas', icon: '🔴', filter: { types: ['alert'] } },
  { id: 'tips', label: 'Dicas', icon: '💡', filter: { types: ['recommendation', 'optimization'] } },
  { id: 'trends', label: 'Tendências', icon: '📈', filter: { types: ['trend', 'pattern'] } },
  { id: 'goals', label: 'Metas', icon: '🎯', filter: { types: ['prediction', 'milestone'] } },
]

export function InsightsFeed({
  insights,
  onDismiss,
  onMarkAsRead,
  onRefresh,
  onGenerate,
  loading = false,
  generating = false,
}: InsightsFeedProps) {
  const [activeFilter, setActiveFilter] = useState('all')

  const filteredInsights = insights.filter((insight) => {
    const filter = filterTabs.find((t) => t.id === activeFilter)?.filter
    if (!filter || Object.keys(filter).length === 0) return true

    if (filter.types && !filter.types.includes(insight.type)) return false
    if (filter.categories && !filter.categories.includes(insight.category)) return false

    return true
  })

  // Agrupar por prioridade
  const criticalInsights = filteredInsights.filter((i) => i.priority === 'critical')
  const highInsights = filteredInsights.filter((i) => i.priority === 'high')
  const otherInsights = filteredInsights.filter(
    (i) => i.priority !== 'critical' && i.priority !== 'high'
  )

  return (
    <div className="space-y-4">
      {/* Header com ações */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {filterTabs.map((tab) => (
            <Button
              key={tab.id}
              variant={activeFilter === tab.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveFilter(tab.id)}
              className="whitespace-nowrap"
            >
              <span className="mr-1">{tab.icon}</span>
              {tab.label}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {onRefresh && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onRefresh}
              disabled={loading}
            >
              <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
            </Button>
          )}
          {onGenerate && (
            <Button
              variant="outline"
              size="sm"
              onClick={onGenerate}
              disabled={generating}
            >
              <Sparkles className={cn('w-4 h-4 mr-1', generating && 'animate-pulse')} />
              {generating ? 'Gerando...' : 'Gerar'}
            </Button>
          )}
        </div>
      </div>

      {/* Alertas críticos */}
      {criticalInsights.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            Alertas Críticos
          </h3>
          {criticalInsights.map((insight) => (
            <InsightCard
              key={insight.id}
              insight={insight}
              onDismiss={onDismiss}
              onMarkAsRead={onMarkAsRead}
            />
          ))}
        </div>
      )}

      {/* Alertas de alta prioridade */}
      {highInsights.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-orange-600 dark:text-orange-400">
            Atenção Necessária
          </h3>
          {highInsights.map((insight) => (
            <InsightCard
              key={insight.id}
              insight={insight}
              onDismiss={onDismiss}
              onMarkAsRead={onMarkAsRead}
            />
          ))}
        </div>
      )}

      {/* Outros insights */}
      {otherInsights.length > 0 && (
        <div className="space-y-2">
          {(criticalInsights.length > 0 || highInsights.length > 0) && (
            <h3 className="text-sm font-semibold text-muted-foreground">
              Outros Insights
            </h3>
          )}
          {otherInsights.map((insight) => (
            <InsightCard
              key={insight.id}
              insight={insight}
              onDismiss={onDismiss}
              onMarkAsRead={onMarkAsRead}
            />
          ))}
        </div>
      )}

      {/* Estado vazio */}
      {filteredInsights.length === 0 && !loading && (
        <Card>
          <CardContent className="py-8 text-center">
            <div className="text-4xl mb-2">🎯</div>
            <p className="text-muted-foreground">
              {activeFilter === 'all'
                ? 'Nenhum insight disponível no momento'
                : 'Nenhum insight nesta categoria'}
            </p>
            {onGenerate && (
              <Button variant="outline" className="mt-4" onClick={onGenerate}>
                <Sparkles className="w-4 h-4 mr-2" />
                Gerar insights
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-muted rounded" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
