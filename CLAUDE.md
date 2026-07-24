# KQCMM — Khanqahe Qadriyah Chishtiya Musharrafiya Mahboobiya

A spiritual web platform for followers of the Chishti Sufi order. Displays duas, khatm, fateha, kalam, sijrah nama, and other devotional content in **English**, **Hinglish**, and **Urdu**.

> **📱 PWA/Offline:** Fully cached for offline use via Service Worker.  
> **🔍 SEO:** Pre-rendered static HTML per route with Open Graph + Twitter Card tags.
>
> **Current version: v5.3.0** — see [`/changelog`](/kqcmm-web/changelog) for full history.

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
│   └── quran.json                      # Full Quran (114 surahs, 6236 verses)
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
│   │   ├── SplashScreen.jsx           # Splash with countdown
│   │   ├── SettingsPopup.jsx          # Settings modal
│   │   ├── FontAwesome.jsx           # Icon component (centralized)
│   │   ├── PwaSupport.jsx            # Offline/update toasts
│   │   └── SeoHead.jsx              # Per-page meta tags (Helmet)
│   │
│   ├── pages/
│   │   ├── Home.jsx                   # Home with logo + quick links
│   │   ├── Dua.jsx                    # Duas (supplications)
│   │   ├── Hmk.jsx                    # Hajee Mahboob Kassim bio
│   │   ├── SijrahNama.jsx            # Sijrah Nama verses
│   │   ├── FatehaKhwani.jsx          # Fateha Khwani (with master-child cards)
│   │   ├── Khatm.jsx                 # Khatm-e-Khwajagan (30 steps)
│   │   ├── SalimPappa.jsx            # Salim Pappa page
│   │   ├── About.jsx                 # About KQCMM
│   │   ├── Calendar.jsx              # Islamic calendar events
│   │   ├── Roshni.jsx                # Chirag Raushan / Roshni
│   │   ├── Abbajaan.jsx              # Abbajaan page
│   │   ├── Changelog.jsx            # Version history
│   │   └── NotFound.jsx              # 404 page
│   │
│   ├── context/
│   │   ├── ThemeContext.jsx          # Theme state (light/dark/sepia/green)
│   │   ├── LanguageContext.jsx       # Language state (en/hinglish/urdu)
│   │   ├── FontContext.jsx           # Font family + size state
│   │   └── ViewContext.jsx           # View mode (list/slide) state
│   │
│   ├── config/
│   │   ├── navigation.json           # Bottom nav + drawer order/icons
│   │   ├── splash.json               # Splash screen config
│   │   ├── view.json                 # Default view mode per page
│   │   ├── strings/                  # UI labels (per language)
│   │   │   ├── index.js              # String loader
│   │   │   ├── en.json
│   │   │   ├── hinglish.json
│   │   │   └── urdu.json
│   │   └── content/                  # Page content (per page, triple language)
│   │       ├── dua.json
│   │       ├── hmk.json
│   │       ├── sijrahNama.json
│   │       ├── fatehaKhwani.json
│   │       ├── khatm.json
│   │       ├── salimPappa.json
│   │       ├── about.json
│   │       ├── calendar.json
│   │       ├── roshni.json
│   │       ├── abbajaan.json
│   │       └── changelog.json               # Version history (3 languages)
│   │
│   └── scripts/                       # CLI tools (see below)
│
├── scripts/
│   ├── content-editor.mjs            # Local web editor (npm run edit)
│   ├── prerender.mjs                 # Puppeteer prerender for SEO
│   ├── fetch-content.mjs             # Fetches from Firebase Hosting
│   ├── sync-other-langs.mjs          # Syncs hinglish/urdu from XML
│   ├── sync-quran.mjs                # Maps Quran into content JSONs
│   ├── translate-content.mjs         # Translation helper
│   ├── import-to-firebase.mjs        # Firebase Admin import template
│   └── json-to-js.mjs                # JSON→JS converter
│
└── .github/workflows/
    └── deploy.yml                    # GitHub Pages auto-deploy
```

---

## 🧩 Content Architecture

### Content JSON Structure

Each content file has the same shape across all 3 languages:

```json
{
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

| Code | Direction | Labels |
|---|---|---|
| `en` | LTR | English |
| `hinglish` | LTR | Romanized Hindi/Urdu |
| `urdu` | RTL | Urdu script |

Language switch triggers re-render of all text via context. RTL direction sets `document.documentElement.dir`.

---

## 🎨 Themes

| ID | Header | Accent |
|---|---|---|
| `light` | White `#fdfdfd` | Blue `#4a6cf7` |
| `dark` | Dark navy `#1a1a2e` | Purple `#7c5cfc` |
| `sepia` | Brown `#5c3a1e` | Gold `#b8860b` |
| `green` | Dark green `#1b5e20` | Green `#2e7d32` |

Default: `green`. Theme set via `data-theme` attribute on `<html>`.

---

## 🔤 Fonts

17 font families including: System, Serif, Sans, Monospace, Bookman, Garamond, Palatino, Georgia, Tahoma, Trebuchet, Verdana, Times New Roman, Courier New, Lucida Console, Urdu Nastaliq, Urdu Naskh, Mehr Nastaliq.

4 sizes: Small (14px), Medium (16px), Large (18px), X-Large (21px).

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

Default per page in `src/config/view.json`. Global override in Settings.

### Counter Bar
Global +/−/↺ counter displayed on content pages. In slide mode it sits in a fixed bar with the slide nav. In list mode it appears at the bottom.

---

## 🗺 Route Map

```
/               → Home
/dua            → Duas
/hmk            → Hajee Mahboob Kassim bio
/sijrah-nama    → Sijrah Nama
/fateha-khwani  → Fateha Khwani (30+ sections)
/khatm          → Khatm-e-Khwajagan (30 steps)
/salim-pappa    → Salim Pappa
/about          → About KQCMM
/calendar       → Islamic Calendar
/roshni         → Roshni / Chirag Raushan
/abbajaan       → Abbajaan
/changelog      → Version history
```

---

## 💾 Content Editor

Run locally:
```bash
npm run edit
# Opens http://localhost:3030
```

A standalone web app that lets you edit content JSONs with real line breaks (no `\n` needed). Supports:
- Page selection sidebar
- Language tabs (en/hinglish/urdu)
- Auto-resizing text areas
- Add/delete/reorder array items
- Save writes back to `src/config/content/*.json`

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

Version history is in `src/config/content/changelog.json` (3 languages). When making significant changes:

1. Add a new entry at the top of the `versions` array with the next version number
2. List changes as bullet points in the user's language
3. Update `package.json` version to match
4. Update the Version card in `src/pages/About.jsx`
5. Run `npm run build` afterwards to re-prerender

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
| `sync-other-langs.mjs` | `node scripts/sync-other-langs.mjs` | Sync hinglish/urdu from Quran XML |
| `sync-quran.mjs` | `node scripts/sync-quran.mjs` | Map Quran verses into content |
| `fetch-content.mjs` | `npm run fetch-content` | Pull from Firebase Hosting |
| `translate-content.mjs` | `node scripts/translate-content.mjs` | Translate content to languages |

---

## 📊 Content Sources

| Source | Location | Usage |
|---|---|---|
| Quran XML (English) | `D:/Work/KQCMM/QuranSharif-IrfanUlQuran/iq_en.xml` | English translation (Dr. Tahir-ul-Qadri) |
| Quran XML (Transliteration) | `D:/Work/KQCMM/QuranSharif-IrfanUlQuran/en_simple_transliteration1.xml` | Hinglish transliteration |
| Quran XML (Urdu) | `D:/Work/KQCMM/QuranSharif-IrfanUlQuran/iq_ur.xml` | Urdu translation |
| JSON (processed) | `public/quran.json` | All 114 surahs, 6236 verses |
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
| [docs/suggestions.md](docs/suggestions.md) | 27 documented feature ideas |

---

## 🧠 Key Architectural Decisions

1. **SPA + GitHub Pages**: Uses `404.html` hack for client-side routing
2. **No build-time CMS**: Content is local JSON, edited via standalone editor or direct file editing
3. **Triple-language**: Same JSON structure, different text per language
4. **Context over Redux**: Simple app, React Context is sufficient
5. **CSS variables over CSS-in-JS**: Single stylesheet, theme vars change everywhere
6. **Fixed counter/slide nav**: Uses `position: fixed` with `bottom` matching the bottom nav height (set dynamically via CSS var `--bottom-nav-height`)
7. **FontAwesome only**: No emoji rendering inconsistencies across devices
