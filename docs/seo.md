# SEO & Pre-rendering

How the KQCMM web app handles search engine optimization, social media previews, and static pre-rendering.

---

## Overview

KQCMM is a client-side SPA (React). By default, social media crawlers (Facebook, Twitter, WhatsApp, Telegram) and search engine bots **don't execute JavaScript** — they only read raw HTML. To solve this, the app uses:

1. **`react-helmet-async`** — Sets unique `<title>`, `<meta>` tags per page at runtime
2. **Pre-rendering** — Puppeteer generates static HTML files for each route at build time, with all meta tags baked in

### Architecture

```
Build time (npm run build):
┌──────────┐    ┌───────────┐    ┌─────────────────────┐
│ Vite     │ →  │ Prerender │ →  │ dist/               │
│ build    │    │ script    │    │ ├── index.html      │ ← prerendered
│ (JS/CSS) │    │ (Puppe-   │    │ ├── dua/index.html  │ ← prerendered
│          │    │  teer)    │    │ ├── khatm/index.html│ ← prerendered
└──────────┘    └───────────┘    │ └── ... (all routes) │
                                  └─────────────────────┘

Runtime (user visits):
Crawler or user → static HTML served → React hydrates client-side
```

---

## Pre-rendering Script

**File:** `scripts/prerender.mjs`

### How It Works

1. Builds the app with Vite
2. Starts a local static file server serving the `dist/` folder
3. Launches headless Chromium (Puppeteer)
4. For each route:
   - Sets `sessionStorage` (skips splash screen)
   - Navigates to the route
   - Waits for React to render and Helmet to inject meta tags
   - Captures the full HTML
   - Writes to `dist/{route}/index.html`
5. Copies `index.html` → `404.html` for SPA fallback

### Routes Prerendered

```
/kqcmm-web/       → dist/index.html
/kqcmm-web/dua    → dist/dua/index.html
/kqcmm-web/hmk    → dist/hmk/index.html
/kqcmm-web/sijrah-nama    → dist/sijrah-nama/index.html
/kqcmm-web/fateha-khwani  → dist/fateha-khwani/index.html
/kqcmm-web/khatm  → dist/khatm/index.html
/kqcmm-web/salim-pappa    → dist/salim-pappa/index.html
/kqcmm-web/about  → dist/about/index.html
/kqcmm-web/calendar       → dist/calendar/index.html
/kqcmm-web/roshni → dist/roshni/index.html
/kqcmm-web/abbajaan       → dist/abbajaan/index.html
/kqcmm-web/changelog      → dist/changelog/index.html
```

### Build Integration

In `package.json`, the build script chains:
```json
"build": "vite build && node scripts/prerender.mjs && cp dist/index.html dist/404.html"
```

### Prerender Server

The script starts a lightweight Node.js `http` server that:
- Strips the `/kqcmm-web/` basename prefix from URLs
- Serves static files from `dist/` with correct MIME types
- Falls back to `index.html` for SPA routes
- Runs on port 8090 (only accessible during build)

---

## SeoHead Component

**File:** `src/components/SeoHead.jsx`

A reusable wrapper around `react-helmet-async`'s `<Helmet>`.

### Props

| Prop | Type | Description | Example |
|---|---|---|---|
| `title` | string | Page title (prefixed with "KQCMM - ") | `"Duas"` → `"KQCMM - Duas"` |
| `description` | string | Meta description (80-160 chars) | `"Collection of..."` |
| `image` | string | OG image URL (optional) | `"https://.../og-khatm.png"` |
| `path` | string | Route path for og:url | `"/dua"` |

### Usage

```jsx
<SeoHead
  title="Duas"
  path="/dua"
  description="Collection of sacred supplications and duas from the Chishti tradition — 5 powerful prayers for blessings, health, knowledge, and spiritual growth."
/>
```

### Tags Generated

```html
<title>KQCMM - Duas</title>
<meta name="description" content="..." />
<meta property="og:type" content="website" />
<meta property="og:title" content="KQCMM - Duas" />
<meta property="og:description" content="..." />
<meta property="og:image" content="https://mehboob-dev.github.io/kqcmm-web/og-image.png" />
<meta property="og:url" content="https://mehboob-dev.github.io/kqcmm-web/dua" />
<meta property="og:site_name" content="KQCMM" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="KQCMM - Duas" />
<meta name="twitter:description" content="..." />
<meta name="twitter:image" content="https://mehboob-dev.github.io/kqcmm-web/og-image.png" />
```

---

## OG Image

**File:** `public/og-image.png`

| Property | Value |
|---|---|
| Format | PNG |
| Dimensions | 1200×630 px (standard for social sharing) |
| Content | KQCMM logo centered on dark background |
| Location | `public/og-image.png` |

### Page-specific Images

To use different images per page, pass the `image` prop:

```jsx
<SeoHead title="Khatm-e-Khwajagan" image="https://mehboob-dev.github.io/kqcmm-web/og-khatm.png" />
```

Place custom images in `public/` and rebuild.

---

## Per-Page Metadata

| Route | `<title>` | `og:title` | Description |
|---|---|---|---|
| `/` | KQCMM - Home | KQCMM - Home | Khanqahe Qadriyah Chishtiya Musharrafiya Mahboobiya — Spiritual platform |
| `/dua` | KQCMM - Duas | KQCMM - Duas | 5 powerful prayers for blessings, health, knowledge |
| `/hmk` | KQCMM - Hmk / Kalam | KQCMM - Hmk / Kalam | Biography and spiritual kalam of Hajee Mahboob Kassim |
| `/sijrah-nama` | KQCMM - Sijrah Nama | KQCMM - Sijrah Nama | Sacred verses and spiritual poetry from the Chishti tradition |
| `/fateha-khwani` | KQCMM - Fateha Khwani | KQCMM - Fateha Khwani | Traditional gathering for Qur'an recitation and du'a |
| `/khatm` | KQCMM - Khatm-e-Khwajagan | KQCMM - Khatm-e-Khwajagan | 30-step spiritual dhikr with Quranic recitations |
| `/salim-pappa` | KQCMM - Salim Pappa | KQCMM - Salim Pappa | Teachings and spiritual guidance from Salim Pappa |
| `/about` | KQCMM - About | KQCMM - About | Mission, activities, and contact information |
| `/calendar` | KQCMM - Islamic Calendar | KQCMM - Islamic Calendar | Upcoming Islamic events and spiritual observances |
| `/roshni` | KQCMM - Roshni | KQCMM - Roshni | Chirag Raushan / Roshni — spiritual illumination |
| `/abbajaan` | KQCMM - Abbajaan | KQCMM - Abbajaan | Life, teachings, and memories |
| `/changelog` | KQCMM - Changelog | KQCMM - Changelog | Version history and release notes |
| `*` (404) | KQCMM - Page Not Found | KQCMM - Page Not Found | The requested page could not be found |

---

## Testing

### Local Verification

```bash
npm run build       # Builds + prerenders
npm run preview     # Serves dist/ at localhost:4173
```

Check in DevTools → Elements → `<head>`:
```
<title>KQCMM - Home</title>
<meta property="og:title" content="KQCMM - Home" />
<meta property="og:image" content="https://..." />
```

### Social Media Debuggers

| Platform | Tool |
|---|---|
| Facebook / WhatsApp | [OG Debugger](https://developers.facebook.com/tools/debug/) |
| Twitter / X | [Card Validator](https://cards-dev.twitter.com/validator) |
| LinkedIn | [Post Inspector](https://www.linkedin.com/post-inspector/) |
| General | [opengraph.xyz](https://www.opengraph.xyz/) |

### Note on Caching

Social media crawlers cache results aggressively. After updating OG tags:
1. Run `npm run build` and deploy
2. Paste the URL into the debugger tool above
3. Click "Scrape Again" / "Refresh" to force re-fetch

---

## Troubleshooting

| Problem | Cause | Fix |
|---|---|---|
| OG tags show localhost URL | Pre-render captured wrong URL | Check `SeoHead.jsx` — `liveUrl` should use `path` prop |
| Image not showing in preview | `og:image` missing or wrong URL | Check `public/og-image.png` exists, rebuild |
| Title shows "KQCMM" only | Pre-render failed for that route | Run build locally, check prerender output |
| Crawler sees blank page | No prerendered HTML for that route | Add route to prerender script, rebuild |
| WhatsApp shows old preview | Cached by WhatsApp | Use OG debugger → "Scrape Again" |
