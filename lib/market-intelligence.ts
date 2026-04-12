import {
  defaultStocks,
  generateStockData,
  marketIndices,
  stockDatabase,
  type MarketIndex,
  type Stock,
} from '@/lib/stock-data'
import cascadeRules from '@/Reference/scripts/data/cascade-rules.json'
import curatedBases from '@/Reference/scripts/data/curated-bases.json'

export type MarketView = 'bullish' | 'bearish' | 'neutral'

export interface WorldAffairsEvent {
  id: string
  title: string
  category: 'policy' | 'trade' | 'conflict' | 'energy' | 'supply-chain' | 'technology'
  region: string
  country: string
  severity: number
  marketView: MarketView
  summary: string
  affectedSectors: string[]
  affectedSymbols: string[]
  channels: string[]
  coordinates: [number, number]
  timestamp: string
}

export interface RegionRiskSummary {
  region: string
  score: number
  trend: 'rising' | 'stable' | 'easing'
  exposureCount: number
  drivers: string[]
}

export interface SectorPulse {
  sector: string
  averageImpact: number
  exposedHoldings: number
  dominantView: MarketView
  linkedRegions: string[]
}

export interface HoldingImplication {
  symbol: string
  name: string
  stance: MarketView
  conviction: number
  headline: string
  reasoning: string[]
  linkedEventIds: string[]
}

export interface MarketIntelligenceDashboard {
  generatedAt: string
  marketIndices: MarketIndex[]
  stocks: Stock[]
  events: WorldAffairsEvent[]
  regionRisks: RegionRiskSummary[]
  sectorPulse: SectorPulse[]
  implications: HoldingImplication[]
}

type EventTemplate = Omit<WorldAffairsEvent, 'severity' | 'timestamp' | 'affectedSymbols'> & {
  baseSeverity: number
  biasSymbols?: string[]
  biasCountries?: string[]
}

interface CuratedBaseItem {
  id: string
  name: string
  lat?: number
  lon?: number
  type?: string
  country?: string
  status?: string
}

interface CascadeRule {
  from: string
  to: string
  coupling: number
  mechanism: string
}

const EVENT_TEMPLATES: EventTemplate[] = [
  {
    id: 'taiwan-chip-supply',
    title: 'Taiwan semiconductor supply chain remains on high alert',
    category: 'technology',
    region: 'Asia-Pacific',
    country: 'Taiwan',
    baseSeverity: 82,
    marketView: 'bearish',
    summary:
      'Shipping insurance and strategic stockpiling remain elevated around Taiwan, keeping global chip pricing and hardware lead times under pressure.',
    affectedSectors: ['Technology', 'Industrial'],
    channels: ['Semiconductors', 'Freight', 'Defense posture'],
    coordinates: [121.5654, 25.033],
    biasSymbols: ['NVDA', 'AMD', 'INTC', 'ASML', 'AVGO', 'AAPL'],
    biasCountries: ['USA', 'Netherlands'],
  },
  {
    id: 'red-sea-shipping',
    title: 'Red Sea transit risk is lifting freight and insurance costs',
    category: 'supply-chain',
    region: 'Middle East',
    country: 'Yemen',
    baseSeverity: 77,
    marketView: 'bearish',
    summary:
      'Container rerouting through the Cape is extending voyage times, pressuring industrial supply chains and imported inflation expectations.',
    affectedSectors: ['Industrial', 'Consumer', 'Energy'],
    channels: ['Freight', 'Insurance', 'Fuel'],
    coordinates: [43.1456, 15.3694],
    biasSymbols: ['AMZN', 'AC', 'ALC', 'GNK', 'GSL', 'DSX'],
    biasCountries: ['UK', 'Ireland', 'Canada', 'USA'],
  },
  {
    id: 'opec-output-discipline',
    title: 'OPEC+ output discipline is tightening energy balances',
    category: 'energy',
    region: 'Gulf',
    country: 'Saudi Arabia',
    baseSeverity: 68,
    marketView: 'bullish',
    summary:
      'Crude supply discipline is supporting upstream cash flow while raising input costs for transport and consumer-sensitive industries.',
    affectedSectors: ['Energy', 'Airlines', 'Utilities'],
    channels: ['Oil', 'Refining margins', 'FX reserves'],
    coordinates: [46.6753, 24.7136],
    biasSymbols: ['ENB', 'ATH', 'ALA', 'CJ', 'FO', 'AC'],
    biasCountries: ['Canada', 'USA', 'UK'],
  },
  {
    id: 'fed-rate-path',
    title: 'US rate-cut repricing is rotating capital toward quality growth',
    category: 'policy',
    region: 'North America',
    country: 'United States',
    baseSeverity: 61,
    marketView: 'bullish',
    summary:
      'The market is repricing a slower but still easing Fed path, supporting megacap quality and long-duration technology exposure.',
    affectedSectors: ['Technology', 'Finance', 'Real Estate'],
    channels: ['Rates', 'Valuation multiples', 'Dollar liquidity'],
    coordinates: [-77.0369, 38.9072],
    biasSymbols: ['AAPL', 'GOOGL', 'MSFT', 'NVDA', 'AQN', 'AP.UN'],
    biasCountries: ['USA', 'Canada'],
  },
  {
    id: 'eu-ai-compliance',
    title: 'EU AI compliance regime is raising execution costs for software exporters',
    category: 'policy',
    region: 'Europe',
    country: 'European Union',
    baseSeverity: 55,
    marketView: 'neutral',
    summary:
      'Disclosure, model governance, and procurement rules are increasing delivery costs while favoring firms with stronger compliance operations.',
    affectedSectors: ['Technology', 'Healthcare'],
    channels: ['AI regulation', 'Cloud compliance', 'Enterprise budgets'],
    coordinates: [4.3517, 50.8503],
    biasSymbols: ['ACN', 'AIIO', 'ALIT', 'IAI'],
    biasCountries: ['Ireland', 'Netherlands', 'UK', 'USA'],
  },
  {
    id: 'china-stimulus-demand',
    title: 'China stimulus signals are supporting metals and machinery demand',
    category: 'trade',
    region: 'Asia-Pacific',
    country: 'China',
    baseSeverity: 64,
    marketView: 'bullish',
    summary:
      'Incremental property and infrastructure support is improving expectations for copper, bulk shipping, and heavy-equipment demand.',
    affectedSectors: ['Mining', 'Industrial', 'Shipping'],
    channels: ['Base metals', 'Construction', 'Freight demand'],
    coordinates: [116.4074, 39.9042],
    biasSymbols: ['AAG', 'ATY', 'BSX', 'CG', 'GCU', 'DSX'],
    biasCountries: ['Canada', 'Australia', 'USA'],
  },
  {
    id: 'india-capex-cycle',
    title: 'India capex cycle is attracting supply-chain diversification flows',
    category: 'trade',
    region: 'South Asia',
    country: 'India',
    baseSeverity: 58,
    marketView: 'bullish',
    summary:
      'Manufacturing and logistics investment is creating a second-leg growth story for industrial software, utilities, and transport exposures.',
    affectedSectors: ['Industrial', 'Utilities', 'Technology'],
    channels: ['Capex', 'Power demand', 'Factory relocation'],
    coordinates: [77.209, 28.6139],
    biasSymbols: ['H', 'FTS', 'CLS', 'ACN'],
    biasCountries: ['Canada', 'USA', 'India'],
  },
  {
    id: 'latam-food-exports',
    title: 'Latin America export momentum is easing food inflation pressure',
    category: 'trade',
    region: 'Latin America',
    country: 'Brazil',
    baseSeverity: 49,
    marketView: 'bullish',
    summary:
      'Strong crop exports and logistics normalization are helping global food baskets while supporting selective shipping and consumer flows.',
    affectedSectors: ['Consumer', 'Shipping', 'ETF'],
    channels: ['Agriculture', 'Ports', 'Retail margins'],
    coordinates: [-47.8825, -15.7942],
    biasSymbols: ['ABEV', 'FOOD', 'BOAT', 'BWET'],
    biasCountries: ['Brazil', 'Canada', 'USA'],
  },
]

const BASE_DATA = curatedBases as CuratedBaseItem[]
const CASCADE_DATA = cascadeRules as CascadeRule[]

function unique<T>(items: T[]): T[] {
  return [...new Set(items)]
}

function normalizeCountryName(country?: string): string {
  if (!country) return 'Unknown'
  const lowered = country.trim().toLowerCase()

  const alias: Record<string, string> = {
    usa: 'United States',
    america: 'United States',
    'united states of america': 'United States',
    uk: 'United Kingdom',
    'united kingdoms': 'United Kingdom',
    quatar: 'Qatar',
    disputed: 'Disputed Territories',
  }

  return alias[lowered] ?? country.trim()
}

function toRegion(country: string): string {
  const c = country.toLowerCase()
  if (['united states', 'canada', 'mexico'].includes(c)) return 'North America'
  if (['brazil', 'argentina', 'chile', 'peru', 'colombia', 'venezuela'].includes(c)) return 'Latin America'
  if (['united kingdom', 'germany', 'france', 'italy', 'netherlands', 'ireland', 'spain', 'greece', 'belgium', 'portugal'].includes(c)) return 'Europe'
  if (['saudi arabia', 'qatar', 'israel', 'iran', 'oman', 'united arab emirates', 'yemen', 'iraq', 'syria'].includes(c)) return 'Middle East'
  if (['china', 'japan', 'india', 'south korea', 'singapore', 'philippines', 'taiwan', 'myanmar', 'thailand'].includes(c)) return 'Asia-Pacific'
  if (['south africa', 'kenya', 'djibouti', 'niger', 'chad', 'senegal'].includes(c)) return 'Africa'
  return 'Global'
}

function inferEventCategory(type?: string): WorldAffairsEvent['category'] {
  const source = (type ?? '').toLowerCase()
  if (source.includes('nato') || source.includes('russia') || source.includes('china')) return 'conflict'
  if (source.includes('navy') || source.includes('air') || source.includes('military')) return 'supply-chain'
  if (source.includes('army') || source.includes('force')) return 'policy'
  return 'technology'
}

function summarizeWorldPressure(stocks: Stock[]) {
  const grouped = new Map<string, CuratedBaseItem[]>()

  for (const item of BASE_DATA) {
    const country = normalizeCountryName(item.country)
    const collection = grouped.get(country) ?? []
    collection.push(item)
    grouped.set(country, collection)
  }

  const stockCountries = unique(stocks.map((stock) => normalizeCountryName(stock.location.country)))

  return [...grouped.entries()]
    .map(([country, items]) => {
      const activeCount = items.filter((item) => (item.status ?? '').toLowerCase() === 'active').length
      const avgLat = items.reduce((sum, item) => sum + (item.lat ?? 0), 0) / Math.max(items.length, 1)
      const avgLon = items.reduce((sum, item) => sum + (item.lon ?? 0), 0) / Math.max(items.length, 1)
      const dominantType = items[0]?.type ?? 'global'
      const inPortfolio = stockCountries.includes(country)

      return {
        country,
        region: toRegion(country),
        totalBases: items.length,
        activeCount,
        dominantType,
        inPortfolio,
        coordinates: [avgLon, avgLat] as [number, number],
      }
    })
    .sort((a, b) => b.activeCount - a.activeCount)
}

function signForView(view: MarketView): number {
  if (view === 'bullish') return 1
  if (view === 'bearish') return -1
  return 0
}

function dominantView(score: number): MarketView {
  if (score > 8) return 'bullish'
  if (score < -8) return 'bearish'
  return 'neutral'
}

function normalizeSymbols(symbols?: string[]): string[] {
  const incoming = (symbols ?? [])
    .map((symbol) => symbol.trim().toUpperCase())
    .filter(Boolean)

  if (incoming.length > 0) {
    return unique(incoming)
  }

  return defaultStocks.slice(0, 24).map((stock) => stock.symbol)
}

function buildStocks(symbols?: string[]): Stock[] {
  return normalizeSymbols(symbols).map((symbol) => {
    const info = stockDatabase[symbol]
    return generateStockData(symbol, info?.name ?? symbol)
  })
}

function eventTouchesStock(template: EventTemplate, stock: Stock): boolean {
  return (
    template.biasSymbols?.includes(stock.symbol) ||
    template.affectedSectors.includes(stock.sector) ||
    template.biasCountries?.includes(stock.location.country)
  )
}

function buildEvents(stocks: Stock[]): WorldAffairsEvent[] {
  const referenceEvents = summarizeWorldPressure(stocks)
    .slice(0, 8)
    .map((item, index) => {
      const severity = Math.min(96, 34 + item.activeCount * 2 + item.totalBases)
      const touchedSymbols = stocks
        .filter(
          (stock) =>
            normalizeCountryName(stock.location.country) === item.country ||
            toRegion(normalizeCountryName(stock.location.country)) === item.region,
        )
        .map((stock) => stock.symbol)

      const category = inferEventCategory(item.dominantType)
      const eventView: MarketView = severity > 70 ? 'bearish' : item.inPortfolio ? 'neutral' : 'bullish'

      const sectorsByCategory: Record<WorldAffairsEvent['category'], string[]> = {
        conflict: ['Industrial', 'Energy', 'Shipping'],
        'supply-chain': ['Industrial', 'Consumer', 'Technology'],
        policy: ['Finance', 'Technology', 'Energy'],
        trade: ['Consumer', 'Mining', 'Shipping'],
        energy: ['Energy', 'Utilities', 'Airlines'],
        technology: ['Technology', 'Industrial'],
      }

      const channels = unique(
        CASCADE_DATA
          .filter((rule) => rule.from === 'conflict' || rule.to === 'market' || rule.to === 'supply_chain')
          .slice(0, 4)
          .map((rule) => rule.mechanism),
      )

      return {
        id: `ref-${item.country.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        title: `${item.country}: elevated infrastructure and defense activity`,
        category,
        region: item.region,
        country: item.country,
        severity,
        marketView: eventView,
        summary: `${item.activeCount} active strategic sites and ${item.totalBases} known sites are tracked in reference data for ${item.country}.`,
        affectedSectors: sectorsByCategory[category],
        affectedSymbols: unique(touchedSymbols).slice(0, 10),
        channels,
        coordinates: item.coordinates,
        timestamp: new Date(Date.now() - index * 1000 * 60 * 31).toISOString(),
      } satisfies WorldAffairsEvent
    })

  if (referenceEvents.length > 0) {
    return referenceEvents
  }

  const now = Date.now()

  return EVENT_TEMPLATES.map((template, index) => {
    const matchedStocks = stocks.filter((stock) => eventTouchesStock(template, stock))
    const severity = Math.min(95, template.baseSeverity + matchedStocks.length * 2)
    const eventSymbols = unique([
      ...(template.biasSymbols ?? []),
      ...matchedStocks.map((stock) => stock.symbol),
    ]).slice(0, 8)

    return {
      id: template.id,
      title: template.title,
      category: template.category,
      region: template.region,
      country: template.country,
      severity,
      marketView: template.marketView,
      summary: template.summary,
      affectedSectors: template.affectedSectors,
      affectedSymbols: eventSymbols,
      channels: template.channels,
      coordinates: template.coordinates,
      timestamp: new Date(now - index * 1000 * 60 * 37).toISOString(),
    }
  })
    .sort((left, right) => right.severity - left.severity)
    .slice(0, 8)
}

function buildRegionRisks(events: WorldAffairsEvent[], stocks: Stock[]): RegionRiskSummary[] {
  const regionMap = new Map<string, { score: number; exposure: number; drivers: string[] }>()

  for (const event of events) {
    const matchingStocks = stocks.filter(
      (stock) =>
        event.affectedSymbols.includes(stock.symbol) ||
        event.affectedSectors.includes(stock.sector),
    )
    const signedSeverity = event.severity * signForView(event.marketView)
    const current = regionMap.get(event.region) ?? { score: 0, exposure: 0, drivers: [] }

    regionMap.set(event.region, {
      score: current.score + signedSeverity,
      exposure: current.exposure + matchingStocks.length,
      drivers: unique([...current.drivers, event.title]).slice(0, 3),
    })
  }

  return [...regionMap.entries()]
    .map(([region, value]) => {
      const absoluteScore = Math.min(100, Math.round(Math.abs(value.score) / Math.max(events.length, 1)))
      return {
        region,
        score: absoluteScore,
        trend: value.score > 40 ? 'rising' : value.score < -20 ? 'easing' : 'stable',
        exposureCount: value.exposure,
        drivers: value.drivers,
      }
    })
    .sort((left, right) => right.score - left.score)
}

function buildSectorPulse(events: WorldAffairsEvent[], stocks: Stock[]): SectorPulse[] {
  const sectors = unique(stocks.map((stock) => stock.sector))

  return sectors
    .map((sector) => {
      const matchingStocks = stocks.filter((stock) => stock.sector === sector)
      const relevantEvents = events.filter((event) => event.affectedSectors.includes(sector))
      const score = relevantEvents.reduce(
        (sum, event) => sum + signForView(event.marketView) * event.severity,
        0,
      )

      return {
        sector,
        averageImpact: relevantEvents.length > 0 ? Math.round(score / relevantEvents.length) : 0,
        exposedHoldings: matchingStocks.length,
        dominantView: dominantView(score),
        linkedRegions: unique(relevantEvents.map((event) => event.region)).slice(0, 3),
      }
    })
    .sort((left, right) => Math.abs(right.averageImpact) - Math.abs(left.averageImpact))
    .slice(0, 8)
}

function buildImplications(events: WorldAffairsEvent[], stocks: Stock[]): HoldingImplication[] {
  return stocks
    .map((stock) => {
      const relevantEvents = events.filter(
        (event) =>
          event.affectedSymbols.includes(stock.symbol) ||
          event.affectedSectors.includes(stock.sector) ||
          event.country === stock.location.country,
      )

      const score = relevantEvents.reduce(
        (sum, event) => sum + signForView(event.marketView) * event.severity,
        0,
      )

      const conviction = Math.min(
        98,
        Math.max(
          24,
          Math.round(
            relevantEvents.length * 12 +
              Math.abs(score) / Math.max(relevantEvents.length || 1, 1) +
              Math.abs(stock.changePercent),
          ),
        ),
      )

      const stance = dominantView(score)
      const mainEvent = relevantEvents[0]

      return {
        symbol: stock.symbol,
        name: stock.name,
        stance,
        conviction,
        headline:
          mainEvent != null
            ? `${mainEvent.region}: ${mainEvent.title}`
            : `${stock.location.country} exposure remains mostly idiosyncratic`,
        linkedEventIds: relevantEvents.map((event) => event.id),
        reasoning: unique(
          [
            `${stock.sector} exposure overlaps with ${relevantEvents.length || 1} active macro or geopolitical driver(s).`,
            `${stock.location.country} footprint keeps ${stock.symbol} sensitive to cross-border policy and logistics shocks.`,
            `Current social sentiment reads ${stock.globalImpact.sentiment}, while analysts are at ${stock.globalImpact.analystRating}.`,
          ],
        ),
      }
    })
    .sort((left, right) => right.conviction - left.conviction)
    .slice(0, 12)
}

export function buildMarketIntelligenceDashboard(symbols?: string[]): MarketIntelligenceDashboard {
  const stocks = buildStocks(symbols)
  const events = buildEvents(stocks)

  return {
    generatedAt: new Date().toISOString(),
    marketIndices,
    stocks,
    events,
    regionRisks: buildRegionRisks(events, stocks),
    sectorPulse: buildSectorPulse(events, stocks),
    implications: buildImplications(events, stocks),
  }
}