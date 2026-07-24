# PWA & Offline Support

How the KQCMM web app works as a Progressive Web App, including offline caching, service worker, and the installable app experience.

---

## Overview

KQCMM uses `vite-plugin-pwa` (powered by Workbox) to generate a service worker that precaches all static assets. On first visit, the app downloads everything needed and stores it in the browser's Cache API. On subsequent visits (even offline), the app loads instantly from cache.

### Features

| Feature | Status |
|---|---|
| **Offline content** | ✅ All pages (Dua, Khatm, Fateha, etc.) work offline |
| **Offline navigation** | ✅ All routes work (React Router runs client-side) |
| **Offline settings** | ✅ Theme, language, font changes persist via localStorage |
| **Auto-update** | ✅ New SW activates silently on deploy — brief "Updated" toast shown |
| **Install prompt** | ✅ Browser fires "Add to Home Screen" automatically |
| **Cache size** | ~2 MB (15 entries, no quran.json) |
| **Splash screen** | ✅ Skips on repeat visits (sessionStorage) |

---

## Configuration

### vite.config.js

The `VitePWA` plugin is configured in `vite.config.js`:

```javascript
VitePWA({
  registerType: 'autoUpdate',       // Auto-update on deploy — no user prompt
  manifest: {
    name: 'KQCMM — Khanqahe Qadriyah ...',
    short_name: 'KQCMM',
    description: '...',
    start_url: '.',
    display: 'standalone',
    background_color: '#f5f5f5',
    theme_color: '#1a1a2e',
    icons: [
      { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
  workbox: {
    globPatterns: ['**/*.{js,css,html,json,png,jpg,svg,ico}'],
    globIgnores: ['**/quran.json'],   // Large unused file — skip
  },
})
```

### Caching Strategy

| Asset Type | Strategy | Cache Name | Details |
|---|---|---|---|
| JS / CSS bundles | `StaleWhileRevalidate` | `static-assets` | Serve cached instantly, update in background |
| Images (png/jpg/svg) | `CacheFirst` | `images` | Max 20 entries, expires after 30 days |
| HTML / JSON / everything else | Precached (install time) | N/A | All files downloaded on first visit |

### What Gets Precached

```
splash.jpg       manifest.json   logo.png
index.html       drawer-bg.jpg   icons/*.png
assets/*.js      assets/*.css    manifest.webmanifest
```

**Excluded:** `quran.json` (1.1 MB, unused by any page)

---

## Components

### PwaSupport.jsx

Renders toast notifications for offline/update events.

```jsx
<PwaSupport />
```

#### Toasts

| Toast | Trigger | Behaviour |
|---|---|---|
| ✅ App upupdated to latest version | SW auto-update triggers | Auto-dismiss after 100ms (brief green toast) |
| 📡 You're offline | `navigator.onLine` change | Fixed red top banner, auto-hides on reconnect |

#### Integration

Rendered in `App.jsx` inside the context providers, before `<Routes>`:

```jsx
<ThemeProvider>
  <LanguageProvider>
    <FontProvider>
      <ViewProvider>
        <PwaSupport />
        <Routes>...</Routes>
      </ViewProvider>
    </FontProvider>
  </LanguageProvider>
</ThemeProvider>
```

---

## Service Worker Lifecycle

```
┌──────────────────────────────────────────────────────────────┐
│                     SERVICE WORKER LIFECYCLE                  │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  1st Visit                  2nd Visit              Offline   │
│  ┌──────────────┐          ┌──────────────┐     ┌──────────┐ │
│  │ Install SW   │          │ Load cache   │     │ Load     │ │
│  │ Precache all │          │ Check for    │     │ from     │ │
│  │ assets       │          │ update in bg │     │ cache    │ │
│  │ Ready toast  │          │ New version? │     │ Full app │ │
│  └──────────────┘          │ → Toast      │     │ works    │ │
│                            └──────────────┘     └──────────┘ │
└──────────────────────────────────────────────────────────────┘
```

### Update Flow

1. User visits app — SW checks for new files in background
2. If new version found, `updateServiceWorker(true)` is called immediately
3. New SW activates and page reloads automatically
4. PwaSupport shows brief "✅ App updated to latest version" toast (100ms)
5. No user interaction needed — updates happen silently

---

## Browser Support

| Browser | Support | Notes |
|---|---|---|
| Chrome (desktop + Android) | ✅ Full | SW since Chrome 40 (2015) |
| Edge (Chromium) | ✅ Full | Same engine as Chrome |
| Firefox (desktop + Android) | ✅ Full | SW since Firefox 44 (2016) |
| Safari (macOS + iOS 11.3+) | ✅ Full | SW since Safari 11.1 (2018) |
| Samsung Internet | ✅ Full | SW since v4+ |
| iOS Safari Private Mode | ❌ No SW | Apple disables SW in private mode |
| IE11 / Old Android WebView | ❌ No SW | App works online, no offline |

**Graceful degradation:** On unsupported browsers, SW registration fails silently — the app works exactly as before, just without offline capability.

---

## Manifest

**File:** `public/manifest.json`

```json
{
  "name": "KQCMM — Khanqahe Qadriyah Chishtiya Musharrafiya Mahboobiya",
  "short_name": "KQCMM",
  "start_url": ".",
  "display": "standalone",
  "background_color": "#f5f5f5",
  "theme_color": "#1a1a2e",
  "icons": [
    { "src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### Icons

| File | Size | Source |
|---|---|---|
| `public/icons/favicon.png` | 32×32 | Generated from logo |
| `public/icons/icon-192.png` | 192×192 | Generated from logo |
| `public/icons/icon-512.png` | 512×512 | Generated from logo |

Icons are regenerated from `public/logo.png` using `sharp` when needed.

---

## Troubleshooting

| Problem | Cause | Fix |
|---|---|---|
| Toast "App ready" never shows | SW not registered | Check DevTools → Application → Service Workers |
| Offline doesn't work | Not all assets cached | Run `npm run build` again (fresh precache) |
| Old version still shows | SW hasn't updated | Close all tabs, reopen, or manually clear site data |
| "Update available" keeps showing | Frequent deploys | Normal — each deploy triggers update notification |
| PWA install not offered | Missing icons or wrong manifest | Check manifest.json icons array and sizes |
