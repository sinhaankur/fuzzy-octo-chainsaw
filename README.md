# StockMonitor

StockMonitor is a two-tile stock intelligence dashboard:

- Tile 1: Upload CSV, classify holdings, and review stock-level fundamentals/risk factors.
- Tile 2: 2D world map with world-affairs context and linked impact signals.

## Foundation

The project is built with provider-based data and AI layers:

- Market data/news: Alpha Vantage + Google Finance (via SerpApi)
- World events: Reference datasets in `Reference/scripts/data`
- AI review layer: Optional local Claude provider with fallback rule engine

This means the app still works even if local AI is down, while preserving a clean path to better AI analysis when enabled.

## Run

```bash
pnpm install
pnpm dev
```

## Environment

Copy `.env.example` to `.env.local` and fill values as needed.

Required for external market enrichments:

- `ALPHAVANTAGE_API_KEY`
- `SERPAPI_KEY`

Optional local Claude AI foundation:

- `ENABLE_LOCAL_CLAUDE=true`
- `LOCAL_CLAUDE_BASE_URL=http://127.0.0.1:8080`
- `LOCAL_CLAUDE_MODEL=claude-3-5-sonnet`
- `LOCAL_CLAUDE_API_KEY=` (optional)

Local LLM auto-connect (no manual provider wiring):

- `ENABLE_LOCAL_LLM_AUTO_DISCOVERY=true` (default)
- Auto-detect order: Ollama (`11434`) -> OpenAI-compatible local server (`1234`) -> local Claude-compatible endpoint (`8080`)
- Optional endpoint overrides:
	- `OLLAMA_BASE_URL`
	- `LOCAL_OPENAI_BASE_URL`
	- `LOCAL_OPENAI_API_KEY`

When you run a local model in terminal (for example `ollama serve`), the web app backend detects it at runtime and connects automatically.

Privacy-first mode:

- `STOCK_PRIVACY_MODE=strict` (default behavior)
- `PUBLIC_REFERENCE_SYMBOLS=AAPL,MSFT,NVDA,SPY,GLD,TSLA`

In strict mode, uploaded/user symbols are **never sent** to external providers (Google Finance, Alpha Vantage, or LLM endpoints). External feeds only use the public reference symbol list.

## GitHub Pages Demo Mode

The GitHub Pages deployment is a static preview build.

- UI and interaction flows are testable.
- API routes and local LLM runtime features are not available on Pages.
- The app shows a `Static Demo Mode` banner when deployed via the Pages workflow.

When local Claude is enabled, `/api/market-intelligence` returns AI-generated stock review factors and dependency-country analysis. If unavailable, the API falls back to deterministic rules.
