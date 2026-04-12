import { Panel } from './Panel';
import { analyzeStockWithGlobalContext, type StockGlobalInsight } from '@/services/stock-global-insights';
import type { ClusteredEvent, NewsItem } from '@/types';
import { escapeHtml } from '@/utils/sanitize';

export class StockGlobalIntelligencePanel extends Panel {
  private currentSymbol: string | null = null;
  private cachedInsights: Map<string, StockGlobalInsight> = new Map();
  private analysisInProgress: Map<string, Promise<void>> = new Map();

  constructor() {
    super({
      id: 'stock-global-intelligence',
      title: 'Stock Global Intelligence',
      infoTooltip: 'AI-powered geopolitical and macro analysis for selected stock',
    });
    this.showEmpty();
  }

  private showEmpty(): void {
    this.setContent(`
      <div style="display:flex;align-items:center;justify-content:center;height:200px;color:var(--text-dim);text-align:center;padding:20px">
        <div>
          <div style="font-size:13px;margin-bottom:8px">📊 Select a stock to see global insights</div>
          <div style="font-size:11px">News, intelligence, market signals & geopolitical analysis</div>
        </div>
      </div>
    `);
  }

  /**
   * Update analysis for selected stock
   */
  public async updateForStock(
    symbol: string,
    companyName: string,
    sector: string,
    globalNews: NewsItem[],
    intelEvents: ClusteredEvent[],
    marketSignals: string[],
    supplyChainRisks: string[],
    geopoliticalRisks: string[],
    sectorOutlook: string[],
    macroIndicators: string[]
  ): Promise<void> {
    if (this.currentSymbol === symbol && this.cachedInsights.has(symbol)) {
      this.renderCachedInsight(symbol);
      return;
    }

    this.currentSymbol = symbol;
    this.showLoading(`Analyzing global conditions for ${symbol}...`);

    // Prevent duplicate concurrent analyses
    const existingAnalysis = this.analysisInProgress.get(symbol);
    if (existingAnalysis) {
      await existingAnalysis;
      if (this.cachedInsights.has(symbol)) {
        this.renderCachedInsight(symbol);
      }
      return;
    }

    const analysisPromise = analyzeStockWithGlobalContext({
      symbol,
      companyName,
      sector,
      globalNews,
      intelEvents,
      marketSignals,
      supplyChainRisks,
      geopoliticalRisks,
      sectorOutlook,
      macroIndicators,
    })
      .then((insight) => {
        this.cachedInsights.set(symbol, insight);
        if (this.currentSymbol === symbol) {
          this.renderInsight(insight);
        }
      })
      .catch((err) => {
        console.error('Stock global intelligence error:', err);
        if (this.currentSymbol === symbol) {
          this.showError('Unable to generate insights');
        }
      })
      .finally(() => {
        this.analysisInProgress.delete(symbol);
      });

    this.analysisInProgress.set(symbol, analysisPromise);
    await analysisPromise;
  }

  private renderCachedInsight(symbol: string): void {
    const insight = this.cachedInsights.get(symbol);
    if (insight) {
      this.renderInsight(insight);
    }
  }

  private renderInsight(insight: StockGlobalInsight): void {
    const confidenceColor =
      insight.confidence === 'high'
        ? 'var(--bullish)'
        : insight.confidence === 'medium'
          ? 'var(--accent)'
          : 'var(--bearish)';

    const badge = `
      <span style="
        display:inline-block;
        padding:3px 8px;
        border-radius:3px;
        font-size:10px;
        font-weight:600;
        background:rgba(${confidenceColor},0.15);
        color:${confidenceColor};
        text-transform:uppercase;
        letter-spacing:0.05em
      ">
        ${insight.confidence} confidence
      </span>
    `;

    const dataPointsHtml = `
      <div style="
        display:grid;
        grid-template-columns:repeat(auto-fit,minmax(120px,1fr));
        gap:8px;
        margin-top:12px;
        padding:10px;
        background:rgba(255,255,255,0.02);
        border-radius:6px;
        border:1px solid var(--border)
      ">
        <div style="font-size:11px">
          <div style="color:var(--text-dim);margin-bottom:3px">News Items</div>
          <div style="font-size:14px;font-weight:600">${insight.dataPoints.newsCount}</div>
        </div>
        <div style="font-size:11px">
          <div style="color:var(--text-dim);margin-bottom:3px">Intel Events</div>
          <div style="font-size:14px;font-weight:600">${insight.dataPoints.intelCount}</div>
        </div>
        ${insight.dataPoints.marketSignals.length > 0 ? `
          <div style="font-size:11px">
            <div style="color:var(--text-dim);margin-bottom:3px">Market Signals</div>
            <div style="font-size:14px;font-weight:600">${insight.dataPoints.marketSignals.length}</div>
          </div>
        ` : ''}
        ${insight.dataPoints.riskFactors.length > 0 ? `
          <div style="font-size:11px">
            <div style="color:var(--text-dim);margin-bottom:3px">Risk Factors</div>
            <div style="font-size:14px;font-weight:600">${insight.dataPoints.riskFactors.length}</div>
          </div>
        ` : ''}
      </div>
    `;

    const riskItems = insight.dataPoints.riskFactors.slice(0, 3);
    const riskList = riskItems.length > 0
      ? `<ul style="margin:8px 0 0;padding-left:18px;font-size:11px;line-height:1.6;color:var(--text-dim)">
          ${riskItems.map(r => `<li>${escapeHtml(r)}</li>`).join('')}
         </ul>`
      : '';

    const signalItems = insight.dataPoints.marketSignals.slice(0, 3);
    const signalList = signalItems.length > 0
      ? `<ul style="margin:8px 0 0;padding-left:18px;font-size:11px;line-height:1.6;color:var(--text-dim)">
          ${signalItems.map(s => `<li>${escapeHtml(s)}</li>`).join('')}
         </ul>`
      : '';

    this.setContent(`
      <div style="display:flex;flex-direction:column;gap:14px;padding:2px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px">
          <div>
            <div style="font-size:12px;color:var(--text-dim);margin-bottom:4px">Analysis: ${new Date(insight.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
          </div>
          ${badge}
        </div>

        <div style="padding:12px;background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:6px;line-height:1.6;font-size:12px">
          ${escapeHtml(insight.insights).replace(/\n/g, '<br>')}
        </div>

        ${dataPointsHtml}

        ${signalItems.length > 0 ? `
          <div>
            <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-dim);margin-bottom:6px">📈 Market Signals</div>
            ${signalList}
          </div>
        ` : ''}

        ${riskItems.length > 0 ? `
          <div>
            <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-dim);margin-bottom:6px">⚠️ Risk Factors</div>
            ${riskList}
          </div>
        ` : ''}
      </div>
    `);

    this.setDataBadge('live', `${insight.symbol}`);
  }

  public showLoading(msg: string): void {
    this.setContent(`
      <div style="display:flex;align-items:center;justify-content:center;height:200px;color:var(--text-dim);gap:8px">
        <div style="width:12px;height:12px;border:2px solid var(--text-dim);border-top-color:var(--accent);border-radius:50%;animation:spin 0.8s linear infinite"></div>
        <div>${msg}</div>
      </div>
    `);
  }
}
