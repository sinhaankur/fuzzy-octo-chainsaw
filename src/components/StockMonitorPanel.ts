import { Panel } from './Panel';
import { escapeHtml } from '@/utils/sanitize';
import {
  type StockNewsItem,
  type PortfolioHolding,
  type PortfolioRowInput,
  type StockCatalogEntry,
  fetchStockNews,
  getDefaultPortfolioRows,
  getPortfolioGroupBreakdown,
  getHoldingRiskSnapshot,
  getPortfolioSummary,
  loadPortfolio,
  parsePortfolioCsv,
  searchStockCatalog,
} from '@/services/stock-monitor';

function formatMoney(value: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: value >= 100 ? 0 : 2,
  }).format(value);
}

function formatPct(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return '—';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

function flagEmoji(code: string): string {
  if (!/^[A-Z]{2}$/.test(code)) return '🌐';
  return String.fromCodePoint(...code.split('').map((char) => 127397 + char.charCodeAt(0)));
}

function toneClass(value: number | null): string {
  if (value === null || Math.abs(value) < 0.1) return 'neutral';
  return value > 0 ? 'positive' : 'negative';
}

function formatTimestamp(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'recently'
    : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatPublishedDate(value: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString();
}

function formatHoldingDays(days: number | null): string {
  if (days === null || !Number.isFinite(days)) return '—';
  if (days < 30) return `${days}d`;
  if (days < 365) return `${Math.round(days / 30)}mo`;
  return `${(days / 365).toFixed(1)}y`;
}

function plainTrendLabel(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return 'Flat today';
  if (value >= 2) return 'Strong up move today';
  if (value > 0) return 'Up today';
  if (value <= -2) return 'Strong down move today';
  if (value < 0) return 'Down today';
  return 'Flat today';
}

function plainRiskLabel(level: 'low' | 'medium' | 'high'): string {
  if (level === 'high') return 'High risk';
  if (level === 'medium') return 'Medium risk';
  return 'Lower risk';
}

export class StockMonitorPanel extends Panel {
  private holdings: PortfolioHolding[] = [];
  private searchQuery = '';
  private searchResults: StockCatalogEntry[] = [];
  private selectedTicker: string | null = null;
  private newsByTicker = new Map<string, StockNewsItem[]>();
  private loadingNewsTicker: string | null = null;
  private loadingMessage = 'Loading demo portfolio…';
  private errorMessage: string | null = null;
  private collapsedSections: Record<string, boolean> = {
    countries: true,
    concentration: true,
    checklist: true,
    news: false,
  };

  constructor() {
    super({
      id: 'stock-monitor',
      title: 'Stock Monitor',
      infoTooltip: 'Search for stocks, upload a CSV portfolio, and inspect company HQ plus country exposure using Google Finance quotes when available.',
      defaultRowSpan: 3,
    });

    this.content.addEventListener('input', (event) => {
      const target = event.target as HTMLInputElement;
      if (target.matches('[data-stock-search]')) {
        this.searchQuery = target.value;
        this.searchResults = searchStockCatalog(this.searchQuery);
        this.render();
      }
    });

    this.content.addEventListener('keydown', (event) => {
      const target = event.target as HTMLInputElement;
      if (target.matches('[data-stock-search]') && event.key === 'Enter') {
        event.preventDefault();
        const first = this.searchResults[0];
        if (first) void this.addStock(first.ticker);
      }
    });

    this.content.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const toggleBtn = target.closest<HTMLElement>('[data-toggle-section]');
      if (toggleBtn?.dataset.toggleSection) {
        const key = toggleBtn.dataset.toggleSection;
        this.collapsedSections[key] = !this.collapsedSections[key];
        this.render();
        return;
      }

      const jumpBtn = target.closest<HTMLElement>('[data-jump-section]');
      if (jumpBtn?.dataset.jumpSection) {
        const section = this.content.querySelector<HTMLElement>(`[data-detail-section="${jumpBtn.dataset.jumpSection}"]`);
        section?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }

      const addBtn = target.closest<HTMLElement>('[data-add-ticker]');
      if (addBtn?.dataset.addTicker) {
        void this.addStock(addBtn.dataset.addTicker);
        return;
      }

      const row = target.closest<HTMLElement>('[data-select-ticker]');
      if (row?.dataset.selectTicker) {
        this.selectTicker(row.dataset.selectTicker);
        return;
      }

      const focusBtn = target.closest<HTMLElement>('[data-focus-stock]');
      if (focusBtn) {
        this.focusSelectedHolding();
        return;
      }

      const loadDemoBtn = target.closest<HTMLElement>('[data-load-demo]');
      if (loadDemoBtn) {
        void this.loadRows(getDefaultPortfolioRows(), 'Loading demo portfolio…');
        return;
      }

      const saveHoldingBtn = target.closest<HTMLElement>('[data-save-holding]');
      if (saveHoldingBtn) {
        void this.updateSelectedHoldingFromInputs();
      }
    });

    this.content.addEventListener('change', (event) => {
      const target = event.target as HTMLInputElement;
      if (!target.matches('[data-stock-csv]') || !target.files?.[0]) return;
      void this.handleCsvUpload(target.files[0]);
      target.value = '';
    });

    void this.loadRows(getDefaultPortfolioRows(), 'Loading demo portfolio…');
  }

  private selectTicker(ticker: string): void {
    this.selectedTicker = ticker;
    this.render();
    this.focusSelectedHolding();
    this.emitStockSelection();
    void this.ensureSelectedNews();
  }

  private focusSelectedHolding(): void {
    const selected = this.holdings.find((holding) => holding.ticker === this.selectedTicker) ?? this.holdings[0] ?? null;
    if (!selected) return;

    window.dispatchEvent(new CustomEvent('wm:focus-stock-location', {
      detail: {
        ticker: selected.ticker,
        companyName: selected.companyName,
        lat: selected.lat,
        lon: selected.lon,
        zoom: 4,
      },
    }));
  }

  private emitStockSelection(): void {
    const selected = this.holdings.find((holding) => holding.ticker === this.selectedTicker) ?? this.holdings[0] ?? null;
    if (!selected) return;

    window.dispatchEvent(new CustomEvent('wm:stock-selected', {
      detail: {
        ticker: selected.ticker,
        companyName: selected.companyName,
        sector: selected.sector,
        industry: selected.industry,
        hqCountry: selected.hqCountry,
        countryCode: selected.countryCode,
        relatedCountries: selected.relatedCountries,
      },
    }));
  }

  private async ensureSelectedNews(): Promise<void> {
    const selected = this.holdings.find((holding) => holding.ticker === this.selectedTicker) ?? this.holdings[0] ?? null;
    if (!selected || this.newsByTicker.has(selected.ticker) || this.loadingNewsTicker === selected.ticker) return;

    this.loadingNewsTicker = selected.ticker;
    this.render();
    const news = await fetchStockNews(selected);
    this.newsByTicker.set(selected.ticker, news);
    this.loadingNewsTicker = null;
    this.render();
  }

  private async handleCsvUpload(file: File): Promise<void> {
    try {
      const text = await file.text();
      const rows = parsePortfolioCsv(text);
      if (rows.length === 0) {
        this.errorMessage = 'The CSV file did not contain any valid rows.';
        this.render();
        return;
      }
      await this.loadRows(rows, `Uploading ${rows.length} stock${rows.length === 1 ? '' : 's'}…`);
    } catch {
      this.errorMessage = 'Could not read the CSV file.';
      this.render();
    }
  }

  private async addStock(ticker: string): Promise<void> {
    const existing = new Set(this.holdings.map((holding) => holding.ticker));
    const rows: PortfolioRowInput[] = this.holdings.map((holding) => ({
      ticker: holding.ticker,
      shares: holding.shares,
      currency: holding.quote.currency,
      purchasePrice: holding.purchasePrice,
      purchaseDate: holding.purchaseDate,
    }));
    if (!existing.has(ticker)) rows.push({ ticker, shares: 10, purchasePrice: null, purchaseDate: null });
    this.searchQuery = '';
    this.searchResults = [];
    await this.loadRows(rows, `Fetching ${ticker}…`);
  }

  private async updateSelectedHoldingFromInputs(): Promise<void> {
    const selected = this.holdings.find((holding) => holding.ticker === this.selectedTicker) ?? this.holdings[0] ?? null;
    if (!selected) return;

    const sharesInput = this.content.querySelector<HTMLInputElement>('[data-edit-shares]');
    const purchaseInput = this.content.querySelector<HTMLInputElement>('[data-edit-purchase-price]');
    const purchaseDateInput = this.content.querySelector<HTMLInputElement>('[data-edit-purchase-date]');
    if (!sharesInput || !purchaseInput || !purchaseDateInput) return;

    const parsedShares = Number(sharesInput.value);
    if (!Number.isFinite(parsedShares) || parsedShares <= 0) {
      this.errorMessage = 'Shares must be a number greater than 0.';
      this.render();
      return;
    }

    const purchaseRaw = purchaseInput.value.trim();
    const parsedPurchase = purchaseRaw === '' ? null : Number(purchaseRaw);
    if (parsedPurchase !== null && (!Number.isFinite(parsedPurchase) || parsedPurchase <= 0)) {
      this.errorMessage = 'Purchase price must be empty or a number greater than 0.';
      this.render();
      return;
    }

    const purchaseDateRaw = purchaseDateInput.value.trim();
    const parsedPurchaseDate = purchaseDateRaw === '' ? null : purchaseDateRaw;
    if (parsedPurchaseDate) {
      const parsedDate = new Date(parsedPurchaseDate);
      if (Number.isNaN(parsedDate.getTime())) {
        this.errorMessage = 'Purchase date must be a valid date.';
        this.render();
        return;
      }
      if (parsedDate.getTime() > Date.now()) {
        this.errorMessage = 'Purchase date cannot be in the future.';
        this.render();
        return;
      }
    }

    const rows: PortfolioRowInput[] = this.holdings.map((holding) => ({
      ticker: holding.ticker,
      shares: holding.ticker === selected.ticker ? parsedShares : holding.shares,
      currency: holding.quote.currency,
      purchasePrice: holding.ticker === selected.ticker ? parsedPurchase : holding.purchasePrice,
      purchaseDate: holding.ticker === selected.ticker ? parsedPurchaseDate : holding.purchaseDate,
    }));

    await this.loadRows(rows, `Updating ${selected.ticker}…`);
  }

  private async loadRows(rows: PortfolioRowInput[], initialMessage: string): Promise<void> {
    this.errorMessage = null;
    this.loadingMessage = initialMessage;
    this.showLoading(this.loadingMessage);

    const holdings = await loadPortfolio(rows, (done: number, total: number, ticker: string | null) => {
      if (done >= total) {
        this.loadingMessage = 'Finalizing portfolio…';
      } else {
        this.loadingMessage = `Loading ${done + 1}/${total}${ticker ? ` · ${ticker}` : ''}`;
      }
      this.showLoading(this.loadingMessage);
    });

    if (holdings.length === 0) {
      this.errorMessage = 'No supported stocks could be loaded from the current portfolio.';
      this.holdings = [];
      this.selectedTicker = null;
      this.render();
      return;
    }

    this.holdings = holdings.sort((a, b) => b.positionValue - a.positionValue);
    this.selectedTicker = this.selectedTicker && this.holdings.some((holding) => holding.ticker === this.selectedTicker)
      ? this.selectedTicker
      : this.holdings[0]?.ticker ?? null;
    this.render();
    this.focusSelectedHolding();
    void this.ensureSelectedNews();
  }

  private renderSearchResults(): string {
    if (!this.searchQuery.trim()) return '';
    if (this.searchResults.length === 0) {
      return `<div style="margin-top:8px;font-size:11px;color:var(--text-dim)">No matching stocks in the current universe. Try a ticker like MSFT, TSM, SAP, or BABA, or upload a CSV portfolio.</div>`;
    }

    return `
      <div style="display:flex;flex-direction:column;gap:6px;margin-top:8px">
        ${this.searchResults.map((entry) => `
          <button type="button" data-add-ticker="${escapeHtml(entry.ticker)}" style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 10px;border:1px solid rgba(255,255,255,0.08);border-radius:10px;background:rgba(255,255,255,0.03);color:inherit;text-align:left;cursor:pointer">
            <span>
              <strong style="display:block;font-size:12px;color:var(--text)">${escapeHtml(entry.ticker)} · ${escapeHtml(entry.companyName)}</strong>
              <span style="font-size:10px;color:var(--text-dim)">${escapeHtml(entry.exchange)} · ${escapeHtml(entry.sector)} · ${flagEmoji(entry.countryCode)} ${escapeHtml(entry.hqCountry)}</span>
            </span>
            <span style="font-size:10px;color:var(--accent, #4da6ff)">Add</span>
          </button>
        `).join('')}
      </div>
    `;
  }

  private renderHoldings(): string {
    if (this.holdings.length === 0) {
      return `
        <div style="padding:14px;border:1px dashed rgba(255,255,255,0.12);border-radius:12px;color:var(--text-dim);font-size:12px;line-height:1.5">
          No holdings loaded yet. Search for a stock above or upload a CSV file with Ticker, Shares, Currency, and Purchase Price columns.
          <div style="margin-top:10px"><button type="button" data-load-demo style="padding:8px 10px;border-radius:8px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.04);color:inherit;cursor:pointer">Load demo portfolio</button></div>
        </div>
      `;
    }

    return `
      <div style="display:flex;flex-direction:column;gap:8px;max-height:320px;overflow:auto;padding-right:2px">
        ${this.holdings.map((holding) => {
          const selected = holding.ticker === this.selectedTicker;
          const priceTone = toneClass(holding.quote.changePercent);
          const returnTone = toneClass(holding.allTimeReturnPct);
          return `
            <button type="button" data-select-ticker="${escapeHtml(holding.ticker)}" style="display:flex;flex-direction:column;gap:6px;padding:10px 12px;border-radius:12px;border:1px solid ${selected ? 'rgba(77,166,255,0.7)' : 'rgba(255,255,255,0.08)'};background:${selected ? 'rgba(77,166,255,0.12)' : 'rgba(255,255,255,0.03)'};color:inherit;text-align:left;cursor:pointer">
              <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
                <div>
                  <div style="font-size:12px;font-weight:700;color:var(--text)">${escapeHtml(holding.ticker)} · ${escapeHtml(holding.companyName)}</div>
                  <div style="font-size:10px;color:var(--text-dim)">${flagEmoji(holding.countryCode)} ${escapeHtml(holding.hqCountry)} · ${escapeHtml(holding.sector)}</div>
                </div>
                <div style="text-align:right">
                  <div style="font-size:12px;font-weight:700;color:var(--text)">${formatMoney(holding.quote.price, holding.quote.currency)}</div>
                  <div style="font-size:10px;color:${priceTone === 'positive' ? 'var(--green)' : priceTone === 'negative' ? 'var(--red)' : 'var(--warning, #ffcc00)'}">${formatPct(holding.quote.changePercent)}</div>
                </div>
              </div>
              <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;font-size:10px;color:var(--text-dim)">
                <span>${holding.shares} shares · ${formatMoney(holding.positionValue, holding.quote.currency)}</span>
                <span style="color:${returnTone === 'positive' ? 'var(--green)' : returnTone === 'negative' ? 'var(--red)' : 'var(--text-dim)'}">${formatPct(holding.allTimeReturnPct)}</span>
              </div>
            </button>
          `;
        }).join('')}
      </div>
    `;
  }

  private renderDetail(): string {
    const selected = this.holdings.find((holding) => holding.ticker === this.selectedTicker) ?? this.holdings[0] ?? null;
    if (!selected) {
      return '<div style="font-size:12px;color:var(--text-dim)">Select a stock to view its profile.</div>';
    }

    const summary = getPortfolioSummary(this.holdings);
    const risk = getHoldingRiskSnapshot(selected, this.holdings);
    const news = this.newsByTicker.get(selected.ticker) ?? [];
    const topImpactNews = [...news].sort((a, b) => b.impactScore - a.impactScore)[0] ?? null;
    const quoteTone = toneClass(selected.quote.changePercent);
    const returnTone = toneClass(selected.allTimeReturnPct);
    const annualizedTone = toneClass(selected.annualizedReturnPct);
    const topCountry = summary.topCountries[0] ?? null;
    const isCountriesCollapsed = this.collapsedSections.countries;
    const isConcentrationCollapsed = this.collapsedSections.concentration;
    const isChecklistCollapsed = this.collapsedSections.checklist;
    const isNewsCollapsed = this.collapsedSections.news;
    const quickTake = [
      `${plainTrendLabel(selected.quote.changePercent)} (${formatPct(selected.quote.changePercent)}).`,
      selected.allTimeReturnPct === null
        ? 'Add purchase price to see return from your entry.'
        : `Since your buy, return is ${formatPct(selected.allTimeReturnPct)}.`,
      selected.purchaseDate
        ? `Held for ${formatHoldingDays(selected.holdingDays)} since ${escapeHtml(selected.purchaseDate)}.`
        : 'Add purchase date to measure holding period and annualized return.',
      `Portfolio weight is ${risk.positionWeightPct.toFixed(1)}% (${plainRiskLabel(risk.concentrationRisk)} concentration).`,
      topCountry
        ? `Top country exposure: ${escapeHtml(topCountry.name)} (${formatMoney(topCountry.value, selected.quote.currency)}).`
        : 'Country exposure not available yet.',
      topImpactNews
        ? `Most impactful event: ${escapeHtml(topImpactNews.title)} (impact ${topImpactNews.impactScore}/100).`
        : 'No major headline impact detected yet.',
    ];

    return `
      <div style="display:flex;flex-direction:column;gap:12px;padding:12px;border-radius:12px;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.03);max-height:min(78vh,980px);overflow:auto;scroll-behavior:smooth">
        <div style="display:flex;flex-wrap:wrap;gap:6px;padding:8px;border-radius:10px;background:rgba(13,17,23,0.5);border:1px solid rgba(255,255,255,0.08);position:sticky;top:0;z-index:1;backdrop-filter:blur(4px)">
          <button type="button" data-jump-section="summary" style="padding:5px 8px;border-radius:999px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.04);color:var(--text);font-size:10px;cursor:pointer">Summary</button>
          <button type="button" data-jump-section="holding" style="padding:5px 8px;border-radius:999px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.04);color:var(--text);font-size:10px;cursor:pointer">Holding</button>
          <button type="button" data-jump-section="risk" style="padding:5px 8px;border-radius:999px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.04);color:var(--text);font-size:10px;cursor:pointer">Risk</button>
          <button type="button" data-jump-section="alerts" style="padding:5px 8px;border-radius:999px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.04);color:var(--text);font-size:10px;cursor:pointer">Alerts</button>
          <button type="button" data-jump-section="news" style="padding:5px 8px;border-radius:999px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.04);color:var(--text);font-size:10px;cursor:pointer">News</button>
        </div>

        <div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;padding:8px;border-radius:10px;background:rgba(13,17,23,0.6);border:1px solid rgba(255,255,255,0.08);position:sticky;top:44px;z-index:1;backdrop-filter:blur(4px)">
          <div style="padding:6px 8px;border-radius:8px;background:rgba(255,255,255,0.03)">
            <div style="font-size:9px;color:var(--text-dim)">Price</div>
            <div style="font-size:11px;font-weight:700;color:var(--text)">${formatMoney(selected.quote.price, selected.quote.currency)}</div>
          </div>
          <div style="padding:6px 8px;border-radius:8px;background:rgba(255,255,255,0.03)">
            <div style="font-size:9px;color:var(--text-dim)">Return</div>
            <div style="font-size:11px;font-weight:700;color:${returnTone === 'positive' ? 'var(--green)' : returnTone === 'negative' ? 'var(--red)' : 'var(--text)'}">${formatPct(selected.allTimeReturnPct)}</div>
          </div>
          <div style="padding:6px 8px;border-radius:8px;background:rgba(255,255,255,0.03)">
            <div style="font-size:9px;color:var(--text-dim)">Risk</div>
            <div style="font-size:11px;font-weight:700;color:${risk.overallLevel === 'high' ? 'var(--red)' : risk.overallLevel === 'medium' ? 'var(--warning, #ffcc00)' : '#4da6ff'}">${escapeHtml(risk.overallLevel.toUpperCase())}</div>
          </div>
          <div style="padding:6px 8px;border-radius:8px;background:rgba(255,255,255,0.03)">
            <div style="font-size:9px;color:var(--text-dim)">Top alert</div>
            <div style="font-size:11px;font-weight:700;color:var(--text)">${topImpactNews ? `${topImpactNews.impactScore}/100` : '—'}</div>
          </div>
        </div>

        <div data-detail-section="summary" style="height:1px"></div>
        <div style="padding:10px;border-radius:10px;background:rgba(77,166,255,0.08);border:1px solid rgba(77,166,255,0.25)">
          <div style="font-size:11px;font-weight:700;color:#9bc9ff;margin-bottom:6px">Understand this stock quickly</div>
          <div style="display:flex;flex-direction:column;gap:4px;font-size:10px;color:var(--text);line-height:1.5">
            ${quickTake.map((line) => `<div>• ${line}</div>`).join('')}
          </div>
        </div>

        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px">
          <div>
            <div style="font-size:14px;font-weight:700;color:var(--text)">${escapeHtml(selected.companyName)}</div>
            <div style="font-size:11px;color:var(--text-dim)">${escapeHtml(selected.ticker)} · ${escapeHtml(selected.exchange)} · ${escapeHtml(selected.industry)}</div>
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px">
            <button type="button" data-focus-stock style="padding:6px 8px;border-radius:8px;border:1px solid rgba(77,166,255,0.28);background:rgba(77,166,255,0.1);color:#7bb7ff;font-size:10px;cursor:pointer">Focus map</button>
            <a href="https://www.google.com/finance/quote/${encodeURIComponent(selected.googleSymbol)}" target="_blank" rel="noopener" style="font-size:10px;color:#4da6ff;text-decoration:none">Google Finance</a>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px">
          <div style="padding:10px;border-radius:10px;background:rgba(13,17,23,0.55)">
            <div style="font-size:10px;color:var(--text-dim)">Live price</div>
            <div style="font-size:16px;font-weight:700;color:var(--text)">${formatMoney(selected.quote.price, selected.quote.currency)}</div>
            <div style="font-size:11px;color:${quoteTone === 'positive' ? 'var(--green)' : quoteTone === 'negative' ? 'var(--red)' : 'var(--warning, #ffcc00)'}">${formatPct(selected.quote.changePercent)} · ${selected.quote.source === 'google' ? 'Google Finance' : 'Fallback quote'}</div>
          </div>
          <div style="padding:10px;border-radius:10px;background:rgba(13,17,23,0.55)">
            <div style="font-size:10px;color:var(--text-dim)">All-time return</div>
            <div style="font-size:16px;font-weight:700;color:${returnTone === 'positive' ? 'var(--green)' : returnTone === 'negative' ? 'var(--red)' : 'var(--text)'}">${formatPct(selected.allTimeReturnPct)}</div>
            <div style="font-size:11px;color:var(--text-dim)">${selected.purchasePrice ? `Cost basis ${formatMoney(selected.purchasePrice, selected.quote.currency)}` : 'No purchase price provided'}</div>
            <div style="font-size:10px;color:${annualizedTone === 'positive' ? 'var(--green)' : annualizedTone === 'negative' ? 'var(--red)' : 'var(--text-dim)'};margin-top:3px">Annualized: ${formatPct(selected.annualizedReturnPct)} · Held ${formatHoldingDays(selected.holdingDays)}</div>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;font-size:11px">
          <div style="padding:10px;border-radius:10px;background:rgba(13,17,23,0.55)">
            <div style="font-size:10px;color:var(--text-dim)">HQ location</div>
            <div style="font-weight:700;color:var(--text)">${flagEmoji(selected.countryCode)} ${escapeHtml(selected.hqCity)}, ${escapeHtml(selected.hqCountry)}</div>
            <div style="color:var(--text-dim)">Sector: ${escapeHtml(selected.sector)}</div>
          </div>
          <div style="padding:10px;border-radius:10px;background:rgba(13,17,23,0.55)">
            <div style="font-size:10px;color:var(--text-dim)">Position value</div>
            <div style="font-weight:700;color:var(--text)">${formatMoney(selected.positionValue, selected.quote.currency)}</div>
            <div style="color:var(--text-dim)">${selected.shares} shares</div>
          </div>
        </div>

        <div data-detail-section="holding" style="padding:10px;border-radius:10px;background:rgba(13,17,23,0.55)">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px">
            <div style="font-size:11px;font-weight:700;color:var(--text)">Your holding</div>
            <button type="button" data-save-holding style="padding:6px 10px;border-radius:8px;border:1px solid rgba(77,166,255,0.35);background:rgba(77,166,255,0.12);color:#7bb7ff;font-size:10px;cursor:pointer">Save changes</button>
          </div>
          <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px">
            <label style="display:flex;flex-direction:column;gap:6px;font-size:10px;color:var(--text-dim)">
              Shares held
              <input data-edit-shares type="number" min="0.0001" step="0.0001" value="${selected.shares}" style="padding:8px 10px;border-radius:8px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.03);color:var(--text);font-size:11px" />
            </label>
            <label style="display:flex;flex-direction:column;gap:6px;font-size:10px;color:var(--text-dim)">
              Purchase price (${escapeHtml(selected.quote.currency)})
              <input data-edit-purchase-price type="number" min="0" step="0.01" value="${selected.purchasePrice ?? ''}" placeholder="Optional" style="padding:8px 10px;border-radius:8px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.03);color:var(--text);font-size:11px" />
            </label>
          </div>
          <div style="margin-top:8px;display:grid;grid-template-columns:minmax(0,1fr);gap:8px">
            <label style="display:flex;flex-direction:column;gap:6px;font-size:10px;color:var(--text-dim)">
              Purchase date
              <input data-edit-purchase-date type="date" value="${selected.purchaseDate ?? ''}" style="padding:8px 10px;border-radius:8px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.03);color:var(--text);font-size:11px" />
            </label>
          </div>
          <div style="margin-top:6px;font-size:10px;color:var(--text-dim)">Update shares, cost basis, and buy date so returns reflect when you bought the stock.</div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;font-size:11px">
          <div style="padding:10px;border-radius:10px;background:rgba(13,17,23,0.55)">
            <div style="font-size:10px;color:var(--text-dim)">Market cap / range</div>
            <div style="font-weight:700;color:var(--text)">${escapeHtml(selected.quote.marketCap || 'Unavailable')}</div>
            <div style="color:var(--text-dim)">${escapeHtml(selected.quote.yearRange || 'Year range unavailable')}</div>
          </div>
          <div style="padding:10px;border-radius:10px;background:rgba(13,17,23,0.55)">
            <div style="font-size:10px;color:var(--text-dim)">Previous close</div>
            <div style="font-weight:700;color:var(--text)">${selected.quote.previousClose ? formatMoney(selected.quote.previousClose, selected.quote.currency) : '—'}</div>
            <div style="color:var(--text-dim)">Quote refreshed ${formatTimestamp(selected.quote.fetchedAt)}</div>
          </div>
        </div>

        <div>
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px">
            <div style="font-size:11px;font-weight:700;color:var(--text)">Related countries and industry exposure</div>
            <button type="button" data-toggle-section="countries" style="padding:4px 8px;border-radius:999px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.04);color:var(--text);font-size:10px;cursor:pointer">${isCountriesCollapsed ? 'Expand' : 'Collapse'}</button>
          </div>
          ${isCountriesCollapsed ? `<div style="font-size:10px;color:var(--text-dim)">Collapsed to keep scrolling shorter.</div>` : `
            <div style="display:flex;flex-direction:column;gap:8px">
              ${selected.relatedCountries.map((country) => `
                <div style="padding:8px 10px;border-radius:10px;background:rgba(13,17,23,0.55);border:1px solid rgba(255,255,255,0.06)">
                  <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:4px">
                    <span style="font-size:11px;font-weight:700;color:var(--text)">${escapeHtml(country.name)}</span>
                    <span style="font-size:10px;color:${country.risk === 'high' ? 'var(--red)' : country.risk === 'medium' ? 'var(--warning, #ffcc00)' : '#4da6ff'}">${escapeHtml(country.relationship)} · ${escapeHtml(country.risk)}</span>
                  </div>
                  <div style="font-size:10px;color:var(--text-dim);line-height:1.45">${escapeHtml(country.note)}</div>
                </div>
              `).join('')}
            </div>
          `}
        </div>

        <div style="padding:10px;border-radius:10px;background:rgba(13,17,23,0.55)">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px">
            <div style="font-size:11px;font-weight:700;color:var(--text)">Portfolio concentration snapshot</div>
            <button type="button" data-toggle-section="concentration" style="padding:4px 8px;border-radius:999px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.04);color:var(--text);font-size:10px;cursor:pointer">${isConcentrationCollapsed ? 'Expand' : 'Collapse'}</button>
          </div>
          ${isConcentrationCollapsed ? `<div style="font-size:10px;color:var(--text-dim)">Collapsed. Expand to view country concentration details.</div>` : `
            <div style="font-size:10px;color:var(--text-dim);line-height:1.6">
              Total tracked value: ${formatMoney(summary.totalValue || 0, selected.quote.currency)}<br/>
              Top exposed countries: ${summary.topCountries.length > 0 ? summary.topCountries.map((item) => `${escapeHtml(item.name)} (${formatMoney(item.value, selected.quote.currency)})`).join(' · ') : 'None yet'}
            </div>
          `}
        </div>

        <div data-detail-section="risk" style="padding:10px;border-radius:10px;background:rgba(13,17,23,0.55)">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px">
            <div style="font-size:11px;font-weight:700;color:var(--text)">Exposure and risk</div>
            <div style="font-size:10px;color:${risk.overallLevel === 'high' ? 'var(--red)' : risk.overallLevel === 'medium' ? 'var(--warning, #ffcc00)' : '#4da6ff'}">${escapeHtml(risk.overallLevel.toUpperCase())} · ${risk.overallScore}/100</div>
          </div>
          <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-bottom:10px;font-size:10px;color:var(--text-dim)">
            <div>Position weight: ${risk.positionWeightPct.toFixed(1)}%</div>
            <div>Country risk score: ${risk.countryRiskScore}/100</div>
          </div>
          <div style="display:flex;flex-direction:column;gap:8px">
            ${risk.exposureBars.map((item) => `
              <div>
                <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:10px;margin-bottom:4px">
                  <span style="color:var(--text)">${escapeHtml(item.name)}</span>
                  <span style="color:${item.risk === 'high' ? 'var(--red)' : item.risk === 'medium' ? 'var(--warning, #ffcc00)' : '#4da6ff'}">${item.valuePct.toFixed(0)}% · ${escapeHtml(item.risk)}</span>
                </div>
                <div style="height:7px;border-radius:999px;background:rgba(255,255,255,0.08);overflow:hidden">
                  <div style="width:${item.valuePct}%;height:100%;background:${item.risk === 'high' ? 'linear-gradient(90deg, rgba(255,82,82,0.95), rgba(255,130,130,0.75))' : item.risk === 'medium' ? 'linear-gradient(90deg, rgba(255,198,92,0.95), rgba(255,223,141,0.75))' : 'linear-gradient(90deg, rgba(77,166,255,0.95), rgba(134,198,255,0.75))'}"></div>
                </div>
              </div>
            `).join('')}
          </div>
          <div style="margin-top:8px;font-size:10px;color:var(--text-dim)">Concentration risk: ${escapeHtml(risk.concentrationRisk)}${selected.purchaseDate ? ` · Bought ${escapeHtml(selected.purchaseDate)}` : ''}</div>
        </div>

        <div style="padding:10px;border-radius:10px;background:rgba(13,17,23,0.55)">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px">
            <div style="font-size:11px;font-weight:700;color:var(--text)">Simple checklist</div>
            <button type="button" data-toggle-section="checklist" style="padding:4px 8px;border-radius:999px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.04);color:var(--text);font-size:10px;cursor:pointer">${isChecklistCollapsed ? 'Expand' : 'Collapse'}</button>
          </div>
          ${isChecklistCollapsed ? `<div style="font-size:10px;color:var(--text-dim)">Collapsed. Expand for decision checkpoints.</div>` : `
            <div style="display:flex;flex-direction:column;gap:6px;font-size:10px;color:var(--text-dim)">
              <div>1. Is today trend acceptable for your plan? ${formatPct(selected.quote.changePercent)}</div>
              <div>2. Are you comfortable with this position size? ${risk.positionWeightPct.toFixed(1)}% of tracked portfolio.</div>
              <div>3. Is country exposure acceptable right now? ${plainRiskLabel(risk.overallLevel)} overall.</div>
              <div>4. Do recent headlines support your thesis?${topImpactNews ? ` Top impact: ${escapeHtml(topImpactNews.impactScore.toString())}/100.` : ''}</div>
            </div>
          `}
        </div>

        <div data-detail-section="alerts" style="padding:10px;border-radius:10px;background:${topImpactNews ? 'rgba(255,198,92,0.12)' : 'rgba(13,17,23,0.55)'};border:1px solid ${topImpactNews ? 'rgba(255,198,92,0.3)' : 'rgba(255,255,255,0.08)'}">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px">
            <div style="font-size:11px;font-weight:700;color:var(--text)">Stock alerts</div>
            ${topImpactNews ? `<div style="font-size:10px;color:var(--warning, #ffcc00)">Impact ${topImpactNews.impactScore}/100</div>` : ''}
          </div>
          ${topImpactNews ? `
            <a href="${escapeHtml(topImpactNews.url)}" target="_blank" rel="noopener" style="display:block;text-decoration:none;padding:8px 10px;border-radius:10px;border:1px solid rgba(255,255,255,0.08);background:rgba(0,0,0,0.12)">
              <div style="font-size:11px;font-weight:700;color:var(--text);line-height:1.4">${escapeHtml(topImpactNews.title)}</div>
              <div style="margin-top:6px;font-size:10px;color:var(--text-dim)">${escapeHtml(topImpactNews.source)}${formatPublishedDate(topImpactNews.publishedAt) ? ` · ${escapeHtml(formatPublishedDate(topImpactNews.publishedAt))}` : ''} · ${escapeHtml(topImpactNews.impactReason)}</div>
            </a>
          ` : `
            <div style="font-size:10px;color:var(--text-dim)">No high-impact event detected yet for this stock. Alerts will highlight the strongest headline when available.</div>
          `}
        </div>

        <div data-detail-section="news" style="padding:10px;border-radius:10px;background:rgba(13,17,23,0.55)">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px">
            <div style="font-size:11px;font-weight:700;color:var(--text)">Stock news</div>
            <button type="button" data-toggle-section="news" style="padding:4px 8px;border-radius:999px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.04);color:var(--text);font-size:10px;cursor:pointer">${isNewsCollapsed ? 'Expand' : 'Collapse'}</button>
          </div>
          ${isNewsCollapsed ? `<div style="font-size:10px;color:var(--text-dim)">Collapsed. Expand to read full headline list.</div>` : `
            ${this.loadingNewsTicker === selected.ticker ? '<div style="font-size:10px;color:var(--text-dim)">Loading recent headlines…</div>' : ''}
            ${this.loadingNewsTicker !== selected.ticker && news.length === 0 ? '<div style="font-size:10px;color:var(--text-dim)">No recent headlines available from Google News right now.</div>' : ''}
            ${news.length > 0 ? `
              <div style="display:flex;flex-direction:column;gap:8px">
                ${news.map((item) => `
                  <a href="${escapeHtml(item.url)}" target="_blank" rel="noopener" style="display:block;padding:8px 10px;border-radius:10px;border:1px solid rgba(255,255,255,0.06);background:rgba(255,255,255,0.02);text-decoration:none">
                    <div style="font-size:11px;font-weight:700;color:var(--text);line-height:1.4">${escapeHtml(item.title)}</div>
                    <div style="margin-top:4px;font-size:10px;color:var(--text-dim)">${escapeHtml(item.source)}${formatPublishedDate(item.publishedAt) ? ` · ${escapeHtml(formatPublishedDate(item.publishedAt))}` : ''} · Impact ${item.impactScore}/100</div>
                  </a>
                `).join('')}
              </div>
            ` : ''}
          `}
        </div>
      </div>
    `;
  }

  private render(): void {
    const groups = getPortfolioGroupBreakdown(this.holdings);
    const selectedCurrency = this.holdings[0]?.quote.currency ?? 'USD';
    const html = `
      <div style="display:flex;flex-direction:column;gap:12px">
        <div style="padding:12px;border-radius:12px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08)">
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
            <input data-stock-search type="text" value="${escapeHtml(this.searchQuery)}" placeholder="Search for stock by ticker, company, exchange, sector, or country" style="flex:1;min-width:220px;padding:10px 12px;border-radius:10px;border:1px solid rgba(255,255,255,0.08);background:rgba(13,17,23,0.72);color:var(--text);font-size:12px;outline:none" />
            <label style="display:inline-flex;align-items:center;gap:8px;padding:10px 12px;border-radius:10px;border:1px solid rgba(255,255,255,0.08);background:rgba(13,17,23,0.72);font-size:11px;cursor:pointer;color:var(--text)">
              <span>Upload CSV</span>
              <input data-stock-csv type="file" accept=".csv,text/csv" style="display:none" />
            </label>
          </div>
          <div style="margin-top:8px;font-size:10px;color:var(--text-dim)">CSV columns: Ticker, Shares, Currency, Purchase Price, Purchase Date</div>
          ${this.renderSearchResults()}
        </div>

        <div style="padding:10px;border-radius:12px;background:rgba(13,17,23,0.55);border:1px solid rgba(255,255,255,0.08)">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px">
            <div style="font-size:11px;font-weight:700;color:var(--text)">Portfolio groups</div>
            <div style="font-size:10px;color:var(--text-dim)">${groups.length} group${groups.length === 1 ? '' : 's'}</div>
          </div>
          ${groups.length === 0 ? `
            <div style="font-size:10px;color:var(--text-dim)">Upload or add stocks to automatically break down your portfolio by groups like Energy, ETF & Funds, Technology, and more.</div>
          ` : `
            <div style="display:flex;flex-direction:column;gap:6px">
              ${groups.map((group) => `
                <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:7px 9px;border-radius:9px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06)">
                  <div style="display:flex;flex-direction:column;gap:2px">
                    <div style="font-size:11px;font-weight:700;color:var(--text)">${escapeHtml(group.label)}</div>
                    <div style="font-size:10px;color:var(--text-dim)">${group.holdings} holding${group.holdings === 1 ? '' : 's'}</div>
                  </div>
                  <div style="text-align:right">
                    <div style="font-size:11px;font-weight:700;color:var(--text)">${group.weightPct.toFixed(1)}%</div>
                    <div style="font-size:10px;color:var(--text-dim)">${formatMoney(group.value, selectedCurrency)}</div>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>

        ${this.errorMessage ? `<div style="font-size:11px;color:var(--red);padding:10px 12px;border-radius:10px;background:rgba(255,68,68,0.08);border:1px solid rgba(255,68,68,0.18)">${escapeHtml(this.errorMessage)}</div>` : ''}

        <div style="display:grid;grid-template-columns:1fr;gap:12px">
          <div>
            <div style="font-size:11px;font-weight:700;color:var(--text);margin-bottom:8px">Tracked stocks</div>
            ${this.renderHoldings()}
          </div>
          <div>
            <div style="font-size:11px;font-weight:700;color:var(--text);margin-bottom:8px">Stock detail</div>
            ${this.renderDetail()}
          </div>
        </div>
      </div>
    `;

    this.setContent(html);
  }
}
