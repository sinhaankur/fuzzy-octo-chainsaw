import type { CableAdvisory, RepairShip, Feed, UnderseaCable } from '@/types';
import { UNDERSEA_CABLES } from '@/config';
import { fetchWithProxy } from '@/utils';

interface CableActivity {
  advisories: CableAdvisory[];
  repairShips: RepairShip[];
}

interface RssItem {
  title: string;
  link: string;
  pubDate: Date;
  description: string;
}

const CABLE_ADVISORY_FEEDS: Feed[] = [
  {
    name: 'Cable Fault Advisories',
    url: '/rss/googlenews/rss/search?q=subsea+cable+fault+OR+undersea+cable+break+OR+fiber+optic+cable+cut&hl=en-US&gl=US&ceid=US:en',
  },
  {
    name: 'Cable Outage Notices',
    url: '/rss/googlenews/rss/search?q=submarine+cable+outage+OR+undersea+cable+disruption&hl=en-US&gl=US&ceid=US:en',
  },
];

const REPAIR_SHIP_FEEDS: Feed[] = [
  {
    name: 'Cable Repair Ship Tracking',
    url: '/rss/googlenews/rss/search?q=cable+repair+ship+OR+submarine+cable+repair+vessel+OR+cable+ship&hl=en-US&gl=US&ceid=US:en',
  },
];

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 48);
}

function parseText(doc: Document, item: Element, selectors: string[]): string {
  for (const selector of selectors) {
    const node = item.querySelector(selector);
    if (node?.textContent) return node.textContent.trim();
  }
  return '';
}

async function fetchRssItems(feed: Feed): Promise<RssItem[]> {
  try {
    const response = await fetchWithProxy(feed.url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const text = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/xml');
    const parseError = doc.querySelector('parsererror');
    if (parseError) {
      console.warn(`[CableActivity] Parse error for ${feed.name}`);
      return [];
    }

    const items = doc.querySelectorAll('item');
    return Array.from(items)
      .slice(0, 12)
      .map((item) => {
        const title = parseText(doc, item, ['title']);
        const link = parseText(doc, item, ['link']);
        const pubDateText = parseText(doc, item, ['pubDate']);
        const description = parseText(doc, item, ['description', 'summary', 'content']);
        const pubDate = pubDateText ? new Date(pubDateText) : new Date();

        return {
          title,
          link,
          pubDate,
          description,
        };
      })
      .filter((item) => item.title.length > 0);
  } catch (error) {
    console.error(`[CableActivity] Failed to fetch ${feed.name}:`, error);
    return [];
  }
}

function getCableMidpoint(cable: UnderseaCable): { lat: number; lon: number } {
  const midIndex = Math.floor(cable.points.length / 2);
  const [lon, lat] = cable.points[midIndex];
  return { lat, lon };
}

function findCableMatch(text: string): UnderseaCable | undefined {
  const normalized = normalizeText(text);
  return UNDERSEA_CABLES.find((cable) => normalized.includes(normalizeText(cable.name)));
}

function buildAdvisories(items: RssItem[]): CableAdvisory[] {
  const advisories: CableAdvisory[] = [];
  const seen = new Set<string>();

  items.forEach((item) => {
    const match = findCableMatch(`${item.title} ${item.description}`);
    if (!match) return;

    const severity = /fault|break|cut|rupture|severed/i.test(item.title + item.description)
      ? 'fault'
      : 'degraded';
    const { lat, lon } = getCableMidpoint(match);
    const id = `advisory-${match.id}-${slugify(item.title)}-${item.pubDate.getTime()}`;
    if (seen.has(id)) return;
    seen.add(id);

    advisories.push({
      id,
      cableId: match.id,
      title: item.title,
      severity,
      description: item.description || item.title,
      reported: item.pubDate,
      lat,
      lon,
      impact: severity === 'fault' ? 'Cable fault reported; traffic rerouting likely in progress.' : 'Degradation reported; monitoring for capacity impact.',
      repairEta: undefined,
    });
  });

  return advisories;
}

function extractShipName(text: string): string {
  const match = text.match(/CS\s+([A-Za-z0-9À-ÿ'’\-\s]+)/i);
  if (match?.[1]) {
    return `CS ${match[1].trim()}`.replace(/\s{2,}/g, ' ');
  }
  return 'Cable Repair Vessel';
}

function buildRepairShips(items: RssItem[]): RepairShip[] {
  const ships: RepairShip[] = [];
  const seen = new Set<string>();

  items.forEach((item) => {
    const match = findCableMatch(`${item.title} ${item.description}`);
    if (!match) return;

    const status = /on station|arrives|arrived|begins repair|repairing/i.test(item.title + item.description)
      ? 'on-station'
      : 'enroute';
    const { lat, lon } = getCableMidpoint(match);
    const name = extractShipName(item.title);
    const id = `repair-${match.id}-${slugify(item.title)}-${item.pubDate.getTime()}`;
    if (seen.has(id)) return;
    seen.add(id);

    ships.push({
      id,
      name,
      cableId: match.id,
      status,
      lat,
      lon,
      eta: status === 'on-station' ? 'On station' : 'TBD',
      note: item.description || item.title,
    });
  });

  return ships;
}

export async function fetchCableActivity(): Promise<CableActivity> {
  const [advisoryItems, shipItems] = await Promise.all([
    Promise.all(CABLE_ADVISORY_FEEDS.map(fetchRssItems)).then((results) => results.flat()),
    Promise.all(REPAIR_SHIP_FEEDS.map(fetchRssItems)).then((results) => results.flat()),
  ]);

  return {
    advisories: buildAdvisories(advisoryItems),
    repairShips: buildRepairShips(shipItems),
  };
}
