'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { StockLevel } from '@/types/supplements'
import { AlertTriangle, Package, ShoppingCart } from 'lucide-react'
import Link from 'next/link'

interface StockAlertProps {
  stockLevels: StockLevel[]
  className?: string
}

export function StockAlert({ stockLevels, className }: StockAlertProps) {
  const criticalItems = stockLevels.filter(s => s.status === 'critical')
  const lowItems = stockLevels.filter(s => s.status === 'low')

  if (criticalItems.length === 0 && lowItems.length === 0) {
    return null
  }

  return (
    <Card className={cn('border-orange-500/50 bg-orange-500/5', className)}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-medium text-orange-600 dark:text-orange-400">
              Estoque Baixo
            </p>
            <p className="text-sm text-muted-foreground mb-3">
              {criticalItems.length > 0 && (
                <>
                  {criticalItems.length} item{criticalItems.length > 1 ? 's' : ''} crítico
                  {criticalItems.length > 1 ? 's' : ''}
                </>
              )}
              {criticalItems.length > 0 && lowItems.length > 0 && ', '}
              {lowItems.length > 0 && (
                <>
                  {lowItems.length} com estoque baixo
                </>
              )}
            </p>

            {/* Critical items list */}
            {criticalItems.length > 0 && (
              <div className="space-y-2 mb-3">
                {criticalItems.slice(0, 3).map(item => (
                  <div
                    key={item.supplement.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="font-medium text-red-500">{item.supplement.nome}</span>
                    <span className="text-muted-foreground">
                      {item.quantity} restante{item.quantity !== 1 ? 's' : ''}
                    </span>
                  </div>
                ))}
                {criticalItems.length > 3 && (
                  <p className="text-xs text-muted-foreground">
                    +{criticalItems.length - 3} mais...
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/suplementos/estoque">
                  <Package className="h-4 w-4 mr-1" />
                  Ver Estoque
                </Link>
              </Button>
              <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
                <ShoppingCart className="h-4 w-4 mr-1" />
                Lista de Compras
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
