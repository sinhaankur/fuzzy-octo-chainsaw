import { NextResponse } from 'next/server'

import { buildMarketIntelligenceDashboard } from '@/lib/market-intelligence'
import { generateAiStockReviews } from '@/lib/llm-stock-review'

interface AlphaVantageNewsItem {
  title: string
  link?: string
  date?: string
  source?: string
  snippet?: string
  sentiment?: number
}

interface AlphaVantageQuote {
  symbol: string
  price?: number
  change?: number
  changePercent?: string
  volume?: string
}

interface AlphaVantageMarketStatus {
  endpoint?: string
  markets?: Array<Record<string, unknown>>
}

interface GoogleFinanceAssetDetails {
  symbol: string
  name?: string
  exchange?: string
  currency?: string
  marketCap?: string
  peRatio?: string
  description?: string
  type: string
  source: 'SerpApi Google Finance'
}

type AlphaVantageNewsBySymbol = Record<string, AlphaVantageNewsItem[]>
type AlphaVantageQuotesBySymbol = Record<string, AlphaVantageQuote>
type GoogleFinanceDetailsBySymbol = Record<string, GoogleFinanceAssetDetails>

const DEFAULT_EXTERNAL_SYMBOLS = ['AAPL', 'MSFT', 'NVDA', 'SPY', 'GLD', 'TSLA']

function getExternalSymbols(): string[] {
  const configured = process.env.PUBLIC_REFERENCE_SYMBOLS
    ?.split(',')
    .map((symbol) => symbol.trim().toUpperCase())
    .filter(Boolean)

  return configured && configured.length > 0 ? configured : DEFAULT_EXTERNAL_SYMBOLS
}

function isStrictPrivacyMode(): boolean {
  const mode = process.env.STOCK_PRIVACY_MODE?.trim().toLowerCase()
  return mode !== 'off'
}

function normalizeSymbols(input: unknown): string[] | undefined {
  if (!Array.isArray(input)) return undefined
  return input
    .map((value) => String(value).trim())
    .filter(Boolean)
}

function sanitizeText(value: unknown): string | undefined {
  const text = String(value ?? '').trim()
  return text.length > 0 ? text : undefined
}

function classifyAssetType(params: {
  symbol: string
  name?: string
  summaryText?: string
  description?: string
}): string {
  const blob = [params.symbol, params.name, params.summaryText, params.description]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  if (blob.includes('exchange traded fund') || /\betf\b/.test(blob)) return 'ETF'
  if (blob.includes('real estate investment trust') || /\breit\b/.test(blob)) return 'REIT'
  if (blob.includes('american depositary') || /\badr\b/.test(blob)) return 'ADR'
  if (blob.includes('preferred')) return 'Preferred Stock'
  if (blob.includes('mutual fund') || (blob.includes('fund') && !/\betf\b/.test(blob))) return 'Fund'
  if (blob.includes('trust')) return 'Trust'
  if (blob.includes('limited partnership') || /\blp\b/.test(blob)) return 'Limited Partnership'
  if (blob.includes('bond') || blob.includes('treasury')) return 'Bond'
  if (blob.includes('acquisition corp') || blob.includes('spac')) return 'SPAC'
  return 'Common Stock'
}

async function fetchGoogleFinanceDetails(symbols: string[]): Promise<GoogleFinanceDetailsBySymbol> {
  const apiKey = process.env.SERPAPI_KEY
  if (!apiKey || symbols.length === 0) {
    return {}
  }

  const targets = symbols.slice(0, 10)
  const entries = await Promise.all(
    targets.map(async (symbol) => {
      const params = new URLSearchParams({
        engine: 'google_finance',
        q: symbol,
        hl: 'en',
        api_key: apiKey,
      })

      const response = await fetch(`https://serpapi.com/search?${params.toString()}`, {
        cache: 'no-store',
      })

      if (!response.ok) {
        return [symbol, undefined] as const
      }

      const json = (await response.json()) as {
        summary?: Record<string, unknown>
        knowledge_graph?: {
          title?: string
          description?: string
        }
      }

      const summary = json.summary ?? {}
      const name =
        sanitizeText(summary['Name']) ??
        sanitizeText(summary['Company']) ??
        sanitizeText(json.knowledge_graph?.title)
      const exchange = sanitizeText(summary['Exchange'])
      const currency = sanitizeText(summary['Currency'])
      const marketCap = sanitizeText(summary['Market cap'])
      const peRatio = sanitizeText(summary['P/E ratio'])
      const description = sanitizeText(summary['Description']) ?? sanitizeText(json.knowledge_graph?.description)
      const summaryText = Object.values(summary).map((value) => String(value)).join(' ')

      const details: GoogleFinanceAssetDetails = {
        symbol,
        name,
        exchange,
        currency,
        marketCap,
        peRatio,
        description,
        type: classifyAssetType({
          symbol,
          name,
          summaryText,
          description,
        }),
        source: 'SerpApi Google Finance',
      }

      return [symbol, details] as const
    }),
  )

  return Object.fromEntries(entries.filter((entry): entry is readonly [string, GoogleFinanceAssetDetails] => Boolean(entry[1])))
}

async function fetchAlphaVantageNews(symbols: string[]): Promise<AlphaVantageNewsBySymbol> {
  const apiKey = process.env.ALPHAVANTAGE_API_KEY
  if (!apiKey || symbols.length === 0) {
    return {}
  }

  const targets = symbols.slice(0, 6)
  const newsEntries = await Promise.all(
    targets.map(async (symbol) => {
      const params = new URLSearchParams({
        function: 'NEWS_SENTIMENT',
        tickers: symbol,
        sort: 'RELEVANCE',
        limit: '10',
        apikey: apiKey,
      })

      const response = await fetch(`https://www.alphavantage.co/query?${params.toString()}`, {
        cache: 'no-store',
      })

      if (!response.ok) {
        return [symbol, []] as const
      }

      const json = (await response.json()) as {
        feed?: Array<{
          title?: string
          url?: string
          time_published?: string
          source?: string
          summary?: string
          overall_sentiment_score?: string
        }>
        Note?: string
        Information?: string
      }

      if (json.Note || json.Information) {
        return [symbol, []] as const
      }

      const items = (json.feed ?? [])
        .filter((item) => Boolean(item.title))
        .slice(0, 5)
        .map((item) => ({
          title: item.title ?? '',
          link: item.url,
          date: item.time_published,
          source: item.source,
          snippet: item.summary,
          sentiment: Number(item.overall_sentiment_score),
        }))

      return [symbol, items] as const
    }),
  )

  return Object.fromEntries(newsEntries)
}

async function fetchAlphaVantageQuotes(symbols: string[]): Promise<AlphaVantageQuotesBySymbol> {
  const apiKey = process.env.ALPHAVANTAGE_API_KEY
  if (!apiKey || symbols.length === 0) {
    return {}
  }

  const targets = symbols.slice(0, 6)
  const quoteEntries = await Promise.all(
    targets.map(async (symbol) => {
      const params = new URLSearchParams({
        function: 'GLOBAL_QUOTE',
        symbol,
        apikey: apiKey,
      })

      const response = await fetch(`https://www.alphavantage.co/query?${params.toString()}`, {
        cache: 'no-store',
      })

      if (!response.ok) {
        return [symbol, { symbol }] as const
      }

      const json = (await response.json()) as {
        'Global Quote'?: Record<string, string>
      }

      const quote = json['Global Quote']
      if (!quote || Object.keys(quote).length === 0) {
        return [symbol, { symbol }] as const
      }

      return [
        symbol,
        {
          symbol: quote['01. symbol'] ?? symbol,
          price: Number(quote['05. price']),
          change: Number(quote['09. change']),
          changePercent: quote['10. change percent'],
          volume: quote['06. volume'],
        },
      ] as const
    }),
  )

  return Object.fromEntries(quoteEntries)
}

async function fetchAlphaVantageMarketStatus(): Promise<AlphaVantageMarketStatus | undefined> {
  const apiKey = process.env.ALPHAVANTAGE_API_KEY
  if (!apiKey) {
    return undefined
  }

  const params = new URLSearchParams({
    function: 'MARKET_STATUS',
    apikey: apiKey,
  })

  const response = await fetch(`https://www.alphavantage.co/query?${params.toString()}`, {
    cache: 'no-store',
  })

  if (!response.ok) {
    return undefined
  }

  const json = (await response.json()) as {
    endpoint?: string
    markets?: Array<Record<string, unknown>>
  }

  return {
    endpoint: json.endpoint,
    markets: json.markets,
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const symbols = searchParams
    .get('symbols')
    ?.split(',')
    .map((symbol) => symbol.trim())
    .filter(Boolean)

  const normalizedSymbols = symbols ?? []
  const privacyMode = isStrictPrivacyMode()
  const symbolsForExternal = privacyMode ? getExternalSymbols() : normalizedSymbols
  const [alphaVantageNews, alphaVantageQuotes, alphaVantageMarketStatus, googleFinanceDetails] = await Promise.all([
    fetchAlphaVantageNews(symbolsForExternal),
    fetchAlphaVantageQuotes(symbolsForExternal),
    fetchAlphaVantageMarketStatus(),
    fetchGoogleFinanceDetails(symbolsForExternal),
  ])

  const dashboard = buildMarketIntelligenceDashboard(symbols)
  const { provider: aiProvider, reviews: aiStockReviews } = await generateAiStockReviews({
    symbols: privacyMode ? [] : normalizedSymbols,
    googleFinanceDetails,
    implications: dashboard.implications,
    events: dashboard.events,
  })

  const hasGoogleFinanceData = Object.keys(googleFinanceDetails).length > 0

  const payload = {
    ...dashboard,
    source: hasGoogleFinanceData
      ? 'Reference datasets + Alpha Vantage + Google Finance'
      : 'Reference datasets + Alpha Vantage',
    alphaVantageNews,
    alphaVantageQuotes,
    alphaVantageMarketStatus,
    googleFinanceDetails,
    aiProvider,
    aiStockReviews,
    privacyMode,
    externalReferenceSymbols: symbolsForExternal,
  }

  return NextResponse.json(payload, {
    headers: {
      'cache-control': 'no-store',
    },
  })
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const symbols = normalizeSymbols(body?.symbols)
  const normalizedSymbols = symbols ?? []
  const privacyMode = isStrictPrivacyMode()
  const symbolsForExternal = privacyMode ? getExternalSymbols() : normalizedSymbols
  const [alphaVantageNews, alphaVantageQuotes, alphaVantageMarketStatus, googleFinanceDetails] = await Promise.all([
    fetchAlphaVantageNews(symbolsForExternal),
    fetchAlphaVantageQuotes(symbolsForExternal),
    fetchAlphaVantageMarketStatus(),
    fetchGoogleFinanceDetails(symbolsForExternal),
  ])

  const dashboard = buildMarketIntelligenceDashboard(symbols)
  const { provider: aiProvider, reviews: aiStockReviews } = await generateAiStockReviews({
    symbols: privacyMode ? [] : normalizedSymbols,
    googleFinanceDetails,
    implications: dashboard.implications,
    events: dashboard.events,
  })

  const hasGoogleFinanceData = Object.keys(googleFinanceDetails).length > 0

  const payload = {
    ...dashboard,
    source: hasGoogleFinanceData
      ? 'Reference datasets + Alpha Vantage + Google Finance'
      : 'Reference datasets + Alpha Vantage',
    alphaVantageNews,
    alphaVantageQuotes,
    alphaVantageMarketStatus,
    googleFinanceDetails,
    aiProvider,
    aiStockReviews,
    privacyMode,
    externalReferenceSymbols: symbolsForExternal,
  }

  return NextResponse.json(payload, {
    headers: {
      'cache-control': 'no-store',
    },
  })
}