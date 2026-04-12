# 🗺 World Monitor Pro

**World Monitor Pro**: The ultimate situational awareness tool. Far beyond the original repo with advanced geopolitical tracking, AI briefs, and 100+ connectors.

**Real-time global intelligence dashboard** — AI-powered news aggregation, geopolitical monitoring, and infrastructure tracking in a unified situational awareness interface.

<p align="center">
  <a href="../../releases"><img src="https://img.shields.io/badge/Download-Windows_(.exe)-0078D4?style=for-the-badge&logo=windows&logoColor=white" alt="Download Windows"></a>&nbsp;
  <a href="../../releases"><img src="https://img.shields.io/badge/Download-macOS_Apple_Silicon-000000?style=for-the-badge&logo=apple&logoColor=white" alt="Download macOS ARM"></a>&nbsp;
</p>

![World Monitor Dashboard](images/worldmonitor-7-mar-2026.jpg)

---

## What It Does

- **435+ curated news feeds** across 15 categories, AI-synthesized into briefs
- **Dual map engine** — 3D globe (globe.gl) and WebGL flat map (deck.gl) with 45 data layers
- **Cross-stream correlation** — military, economic, disaster, and escalation signal convergence
- **Country Intelligence Index** — composite risk scoring across 12 signal categories
- **Finance radar** — 92 stock exchanges, commodities, crypto, and 7-signal market composite
- **Local AI** — run everything with Ollama, no API keys required
- **5 site variants** from a single codebase (world, tech, finance, commodity, happy)
- **Native desktop app** (Tauri 2) for macOS, Windows.
- **21 languages** with native-language feeds and RTL support

### World Monitor Pro

For investors, analysts, and professionals who need stock monitoring, geopolitical analysis, and daily AI briefings.

* Equity research — global stock analysis, financials, analyst targets, valuation metrics
* Geopolitical analysis — Grand Chessboard framework, Prisoners of Geography models
* Economy analytics — GDP, inflation, interest rates, growth cycles
* AI morning briefs & flash alerts delivered to Slack, Telegram, WhatsApp, Email
* Central bank & monetary policy tracking
* Global risk monitoring & scenario analysis
* Near-real-time data (<60s refresh), 22 services, 1 key
* Saved watchlists, custom views & configurable alert rules
* Premium map layers, longer history & desktop app workflows
* Live-edge + satellite imagery & SAR
* AI agents with investor personas & MCP
* 50,000+ infrastructure assets mapped
* 100+ data connectors (Splunk, Snowflake, Sentinel...)
* REST API + webhooks + bulk export
* Team workspaces with SSO/MFA/RBAC
* White-label & embeddable panels
* Android TV app for SOC walls & trading floors
* Cloud, on-prem, or air-gapped deployment
* Dedicated onboarding & support

---

## Quick Start

Choose the appropriate package for your operating system on the [Releases](../../releases) page.

### 🪟 Windows (Windows 10 / 11)
1. Download the latest version of `worldmonitor_x64.exe`.
2. Run the file and follow the setup wizard instructions.


### 🍎 macOS (Apple Silicon)
1. Download `worldmonitor_macOS.dmg`.
2. Double-click the `.dmg` file to mount it.
3. Drag and drop the **Hermes Agent** icon into your `Applications` folder.
4. Upon first launch, go to *System Settings -> Privacy & Security* and click "Open Anyway".


---

## Tech Stack

| Category | Technologies |
|----------|-------------|
| **Frontend** | Vanilla TypeScript, Vite, globe.gl + Three.js, deck.gl + MapLibre GL |
| **Desktop** | Tauri 2 (Rust) with Node.js sidecar |
| **AI/ML** | Ollama / Groq / OpenRouter, Transformers.js (browser-side) |
| **API Contracts** | Protocol Buffers (92 protos, 22 services), sebuf HTTP annotations |
| **Deployment** | Vercel Edge Functions (60+), Railway relay, Tauri, PWA |
| **Caching** | Redis (Upstash), 3-tier cache, CDN, service worker |

---

## Flight Data

Flight data provided gracefully by [Wingbits](https://wingbits.com), the most advanced ADS-B flight data solution.

---

## License

**AGPL-3.0** for non-commercial use. **Commercial license** required for any commercial use.

| Use Case | Allowed? |
|----------|----------|
| Personal / research / educational | Yes |
| Self-hosted (non-commercial) | Yes, with attribution |
| Fork and modify (non-commercial) | Yes, share source under AGPL-3.0 |
| Commercial use / SaaS / rebranding | Requires commercial license |

See [LICENSE](LICENSE) for full terms. For commercial licensing, contact the maintainer.

Copyright (C) 2024-2026 Elie Habib. All rights reserved.

---

## Security Acknowledgments

We thank the following researchers for responsibly disclosing security issues:

- **Cody Richard** — Disclosed three security findings covering IPC command exposure, renderer-to-sidecar trust boundary analysis, and fetch patch credential injection architecture (2026)

See our [Security Policy](./SECURITY.md) for responsible disclosure guidelines.

---
