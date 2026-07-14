# New Developer Guide

A step-by-step guide for freshers joining the KQCMM project for the first time.

---

## Your First Day

### 1. Prerequisites
- **Node.js** v18 or higher installed
- **Git** installed
- A code editor (VS Code recommended)
- Basic understanding of React (components, props, state, hooks)

### 2. Get the Code
```bash
git clone https://github.com/mehboob-dev/kqcmm-web.git
cd kqcmm-web
npm install
```

### 3. Start the Dev Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser. You should see the splash screen, then the home page.

### 4. Explore the Running App
| Page | URL | What to look for |
|---|---|---|
| Home | `/` | Logo, tagline, 8 quick-link cards |
| Khatm | `/khatm` | 30-step prayer, slide mode, counter |
| Dua | `/dua` | 5 duas, try slide mode |
| Settings | ⚙ gear icon | Change language to Urdu, theme to Sepia |

### 5. Try the Content Editor
```bash
npm run edit
```
Open `http://localhost:3030` — this is a web UI for editing all content without touching JSON files.

---

## Project Map for Beginners

```
kqcmm-web/
├── src/                          ← All source code lives here
│   ├── main.jsx                  ← App entry point (don't touch unless adding Router config)
│   ├── App.jsx                   ← Routes + providers (add new pages here)
│   ├── styles.css                ← ALL styles in one file (themes, layout, cards)
│   │
│   ├── components/               ← Reusable UI components
│   │   ├── Layout.jsx            ← App shell with header, nav, drawer, settings
│   │   ├── ContentView.jsx       ← Displays content in list or slide mode
│   │   ├── BottomNav.jsx         ← Bottom tab bar (reads from navigation.json)
│   │   ├── SideDrawer.jsx        ← Slide-in menu (reads from navigation.json)
│   │   ├── SettingsPopup.jsx     ← Settings modal (language, theme, font, view)
│   │   ├── SplashScreen.jsx      ← Start-up splash with countdown
│   │   └── FontAwesome.jsx       ← Icon component (centralized icon map)
│   │
│   ├── pages/                    ← One file per page (route)
│   │   ├── Home.jsx              ← Home page with quick links
│   │   ├── Dua.jsx, Khatm.jsx, FatehaKhwani.jsx, ... ← Content pages
│   │   └── NotFound.jsx          ← 404 page
│   │
│   ├── context/                  ← React Context providers
│   │   ├── ThemeContext.jsx       ← Light/Dark/Sepia/Green
│   │   ├── LanguageContext.jsx    ← English/Hinglish/Urdu
│   │   ├── FontContext.jsx       ← Font family + size
│   │   └── ViewContext.jsx       ← List/Slide mode
│   │
│   ├── config/                   ← Configuration (edit these often)
│   │   ├── content/              ← ALL page content (10 JSON files)
│   │   ├── strings/              ← UI labels per language
│   │   ├── navigation.json       ← Nav order and icons
│   │   ├── splash.json           ← Splash screen settings
│   │   └── view.json             ← Default view mode per page
│   │
│   └── scripts/                  ← CLI tools
│       ├── content-editor.mjs    ← npm run edit
│       ├── sync-other-langs.mjs  ← Sync Quran translations
│       └── ...
│
├── public/                       ← Static files (copied to dist/)
│   ├── logo.png, splash.jpg, drawer-bg.jpg  ← Images
│   ├── manifest.json             ← PWA manifest
│   └── quran.json               ← Complete Quran data
│
└── docs/                         ← Full documentation (read these!)
    ├── architecture.md           ← System architecture
    ├── components.md             ← Component reference
    ├── content.md                ← Content system
    ├── styling.md                ← CSS & theming guide
    ├── deployment.md             ← Deployment guide
    ├── scripts.md                ← Scripts reference
    └── new-developer-guide.md   ← ← You are here
```

---

## How to Make Common Changes

### Change Text on a Page
1. Open `src/config/content/dua.json` (or whichever page)
2. Find the language section (`en`, `hinglish`, or `urdu`)
3. Edit the text inside the JSON
4. Save → browser auto-reloads

**OR** use the editor: `npm run edit` → click page → edit text → Save

### Add a New Page
1. Create `src/pages/MyNewPage.jsx` (copy from an existing page)
2. Create `src/config/content/myNewPage.json` (copy existing content)
3. Add route in `src/App.jsx`
4. Add to `src/config/navigation.json` if you want it in the menu
5. Add string keys in `src/config/strings/*.json` for the label

### Change Navigation Order
Edit `src/config/navigation.json`:
```json
{
  "bottomNav": [
    { "to": "/", "icon": "faHouse", "key": "home" },
    { "to": "/khatm", "icon": "faStar", "key": "khatmEKhwajagan" },
    // Reorder these items however you want
  ]
}
```

### Change a Theme Color
1. Open `src/styles.css`
2. Find the theme section (`[data-theme="green"]`)
3. Change the CSS variable values
4. Save → see it instantly

### Update Quran Translation Content
```bash
node scripts/sync-other-langs.mjs
```
This pulls new transliteration/translation from the XML files.

---

## Understanding the Code Flow

### What happens when a user visits /khatm?

```
1. Browser requests https://mysite.com/khatm
2. GitHub Pages returns index.html (via 404.html hack)
3. React loads
4. React Router sees URL /khatm, matches route in App.jsx
5. Layout.jsx renders (header + main area + bottom nav)
6. Inside main area, Outlet renders Khatm.jsx
7. Khatm.jsx:
   a. Gets current language from LanguageContext
   b. Imports data from src/config/content/khatm.json
   c. Selects data[lang] (e.g., data.hinglish)
   d. Renders page title + intro
   e. Renders ContentView with the sections array
8. ContentView:
   a. Checks ViewContext for list/slide mode
   b. Checks view.json default for "khatm" page
   c. Renders all 30 sections as cards (list) or one at a time (slide)
   d. Shows counter bar (+/-/↺) at the bottom
```

### What happens when user changes language?

```
1. User taps "Urdu" in Settings popup
2. LanguageContext.changeLang('urdu') fires
3. State updates, localStorage saves preference
4. <html dir="rtl"> and <html lang="ur"> set
5. Layout.jsx useEffect triggers loadStrings('urdu')
6. All page components re-render with data.urdu
7. Navigation labels switch to Urdu
```

---

## Common Mistakes to Avoid

| Mistake | Why | Fix |
|---|---|---|
| Editing `dist/` files | `dist/` is auto-generated, changes lost on rebuild | Edit `src/` files only |
| Adding `!important` in CSS | Breaks theme system, hard to override | Use CSS variables instead |
| Hardcoding colors | Theme switch won't work | Use `var(--bg)`, `var(--accent)`, etc. |
| Putting content in components | Can't edit without rebuilding | Put all text in `src/config/content/` |
| Forgetting `\n` in JSON | Text shows as one paragraph | Use `\n` for line breaks in JSON strings |
| Mismatched section counts across languages | App crashes on language switch | Keep all 3 languages with same structure |

---

## Where to Ask for Help

| Issue | Who/What |
|---|---|
| Bug in the code | Open a GitHub issue |
| Content update | Use `npm run edit` or edit JSON directly |
| Need new feature | Discuss with the project maintainer |
| Documentation unclear | Read the full docs in `docs/` folder first |
