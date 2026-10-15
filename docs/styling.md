# Styling Guide

Complete reference for CSS, theming, responsive design, and card system.

---

## Theme System

Twelve themes are defined via CSS custom properties on `[data-theme]` (Light, Dark, Sepia, Green, Rose, Indigo, Teal, Gold, Silver, Beige, Amber, OLED):

```css
:root, [data-theme="light"] {
  --bg: #f5f5f5;              /* Page background */
  --bg-card: #ffffff;          /* Card background */
  --bg-header: #fdfdfd;        /* Header background */
  --bg-nav: #ffffff;           /* Bottom nav background */
  --bg-drawer: #ffffff;        /* Drawer background */
  --bg-card-alt: #f0f0f5;      /* Card alt/hover */
  --border: #e0e0e8;          /* Borders */
  --text: #222;                /* Body text */
  --text-muted: #888;          /* Muted/secondary text */
  --text-heading: #111;        /* Headings */
  --accent: #4a6cf7;           /* Accent color (buttons, borders) */
  --accent-bg: rgba(74,108,247,0.1); /* Accent background tint */
  --shadow: rgba(0,0,0,0.06);  /* Box shadows */
  --ar-bg: #f8f6ff;            /* Arabic text background */
  --ar-text: #222;             /* Arabic text color */
  --header-text: #333;         /* Header text/icon color */
}
```

### Global Design Tokens

Added in the 5.19.0 UI revamp. Defined **once** in `:root` (not per theme) in
`src/styles.css`:

```css
:root {
  --radius-sm: 10px;   /* inputs, small chips, nav chips */
  --radius-md: 14px;   /* cards */
  --radius-lg: 20px;   /* hero blocks, bottom sheets, modals */
  --ease-spring: cubic-bezier(0.16, 1, 0.3, 1); /* standard UI motion curve */
  --focus-ring: 0 0 0 3px var(--accent-bg);     /* keyboard focus halo */
}
```

- Prefer the radius/easing tokens over literal values in new CSS.
- `--ease-spring` is the standard motion curve, used at 0.15–0.35s for
  entrances and press feedback (buttons do `transform: scale(0.97)` on
  `:active`; cards lift on hover).

### Accessibility & Motion

Global rules in `src/styles.css`:

```css
:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
::selection { background: var(--accent); color: #fff; }
button, a { -webkit-tap-highlight-color: transparent; }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
    scroll-behavior: auto !important;
  }
}
```

- Keyboard focus uses the accent outline — don't remove it; interactive
  elements may additionally use `box-shadow: var(--focus-ring)`.
- The blanket `prefers-reduced-motion` block sits at the **end** of
  `styles.css` and disables all decorative animation (page entrances, hover
  lifts, splash zoom) for users who request reduced motion. Keep new
  animations CSS-driven (transitions/keyframes) so this override catches them
  automatically.

### Touch Feedback (Haptics)

`src/utils/haptics.js` exports `hapticTap(ms = 10)` — a safe wrapper around
`navigator.vibrate` (no-op when unsupported or blocked; never throws). It is
called from **user-gesture handlers only** (never on mount/effect):

| Interaction | Duration |
|---|---|
| Shell tabs & drawer items (BottomNav, SideDrawer) | `10` |
| Slide nav / counter / quick-jump taps (ContentView, QuickJump) | `10` |
| Settings option taps (swatches, pills, view-mode) | `8` |

### Theme Comparison

| Property | Light | Dark | Sepia | Green | Rose | Indigo | Teal | Gold | Silver | Beige | Amber | OLED |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `--bg` | `#f5f5f5` | `#0f0f1a` | `#faf0e6` | `#e8f5e9` | `#fdf0f2` | `#eef1fb` | `#e6f5f2` | `#faf3dc` | `#eef0f4` | `#f4eddd` | `#fdf3e3` | `#000000` |
| `--bg-header` | `#fdfdfd` | `#1a1a2e` | `#5c3a1e` | `#1b5e20` | `#9d2b4a` | `#3f3aa8` | `#115e59` | `#a67c00` | `#5d6a7e` | `#a17a4a` | `#f59e0b` | `#000000` |
| `--accent` | `#4a6cf7` | `#7c5cfc` | `#b8860b` | `#2e7d32` | `#c2185b` | `#4f3fd1` | `#0f766e` | `#9a7000` | `#4e6277` | `#7a5b33` | `#d97706` | `#10b981` |
| `--text` | `#222` | `#e0e0e0` | `#3e2c1a` | `#1b3a1b` | `#3a1622` | `#22223f` | `#0f2e2a` | `#3f3510` | `#23272e` | `#3c3325` | `#3d2f14` | `#e8e8e8` |
| `--text-muted` | `#888` | `#888` | `#8b7355` | `#558b2f` | `#9a5c6e` | `#6b6fa0` | `#3d7a6f` | `#8a7538` | `#5f6b7a` | `#7a6a4c` | `#8a6d3f` | `#7a7a7a` |
| `--header-text` | `#333` | `#e0e0e0` | `#f0e8d8` | `#e0e0e0` | `#fdf0f2` | `#ececfb` | `#e0f5f0` | `#fff7e6` | `#f2f5fa` | `#faf3e4` | `#3d2f14` | `#e8e8e8` |

The **warm gradient** themes (Gold, Silver, Beige, Amber) also set `--header-grad`,
a `linear-gradient(...)` used as the header background to give the app bar a
subtle sheen. `.app-header` falls back to `var(--bg-header)` when
`--header-grad` is not defined, so all other themes stay flat.

**Contrast gotcha:** among the warm-gradient themes, **Amber is the odd one out** —
its header is *bright* (`#f59e0b`), so it uses a **dark** `--header-text`
(`#3d2f14`) for readability. Gold/Silver/Beige all have darker headers and use
light header text (`#fff7e6`-family). If you restyle any warm-gradient theme,
check the header text contrast: bright header → dark text, dark header → light text.

### Theme Swatches (Settings picker)
The Settings popup shows each theme as a colored circle instead of a text button.
Each theme in `src/context/ThemeContext.jsx` carries a `swatch: { bg, accent }`
pair — `bg` is the theme's page background, `accent` its accent color. The
swatch circle is filled with `bg` and carries an `accent` dot, so Light (white)
and OLED (pure black) are distinguishable at a glance. `OptionRow` in
`SettingsPopup.jsx` auto-detects swatches via `options.some(opt => opt.swatch)`;
all other option rows (language/font/size) keep text buttons. Keep `swatch`
values in sync with the CSS variables when editing a palette.

### Adding a New Theme
1. Add a new `[data-theme="name"]` block in `styles.css`
2. Define all CSS custom properties
3. Add to `themes` array in `src/context/ThemeContext.jsx` (with a `swatch: { bg, accent }` pair)

### Theme-aware icons
Icons that should follow the theme's accent color are given an explicit
`color: var(--accent)` — never left to inherit body text, or they render
near-black in light themes. Current accent-tinted icons:

- `.quick-link .ql-icon` — Home page tile icons (Home.jsx)
- `.nav-item.active` — the active bottom-nav tab (BottomNav.jsx)

Muted nav/drawer icons inherit `var(--text-muted)` from their container.
When styling a new icon element, pick `var(--accent)` (accent-tinted) or
`var(--text-muted)` (muted) explicitly rather than letting it inherit `--text`.

---

## Card System

### CSS Classes

```css
/* Regular & Master cards — layered shadow + hover lift */
.card {
  background: var(--bg-card);
  border-radius: var(--radius-md);
  padding: 17px 18px;
  margin-bottom: 14px;
  border: 1px solid var(--border);
  box-shadow: 0 1px 2px var(--shadow), 0 12px 32px -24px var(--shadow);
  transition: border-color 0.2s ease, box-shadow 0.25s ease, transform 0.25s var(--ease-spring);
}
@media (hover: hover) {
  .card:hover { border-color: var(--accent); transform: translateY(-2px); }
}

/* Child cards — indented with accent border + connector dot */
.card-accent {
  position: relative;
  margin-left: 14px;
  border-left: 3px solid var(--accent);
  border-top-left-radius: 6px;
  border-bottom-left-radius: 6px;
}
.card-accent::before { /* 6px accent dot at left: -8px */ }

/* Card title — heading color + accent marker bar (::before) + bottom divider */
.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  color: var(--text-heading);
  font-size: 0.92em;
  margin-bottom: 0.55em;
  padding-bottom: 0.45em;
  border-bottom: 1px solid var(--border);
}
.card-title::before {
  content: '';
  flex-shrink: 0;
  width: 3px;
  height: 13px;
  border-radius: 2px;
  background: var(--accent);
}

/* Numbered card head — chip number + title on one row */
.card-head { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 0.55em; }
.card-head .card-title { flex: 1; margin-bottom: 0; padding-bottom: 0; border-bottom: none; }
.card-head .card-title::before { display: none; }
.card-num {
  flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  min-width: 26px; height: 26px; padding: 0 6px;
  border-radius: 9px;
  background: var(--accent-bg);
  border: 1px solid var(--accent);
  color: var(--accent);
  font-size: 0.72em; font-weight: 800;
  font-variant-numeric: tabular-nums;
}
```

**Rules:**
- `.card-title` accent marker (`::before`) is suppressed inside `.card-head`
  and with `.card-title.borderless`.
- The hover lift is wrapped in `@media (hover: hover)` so touch devices don't
  get sticky hover states.
- Numbered cards (Dua, Khatm, Fateha Khwani, Roshni, generic pages) render
  `<div class="card-head"><span class="card-num">N</span><div class="card-title">…`.

### Card Type Diagram

```
Without card-accent (master/regular):
┌─────────────────────────────────────────┐
│  Card Title                             │
│  ───────────────────────────────────── │
│  Card content text here...              │
└─────────────────────────────────────────┘

With card-accent (child):
     ┌── ──────────────────────────────────┐
     │ │  Child Card Title                 │
     │ │  ─────────────────────────────── │
     │ │  Child content text here...       │
     └─┘ ──────────────────────────────────┘
     ↑ accent border (3px)
     ↑ 20px margin-left
```

---

## Page & Component Primitives (5.19.0 revamp)

### Page headers
- `.page-title` — page heading with a gradient underline drawn by
  `.page-title::after` (`--accent` → `--text-heading`, fading out). Used by
  `GenericContentPage` and older pages.
- `.page-hero` / `.page-hero-badge` / `.page-hero-title` / `.page-hero-intro` —
  centered hero block (radius `--radius-lg`, layered shadow, entrance
  animation). Pages built in the revamp (Dua, Khatm, Fateha Khwani, Roshni,
  Sijrah Nama, About, GenericContentRenderer) use the hero with a static
  English badge (e.g. `Duas`, `Khatm-e-Khwajagan`) and the localized title
  from content.
- `.page-section` — spacing wrapper (`margin-bottom: 1.4em`).

### Reading bar & counter classes (ContentView.jsx)
The slide-nav/counter bar is class-based (no inline styles):
- `.reading-bar` — fixed bottom bar container; `.reading-bar.is-split` puts
  slide nav left + counter right in one bar (slide mode).
- `.slide-group` / `.slide-btn` / `.slide-pos` — ⏮ ◀ 3/30 ▶ ⏭ navigation.
- `.counter-group` / `.cnt-btn` / `.cnt-value` / `.cnt-reset` — counter.
  `.cnt-value` uses `font-variant-numeric: tabular-nums` so the digits don't
  jitter between increments.

### Utility component classes
| Area | Classes |
|---|---|
| Changelog timeline (`Changelog.jsx`) | `.log-timeline` (vertical line + dots), `.log-item`, `.log-dot` (accent dot; filled for the latest), `.log-head`, `.log-version` (chip), `.log-latest` (badge), `.log-date`, `.log-changes` (custom bullet markers) |
| About version card | `.version-card` (flex row), `.version-label`, `.version-number`, `.version-link` (pill linking to `/changelog`) |
| 404 page (`NotFound.jsx`) | `.nf-code` (gradient text), `.nf-msg`, `.nf-btn` (accent pill) |
| Home hero (`Home.jsx`) | `.home-hero`, `.home-logo` (outline ring), `.home-subtitle` (chip), `.home-desc` (accent-left card) |
| Quick Jump sheet | `.qj-fab`, `.qj-backdrop`, `.qj-sheet`, `.qj-handle`, `.qj-head`, `.qj-list`, `.qj-item`, `.qj-item-num` |
| Side drawer brand | `.drawer-brand`, `.drawer-brand-logo`, `.drawer-brand-text` |
| Settings popup | `.settings-replay-btn`, `.view-mode-row`, `.view-mode-btn` (`.active` = accent border/bg tint) |
| Highlight / poem cards (Roshni) | `.highlight-card`, `.poem-card` |

---

## Layout System

### App Shell Breakpoints
```css
/* Mobile (default): full width */
.app-shell { max-width: 100%; }

/* Large desktop (≥1400px): capped width */
@media (min-width: 1400px) {
  .app-shell { max-width: 1200px; }
}
```

### Flex Layout
```
┌─────────────────────────────────────┐
│  .app-shell (flex column, 100vh)    │
├─────────────────────────────────────┤
│  Header (flex-shrink: 0)            │
├─────────────────────────────────────┤
│  Main Content (flex: 1, overflow)   │  ← scrollable
├─────────────────────────────────────┤
│  Bottom Nav (flex-shrink: 0)        │
└─────────────────────────────────────┘
```

---

## Font System

### Google Fonts
The app loads 3 font families from Google Fonts via `index.html`:
- **Noto Nastaliq Urdu** (400, 700) — Urdu script
- **Noto Naskh Arabic** (400, 700) — Arabic script
- **EB Garamond** (400, 400 italic, 600) — Serif

These are preloaded via `<link rel="preconnect">` for faster loading.

### Font Families (17)
```javascript
const fontFamilies = [
  { id: 'system', label: 'System Default', family: '-apple-system, ...' },
  { id: 'serif', label: 'Serif', family: 'Georgia, ...' },
  { id: 'sans', label: 'Sans Serif', family: '"Helvetica Neue", ...' },
  { id: 'mono', label: 'Monospace', family: '"Courier New", ...' },
  { id: 'bookman', label: 'Bookman', family: '"Bookman Old Style", ...' },
  { id: 'garamond', label: 'Garamond', family: '"EB Garamond", ...' },
  { id: 'palatino', label: 'Palatino', family: 'Palatino, ...' },
  { id: 'georgia', label: 'Georgia', family: 'Georgia, ...' },
  { id: 'tahoma', label: 'Tahoma', family: 'Tahoma, ...' },
  { id: 'trebuchet', label: 'Trebuchet', family: '"Trebuchet MS", ...' },
  { id: 'verdana', label: 'Verdana', family: 'Verdana, ...' },
  { id: 'times', label: 'Times New Roman', family: '"Times New Roman", ...' },
  { id: 'courier', label: 'Courier New', family: '"Courier New", ...' },
  { id: 'lucida', label: 'Lucida Console', family: '"Lucida Console", ...' },
  { id: 'urdu-nastaliq', label: 'Urdu Nastaliq', family: '"Noto Nastaliq Urdu"', ...' },
  { id: 'urdu-naskh', label: 'Urdu Naskh', family: '"Noto Naskh Arabic", ...' },
  { id: 'mehr-nastaliq', label: 'Mehr Nastaliq', family: '"Mehr Nastaliq", ...' },
]
```

### Font Sizes
| ID | Label | Size |
|---|---|---|
| xs | X-Small | 12px |
| small | Small | 16px |
| medium | Medium | 18px |
| large | Large | 20px |
| xlarge | X-Large | 22px |
| xxl | XX-Large | 24px |

### Size Cascade
Font size is applied as a base on `<main>`, and all content elements use `em` units:

```html
<main style="font-size: 16px">       <!-- base -->
  <div class="card-title">            <!-- 0.85em = 13.6px -->
  <div class="card-text">             <!-- inherit = 16px -->
  <p class="page-section">            <!-- inherit = 16px -->
  <h2 class="page-title">             <!-- 1.25em = 20px -->
</main>
```

---

## Animation

### Page Transitions
```css
@keyframes fadeSlideIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.content-page {
  animation: fadeSlideIn 0.3s ease;
}
```

### Splash Screen (`SplashScreen.jsx`)
Class-based since 5.19.0:
- `.splash` (fixed overlay, black) → `.splash-img` (full-bleed image) →
  `.splash-shade` (bottom gradient, keeps the countdown legible) →
  `.splash-count` (blurred pill with the seconds remaining).
- `.splash-img` runs `@keyframes splashZoom` — a slow 4.5s `scale(1.06 → 1)`
  settle. Disabled automatically by the global reduced-motion override.
- Fade-out on completion is still an inline `opacity` transition (400ms).

---

## RTL Support

For Urdu language:
- `document.documentElement.dir = 'rtl'`
- Drawer slides from right side
- Text alignment reverses automatically

```css
[dir="rtl"] .drawer {
  left: auto;
  right: 0;
  transform: translateX(100%);
}
[dir="rtl"] .drawer.open {
  transform: translateX(0);
}
```

---

## Best Practices

1. **Always use CSS variables** — never hardcode colors
2. **Use em for font sizes** — respects user's font size setting
3. **Card titles are heading-colored** with an accent marker bar — `.card-title` is flex; suppress the marker via `.borderless`/`.card-head`
4. **Child cards use `.card-accent`** — master/regular cards use plain `.card`
5. **Use the design tokens** — `--radius-sm/md/lg`, `--ease-spring` instead of literal radii/curves
6. **Keep focus visible** — `:focus-visible` outline stays; interactive elements use `transform: scale(0.97)` on `:active` for press feedback
7. **Haptics via `hapticTap()`** — gesture handlers only (`src/utils/haptics.js`), never on mount
8. **No !important** — except for safe-area-inset-bottom on bottom nav and the global reduced-motion override
9. **Theme changes via `data-theme`** — all colors defined in CSS vars
