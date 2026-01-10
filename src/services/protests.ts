import type { SocialUnrestEvent, ProtestSeverity, ProtestEventType } from '@/types';
import { INTEL_HOTSPOTS } from '@/config';
import { generateId } from '@/utils';

// ACLED API - requires free registration at acleddata.com
const ACLED_API_URL = '/api/acled/acled/read';
const ACLED_API_KEY = import.meta.env.VITE_ACLED_API_KEY || '';
const ACLED_EMAIL = import.meta.env.VITE_ACLED_EMAIL || '';

// GDELT GEO 2.0 API - no auth required
const GDELT_GEO_URL = '/api/gdelt/api/v2/geo/geo';

// Haversine distance calculation
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Find nearby intel hotspots for context
function findNearbyHotspots(lat: number, lon: number, radiusKm = 500): string[] {
  return INTEL_HOTSPOTS
    .filter(h => haversineKm(lat, lon, h.lat, h.lon) < radiusKm)
    .map(h => h.name);
}

// ACLED event type mapping
function mapAcledEventType(eventType: string, subEventType: string): ProtestEventType {
  const lower = (eventType + ' ' + subEventType).toLowerCase();
  if (lower.includes('riot') || lower.includes('mob violence')) return 'riot';
  if (lower.includes('strike')) return 'strike';
  if (lower.includes('demonstration')) return 'demonstration';
  if (lower.includes('protest')) return 'protest';
  return 'civil_unrest';
}

// ACLED fatality-based severity
function acledSeverity(fatalities: number, eventType: string): ProtestSeverity {
  if (fatalities > 0 || eventType.toLowerCase().includes('riot')) return 'high';
  if (eventType.toLowerCase().includes('protest')) return 'medium';
  return 'low';
}

interface AcledEvent {
  event_id_cnty: string;
  event_date: string;
  event_type: string;
  sub_event_type: string;
  actor1: string;
  actor2?: string;
  country: string;
  admin1?: string;
  admin2?: string;
  location: string;
  latitude: string;
  longitude: string;
  fatalities: string;
  notes: string;
  source: string;
  source_scale?: string;
  tags?: string;
}

async function fetchAcledEvents(): Promise<SocialUnrestEvent[]> {
  if (!ACLED_API_KEY || !ACLED_EMAIL) {
    console.warn('[Protests] ACLED API key not configured. Get free key at acleddata.com');
    return [];
  }

  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dateStr = thirtyDaysAgo.toISOString().split('T')[0] || '';

    const params = new URLSearchParams();
    params.set('key', ACLED_API_KEY);
    params.set('email', ACLED_EMAIL);
    params.set('event_type', 'Protests');
    params.set('event_date', dateStr);
    params.set('event_date_where', '>=');
    params.set('limit', '500');

    const response = await fetch(`${ACLED_API_URL}?${params}`, {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      console.error('[Protests] ACLED API error:', response.status);
      return [];
    }

    const data = await response.json();
    const events: AcledEvent[] = data.data || [];

    return events.map((e): SocialUnrestEvent => {
      const lat = parseFloat(e.latitude);
      const lon = parseFloat(e.longitude);
      const fatalities = parseInt(e.fatalities, 10) || 0;

      return {
        id: `acled-${e.event_id_cnty}`,
        title: e.notes?.slice(0, 200) || `${e.sub_event_type} in ${e.location}`,
        summary: e.notes,
        eventType: mapAcledEventType(e.event_type, e.sub_event_type),
        city: e.location,
        country: e.country,
        region: e.admin1,
        lat,
        lon,
        time: new Date(e.event_date),
        severity: acledSeverity(fatalities, e.event_type),
        fatalities: fatalities > 0 ? fatalities : undefined,
        sources: [e.source],
        sourceType: 'acled',
        actors: [e.actor1, e.actor2].filter(Boolean) as string[],
        tags: e.tags?.split(';').map(t => t.trim()).filter(Boolean),
        relatedHotspots: findNearbyHotspots(lat, lon),
        confidence: 'high',
        validated: true,
      };
    });
  } catch (error) {
    console.error('[Protests] ACLED fetch error:', error);
    return [];
  }
}

interface GdeltFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
  properties: {
    url: string;
    urlmobile?: string;
    title: string;
    seendate: string;
    socialimage?: string;
    domain: string;
    language: string;
    sourcecountry?: string;
    tone?: number;
  };
}

interface GdeltGeoResponse {
  type: 'FeatureCollection';
  features: GdeltFeature[];
}

async function fetchGdeltEvents(): Promise<SocialUnrestEvent[]> {
  try {
    const queries = [
      'protest OR demonstration',
      'riot OR unrest',
      'strike workers',
    ];

    const allEvents: SocialUnrestEvent[] = [];
    const seenUrls = new Set<string>();

    for (const query of queries) {
      const params = new URLSearchParams({
        query,
        format: 'geojson',
        maxrecords: '100',
        timespan: '7d',
      });

      const response = await fetch(`${GDELT_GEO_URL}?${params}`, {
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) continue;

      const data: GdeltGeoResponse = await response.json();

      for (const feature of data.features || []) {
        if (seenUrls.has(feature.properties.url)) continue;
        seenUrls.add(feature.properties.url);

        const [lon, lat] = feature.geometry.coordinates;
        const title = feature.properties.title;
        const tone = feature.properties.tone || 0;

        let sentiment: 'angry' | 'peaceful' | 'mixed' = 'mixed';
        if (tone < -3) sentiment = 'angry';
        else if (tone > 1) sentiment = 'peaceful';

        let severity: ProtestSeverity = 'medium';
        const lowerTitle = title.toLowerCase();
        if (lowerTitle.includes('riot') || lowerTitle.includes('clash') || lowerTitle.includes('violence')) {
          severity = 'high';
        } else if (lowerTitle.includes('peaceful') || lowerTitle.includes('march')) {
          severity = 'low';
        }

        let eventType: ProtestEventType = 'protest';
        if (lowerTitle.includes('riot')) eventType = 'riot';
        else if (lowerTitle.includes('strike')) eventType = 'strike';
        else if (lowerTitle.includes('demonstration')) eventType = 'demonstration';

        allEvents.push({
          id: `gdelt-${generateId()}`,
          title,
          eventType,
          country: feature.properties.sourcecountry || 'Unknown',
          lat,
          lon,
          time: new Date(feature.properties.seendate),
          severity,
          sources: [feature.properties.domain],
          sourceType: 'gdelt',
          relatedHotspots: findNearbyHotspots(lat, lon),
          confidence: 'medium',
          validated: false,
          imageUrl: feature.properties.socialimage,
          sentiment,
        });
      }
    }

    return allEvents;
  } catch (error) {
    console.error('[Protests] GDELT fetch error:', error);
    return [];
  }
}

// Deduplicate events from multiple sources
function deduplicateEvents(events: SocialUnrestEvent[]): SocialUnrestEvent[] {
  const unique = new Map<string, SocialUnrestEvent>();

  for (const event of events) {
    // Create a rough location key (0.5 degree grid)
    const latKey = Math.round(event.lat * 2) / 2;
    const lonKey = Math.round(event.lon * 2) / 2;
    const dateKey = event.time.toISOString().split('T')[0];
    const key = `${latKey}:${lonKey}:${dateKey}`;

    const existing = unique.get(key);
    if (!existing) {
      unique.set(key, event);
    } else {
      // Merge: prefer ACLED (higher confidence), combine sources
      if (event.sourceType === 'acled' && existing.sourceType !== 'acled') {
        event.sources = [...new Set([...event.sources, ...existing.sources])];
        event.validated = true;
        unique.set(key, event);
      } else if (existing.sourceType === 'acled') {
        existing.sources = [...new Set([...existing.sources, ...event.sources])];
        existing.validated = true;
      } else {
        existing.sources = [...new Set([...existing.sources, ...event.sources])];
        if (existing.sources.length >= 2) {
          existing.confidence = 'high';
          existing.validated = true;
        }
      }
    }
  }

  return Array.from(unique.values());
}

// Sort by severity and recency
function sortEvents(events: SocialUnrestEvent[]): SocialUnrestEvent[] {
  const severityOrder: Record<ProtestSeverity, number> = { high: 0, medium: 1, low: 2 };

  return events.sort((a, b) => {
    // First by severity
    const sevDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (sevDiff !== 0) return sevDiff;

    // Then by recency
    return b.time.getTime() - a.time.getTime();
  });
}

export interface ProtestData {
  events: SocialUnrestEvent[];
  byCountry: Map<string, SocialUnrestEvent[]>;
  highSeverityCount: number;
  sources: { acled: number; gdelt: number };
}

export async function fetchProtestEvents(): Promise<ProtestData> {
  // Fetch from both sources in parallel
  const [acledEvents, gdeltEvents] = await Promise.all([
    fetchAcledEvents(),
    fetchGdeltEvents(),
  ]);

  console.log(`[Protests] Fetched ${acledEvents.length} ACLED, ${gdeltEvents.length} GDELT events`);

  // Combine and deduplicate
  const allEvents = deduplicateEvents([...acledEvents, ...gdeltEvents]);
  const sorted = sortEvents(allEvents);

  // Group by country
  const byCountry = new Map<string, SocialUnrestEvent[]>();
  for (const event of sorted) {
    const existing = byCountry.get(event.country) || [];
    existing.push(event);
    byCountry.set(event.country, existing);
  }

  return {
    events: sorted,
    byCountry,
    highSeverityCount: sorted.filter(e => e.severity === 'high').length,
    sources: {
      acled: acledEvents.length,
      gdelt: gdeltEvents.length,
    },
  };
}

export function getProtestStatus(): { acledConfigured: boolean; gdeltAvailable: boolean } {
  return {
    acledConfigured: Boolean(ACLED_API_KEY && ACLED_EMAIL),
    gdeltAvailable: true,
  };
}
