# Component Reference

Detailed documentation for every React component in the application.

---

## Layout.jsx (App Shell)

The root layout component that wraps all pages.

### Responsibilities
- Renders the header with hamburger menu and settings gear
- Renders the main content area (React Router Outlet)
- Renders the bottom navigation bar
- Manages the side drawer (open/close state)
- Manages the settings popup (open/close state)
- Loads language strings on language change
- Scrolls to top on page navigation
- Applies font family and font size via inline styles

### State
| Variable | Type | Purpose |
|---|---|---|
| `drawerOpen` | boolean | Controls side drawer visibility |
| `settingsOpen` | boolean | Controls settings modal visibility |
| `strings` | object/null | Loaded language strings |

### Page Title Lookup
Uses a `pageTitleMap` object to translate route paths to display titles from the current language's strings. Includes routes for all 12 pages plus settings.

### Effects
```jsx
// Load strings when language changes
useEffect(() => { loadStrings(lang).then(setStrings) }, [lang])

// Reset scroll position on page navigation
useEffect(() => { mainRef.current.scrollTop = 0 }, [location.pathname])
```

---

## ContentView.jsx (Content Display)

Handles rendering of content items in either **list** or **slide** mode.

### Props
| Prop | Type | Description |
|---|---|---|
| `items` | array | Array of content items to display |
| `renderItem` | `(item, index) => JSX` | Render function for each item |
| `mode` | 'list' \| 'slide' | Override view mode |
| `pageKey` | string | Key for view.json config lookup |

### Slide Mode Navigation
```
⏮  ◀  3/30  ▶  ⏭
First | Prev | Position | Next | Last
```

### Counter (Global)
```
[−]  0  [+]  [↺]
   Decrease | Count | Increase | Reset
```

### Swipe Navigation (Slide Mode)
In slide mode, swipe left/right directly on the card area to go to the next/previous item.
- Threshold: 80px horizontal movement (requires a deliberate drag)
- Vertical scrolling is ignored — swipe only triggers when horizontal movement clearly exceeds vertical movement (ratio > 1.5×)
- `touchAction: pan-y` on the container lets the browser handle vertical scrolling natively
- Works alongside the ◀▶ button navigation
- Implemented via `onTouchStart` / `onTouchMove` / `onTouchEnd` handlers
- Accidental touches (taps, scrolls) do not trigger navigation

### Component Architecture
```jsx
<ContentView>
  ┌─────────────────────────────────────────┐
  │  {isSlide ?                           │
  │    <SlideContainer>                   │
  │      <ScrollableCard />               │  ← flex: 1
  │      <CounterBar />                   │  ← fixed bottom
  │      <SlideNav />                     │  ← fixed bottom (below counter)
  │    </SlideContainer>                  │
  │  :                                    │
  │    <ListContainer>                    │
  │      {items.map(renderItem)}          │  ← stacked cards
  │      <CounterBar />                   │  ← fixed bottom
  │    </ListContainer>                   │
  │  }                                    │
  └─────────────────────────────────────────┘
</ContentView>
```

---

## BottomNav.jsx

5-tab navigation bar at the bottom of the screen.

- Reads items from `src/config/navigation.json`
- Uses FontAwesome icons
- Highlights active tab with accent color + top indicator bar
- Reports its height to CSS var `--bottom-nav-height` for counter bar positioning

### Install App Button (6th slot)
When the browser fires `beforeinstallprompt`, a 6th tab with 📲 icon appears automatically.
- Uses native browser install prompt
- Tracks install state via `display-mode: standalone` media query
- Hidden once app is installed or if browser doesn't support it

### Note: Swipe Gesture Location
Swipe navigation in slide mode is handled entirely in `ContentView.jsx` via `onTouchStart`/`onTouchMove`/`onTouchEnd` on the slide container. BottomNav does not participate in gesture handling.

---

## SideDrawer.jsx

Slide-in navigation drawer with header image.

- Reads items from `src/config/navigation.json`
- Background image with gradient overlay in header
- Closes on route change
- Locks body scroll when open
- RTL support (slides from right — wired up for the planned Urdu/Arabic languages)

---

## SettingsPopup.jsx

Modal popup for user preferences.

### Controls
| Section | Options | Persistence |
|---|---|---|
| Language | English, Hinglish (Urdu: planned) | localStorage |
| Theme | Light, Dark, Sepia, Green | localStorage |
| Font Family | 17 options | localStorage |
| Font Size | Small/Medium/Large/X-Large | localStorage |
| View Mode | List / Slide | localStorage |

---

## SplashScreen.jsx

Full-screen splash with countdown and tap-to-skip.

- Duration: configured in `src/config/splash.json`
- Shows countdown (3...2...1...)
- Image fills screen with object-fit
- Tap anywhere to skip immediately
- Fade-out transition on completion
- Skips automatically on repeat visits (sessionStorage)

---

## PwaSupport.jsx

Manages offline/update notifications for the PWA experience.

**File:** `src/components/PwaSupport.jsx`

### Behaviour
| Toast | When | Description |
|---|---|---|
| ✅ App updated to latest version | SW auto-update triggers | Auto-dismiss after 100ms (brief green toast) |
| 📡 You're offline | Browser goes offline | Fixed red banner at top, hides on reconnect |

### Integration
```jsx
// In App.jsx — renders inside context providers, before Routes
<ThemeProvider>
  <LanguageProvider>
    <PwaSupport />
    <Routes>...</Routes>
  </LanguageProvider>
</ThemeProvider>
```

### How It Works
- Uses `useRegisterSW()` from `virtual:pwa-register/react` (vite-plugin-pwa's React integration) with `onNeedRefresh` calling `updateServiceWorker(true)` immediately
- Listens to `navigator.onLine` events for offline detection
- On update available, new SW activates and page reloads automatically
- Shows brief "✅ App updated" toast (100ms) after auto-update — no user interaction needed

---

## SeoHead.jsx

Sets per-page meta tags for SEO and social sharing.

**File:** `src/components/SeoHead.jsx`

### Props
| Prop | Type | Required | Example |
|---|---|---|---|
| `title` | string | Yes | `"Duas"` → renders `<title>KQCMM - Duas</title>` |
| `description` | string | Yes | `"Collection of sacred supplications..."` |
| `image` | string | No | Custom OG image URL |
| `path` | string | Yes | `"/dua"` → used for `og:url` |

### Tags Generated
```html
<title>KQCMM - {title}</title>
<meta name="description" content="..." />
<meta property="og:title" content="..." />
<meta property="og:description" content="..." />
<meta property="og:image" content="..." />
<meta property="og:url" content="https://mehboob-dev.github.io/kqcmm-web/{path}" />
<meta property="og:site_name" content="KQCMM" />
<meta name="twitter:card" content="summary_large_image" />
```

### Usage in Pages
```jsx
import SeoHead from '../components/SeoHead'

export default function Dua() {
  return (
    <>
      <SeoHead title="Duas" path="/dua" description="..." />
      <div className="content-page">...</div>
    </>
  )
}
```

Uses `react-helmet-async` to inject tags into `<head>`. During build, Puppeteer prerenders these as static HTML.

---

## FontAwesome.jsx

Centralized icon component.

```jsx
import Icon from './FontAwesome'
<Icon name="faHouse" className="nav-icon" />
```

### Adding a New Icon
1. Import it from `@fortawesome/free-solid-svg-icons`
2. Add it to `iconMap` object
3. Use it in navigation.json or anywhere with `name={iconName}`

---

## QuickJump.jsx

Floating-book FAB that opens a bottom-sheet list of jump targets for long content pages (Duas, Roshni, Fateha Khwani, Khatm).

**File:** `src/components/QuickJump.jsx`

### Props
| Prop | Type | Description |
|---|---|---|
| `indices` | array of number | **Shared, language-independent** list of selection indices (from the top-level `quickJump` in the page's content JSON) |
| `sourceItems` | array | The page's content array the indices point into (`sections`, `duas`, `items`, `verses`) |
| `labelKey` | string | Which field on each source item is the label — `"title"` for sections, `"heading"` for duas |
| `onJump` | `(idx) => void` | Called with the selected index; pages pass this to `ContentView`'s `jumpTo` |

### Language-Independent Labels
Labels are **not stored** in the content JSON. Each list entry is just a selection index; the label is derived at render time from the *active language's* source item, so each language automatically shows its own `title`/`heading`. Missing items fall back to `#N` (`#` + index + 1).

```jsx
<QuickJump
  indices={data.quickJump}                 // top-level, shared across languages
  sourceItems={content.sections}           // active language's sections
  labelKey="title"
  onJump={setJumpToIdx}
/>
```

### Layout
- FAB: fixed, bottom-right above the bottom nav (`--bottom-nav-height`), accent circle with a 📖 icon
- Backdrop: semi-transparent overlay, tap to close
- Bottom sheet: slides up (max 60vh, scrollable), sticky header with ✕ close, one button per jump target

---

## Calendar.jsx

Hijri Islamic calendar page — replaced the old static event list.

**File:** `src/pages/Calendar.jsx`

### Behaviour
- **Today card:** shows today's Gregorian date and the calculated Hijri date (day/month/year) using the admin-maintained month-start table. Today's date resolves as soon as the **current month's** start is set (the next month's boundary is not needed — see `hijriCalendar.js`). If the current month's start isn't configured, shows an explicit unavailable state.
- **Next-event card:** earliest upcoming event at or after today, with its Hijri + Gregorian date and a countdown in days (0 = today).
- **Event lists:** split into **Upcoming** (each event's earliest future occurrence, ≥ today) and **Past** (each event's latest past occurrence, dimmed). An event only appears when its **own** Hijri month's start is set.
- **Event list:** one card per event (deduplicated by event ID), sorted by mapped Gregorian occurrence, showing the shared/language-override label, description, and calculated Gregorian date range.
- **Unavailable list:** events whose mapping isn't yet configured are listed separately as "not yet configured" — never guessed.

### Data & logic
- Reads the shared, top-level data from `src/config/content/calendar.json` (schema v1).
- Uses `src/utils/hijriCalendar.js` for all conversion/mapping.
- UI labels from `strings.calendar` in `src/config/strings/*.json`.

---

## hijriCalendar.js (pure date/logic util)

**File:** `src/utils/hijriCalendar.js` — dependency-free, timezone-safe.

| Export | Purpose |
|---|---|
| `parseISODate`, `formatISODate` | Strict `YYYY-MM-DD` local civil-date parsing/formatting (never `new Date('YYYY-MM-DD')`) |
| `todayLocal`, `dayOrdinal`, `ordinalToDate`, `daysBetween`, `addDays`, `compareDates` | DST-safe day arithmetic via UTC ordinals |
| `validateCalendarConfig` | Validates month starts (ordering, 29–30 day lengths, duplicate slots) and event rules |
| `gregorianToHijri`, `todayHijri` | Convert a civil date to Hijri; needs only the containing month's start (day capped at 30) |
| `enumerateOccurrences` | All event occurrences across the covered window (available + unavailable records) |
| `localizedEvent`, `hijriLabel` | Label resolution (language override → default → id) and `"10 Muharram 1448"` formatting |
| `nextOccurrence` | Earliest occurrence at/after a date + days-until |

### Boundary rules (important)
- **Today's date** needs only the current month's start. `start + (day−1)`, day capped at 30.
- **Event days 1–29** map from the month's own start alone (`start + (day−1)`) — every Hijri month has at least 29 days.
- **Event day 30** requires the next month's boundary (a 29-day month has no day 30) — otherwise unavailable, never guessed.
- **Fixed events map only against their own `hijriMonth` slot** — never a different month (prevents "27 Safar" for a Rajab-27 event).
- The next month's boundary is still required to place day-30 events and to validate 29/30-day month lengths.

Tested by `scripts/test-hijri-calendar.mjs` (`npm test`, 54 cases).

---

## Page Components

All pages follow the same pattern:

```jsx
import { useLanguage } from '../context/LanguageContext'
import ContentView from '../components/ContentView'
import data from '../config/content/myPage.json'

export default function MyPage() {
  const { lang } = useLanguage()
  const content = data[lang] || data.en

  return (
    <div className="content-page">
      <h2 className="page-title">{content.title}</h2>
      {content.intro && <div className="page-section"><p>{content.intro}</p></div>}
      <ContentView
        items={content.sections || content.duas || content.items}
        pageKey="myPage"
        renderItem={(item, i) => (
          <div className="card">
            <div className="card-title">{item.title}</div>
            <div className="card-text" style={{ whiteSpace: 'pre-line' }}>{item.text}</div>
          </div>
        )}
      />
    </div>
  )
}
```

### Special Page: FatehaKhwani.jsx
Handles **master-child card sections** where content is split into sub-cards using the `|||` separator:

```jsx
// Section with sub-cards has text format:
// "Bismillah::\n|||\nSurah Al-Ahzab 33:56::verse text\n|||\n..."

// Rendering logic detects ||| and renders:
// 1. Master card (plain .card)
// 2. Child cards (.card.card-accent) for each block
```

---

## Context Providers

### ThemeContext.jsx
- State: `theme`, `changeTheme`, `themes`
- Persistence: localStorage key `kqcmm_theme`
- Default: `green`
- Sets `data-theme` attribute on `<html>`
- Themes: light, dark, sepia, green

### LanguageContext.jsx
- State: `lang`, `changeLang`, `languages`, `current`
- Persistence: localStorage key `kqcmm_lang`
- Default: `hinglish`
- Languages: `en`, `hinglish` (Urdu: planned — plumbing exists but no content yet)
- Sets `dir` and `lang` attributes on `<html>`
- RTL support wired up for Urdu (`dir="rtl"`), ready when Urdu content ships

### FontContext.jsx
- State: `fontFamily`, `fontSize`, `changeFontFamily`, `changeFontSize`, `fontFamilies`, `fontSizes`
- Persistence: localStorage keys `kqcmm_font_family`, `kqcmm_font_size`
- 17 font families, 4 sizes
- Font size applied as base on `<main>`, children use em

### ViewContext.jsx
- State: `slideMode`, `toggleSlideMode`
- Persistence: localStorage key `kqcmm_view_mode`
- Reads per-page defaults from `src/config/view.json`
- Global toggle overrides per-page config
