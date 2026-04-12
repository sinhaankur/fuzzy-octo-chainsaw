'use client'

import { ArrowUpRight, Factory, Globe2, ShipWheel, Siren, Zap } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { WorldAffairsEvent } from '@/lib/market-intelligence'

interface WorldAffairsFeedProps {
  events: WorldAffairsEvent[]
}

export function WorldAffairsFeed({ events }: WorldAffairsFeedProps) {
  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">World Affairs Feed</h2>
          <p className="text-sm text-muted-foreground">
            The geopolitical and macro stories with the clearest transmission into the watchlist.
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        {events.map((event) => (
          <Card key={event.id} className="border-border bg-card/80 backdrop-blur-sm">
            <CardHeader className="space-y-3 pb-3">
              <div className="flex items-start justify-between gap-3">
                <Badge variant="outline" className={severityClassName(event.severity)}>
                  {event.severity} risk
                </Badge>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  {iconForCategory(event.category)}
                  <span>{event.region}</span>
                </div>
              </div>
              <CardTitle className="text-base leading-snug">{event.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{event.summary}</p>

              <div className="flex flex-wrap gap-2">
                {event.affectedSectors.slice(0, 3).map((sector) => (
                  <Badge key={sector} variant="secondary" className="text-xs">
                    {sector}
                  </Badge>
                ))}
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Watchlist symbols
                </p>
                <div className="flex flex-wrap gap-2">
                  {event.affectedSymbols.slice(0, 5).map((symbol) => (
                    <Badge key={symbol} variant="outline" className="text-xs">
                      {symbol}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground">
                <span>{new Date(event.timestamp).toLocaleString()}</span>
                <span className="inline-flex items-center gap-1 capitalize">
                  {event.marketView}
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}

function iconForCategory(category: WorldAffairsEvent['category']) {
  switch (category) {
    case 'technology':
      return <Zap className="h-3.5 w-3.5" />
    case 'supply-chain':
      return <ShipWheel className="h-3.5 w-3.5" />
    case 'energy':
      return <Factory className="h-3.5 w-3.5" />
    case 'conflict':
      return <Siren className="h-3.5 w-3.5" />
    default:
      return <Globe2 className="h-3.5 w-3.5" />
  }
}

function severityClassName(severity: number) {
  if (severity >= 75) return 'border-destructive/30 bg-destructive/10 text-destructive'
  if (severity >= 55) return 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300'
  return 'border-primary/30 bg-primary/10 text-primary'
}