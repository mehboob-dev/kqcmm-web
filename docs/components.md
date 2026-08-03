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
  │      <FixedBar>                       │  ← one fixed bottom bar:
  │        <SlideNav /><Counter />        │    slide nav left, counter right
  │      </FixedBar>                      │
  │    </SlideContainer>                  │
  │  :                                    │
  │    <ListContainer>                    │
  │      {items.map(renderItem)}          │  ← stacked cards
  │      <FixedBar><Counter /></FixedBar> │  ← fixed bottom (centered counter)
  │    </ListContainer>                   │
  │  }                                    │
  └─────────────────────────────────────────┘
</ContentView>
```

Slide mode renders a **single** fixed bar (slide nav on the left, counter on the
right), not two separate bars — see the combined bar in `ContentView.jsx`
(`/* One fixed bar: nav left, counter right */`).

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
| Theme | Light, Dark, Sepia, Green, Rose | localStorage |
| Font Family | 17 options | localStorage |
| Font Size | X-Small → XX-Large (6 sizes, 12–24px) | localStorage |
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
| ✅ App updated to latest version | SW auto-update triggers | Auto-dismiss after 500ms (brief green toast) |
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
- Shows brief "✅ App updated" toast (500ms) after auto-update — no user interaction needed

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

## GenericContentPage.jsx + GenericContentRenderer.jsx (custom pages)

Custom pages created/duplicated in the Admin Panel have no dedicated React
component — they are rendered at their `/slug` route by the generic renderer.
`pageRoutes.json` marks them with `renderer: "generic"`, and `App.jsx` maps
those entries to `GenericContentPage` (never a dynamic import from user JSON).

**Files:**
- `src/pages/GenericContentPage.jsx` — route component: resolves the registry
  entry for the current path, loads the `contentFile` via `getContent`, picks the
  locale via `resolveLocale`, and renders `GenericContentRenderer`.
- `src/components/GenericContentRenderer.jsx` — renders the localized payload.
- `src/components/genericContent.js` — **pure, testable** helpers:
  `parseBlock`, `parseMasterChild`, `pickField`, `normalizeGenericContent`,
  `toPlainNodes`, `cardForItem`.

### Supported content shapes
The renderer recognizes, in priority order: `sections`, `duas`, `items`,
`verses`, `lineage`, `paragraphs` (see `COLLECTIONS` in `genericContent.js`).
- **Plain cards** — `title`/`heading`/`label` as the card title, `text`/`body`/
  `translation`/`arabic` as the body, newlines preserved (`white-space: pre-line`).
- **Master-child** — a `text` field containing `|||` splits into blocks; the first
  `::` in each block separates child title from child text (extra `::` preserved
  in the body). Master card is `.card`, children are `.card.card-accent`.
- **Quick Jump** — top-level `quickJump` indices are bounds-filtered against the
  primary collection and deduped; labels come from `title` (or `heading` for duas).

### Safety rules (important)
- **No `dangerouslySetInnerHTML`.** User-authored JSON is rendered as plain text.
  HTML-looking strings (`<script>…</script>`) stay visible as text, never markup.
- Unknown nested values render as safe text groups with bounded depth (`MAX_DEPTH 6`),
  item count (`MAX_ARRAY_ITEMS 200`), and string length (`MAX_STRING_LEN 20000`).
- Missing/empty content shows the standard "No content yet." state — never throws.

### Example custom page content
```json
{
  "quickJump": [0],
  "en":    { "title": "Retreat", "sections": [{ "title": "Day 1", "text": "…" }] },
  "hinglish": { "title": "Retreat", "sections": [{ "title": "Day 1", "text": "…" }] }
}
```

---

## Calendar.jsx

Hijri Islamic calendar page — a full navigable calendar, not a static list.

**File:** `src/pages/Calendar.jsx`

### Behaviour
- **Month grid card:** a weekday-aligned grid of the current month with event dots on event days and today's cell highlighted. Each cell shows the primary day number plus a mapped sub-date (Hijri day + Gregorian date in Hijri view; Gregorian day + short Hijri month/day in Gregorian view). Event dots are capped at `GRID_MAX_DOTS = 3` per cell with a `+N` marker (busy days can hold ~27 events); the cell tooltip shows "N events".
- **View toggle:** switch between **Hijri** and **Gregorian** month views. The choice is persisted to `localStorage['kqcmm_calendar_view']`.
- **Month navigation:** prev/next arrows. In Hijri mode the range is bounded to the configured min/max months (buttons disabled at the limits); Gregorian mode is unbounded. A "Today" button returns to the current month.
- **Next-event strip:** the earliest upcoming event with its Hijri + Gregorian date and a countdown pill (0 = today).
- **Event lists:** both **Upcoming** (earliest future occurrence per event, ascending) and **Past** (latest past occurrence per event, **descending — newest first**, dimmed) are always visible, stacked. Each is laid out as **two side-by-side columns — Monthly (recurring every month) and Other (one-off)** — and each column **scrolls internally** within a fixed height so the page never grows endlessly. On narrow/mobile screens (<640px) the two columns stack to one. An event only appears when its **own** Hijri month's start is set.
- **No "Not yet configured" section** — the chips list of unplaceable events was removed; unplaceable events are simply not shown.

### Data & logic
- Reads the shared, top-level data from `src/config/content/calendar.json` (schema v1).
- Uses `src/utils/hijriCalendar.js` for all conversion/mapping.
- 3-letter Hijri month abbreviations come from `monthNamesShort` in `calendar.json`.
- UI labels from `strings.calendar` in `src/config/strings/*.json`.

---

## HijriStrip.jsx (app-wide date strip)

Thin bar rendered below the app header on **every page**, showing today's Hijri date, Gregorian date (with year), and a capped dot cluster when events map to today.

**File:** `src/components/HijriStrip.jsx`

### Behaviour
- Accent-colored strip with white text (readable across themes).
- **Clickable** — tapping the strip navigates to `/calendar` (`useNavigate`). Aria-label/title: "Open Islamic calendar".
- Auto-refreshes across midnight (60s interval).
- If today's Hijri isn't configured, shows `—`.
- **Event indicator** — no event text (labels crowd the strip and are one tap away); instead a cluster of one dot per event, capped at `MAX_DOTS = 3`, with a `+N` marker when there are more.
- `em`-sized so it scales with the app's font-size setting.

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
| `buildMonthGrid` | Weekday-aligned Hijri month grid for a target `{year, month}` (cells carry Hijri day, Gregorian date, today flag) |
| `buildGregorianMonthGrid` | Gregorian month grid with each cell's mapped Hijri day/month (null when unconfigured) |
| `hijriMonthOf` | The Hijri `{year, month}` containing a civil date |
| `gregorianMonthOf` | The Gregorian `{year, month}` containing a civil date |
| `splitUpcomingPast` | Splits occurrences into upcoming (ascending) and past (**descending**, newest-first) with the right dedup: fixed events by id, monthly events per `id#year-month` in the past list |

### Boundary rules (important)
- **Today's date** needs only the current month's start. `start + (day−1)`, day capped at 30.
- **Event days 1–29** map from the month's own start alone (`start + (day−1)`) — every Hijri month has at least 29 days.
- **Event day 30 defaults to valid** — every month is treated as 30 days long until a next-month boundary is set. Once the boundary is set, only the proven length renders: a 29-day month excludes day 30 (that date doesn't exist that year); the last configured month with no boundary still shows day 30.
- **Fixed events map only against their own `hijriMonth` slot** — never a different month (prevents "27 Safar" for a Rajab-27 event).
- The next month's boundary also validates 29/30-day month lengths and caps the Hijri grid at the proven length (no phantom "30 Muharram" spilling into Safar 1).

Tested by `scripts/test-hijri-calendar.mjs` (`npm test`, 123 cases).

---

## Page Components

All fixed pages follow the same pattern. Content is loaded via the eager glob
loader (`src/config/content/index.js`) rather than a direct JSON import, so the
page keeps working if its content file is renamed. The route comes from the
page-route registry. **Custom admin-created pages** have no fixed component —
they render through `GenericContentPage.jsx` (see the section above).

```jsx
import { useLanguage } from '../context/LanguageContext'
import ContentView from '../components/ContentView'
import SeoHead from '../components/SeoHead'
import { getContent } from '../config/content'
import { routeForPage } from '../config/pageRoutes'

const data = getContent('myPage')

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
- 17 font families, 6 sizes (12–24px)
- Font size applied as base on `<main>`, children use em

### ViewContext.jsx
- State: `slideMode`, `toggleSlideMode`
- Persistence: localStorage key `kqcmm_view_mode`
- Reads the global default from `src/config/view.json` (currently just
  `{"defaultMode": "slide"}`; a per-page `pages` map is supported by
  `getPageMode` but not currently populated)
- Global toggle / saved preference overrides the default
