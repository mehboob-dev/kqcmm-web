# KQCMM Web App

**Khanqahe Qadriyah Chishtiya Musharrafiya Mahboobiya**

A spiritual web platform for followers of the Chishti Sufi order. Displays devotional content — duas, khatm, fateha, kalam, sijrah nama, calendar events — in **English**, **Hinglish**, and **Urdu** with 4 themes, 17 fonts, and slide/list view modes.

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
| GitHub Pages | Hosting / auto-deploy |

---

## Project Structure (Key Areas)

```
src/
├── config/content/   ← All page content (10 JSON files, 3 languages each)
├── config/strings/   ← UI labels and nav text
├── components/       ← Reusable UI (Layout, ContentView, BottomNav, etc.)
├── pages/            ← One component per route
├── context/          ← Theme, Language, Font, View state
└── styles.css        ← All styles in one file (themes, cards, layout)
docs/                 ← Full documentation (7 files)
scripts/              ← CLI tools (editor, sync scripts)
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
| `/fateha-khwani` | Fateha Khwani (30+ sections) |
| `/khatm` | Khatm-e-Khwajagan (30 steps) |
| `/salim-pappa` | Salim Pappa |
| `/about` | About KQCMM |
| `/calendar` | Islamic Calendar |
| `/roshni` | Roshni / Chirag Raushan |
| `/abbajaan` | Abbajaan |

---

## Features

| Feature | Details |
|---|---|
| **3 Languages** | English, Hinglish, Urdu (RTL support) |
| **4 Themes** | Light, Dark, Sepia, Green (default: Green) |
| **17 Fonts** | System, Serif, Sans, Urdu Nastaliq, etc. |
| **4 Font Sizes** | Small (14px) to X-Large (21px) |
| **2 View Modes** | List (stack cards) / Slide (one at a time + nav) |
| **Counter** | Global +/−/↺ counter on content pages |
| **Splash Screen** | 3s countdown, tap to skip |
| **Swipeable Drawer** | Side menu with background image |
| **Settings Popup** | Language, theme, font, view mode |

---

## Content

All content is in `src/config/content/*.json`. Each file has the same structure for all 3 languages:

```json
{
  "en": { "title": "...", "sections": [...] },
  "hinglish": { "title": "...", "sections": [...] },
  "urdu": { "title": "...", "sections": [...] }
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
GitHub Pages uses `404.html` (a copy of `index.html`) to handle client-side routes like `/khatm`. React Router then picks up the URL and renders the correct page.

---

## Documentation

Full documentation is in the `docs/` folder:

| Document | What It Covers |
|---|---|
| [docs/architecture.md](docs/architecture.md) | System architecture, data flow, routes |
| [docs/components.md](docs/components.md) | Every React component explained |
| [docs/content.md](docs/content.md) | Content JSON, master-child cards, editing |
| [docs/styling.md](docs/styling.md) | CSS variables, themes, cards, fonts |
| [docs/deployment.md](docs/deployment.md) | Building, deploying, troubleshooting |
| [docs/scripts.md](docs/scripts.md) | All CLI tools |
| [docs/new-developer-guide.md](docs/new-developer-guide.md) | Step-by-step for freshers |

---

## License

KQCMM — Khanqahe Qadriyah Chishtiya Musharrafiya Mahboobiya
