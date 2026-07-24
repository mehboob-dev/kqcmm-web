# KQCMM Memory Index

## Project Overview
**KQCMM** — Khanqahe Qadriyah Chishtiya Musharrafiya Mahboobiya  
A spiritual web platform for followers of the Chishti Sufi order.  
Built with React 18 + Vite 5. Hosted on GitHub Pages.  
3 languages: English, Hinglish, Urdu | 4 themes: Light, Dark, Sepia, Green

## Documentation Index

| Topic | File |
|---|---|
| **Full architecture** | [CLAUDE.md](CLAUDE.md) |
| **System architecture, data flow, routes** | [docs/architecture.md](docs/architecture.md) |
| **Component reference** (all components explained) | [docs/components.md](docs/components.md) |
| **Content system** (JSON structure, master-child cards, editing) | [docs/content.md](docs/content.md) |
| **Styling guide** (CSS variables, themes, cards, fonts) | [docs/styling.md](docs/styling.md) |
| **Deployment** (GitHub Pages, hosting, troubleshooting) | [docs/deployment.md](docs/deployment.md) |
| **PWA & Offline** (service worker, caching, install) | [docs/pwa.md](docs/pwa.md) |
| **SEO & Pre-rendering** (meta tags, OG, Puppeteer) | [docs/seo.md](docs/seo.md) |
| **Scripts reference** (all CLI tools) | [docs/scripts.md](docs/scripts.md) |
| **Future suggestions** (feature ideas) | [docs/suggestions.md](docs/suggestions.md) |
| **New developer guide** (step-by-step for freshers) | [docs/new-developer-guide.md](docs/new-developer-guide.md) |
| **Quick start** (setup & commands) | [README.md](README.md) |
| **All docs index** | [docs/index.md](docs/index.md) |
| **Future suggestions** (27 feature ideas) | [docs/suggestions.md](docs/suggestions.md) |

## Quick Commands

```bash
npm run dev         # Start dev server (localhost:5173)
npm run build       # Production build
npm run edit        # Content editor (localhost:3030)
npm run preview     # Preview production build
```

## Key Directories

| Path | Purpose |
|---|---|
| `src/config/content/` | All page content (11 JSON files, 10 editable + changelog) |
| `src/config/strings/` | UI labels and navigation text |
| `src/components/` | Reusable UI components |
| `src/pages/` | One component per route |
| `src/context/` | React context providers |
| `public/` | Static assets (images, quran.json) |
| `scripts/` | CLI tools for content management |

## Key Architecture Decisions

1. **SPA + GitHub Pages** — 404.html hack for client-side routing
2. **Local JSON content** — No database, all content in `src/config/content/*.json`
3. **CSS variables** — Single stylesheet, theme vars change everywhere
4. **Context over Redux** — Simple enough app for React Context
5. **FontAwesome icons** — Consistent rendering across all devices
6. **Card system** — `.card` (plain) for master/regular, `.card-accent` (indented) for children
