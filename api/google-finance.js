// @ts-check

export const config = { runtime: 'edge' };

import { getCorsHeaders, isDisallowedOrigin } from './_cors.js';

function json(body, status, cors) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=120, s-maxage=120',
      ...cors,
    },
  });
}

function normalizeHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseNumber(raw) {
  if (!raw) return null;
  const cleaned = raw.replace(/,/g, '');
  const value = Number.parseFloat(cleaned);
  return Number.isFinite(value) ? value : null;
}

function parseQuote(text) {
  const compact = text.replace(/\s+/g, ' ');
  const patterns = [
    /(?:^|\s)(?:US\$|C\$|CA\$|A\$|€|£|¥|₹)?([0-9][0-9,]*(?:\.\d+)?)\s+([0-9]+(?:\.\d+)?)%\s*([+-][0-9][0-9,]*(?:\.\d+)?)\s+Today/i,
    /(?:^|\s)(?:US\$|C\$|CA\$|A\$|€|£|¥|₹)?([0-9][0-9,]*(?:\.\d+)?)\s+(Up|Down)\s+by\s+([0-9]+(?:\.\d+)?)%/i,
  ];

  for (const pattern of patterns) {
    const match = compact.match(pattern);
    if (!match) continue;

    if (match[2] === 'Up' || match[2] === 'Down') {
      const price = parseNumber(match[1]);
      const pct = parseNumber(match[3]);
      if (price === null || pct === null) continue;
      const signedPct = match[2] === 'Down' ? -pct : pct;
      return {
        price,
        changePercent: signedPct,
        change: null,
      };
    }

    const price = parseNumber(match[1]);
    const pct = parseNumber(match[2]);
    const abs = parseNumber(match[3]);
    if (price === null || pct === null || abs === null) continue;
    return {
      price,
      changePercent: abs < 0 ? -pct : pct,
      change: abs,
    };
  }

  return null;
}

function parseField(text, label, nextLabels) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const next = nextLabels
    .map((item) => item.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|');
  const regex = new RegExp(`${escaped}\\s*(.*?)\\s*(?=${next}|$)`, 'i');
  const match = text.match(regex);
  return match?.[1]?.trim() || null;
}

export default async function handler(req) {
  const cors = getCorsHeaders(req, 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (req.method !== 'GET') return json({ error: 'method_not_allowed' }, 405, cors);
  if (isDisallowedOrigin(req)) return json({ error: 'forbidden_origin' }, 403, cors);

  const url = new URL(req.url);
  const ticker = (url.searchParams.get('ticker') || '').trim().toUpperCase();
  const exchange = (url.searchParams.get('exchange') || '').trim().toUpperCase();

  if (!ticker || !exchange) {
    return json({ error: 'ticker_and_exchange_required' }, 400, cors);
  }

  const quoteUrl = `https://www.google.com/finance/quote/${encodeURIComponent(`${ticker}:${exchange}`)}?hl=en`;

  try {
    const upstream = await fetch(quoteUrl, {
      headers: {
        'User-Agent': 'StockMonitor App/1.0 (+https://localhost:3000)',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!upstream.ok) {
      return json({ error: 'upstream_failed', status: upstream.status }, 502, cors);
    }

    const html = await upstream.text();
    const text = normalizeHtml(html);
    const quote = parseQuote(text);

    if (!quote) {
      return json({ error: 'quote_parse_failed' }, 502, cors);
    }

    const currencyMatch = text.match(/Closed:[^·]*·\s*([A-Z]{3})\s*·\s*[A-Z0-9._-]+/i);
    const previousClose = parseNumber(parseField(text, 'PREVIOUS CLOSE', ['DAY RANGE', 'YEAR RANGE', 'MARKET CAP']));
    const yearRange = parseField(text, 'YEAR RANGE', ['MARKET CAP', 'AVG VOLUME', 'P/E RATIO']);
    const marketCap = parseField(text, 'MARKET CAP', ['AVG VOLUME', 'P/E RATIO', 'DIVIDEND YIELD']);

    return json({
      ticker,
      exchange,
      price: quote.price,
      change: quote.change,
      changePercent: quote.changePercent,
      currency: currencyMatch?.[1] || 'USD',
      previousClose,
      yearRange,
      marketCap,
      source: 'google',
      fetchedAt: new Date().toISOString(),
    }, 200, cors);
  } catch (error) {
    return json({ error: 'request_failed', message: error instanceof Error ? error.message : 'unknown' }, 502, cors);
  }
}