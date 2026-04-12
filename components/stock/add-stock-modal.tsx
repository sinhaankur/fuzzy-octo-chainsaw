'use client'

import { useState } from 'react'
import { Search, Plus, TrendingUp } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { popularStocks } from '@/lib/stock-data'

interface AddStockModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddStock: (symbol: string, name: string) => void
  existingSymbols: string[]
}

export function AddStockModal({
  open,
  onOpenChange,
  onAddStock,
  existingSymbols,
}: AddStockModalProps) {
  const [search, setSearch] = useState('')
  const [customSymbol, setCustomSymbol] = useState('')
  const [customName, setCustomName] = useState('')

  const filteredStocks = popularStocks.filter(
    (stock) =>
      !existingSymbols.includes(stock.symbol) &&
      (stock.symbol.toLowerCase().includes(search.toLowerCase()) ||
        stock.name.toLowerCase().includes(search.toLowerCase()))
  )

  const handleAddCustom = () => {
    if (customSymbol && customName) {
      onAddStock(customSymbol.toUpperCase(), customName)
      setCustomSymbol('')
      setCustomName('')
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <TrendingUp className="w-5 h-5 text-primary" />
            Add Stock to Watchlist
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search popular stocks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-secondary/50"
            />
          </div>

          {/* Popular Stocks */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Popular Stocks</p>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-2">
              {filteredStocks.map((stock) => (
                <button
                  key={stock.symbol}
                  onClick={() => {
                    onAddStock(stock.symbol, stock.name)
                    onOpenChange(false)
                  }}
                  className="flex items-center gap-2 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors text-left group"
                >
                  <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center text-xs font-bold">
                    {stock.symbol.slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{stock.symbol}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {stock.name}
                    </p>
                  </div>
                  <Plus className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <Badge variant="secondary" className="bg-card">
                or add custom
              </Badge>
            </div>
          </div>

          {/* Custom Stock */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Symbol (e.g., AAPL)"
                value={customSymbol}
                onChange={(e) => setCustomSymbol(e.target.value.toUpperCase())}
                className="bg-secondary/50"
                maxLength={5}
              />
              <Input
                placeholder="Company Name"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="bg-secondary/50"
              />
            </div>
            <Button
              onClick={handleAddCustom}
              disabled={!customSymbol || !customName}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Custom Stock
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
