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

## GitHub Pages (Current)

### How It Works
1. Push to `main` branch
2. GitHub Actions runs the workflow in `.github/workflows/deploy.yml`
3. Workflow: `npm ci` → `npm run build` → copy `404.html` → deploy

### SPA Routing on GitHub Pages
GitHub Pages doesn't support client-side routing natively. The fix:

1. **`404.html` trick**: After build, `dist/index.html` is copied to `dist/404.html`
2. When a user visits `/khatm` directly, GitHub Pages returns `404.html` (which is really `index.html`)
3. React Router reads the URL and routes correctly

### Required Config
- `vite.config.js`: `base: './'` (relative paths for assets)
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
      - run: npm ci
      - run: npm run build
      - run: cp dist/index.html dist/404.html
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
| Assets 404 | Wrong base path | Use `base: './'` for relative paths |
| Direct URL (/khatm) fails | Missing 404.html | Add `cp dist/index.html dist/404.html` to build |
| Splash image missing | Path not relative | Use `import.meta.env.BASE_URL + 'splash.jpg'` |

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

export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
```

### dist/ Output Structure
```
dist/
├── index.html                      # Entry point
├── 404.html                        # Copy of index.html for SPA
├── assets/
│   ├── index-xxxxxxxx.js           # Bundled JS
│   └── index-xxxxxxxx.css          # Bundled CSS
├── logo.png
├── splash.jpg
├── drawer-bg.jpg
├── manifest.json
├── quran.json
└── icons/
    ├── favicon.png
    ├── icon-192.png
    └── icon-512.png
```

---

## SEO

The app is a client-side SPA (Single Page Application). For basic SEO:
- Meta tags in `index.html` (title, description, theme-color)
- PWA manifest for installable experience
- No SSR (Server-Side Rendering) — search engines may not index dynamic content

For better SEO, consider:
- Adding meta tags per page dynamically
- Using prerendering (e.g., `@prerenderer/vite-plugin`)
- Migrating to Next.js or similar SSR framework
