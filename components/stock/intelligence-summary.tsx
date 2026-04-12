'use client'

import { AlertTriangle, Globe2, Radar, ShieldAlert } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import type { HoldingImplication, RegionRiskSummary, WorldAffairsEvent } from '@/lib/market-intelligence'
import type { Stock } from '@/lib/stock-data'

interface IntelligenceSummaryProps {
  stocks: Stock[]
  events: WorldAffairsEvent[]
  regionRisks: RegionRiskSummary[]
  implications: HoldingImplication[]
  generatedAt?: string
}

export function IntelligenceSummary({
  stocks,
  events,
  regionRisks,
  implications,
  generatedAt,
}: IntelligenceSummaryProps) {
  const highRiskRegions = regionRisks.filter((region) => region.score >= 60).length
  const exposedHoldings = implications.filter((implication) => implication.conviction >= 60).length
  const bearishEvents = events.filter((event) => event.marketView === 'bearish').length
  const latestStamp = generatedAt ? new Date(generatedAt).toLocaleTimeString() : null

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Global Stock Intelligence
        </h1>
        <p className="text-sm text-muted-foreground">
          A market-first dashboard that links holdings to policy, conflict, trade, and supply-chain developments.
          {latestStamp ? ` Refreshed at ${latestStamp}.` : ''}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <MetricCard
          icon={Globe2}
          label="Active Global Drivers"
          value={events.length.toString()}
          tone="neutral"
          detail="Policy, trade, energy and conflict signals"
        />
        <MetricCard
          icon={Radar}
          label="Watchlist Exposure"
          value={`${exposedHoldings}/${stocks.length}`}
          tone="neutral"
          detail="Holdings with elevated macro sensitivity"
        />
        <MetricCard
          icon={ShieldAlert}
          label="High-Risk Regions"
          value={highRiskRegions.toString()}
          tone={highRiskRegions > 0 ? 'negative' : 'positive'}
          detail="Regions demanding position-level attention"
        />
        <MetricCard
          icon={AlertTriangle}
          label="Bearish Catalysts"
          value={bearishEvents.toString()}
          tone={bearishEvents > 0 ? 'negative' : 'positive'}
          detail="Headwinds currently dominating the tape"
        />
      </div>
    </section>
  )
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  detail: string
  tone: 'positive' | 'negative' | 'neutral'
}) {
  const toneClass =
    tone === 'positive'
      ? 'bg-primary/10 text-primary'
      : tone === 'negative'
        ? 'bg-destructive/10 text-destructive'
        : 'bg-secondary text-foreground'

  return (
    <Card className="border-border bg-card/80 backdrop-blur-sm">
      <CardContent className="p-4">
        <div className="mb-3 flex items-center gap-2">
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${toneClass}`}>
            <Icon className="h-4 w-4" />
          </div>
          <span className="text-sm text-muted-foreground">{label}</span>
        </div>
        <p className="text-2xl font-semibold tracking-tight text-foreground">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  )
}