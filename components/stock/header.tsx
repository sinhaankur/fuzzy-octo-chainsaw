'use client'

import { TrendingUp, Bell, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MarketIndex } from '@/lib/stock-data'

interface HeaderProps {
  marketIndices: MarketIndex[]
  onSearch: (query: string) => void
  searchQuery: string
}

export function Header({ marketIndices, onSearch, searchQuery }: HeaderProps) {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <span className="text-xl font-semibold tracking-tight">StockPulse Intelligence</span>
              <p className="text-xs text-muted-foreground">Stocks x world affairs</p>
            </div>
          </div>

          {/* Market Indices Ticker */}
          <div className="hidden lg:flex items-center gap-6 text-sm">
            {marketIndices.map((index) => (
              <div key={index.name} className="flex items-center gap-2">
                <span className="text-muted-foreground">{index.name}</span>
                <span className="font-mono">{index.value.toLocaleString()}</span>
                <span
                  className={`font-mono text-xs ${
                    index.change >= 0 ? 'text-primary' : 'text-destructive'
                  }`}
                >
                  {index.change >= 0 ? '+' : ''}
                  {index.changePercent.toFixed(2)}%
                </span>
              </div>
            ))}
          </div>

          {/* Search & Actions */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search holdings, countries, sectors..."
                value={searchQuery}
                onChange={(e) => onSearch(e.target.value)}
                className="pl-9 w-48 md:w-64 bg-secondary/50 border-border"
              />
            </div>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-primary rounded-full" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
