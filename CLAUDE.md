# KQCMM — Khanqahe Qadriyah Chishtiya Musharrafiya Mahboobiya

A spiritual web platform for followers of the Chishti Sufi order. Displays duas, khatm, fateha, kalam, sijrah nama, and other devotional content in **English** and **Hinglish** (Urdu planned).

> **📱 PWA/Offline:** Fully cached for offline use via Service Worker.  
> **🔍 SEO:** Pre-rendered static HTML per route with Open Graph + Twitter Card tags.
>
> **Current version: v5.10.1** — see [`/changelog`](/kqcmm-web/changelog) for full history.

---

## 🏗 Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (SPA)                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │              Layout Shell (Layout.jsx)             │   │
│  │  ┌──────────┐  ┌──────────────┐  ┌────────────┐  │   │
│  │  │  Header   │  │ Main Content │  │ Bottom Nav  │  │   │
│  │  │ (hamburger│  │  (Outlet)    │  │ (5 tabs)    │  │   │
│  │  │  + gear)  │  │              │  │             │  │   │
│  │  └──────────┘  └──────────────┘  └────────────┘  │   │
│  │                                                    │   │
│  │  ┌──────────────────────────────────────────────┐  │   │
│  │  │        SideDrawer (slide-in menu)             │  │   │
│  │  └──────────────────────────────────────────────┘  │   │
│  │  ┌──────────────────────────────────────────────┐  │   │
│  │  │       SettingsPopup (modal)                   │  │   │
│  │  └──────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  ┌───────────────┐  ┌───────────────┐  ┌─────────────┐  │
│  │ ThemeProvider  │  │ LanguageProv  │  │ FontProvider │  │
│  ├───────────────┤  ├───────────────┤  ├─────────────┤  │
│  │ ViewProvider   │  │  (contexts)   │  │             │  │
│  └───────────────┘  └───────────────┘  └─────────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │   ContentView (handles slide/list mode + counter)   │ │
│  │   ┌──────────────┐  ┌──────────────┐                │ │
│  │   │ List Mode    │  │ Slide Mode   │                │ │
│  │   │ (cards stack)│  │ (one at time)│                │ │
│  │   └──────────────┘  └──────────────┘                │ │
│  │   ┌──────────────────────────────────────────┐      │ │
│  │   │ Counter: −  0  +  ↺                       │      │ │
│  │   │ Slide nav: ⏮ ◀ 1/30 ▶ ⏭                  │      │ │
│  │   └──────────────────────────────────────────┘      │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │   SplashScreen (3s countdown, tap to skip)          │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
kqcmm-web/
├── index.html                          # Entry point
├── vite.config.js                      # Vite build config
├── package.json                        # Dependencies & scripts
├── CLAUDE.md                           # This file
│
├── public/                             # Static assets (copied to dist/)
│   ├── logo.png                        # Home page logo
│   ├── splash.jpg                      # Splash screen image
│   ├── drawer-bg.jpg                   # Side drawer background
│   ├── manifest.json                   # PWA manifest
│
├── src/
│   ├── main.jsx                        # React entry + BrowserRouter
│   ├── App.jsx                         # Routes + context providers
│   ├── styles.css                      # All CSS (themes, layout, cards)
│   │
│   ├── components/
│   │   ├── Layout.jsx                  # App shell (header + content + nav)
│   │   ├── BottomNav.jsx              # 5-tab navigation bar
│   │   ├── SideDrawer.jsx             # Slide-in navigation drawer
│   │   ├── ContentView.jsx            # List/slide view + counter
│   │   ├── QuickJump.jsx             # Floating quick-jump bottom sheet (shared, language-independent)
│   │   ├── HijriStrip.jsx            # App-wide thin strip below header (today Hijri + Gregorian + event-today)
│   │   ├── Calendar.jsx              # Hijri calendar (navigable month grid, Hijri/Gregorian toggle)
│   │   ├── SplashScreen.jsx           # Splash with countdown
│   │   ├── SettingsPopup.jsx          # Settings modal
│   │   ├── FontAwesome.jsx           # Icon component (centralized)
│   │   ├── PwaSupport.jsx            # Offline/update toasts
│   │   └── SeoHead.jsx              # Per-page meta tags (Helmet)
│   │
│   ├── pages/
│   │   ├── Home.jsx                   # Home with logo + quick links
│   │   ├── GenericContentPage.jsx     # Custom page renderer (registry renderer: generic)
│   │   ├── Dua.jsx                    # Duas (supplications)
│   │   ├── Hmk.jsx                    # Hajee Mahboob Kassim bio
│   │   ├── SijrahNama.jsx            # Sijrah Nama verses
│   │   ├── FatehaKhwani.jsx          # Fateha Khwani (with master-child cards)
│   │   ├── Khatm.jsx                 # Khatm-e-Khwajagan (32 steps)
│   │   ├── SalimPappa.jsx            # Salim Pappa page
│   │   ├── About.jsx                 # About KQCMM
│   │   ├── Calendar.jsx              # Hijri calendar page (month grid + events)
│   │   ├── Roshni.jsx                # Chirag Raushan / Roshni
│   │   ├── Abbajaan.jsx              # Abbajaan page
│   │   ├── Changelog.jsx            # Version history
│   │   └── NotFound.jsx              # 404 page
│   │
│   ├── utils/
│   │   └── hijriCalendar.js         # Hijri date conversion + event mapping (pure, tested)
│   ├── context/
│   │   ├── ThemeContext.jsx          # Theme state (light/dark/sepia/green)
│   │   ├── LanguageContext.jsx       # Language state (en/hinglish/urdu)
│   │   ├── FontContext.jsx           # Font family + size state
│   │   └── ViewContext.jsx           # View mode (list/slide) state
│   │
│   ├── config/
│   │   ├── navigation.json           # Bottom nav + drawer order/icons (entries carry pageId)
│   │   ├── pageRoutes.json           # Page-route registry (stable id, route, contentFile, aliases)
│   │   ├── pageRoutes.js             # Registry helpers (pageById, routeForPage)
│   │   ├── splash.json               # Splash screen config
│   │   ├── view.json                 # Default view mode (global default; per-page map supported but unused)
│   │   ├── strings/                  # UI labels (per live language)
│   │   │   ├── index.js              # String loader
│   │   │   ├── en.json
│   │   │   └── hinglish.json
│   │   └── content/                  # Page content (per page, en + hinglish; urdu planned)
│   │       ├── index.js              # Eager glob content loader (getContent)
│   │       ├── locale.js             # Pure locale resolver (requested→en→first)
│   │       ├── dua.json
│   │       ├── hmk.json
│   │       ├── sijrahNama.json
│   │       ├── fatehaKhwani.json
│   │       ├── khatm.json
│   │       ├── salimPappa.json
│   │       ├── about.json
│   │       ├── calendar.json               # Hijri calendar (schema v1: monthStarts + shared events)
│   │       ├── roshni.json
│   │       ├── abbajaan.json
│   │       └── changelog.json               # Version history (2 live languages)
│   │
│   └── scripts/                       # CLI tools (see below)
│
├── scripts/
│   ├── content-editor.mjs            # Local web editor (npm run edit)
│   ├── page-rename.mjs               # Shared page-rename logic + CLI (validateSlug/buildRename/applyRename)
│   ├── prerender.mjs                 # Puppeteer prerender for SEO
│   ├── fetch-content.mjs             # Fetches from Firebase Hosting
│   ├── sync-other-langs.mjs          # Syncs hinglish/urdu from XML
│   ├── translate-content.mjs         # Translation helper
│   ├── import-to-firebase.mjs        # Firebase Admin import template
│   ├── json-to-js.mjs                # JSON→JS converter
│   ├── generate-calendar-events.mjs  # Imports Blessed Days dataset into calendar.json (npm run calendar:gen)
│   ├── data/events_merged.json       # Recovered 2,350-record source (filesystem-only, never bundled)
│   ├── test-hijri-calendar.mjs       # Hijri calendar unit tests
│   ├── test-page-rename.mjs          # Page-rename unit tests
│   └── admin/                        # React-based admin panel (npm run edit)
│       ├── package.json
│       ├── vite.config.js
│       ├── index.html
│       └── src/
│           ├── main.jsx
│           ├── App.jsx               # Main layout, Page CRUD + rename, dialogs
│           ├── hooks/
│           │   └── useApi.js
│           └── components/
│               ├── ContentEditor.jsx  # Type-aware fields + live preview + shared Quick Jump editor
│               ├── NavEditor.jsx      # Nav reorder + icon picker
│               ├── StringsEditor.jsx  # UI labels editor
│               ├── LanguageEditor.jsx # Translation status + CRUD
│               ├── CalendarEditor.jsx # Hijri calendar (month starts + shared events)
│               ├── SettingsEditor.jsx # View mode config
│               └── ui/
│                   └── Modal.jsx      # Reusable modal dialog
│
└── .github/workflows/
    └── deploy.yml                    # GitHub Pages auto-deploy
```

---

## 🧩 Content Architecture

### Content JSON Structure

Each content file has the same shape across the live languages (en, hinglish — urdu planned).
`quickJump` is a **top-level**, language-independent list of selection indices (labels are
derived from each section's `title`/`heading` at render time — see
[`QuickJump.jsx`](/kqcmm-web/src/components/QuickJump.jsx)):

```json
{
  "quickJump": [0, 22, 29],
  "en": { "title": "...", "sections": [...] },
  "hinglish": { "title": "...", "sections": [...] },
  "urdu": { "title": "...", "sections": [...] }
}
```

### Card Types (in FatehaKhwani)

```
┌──────────────────────────────┐
│   START (master card)        │  ← .card (plain)
├──────────────────────────────┤
│                              │
│ ┌────────────────────────┐   │
│ │ Bismillah (child)      │   │  ← .card.card-accent (indented)
│ └────────────────────────┘   │
│ ┌────────────────────────┐   │
│ │ Surah Al-Ahzab 33:56  │   │
│ └────────────────────────┘   │
│ ┌────────────────────────┐   │
│ │ Darood Sharif          │   │
│ └────────────────────────┘   │
└──────────────────────────────┘
```

| Card Type | CSS Class | Style |
|---|---|---|
| **Regular** (ZIKR, Dua, Khatm) | `.card` | Plain, no indent |
| **Master** (START, Salaamun) | `.card` | Plain, no indent |
| **Child** (sub-cards) | `.card.card-accent` | 20px indent, accent left border |

### Continuous Numbering

Verses within a master card (sub-cards) use **continuous sequential numbering** across ALL sub-cards, not restarting per sub-card:

```
In the Name of Allah, the Most Compassionate, the Ever-Merciful
─── Sub-card 1 ───
(Surah Al-Ahzab 33:56)
1. Indeed, Allah and (all) His angels send blessings on the Prophet...
─── Sub-card 2 ───  
(Darood Sharif)
(empty — no number)
─── Sub-card 3 ───
(Surah An-Nahl 16:98)
2. So when you recite the Qur'an, seek refuge in Allah...
```

Numbering skips empty sub-cards (Bismillah, Darood, Awraade Wazaaif).

---

## 🌐 Languages

| Code | Direction | Labels | Status |
|---|---|---|---|
| `en` | LTR | English | ✅ live |
| `hinglish` | LTR | Romanized Hindi/Urdu | ✅ live |
| `urdu` | RTL | Urdu script | ⏳ planned — plumbing ready (RTL, fonts, `data[lang] \|\| data.en` fallback), no content shipped yet |

Language switch triggers re-render of all text via context. RTL direction sets `document.documentElement.dir`.

---

## 🎨 Themes

| ID | Header | Accent |
|---|---|---|
| `light` | White `#fdfdfd` | Blue `#4a6cf7` |
| `dark` | Dark navy `#1a1a2e` | Purple `#7c5cfc` |
| `sepia` | Brown `#5c3a1e` | Gold `#b8860b` |
| `green` | Dark green `#1b5e20` | Green `#2e7d32` |
| `rose` | Deep rose `#9d2b4a` | Pink `#c2185b` |

Default: `green`. Theme set via `data-theme` attribute on `<html>`.

---

## 🔤 Fonts

17 font families including: System, Serif, Sans, Monospace, Bookman, Garamond, Palatino, Georgia, Tahoma, Trebuchet, Verdana, Times New Roman, Courier New, Lucida Console, Urdu Nastaliq, Urdu Naskh, Mehr Nastaliq.

6 sizes: X-Small (12px), Small (14px), Medium (16px), Large (18px), X-Large (21px), XX-Large (24px).

Font size is applied via inline `fontSize` on `<main>` element. Content children use `em` units.

---

## 📱 Navigation

### Bottom Nav (configurable)
Order and icons defined in `src/config/navigation.json`:
```json
"bottomNav": [
  { "to": "/", "icon": "faHouse", "key": "home" },
  { "to": "/khatm", "icon": "faStar", "key": "khatmEKhwajagan" },
  ...
]
```

### Side Drawer
Same config file, `sideDrawer` array. Icons via FontAwesome (solid).

---

## 📖 View Modes

| Mode | Behavior |
|---|---|
| **List** | All items stacked as cards |
| **Slide** | One card at a time with navigation (⏮ ◀ 1/30 ▶ ⏭) |

Global default in `src/config/view.json` (currently `slide`). Global override in Settings.

### Counter Bar
Global +/−/↺ counter displayed on content pages. In slide mode it sits in a fixed bar with the slide nav. In list mode it appears at the bottom.

---

## 🗺 Route Map

Routes are **registry-driven** from `src/config/pageRoutes.json` (canonical `route`,
stable `id`, content-file basename, localized `titleKey`, `renamable`, and legacy
`aliases`). `src/App.jsx` renders a component per registered page and adds a
`<Navigate>` redirect for each alias. Page components load content via the eager
glob loader in `src/config/content/index.js` — **not** direct JSON imports — so a
page can be renamed by editing the registry + moving the file without touching
source code.

```
/               → Home              (id: home, not renamable)
/dua            → Duas             (id: dua)
/hmk            → Hajee Mahboob Kassim bio (id: hmk)
/sijrah-nama    → Sijrah Nama      (id: sijrahNama)
/fateha-khwani  → Fateha Khwani (32 sections) (id: fatehaKhwani)
/khatm          → Khatm-e-Khwajagan (32 steps) (id: khatm)
/salim-pappa    → Salim Pappa      (id: salimPappa)
/about          → About KQCMM      (id: about)
/calendar       → Islamic Calendar (id: calendar, not renamable)
/roshni         → Roshni / Chirag Raushan (id: roshni)
/abbajaan       → Abbajaan         (id: abbajaan)
/changelog      → Version history  (id: changelog)
```

**Renaming a page:** use the admin Pages tab → ✏️ Rename (only for renamable
fixed/custom pages), or `node scripts/page-rename.mjs <pageId> <newSlug>`. This
moves the content JSON file, updates the registry route, and keeps the old route
as a redirect alias so old links keep working.

**Custom pages:** pages created/duplicated in the Admin Panel are registered in
`pageRoutes.json` as `{ custom: true, renderer: 'generic' }` with a stable
`custom-…` id. They are rendered at `/slug` by `src/pages/GenericContentPage.jsx`
via the generic renderer (`src/components/GenericContentRenderer.jsx`), which
supports `sections`/`duas`/`items`/`verses`/`lineage`/`paragraphs`, Fateha-style
`|||`+`::` master-child blocks, and renders unknown fields as safe plain text
(never raw HTML). Custom pages are fully renameable (create/duplicate/delete/
rename are transactional). Navigation references a page by stable `pageId`.

> ⚠️ **Build-time content:** Admin CRUD edits source JSON + the registry only.
> A new/renamed/deleted custom page reaches the public site after `npm run build`
> + deploy (content is included via Vite's eager glob).

---

## 💾 Admin Panel / Content Editor

Run locally:
```bash
npm run edit
# Opens http://localhost:3030
```

Two interfaces served at the same port:

### 1. Admin Panel (Recommended) — `/admin/`
A full React-based SPA built in `scripts/admin/`. Built automatically before the server starts.

**Tabs:**
- **📄 Pages** — type-aware content editor with live preview, add/delete/reorder items, global search
- **🧭 Nav** — reorder bottom nav & side drawer items, pick icons from a visual selector
- **🏷️ Strings** — edit all UI labels per language
- **🌍 Translate** — translation status table (% filled per page per language), click % to jump to edit, add/remove languages
- **⚙️ Settings** — default view mode per page

**Page CRUD:** Create new pages from templates (plain, duas layout, fateha layout), duplicate, rename, or delete pages.

### 2. Legacy Editor — `/`
The original single-page editor. Simpler but still functional.

### Admin Panel Architecture
```
scripts/admin/
├── package.json, vite.config.js, index.html
└── src/
    ├── main.jsx, App.jsx, hooks/useApi.js
    └── components/
        ├── ContentEditor.jsx  # Type-aware fields + live preview
        ├── NavEditor.jsx      # Nav reorder + icon picker
        ├── StringsEditor.jsx  # UI labels editor
        ├── LanguageEditor.jsx # Translation status + CRUD + compare
        ├── SettingsEditor.jsx # View mode config
        └── ui/Modal.jsx       # Reusable modal dialog
```

---

## 🚀 Deployment

### Local Dev
```bash
npm run dev     # Vite dev server, hot reload
npm run build   # Production build to dist/
npm run preview # Preview production build
```

### GitHub Pages (auto-deploy)
Push to `main` → GitHub Actions builds and deploys to:
```
https://mehboob-dev.github.io/kqcmm-web/
```

The workflow:
1. Runs `npm ci` + `npm run build`
2. Copies `index.html` → `404.html` (SPA routing hack)
3. Uploads `dist/` to GitHub Pages

### SPA Routing
GitHub Pages serves `404.html` for any unmatched path (like `/khatm`). This is a copy of `index.html` — React Router then handles the route client-side.

Router basename: `/kqcmm-web/` (set in `vite.config.js` + `main.jsx`).

---

## 📝 Changelog

There are **two** changelogs — keep them both in sync when work lands:

1. **Public** (`src/config/content/changelog.json`, shown on `/changelog`) — **user-facing changes only**, in each live language (en, hinglish). Do not list internal/refactor/docs/build/tooling items here.
2. **Dev** (`docs/DEVCHANGELOG.md`) — the complete record. Curated per-version blocks split into **User-facing** and **Internal / docs**; holds EVERYTHING including items skipped from the public changelog.

When making changes:

1. Add a new entry at the top of `changelog.json`'s `versions` array AND a matching block at the top of `docs/DEVCHANGELOG.md`
2. Public entries are user-facing only; dev entries hold everything
3. Update `package.json` version to match
4. Update the Version card in `src/pages/About.jsx`
5. Run `npm run build` afterwards to re-prerender

**Skip the version bump** if the change is invisible to end users (refactor, docs-only, internal restructure) — but still record it in `docs/DEVCHANGELOG.md`.

---

## 🛠 Admin Panel Maintenance

The admin panel lives in `scripts/admin/`. When modifying it:

1. **Edit source** in `scripts/admin/src/` (React + Vite)
2. **Rebuild** before committing: `cd scripts/admin && npm run build`
3. The built output goes to `scripts/admin/dist/` — the content editor server (`npm run edit`) auto-rebuilds before starting
4. If adding a new component, update `docs/scripts.md` (Admin Panel Architecture tree)
5. If adding new API endpoints, update `scripts/content-editor.mjs` and list them in `docs/scripts.md` (API Endpoints table)

### API Layer
The editor server at `scripts/content-editor.mjs` serves both the Admin Panel and Legacy Editor. New API endpoints go in the same file, in the `http.createServer` callback, following the existing routing pattern.

---

## 📦 Dependencies

| Package | Purpose |
|---|---|
| `react` + `react-dom` | UI framework |
| `react-router-dom` | Client-side routing |
| `@fortawesome/react-fontawesome` | Icons (solid) |
| `vite` | Build tool |

---

## 🧪 Scripts Reference

| Script | Command | Purpose |
|---|---|---|
| `content-editor.mjs` | `npm run edit` | Local web content editor |
| `generate-calendar-events.mjs` | `npm run calendar:gen` | Import Blessed Days dataset into `calendar.json` (idempotent) |
| `sync-other-langs.mjs` | `node scripts/sync-other-langs.mjs` | Sync hinglish/urdu from Quran XML |
| `fetch-content.mjs` | `npm run fetch-content` | Pull from Firebase Hosting |
| `translate-content.mjs` | `node scripts/translate-content.mjs` | Translate content to languages |

---

## 📊 Content Sources

| Source | Location | Usage |
|---|---|---|
| Quran XML (English) | `D:/Work/KQCMM/QuranSharif-IrfanUlQuran/iq_en.xml` | English translation (Dr. Tahir-ul-Qadri) |
| Quran XML (Transliteration) | `D:/Work/KQCMM/QuranSharif-IrfanUlQuran/en_simple_transliteration1.xml` | Hinglish transliteration |
| Quran XML (Urdu) | `D:/Work/KQCMM/QuranSharif-IrfanUlQuran/iq_ur.xml` | Urdu translation |
| JSON (processed) | — | All processed into per-page content JSONs |
| Content JSONs | `src/config/content/*.json` | Page-specific content |

---

## 📐 Styling Conventions

- **CSS variables** for theming in `styles.css`
- **`.card`** — plain card (regular + master)
- **`.card-accent`** — indented card with accent left border (child)
- **`.card-title`** — muted, `0.85em`, with bottom divider
- **`.card-text`** — default text with `line-height: 1.7`
- Breakpoints: `768px` (tablet), `1400px` (desktop max 1200px)
- Font size cascade: `<main>` sets base via inline style, children use `em`

---

## 📚 Full Documentation

Comprehensive docs are in the `docs/` folder:

| Document | For |
|---|---|
| [docs/architecture.md](docs/architecture.md) | System architecture, data flow, route map |
| [docs/components.md](docs/components.md) | Every React component explained |
| [docs/content.md](docs/content.md) | Content JSON structure, master-child cards |
| [docs/styling.md](docs/styling.md) | CSS variables, themes, card system, fonts |
| [docs/deployment.md](docs/deployment.md) | Building, deploying, troubleshooting |
| [docs/scripts.md](docs/scripts.md) | All CLI tools and utilities |
| [docs/new-developer-guide.md](docs/new-developer-guide.md) | Step-by-step guide for freshers |
| [docs/pwa.md](docs/pwa.md) | PWA / offline / service worker |
| [docs/seo.md](docs/seo.md) | SEO, Open Graph, pre-rendering |
| [docs/suggestions.md](docs/suggestions.md) | Feature ideas (shipped items marked ✅) |

---

## 🧠 Key Architectural Decisions

1. **SPA + GitHub Pages**: Uses `404.html` hack for client-side routing
2. **No build-time CMS**: Content is local JSON, edited via standalone editor or direct file editing
3. **Triple-language**: Same JSON structure, different text per language
4. **Context over Redux**: Simple app, React Context is sufficient
5. **CSS variables over CSS-in-JS**: Single stylesheet, theme vars change everywhere
6. **Fixed counter/slide nav**: Uses `position: fixed` with `bottom` matching the bottom nav height (set dynamically via CSS var `--bottom-nav-height`)
7. **FontAwesome only**: No emoji rendering inconsistencies across devices
