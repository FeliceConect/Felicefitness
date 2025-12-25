'use client'

import { useState } from 'react'
import { useSupplementStock } from '@/hooks/use-supplement-stock'
import { AppHeader } from '@/components/layout/app-header'
import { BottomNav } from '@/components/layout/bottom-nav'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { StockList, StockAlert } from '@/components/supplements'
import { Package, ShoppingCart, Plus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export default function EstoquePage() {
  const { stockLevels, lowStockItems, isLoading, updateStock, addStock } = useSupplementStock()
  const [restockOpen, setRestockOpen] = useState(false)
  const [selectedSupplement, setSelectedSupplement] = useState<string | null>(null)
  const [restockAmount, setRestockAmount] = useState('')

  const handleUpdateStock = async (supplementId: string, newQuantity: number) => {
    try {
      await updateStock(supplementId, newQuantity)
    } catch (error) {
      console.error('Error updating stock:', error)
    }
  }

  const handleRestock = async () => {
    if (!selectedSupplement || !restockAmount) return

    try {
      await addStock(selectedSupplement, parseInt(restockAmount))
      setRestockOpen(false)
      setSelectedSupplement(null)
      setRestockAmount('')
    } catch (error) {
      console.error('Error restocking:', error)
    }
  }

  const generateShoppingList = () => {
    const items = lowStockItems.map(item => `- ${item.supplement.nome}: ${item.quantity} restantes`)
    const text = `Lista de Compras - Suplementos\n\n${items.join('\n')}`

    if (navigator.share) {
      navigator.share({ title: 'Lista de Compras', text })
    } else {
      navigator.clipboard.writeText(text)
      alert('Lista copiada para a área de transferência!')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader title="Estoque" showBack />
        <main className="container max-w-lg mx-auto px-4 py-6 pb-24 space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-64 w-full" />
        </main>
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        title="Estoque"
        showBack
        rightContent={
          lowStockItems.length > 0 && (
            <Button variant="ghost" size="icon" onClick={generateShoppingList}>
              <ShoppingCart className="h-5 w-5" />
            </Button>
          )
        }
      />

      <main className="container max-w-lg mx-auto px-4 py-6 pb-24 space-y-6">
        {/* Low Stock Alert */}
        {lowStockItems.length > 0 && (
          <StockAlert stockLevels={lowStockItems} />
        )}

        {/* Summary Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4" />
              Resumo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{stockLevels.length}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-500">
                  {stockLevels.filter(s => s.status === 'ok').length}
                </p>
                <p className="text-xs text-muted-foreground">OK</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-500">
                  {lowStockItems.length}
                </p>
                <p className="text-xs text-muted-foreground">Baixo</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stock List */}
        <StockList
          stockLevels={stockLevels}
          onUpdateStock={handleUpdateStock}
        />

        {/* Restock Dialog */}
        <Dialog open={restockOpen} onOpenChange={setRestockOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reabastecer Estoque</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Suplemento</label>
                <select
                  value={selectedSupplement || ''}
                  onChange={e => setSelectedSupplement(e.target.value)}
                  className="w-full h-10 rounded-md border bg-background px-3"
                >
                  <option value="">Selecione...</option>
                  {stockLevels.map(item => (
                    <option key={item.supplement.id} value={item.supplement.id}>
                      {item.supplement.nome} ({item.quantity} atuais)
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Quantidade a adicionar</label>
                <Input
                  type="number"
                  min="1"
                  value={restockAmount}
                  onChange={e => setRestockAmount(e.target.value)}
                  placeholder="Ex: 30"
                />
              </div>

              <Button
                className="w-full"
                onClick={handleRestock}
                disabled={!selectedSupplement || !restockAmount}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar ao Estoque
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Restock Button */}
        <Button
          className="w-full"
          variant="outline"
          onClick={() => setRestockOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Reabastecer Estoque
        </Button>
      </main>

      <BottomNav />
    </div>
  )
}
