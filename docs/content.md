# Content System

How content flows from source files to the user's screen, with examples for each content type.

---

## Content JSON Structure

Every content file in `src/config/content/` follows this structure:

```json
{
  "en": {
    "title": "Page Title in English",
    "intro": "Optional intro paragraph",
    "sections": [
      {
        "title": "Card Title",
        "text": "Card text content with\nline breaks supported here"
      }
    ]
  },
  "hinglish": {
    "title": "Page Title in Hinglish",
    "sections": [ ... ]
  },
  "urdu": {
    "title": "اردو میں صفحہ کا عنوان",
    "sections": [ ... ]
  }
}
```

### Common Field Types

| Field | Type | Purpose |
|---|---|---|
| `title` | string | Page or card title |
| `intro` | string (optional) | Intro paragraph before content |
| `sections` | array | Array of card objects |
| `sections[].title` | string | Individual card title |
| `sections[].text` | string | Card body text (supports `\n`) |
| `duas` | array | Alternate field for Dua page (same shape as sections) |
| `verses` | array | Alternate field for SijrahNama |
| `paragraphs` | array | Alternate field for Hmk (biography) |
| `events` | array | Calendar events |

---

## Master-Child Card Format (FatehaKhwani only)

Some sections in FatehaKhwani use a **master-child** structure where content is split into sub-cards. The `text` field uses a special separator format:

```
╔═══════════════════════════════════════════╗
║  text field content:                      ║
║                                           ║
║  Bismillaahir Rahmaanir Raheem::          ║  ← block 1: title::text
║  |||                                       ║  ← separator
║  Surah Al-Ahzab 33:56::verse text here...  ║  ← block 2
║  |||                                       ║
║  Darood Sharif::O Allah send blessings...  ║  ← block 3
║  |||                                       ║
║  ...                                       ║
╚═══════════════════════════════════════════╝
```

### Rendering
- `|||` splits the text into blocks
- `::` splits each block into title + text
- Master card shows `.card` (plain)
- Child cards show `.card.card-accent` (indented)

### Continuous Numbering
Verses across child cards are numbered sequentially, not restarting per card:

```json
{
  "title": "Salaamun",
  "text": "In the Name of Allah...\n|||\nSura Ya Sin 36:58::1. Peace! A word from the Merciful Lord.\n|||\nSura As-Saffat 37:79::2. Peace be upon Nuh...\n|||\nSura As-Saffat 37:109::3. Peace be upon Ibrahim..."
}
```

---

## Language Strings (Navigation & UI)

Labels for navigation, buttons, and UI elements are in `src/config/strings/`:

### en.json
```json
{
  "appName": "KQCMM",
  "tagline": "Khanqahe Qadriyah Chishtiya Musharrafiya Mahboobiya",
  "nav": {
    "home": "Home",
    "khatmEKhwajagan": "Khatm-e-Khwajagan",
    "sijrah": "Sijrah Nama",
    "roshni": "Roshni",
    "duas": "Duas"
  },
  "drawer": {
    "home": "Home",
    "duas": "Duas",
    "hmk": "Hmk / Kalam",
    "sijrahNama": "Sijrah Nama",
    "fatehaKhwani": "Fateha Khwani",
    "khatm": "Khatm-e-Khwajagan",
    "salimPappa": "Salim Pappa",
    "about": "About",
    "calendar": "Calendar",
    "roshni": "Roshni",
    "abbajaan": "Abbajaan"
  },
  "settings": {
    "title": "Settings",
    "language": "Language",
    "theme": "Theme",
    "font": "Font",
    "fontSize": "Font Size",
    "fontFamily": "Font Family"
  },
  "notFound": {
    "title": "404",
    "msg": "Page not found",
    "goHome": "← Go Home"
  }
}
```

### Navigation Config (`src/config/navigation.json`)

Controls the order and icons of navigation elements:

```json
{
  "bottomNav": [
    { "to": "/", "icon": "faHouse", "key": "home" },
    { "to": "/khatm", "icon": "faStar", "key": "khatmEKhwajagan" },
    { "to": "/sijrah-nama", "icon": "faBook", "key": "sijrah" },
    { "to": "/roshni", "icon": "faFire", "key": "roshni" },
    { "to": "/dua", "icon": "faHandsPraying", "key": "duas" }
  ],
  "sideDrawer": [
    { "to": "/", "icon": "faHouse", "key": "home" },
    { "to": "/dua", "icon": "faHandsPraying", "key": "duas" },
    ...
  ]
}
```

The `key` field maps to `strings.nav[key]` or `strings.drawer[key]` for the label.

---

## Splash Screen Config

```json
{
  "enabled": true,
  "duration": 3,
  "message": "Loading",
  "showOnRefresh": true,
  "image": "splash.jpg",
  "fadeTransition": 400
}
```

| Field | Type | Default | Description |
|---|---|---|---|
| `enabled` | boolean | true | Show splash or skip |
| `duration` | number | 3 | Seconds before auto-dismiss |
| `message` | string | "Loading" | Text shown in overlay |
| `showOnRefresh` | boolean | true | Show on every page load |
| `image` | string | "splash.jpg" | Image path (relative to public/) |
| `fadeTransition` | number | 400 | Fade-out duration in ms |

---

## View Mode Defaults

```json
{
  "defaultMode": "list",
  "pages": {
    "dua": "slide",
    "khatm": "slide",
    "sijrahNama": "slide",
    "fatehaKhwani": "slide",
    "roshni": "slide"
  }
}
```

Pages not listed default to `"list"` mode.

---

## Content Editing

### Using the Local Editor (recommended)
```bash
npm run edit
# Opens http://localhost:3030
```
- Sidebar lists all 10 content pages
- Language tabs switch between en/hinglish/urdu
- Auto-resizing text areas with real Enter for line breaks
- Add/delete/reorder array items with buttons
- Save button writes back to `src/config/content/*.json`

### Direct JSON Editing
Edit `src/config/content/*.json` files directly:
- Use `\n` for line breaks inside strings
- Keep all 3 language sections in sync
- Run `npm run build` to verify

### Content Checklist for New Pages
1. Create `src/config/content/pagename.json` with en/hinglish/urdu
2. Each language has `title` + `sections` (or appropriate field names)
3. Add keys to `src/config/strings/*.json` for nav labels
4. Keep section structure identical across all 3 languages
