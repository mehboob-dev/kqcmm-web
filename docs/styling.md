# Styling Guide

Complete reference for CSS, theming, responsive design, and card system.

---

## Theme System

Four themes are defined via CSS custom properties on `[data-theme]`:

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

### Theme Comparison

| Property | Light | Dark | Sepia | Green |
|---|---|---|---|---|
| `--bg` | `#f5f5f5` | `#0f0f1a` | `#faf0e6` | `#e8f5e9` |
| `--bg-header` | `#fdfdfd` | `#1a1a2e` | `#5c3a1e` | `#1b5e20` |
| `--accent` | `#4a6cf7` | `#7c5cfc` | `#b8860b` | `#2e7d32` |
| `--text` | `#222` | `#e0e0e0` | `#3e2c1a` | `#1b3a1b` |
| `--header-text` | `#333` | `#e0e0e0` | `#f0e8d8` | `#e0e0e0` |

### Adding a New Theme
1. Add a new `[data-theme="name"]` block in `styles.css`
2. Define all CSS custom properties
3. Add to `themes` array in `src/context/ThemeContext.jsx`

---

## Card System

### CSS Classes

```css
/* Regular & Master cards — plain */
.card {
  background: var(--bg-card);
  border-radius: 10px;
  padding: 14px;
  margin-bottom: 8px;
  border: 1px solid var(--border);
  transition: background 0.3s, border-color 0.3s;
}

/* Child cards — indented with accent border */
.card-accent {
  margin-left: 20px;
  border-left: 3px solid var(--accent);
}

/* Card title — muted with bottom divider */
.card-title {
  font-weight: 600;
  color: var(--text-muted);
  font-size: 0.85em;
  margin-bottom: 0.4em;
  padding-bottom: 0.4em;
  border-bottom: 1px solid var(--border);
}
```

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
| small | Small | 14px |
| medium | Medium | 16px |
| large | Large | 18px |
| xlarge | X-Large | 21px |

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

### Splash Transition
```css
opacity: fadeOut ? 0 : 1;
transition: opacity 400ms ease;
```

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
3. **Card titles are muted** — `font-size: 0.85em`, `color: var(--text-muted)`, bottom divider
4. **Child cards use `.card-accent`** — master/regular cards use plain `.card`
5. **No !important** — except for safe-area-inset-bottom on bottom nav
6. **Theme changes via `data-theme`** — all colors defined in CSS vars
