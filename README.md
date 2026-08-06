# KQCMM Web App

**Khanqahe Qadriyah Chishtiya Musharrafiya Mahboobiya**

A spiritual web platform for followers of the Chishti Sufi order. Displays devotional content — duas, khatm, fateha, kalam, sijrah nama, calendar events (2,364 incl. the recovered Blessed Days dataset) — in **English** and **Hinglish** (Urdu planned) with 8 themes, 17 fonts, 6 font sizes, and slide/list view modes.

🌐 **Live:** https://mehboob-dev.github.io/kqcmm-web/

---

## Quick Start

```bash
cd kqcmm-web
npm install          # Install dependencies
npm run dev          # Start dev server (localhost:5173)
npm run build        # Production build to dist/
npm run edit         # Content editor (localhost:3030)
```

---

## Tech Stack

| Technology | Purpose |
|---|---|
| React 18 | UI framework |
| Vite 5 | Build tool & dev server |
| React Router 6 | Client-side routing |
| FontAwesome 6 | Icons (solid) |
| react-helmet-async | SEO / Open Graph tags |
| vite-plugin-pwa | Service Worker + offline |
| Puppeteer | Pre-rendering (build only) |
| GitHub Pages | Hosting / auto-deploy |

---

## Project Structure (Key Areas)

```
src/
├── config/content/   ← All page content, split per language folder (en/, hinglish/; urdu planned)
├── config/strings/   ← UI labels and nav text
├── components/       ← Reusable UI (Layout, ContentView, BottomNav, etc.)
├── pages/            ← One component per route
├── context/          ← Theme, Language, Font, View state
└── styles.css        ← All styles in one file (themes, cards, layout)
docs/                 ← Full documentation (18 files)
scripts/              ← CLI tools (editor, prerender, sync scripts)
```

---

## Commands Reference

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server with hot reload |
| `npm run build` | Build for production (output: `dist/`) |
| `npm run preview` | Preview production build locally |
| `npm run edit` | Launch standalone content editor at localhost:3030 |
| `node scripts/sync-other-langs.mjs` | Sync hinglish/urdu from Quran XML files |

---

## Routes

| Path | Page |
|---|---|
| `/` | Home |
| `/dua` | Duas (supplications) |
| `/hmk` | Hajee Mahboob Kassim biography |
| `/sijrah-nama` | Sijrah Nama |
| `/fateha-khwani` | Fateha Khwani (32 sections) |
| `/khatm` | Khatm-e-Khwajagan (32 steps) |
| `/salim-pappa` | Salim Pappa |
| `/about` | About KQCMM |
| `/calendar` | Islamic Calendar (navigable Hijri/Gregorian month grid + mapped events) |
| `/roshni` | Roshni / Chirag Raushan |
| `/abbajaan` | Abbajaan |
| `/changelog` | Version history |
| `/books` | Books index — written works of Hajee Mahboob Kassim |
| `/books/:slug` | Individual book reader (chapters, list/slide view, quick chapter jump, progress, share) |

Routes are **registry-driven** from `src/config/pageRoutes.json`. Pages created in the
Admin Panel become public at their `/slug` automatically (rendered by a generic
content renderer).

---

## Features

| Feature | Details |
|---|---|
| **2 Languages** | English, Hinglish (Urdu planned — RTL support wired up) |
| **8 Themes** | Light, Dark, Sepia, Green, Rose, Indigo, Teal, OLED (default: Green) — shown as colored swatches in Settings |
| **17 Fonts** | System, Serif, Sans, Urdu Nastaliq, etc. |
| **6 Font Sizes** | X-Small (12px) to XX-Large (24px) |
| **2 View Modes** | List (stack cards) / Slide (one at a time + nav) |
| **Counter** | Global +/−/↺ counter on content pages |
| **Splash Screen** | 3s countdown, tap to skip (skips on revisit) |
| **Swipeable Drawer** | Side menu with background image |
| **Settings Popup** | Language, theme, font, view mode |
| **Offline Support** | Full app cached via Service Worker |
| **SEO / Open Graph** | Unique meta tags per page, pre-rendered |
| **Install App** | Native install button in bottom nav |
| **Swipe Navigation** | Swipe left/right in slide mode — deliberate drag required (80px threshold, vertical scroll ignored) |
| **Quick Jump** | Floating book FAB → bottom sheet to jump to key sections (labels auto-derived per language) |
| **Hijri Calendar** | Admin-maintained month starts → navigable Hijri/Gregorian month grid, mapped events, countdown, app-wide today strip |
| **Changelog** | Version history page |
| **Onboarding Walkthrough** | First-run guided tour (choose language, spotlight key controls, guided taps on real buttons), replayable from Settings |
| **Books Library** | Read the written works of Hajee Mahboob Kassim — cover-card index, per-book reader with list/slide view + quick chapter jump, reading progress, and share |

---

## Content

All content is in `src/config/content/{lang}/` — one folder per live language
(`en/`, `hinglish/`; urdu planned), each holding one JSON file per page. Pages
load their content dynamically per language via `usePageContent(lang, file)`
(falls back to `en/`). `quickJump` is a top-level, language-independent list of
selection indices (labels derive from each section's `title`/`heading`):

```json
{
  "quickJump": [0, 22, 29],
  "en": { "title": "...", "sections": [...] }
}
```

Edit visually: `npm run edit` → opens a web UI at localhost:3030

---

## Card Styling

| Card Type | CSS Class | Style |
|---|---|---|
| Regular (ZIKR, Dua) | `.card` | Plain card with rounded border |
| Master (parent in parent-child) | `.card` | Same as regular |
| Child (sub-cards) | `.card.card-accent` | 20px indent + accent left border |

---

## Deployment

### Auto-deploy
Push to `main` branch → GitHub Actions builds and deploys automatically.

### Manual deploy
```bash
npm run build
npx gh-pages -d dist
```

### SPA Routing
Each route is pre-rendered into a static HTML file at build time (`dist/{route}/index.html`) via Puppeteer. This handles direct URL access and gives social media crawlers proper meta tags. The `404.html` fallback covers any unmapped routes.

### Pre-rendering
The build script runs `node scripts/prerender.mjs` after `vite build`, which uses Puppeteer to render all 14 registered routes (canonical + alias, including custom admin pages) **plus one page per live book slug** (`/books/{slug}` expanded from `en/books/_index.json`), saving their HTML with full SEO tags baked in. It also seeds the onboarding-completed flag so the first-run tour never leaks into the prerendered HTML.

---

## Documentation

Full documentation is in the `docs/` folder:

| Document | What It Covers |
|---|---|
| [docs/architecture.md](docs/architecture.md) | System architecture, data flow, routes |
| [docs/decisions.md](docs/decisions.md) | Architectural decisions — createRoot-not-hydrate, plugin-owned manifest, no empty JSON shells |
| [docs/books.md](docs/books.md) | Books integration — Hajee Mahboob Kassim library (design, pipeline, reader) |
| [docs/components.md](docs/components.md) | Every React component explained |
| [docs/content.md](docs/content.md) | Content JSON, master-child cards, editing |
| [docs/DEVCHANGELOG.md](docs/DEVCHANGELOG.md) | Full developer changelog (user-facing + internal) |
| [docs/styling.md](docs/styling.md) | CSS variables, themes, cards, fonts |
| [docs/deployment.md](docs/deployment.md) | Building, deploying, troubleshooting |
| [docs/force-build.md](docs/force-build.md) | How to force a deploy when a push is skipped |
| [docs/pwa.md](docs/pwa.md) | PWA / offline / service worker |
| [docs/seo.md](docs/seo.md) | SEO, Open Graph, pre-rendering |
| [docs/analytics.md](docs/analytics.md) | GA4 usage tracking, what's measured, activation |
| [docs/ga4-setup.md](docs/ga4-setup.md) | GA4 console steps: conversions, own-traffic exclusion, dashboard, enhanced measurement |
| [docs/scripts.md](docs/scripts.md) | All CLI tools |
| [docs/new-developer-guide.md](docs/new-developer-guide.md) | Step-by-step for freshers |
| [docs/suggestions.md](docs/suggestions.md) | Feature ideas (shipped items marked ✅) |
| [docs/hijri-calendar-plan.md](docs/hijri-calendar-plan.md) | Hijri calendar (v1: admin-maintained month starts) |
| [docs/index.md](docs/index.md) | Master documentation index |

---

## License

KQCMM — Khanqahe Qadriyah Chishtiya Musharrafiya Mahboobiya
