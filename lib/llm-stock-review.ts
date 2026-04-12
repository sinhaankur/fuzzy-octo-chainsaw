import type { HoldingImplication, WorldAffairsEvent } from '@/lib/market-intelligence'

export interface AiStockReview {
  symbol: string
  dependentCountries: string[]
  impactFactors: string[]
  confidence: 'high' | 'medium' | 'low'
  generatedBy: string
}

export interface AiProviderMeta {
  enabled: boolean
  provider: 'local-claude' | 'ollama' | 'openai-compatible' | 'none'
  model?: string
  reason?: string
}

type ProviderProtocol = 'anthropic' | 'openai' | 'ollama'

interface ResolvedProvider {
  meta: AiProviderMeta
  protocol: ProviderProtocol
  baseUrl: string
  model: string
  apiKey?: string
}

interface GoogleFinanceDetails {
  symbol: string
  name?: string
  exchange?: string
  currency?: string
  marketCap?: string
  peRatio?: string
  description?: string
  type: string
}

interface GenerateAiStockReviewsInput {
  symbols: string[]
  googleFinanceDetails: Record<string, GoogleFinanceDetails>
  implications: HoldingImplication[]
  events: WorldAffairsEvent[]
}

interface ClaudeResponse {
  content?: Array<{
    type?: string
    text?: string
  }>
}

interface OpenAiChatResponse {
  choices?: Array<{
    message?: {
      content?: string
    }
  }>
}

interface OllamaChatResponse {
  message?: {
    content?: string
  }
}

const REQUEST_TIMEOUT_MS = 2500

function extractJsonObject(text: string): string | null {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start < 0 || end < 0 || end <= start) return null
  return text.slice(start, end + 1)
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs = REQUEST_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
      cache: 'no-store',
    })
  } finally {
    clearTimeout(timer)
  }
}

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/$/, '')
}

async function detectOllamaProvider(): Promise<ResolvedProvider | null> {
  const baseUrl = normalizeBaseUrl(process.env.OLLAMA_BASE_URL ?? 'http://127.0.0.1:11434')

  try {
    const response = await fetchWithTimeout(`${baseUrl}/api/tags`, { method: 'GET' })
    if (!response.ok) return null

    const json = (await response.json()) as {
      models?: Array<{ name?: string; model?: string }>
    }

    const model = json.models?.[0]?.name ?? json.models?.[0]?.model
    if (!model) return null

    return {
      meta: {
        enabled: true,
        provider: 'ollama',
        model,
      },
      protocol: 'ollama',
      baseUrl,
      model,
    }
  } catch {
    return null
  }
}

async function detectOpenAiCompatibleProvider(): Promise<ResolvedProvider | null> {
  const baseUrl = normalizeBaseUrl(process.env.LOCAL_OPENAI_BASE_URL ?? 'http://127.0.0.1:1234')
  const apiKey = process.env.LOCAL_OPENAI_API_KEY

  try {
    const response = await fetchWithTimeout(`${baseUrl}/v1/models`, {
      method: 'GET',
      headers: {
        ...(apiKey ? { authorization: `Bearer ${apiKey}` } : {}),
      },
    })
    if (!response.ok) return null

    const json = (await response.json()) as {
      data?: Array<{ id?: string }>
    }

    const model = json.data?.[0]?.id
    if (!model) return null

    return {
      meta: {
        enabled: true,
        provider: 'openai-compatible',
        model,
      },
      protocol: 'openai',
      baseUrl,
      model,
      apiKey,
    }
  } catch {
    return null
  }
}

async function detectLocalClaudeProvider(): Promise<ResolvedProvider | null> {
  const baseUrl = normalizeBaseUrl(process.env.LOCAL_CLAUDE_BASE_URL ?? 'http://127.0.0.1:8080')
  const apiKey = process.env.LOCAL_CLAUDE_API_KEY
  let model = process.env.LOCAL_CLAUDE_MODEL

  if (!model) {
    try {
      const response = await fetchWithTimeout(`${baseUrl}/v1/models`, {
        method: 'GET',
        headers: {
          ...(apiKey ? { 'x-api-key': apiKey } : {}),
          ...(apiKey ? { authorization: `Bearer ${apiKey}` } : {}),
        },
      })

      if (response.ok) {
        const json = (await response.json()) as {
          data?: Array<{ id?: string }>
        }
        model = json.data?.[0]?.id
      }
    } catch {
      // No-op: model may still be provided by env.
    }
  }

  if (!model) return null

  try {
    const response = await fetchWithTimeout(`${baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(apiKey ? { 'x-api-key': apiKey } : {}),
        ...(apiKey ? { authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify({
        model,
        max_tokens: 5,
        messages: [{ role: 'user', content: 'ping' }],
      }),
    })

    if (!response.ok) return null

    return {
      meta: {
        enabled: true,
        provider: 'local-claude',
        model,
      },
      protocol: 'anthropic',
      baseUrl,
      model,
      apiKey,
    }
  } catch {
    return null
  }
}

async function resolveProvider(): Promise<ResolvedProvider | null> {
  const explicitEnable = process.env.ENABLE_LOCAL_CLAUDE === 'true'
  if (explicitEnable) {
    const explicit = await detectLocalClaudeProvider()
    if (explicit) return explicit
  }

  const autoDiscoveryEnabled = process.env.ENABLE_LOCAL_LLM_AUTO_DISCOVERY?.toLowerCase() !== 'false'
  if (!autoDiscoveryEnabled) return null

  const providers = await Promise.all([
    detectOllamaProvider(),
    detectOpenAiCompatibleProvider(),
    detectLocalClaudeProvider(),
  ])

  return providers.find((provider) => provider !== null) ?? null
}

async function invokeProvider(
  provider: ResolvedProvider,
  system: string,
  user: string,
): Promise<string | null> {
  if (provider.protocol === 'anthropic') {
    const response = await fetchWithTimeout(`${provider.baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(provider.apiKey ? { 'x-api-key': provider.apiKey } : {}),
        ...(provider.apiKey ? { authorization: `Bearer ${provider.apiKey}` } : {}),
      },
      body: JSON.stringify({
        model: provider.model,
        max_tokens: 1000,
        system,
        messages: [{ role: 'user', content: user }],
      }),
    })

    if (!response.ok) return null
    const json = (await response.json()) as ClaudeResponse
    return (json.content ?? [])
      .filter((item) => item.type === 'text' && item.text)
      .map((item) => item.text)
      .join('\n')
  }

  if (provider.protocol === 'openai') {
    const response = await fetchWithTimeout(`${provider.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(provider.apiKey ? { authorization: `Bearer ${provider.apiKey}` } : {}),
      },
      body: JSON.stringify({
        model: provider.model,
        temperature: 0.2,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
    })

    if (!response.ok) return null
    const json = (await response.json()) as OpenAiChatResponse
    return json.choices?.[0]?.message?.content ?? null
  }

  const response = await fetchWithTimeout(`${provider.baseUrl}/api/chat`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: provider.model,
      stream: false,
      options: { temperature: 0.2 },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  })

  if (!response.ok) return null
  const json = (await response.json()) as OllamaChatResponse
  return json.message?.content ?? null
}

function buildFallbackReviews(input: GenerateAiStockReviewsInput): Record<string, AiStockReview> {
  const bySymbol: Record<string, AiStockReview> = {}

  for (const symbol of input.symbols) {
    const implication = input.implications.find((item) => item.symbol === symbol)
    const affectedEvents = input.events.filter((event) => event.affectedSymbols?.includes(symbol))

    bySymbol[symbol] = {
      symbol,
      dependentCountries: Array.from(new Set(affectedEvents.map((event) => event.country))).slice(0, 4),
      impactFactors: [
        ...(implication?.reasoning ?? []),
        ...affectedEvents.slice(0, 3).map((event) => `${event.country} (${event.region}) ${event.category} pressure`),
      ].slice(0, 6),
      confidence: 'low',
      generatedBy: 'fallback-rule-engine',
    }
  }

  return bySymbol
}

export async function generateAiStockReviews(
  input: GenerateAiStockReviewsInput,
): Promise<{ provider: AiProviderMeta; reviews: Record<string, AiStockReview> }> {
  const provider = await resolveProvider()
  if (!provider) {
    return {
      provider: {
        enabled: false,
        provider: 'none',
        reason: 'No local LLM detected (Ollama/OpenAI-compatible/local Claude)',
      },
      reviews: {},
    }
  }

  const targets = input.symbols.slice(0, 8)
  if (targets.length === 0) {
    return {
      provider: provider.meta,
      reviews: {},
    }
  }

  const context = targets.map((symbol) => {
    const detail = input.googleFinanceDetails[symbol]
    const implication = input.implications.find((item) => item.symbol === symbol)
    const events = input.events
      .filter((event) => event.affectedSymbols?.includes(symbol))
      .slice(0, 4)
      .map((event) => ({
        title: event.title,
        country: event.country,
        region: event.region,
        category: event.category,
        summary: event.summary,
      }))

    return {
      symbol,
      detail,
      implication,
      events,
    }
  })

  const system = [
    'You are an equity risk analyst.',
    'Return only valid JSON.',
    'For each symbol provide dependentCountries and impactFactors (3-6 concise bullets).',
    'Schema: { reviews: { SYMBOL: { dependentCountries: string[], impactFactors: string[], confidence: "high"|"medium"|"low" } } }',
  ].join(' ')

  const user = `Analyze these stock contexts and return JSON only:\n${JSON.stringify(context)}`

  try {
    const text = await invokeProvider(provider, system, user)
    if (!text) {
      return {
        provider: {
          ...provider.meta,
          reason: 'Local LLM request failed',
        },
        reviews: buildFallbackReviews(input),
      }
    }

    const rawObject = extractJsonObject(text)
    if (!rawObject) {
      return {
        provider: {
          ...provider.meta,
          reason: 'Local LLM returned non-JSON response',
        },
        reviews: buildFallbackReviews(input),
      }
    }

    const parsed = JSON.parse(rawObject) as {
      reviews?: Record<string, { dependentCountries?: string[]; impactFactors?: string[]; confidence?: 'high' | 'medium' | 'low' }>
    }

    const reviews: Record<string, AiStockReview> = {}

    for (const symbol of targets) {
      const review = parsed.reviews?.[symbol]
      const fallback = buildFallbackReviews({ ...input, symbols: [symbol] })[symbol]

      reviews[symbol] = {
        symbol,
        dependentCountries: review?.dependentCountries?.filter(Boolean).slice(0, 6) ?? fallback.dependentCountries,
        impactFactors: review?.impactFactors?.filter(Boolean).slice(0, 6) ?? fallback.impactFactors,
        confidence: review?.confidence ?? fallback.confidence,
        generatedBy: `${provider.meta.provider}:${provider.model}`,
      }
    }

    return {
      provider: provider.meta,
      reviews,
    }
  } catch {
    return {
      provider: {
        ...provider.meta,
        reason: 'Local LLM request failed unexpectedly',
      },
      reviews: buildFallbackReviews(input),
    }
  }
}
