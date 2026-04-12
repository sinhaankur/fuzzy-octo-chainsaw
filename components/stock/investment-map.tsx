'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from 'react-simple-maps'
import { Badge } from '@/components/ui/badge'
import { Stock } from '@/lib/stock-data'
import { MapPin } from 'lucide-react'

const geoUrl = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

interface InvestmentMapProps {
  stocks: Stock[]
  onStockClick?: (stock: Stock) => void
}

interface LocationGroup {
  coordinates: [number, number]
  city: string
  country: string
  stocks: Stock[]
  totalValue: number
  totalChange: number
}

export function InvestmentMap({ stocks, onStockClick }: InvestmentMapProps) {
  const [hoveredLocation, setHoveredLocation] = useState<LocationGroup | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
  const [nowUtc, setNowUtc] = useState(() => new Date())

  useEffect(() => {
    const timer = setInterval(() => setNowUtc(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Group stocks by location
  const locationGroups = useMemo(() => {
    const groups: Record<string, LocationGroup> = {}
    
    stocks.forEach((stock) => {
      const key = `${stock.location.coordinates[0]},${stock.location.coordinates[1]}`
      if (!groups[key]) {
        groups[key] = {
          coordinates: stock.location.coordinates,
          city: stock.location.city,
          country: stock.location.country,
          stocks: [],
          totalValue: 0,
          totalChange: 0,
        }
      }
      groups[key].stocks.push(stock)
      groups[key].totalValue += stock.totalValue
      groups[key].totalChange += stock.change * stock.shares
    })

    return Object.values(groups)
  }, [stocks])

  // Get country statistics
  const countryStats = useMemo(() => {
    const stats: Record<string, { count: number; value: number }> = {}
    stocks.forEach((stock) => {
      const country = stock.location.country
      if (!stats[country]) {
        stats[country] = { count: 0, value: 0 }
      }
      stats[country].count++
      stats[country].value += stock.totalValue
    })
    return Object.entries(stats)
      .map(([country, data]) => ({ country, ...data }))
      .sort((a, b) => b.value - a.value)
  }, [stocks])

  const getMarkerSize = (totalValue: number) => {
    const maxValue = Math.max(...locationGroups.map((g) => g.totalValue))
    const minSize = 6
    const maxSize = 20
    return minSize + (totalValue / maxValue) * (maxSize - minSize)
  }

  const handleMouseEnter = (
    group: LocationGroup,
    event: React.MouseEvent
  ) => {
    setHoveredLocation(group)
    setTooltipPosition({ x: event.clientX, y: event.clientY })
  }

  const handleMouseLeave = () => {
    setHoveredLocation(null)
  }

  const layers = [
    { key: 'holdings', label: 'Holdings', active: true },
    { key: 'business', label: 'Business Nodes', active: true },
    { key: 'country', label: 'Country Exposure', active: true },
    { key: 'risk', label: 'Risk Heat', active: false },
  ]

  const nowLabel = nowUtc.toUTCString()

  return (
    <section className="wm-panel wm-cornered relative overflow-hidden rounded-xl text-[#d1d8df]">
      <div className="border-b border-[#1f2a34] bg-[#090f18] px-3 py-2">
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] uppercase tracking-[0.16em] text-[#8ea3b6]">
          <div className="flex items-center gap-2">
            <span className="rounded bg-[#122130] px-1.5 py-0.5 text-[#5be39d]">Live</span>
            <span>Global Situation</span>
            <span className="text-[#60758a]">StockMonitor Map</span>
          </div>
          <span>{nowLabel}</span>
        </div>
      </div>

      <div className="border-b border-[#1f2a34] bg-[#060d15] px-3 py-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="wm-chip">world exposure</span>
          <span className="wm-chip">country instability</span>
          <span className="wm-chip">route pressure</span>
        </div>
      </div>

      <div className="border-b border-[#1f2a34] bg-[#060d15] px-3 py-1.5">
        <div className="wm-ticker">
          <span className="wm-ticker-track">
            <span className="wm-live-dot" /> live utc {nowLabel} • map relay active • command stream nominal •
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-[#1f2a34] bg-[#070c14] px-3 py-2">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-[#8ea3b6]">
          <Badge className="rounded-sm border-[#2a3d50] bg-[#0e1b2a] text-[#8ea3b6]">2D</Badge>
          <Badge className="rounded-sm border-[#2a3d50] bg-[#0b111b] text-[#8ea3b6]">Global</Badge>
        </div>
        <div className="text-[11px] uppercase tracking-[0.12em] text-[#8ea3b6]">
          {stocks.length} symbols • {countryStats.length} countries
        </div>
      </div>

      <div className="relative min-h-[420px] lg:min-h-[620px]">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            scale: 150,
            center: [20, 24],
          }}
          style={{
            width: '100%',
            height: '100%',
          }}
        >
          <ZoomableGroup>
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map((geo) => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill="#0f141c"
                    stroke="#27323d"
                    strokeWidth={0.55}
                    style={{
                      default: { outline: 'none' },
                      hover: { fill: '#131b26', outline: 'none' },
                      pressed: { outline: 'none' },
                    }}
                  />
                ))
              }
            </Geographies>

            {locationGroups.map((group, index) => (
              <Marker
                key={index}
                coordinates={group.coordinates}
                onMouseEnter={(event) => handleMouseEnter(group, event as unknown as React.MouseEvent)}
                onMouseLeave={handleMouseLeave}
                onClick={() => group.stocks[0] && onStockClick?.(group.stocks[0])}
                style={{ cursor: 'pointer' }}
              >
                <circle
                  r={getMarkerSize(group.totalValue)}
                  fill={group.totalChange >= 0 ? '#f59e0b' : '#ef4444'}
                  fillOpacity={0.85}
                  stroke={group.totalChange >= 0 ? '#fbbf24' : '#fb7185'}
                  strokeWidth={1.8}
                />
                <circle
                  r={getMarkerSize(group.totalValue) + 5}
                  fill="transparent"
                  stroke={group.totalChange >= 0 ? '#f59e0b' : '#ef4444'}
                  strokeWidth={0.9}
                  strokeOpacity={0.35}
                />
              </Marker>
            ))}
          </ZoomableGroup>
        </ComposableMap>

        <aside className="absolute left-3 top-3 hidden w-48 rounded border border-[#263442] bg-[#05090fcc] p-2 backdrop-blur-sm md:block">
          <p className="mb-2 text-[10px] uppercase tracking-[0.16em] text-[#7f95aa]">Layers</p>
          <div className="space-y-1.5">
            {layers.map((layer) => (
              <div key={layer.key} className="flex items-center justify-between text-[11px] text-[#c0ccd8]">
                <span className="truncate">{layer.label}</span>
                <span
                  className={`h-2.5 w-2.5 rounded-sm ${layer.active ? 'bg-[#22c55e]' : 'bg-[#374151]'}`}
                />
              </div>
            ))}
          </div>
        </aside>

        <aside className="absolute right-3 top-3 hidden w-44 rounded border border-[#263442] bg-[#05090fcc] p-2 backdrop-blur-sm md:block">
          <p className="mb-2 text-[10px] uppercase tracking-[0.16em] text-[#7f95aa]">Country Instability</p>
          <div className="space-y-1.5">
            {countryStats.slice(0, 5).map((stat, index) => (
              <div key={stat.country} className="flex items-center justify-between text-[11px] text-[#c0ccd8]">
                <span className="truncate">{index + 1}. {stat.country}</span>
                <span className="font-medium text-white">{Math.min(100, 48 + stat.count * 8)}</span>
              </div>
            ))}
          </div>
        </aside>

        {hoveredLocation && (
          <div
            className="pointer-events-none fixed z-50 max-w-[290px] rounded border border-[#263442] bg-[#070d16f0] p-3 text-[12px] text-[#d1d8df] shadow-lg"
            style={{
              left: tooltipPosition.x + 10,
              top: tooltipPosition.y - 10,
              transform: 'translateY(-100%)',
            }}
          >
            <div className="mb-2 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[#f59e0b]" />
              <span className="font-semibold uppercase tracking-wide">
                {hoveredLocation.city}, {hoveredLocation.country}
              </span>
            </div>
            <div className="space-y-1 text-[#9fb0bf]">
              <p>Holdings: {hoveredLocation.stocks.length}</p>
              <p>Total Value: ${hoveredLocation.totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
              <p>Daily Delta: {hoveredLocation.totalChange >= 0 ? '+' : ''}${hoveredLocation.totalChange.toFixed(2)}</p>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {hoveredLocation.stocks.slice(0, 6).map((stock) => (
                <Badge key={stock.symbol} className="rounded-sm border-[#334155] bg-[#0f1723] text-[10px] text-[#c0ccd8]">
                  {stock.symbol}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 border-t border-[#1f2a34] bg-[#050a11e6] px-3 py-2">
          <div className="flex flex-wrap items-center gap-3 text-[10px] uppercase tracking-[0.14em] text-[#90a4b8]">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#ef4444]" />
              High Alert
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#f59e0b]" />
              Elevated
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#22c55e]" />
              Monitoring
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#8b5cf6]" />
              Portfolio Node
            </span>
          </div>
          <div className="mt-2 text-[10px] uppercase tracking-[0.12em] text-[#73879a] md:hidden">
            Top countries: {countryStats.slice(0, 3).map((item) => item.country).join(' • ') || 'No holdings loaded'}
          </div>
        </div>
      </div>
    </section>
  )
}
