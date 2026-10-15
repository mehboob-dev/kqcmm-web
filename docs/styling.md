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

Added in the 5.19.0 UI revamp, extended by the **6.0.0 "Noor" redesign**.
Defined **once** in `:root` (not per theme) in `src/styles.css`:

```css
:root {
  --radius-sm: 10px;   /* inputs, small chips, nav chips */
  --radius-md: 16px;   /* cards */
  --radius-lg: 22px;   /* hero blocks, bottom sheets, modals */
  --ease-spring: cubic-bezier(0.16, 1, 0.3, 1); /* standard UI motion curve */
  --focus-ring: 0 0 0 3px var(--accent-bg);     /* keyboard focus halo */
}
```

- Prefer the radius/easing tokens over literal values in new CSS.
- `--ease-spring` is the standard motion curve, used at 0.15–0.35s for
  entrances and press feedback (buttons do `transform: scale(0.97)` on
  `:active`; cards lift on hover).

### Noor Token Layer (6.0.0)

Every theme block additionally defines **`--accent-2`** — a second gradient
stop chosen per theme. All other Noor tokens are *derived once* in `:root`
with `color-mix()` and therefore resolve to the active theme automatically:

| Token | Built from | Used for |
|---|---|---|
| `--accent-2` | per theme (e.g. light `#7c5cfc`, oled `#34d399`) | gradient stop 2 |
| `--accent-grad` | `linear-gradient(135deg, var(--accent), var(--accent-2))` | gradient text, rails, dots, progress bars |
| `--accent-grad-deep` | `accent-grad` mixed 84% with `#111` | backgrounds under **white** text (buttons, chips, badges) — keeps contrast on bright accents (amber/gold) |
| `--glass-bg` | `color-mix(bg-card 72%, transparent)` | glass dock, quick-jump sheet, reading dock |
| `--glass-border` | `color-mix(border 60%, transparent)` | glass borders, sheet edges |
| `--hairline` | `color-mix(border 45%, transparent)` | dividers inside sheets/cards (softer than `--border`) |
| `--shadow-md` / `--shadow-lg` | layered `color-mix` shadows | card / dock + sheet elevation |
| `--glass-blur` | `saturate(1.6) blur(18px)` | `backdrop-filter` on glass surfaces |

Rules:

- Text on gradient surfaces: use `--accent-grad-deep` + `#fff`; never put
  white text on `--accent-grad` (fails on amber/gold).
- Gradient *text* (`.home-title`, `.version-number`, `.nf-code`) uses
  `--accent-grad` with `background-clip: text`; dark/OLED themes override the
  wordmark stops to brighter values for contrast on near-black backgrounds.
- Reuse the dock/sheet z-index map: reading bar 55 · dock 60 · header 100 ·
  drawer 201 · settings 301 · tour 1000–1002 · splash 9999.

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

## Page & Component Primitives (5.19.0 revamp · refreshed in 6.0.0 "Noor")

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

### Reading dock & counter classes (ContentView.jsx)
The slide-nav/counter bar is class-based (no inline styles). Since 6.0.0 it is
a **floating glass capsule** sitting above the dock (`bottom: calc(var(--bottom-nav-height, 88px) + 8px)`,
`z-index: 55`, `max-width: 620px`; `.reading-bar-inner` carries the glass):
- `.reading-bar` — fixed container; `.reading-bar.is-split` puts slide nav
  left + counter right in one capsule (slide mode).
- `.slide-group` / `.slide-btn` / `.slide-pos` — ⏮ ◀ 3/30 ▶ ⏭ navigation;
  `.slide-btn` is a soft secondary that tints accent on hover.
- `.counter-group` / `.cnt-btn` / `.cnt-value` / `.cnt-reset` — counter;
  `.cnt-btn` is gradient-deep with a soft glow, `.cnt-value` is a chip with
  `font-variant-numeric: tabular-nums`.
- All controls use `clamp()` sizing so the split capsule never overflows
  small phones.

### Noor shell primitives (6.0.0)
- **Floating glass dock** (`BottomNav.jsx`) — `.bottom-nav` is
  `position: fixed` (left/right 12px, `bottom: calc(10px + env(safe-area-inset-bottom))`,
  max-width 1176px, radius 24px, `backdrop-filter: var(--glass-blur)`,
  z-index 60). The active tab is a gradient pill (`.nav-link.active`) with a
  `navPop` entrance. It publishes `--bottom-nav-height` (viewport bottom →
  dock top); `.main-content` uses `padding-bottom: calc(var(--bottom-nav-height, 88px) + 18px)`.
- **Header seam** — `.app-header::after` renders a 2px `--accent-grad` line at
  55% opacity; `.app-title` is weight 800.
- **Cards** — `.card` is borderless (hairline ring via `--glass-border`) with
  `--shadow-md`; `.card-accent` is a 3px vertical `--accent-grad` rail;
  `.card-title::before` is a gradient marker; `.card-num` is a gradient-deep
  circle with white numerals.
- **Bottom sheets** — `.settings-backdrop` (blurred) + `.settings-modal-card`
  (mobile: fixed bottom sheet, radius 28px top, `sheetUp` keyframes, grab
  handle `::before`, `.settings-modal-body` scrolls) / desktop ≥640px:
  centered sheet. `.settings-section-label` is a gradient eyebrow;
  `.settings-replay-btn` is gradient-deep. Quick Jump mirrors the pattern
  (`.qj-sheet` glass, radius 28px).
- **Home (6.1.0 dashboard)** — `.dash-brand` row (logo card + gradient
  wordmark), `.dash-date` mihrab-arched today hero (radial mesh +
  `.pattern-layer`, event chip), `.dash-continue` card (cover block, progress
  bar `.dash-prog/.dash-prog-fill`), `.dash-dua` card (gradient rail via
  `::before`), `.home-section-label` ("Explore" + fading rule), `.home-foot`
  ornament; `.quick-link` tiles are depth tiles with white-on-gradient-deep
  icon chips that tilt on hover.
- **Splash** — `.splash-count` is a glass pill with `splashPulse`;
  `.splash-count-num` is a circular badge with tabular digits.

### Noor shell motion (6.1.0–6.2.0)
- **Top chrome** — header + Hijri strip live in `.top-chrome` (`position: fixed`,
  centered, z-index 100; `translate(-50%, -103%)` when `.hidden`). Its height is
  published as `--chrome-h`; `.main-content` reserves
  `padding-top: calc(var(--chrome-h, 106px) + 16px)`.
- **Reading progress** — `.read-progress` is a 3px `--accent-grad` line at the
  viewport top (z-index 102, max-width 1200px) with
  `transform: translateX(-50%) scaleX(var(--read-progress, 0))`; both vars are
  set by Layout's rAF-throttled scroll listener.
- **Focus mode** — `body.zen` (toggled by `.zen-btn` in `ContentView.jsx`)
  slides out `.top-chrome` and `.bottom-nav`, fades `.qj-fab`/`.read-progress`,
  drops `.reading-bar` into the dock slot and trims `.main-content` padding.
- **Mihrab heroes** — `.page-hero` uses a 150px domed top radius; its `::before`
  layers a white 8-point-star SVG tile (56px, stroke-opacity 0.07) over the
  accent mesh gradients.
- **Shared ornaments** — `.ornament` (+ `.ornament-diamond`) draw the
  diamond-ended hairline dividers; `.pattern-layer` is the reusable masked
  star-tile texture (menu panel, dashboard hero).
- **View transitions (6.2.0)** — every navigation passes react-router's
  `viewTransition` flag; `::view-transition-old(root)` sinks (`vtOld`) while
  `::view-transition-new(root)` springs up (`vtNew`). The
  `html:active-view-transition` guard force-finishes mount/stagger animations
  during snapshot capture (prevents capturing cards at opacity 0); reduced
  motion disables the pseudo-element animations.
- **Slide-stage (6.2.0)** — `ContentView` remounts a keyed `.slide-stage` per
  index: `.from-right` (`slideInRight`) for forward moves, `.from-left`
  (`slideInLeft`) for back. `.cnt-digit` (keyed span) plays `cntPop` on every
  counter change.
- **Skeleton loading (6.2.0)** — `.skel` blocks (`skelSweep` shimmer);
  `.skel-hero` mirrors the mihrab arch so placeholders preview the real hero.
- **Toast (6.2.0)** — `.app-toast` gradient pill (top-center, z-index 9998,
  `role="status"`); `.show` class toggles the spring drop-in; driven by
  `showToast()` from `src/utils/toast.js`.
- **Aurora (6.2.0)** — `.dash-date::after` is a blurred conic light rotating
  via `auroraSpin` (clipped by the hero's `overflow: hidden`).
- **Modern details (6.2.0)** — thin scrollbars in `.main-content`, `100dvh`
  html height via `@supports`, `text-wrap: balance/pretty` on headings and
  body copy.

### Aurora (7.0.0) — the living canvas & glass chrome
- **Canvas** — `.app-shell` is `isolation: isolate`; `::before` paints four
  blurred radial orbs (`--accent`, `--accent-2`, `--accent-3` at varying
  strengths, `filter: blur(64px)`, opacity 0.4) drifting via `auroraDrift`
  (44s alternate); `::after` layers film grain (inline SVG `feTurbulence`
  data-URI, opacity 0.05). `.main-content` is **transparent** so every page
  scrolls directly over the canvas.
- **Third hue** — every theme sets `--accent-3` (e.g. light orchid `#f0abfc`,
  dark cyan `#22d3ee`, green marigold `#fbbf24`) for the warm/cool balance of
  the orbs and the third explore-tile gradient.
- **Glass copilot bar** — `.top-chrome` is an inset pill (`top: 10px`,
  `width: calc(100% - 20px)`, radius 24, glass bg + blur + border + `--shadow-lg`);
  `.app-header` is transparent inside it and `.hijri-strip` is a hairline row
  (accent text on muted, `background: none`). Hidden state:
  `translate(-50%, calc(-100% - 24px))`; `.main-content` reserves
  `--chrome-h + 26px` (+32px ≥768px).
- **Type** — display headings 800 weight with `-0.02em…-0.03em` tracking;
  `.page-hero-badge` uppercase with `0.14em` tracking; radii 12/18/26.
- **Energetic tiles** — `.home-quick-links .quick-link:nth-child(3n+2/3n)` chips
  rotate three `color-mix` gradient variants; hover adds an accent glow shadow.
- **Moon phase** — `.moon-dark` (faint disc), `.moon-lit` (moonlight gold +
  glow), `.moon-ring` (outline); `.dash-moon*` (hero block, absolute right) and
  `.moon-card*` (Calendar card: `.moon-card-title` accent eyebrow,
  `.moon-card-phase`, `.moon-card-meta`).

### Spatial shell (7.1.0) — the surface responds
- **Pointer spotlight** — `src/utils/spotlight.js` tracks the pointer once
  (document-level, passive + rAF) and writes `--spot-x/--spot-y` on the hovered
  target. Six elements opt in via the shared `::after` layer in the SPATIAL
  SHELL section: `.card`, `.quick-link`, `.dash-continue`, `.dash-dua`,
  `.moon-card`, `.book-card-item` (260px accent radial at 13%, fades in on
  hover; `(hover: none)` devices never render it).
- **Scroll reveals** — `src/utils/reveal.js`; below-fold matches get `.rv`
  (hidden at `translateY(18px) scale(.985)`) and rise to `.rv-in` when they
  intersect. Above-fold elements are deliberately untouched so View Transition
  snapshots never capture hidden content.
- **Counter tap ring** — keyed `.cnt-pulse` inside `.cnt-value` (inset -5,
  `cntRing` 0.55s) fires on every count change.
- **Expanding dock** — `.nav-item` is a row; `.nav-label` collapses
  (`max-width: 0`) until `.nav-item.active` (`flex-grow: 2.4`, label
  `max-width: 130px` + 8px margin). `.is-install` keeps its label visible.
- **Splash scene** — `.splash` uses the theme background; `.splash-aurora`
  (same orb recipe, 30s drift) and `.splash-stars` (starTwinkle) glow behind
  the full-bleed, uncropped image (`object-fit: fill`); `.splash-count-num`
  is a conic ring driven by `--splash-pct`.

### Utility component classes
| Area | Classes |
|---|---|
| Changelog timeline (`Changelog.jsx`) | `.log-timeline` (vertical line + dots), `.log-item`, `.log-dot` (gradient dot; glows for the latest), `.log-head`, `.log-version` (gradient-deep chip), `.log-latest` (outlined badge), `.log-date`, `.log-changes` (gradient bullet markers) |
| About version card | `.version-card` (flex row), `.version-label`, `.version-number` (gradient text), `.version-link` (gradient-deep pill to `/changelog`) |
| 404 page (`NotFound.jsx`) | `.nf-code` (large gradient numeral + soft glow), `.nf-msg`, `.nf-btn` (gradient-deep pill) |
| Dashboard Home (`Home.jsx`) | `.dash-brand*`, `.dash-date*` (arch hero), `.dash-continue*` + `.dash-prog*`, `.dash-dua*`, `.home-section-label`, `.home-foot` |
| Quick links (`Home.jsx`) | `.quick-link` depth tiles, `.ql-icon` white-on-gradient-deep chip (tilt on hover) |
| Quick Jump sheet | `.qj-fab` (gradient rounded square), `.qj-backdrop`, `.qj-sheet` (glass, radius 28px), `.qj-handle`, `.qj-head`, `.qj-list`, `.qj-item` (rounded hover rows), `.qj-item-num` (gradient chip on hover) |
| Full-screen menu (`SideDrawer.jsx`) | `.menu-overlay`, `.menu-panel` (+ pattern-layer), `.menu-panel-inner`, `.menu-top`, `.menu-brand*`, `.menu-close`, `.menu-nav`, `.menu-link*` (numbered editorial rows), `.menu-foot` |
| Settings sheet | `.settings-backdrop`, `.settings-modal-card` (bottom sheet / centered ≥640px), `.settings-modal-body`, `.settings-section-card`, `.settings-section-label` (gradient eyebrow), `.settings-replay-btn` (gradient-deep), `.view-mode-row`, `.view-mode-btn` (`.active` = elevated segment) |
| Skeleton loaders (`ContentSkeleton.jsx`) | `.skeleton-page`, `.skel` (shimmer), `.skel-hero` (arch shape), `.skel-card` |
| Toast (`utils/toast.js`) | `.app-toast` (+ `.show`) |
| Moon phase (`MoonPhaseIcon.jsx`) | `.moon-dark`, `.moon-lit`, `.moon-ring`; hero `.dash-moon` + `.dash-moon-label`; Calendar `.moon-card`, `.moon-card-title/phase/meta` |
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
