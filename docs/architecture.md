# KQCMM Web App — Full Documentation

## Khanqahe Qadriyah Chishtiya Musharrafiya Mahboobiya

A spiritual web platform serving followers of the Chishti Sufi order. Displays devotional content — duas, khatm, fateha, kalam, sijrah nama, calendar events, and more — in **English**, **Hinglish**, and **Urdu**.

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                          BROWSER (SPA)                               │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                      SPLASH SCREEN                            │   │
│  │              (3s countdown / tap to skip / fade out)          │   │
│  └──────────────────────────┬───────────────────────────────────┘   │
│                             ▼                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                     APP SHELL (Layout.jsx)                     │   │
│  │                                                                │   │
│  │  ┌────────────────────────────────────────────────────────┐   │   │
│  │  │  HEADER                                                │   │   │
│  │  │  ┌──────────┐  ┌──────────────────┐  ┌────────────┐   │   │   │
│  │  │  │ ☰ Menu   │  │  Page Title      │  │ ⚙ Settings │   │   │   │
│  │  │  └──────────┘  └──────────────────┘  └────────────┘   │   │   │
│  │  └────────────────────────────────────────────────────────┘   │   │
│  │                                                                │   │
│  │  ┌────────────────────────────────────────────────────────┐   │   │
│  │  │  MAIN CONTENT (overflow-y: auto, flex: 1)              │   │   │
│  │  │                                                        │   │   │
│  │  │  ┌──────────────────────────────────────────────────┐  │   │   │
│  │  │  │  ContentView (manages list/slide mode + counter) │  │   │   │
│  │  │  │                                                    │  │   │   │
│  │  │  │  ┌────────────┐  ┌──────────────────────────┐    │  │   │   │
│  │  │  │  │ LIST MODE   │  │  SLIDE MODE              │    │  │   │   │
│  │  │  │  │ all cards   │  │  one card + nav + counter│    │  │   │   │
│  │  │  │  │ stacked     │  │  ⏮ ◀ 1/30 ▶ ⏭   - 0 + ↺ │    │  │   │   │
│  │  │  │  └────────────┘  └──────────────────────────┘    │  │   │   │
│  │  │  └──────────────────────────────────────────────────┘  │   │   │
│  │  └────────────────────────────────────────────────────────┘   │   │
│  │                                                                │   │
│  │  ┌────────────────────────────────────────────────────────┐   │   │
│  │  │  FIXED BARS (when content requires)                    │   │   │
│  │  │  ┌─────────────────────────────────────────────────┐   │   │   │
│  │  │  │  Counter bar:  −  0  +  ↺                       │   │   │   │
│  │  │  │  Slide nav:    ⏮ ◀ 3/30 ▶ ⏭                    │   │   │   │
│  │  │  │  (position: fixed, bottom: var(--bottom-nav-    │   │   │   │
│  │  │  │   height))                                      │   │   │   │
│  │  │  └─────────────────────────────────────────────────┘   │   │   │
│  │  └────────────────────────────────────────────────────────┘   │   │
│  │                                                                │   │
│  │  ┌────────────────────────────────────────────────────────┐   │   │
│  │  │  BOTTOM NAV (5 tabs, configurable order)               │   │   │
│  │  │  ┌─────┬─────┬─────┬─────┬─────┐                       │   │   │
│  │  │  │ 🏠  │ ✨  │ 📖  │ 🕯️  │ 🤲  │                       │   │   │
│  │  │  │Home │Khatm│Sijr.│Rosh.│ Dua │                       │   │   │
│  │  │  └─────┴─────┴─────┴─────┴─────┘                       │   │   │
│  │  └────────────────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  SIDE DRAWER (slide-in overlay)                              │   │
│  │  ┌────────────────┐                                          │   │
│  │  │  KQCMM logo    │  ← drawer-bg.jpg with gradient           │   │
│  │  │  tagline       │                                          │   │
│  │  ├────────────────┤                                          │   │
│  │  │  🏠 Home       │                                          │   │
│  │  │  🤲 Duas       │                                          │   │
│  │  │  📜 Hmk        │                                          │   │
│  │  │  📖 Sijrah     │                                          │   │
│  │  │  🕌 Fateha     │                                          │   │
│  │  │  ✨ Khatm      │                                          │   │
│  │  │  ...           │                                          │   │
│  │  └────────────────┘                                          │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  SETTINGS POPUP (modal, triggered by ⚙ gear icon)             │   │
│  │  ┌────────────────────┐                                       │   │
│  │  │  Settings     [✕]  │                                       │   │
│  │  ├────────────────────┤                                       │   │
│  │  │  🌐 Language      │                                       │   │
│  │  │  [English][Hing][Urdu]                                     │   │   │
│  │  │  🎨 Theme         │                                       │   │
│  │  │  [Light][Dark][Sepia][Green]                               │   │   │
│  │  │  🔤 Font          │                                       │   │
│  │  │  [System][Serif]...                                        │   │   │
│  │  │  📐 Font Size     │                                       │   │
│  │  │  [S][M][L][XL]    │                                       │   │
│  │  │  📖 View Mode     │                                       │   │
│  │  │  [List][Slide]    │                                       │   │
│  │  └────────────────────┘                                       │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                     CONTEXT PROVIDERS                         │   │
│  │                                                                │   │
│  │  ┌────────────┐ ┌──────────────┐ ┌──────────┐ ┌──────────┐  │   │
│  │  │  Theme     │ │  Language    │ │  Font    │ │  View    │  │   │
│  │  │  Provider  │ │  Provider    │ │  Provider│ │  Provider│  │   │
│  │  └────────────┘ └──────────────┘ └──────────┘ └──────────┘  │   │
│  │                                                                │   │
│  │  ┌──────────────────────────────────────────────────────┐    │   │
│  │  │  PwaSupport (toast notifications for offline/update)  │    │   │
│  │  └──────────────────────────────────────────────────────┘    │   │
│  └──────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Route Map

```
/               → Home page (logo, tagline, 8 quick-link cards)
/dua            → Duas / Supplications (5 duas in slide mode)
/hmk            → Hajee Mahboob Kassim biography
/sijrah-nama    → Sijrah Nama (verses, slide mode)
/fateha-khwani  → Fateha Khwani (30+ sections, master-child cards)
/khatm          → Khatm-e-Khwajagan (30 steps, slide mode)
/salim-pappa    → Salim Pappa
/about          → About KQCMM
/calendar       → Islamic Calendar (9 events)
/roshni         → Roshni / Chirag Raushan
/abbajaan       → Abbajaan
```

---

## Data Flow

```
                  ┌─────────────────────────────┐
                  │     src/config/strings/       │
                  │  en.json / hinglish.json /    │
                  │  urdu.json                    │
                  │  (UI labels, navigation)      │
                  └──────────┬──────────────────┘  │
                             │ import
                             ▼
                  ┌─────────────────────────────┐
                  │     LanguageContext.jsx       │
                  │  loadStrings(lang) → strings  │
                  └──────────┬──────────────────┘  │
                             │ props via Outlet
                             ▼
                  ┌─────────────────────────────┐
                  │     Page Component            │
                  │  (Dua.jsx, Khatm.jsx, ...)    │
                  │                               │
                  │  import data from             │
                  │  src/config/content/dua.json  │
                  │  data[lang] || data.en        │
                  └──────────┬──────────────────┘  │
                             │
                             ▼
                  ┌─────────────────────────────┐
                  │     ContentView.jsx           │
                  │  - List mode (stack cards)    │
                  │  - Slide mode (one + nav)     │
                  │  - Counter (+/-/↺)            │
                  └─────────────────────────────┘
```

---

## Technologies

| Technology | Version | Purpose |
|---|---|---|
| **React** | 18.x | UI framework |
| **React DOM** | 18.x | DOM rendering |
| **React Router** | 6.x | Client-side routing |
| **Vite** | 5.x | Build tool / dev server |
| **FontAwesome** | 6.x | Icons (solid only) |
| **react-helmet-async** | 3.x | Dynamic meta tags per page |
| **vite-plugin-pwa** | 1.x | Service worker + PWA manifest |
| **Puppeteer** | 25.x | Pre-rendering (build only) |
| **sharp** | 0.35.x | Image processing (icons) |
| **Node.js** | ≥18 | Build / scripts |

No state management library — React Context is sufficient for this app's complexity.

---

## Browser Support

Targets modern browsers (Chrome, Firefox, Safari, Edge — last 2 major versions).
PWA features require HTTPS (served by GitHub Pages).
