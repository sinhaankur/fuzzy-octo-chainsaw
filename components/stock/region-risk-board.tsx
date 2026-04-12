'use client'

import { Globe2, Orbit, ShieldAlert } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import type { RegionRiskSummary, SectorPulse } from '@/lib/market-intelligence'

interface RegionRiskBoardProps {
  regionRisks: RegionRiskSummary[]
  sectorPulse: SectorPulse[]
}

export function RegionRiskBoard({ regionRisks, sectorPulse }: RegionRiskBoardProps) {
  return (
    <section className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
      <Card className="border-border bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldAlert className="h-5 w-5 text-primary" />
            Regional Risk Radar
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {regionRisks.map((region) => (
            <div key={region.region} className="rounded-xl border border-border bg-secondary/30 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-foreground">{region.region}</p>
                  <p className="text-xs text-muted-foreground">
                    {region.exposureCount} watchlist exposures
                  </p>
                </div>
                <Badge variant="outline" className={trendClassName(region.trend)}>
                  {region.trend}
                </Badge>
              </div>
              <div className="mb-3 flex items-center gap-3">
                <Progress value={region.score} className="h-2 flex-1" />
                <span className="w-9 text-right text-sm font-medium text-foreground">
                  {region.score}
                </span>
              </div>
              <div className="space-y-1">
                {region.drivers.map((driver) => (
                  <p key={driver} className="text-xs text-muted-foreground">
                    {driver}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-border bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Orbit className="h-5 w-5 text-primary" />
            Sector Transmission
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {sectorPulse.map((sector) => (
            <div key={sector.sector} className="rounded-xl border border-border bg-secondary/30 p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-foreground">{sector.sector}</p>
                  <p className="text-xs text-muted-foreground">
                    {sector.exposedHoldings} holdings exposed
                  </p>
                </div>
                <Badge variant="outline" className={viewClassName(sector.dominantView)}>
                  {sector.dominantView}
                </Badge>
              </div>
              <div className="mb-2 flex items-center gap-3">
                <Progress value={Math.min(100, Math.abs(sector.averageImpact) + 10)} className="h-2 flex-1" />
                <span className="w-10 text-right text-sm font-medium text-foreground">
                  {sector.averageImpact}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {sector.linkedRegions.map((region) => (
                  <Badge key={region} variant="secondary" className="text-xs">
                    <Globe2 className="mr-1 h-3 w-3" />
                    {region}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  )
}

function trendClassName(trend: RegionRiskSummary['trend']) {
  if (trend === 'rising') return 'border-destructive/30 bg-destructive/10 text-destructive'
  if (trend === 'easing') return 'border-primary/30 bg-primary/10 text-primary'
  return 'border-border bg-background text-muted-foreground'
}

function viewClassName(view: SectorPulse['dominantView']) {
  if (view === 'bearish') return 'border-destructive/30 bg-destructive/10 text-destructive'
  if (view === 'bullish') return 'border-primary/30 bg-primary/10 text-primary'
  return 'border-border bg-background text-muted-foreground'
}