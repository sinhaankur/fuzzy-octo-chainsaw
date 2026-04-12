'use client'

import { TrendingUp, TrendingDown, MoreHorizontal, X } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Stock } from '@/lib/stock-data'
import { MiniChart } from './mini-chart'

interface StockCardProps {
  stock: Stock
  onClick: () => void
  onRemove: () => void
}

export function StockCard({ stock, onClick, onRemove }: StockCardProps) {
  const isPositive = stock.change >= 0

  return (
    <Card
      className="group cursor-pointer hover:border-primary/50 transition-all duration-200 bg-card/80 backdrop-blur-sm"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-sm font-bold">
              {stock.symbol.slice(0, 2)}
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{stock.symbol}</h3>
              <p className="text-xs text-muted-foreground truncate max-w-[120px]">
                {stock.name}
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  onRemove()
                }}
                className="text-destructive"
              >
                <X className="w-4 h-4 mr-2" />
                Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="h-16 mb-3">
          <MiniChart data={stock.priceHistory} isPositive={isPositive} />
        </div>

        <div className="flex items-end justify-between">
          <div>
            <p className="text-2xl font-mono font-semibold">
              ${stock.price.toFixed(2)}
            </p>
            <div
              className={`flex items-center gap-1 text-sm ${
                isPositive ? 'text-primary' : 'text-destructive'
              }`}
            >
              {isPositive ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" />
              )}
              <span className="font-mono">
                {isPositive ? '+' : ''}
                {stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
              </span>
            </div>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <p>Vol: {stock.volume}</p>
            <p>Cap: ${stock.marketCap}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
