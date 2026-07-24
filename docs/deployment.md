# Deployment Guide

How to build, deploy, and host the KQCMM web app.

---

## Quick Reference

| Action | Command |
|---|---|
| Local dev | `npm run dev` |
| Production build | `npm run build` |
| Preview build | `npm run preview` |
| Deploy to GitHub Pages | Push to `main` (auto) |
| Manual deploy | `npx gh-pages -d dist` |
| Content editor | `npm run edit` |

---

## Build Pipeline

The `npm run build` command runs three steps:

1. **`vite build`** — Bundles the app into `dist/`
2. **`node scripts/prerender.mjs`** — Puppeteer generates static HTML for all 12 routes with full SEO meta tags
3. **`node -e "fs.copyFileSync('dist/index.html','dist/404.html')"`** — SPA fallback for GitHub Pages (uses Node.js for cross-platform compatibility)

### Output Structure

```
dist/
├── index.html                      # Prerendered home page
├── 404.html                        # Copy of index.html for SPA routing
├── dua/index.html                  # Prerendered Dua page
├── hmk/index.html                  # Prerendered Hmk page
├── sijrah-nama/index.html          # Prerendered Sijrah Nama page
├── fateha-khwani/index.html        # Prerendered Fateha Khwani page
├── khatm/index.html                # Prerendered Khatm page
├── salim-pappa/index.html          # Prerendered Salim Pappa page
├── about/index.html                # Prerendered About page
├── calendar/index.html             # Prerendered Calendar page
├── roshni/index.html               # Prerendered Roshni page
├── abbajaan/index.html             # Prerendered Abbajaan page
├── changelog/index.html            # Prerendered Changelog page
├── assets/
│   ├── index-xxxxxxxx.js           # Bundled JS (content-hashed)
│   └── index-xxxxxxxx.css          # Bundled CSS (content-hashed)
├── og-image.png                    # Social sharing image (1200×630)
├── logo.png
├── splash.jpg
├── drawer-bg.jpg
├── manifest.json
├── manifest.webmanifest
├── sw.js                           # Service worker (auto-generated)
├── workbox-xxxxxxxx.js             # Workbox runtime
└── icons/
    ├── favicon.png
    ├── icon-192.png
    └── icon-512.png
```

---

## GitHub Pages (Current)

### How It Works
1. Push to `main` branch
2. GitHub Actions runs the workflow in `.github/workflows/deploy.yml`
3. Workflow: install Chromium → `npm ci` → `npm run build` → deploy

### SPA Routing on GitHub Pages
GitHub Pages doesn't support client-side routing natively. The fix:

1. **`404.html` trick**: After build, `dist/index.html` is copied to `dist/404.html` (via `fs.copyFileSync` for cross-platform compatibility)
2. When a user visits `/khatm` directly, GitHub Pages returns `404.html` (which is really `index.html`)
3. React Router reads the URL and routes correctly

Additionally, **pre-rendered HTML files** handle direct visits to each route — crawlers and users opening a deep link get the correct page with full CSS and JS.

### Required Config
- `vite.config.js`: `base: '/kqcmm-web/'` (absolute paths for assets)
- `src/main.jsx`: `BrowserRouter basename="/kqcmm-web/"`
- `public/` dir: Static assets (images, manifest, quran.json)

### GitHub Actions Workflow
```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: sudo apt-get update && sudo apt-get install -y chromium-browser
      - run: npm ci
        env:
          PUPPETEER_SKIP_DOWNLOAD: true
      - run: npm run build
        env:
          PUPPETEER_EXECUTABLE_PATH: /usr/bin/chromium-browser
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
      - id: deploy
        uses: actions/deploy-pages@v4
```

### Live URL
```
https://mehboob-dev.github.io/kqcmm-web/
```

### Troubleshooting
| Problem | Cause | Fix |
|---|---|---|
| White screen after deploy | Router basename mismatch | Check `vite.config.js` base and `main.jsx` basename |
| Assets 404 on sub-page | Wrong base path | Use `base: '/kqcmm-web/'` (absolute, not `./`) |
| Direct URL (/khatm) breaks | Missing 404.html or prerender | Ensure build script copies index.html to 404.html using `fs.copyFileSync` |
| Splash image missing | Path not relative | Use `import.meta.env.BASE_URL + 'splash.jpg'` |

---

## Pre-rendering

**File:** `scripts/prerender.mjs`

The prerender script launches headless Chromium, navigates all routes, and saves the rendered HTML. This ensures:
- Social media crawlers see OG tags (Open Graph, Twitter Card)
- Search engines index page titles and descriptions
- First-time users opening a deep link see correct content immediately

See [SEO & Pre-rendering](seo.md) for full details.

---

## PWA & Offline

The app uses `vite-plugin-pwa` to generate a service worker that precaches all assets. On first visit, everything is cached for offline use.

See [PWA & Offline Support](pwa.md) for full details.

---

## Alternative Hosting Options

### Firebase Hosting
You already have a Firebase project (`kqcmm-7d71b`). To deploy:

```bash
npm install -g firebase-tools
firebase init hosting
# Configure rewrites for SPA:
# "rewrites": [{ "source": "**", "destination": "/index.html" }]
npm run build
firebase deploy --only hosting
```

**Advantages:** Native SPA support (no 404.html hack), faster CDN.

### Netlify
```bash
# Build outputs to dist/
# Create netlify.toml:
# [[redirects]]
#   from = "/*"
#   to = "/index.html"
#   status = 200
npm run build
npx netlify deploy --prod --dir=dist
```

### Vercel
```bash
# Auto-detects Vite projects
# Create vercel.json:
# { "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
vercel --prod
```

---

## Build Configuration

### vite.config.js
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/kqcmm-web/',
  plugins: [
    react(),
    VitePWA({ /* ... */ }),
  ],
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
```

---

## SEO

The app uses `react-helmet-async` for dynamic meta tags and Puppeteer-based pre-rendering for static HTML output. See [SEO & Pre-rendering](seo.md) for details on:
- Per-page Open Graph and Twitter Card tags
- Pre-rendered static HTML files
- Testing with social media debuggers
- OG image generation
