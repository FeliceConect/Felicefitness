'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { StockLevel } from '@/types/supplements'
import { getSupplementTypeIcon, getStockStatusColor } from '@/lib/supplements/calculations'
import { Package, Plus, Minus, AlertTriangle } from 'lucide-react'

interface StockListProps {
  stockLevels: StockLevel[]
  onUpdateStock: (supplementId: string, newQuantity: number) => void
  className?: string
}

export function StockList({ stockLevels, onUpdateStock, className }: StockListProps) {
  const sortedLevels = [...stockLevels].sort((a, b) => {
    // Critical first, then low, then ok
    const statusOrder = { critical: 0, low: 1, ok: 2 }
    return statusOrder[a.status] - statusOrder[b.status]
  })

  return (
    <Card className={cn(className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Package className="h-4 w-4" />
          Controle de Estoque
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {sortedLevels.map(item => {
          const icon = getSupplementTypeIcon(item.supplement.tipo)
          const statusColor = getStockStatusColor(item.status)

          return (
            <div
              key={item.supplement.id}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg border',
                item.status === 'critical' && 'border-red-500/50 bg-red-500/5',
                item.status === 'low' && 'border-orange-500/50 bg-orange-500/5'
              )}
            >
              {/* Icon */}
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                style={{ backgroundColor: `${item.supplement.cor}20` }}
              >
                {icon}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium truncate">{item.supplement.nome}</p>
                  {item.status === 'critical' && (
                    <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className={cn('font-medium', statusColor)}>
                    {item.quantity} unidades
                  </span>
                  <span className="text-muted-foreground">
                    ({item.daysRemaining > 30 ? '+30' : item.daysRemaining} dias)
                  </span>
                </div>
              </div>

              {/* Quick adjust buttons */}
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onUpdateStock(item.supplement.id, Math.max(0, item.quantity - 1))}
                  disabled={item.quantity === 0}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-10 text-center font-medium">{item.quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onUpdateStock(item.supplement.id, item.quantity + 1)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )
        })}

        {sortedLevels.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum suplemento cadastrado</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
