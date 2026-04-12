'use client'

import {
  TrendingUp,
  TrendingDown,
  Globe,
  BarChart3,
  Newspaper,
  MessageCircle,
  Target,
  AlertCircle,
  CheckCircle,
  MinusCircle,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Stock } from '@/lib/stock-data'
import { StockChart } from './stock-chart'

interface StockDetailModalProps {
  stock: Stock | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function StockDetailModal({
  stock,
  open,
  onOpenChange,
}: StockDetailModalProps) {
  if (!stock) return null

  const isPositive = stock.change >= 0

  const getImpactIcon = (impact: 'positive' | 'negative' | 'neutral') => {
    switch (impact) {
      case 'positive':
        return <CheckCircle className="w-4 h-4 text-primary" />
      case 'negative':
        return <AlertCircle className="w-4 h-4 text-destructive" />
      default:
        return <MinusCircle className="w-4 h-4 text-muted-foreground" />
    }
  }

  const getSentimentColor = (sentiment: 'bullish' | 'bearish' | 'neutral') => {
    switch (sentiment) {
      case 'bullish':
        return 'bg-primary/10 text-primary border-primary/20'
      case 'bearish':
        return 'bg-destructive/10 text-destructive border-destructive/20'
      default:
        return 'bg-muted text-muted-foreground border-muted'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-lg font-bold">
                {stock.symbol.slice(0, 2)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{stock.symbol}</span>
                  <Badge variant="outline" className="text-xs">
                    {stock.exchange}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground font-normal">
                  {stock.name}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-mono font-semibold">
                ${stock.price.toFixed(2)}
              </p>
              <div
                className={`flex items-center justify-end gap-1 ${
                  isPositive ? 'text-primary' : 'text-destructive'
                }`}
              >
                {isPositive ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                <span className="font-mono">
                  {isPositive ? '+' : ''}
                  {stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
                </span>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="mt-4">
          <TabsList className="grid w-full grid-cols-3 bg-secondary/50">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="chart">Chart</TabsTrigger>
            <TabsTrigger value="global">Global Impact</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4 space-y-4">
            {/* Key Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard label="Day High" value={`$${stock.dayHigh.toFixed(2)}`} />
              <StatCard label="Day Low" value={`$${stock.dayLow.toFixed(2)}`} />
              <StatCard label="52W High" value={`$${stock.weekHigh52.toFixed(2)}`} />
              <StatCard label="52W Low" value={`$${stock.weekLow52.toFixed(2)}`} />
              <StatCard label="Volume" value={stock.volume} />
              <StatCard label="Market Cap" value={`$${stock.marketCap}`} />
              <StatCard label="P/E Ratio" value={stock.pe.toFixed(2)} />
              <StatCard label="EPS" value={`$${stock.eps.toFixed(2)}`} />
            </div>

            {/* Sector & Dividend */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="bg-secondary/30 border-border">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">Sector</p>
                  <p className="font-medium">{stock.sector}</p>
                </CardContent>
              </Card>
              <Card className="bg-secondary/30 border-border">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">
                    Dividend Yield
                  </p>
                  <p className="font-medium">{stock.dividendYield.toFixed(2)}%</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="chart" className="mt-4">
            <Card className="bg-secondary/30 border-border">
              <CardContent className="p-4">
                <div className="h-80">
                  <StockChart data={stock.priceHistory} isPositive={isPositive} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="global" className="mt-4 space-y-4">
            {/* Sentiment & Scores */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="bg-secondary/30 border-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Globe className="w-4 h-4 text-accent" />
                    <p className="text-xs text-muted-foreground">Sentiment</p>
                  </div>
                  <Badge
                    variant="outline"
                    className={`capitalize ${getSentimentColor(
                      stock.globalImpact.sentiment
                    )}`}
                  >
                    {stock.globalImpact.sentiment}
                  </Badge>
                </CardContent>
              </Card>

              <Card className="bg-secondary/30 border-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Newspaper className="w-4 h-4 text-accent" />
                    <p className="text-xs text-muted-foreground">News</p>
                  </div>
                  <p className="font-mono font-medium">
                    {stock.globalImpact.newsCount} articles
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-secondary/30 border-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageCircle className="w-4 h-4 text-accent" />
                    <p className="text-xs text-muted-foreground">Social Score</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={stock.globalImpact.socialScore}
                      className="h-2 flex-1"
                    />
                    <span className="font-mono text-sm">
                      {stock.globalImpact.socialScore}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-secondary/30 border-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-accent" />
                    <p className="text-xs text-muted-foreground">Price Target</p>
                  </div>
                  <p className="font-mono font-medium">
                    ${stock.globalImpact.priceTarget.toFixed(2)}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Analyst Rating */}
            <Card className="bg-secondary/30 border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Analyst Rating
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge
                  variant="outline"
                  className={`text-lg px-4 py-1 ${
                    stock.globalImpact.analystRating.includes('Buy')
                      ? 'bg-primary/10 text-primary border-primary/20'
                      : stock.globalImpact.analystRating.includes('Sell')
                      ? 'bg-destructive/10 text-destructive border-destructive/20'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {stock.globalImpact.analystRating}
                </Badge>
              </CardContent>
            </Card>

            {/* Economic Factors */}
            <Card className="bg-secondary/30 border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Economic Factors
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {stock.globalImpact.economicFactors.map((factor, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/30"
                  >
                    {getImpactIcon(factor.impact)}
                    <div className="flex-1">
                      <p className="font-medium text-sm">{factor.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {factor.description}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`capitalize text-xs ${
                        factor.impact === 'positive'
                          ? 'text-primary border-primary/30'
                          : factor.impact === 'negative'
                          ? 'text-destructive border-destructive/30'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {factor.impact}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Related Markets */}
            <Card className="bg-secondary/30 border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Related Markets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  {stock.globalImpact.relatedMarkets.map((market, i) => (
                    <div key={i} className="p-3 rounded-lg bg-muted/30 text-center">
                      <p className="text-sm font-medium mb-1">{market.name}</p>
                      <p
                        className={`font-mono text-sm ${
                          market.change >= 0
                            ? 'text-primary'
                            : 'text-destructive'
                        }`}
                      >
                        {market.change >= 0 ? '+' : ''}
                        {market.change.toFixed(2)}%
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Correlation: {(market.correlation * 100).toFixed(0)}%
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="bg-secondary/30 border-border">
      <CardContent className="p-3">
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <p className="font-mono font-medium">{value}</p>
      </CardContent>
    </Card>
  )
}
