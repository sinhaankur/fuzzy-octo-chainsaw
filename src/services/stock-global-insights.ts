/**
 * Stock Global Intelligence Service
 * Synthesizes global data (news, intelligence, market signals) with LLM
 * to provide stock-specific geopolitical, macro, and supply chain insights.
 */

import type { ClusteredEvent } from '@/types';
import type { NewsItem } from '@/types';
import { mlWorker } from '@/services/ml-worker';

export interface StockGlobalInsight {
  symbol: string;
  insights: string;
  confidence: 'high' | 'medium' | 'low';
  dataPoints: {
    newsCount: number;
    intelCount: number;
    marketSignals: string[];
    riskFactors: string[];
  };
  generatedAt: number;
}

/**
 * Convert global data into context for LLM analysis
 */
function buildGlobalContext(options: {
  recentNews: NewsItem[];
  intelEvents: ClusteredEvent[];
  marketSignals: string[];
  supplyChainIssues: string[];
  geopoliticalRisks: string[];
  sectorOutlook: string[];
  macroIndicators: string[];
}): string {
  const sections: string[] = [];

  if (options.recentNews.length > 0) {
    const newsHeadlines = options.recentNews
      .slice(0, 8)
      .map(n => `- ${n.title}`)
      .join('\n');
    sections.push(`RECENT NEWS HEADLINES:\n${newsHeadlines}`);
  }

  if (options.intelEvents.length > 0) {
    const intelSummary = options.intelEvents
      .slice(0, 5)
      .map(e => `- ${e.primaryTitle} (Sources: ${e.sourceCount})`)
      .join('\n');
    sections.push(`INTELLIGENCE ALERTS:\n${intelSummary}`);
  }

  if (options.marketSignals.length > 0) {
    sections.push(`MARKET SIGNALS:\n${options.marketSignals.map(s => `- ${s}`).join('\n')}`);
  }

  if (options.supplyChainIssues.length > 0) {
    sections.push(`SUPPLY CHAIN RISKS:\n${options.supplyChainIssues.map(s => `- ${s}`).join('\n')}`);
  }

  if (options.geopoliticalRisks.length > 0) {
    sections.push(`GEOPOLITICAL RISKS:\n${options.geopoliticalRisks.map(r => `- ${r}`).join('\n')}`);
  }

  if (options.sectorOutlook.length > 0) {
    sections.push(`SECTOR OUTLOOK:\n${options.sectorOutlook.map(s => `- ${s}`).join('\n')}`);
  }

  if (options.macroIndicators.length > 0) {
    sections.push(`MACRO INDICATORS:\n${options.macroIndicators.map(m => `- ${m}`).join('\n')}`);
  }

  return sections.join('\n\n');
}

/**
 * Generate stock-specific insights using LLM and global context
 */
export async function analyzeStockWithGlobalContext(options: {
  symbol: string;
  companyName: string;
  sector: string;
  globalNews: NewsItem[];
  intelEvents: ClusteredEvent[];
  marketSignals: string[];
  supplyChainRisks: string[];
  geopoliticalRisks: string[];
  sectorOutlook: string[];
  macroIndicators: string[];
}): Promise<StockGlobalInsight> {
  const globalContext = buildGlobalContext({
    recentNews: options.globalNews,
    intelEvents: options.intelEvents,
    marketSignals: options.marketSignals,
    supplyChainIssues: options.supplyChainRisks,
    geopoliticalRisks: options.geopoliticalRisks,
    sectorOutlook: options.sectorOutlook,
    macroIndicators: options.macroIndicators,
  });

  const prompt = `Analyze how current global conditions affect this stock:

COMPANY: ${options.companyName} (${options.symbol})
SECTOR: ${options.sector}

${globalContext}

Provide 3-4 key insights on how this global situation specifically impacts this stock's near-term prospects. Be concise and actionable.`;

  try {
    // Use mlWorker's summarization capability for analysis
    const results = await mlWorker.summarize([prompt]);
    const insights = results[0] || '';
    const confidence = options.globalNews.length > 5 && options.intelEvents.length > 0 ? 'high' : 'medium';

    return {
      symbol: options.symbol,
      insights: insights.slice(0, 500),
      confidence,
      dataPoints: {
        newsCount: options.globalNews.length,
        intelCount: options.intelEvents.length,
        marketSignals: options.marketSignals,
        riskFactors: options.geopoliticalRisks,
      },
      generatedAt: Date.now(),
    };
  } catch (err) {
    console.error('Error generating stock insights:', err);
    return {
      symbol: options.symbol,
      insights: 'Unable to generate insights. Please try again.',
      confidence: 'low',
      dataPoints: {
        newsCount: options.globalNews.length,
        intelCount: options.intelEvents.length,
        marketSignals: options.marketSignals,
        riskFactors: options.geopoliticalRisks,
      },
      generatedAt: Date.now(),
    };
  }
}

/**
 * Calculate sector risk score based on global conditions
 */
export function calculateSectorRiskScore(sector: string, intelEvents: ClusteredEvent[]): number {
  // Count events that might affect this sector
  const sectorKeywords: Record<string, string[]> = {
    'energy': ['oil', 'gas', 'renewable', 'ukraine', 'russia', 'middle east'],
    'technology': ['cyber', 'ai', 'semiconductor', 'export', 'china'],
    'healthcare': ['disease', 'pandemic', 'biotech', 'supply chain'],
    'finance': ['central bank', 'interest rate', 'inflation', 'default'],
    'consumer': ['inflation', 'unemployment', 'sentiment'],
    'industrial': ['supply chain', 'logistics', 'trade'],
    'materials': ['commodity', 'mining', 'export'],
  };

  const keywords = sectorKeywords[sector.toLowerCase()] || [];
  if (keywords.length === 0) return 5; // neutral

  let riskCount = 0;
  for (const event of intelEvents.slice(0, 20)) {
    const eventText = `${event.primaryTitle}`.toLowerCase();
    if (keywords.some(kw => eventText.includes(kw))) {
      riskCount += 0.5;
    }
  }

  return Math.min(10, riskCount);
}
