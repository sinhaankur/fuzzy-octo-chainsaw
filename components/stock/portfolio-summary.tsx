'use client'

import { TrendingUp, TrendingDown, Wallet, BarChart3, Activity } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Stock } from '@/lib/stock-data'

interface PortfolioSummaryProps {
  stocks: Stock[]
}

export function PortfolioSummary({ stocks }: PortfolioSummaryProps) {
  const totalValue = stocks.reduce((sum, stock) => sum + stock.totalValue, 0)
  const totalChange = stocks.reduce(
    (sum, stock) => sum + stock.change * stock.shares,
    0,
  )
  const previousValue = totalValue - totalChange
  const avgChangePercent = previousValue > 0 ? (totalChange / previousValue) * 100 : 0

  const gainers = stocks.filter((s) => s.change > 0).length
  const losers = stocks.filter((s) => s.change < 0).length

  const isPositive = totalChange >= 0

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card className="bg-card/80 backdrop-blur-sm border-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground">Portfolio Value</span>
          </div>
          <p className="text-2xl font-mono font-semibold">${totalValue.toFixed(2)}</p>
        </CardContent>
      </Card>

      <Card className="bg-card/80 backdrop-blur-sm border-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                isPositive ? 'bg-primary/10' : 'bg-destructive/10'
              }`}
            >
              {isPositive ? (
                <TrendingUp className="w-4 h-4 text-primary" />
              ) : (
                <TrendingDown className="w-4 h-4 text-destructive" />
              )}
            </div>
            <span className="text-sm text-muted-foreground">Today&apos;s Change</span>
          </div>
          <p
            className={`text-2xl font-mono font-semibold ${
              isPositive ? 'text-primary' : 'text-destructive'
            }`}
          >
            {isPositive ? '+' : ''}
            {avgChangePercent.toFixed(2)}%
          </p>
        </CardContent>
      </Card>

      <Card className="bg-card/80 backdrop-blur-sm border-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground">Gainers</span>
          </div>
          <p className="text-2xl font-mono font-semibold text-primary">{gainers}</p>
        </CardContent>
      </Card>

      <Card className="bg-card/80 backdrop-blur-sm border-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
              <Activity className="w-4 h-4 text-destructive" />
            </div>
            <span className="text-sm text-muted-foreground">Losers</span>
          </div>
          <p className="text-2xl font-mono font-semibold text-destructive">{losers}</p>
        </CardContent>
      </Card>
    </div>
  )
}
