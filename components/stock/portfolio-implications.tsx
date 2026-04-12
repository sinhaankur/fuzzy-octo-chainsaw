'use client'

import { ArrowRight, BrainCircuit } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import type { HoldingImplication } from '@/lib/market-intelligence'

interface PortfolioImplicationsProps {
  implications: HoldingImplication[]
}

export function PortfolioImplications({ implications }: PortfolioImplicationsProps) {
  return (
    <Card className="border-border bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <BrainCircuit className="h-5 w-5 text-primary" />
          Position Implications
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {implications.map((implication) => (
          <div key={implication.symbol} className="rounded-xl border border-border bg-secondary/30 p-4">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">{implication.symbol}</span>
                  <Badge variant="outline" className={stanceClassName(implication.stance)}>
                    {implication.stance}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{implication.name}</p>
              </div>
              <span className="text-sm font-medium text-foreground">{implication.conviction}%</span>
            </div>

            <div className="mb-3 flex items-center gap-3">
              <Progress value={implication.conviction} className="h-2 flex-1" />
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <ArrowRight className="h-3.5 w-3.5" />
                linked to {implication.linkedEventIds.length} events
              </span>
            </div>

            <p className="mb-2 text-sm font-medium text-foreground">{implication.headline}</p>
            <div className="space-y-1">
              {implication.reasoning.map((line) => (
                <p key={line} className="text-xs text-muted-foreground">
                  {line}
                </p>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function stanceClassName(stance: HoldingImplication['stance']) {
  if (stance === 'bullish') return 'border-primary/30 bg-primary/10 text-primary'
  if (stance === 'bearish') return 'border-destructive/30 bg-destructive/10 text-destructive'
  return 'border-border bg-background text-muted-foreground'
}