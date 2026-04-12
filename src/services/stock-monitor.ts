import Papa from 'papaparse';
import { toApiUrl } from '@/services/runtime';

export type StockRelationshipType = 'Revenue' | 'Supply Chain' | 'Regulatory' | 'Geopolitical';
export type StockRiskLevel = 'low' | 'medium' | 'high';

export interface StockExposureCountry {
  code: string;
  name: string;
  relationship: StockRelationshipType;
  risk: StockRiskLevel;
  note: string;
}

export interface StockCatalogEntry {
  ticker: string;
  companyName: string;
  exchange: string;
  googleSymbol: string;
  sector: string;
  industry: string;
  hqCity: string;
  hqCountry: string;
  countryCode: string;
  lat: number;
  lon: number;
  currency: string;
  mockPrice: number;
  mockChangePercent: number;
  relatedCountries: StockExposureCountry[];
}

export interface StockQuoteSnapshot {
  price: number;
  changePercent: number;
  change: number | null;
  currency: string;
  source: 'google' | 'mock';
  fetchedAt: string;
  previousClose?: number | null;
  yearRange?: string | null;
  marketCap?: string | null;
}

export interface StockNewsItem {
  title: string;
  url: string;
  source: string;
  publishedAt: string | null;
  impactScore: number;
  impactReason: string;
}

export interface StockRiskSnapshot {
  overallLevel: StockRiskLevel;
  overallScore: number;
  positionWeightPct: number;
  countryRiskScore: number;
  concentrationRisk: StockRiskLevel;
  exposureBars: Array<{
    name: string;
    valuePct: number;
    risk: StockRiskLevel;
  }>;
}

export interface PortfolioGroupBreakdown {
  key: string;
  label: string;
  value: number;
  weightPct: number;
  holdings: number;
}

export interface PortfolioRowInput {
  ticker: string;
  shares: number;
  currency?: string;
  purchasePrice?: number | null;
  purchaseDate?: string | null;
}

export interface PortfolioHolding extends StockCatalogEntry {
  shares: number;
  purchasePrice: number | null;
  purchaseDate: string | null;
  quote: StockQuoteSnapshot;
  positionValue: number;
  allTimeReturnPct: number | null;
  holdingDays: number | null;
  annualizedReturnPct: number | null;
}

function normalizePurchaseDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

const STOCK_CATALOG: StockCatalogEntry[] = [
  {
    ticker: 'AAPL', companyName: 'Apple Inc', exchange: 'NASDAQ', googleSymbol: 'AAPL:NASDAQ', sector: 'Technology', industry: 'Consumer Electronics',
    hqCity: 'Cupertino', hqCountry: 'United States', countryCode: 'US', lat: 37.3349, lon: -122.0090, currency: 'USD', mockPrice: 260.48, mockChangePercent: -0.01,
    relatedCountries: [
      { code: 'CN', name: 'China', relationship: 'Supply Chain', risk: 'high', note: 'Manufacturing concentration and supplier depth.' },
      { code: 'IN', name: 'India', relationship: 'Supply Chain', risk: 'medium', note: 'Assembly diversification and labor scale.' },
      { code: 'JP', name: 'Japan', relationship: 'Revenue', risk: 'low', note: 'Premium consumer demand and key component partners.' },
    ],
  },
  {
    ticker: 'TSLA', companyName: 'Tesla Inc', exchange: 'NASDAQ', googleSymbol: 'TSLA:NASDAQ', sector: 'Automotive', industry: 'Electric Vehicles',
    hqCity: 'Austin', hqCountry: 'United States', countryCode: 'US', lat: 30.2672, lon: -97.7431, currency: 'USD', mockPrice: 349.0, mockChangePercent: 0.99,
    relatedCountries: [
      { code: 'CN', name: 'China', relationship: 'Revenue', risk: 'high', note: 'Large EV demand and local competition pressure.' },
      { code: 'DE', name: 'Germany', relationship: 'Supply Chain', risk: 'medium', note: 'European production and regulatory exposure.' },
      { code: 'MX', name: 'Mexico', relationship: 'Geopolitical', risk: 'medium', note: 'North American manufacturing route optionality.' },
    ],
  },
  {
    ticker: 'NVDA', companyName: 'NVIDIA Corp', exchange: 'NASDAQ', googleSymbol: 'NVDA:NASDAQ', sector: 'Technology', industry: 'Semiconductors',
    hqCity: 'Santa Clara', hqCountry: 'United States', countryCode: 'US', lat: 37.3541, lon: -121.9552, currency: 'USD', mockPrice: 188.75, mockChangePercent: 2.61,
    relatedCountries: [
      { code: 'TW', name: 'Taiwan', relationship: 'Supply Chain', risk: 'high', note: 'Advanced chip fabrication dependency.' },
      { code: 'KR', name: 'South Korea', relationship: 'Supply Chain', risk: 'medium', note: 'HBM memory and packaging ecosystem.' },
      { code: 'SG', name: 'Singapore', relationship: 'Revenue', risk: 'low', note: 'Regional AI infrastructure demand.' },
    ],
  },
  {
    ticker: 'AMD', companyName: 'Advanced Micro Devices', exchange: 'NASDAQ', googleSymbol: 'AMD:NASDAQ', sector: 'Technology', industry: 'Semiconductors',
    hqCity: 'Santa Clara', hqCountry: 'United States', countryCode: 'US', lat: 37.3875, lon: -121.9634, currency: 'USD', mockPrice: 182.4, mockChangePercent: 1.12,
    relatedCountries: [
      { code: 'TW', name: 'Taiwan', relationship: 'Supply Chain', risk: 'high', note: 'Foundry dependence for leading-edge nodes.' },
      { code: 'MY', name: 'Malaysia', relationship: 'Supply Chain', risk: 'medium', note: 'Assembly, testing, and backend packaging.' },
      { code: 'US', name: 'United States', relationship: 'Regulatory', risk: 'medium', note: 'Export controls and AI hardware policy.' },
    ],
  },
  {
    ticker: 'GOOGL', companyName: 'Alphabet Inc Class A', exchange: 'NASDAQ', googleSymbol: 'GOOGL:NASDAQ', sector: 'Communication Services', industry: 'Internet Services',
    hqCity: 'Mountain View', hqCountry: 'United States', countryCode: 'US', lat: 37.4220, lon: -122.0841, currency: 'USD', mockPrice: 317.26, mockChangePercent: -0.38,
    relatedCountries: [
      { code: 'IE', name: 'Ireland', relationship: 'Regulatory', risk: 'medium', note: 'European tax and data processing structure.' },
      { code: 'BR', name: 'Brazil', relationship: 'Revenue', risk: 'medium', note: 'Large ad market with FX sensitivity.' },
      { code: 'EU', name: 'European Union', relationship: 'Regulatory', risk: 'high', note: 'Digital markets, privacy, and AI policy pressure.' },
    ],
  },
  {
    ticker: 'ENB', companyName: 'Enbridge Inc', exchange: 'NYSE', googleSymbol: 'ENB:NYSE', sector: 'Energy', industry: 'Pipelines',
    hqCity: 'Calgary', hqCountry: 'Canada', countryCode: 'CA', lat: 51.0447, lon: -114.0719, currency: 'USD', mockPrice: 54.32, mockChangePercent: -0.33,
    relatedCountries: [
      { code: 'US', name: 'United States', relationship: 'Revenue', risk: 'low', note: 'Cross-border pipeline and utility cash flow exposure.' },
      { code: 'CA', name: 'Canada', relationship: 'Regulatory', risk: 'medium', note: 'Environmental permitting and infrastructure policy.' },
      { code: 'MX', name: 'Mexico', relationship: 'Geopolitical', risk: 'low', note: 'North American energy corridor relevance.' },
    ],
  },
  {
    ticker: 'BWET', companyName: 'BeWhere Holdings', exchange: 'CVE', googleSymbol: 'BWET:CVE', sector: 'Technology', industry: 'IoT Logistics',
    hqCity: 'Mississauga', hqCountry: 'Canada', countryCode: 'CA', lat: 43.5890, lon: -79.6441, currency: 'CAD', mockPrice: 0.6, mockChangePercent: 0.84,
    relatedCountries: [
      { code: 'US', name: 'United States', relationship: 'Revenue', risk: 'medium', note: 'Customer concentration in North American logistics.' },
      { code: 'CA', name: 'Canada', relationship: 'Supply Chain', risk: 'low', note: 'Domestic telematics and asset tracking deployment.' },
    ],
  },
  {
    ticker: 'DSX', companyName: 'Diana Shipping', exchange: 'NYSE', googleSymbol: 'DSX:NYSE', sector: 'Industrials', industry: 'Shipping',
    hqCity: 'Athens', hqCountry: 'Greece', countryCode: 'GR', lat: 37.9838, lon: 23.7275, currency: 'USD', mockPrice: 2.18, mockChangePercent: -0.46,
    relatedCountries: [
      { code: 'CN', name: 'China', relationship: 'Revenue', risk: 'high', note: 'Bulk freight demand and commodity import cycle.' },
      { code: 'EG', name: 'Egypt', relationship: 'Geopolitical', risk: 'high', note: 'Suez Canal routing and Red Sea disruption.' },
      { code: 'BR', name: 'Brazil', relationship: 'Revenue', risk: 'medium', note: 'Iron ore and agricultural cargo exposure.' },
    ],
  },
  {
    ticker: 'CONY', companyName: 'YieldMax COIN Option Income', exchange: 'NYSEARCA', googleSymbol: 'CONY:NYSEARCA', sector: 'Financials', industry: 'Options Income ETF',
    hqCity: 'New York', hqCountry: 'United States', countryCode: 'US', lat: 40.7128, lon: -74.0060, currency: 'USD', mockPrice: 16.42, mockChangePercent: 1.34,
    relatedCountries: [
      { code: 'US', name: 'United States', relationship: 'Regulatory', risk: 'medium', note: 'ETF options overlay and market structure exposure.' },
      { code: 'SG', name: 'Singapore', relationship: 'Geopolitical', risk: 'low', note: 'Global crypto market liquidity window.' },
    ],
  },
  {
    ticker: 'MSTY', companyName: 'YieldMax MSTR Option Income', exchange: 'NYSEARCA', googleSymbol: 'MSTY:NYSEARCA', sector: 'Financials', industry: 'Options Income ETF',
    hqCity: 'New York', hqCountry: 'United States', countryCode: 'US', lat: 40.7128, lon: -74.0060, currency: 'USD', mockPrice: 22.15, mockChangePercent: 1.78,
    relatedCountries: [
      { code: 'US', name: 'United States', relationship: 'Regulatory', risk: 'medium', note: 'Structured product and ETF overlay rules.' },
      { code: 'SV', name: 'El Salvador', relationship: 'Geopolitical', risk: 'medium', note: 'Bitcoin policy narratives affecting sentiment.' },
    ],
  },
  {
    ticker: 'INTC', companyName: 'Intel Corp', exchange: 'NASDAQ', googleSymbol: 'INTC:NASDAQ', sector: 'Technology', industry: 'Semiconductors',
    hqCity: 'Santa Clara', hqCountry: 'United States', countryCode: 'US', lat: 37.3875, lon: -121.9634, currency: 'USD', mockPrice: 62.38, mockChangePercent: 1.07,
    relatedCountries: [
      { code: 'IL', name: 'Israel', relationship: 'Supply Chain', risk: 'medium', note: 'Fab operations and design center footprint.' },
      { code: 'US', name: 'United States', relationship: 'Regulatory', risk: 'medium', note: 'CHIPS Act and domestic industrial policy.' },
      { code: 'IE', name: 'Ireland', relationship: 'Supply Chain', risk: 'low', note: 'European manufacturing and tax structure.' },
    ],
  },
  {
    ticker: 'AVGO', companyName: 'Broadcom Inc', exchange: 'NASDAQ', googleSymbol: 'AVGO:NASDAQ', sector: 'Technology', industry: 'Semiconductors',
    hqCity: 'Palo Alto', hqCountry: 'United States', countryCode: 'US', lat: 37.4419, lon: -122.1430, currency: 'USD', mockPrice: 371.55, mockChangePercent: 4.69,
    relatedCountries: [
      { code: 'TW', name: 'Taiwan', relationship: 'Supply Chain', risk: 'high', note: 'Foundry and advanced packaging concentration.' },
      { code: 'US', name: 'United States', relationship: 'Revenue', risk: 'low', note: 'Enterprise AI infrastructure and networking demand.' },
      { code: 'JP', name: 'Japan', relationship: 'Supply Chain', risk: 'low', note: 'Specialty materials and components.' },
    ],
  },
  {
    ticker: 'BA', companyName: 'Boeing Co', exchange: 'NYSE', googleSymbol: 'BA:NYSE', sector: 'Industrials', industry: 'Aerospace & Defense',
    hqCity: 'Arlington', hqCountry: 'United States', countryCode: 'US', lat: 38.8816, lon: -77.0910, currency: 'USD', mockPrice: 189.2, mockChangePercent: -0.62,
    relatedCountries: [
      { code: 'US', name: 'United States', relationship: 'Regulatory', risk: 'high', note: 'FAA oversight and defense budget linkage.' },
      { code: 'AE', name: 'United Arab Emirates', relationship: 'Revenue', risk: 'medium', note: 'Airline order pipeline and geopolitical sensitivity.' },
      { code: 'JP', name: 'Japan', relationship: 'Supply Chain', risk: 'medium', note: 'Tier-1 industrial suppliers and materials.' },
    ],
  },
  {
    ticker: 'ASML', companyName: 'ASML Holding', exchange: 'NASDAQ', googleSymbol: 'ASML:NASDAQ', sector: 'Technology', industry: 'Semiconductor Equipment',
    hqCity: 'Veldhoven', hqCountry: 'Netherlands', countryCode: 'NL', lat: 51.4180, lon: 5.4060, currency: 'USD', mockPrice: 742.6, mockChangePercent: 0.91,
    relatedCountries: [
      { code: 'NL', name: 'Netherlands', relationship: 'Regulatory', risk: 'medium', note: 'Export license control regime.' },
      { code: 'CN', name: 'China', relationship: 'Revenue', risk: 'high', note: 'Demand constrained by export restrictions.' },
      { code: 'TW', name: 'Taiwan', relationship: 'Revenue', risk: 'medium', note: 'Leading foundry customer concentration.' },
    ],
  },
  {
    ticker: 'AQN', companyName: 'Algonquin Power & Utilities', exchange: 'NYSE', googleSymbol: 'AQN:NYSE', sector: 'Utilities', industry: 'Renewable Utilities',
    hqCity: 'Oakville', hqCountry: 'Canada', countryCode: 'CA', lat: 43.4675, lon: -79.6877, currency: 'USD', mockPrice: 6.14, mockChangePercent: -0.57,
    relatedCountries: [
      { code: 'US', name: 'United States', relationship: 'Revenue', risk: 'low', note: 'Regulated utility and renewable asset base.' },
      { code: 'CA', name: 'Canada', relationship: 'Regulatory', risk: 'medium', note: 'Rate case and power market policy exposure.' },
    ],
  },
  {
    ticker: 'MSFT', companyName: 'Microsoft Corp', exchange: 'NASDAQ', googleSymbol: 'MSFT:NASDAQ', sector: 'Technology', industry: 'Cloud Software',
    hqCity: 'Redmond', hqCountry: 'United States', countryCode: 'US', lat: 47.6740, lon: -122.1215, currency: 'USD', mockPrice: 428.12, mockChangePercent: 0.66,
    relatedCountries: [
      { code: 'US', name: 'United States', relationship: 'Revenue', risk: 'low', note: 'Enterprise software and public cloud anchor market.' },
      { code: 'IE', name: 'Ireland', relationship: 'Regulatory', risk: 'medium', note: 'European tax and data processing footprint.' },
      { code: 'IN', name: 'India', relationship: 'Supply Chain', risk: 'low', note: 'Engineering scale and developer ecosystem depth.' },
    ],
  },
  {
    ticker: 'AMZN', companyName: 'Amazon.com Inc', exchange: 'NASDAQ', googleSymbol: 'AMZN:NASDAQ', sector: 'Consumer Discretionary', industry: 'E-commerce & Cloud',
    hqCity: 'Seattle', hqCountry: 'United States', countryCode: 'US', lat: 47.6062, lon: -122.3321, currency: 'USD', mockPrice: 189.44, mockChangePercent: 0.41,
    relatedCountries: [
      { code: 'US', name: 'United States', relationship: 'Revenue', risk: 'low', note: 'Core e-commerce and AWS demand concentration.' },
      { code: 'DE', name: 'Germany', relationship: 'Revenue', risk: 'medium', note: 'European consumer and logistics exposure.' },
      { code: 'IN', name: 'India', relationship: 'Regulatory', risk: 'medium', note: 'Marketplace regulation and long-term retail growth.' },
    ],
  },
  {
    ticker: 'META', companyName: 'Meta Platforms', exchange: 'NASDAQ', googleSymbol: 'META:NASDAQ', sector: 'Communication Services', industry: 'Social Platforms',
    hqCity: 'Menlo Park', hqCountry: 'United States', countryCode: 'US', lat: 37.4848, lon: -122.1484, currency: 'USD', mockPrice: 512.31, mockChangePercent: -0.21,
    relatedCountries: [
      { code: 'EU', name: 'European Union', relationship: 'Regulatory', risk: 'high', note: 'Privacy, DMA, and platform moderation regulation.' },
      { code: 'BR', name: 'Brazil', relationship: 'Revenue', risk: 'medium', note: 'Large consumer ad market with election sensitivity.' },
      { code: 'US', name: 'United States', relationship: 'Revenue', risk: 'low', note: 'Advertiser demand and AI infrastructure spending.' },
    ],
  },
  {
    ticker: 'NFLX', companyName: 'Netflix Inc', exchange: 'NASDAQ', googleSymbol: 'NFLX:NASDAQ', sector: 'Communication Services', industry: 'Streaming Media',
    hqCity: 'Los Gatos', hqCountry: 'United States', countryCode: 'US', lat: 37.2358, lon: -121.9624, currency: 'USD', mockPrice: 684.55, mockChangePercent: 1.08,
    relatedCountries: [
      { code: 'KR', name: 'South Korea', relationship: 'Revenue', risk: 'medium', note: 'Hit content pipeline and subscriber growth leverage.' },
      { code: 'IN', name: 'India', relationship: 'Revenue', risk: 'medium', note: 'Large TAM with pricing and localization pressure.' },
      { code: 'US', name: 'United States', relationship: 'Revenue', risk: 'low', note: 'Premium market and ad-tier monetization.' },
    ],
  },
  {
    ticker: 'TSM', companyName: 'Taiwan Semiconductor Manufacturing', exchange: 'NYSE', googleSymbol: 'TSM:NYSE', sector: 'Technology', industry: 'Semiconductors',
    hqCity: 'Hsinchu', hqCountry: 'Taiwan', countryCode: 'TW', lat: 24.8138, lon: 120.9675, currency: 'USD', mockPrice: 168.84, mockChangePercent: 1.42,
    relatedCountries: [
      { code: 'TW', name: 'Taiwan', relationship: 'Supply Chain', risk: 'high', note: 'Core fabrication concentration for advanced nodes.' },
      { code: 'US', name: 'United States', relationship: 'Regulatory', risk: 'medium', note: 'Export controls and strategic chip policy.' },
      { code: 'JP', name: 'Japan', relationship: 'Supply Chain', risk: 'low', note: 'Materials, tooling, and ecosystem resilience.' },
    ],
  },
  {
    ticker: 'JPM', companyName: 'JPMorgan Chase', exchange: 'NYSE', googleSymbol: 'JPM:NYSE', sector: 'Financials', industry: 'Banking',
    hqCity: 'New York', hqCountry: 'United States', countryCode: 'US', lat: 40.7128, lon: -74.0060, currency: 'USD', mockPrice: 214.73, mockChangePercent: 0.27,
    relatedCountries: [
      { code: 'US', name: 'United States', relationship: 'Regulatory', risk: 'medium', note: 'Capital rules, rates, and credit cycle exposure.' },
      { code: 'GB', name: 'United Kingdom', relationship: 'Revenue', risk: 'low', note: 'Global markets and investment banking footprint.' },
      { code: 'CN', name: 'China', relationship: 'Geopolitical', risk: 'medium', note: 'Cross-border capital markets sensitivity.' },
    ],
  },
  {
    ticker: 'V', companyName: 'Visa Inc', exchange: 'NYSE', googleSymbol: 'V:NYSE', sector: 'Financials', industry: 'Payments',
    hqCity: 'San Francisco', hqCountry: 'United States', countryCode: 'US', lat: 37.7749, lon: -122.4194, currency: 'USD', mockPrice: 276.92, mockChangePercent: 0.58,
    relatedCountries: [
      { code: 'US', name: 'United States', relationship: 'Revenue', risk: 'low', note: 'Core consumer and enterprise payments volume.' },
      { code: 'GB', name: 'United Kingdom', relationship: 'Revenue', risk: 'low', note: 'Cross-border travel and fintech partnership activity.' },
      { code: 'BR', name: 'Brazil', relationship: 'Revenue', risk: 'medium', note: 'Emerging-market card growth with FX sensitivity.' },
    ],
  },
  {
    ticker: 'XOM', companyName: 'Exxon Mobil', exchange: 'NYSE', googleSymbol: 'XOM:NYSE', sector: 'Energy', industry: 'Integrated Oil & Gas',
    hqCity: 'Spring', hqCountry: 'United States', countryCode: 'US', lat: 30.0799, lon: -95.4172, currency: 'USD', mockPrice: 116.24, mockChangePercent: -0.44,
    relatedCountries: [
      { code: 'US', name: 'United States', relationship: 'Revenue', risk: 'low', note: 'Domestic production, refining, and energy policy linkage.' },
      { code: 'GY', name: 'Guyana', relationship: 'Revenue', risk: 'medium', note: 'Major upstream growth project exposure.' },
      { code: 'SA', name: 'Saudi Arabia', relationship: 'Geopolitical', risk: 'medium', note: 'Oil supply balance and OPEC market context.' },
    ],
  },
  {
    ticker: 'UNH', companyName: 'UnitedHealth Group', exchange: 'NYSE', googleSymbol: 'UNH:NYSE', sector: 'Healthcare', industry: 'Managed Care',
    hqCity: 'Minnetonka', hqCountry: 'United States', countryCode: 'US', lat: 44.9212, lon: -93.4687, currency: 'USD', mockPrice: 489.6, mockChangePercent: -0.19,
    relatedCountries: [
      { code: 'US', name: 'United States', relationship: 'Regulatory', risk: 'medium', note: 'Medicare pricing, reimbursement, and scrutiny on care economics.' },
      { code: 'BR', name: 'Brazil', relationship: 'Revenue', risk: 'low', note: 'Cross-border health-services expansion optionality.' },
    ],
  },
  {
    ticker: 'PFE', companyName: 'Pfizer Inc', exchange: 'NYSE', googleSymbol: 'PFE:NYSE', sector: 'Healthcare', industry: 'Pharmaceuticals',
    hqCity: 'New York', hqCountry: 'United States', countryCode: 'US', lat: 40.7128, lon: -74.0060, currency: 'USD', mockPrice: 28.37, mockChangePercent: 0.74,
    relatedCountries: [
      { code: 'US', name: 'United States', relationship: 'Regulatory', risk: 'medium', note: 'Drug pricing and approval pipeline exposure.' },
      { code: 'BE', name: 'Belgium', relationship: 'Supply Chain', risk: 'low', note: 'Biopharma production and European distribution.' },
      { code: 'DE', name: 'Germany', relationship: 'Revenue', risk: 'low', note: 'Large developed-market healthcare demand.' },
    ],
  },
  {
    ticker: 'SHOP', companyName: 'Shopify Inc', exchange: 'NASDAQ', googleSymbol: 'SHOP:NASDAQ', sector: 'Technology', industry: 'Commerce Software',
    hqCity: 'Ottawa', hqCountry: 'Canada', countryCode: 'CA', lat: 45.4215, lon: -75.6972, currency: 'USD', mockPrice: 76.11, mockChangePercent: 1.16,
    relatedCountries: [
      { code: 'US', name: 'United States', relationship: 'Revenue', risk: 'medium', note: 'Merchant base and consumer demand concentration.' },
      { code: 'CA', name: 'Canada', relationship: 'Supply Chain', risk: 'low', note: 'Corporate base and talent pool continuity.' },
      { code: 'GB', name: 'United Kingdom', relationship: 'Revenue', risk: 'low', note: 'International SMB commerce growth.' },
    ],
  },
  {
    ticker: 'BABA', companyName: 'Alibaba Group', exchange: 'NYSE', googleSymbol: 'BABA:NYSE', sector: 'Consumer Discretionary', industry: 'E-commerce & Cloud',
    hqCity: 'Hangzhou', hqCountry: 'China', countryCode: 'CN', lat: 30.2741, lon: 120.1551, currency: 'USD', mockPrice: 84.92, mockChangePercent: -0.83,
    relatedCountries: [
      { code: 'CN', name: 'China', relationship: 'Regulatory', risk: 'high', note: 'Platform policy, domestic demand, and cloud regulation.' },
      { code: 'SG', name: 'Singapore', relationship: 'Revenue', risk: 'medium', note: 'Regional commerce and logistics expansion node.' },
      { code: 'US', name: 'United States', relationship: 'Geopolitical', risk: 'medium', note: 'ADR sentiment and cross-border capital market pressure.' },
    ],
  },
  {
    ticker: 'SAP', companyName: 'SAP SE', exchange: 'NYSE', googleSymbol: 'SAP:NYSE', sector: 'Technology', industry: 'Enterprise Software',
    hqCity: 'Walldorf', hqCountry: 'Germany', countryCode: 'DE', lat: 49.3064, lon: 8.6424, currency: 'USD', mockPrice: 213.82, mockChangePercent: 0.35,
    relatedCountries: [
      { code: 'DE', name: 'Germany', relationship: 'Revenue', risk: 'low', note: 'European enterprise software core market.' },
      { code: 'US', name: 'United States', relationship: 'Revenue', risk: 'low', note: 'Cloud transition and partner ecosystem demand.' },
      { code: 'IN', name: 'India', relationship: 'Supply Chain', risk: 'low', note: 'Large engineering and services delivery base.' },
    ],
  },
];

const CATALOG_MAP = new Map(STOCK_CATALOG.map((entry) => [entry.ticker, entry]));
const GOOGLE_SYMBOL_MAP = new Map(STOCK_CATALOG.map((entry) => [entry.googleSymbol.toUpperCase(), entry]));

function normalizeTicker(ticker: string): string {
  return ticker.trim().toUpperCase();
}

export function getStockCatalog(): StockCatalogEntry[] {
  return STOCK_CATALOG;
}

export function findStockCatalogEntry(ticker: string): StockCatalogEntry | null {
  const normalized = normalizeTicker(ticker);
  return CATALOG_MAP.get(normalized) ?? GOOGLE_SYMBOL_MAP.get(normalized) ?? null;
}

export function searchStockCatalog(query: string): StockCatalogEntry[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return STOCK_CATALOG.slice(0, 8);
  return STOCK_CATALOG.filter((entry) => {
    return entry.ticker.toLowerCase().includes(needle)
      || entry.exchange.toLowerCase().includes(needle)
      || entry.googleSymbol.toLowerCase().includes(needle)
      || entry.companyName.toLowerCase().includes(needle)
      || entry.sector.toLowerCase().includes(needle)
      || entry.hqCountry.toLowerCase().includes(needle)
      || entry.industry.toLowerCase().includes(needle);
  }).slice(0, 8);
}

export function getDefaultPortfolioRows(): PortfolioRowInput[] {
  return [
    { ticker: 'AAPL', shares: 18, currency: 'USD', purchasePrice: 184, purchaseDate: '2024-06-12' },
    { ticker: 'NVDA', shares: 10, currency: 'USD', purchasePrice: 124, purchaseDate: '2024-11-05' },
    { ticker: 'GOOGL', shares: 8, currency: 'USD', purchasePrice: 168, purchaseDate: '2025-02-03' },
    { ticker: 'ENB', shares: 42, currency: 'USD', purchasePrice: 47.1, purchaseDate: '2023-09-15' },
    { ticker: 'ASML', shares: 3, currency: 'USD', purchasePrice: 715, purchaseDate: '2024-01-24' },
  ];
}

function buildMockQuote(entry: StockCatalogEntry): StockQuoteSnapshot {
  return {
    price: entry.mockPrice,
    changePercent: entry.mockChangePercent,
    change: entry.mockPrice * (entry.mockChangePercent / 100),
    currency: entry.currency,
    source: 'mock',
    fetchedAt: new Date().toISOString(),
    previousClose: entry.mockPrice / (1 + entry.mockChangePercent / 100),
    yearRange: null,
    marketCap: null,
  };
}

export async function fetchStockQuote(entry: StockCatalogEntry): Promise<StockQuoteSnapshot> {
  try {
    const res = await fetch(toApiUrl(`/api/google-finance?ticker=${encodeURIComponent(entry.ticker)}&exchange=${encodeURIComponent(entry.exchange)}`));
    if (!res.ok) throw new Error(`quote_${res.status}`);
    const data = await res.json();
    if (typeof data?.price !== 'number' || typeof data?.changePercent !== 'number') {
      throw new Error('quote_invalid');
    }
    return {
      price: data.price,
      changePercent: data.changePercent,
      change: typeof data.change === 'number' ? data.change : null,
      currency: data.currency || entry.currency,
      source: 'google',
      fetchedAt: data.fetchedAt || new Date().toISOString(),
      previousClose: typeof data.previousClose === 'number' ? data.previousClose : null,
      yearRange: data.yearRange || null,
      marketCap: data.marketCap || null,
    };
  } catch {
    return buildMockQuote(entry);
  }
}

export async function buildPortfolioHolding(row: PortfolioRowInput): Promise<PortfolioHolding | null> {
  const entry = findStockCatalogEntry(row.ticker);
  if (!entry) return null;
  const quote = await fetchStockQuote(entry);
  const shares = Number.isFinite(row.shares) ? row.shares : 0;
  const purchasePrice = row.purchasePrice ?? null;
  const purchaseDate = normalizePurchaseDate(row.purchaseDate ?? null);
  const positionValue = quote.price * shares;
  const allTimeReturnPct = purchasePrice && purchasePrice > 0
    ? ((quote.price - purchasePrice) / purchasePrice) * 100
    : null;
  const holdingDays = purchaseDate
    ? Math.max(0, Math.floor((Date.now() - new Date(`${purchaseDate}T00:00:00Z`).getTime()) / (1000 * 60 * 60 * 24)))
    : null;
  const annualizedReturnPct = (() => {
    if (allTimeReturnPct === null || holdingDays === null || holdingDays <= 0) return null;
    if (purchasePrice === null || purchasePrice <= 0) return null;
    const costBasis = purchasePrice;
    return (Math.pow(quote.price / costBasis, 365 / holdingDays) - 1) * 100;
  })();

  return {
    ...entry,
    shares,
    purchasePrice,
    purchaseDate,
    quote,
    positionValue,
    allTimeReturnPct,
    holdingDays,
    annualizedReturnPct,
  };
}

export async function loadPortfolio(
  rows: PortfolioRowInput[],
  onProgress?: (done: number, total: number, ticker: string | null) => void,
): Promise<PortfolioHolding[]> {
  const validRows = rows.filter((row) => row.ticker && row.shares > 0);
  const holdings: PortfolioHolding[] = [];

  for (const [index, row] of validRows.entries()) {
    onProgress?.(index, validRows.length, row.ticker);
    const holding = await buildPortfolioHolding(row);
    if (holding) holdings.push(holding);
  }

  onProgress?.(validRows.length, validRows.length, null);
  return holdings;
}

function readFirst(row: Record<string, string>, keys: string[]): string {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') return value;
  }
  return '';
}

export function parsePortfolioCsv(csvText: string): PortfolioRowInput[] {
  const parsed = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim().toLowerCase(),
  });

  return ((parsed.data || []) as Array<Record<string, unknown>>).map((rawRow) => {
    const row: Record<string, string> = Object.fromEntries(
      Object.entries(rawRow).map(([key, value]) => [key, value == null ? '' : String(value)])
    );
    const ticker = normalizeTicker(String(readFirst(row, ['ticker', 'symbol'])));
    const sharesValue = Number.parseFloat(String(readFirst(row, ['shares', 'qty', 'quantity'])));
    const purchaseValue = readFirst(row, ['purchase price', 'purchase_price', 'avg cost', 'cost']);
    const purchasePrice = purchaseValue === '' ? null : Number.parseFloat(String(purchaseValue));
    const purchaseDate = normalizePurchaseDate(readFirst(row, ['purchase date', 'purchase_date', 'buy date', 'buy_date', 'bought date', 'bought_date']) || null);
    const currency = String(readFirst(row, ['currency'])).toUpperCase() || undefined;
    return {
      ticker,
      shares: Number.isFinite(sharesValue) ? sharesValue : 0,
      currency,
      purchasePrice: Number.isFinite(purchasePrice ?? NaN) ? purchasePrice : null,
      purchaseDate,
    };
  }).filter((row) => row.ticker);
}

export function getPortfolioSummary(holdings: PortfolioHolding[]): { totalValue: number; topCountries: Array<{ name: string; value: number }> } {
  const totalValue = holdings.reduce((sum: number, holding: PortfolioHolding) => sum + holding.positionValue, 0);
  const topCountries = new Map<string, number>();
  for (const holding of holdings) {
    for (const country of holding.relatedCountries) {
      topCountries.set(country.name, (topCountries.get(country.name) || 0) + holding.positionValue / Math.max(1, holding.relatedCountries.length));
    }
  }

  return {
    totalValue,
    topCountries: [...topCountries.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 3),
  };
}

function normalizeGroupLabel(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function classifyHoldingGroup(holding: PortfolioHolding): string {
  const sector = normalizeGroupLabel(holding.sector);
  const industry = normalizeGroupLabel(holding.industry);
  const company = normalizeGroupLabel(holding.companyName);
  const ticker = normalizeGroupLabel(holding.ticker);

  if (industry.includes('etf') || industry.includes('fund') || company.includes('yieldmax') || ticker.endsWith('y')) {
    return 'ETF & Funds';
  }
  if (sector.includes('energy') || industry.includes('pipeline') || industry.includes('oil') || industry.includes('gas')) {
    return 'Energy';
  }
  if (industry.includes('semiconductor') || industry.includes('cloud') || sector.includes('technology')) {
    return 'Technology';
  }
  if (sector.includes('financial')) {
    return 'Financials';
  }
  if (sector.includes('health')) {
    return 'Healthcare';
  }
  if (sector.includes('industrial') || industry.includes('shipping') || industry.includes('aerospace')) {
    return 'Industrials';
  }
  if (sector.includes('consumer')) {
    return 'Consumer';
  }
  if (sector.includes('utility')) {
    return 'Utilities';
  }
  if (sector.includes('communication')) {
    return 'Communication Services';
  }
  return 'Other';
}

export function getPortfolioGroupBreakdown(holdings: PortfolioHolding[]): PortfolioGroupBreakdown[] {
  const totalValue = holdings.reduce((sum, holding) => sum + holding.positionValue, 0);
  if (totalValue <= 0) return [];

  const grouped = new Map<string, { value: number; holdings: number }>();
  for (const holding of holdings) {
    const label = classifyHoldingGroup(holding);
    const current = grouped.get(label) ?? { value: 0, holdings: 0 };
    current.value += holding.positionValue;
    current.holdings += 1;
    grouped.set(label, current);
  }

  return [...grouped.entries()]
    .map(([label, aggregate]) => ({
      key: label.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      label,
      value: aggregate.value,
      holdings: aggregate.holdings,
      weightPct: (aggregate.value / totalValue) * 100,
    }))
    .sort((a, b) => b.value - a.value);
}

function riskToScore(risk: StockRiskLevel): number {
  if (risk === 'high') return 3;
  if (risk === 'medium') return 2;
  return 1;
}

function scoreToRisk(score: number): StockRiskLevel {
  if (score >= 67) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

export function getHoldingRiskSnapshot(holding: PortfolioHolding, holdings: PortfolioHolding[]): StockRiskSnapshot {
  const totalValue = holdings.reduce((sum, item) => sum + item.positionValue, 0);
  const positionWeightPct = totalValue > 0 ? (holding.positionValue / totalValue) * 100 : 100;
  const averageCountryRisk = holding.relatedCountries.length > 0
    ? holding.relatedCountries.reduce((sum, country) => sum + riskToScore(country.risk), 0) / holding.relatedCountries.length
    : 1;
  const countryRiskScore = Math.round((averageCountryRisk / 3) * 100);
  const concentrationRisk: StockRiskLevel = positionWeightPct >= 35 ? 'high' : positionWeightPct >= 20 ? 'medium' : 'low';
  const overallScore = Math.round((countryRiskScore * 0.65) + (Math.min(positionWeightPct, 100) * 0.35));
  const perCountryPct = holding.relatedCountries.length > 0 ? 100 / holding.relatedCountries.length : 0;

  return {
    overallLevel: scoreToRisk(overallScore),
    overallScore,
    positionWeightPct,
    countryRiskScore,
    concentrationRisk,
    exposureBars: holding.relatedCountries.map((country) => ({
      name: country.name,
      valuePct: perCountryPct,
      risk: country.risk,
    })),
  };
}

export async function fetchStockNews(entry: StockCatalogEntry): Promise<StockNewsItem[]> {
  const query = `${entry.companyName} ${entry.ticker} stock`;
  const feedUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;

  try {
    const response = await fetch(toApiUrl(`/api/rss-proxy?url=${encodeURIComponent(feedUrl)}`));
    if (!response.ok) throw new Error(`news_${response.status}`);
    const xml = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'application/xml');
    const items = Array.from(doc.querySelectorAll('item')).slice(0, 4);

    const computeImpact = (title: string, publishedAt: string | null): { score: number; reason: string } => {
      const text = title.toLowerCase();
      let score = 35;
      const reasons: string[] = [];

      const highImpact = [
        'guidance', 'earnings', 'downgrade', 'upgrade', 'sec', 'lawsuit', 'tariff', 'sanction',
        'acquisition', 'merger', 'rate hike', 'rate cut', 'export control', 'recall', 'bankrupt',
      ];
      const mediumImpact = [
        'forecast', 'outlook', 'regulation', 'investigation', 'partnership', 'contract', 'chip', 'ai',
        'supply chain', 'strike', 'conflict', 'war', 'oil', 'inflation',
      ];

      const highHits = highImpact.filter((keyword) => text.includes(keyword)).length;
      const mediumHits = mediumImpact.filter((keyword) => text.includes(keyword)).length;
      if (highHits > 0) {
        score += Math.min(30, highHits * 12);
        reasons.push('major market-moving keyword');
      }
      if (mediumHits > 0) {
        score += Math.min(18, mediumHits * 6);
        reasons.push('relevant macro/sector signal');
      }

      const geoHits = entry.relatedCountries
        .map((country) => country.name.toLowerCase())
        .filter((countryName) => text.includes(countryName)).length;
      if (geoHits > 0) {
        score += Math.min(12, geoHits * 4);
        reasons.push('matches your exposure geography');
      }

      if (publishedAt) {
        const publishedMs = new Date(publishedAt).getTime();
        if (Number.isFinite(publishedMs)) {
          const ageHours = (Date.now() - publishedMs) / (1000 * 60 * 60);
          if (ageHours <= 6) {
            score += 14;
            reasons.push('very recent');
          } else if (ageHours <= 24) {
            score += 8;
            reasons.push('recent');
          } else if (ageHours <= 72) {
            score += 3;
          }
        }
      }

      const bounded = Math.max(0, Math.min(100, Math.round(score)));
      return {
        score: bounded,
        reason: reasons.slice(0, 2).join(' + ') || 'general relevance',
      };
    };

    return items.map((item) => {
      const title = item.querySelector('title')?.textContent?.trim() || 'Untitled story';
      const publishedAt = item.querySelector('pubDate')?.textContent?.trim() || null;
      const { score, reason } = computeImpact(title, publishedAt);
      return {
        title,
        url: item.querySelector('link')?.textContent?.trim() || '#',
        source: item.querySelector('source')?.textContent?.trim() || 'Google News',
        publishedAt,
        impactScore: score,
        impactReason: reason,
      };
    }).filter((item) => item.url !== '#');
  } catch {
    return [];
  }
}