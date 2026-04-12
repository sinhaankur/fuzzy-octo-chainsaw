'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { Activity, CheckCircle2, FileUp, Globe2, Search, Trash2, TriangleAlert } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { parseWatchlistCsv, type ImportedWatchlistRow } from '@/lib/watchlist-csv'
import {
	defaultStocks,
	generateStockData,
	stockDatabase,
	type Stock,
} from '@/lib/stock-data'

const InvestmentMap = dynamic(
	() => import('@/components/stock/investment-map').then((module) => module.InvestmentMap),
	{ ssr: false },
)

interface HoldingEntry {
	symbol: string
	name: string
	shares?: number
	country?: string
	city?: string
	sector?: string
	coordinates?: [number, number]
}

type StatusTone = 'neutral' | 'success' | 'error'

interface StatusState {
	message: string
	tone: StatusTone
}

interface ApiEvent {
	id: string
	title: string
	region: string
	country: string
	severity: number
	summary: string
	affectedSymbols?: string[]
}

interface ApiImplication {
	symbol: string
	headline: string
	stance: 'bullish' | 'bearish' | 'neutral'
	conviction: number
	reasoning: string[]
	linkedEventIds: string[]
}

interface ApiDashboard {
	events: ApiEvent[]
	implications: ApiImplication[]
	source?: string
	privacyMode?: boolean
	externalReferenceSymbols?: string[]
	aiProvider?: {
		enabled: boolean
		provider: 'local-claude' | 'none'
		model?: string
		reason?: string
	}
	aiStockReviews?: Record<
		string,
		{
			symbol: string
			dependentCountries: string[]
			impactFactors: string[]
			confidence: 'high' | 'medium' | 'low'
			generatedBy: string
		}
	>
	googleFinanceDetails?: Record<
		string,
		{
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
	>
	googleFinanceNews?: Record<
		string,
		Array<{
			title: string
			link?: string
			date?: string
			source?: string
			snippet?: string
		}>
	>
	alphaVantageNews?: Record<
		string,
		Array<{
			title: string
			link?: string
			date?: string
			source?: string
			snippet?: string
		}>
	>
}

interface StockSignal {
	id: string
	title: string
	summary: string
	link?: string
	sourceTag: 'SerpApi' | 'Internal Event' | 'Alpha Vantage'
}

type StrategyBucket =
	| 'Shipping & Commodity Focused'
	| 'Diversified & Individual Equities'
	| 'Income & Yield Strategies'
	| 'Tech & Innovation Focused'
	| 'Energy & Utilities Exposure'
	| 'Financials & Credit Exposure'
	| 'Real Assets & Real Estate'
	| 'Other'

type StrategyLabelMap = Record<StrategyBucket, string>

const DEFAULT_STRATEGY_LABELS: StrategyLabelMap = {
	'Shipping & Commodity Focused': 'Shipping & Commodity Focused',
	'Diversified & Individual Equities': 'Diversified & Individual Equities',
	'Income & Yield Strategies': 'Income & Yield Strategies',
	'Tech & Innovation Focused': 'Tech & Innovation Focused',
	'Energy & Utilities Exposure': 'Energy & Utilities Exposure',
	'Financials & Credit Exposure': 'Financials & Credit Exposure',
	'Real Assets & Real Estate': 'Real Assets & Real Estate',
	Other: 'Other',
}

function inferAssetTypeFallback(name: string, symbol: string, sector?: string): string {
	const blob = `${name} ${symbol} ${sector ?? ''}`.toLowerCase()
	if (blob.includes('etf')) return 'ETF'
	if (blob.includes('reit')) return 'REIT'
	if (blob.includes('trust')) return 'Trust'
	if (blob.includes('fund')) return 'Fund'
	if (blob.includes('preferred')) return 'Preferred Stock'
	if (blob.includes('adr')) return 'ADR'
	if (blob.includes('bond')) return 'Bond'
	return 'Common Stock'
}

function classifyStrategyBucket(params: {
	name: string
	symbol: string
	sector?: string
	assetType?: string
}): StrategyBucket {
	const blob = `${params.name} ${params.symbol} ${params.sector ?? ''} ${params.assetType ?? ''}`.toLowerCase()

	if (
		blob.includes('shipping') ||
		blob.includes('tanker') ||
		blob.includes('dry bulk') ||
		blob.includes('mining') ||
		blob.includes('uranium') ||
		blob.includes('gold') ||
		blob.includes('copper') ||
		blob.includes('commodity')
	) {
		return 'Shipping & Commodity Focused'
	}

	if (
		blob.includes('yield') ||
		blob.includes('income') ||
		blob.includes('covered call') ||
		blob.includes('dividend')
	) {
		return 'Income & Yield Strategies'
	}

	if (
		blob.includes('technology') ||
		blob.includes('ai') ||
		blob.includes('semiconductor') ||
		blob.includes('software')
	) {
		return 'Tech & Innovation Focused'
	}

	if (blob.includes('energy') || blob.includes('utilities') || blob.includes('oil') || blob.includes('gas')) {
		return 'Energy & Utilities Exposure'
	}

	if (blob.includes('finance') || blob.includes('bank') || blob.includes('credit') || blob.includes('mortgage')) {
		return 'Financials & Credit Exposure'
	}

	if (blob.includes('reit') || blob.includes('real estate') || blob.includes('property')) {
		return 'Real Assets & Real Estate'
	}

	if (blob.includes('etf') || blob.includes('fund') || blob.includes('trust')) {
		return 'Diversified & Individual Equities'
	}

	return 'Diversified & Individual Equities'
}

function parseCompactNumber(value?: string): number | null {
	if (!value) return null
	const normalized = value.trim().replace(/,/g, '').toUpperCase()
	const match = normalized.match(/^([0-9]*\.?[0-9]+)\s*([KMBT])?$/)
	if (!match) return null

	const base = Number(match[1])
	if (!Number.isFinite(base)) return null

	const multiplier = {
		K: 1_000,
		M: 1_000_000,
		B: 1_000_000_000,
		T: 1_000_000_000_000,
	}[match[2] as 'K' | 'M' | 'B' | 'T'] ?? 1

	return base * multiplier
}

function formatCurrency(value: number, currency: string): string {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency,
		maximumFractionDigits: value >= 100 ? 0 : 2,
	}).format(value)
}

function rowToHolding(row: ImportedWatchlistRow): HoldingEntry {
	const fallbackName =
		defaultStocks.find((stock) => stock.symbol === row.symbol)?.name ?? row.symbol

	return {
		symbol: row.symbol,
		name: row.name?.trim() || fallbackName,
		shares: row.shares,
		country: row.country?.trim(),
		city: row.city?.trim(),
		sector: row.sector?.trim(),
		coordinates:
			Number.isFinite(row.longitude) && Number.isFinite(row.latitude)
				? [row.longitude as number, row.latitude as number]
				: undefined,
	}
}

function createDefaultHoldings(): HoldingEntry[] {
	return defaultStocks.slice(0, 6).map((stock) => {
		const info = stockDatabase[stock.symbol]
		return {
			symbol: stock.symbol,
			name: info?.name ?? stock.name,
			shares: stock.shares,
			country: info?.location.country,
			city: info?.location.city,
			sector: info?.sector,
			coordinates: info?.location.coordinates,
		}
	})
}

export default function StockMonitorPage() {
	const isStaticDemoMode = process.env.NEXT_PUBLIC_STATIC_DEMO_MODE === 'true'
	const [holdings, setHoldings] = useState<HoldingEntry[]>(createDefaultHoldings)
	const [status, setStatus] = useState<StatusState>({
		message: 'Privacy mode on. Your uploaded symbols are never sent to external services.',
		tone: 'neutral',
	})
	const [isDragging, setIsDragging] = useState(false)
	const [searchQuery, setSearchQuery] = useState('')
	const [addQuery, setAddQuery] = useState('')
	const [addShares, setAddShares] = useState('')
	const [strategyFilter, setStrategyFilter] = useState<'All' | StrategyBucket>('All')
	const [strategyLabels, setStrategyLabels] = useState<StrategyLabelMap>(DEFAULT_STRATEGY_LABELS)
	const [selectedSymbol, setSelectedSymbol] = useState<string>('')
	const [intelLoading, setIntelLoading] = useState(false)
	const [intelData, setIntelData] = useState<ApiDashboard | null>(null)
	const csvInputRef = useRef<HTMLInputElement | null>(null)

	const stocks = useMemo<Stock[]>(() => {
		return holdings.map((holding) => {
			const stockInfo = stockDatabase[holding.symbol]
			const generated = generateStockData(holding.symbol, stockInfo?.name ?? holding.name)

			const shares = holding.shares ?? generated.shares
			const location =
				holding.country || holding.city || holding.coordinates
					? {
							country: holding.country ?? generated.location.country,
							city: holding.city ?? generated.location.city,
							coordinates: holding.coordinates ?? generated.location.coordinates,
						}
					: generated.location

			return {
				...generated,
				name: holding.name,
				shares,
				totalValue: generated.price * shares,
				sector: holding.sector ?? generated.sector,
				location,
			}
		})
	}, [holdings])

	const stockCatalog = useMemo(
		() =>
			Object.entries(stockDatabase).map(([symbol, info]) => ({
				symbol,
				name: info.name,
				sector: info.sector,
				country: info.location.country,
				city: info.location.city,
				coordinates: info.location.coordinates,
			})),
		[],
	)

	const addCandidates = useMemo(() => {
		const query = addQuery.trim().toLowerCase()
		if (!query) return stockCatalog.slice(0, 12)

		return stockCatalog
			.filter(
				(item) =>
					item.symbol.toLowerCase().includes(query) || item.name.toLowerCase().includes(query),
			)
			.slice(0, 12)
	}, [addQuery, stockCatalog])

	const handleRowsImport = (rows: ImportedWatchlistRow[], source: 'CSV') => {
		const next = rows.map(rowToHolding)
		setHoldings(next)
		setStatus({
			message: `Loaded ${next.length} holding(s) from ${source}.`,
			tone: 'success',
		})
	}

	const addHoldingByQuery = () => {
		const raw = addQuery.trim()
		if (!raw) {
			setStatus({ message: 'Enter a stock or ETF ticker/name first.', tone: 'error' })
			return
		}

		const normalizedTicker = raw.toUpperCase()
		const exactTicker = stockCatalog.find((item) => item.symbol === normalizedTicker)
		const exactName = stockCatalog.find((item) => item.name.toLowerCase() === raw.toLowerCase())
		const startsWith = stockCatalog.find(
			(item) =>
				item.symbol.toLowerCase().startsWith(raw.toLowerCase()) ||
				item.name.toLowerCase().startsWith(raw.toLowerCase()),
		)

		const match = exactTicker ?? exactName ?? startsWith
		if (!match) {
			setStatus({ message: `No stock/ETF match for "${raw}".`, tone: 'error' })
			return
		}

		if (holdings.some((holding) => holding.symbol === match.symbol)) {
			setSelectedSymbol(match.symbol)
			setStatus({ message: `${match.symbol} is already in your holdings.`, tone: 'neutral' })
			return
		}

		const parsedShares = Number(addShares)
		const shares = Number.isFinite(parsedShares) && parsedShares > 0 ? parsedShares : undefined

		setHoldings((prev) => [
			{
				symbol: match.symbol,
				name: match.name,
				shares,
				country: match.country,
				city: match.city,
				sector: match.sector,
				coordinates: match.coordinates,
			},
			...prev,
		])
		setSelectedSymbol(match.symbol)
		setStatus({ message: `Added ${match.symbol} (${match.name}).`, tone: 'success' })
	}

	const handleCsvUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0]
		if (!file) return

		try {
			const csvText = await file.text()
			const rows = parseWatchlistCsv(csvText)

			if (rows.length === 0) {
				setStatus({
					message: 'CSV parsed, but no valid symbols were found.',
					tone: 'error',
				})
				return
			}

			handleRowsImport(rows, 'CSV')
		} catch (error) {
			const message = error instanceof Error ? error.message : 'CSV upload failed.'
			setStatus({ message, tone: 'error' })
		} finally {
			event.target.value = ''
		}
	}

	const onDropFiles = async (event: React.DragEvent<HTMLDivElement>) => {
		event.preventDefault()
		setIsDragging(false)

		const file = event.dataTransfer.files?.[0]
		if (!file) return

		if (file.type.includes('csv') || file.name.toLowerCase().endsWith('.csv')) {
			try {
				const csvText = await file.text()
				const rows = parseWatchlistCsv(csvText)
				if (rows.length === 0) {
					setStatus({
						message: 'Dropped CSV parsed, but no valid symbols were found.',
						tone: 'error',
					})
					return
				}
				handleRowsImport(rows, 'CSV')
			} catch (error) {
				const message = error instanceof Error ? error.message : 'Dropped CSV upload failed.'
				setStatus({ message, tone: 'error' })
			}
			return
		}


		setStatus({ message: 'Unsupported file type. Use CSV only.', tone: 'error' })
	}

	const filteredHoldings = useMemo(() => {
		const query = searchQuery.trim().toLowerCase()
		if (!query) return holdings
		return holdings.filter((holding) =>
			[holding.symbol, holding.name, holding.country, holding.city, holding.sector]
				.filter(Boolean)
				.join(' ')
				.toLowerCase()
				.includes(query)
		)
	}, [holdings, searchQuery])

	const strategyBySymbol = useMemo(() => {
		const entries = holdings.map((holding) => {
			const assetType =
				intelData?.googleFinanceDetails?.[holding.symbol]?.type ??
				inferAssetTypeFallback(holding.name, holding.symbol, holding.sector)

			const strategy = classifyStrategyBucket({
				name: holding.name,
				symbol: holding.symbol,
				sector: holding.sector,
				assetType,
			})

			return [holding.symbol, strategy] as const
		})

		return Object.fromEntries(entries) as Record<string, StrategyBucket>
	}, [holdings, intelData])

	const displayedHoldings = useMemo(() => {
		if (strategyFilter === 'All') {
			return filteredHoldings
		}

		return filteredHoldings.filter((holding) => strategyBySymbol[holding.symbol] === strategyFilter)
	}, [filteredHoldings, strategyBySymbol, strategyFilter])

	useEffect(() => {
		if (holdings.length === 0) {
			setSelectedSymbol('')
			return
		}

		setSelectedSymbol((current) =>
			current && holdings.some((holding) => holding.symbol === current)
				? current
				: holdings[0]?.symbol ?? ''
		)
	}, [holdings])

	useEffect(() => {
		if (stocks.length === 0) {
			setIntelData(null)
			return
		}

		const controller = new AbortController()

		const fetchIntel = async () => {
			setIntelLoading(true)
			try {
				const response = await fetch('/api/market-intelligence', {
					method: 'POST',
					headers: {
						'content-type': 'application/json',
					},
					body: JSON.stringify({ symbols: stocks.map((stock) => stock.symbol) }),
					signal: controller.signal,
				})

				if (!response.ok) {
					throw new Error('World intelligence feed failed.')
				}

				const data = (await response.json()) as ApiDashboard
				setIntelData(data)
			} catch (error) {
				if ((error as Error).name !== 'AbortError') {
					setStatus({
						message: 'World intelligence API unavailable. Showing holdings only.',
						tone: 'error',
					})
				}
			} finally {
				setIntelLoading(false)
			}
		}

		void fetchIntel()

		return () => controller.abort()
	}, [stocks])

	const selectedStock = useMemo(
		() => stocks.find((stock) => stock.symbol === selectedSymbol),
		[stocks, selectedSymbol],
	)

	const selectedImplication = useMemo(
		() => intelData?.implications.find((implication) => implication.symbol === selectedSymbol),
		[intelData, selectedSymbol],
	)

	const linkedEvents = useMemo(() => {
		if (!intelData || !selectedImplication) return []
		const idSet = new Set(selectedImplication.linkedEventIds)
		return intelData.events.filter((event) => idSet.has(event.id)).slice(0, 3)
	}, [intelData, selectedImplication])

	const selectedStockReview = useMemo(() => {
		if (!selectedStock) return null

		const detail = intelData?.googleFinanceDetails?.[selectedStock.symbol]
		const aiReview = intelData?.aiStockReviews?.[selectedStock.symbol]
		const stockType = detail?.type ?? inferAssetTypeFallback(selectedStock.name, selectedStock.symbol, selectedStock.sector)
		const originCountry = selectedStock.location.country || 'Unknown'
		const marketCapRaw = detail?.marketCap
		const marketCapNumber = parseCompactNumber(marketCapRaw)

		const dependentCountries =
			aiReview?.dependentCountries.length
				? aiReview.dependentCountries
				: Array.from(
						new Set(
							(
								intelData?.events.filter((event) => event.affectedSymbols?.includes(selectedStock.symbol)) ?? []
							)
								.map((event) => event.country)
								.filter(Boolean),
						),
				  )

		const impactFactors: string[] = []

		if (selectedImplication) {
			for (const reason of selectedImplication.reasoning.slice(0, 3)) {
				impactFactors.push(reason)
			}
		}

		if (aiReview?.impactFactors.length) {
			for (const factor of aiReview.impactFactors.slice(0, 4)) {
				impactFactors.push(`AI: ${factor}`)
			}
		}

		for (const event of linkedEvents.slice(0, 3)) {
			impactFactors.push(`${event.country} (${event.region}) pressure: ${event.summary}`)
		}

		if (detail?.peRatio) {
			impactFactors.push(`Valuation sensitivity from P/E ratio: ${detail.peRatio}`)
		}

		if (detail?.exchange) {
			impactFactors.push(`Listing and liquidity exposure via ${detail.exchange}`)
		}

		return {
			stockType,
			originCountry,
			marketCapRaw,
			marketCapNumber,
			positionValue: selectedStock.totalValue,
			currency: detail?.currency ?? selectedStock.currency,
			dependentCountries,
			impactFactors: Array.from(new Set(impactFactors)).slice(0, 6),
			aiGeneratedBy: aiReview?.generatedBy,
			aiConfidence: aiReview?.confidence,
		}
	}, [intelData, linkedEvents, selectedImplication, selectedStock])

	const stockNewsSignals = useMemo(() => {
		if (!selectedSymbol || !intelData) return [] as StockSignal[]

		const googleNews = intelData.googleFinanceNews?.[selectedSymbol] ?? []
		if (googleNews.length > 0) {
			return googleNews.slice(0, 4).map((item, index) => ({
				id: `${selectedSymbol}-google-${index}`,
				title: item.title,
				summary: item.snippet ?? `${item.source ?? 'Google Finance'} ${item.date ? `• ${item.date}` : ''}`.trim(),
				link: item.link,
				sourceTag: 'SerpApi' as const,
			}))
		}

		const alphaNews = intelData.alphaVantageNews?.[selectedSymbol] ?? []
		if (alphaNews.length > 0) {
			return alphaNews.slice(0, 4).map((item, index) => ({
				id: `${selectedSymbol}-alpha-${index}`,
				title: item.title,
				summary: item.snippet ?? `${item.source ?? 'Alpha Vantage'} ${item.date ? `• ${item.date}` : ''}`.trim(),
				link: item.link,
				sourceTag: 'Alpha Vantage' as const,
			}))
		}

		const relevanceFromEvents = intelData.events.filter((event) =>
			event.affectedSymbols?.includes(selectedSymbol),
		)

		if (relevanceFromEvents.length > 0) {
			return relevanceFromEvents.slice(0, 4).map((event) => ({
				id: `event-${event.id}`,
				title: event.title,
				summary: `${event.country} (${event.region}) severity ${event.severity}`,
				sourceTag: 'Internal Event' as const,
			}))
		}

		return linkedEvents.slice(0, 4).map((event) => ({
			id: `linked-${event.id}`,
			title: event.title,
			summary: `${event.country} (${event.region}) severity ${event.severity}`,
			sourceTag: 'Internal Event' as const,
		}))
	}, [intelData, linkedEvents, selectedSymbol])

	const countriesTracked = useMemo(
		() => new Set(holdings.map((holding) => holding.country).filter(Boolean)).size,
		[holdings],
	)

	const totalShares = useMemo(
		() => holdings.reduce((sum, holding) => sum + (holding.shares ?? 0), 0),
		[holdings],
	)

	const holdingTypeBreakdown = useMemo(() => {
		const breakdown = new Map<string, number>()

		for (const holding of holdings) {
			const typeFromGoogle = intelData?.googleFinanceDetails?.[holding.symbol]?.type
			const type = typeFromGoogle ?? inferAssetTypeFallback(holding.name, holding.symbol, holding.sector)
			breakdown.set(type, (breakdown.get(type) ?? 0) + 1)
		}

		return Array.from(breakdown.entries())
			.sort((a, b) => b[1] - a[1])
			.map(([type, count]) => ({ type, count }))
	}, [holdings, intelData])

	const strategyBreakdown = useMemo(() => {
		const breakdown = new Map<StrategyBucket, number>()

		for (const holding of holdings) {
			const strategy = strategyBySymbol[holding.symbol]
			if (!strategy) continue
			breakdown.set(strategy, (breakdown.get(strategy) ?? 0) + 1)
		}

		return Array.from(breakdown.entries())
			.sort((a, b) => b[1] - a[1])
			.map(([strategy, count]) => ({ strategy, count }))
	}, [holdings, strategyBySymbol])

	const strategyFilterOptions = useMemo(() => {
		return ['All', ...strategyBreakdown.map((item) => item.strategy)] as Array<'All' | StrategyBucket>
	}, [strategyBreakdown])

	const statusToneClass = {
		neutral: 'border-[#24313e] bg-[#0b1522] text-[#9ab0c4]',
		success: 'border-[#1f5138] bg-[#0b2018] text-[#8ee5b7]',
		error: 'border-[#7f1d1d] bg-[#321012] text-[#fca5a5]',
	}[status.tone]

	const statusIcon = {
		neutral: <FileUp className="h-4 w-4" />,
		success: <CheckCircle2 className="h-4 w-4" />,
		error: <TriangleAlert className="h-4 w-4" />,
	}[status.tone]

	return (
		<main className="wm-shell min-h-screen bg-[radial-gradient(1200px_circle_at_10%_0%,#1a2735_0%,#05080d_55%,#020408_100%)] px-4 py-6 text-[#d4dde6]">
			<div className="mx-auto max-w-[1500px] space-y-4">
				{isStaticDemoMode && (
					<div className="wm-panel wm-cornered rounded-md border border-[#7f1d1d] bg-[#3a1012] px-4 py-2 text-[11px] uppercase tracking-[0.1em] text-[#fecaca]">
						Static Demo Mode: GitHub Pages build detected. API routes and local LLM runtime features are disabled in this hosted preview.
					</div>
				)}
				<header className="wm-panel wm-cornered rounded-xl px-4 py-3 backdrop-blur-sm">
					<div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#24313e] pb-3">
						<div>
							<p className="wm-panel-title">Market Surveillance Console</p>
							<h1 className="font-display text-3xl font-semibold uppercase tracking-[0.1em] text-[#e8eef5]">StockMonitor</h1>
							<p className="text-xs uppercase tracking-[0.12em] text-[#8ea3b6]">
								Track holdings, location exposure, and world-linked stock signals.
							</p>
						</div>
						<div className="flex items-center gap-2">
							<Badge className="rounded-sm border border-[#1f5138] bg-[#0f2b1f] px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-[#86efac]">
								2D map mode
							</Badge>
							<Badge className="rounded-sm border border-[#14532d] bg-[#052e1f] px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-[#86efac]">
								Privacy mode: strict
							</Badge>
							<Badge className="rounded-sm border border-[#7f1d1d] bg-[#3f1012] px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-[#fda4af]">
								Nothing is saved
							</Badge>
						</div>
					</div>

					<div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
						<div className="rounded-md border border-[#2a3b4b] bg-[#0b1522] px-3 py-2">
							<p className="text-[10px] uppercase tracking-[0.12em] text-[#7f96ab]">Tracked holdings</p>
							<p className="font-display text-xl text-[#e8eef5]">{holdings.length}</p>
						</div>
						<div className="rounded-md border border-[#2a3b4b] bg-[#0b1522] px-3 py-2">
							<p className="text-[10px] uppercase tracking-[0.12em] text-[#7f96ab]">Countries</p>
							<p className="font-display text-xl text-[#e8eef5]">{countriesTracked}</p>
						</div>
						<div className="rounded-md border border-[#2a3b4b] bg-[#0b1522] px-3 py-2">
							<p className="text-[10px] uppercase tracking-[0.12em] text-[#7f96ab]">Total shares</p>
							<p className="font-display text-xl text-[#e8eef5]">{totalShares.toFixed(2)}</p>
						</div>
						<div className="rounded-md border border-[#2a3b4b] bg-[#0b1522] px-3 py-2">
							<p className="text-[10px] uppercase tracking-[0.12em] text-[#7f96ab]">Intel status</p>
							<p className="inline-flex items-center gap-1.5 font-display text-xl text-[#e8eef5]">
								<Activity className="h-4 w-4 text-[#fbbf24]" />
								{intelLoading ? 'Refreshing' : 'Live'}
							</p>
						</div>
					</div>

					<div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[#24313e] pt-3">
						<span className="wm-chip">global risk radar</span>
						<span className="wm-chip">portfolio dependence map</span>
						<span className="wm-chip">signal correlation</span>
						<span className="wm-chip">operator mode</span>
					</div>

					<div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-[#24313e] pt-2">
						<span className="wm-key">F1 Intake</span>
						<span className="wm-key">F2 Review</span>
						<span className="wm-key">F3 Map</span>
						<span className="wm-key">F4 Signals</span>
						<span className="wm-key">Esc Clear</span>
					</div>
				</header>

				<div className="grid gap-4 xl:grid-cols-[0.9fr_1.5fr]">
					<section className="wm-panel wm-cornered rounded-xl">
						<div className="border-b border-[#24313e] px-4 py-3">
							<p className="text-[11px] uppercase tracking-[0.16em] text-[#7f96ab]">Tile 01</p>
							<h2 className="font-display text-xl font-semibold uppercase tracking-[0.1em] text-[#e8eef5]">Portfolio Intake</h2>
							<p className="text-xs uppercase tracking-[0.12em] text-[#8ea3b6]">
								Import holdings, search and add tickers, then select a symbol for world briefing.
							</p>
						</div>

						<div className="space-y-3 p-4">
							<div
								onDragOver={(event) => {
									event.preventDefault()
									setIsDragging(true)
								}}
								onDragLeave={() => setIsDragging(false)}
								onDrop={onDropFiles}
								className={`rounded-md border border-dashed px-3 py-3 text-center text-xs uppercase tracking-[0.1em] transition-colors ${
									isDragging
										? 'border-[#4e6a83] bg-[#132131] text-[#d4e1ee]'
										: 'border-[#304356] bg-[#0b1522] text-[#8ea3b6]'
								}`}
							>
								Drop CSV file here
							</div>

							<div className="flex flex-wrap gap-2">
								<label>
									<Input
										ref={csvInputRef}
										type="file"
										accept=".csv,text/csv,text/plain"
										className="hidden"
										onChange={handleCsvUpload}
									/>
									<button
										type="button"
										onClick={() => csvInputRef.current?.click()}
										className="inline-flex cursor-pointer items-center gap-2 rounded-sm border border-[#304356] bg-[#101a27] px-3 py-2 text-xs uppercase tracking-[0.1em] text-[#c4d1de] hover:bg-[#172231]"
									>
										<FileUp className="h-4 w-4" />
										Upload CSV
									</button>
								</label>

								<button
									type="button"
									onClick={addHoldingByQuery}
									className="inline-flex cursor-pointer items-center gap-2 rounded-sm border border-[#304356] bg-[#101a27] px-3 py-2 text-xs uppercase tracking-[0.1em] text-[#c4d1de] hover:bg-[#172231]"
								>
									Add by Search
								</button>

								<button
									type="button"
									onClick={() => {
										setHoldings([])
										setSearchQuery('')
										setAddQuery('')
										setAddShares('')
										setStatus({ message: 'Holdings cleared.', tone: 'neutral' })
									}}
									className="inline-flex cursor-pointer items-center gap-2 rounded-sm border border-[#304356] bg-[#101a27] px-3 py-2 text-xs uppercase tracking-[0.1em] text-[#c4d1de] hover:bg-[#172231]"
								>
									<Trash2 className="h-4 w-4" />
									Clear
								</button>
							</div>

							<div className={`flex items-center gap-2 rounded border px-3 py-2 text-xs uppercase tracking-[0.08em] ${statusToneClass}`}>
								{statusIcon}
								{status.message}
							</div>

							<div className="rounded border border-[#24313e] bg-[#0b1522] px-2 py-1.5">
								<div className="flex items-center gap-2 text-[#a8bbcd]">
									<Search className="h-4 w-4" />
									<input
										type="text"
										value={searchQuery}
										onChange={(event) => setSearchQuery(event.target.value)}
										placeholder="Search symbol, country, sector"
										className="w-full bg-transparent text-xs uppercase tracking-[0.08em] text-[#d4dde6] outline-none placeholder:text-[#6f859a]"
									/>
								</div>
							</div>

							<div className="rounded border border-[#24313e] bg-[#0b1522] p-2">
								<p className="mb-1 text-[10px] uppercase tracking-[0.12em] text-[#7f96ab]">Add stock or ETF</p>
								<div className="flex flex-wrap gap-2">
									<input
										type="text"
										list="stock-catalog"
										value={addQuery}
										onChange={(event) => setAddQuery(event.target.value)}
										onKeyDown={(event) => {
											if (event.key === 'Enter') {
												event.preventDefault()
												addHoldingByQuery()
											}
										}}
										placeholder="Search stock/ETF by ticker or name"
										className="min-w-[240px] flex-1 rounded-sm border border-[#304356] bg-[#101a27] px-3 py-2 text-xs uppercase tracking-[0.08em] text-[#d4dde6] outline-none placeholder:text-[#6f859a]"
									/>
									<input
										type="number"
										min="0"
										step="0.01"
										value={addShares}
										onChange={(event) => setAddShares(event.target.value)}
										placeholder="Shares (optional)"
										className="w-[170px] rounded-sm border border-[#304356] bg-[#101a27] px-3 py-2 text-xs uppercase tracking-[0.08em] text-[#d4dde6] outline-none placeholder:text-[#6f859a]"
									/>
								</div>
								<datalist id="stock-catalog">
									{addCandidates.map((item) => (
										<option key={item.symbol} value={item.symbol}>{item.name}</option>
									))}
								</datalist>
							</div>

							<div className="grid grid-cols-3 gap-2 text-center text-[10px] uppercase tracking-[0.09em] text-[#8ea3b6]">
								<div className="rounded border border-[#24313e] bg-[#0a111b] px-2 py-1.5">Loaded: {holdings.length}</div>
								<div className="rounded border border-[#24313e] bg-[#0a111b] px-2 py-1.5">Shown: {displayedHoldings.length}</div>
								<div className="rounded border border-[#24313e] bg-[#0a111b] px-2 py-1.5">Countries: {countriesTracked}</div>
							</div>

							<div className="rounded border border-[#24313e] bg-[#0a111b] p-3">
								<div className="flex flex-wrap items-center justify-between gap-2">
									<p className="font-display text-sm uppercase tracking-[0.1em] text-[#d7e2ee]">Strategy Groups</p>
									<select
										value={strategyFilter}
										onChange={(event) => setStrategyFilter(event.target.value as 'All' | StrategyBucket)}
										className="rounded-sm border border-[#304356] bg-[#101a27] px-2 py-1 text-[10px] uppercase tracking-[0.08em] text-[#c4d1de] outline-none"
									>
										{strategyFilterOptions.map((option) => (
											<option key={option} value={option}>{option === 'All' ? 'All Groups' : strategyLabels[option]}</option>
										))}
									</select>
								</div>
								{strategyBreakdown.length > 0 ? (
									<div className="mt-2 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.08em]">
										{strategyBreakdown.map((item) => (
											<Badge
												key={item.strategy}
												className="rounded-sm border border-[#304356] bg-[#101a27] px-2 py-1 text-[#9ec6ff]"
											>
												{strategyLabels[item.strategy]}: {item.count}
											</Badge>
										))}
									</div>
								) : (
									<p className="mt-2 text-[11px] uppercase tracking-[0.08em] text-[#85a0b7]">Upload CSV to generate strategy groups.</p>
								)}
								{strategyBreakdown.length > 0 && (
									<div className="mt-3 rounded border border-[#304356] bg-[#101a27] p-2">
										<p className="mb-2 text-[10px] uppercase tracking-[0.1em] text-[#8ea3b6]">Customize group labels</p>
										<div className="grid gap-2 md:grid-cols-2">
											{strategyBreakdown.map((item) => (
												<label key={`label-${item.strategy}`} className="space-y-1 text-[10px] uppercase tracking-[0.08em] text-[#8ea3b6]">
													<span>{item.strategy}</span>
													<input
														type="text"
														value={strategyLabels[item.strategy]}
														onChange={(event) => {
															const nextLabel = event.target.value || DEFAULT_STRATEGY_LABELS[item.strategy]
															setStrategyLabels((prev) => ({
																...prev,
																[item.strategy]: nextLabel,
															}))
														}}
														className="w-full rounded-sm border border-[#3b5064] bg-[#0b1522] px-2 py-1 text-[11px] uppercase tracking-[0.08em] text-[#d4dde6] outline-none"
													/>
												</label>
											))}
										</div>
										<div className="mt-2">
											<button
												type="button"
												onClick={() => setStrategyLabels(DEFAULT_STRATEGY_LABELS)}
												className="rounded-sm border border-[#304356] bg-[#0b1522] px-2 py-1 text-[10px] uppercase tracking-[0.08em] text-[#c4d1de] hover:bg-[#122130]"
											>
												Reset Group Labels
											</button>
										</div>
									</div>
								)}
							</div>

							<div className="rounded border border-[#24313e] bg-[#0a111b] p-3">
								<p className="font-display text-sm uppercase tracking-[0.1em] text-[#d7e2ee]">Asset Type Breakdown</p>
								{holdingTypeBreakdown.length > 0 ? (
									<div className="mt-2 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.08em]">
										{holdingTypeBreakdown.map((item) => (
											<Badge
												key={item.type}
												className="rounded-sm border border-[#304356] bg-[#101a27] px-2 py-1 text-[#c4d1de]"
											>
												{item.type}: {item.count}
											</Badge>
										))}
									</div>
								) : (
									<p className="mt-2 text-[11px] uppercase tracking-[0.08em] text-[#85a0b7]">Upload CSV to generate asset breakdown.</p>
								)}
							</div>

							<div className="rounded border border-[#24313e] bg-[#0a111b] p-3">
								<p className="text-[10px] uppercase tracking-[0.12em] text-[#7f96ab]">Review Panel</p>
								<p className="mt-1 text-[11px] uppercase tracking-[0.08em] text-[#85a0b7]">
									Stock review has moved to the side panel beside the world map for a WorldMonitor-style command layout.
								</p>
							</div>

							<div className="max-h-[62vh] space-y-2 overflow-auto pr-1">
								{displayedHoldings.map((holding) => (
									<button
										type="button"
										key={holding.symbol}
										onClick={() => setSelectedSymbol(holding.symbol)}
										className={`w-full rounded border p-3 text-left transition-colors hover:border-[#3a4f63] ${selectedSymbol === holding.symbol ? 'border-[#4e6a83] bg-[#132131]' : 'border-[#24313e] bg-[#0a111b]'}`}
									>
										<div className="flex items-center justify-between gap-2">
											<div>
												<p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#e8eef5]">{holding.symbol}</p>
												<p className="text-xs uppercase tracking-[0.07em] text-[#90a4b8]">{holding.name}</p>
											</div>
											<div className="flex items-center gap-1.5">
												<Badge className="rounded-sm border border-[#334155] bg-[#0f1723] text-[10px] uppercase tracking-[0.08em] text-[#c0ccd8]">
													{holding.shares?.toFixed(2) ?? 'N/A'} shares
												</Badge>
												<Badge className="rounded-sm border border-[#304356] bg-[#101a27] text-[10px] uppercase tracking-[0.08em] text-[#9ec6ff]">
													{intelData?.googleFinanceDetails?.[holding.symbol]?.type ?? inferAssetTypeFallback(holding.name, holding.symbol, holding.sector)}
												</Badge>
												<Badge className="rounded-sm border border-[#2d4b66] bg-[#0e1f31] text-[9px] uppercase tracking-[0.08em] text-[#b7dcff]">
													{strategyLabels[strategyBySymbol[holding.symbol] ?? 'Other']}
												</Badge>
											</div>
										</div>
										<p className="mt-1 text-[11px] uppercase tracking-[0.07em] text-[#8397aa]">
											{holding.city ?? 'Unknown city'}, {holding.country ?? 'Unknown country'}
										</p>
										{intelData?.googleFinanceDetails?.[holding.symbol] && (
											<p className="text-[11px] uppercase tracking-[0.07em] text-[#83a0b5]">
												{intelData.googleFinanceDetails[holding.symbol]?.exchange ?? 'N/A'}
												{intelData.googleFinanceDetails[holding.symbol]?.marketCap ? ` • MCap ${intelData.googleFinanceDetails[holding.symbol]?.marketCap}` : ''}
											</p>
										)}
										<p className="text-[11px] uppercase tracking-[0.07em] text-[#8397aa]">
											Business: {holding.sector ?? 'Unknown'}
										</p>
									</button>
								))}
								{holdings.length === 0 && (
									<div className="rounded border border-dashed border-[#304356] bg-[#0a111b] p-6 text-center text-xs uppercase tracking-[0.1em] text-[#90a4b8]">
										No holdings loaded yet. CSV headers supported: symbol,name,shares,country,city,sector,latitude,longitude.
									</div>
								)}
								{holdings.length > 0 && displayedHoldings.length === 0 && (
									<div className="rounded border border-dashed border-[#304356] bg-[#0a111b] p-6 text-center text-xs uppercase tracking-[0.1em] text-[#90a4b8]">
										No holdings match your current search/filter.
									</div>
								)}
							</div>
						</div>
					</section>

					<section className="wm-panel wm-cornered rounded-xl p-3">
						<div className="mb-2 space-y-2 px-1">
							<div className="flex items-center justify-between">
								<p className="text-[11px] uppercase tracking-[0.16em] text-[#7f96ab]">Tile 02</p>
								<p className="text-[10px] uppercase tracking-[0.14em] text-[#8ea3b6]">World Map + Side Panel</p>
							</div>
							<div className="rounded border border-[#2a3b4b] bg-[#0b1522] px-3 py-2 text-[11px] uppercase tracking-[0.08em] text-[#9bb0c3]">
								<p className="inline-flex items-center gap-1.5 font-display text-sm text-[#e8eef5]">
									<Globe2 className="h-4 w-4 text-[#fbbf24]" />
									{selectedStock ? `Focus: ${selectedStock.symbol}` : 'Select a stock for map context'}
								</p>
								{selectedStock && (
									<p className="mt-1 text-[#85a0b7]">
										{selectedStock.name} • {selectedStock.location.city}, {selectedStock.location.country}
									</p>
								)}
							</div>
						</div>
						<div className="grid gap-3 xl:grid-cols-[1.45fr_0.85fr]">
							<InvestmentMap stocks={stocks} onStockClick={(stock) => setSelectedSymbol(stock.symbol)} />
							<aside className="wm-panel wm-cornered rounded-lg p-3 xl:max-h-[78vh] xl:overflow-auto">
								<div className="sticky top-0 z-10 -mx-3 -mt-3 mb-3 border-b border-[#2b3f52] bg-[#0d1623f2] px-3 py-2 backdrop-blur-sm">
									<p className="wm-panel-title">Side Panel</p>
									<p className="font-display text-sm uppercase tracking-[0.1em] text-[#e8eef5]">Stock Review Console</p>
								</div>
								{selectedStock ? (
									<div className="space-y-3 text-[11px] uppercase tracking-[0.08em] text-[#9bb0c3]">
										<div className="rounded border border-[#24384a] bg-[#0a131e] p-2">
											<p className="text-[#d7e2ee]"><span className="font-display text-base text-[#eef4fa]">{selectedStock.symbol}</span> {selectedStock.name}</p>
											<p className="mt-1">Country: {selectedStockReview?.originCountry ?? 'Unknown'}</p>
											<p>Type: {selectedStockReview?.stockType ?? 'Unknown'}</p>
											<p>Net worth: {selectedStockReview?.marketCapRaw ?? 'N/A'}
												{selectedStockReview?.marketCapNumber
													? ` (${formatCurrency(selectedStockReview.marketCapNumber, selectedStockReview.currency)})`
													: ''}
											</p>
											<p>Position value: {formatCurrency(selectedStockReview?.positionValue ?? selectedStock.totalValue, selectedStockReview?.currency ?? selectedStock.currency)}</p>
										</div>

										<div className="rounded border border-[#24384a] bg-[#0a131e] p-2">
											<p className="text-[#d7e2ee]">Dependency Countries</p>
											<p className="mt-1 text-[#85a0b7]">{selectedStockReview?.dependentCountries.length ? selectedStockReview.dependentCountries.join(', ') : 'No direct dependency signals yet'}</p>
										</div>

										<div className="rounded border border-[#24384a] bg-[#0a131e] p-2">
											<p className="text-[#d7e2ee]">Growth and Value Factors</p>
											{selectedStockReview?.impactFactors.length ? (
												<div className="mt-1 space-y-1 text-[#85a0b7]">
													{selectedStockReview.impactFactors.map((factor) => (
														<p key={factor}>• {factor}</p>
													))}
												</div>
											) : (
												<p className="mt-1 text-[#85a0b7]">Awaiting factor data.</p>
											)}
										</div>

										{stockNewsSignals.length > 0 && (
											<div className="rounded border border-[#24384a] bg-[#0a131e] p-2">
												<p className="text-[#d7e2ee]">Linked Signals</p>
												<div className="mt-1 space-y-1">
													{stockNewsSignals.map((event) => (
														<div key={`side-news-${event.id}`} className="rounded border border-[#24313e] bg-[#0b1522] px-2 py-1.5 text-[#85a0b7]">
															<div className="flex items-center gap-2">
																<Badge className="rounded-sm border border-[#304356] bg-[#101a27] px-1.5 py-0 text-[9px] uppercase tracking-[0.08em] text-[#c4d1de]">{event.sourceTag}</Badge>
																{event.link ? (
																	<a href={event.link} target="_blank" rel="noreferrer" className="text-[#9ec6ff] underline decoration-[#3f6fa3] underline-offset-2">{event.title}</a>
																) : (
																	<p className="text-[#d7e2ee]">{event.title}</p>
																)}
															</div>
															<p>{event.summary}</p>
														</div>
													))}
												</div>
											</div>
										)}

										{selectedStockReview?.aiGeneratedBy && (
											<p className="text-[#7ea0b8]">AI foundation: {selectedStockReview.aiGeneratedBy}{selectedStockReview.aiConfidence ? ` (${selectedStockReview.aiConfidence} confidence)` : ''}</p>
										)}
										{intelData?.source && <p className="text-[#6f859a]">Source: {intelData.source}</p>}
										{intelData?.privacyMode && (
											<p className="text-[#6f859a]">
												Privacy: Uploaded symbols not sent externally.
												{intelData.externalReferenceSymbols?.length
													? ` Reference feed uses ${intelData.externalReferenceSymbols.join(', ')}`
													: ''}
											</p>
										)}
										{intelData?.aiProvider && (
											<p className="text-[#6f859a]">AI Provider: {intelData.aiProvider.provider}{intelData.aiProvider.model ? ` (${intelData.aiProvider.model})` : ''}{intelData.aiProvider.reason ? ` • ${intelData.aiProvider.reason}` : ''}</p>
										)}
									</div>
								) : (
									<p className="text-[11px] uppercase tracking-[0.08em] text-[#85a0b7]">Select or upload a stock to view review in this side panel.</p>
								)}
							</aside>
						</div>
					</section>
				</div>

				<p className="text-center text-[11px] uppercase tracking-[0.14em] text-[#8ea3b6]">
					Nothing will be saved. Refreshing or closing this page clears uploaded holdings.
				</p>
			</div>
		</main>
	)
}
