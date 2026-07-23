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

---

## SideDrawer.jsx

Slide-in navigation drawer with header image.

- Reads items from `src/config/navigation.json`
- Background image with gradient overlay in header
- Closes on route change
- Locks body scroll when open
- RTL support (slides from right in Urdu/Arabic)

---

## SettingsPopup.jsx

Modal popup for user preferences.

### Controls
| Section | Options | Persistence |
|---|---|---|
| Language | English, Hinglish, Urdu | localStorage |
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
| ✅ Ready for offline use | First SW registration | Auto-dismiss after 4s, once per session |
| 🔄 New version available | Updated SW detected | Shows [Refresh] button to activate update |
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
- Uses `useRegisterSW()` from `virtual:pwa-register/react` (vite-plugin-pwa's React integration)
- Listens to `navigator.onLine` events for offline detection
- On update available, calls `updateServiceWorker(true)` to activate new SW
- Shows "update available" toast with a Refresh button

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
- Sets `dir` and `lang` attributes on `<html>`
- RTL support for Urdu (dir="rtl")

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
