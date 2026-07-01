<div align="center">

<img src="apps/wrapped/social-preview.png" alt="Bundestag Wrapped" width="820" />

# Bundestag Wrapped

### Spotify Wrapped, but for the German _Bundestag_.

A shareable, animated year-in-review of German parliament — who spoke, what they said,
and what the year was really about — built entirely on **official open parliamentary data**.

[![▶ Live Demo](https://img.shields.io/badge/▶_Live-bundestag--wrapped.de-ec0e73?style=for-the-badge)](https://bundestag-wrapped.de)

[![CI](https://github.com/Movm/Bundestag_Wrapped/actions/workflows/ci.yml/badge.svg)](https://github.com/Movm/Bundestag_Wrapped/actions/workflows/ci.yml)
[![CodeQL](https://github.com/Movm/Bundestag_Wrapped/actions/workflows/codeql.yml/badge.svg)](https://github.com/Movm/Bundestag_Wrapped/actions/workflows/codeql.yml)
[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-blue.svg)](LICENSE)
[![MCP](https://img.shields.io/badge/MCP-enabled-8a2be2)](services/mcp/README.md)
[![Data: DIP API](https://img.shields.io/badge/data-Bundestag_DIP_API-444)](https://dip.bundestag.de/)

**[Try it live](https://bundestag-wrapped.de)** · [Features](#-features) · [How it works](#%EF%B8%8F-how-it-works) · [For AI assistants](#-for-ai-assistants-mcp) · [Data & methodology](#-data--methodology) · [Self-host](#-getting-started-self-host)

</div>

---

## What is this?

Every year the Bundestag produces thousands of speeches, bills, and debates — almost all of it
public, and almost none of it read. **Bundestag Wrapped** turns a full electoral period of
parliamentary speeches into the kind of playful, swipeable "year in review" you already know from
Spotify: your parliament's top topics, its record-holders, its favourite words, and its tone —
each as an animated story card you can share.

It's free, open-source, and runs on the Bundestag's own [open-data DIP API](https://dip.bundestag.de/).

> ### ▶ **[bundestag-wrapped.de](https://bundestag-wrapped.de)**
> No login, no install — open it in a browser (or grab the native app).

---

## 📸 A look inside

<div align="center">

<img src="apps/wrapped/screenshots/01-hero.png" width="155" alt="Start screen" />
<img src="apps/wrapped/screenshots/03-themen-chart.png" width="155" alt="Top topics of the year" />
<img src="apps/wrapped/screenshots/02-quiz.png" width="155" alt="Interactive quiz" />
<img src="apps/wrapped/screenshots/04-vokabular.png" width="155" alt="Signature vocabulary" />
<img src="apps/wrapped/screenshots/05-top-speakers.png" width="155" alt="Top speakers" />

<sub>**Start** · **Top themes** · **Quiz** · **Signature vocabulary** · **Top speakers** — each an animated, shareable story.</sub>

</div>

---

## ✨ Features

### 🎬 The Wrapped experience
- **Animated story cards** — swipe through the year: the biggest topics, the record-holders, the
  most distinctive words, the overall tone of debate.
- **Topic breakdown** — what parliament actually spent its time on, ranked and visualised.
- **Interactive quiz** — guess the stats before they're revealed.
- **Shareable sharepics** — every card renders to an image you can post to social media.
- **Sound & motion** — a polished, Spotify-grade feel (optional audio, fluid transitions).

### 🔍 Explore beyond the story
- **700+ speaker profiles** — signature words, tone profile, topic focus, and rankings for
  individual MPs.
- **Full speech search** — search the debate record by keyword and speaker.
- **Party & statistics pages** — coalition vs. opposition, who interrupts whom, cross-party
  comparisons.

### 📱 Everywhere
- **Web app** (React 19) and a **native iOS/Android app** (Expo / React Native).

### 🤖 Built for humans _and_ AI
- The same parliamentary data powers an **MCP server** so you can ask **Claude, ChatGPT, or
  [Grünerator](https://gruenerator.de)** about the Bundestag in plain language — see
  [below](#-for-ai-assistants-mcp).

---

## 🏗️ How it works

Three layers turn raw parliamentary records into a Wrapped story (and an AI-queryable API):

```
                    Official Bundestag DIP API  (dip.bundestag.de)
                                   │
              ┌────────────────────┴────────────────────┐
              ▼                                          ▼
   services/analysis  (Python)                 services/mcp  (Node.js)
   spaCy NLP + FastAPI                          MCP server + HTTP API
   • parse speeches                             • 30+ tools over the DIP API
   • tone + topic analysis                      • semantic search (Qdrant + Mistral)
   • export static JSON  ────────┐              • proxies the NLP service
              │                  │                          │
              ▼                  │                          ▼
   apps/wrapped  (React + RN)    │              AI assistants & apps
   renders the static JSON       │              (Claude · ChatGPT · Grünerator)
                                 └──────────────────────────┘
```

- **`services/analysis`** does the number-crunching once and exports plain JSON — so the web app
  is fully **static** (fast, cacheable, cheap to host).
- **`services/mcp`** exposes the live DIP data + semantic search to any MCP client.
- **`apps/wrapped`** is pure front-end: it just renders the exported data.

More detail in each package's README (linked in [Repository structure](#-repository-structure)).

---

## 🤖 For AI assistants (MCP)

Bundestag Wrapped ships a production-ready **[Model Context Protocol](https://modelcontextprotocol.io/)
server** (`services/mcp`) that gives any MCP-capable assistant **30+ tools** for German
parliamentary research — document & full-text search, semantic/vector search across speeches and
bills, bill-lifecycle tracking, and NLP analysis (tone, topics, party comparison).

A **public instance is live** — point your client at it, no self-hosting required:

```json
{
  "mcpServers": {
    "bundestag": {
      "url": "https://bundestagapi.moritz-waechter.de/mcp"
    }
  }
}
```

Works with **Claude Desktop, Cursor, VS Code (Copilot), and ChatGPT**.
👉 Full tool list, prompts, and per-client setup: **[services/mcp/README.md](services/mcp/README.md)**.

> _Example:_ ask _"Was hat der Bundestag zur Gebäudemodernisierung gemacht?"_ and the assistant
> pulls the actual bill, its status, and the floor debate — with citations.

---

## 📊 Data & methodology

> [!IMPORTANT]
> **Bundestag Wrapped is an independent open-source project.** It is **not affiliated with,
> endorsed by, or operated by the Deutscher Bundestag.** All data comes from the Bundestag's
> official public open-data interface.

- **Source** — the official [DIP API](https://dip.bundestag.de/) (`search.dip.bundestag.de`),
  covering the current electoral period (Wahlperiode 21) and earlier ones.
- **What's analysed** — plenary speeches from the official Plenarprotokolle.
- **How** — deterministic NLP with spaCy's German model (`de_core_news_lg`): word frequencies,
  **8 tone metrics** (aggression, collaboration, solution-focus, …) and **13 topic areas**
  (migration, climate, economy, …). No opaque LLM in the statistics — the numbers are
  **reproducible**.
- **Transparency for researchers** — `bundestag-analysis export-raw` emits versioned JSON with
  **SHA-256 checksums** (speeches, interjections, tone, topics, gender, party stats). See
  [services/analysis/README.md](services/analysis/README.md).

---

## 📁 Repository structure

A single pnpm monorepo (three formerly-separate repos, git history preserved):

| Package | Path | Stack | Role |
|---------|------|-------|------|
| **Wrapped** (web) | [`apps/wrapped`](apps/wrapped/README.md) | React 19 · Vite 7 · Tailwind 4 | The flagship "Wrapped" web experience |
| **Wrapped** (mobile) | [`apps/wrapped/mobile`](apps/wrapped/README.md) | Expo SDK 54 · React Native 0.81 | Native iOS/Android app |
| **Analysis** | [`services/analysis`](services/analysis/README.md) | Python 3.12 · spaCy · FastAPI | NLP pipeline, JSON exports, two APIs, CLI |
| **MCP server** | [`services/mcp`](services/mcp/README.md) | Node 22 · Express 5 · MCP SDK | 30+ tools + semantic search for AI clients |

---

## 🚀 Getting started (self-host)

### Prerequisites
- **Node ≥ 18** and **pnpm 10** (JS/TS workspace)
- **Python 3.12** (only for the `services/analysis` NLP pipeline)
- Optional: **Docker** for the full stack, a **DIP API key** ([free public key](https://www.bundestag.de/services/opendata))

### JS/TS workspace

```bash
pnpm install                 # one lockfile for all JS/TS packages

pnpm dev:web                 # Wrapped web app  → http://localhost:5173
pnpm dev:mcp                 # MCP server       → http://localhost:3000  (needs DIP_API_KEY)
pnpm --filter bundestag-wrapped-mobile start   # Expo dev server

pnpm test                    # all workspace tests
pnpm lint                    # all workspace lint
pnpm build                   # build the web app
```

> [!NOTE]
> **React versions are decoupled.** `apps/wrapped/mobile` (Expo) pins the exact React version its
> SDK ships — do **not** add `react`/`react-dom` to root `pnpm.overrides` (it breaks React Native).
> Root `.npmrc` uses `node-linker=hoisted` so Expo and native modules resolve correctly.

### Python NLP service

```bash
cd services/analysis
pip install -e ".[dev]"
python -m spacy download de_core_news_lg      # ~570 MB, needed for NLP (not for tests)
bundestag-analysis serve --port 8000          # NLP API
```

### Full stack with Docker

```bash
docker compose up --build
# wrapped → http://localhost:8080 · mcp → http://localhost:3000
```

Every deployable ships a **self-contained Dockerfile** (Coolify-friendly — one app per subfolder).
See each package README for env vars and deploy targets.

---

## 🛠️ Tech stack

**Frontend** — React 19 · Vite 7 · TailwindCSS 4 · Motion · Zustand · TanStack Query · Expo / React Native · NativeWind
**Backend** — Node 22 · Express 5 · MCP SDK · Qdrant · Mistral embeddings · Python 3.12 · spaCy · FastAPI
**Infra** — Docker · Coolify · pnpm workspaces · GitHub Actions (CI · CodeQL · Dependabot)

---

## 🗺️ Roadmap

- [ ] **Per-MP roll-call votes** (namentliche Abstimmungen) — the one dataset the DIP API omits;
  planned via the bundestag.de open-data XML ingest.
- [ ] **Aggregation & bill-timeline MCP tools** — counts / time-series and one-call proceeding digests.

---

## 🤝 Contributing

Issues and PRs are welcome. CI (lint · test · build for JS/TS and Python) runs on every push and
pull request — please keep it green. Security policy and private disclosure: [SECURITY.md](SECURITY.md).

---

## 🙏 Acknowledgements & License

Built on the Deutscher Bundestag's **[open-data DIP API](https://dip.bundestag.de/)**, and on the
open-source work of [spaCy](https://spacy.io/), [Qdrant](https://qdrant.tech/),
[Mistral AI](https://mistral.ai/), and [Model Context Protocol](https://modelcontextprotocol.io/).

© 2026 Moritz Wächter. Released under the **[GNU AGPL-3.0](LICENSE)** — you're free to use, study,
and modify it, but modified versions you distribute _or run as a network service_ must stay open
under the same license. Made with 💗 at [bundestag-wrapped.de](https://bundestag-wrapped.de).
