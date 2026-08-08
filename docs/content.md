# Content System

How content flows from source files to the user's screen, with examples for each content type.

---

## Content JSON Structure

Content is split **per language into its own folder**: `src/config/content/{lang}/{page}.json`
(`en/`, `hinglish/` today; `urdu/` planned). Each file holds the page's shared
top-level metadata (`quickJump`, `schemaVersion`) plus **only that language's**
content. The loader (`src/config/content/index.js`) globs `./**/*.json` (the
`**` covers nested `books/` files) and falls back to `en/` when a language lacks
a page — for a **missing** file or an **empty `{}` shell** — so a missing
translation never 404s.

File layout:
```
src/config/content/
├── index.js            # usePageContent(lang, file) — dynamic, code-split per language
├── locale.js           # pure resolveLocale (requested → en → first), unit-testable
├── en/
│   ├── dua.json        # { quickJump, en: {...} }
│   ├── ...             # 11 flat page files total
│   └── books/          # Hajee Mahboob Kassim library (see Books section below)
└── hinglish/
    ├── dua.json        # { quickJump, hinglish: {...} }
    ├── ...
    └── books/          # only _index.json — no per-book files (en-fallback)
```

Per-file structure (`src/config/content/en/dua.json`):
```json
{
  "quickJump": [0, 3, 7],
  "en": {
    "title": "Page Title in English",
    "intro": "Optional intro paragraph",
    "sections": [
      {
        "title": "Card Title",
        "text": "Card text content with\nline breaks supported here"
      }
    ]
  }
}
```

Each language's file mirrors the old multi-language shape but keeps only that
language's key, so `data[lang] || data.en` still works at render time. The
`usePageContent(lang, contentFile)` hook (in `src/config/content/index.js`) returns
the **language-specific** file — pages call it and render a `Loading...` state until
the chunk arrives. Vite code-splits each language, so clients only download the
active language's data for the current page.

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

### Calendar page (schema v1) — special case

The calendar is **split per language** like every page, but its two files are the
**only** ones with a special shape, and they are admin-managed through the dedicated
📅 Calendar editor, not the generic Pages editor.

- **`src/config/content/en/calendar.json`** is the **source of truth** for shared data:
  - `monthStarts` (top-level): a **free-form** list of `{ hijriYear, hijriMonth, gregorianStart }` entries — admins add/remove any months they need (not a fixed window). `gregorianStart` is `null` until the admin confirms the moon sighting.
  - `monthNames` / `monthNamesShort` (top-level): **this file's own** localized month names (English).
  - `events` (top-level): the full event list, **each event carrying a `translations` map** `{ lang: { label, description } }` for the other languages.
  - `en`: the localized page `title`.
- **`src/config/content/hinglish/calendar.json`**: same `schemaVersion`/`monthStarts`, its own `monthNames`/`monthNamesShort`, and `events` **without** the translations map — each event's `label`/`description` are the Hinglish values inline.

On save, the Calendar editor flattens/rebuilds both files via `mergeCalendarData` /
`writeCalendarSplit` in `scripts/content-editor.mjs`: it merges each language's events
into the `translations` map on the `en` master, then rewrites both files. `monthStarts`
is kept in sync everywhere — edit it once, it lands in both files.

Event rules:
```json
{ "id": "ashura", "rule": "hijri-fixed", "hijriMonth": 1, "hijriDays": [10], "label": "Ashura" }
{ "id": "monthly", "rule": "hijri-monthly", "hijriDays": [13], "label": "13th of every month" }
{ "id": "dec-event", "rule": "gregorian-month-hijri-relative", "gregorianMonth": 12, "hijriDays": [15,16,17], "label": "December Observance" }
```

- **`hijri-fixed`**: repeats in one specific Hijri month every year.
- **`hijri-monthly`**: repeats on the same Hijri day in EVERY Hijri month.
- **`gregorian-month-hijri-relative`**: finds the single Hijri month whose days all fall inside a target Gregorian month.

Derivation lives in `src/utils/hijriCalendar.js` (see [Components](components.md) and [Hijri Calendar Plan](hijri-calendar-plan.md)).

**Behavioral rules:** today's date resolves from the current month's start alone; event days 1–29 map from their month's start; **day 30 defaults to valid** — every month is treated as 30 days long until a next-month boundary is set, and once the boundary is set only the proven length renders (so a 29-day month excludes day 30, and the last configured month with no boundary still shows day 30); fixed events only map to their own `hijriMonth`. The Calendar page shows a navigable month grid (Hijri or Gregorian view, toggle persisted in localStorage), upcoming and past events as separate sections, and an app-wide Hijri date strip below the header.

---

## Books (Hajee Mahboob Kassim library)

Books are a **dedicated content type** in `src/config/content/{lang}/books/` (see
[`docs/books.md`](books.md) for the full design). They use a `chapters` shape —
**not** `sections`/`duas`/`verses` — so the BookReader and admin Books editor can
behave differently from generic pages.

### `_index.json` — the book registry (source of truth for the index page)

```jsonc
{
  "books": [
    {
      "slug": "meraj-un-nabi",
      "title": "Meraj un Nabi",
      "author": "Hajee Mahboob Kassim",
      "description": "The Holy Prophet's night journey to Heaven.",
      "cover": "#3f3aa8",          // themed cover gradient base
      "status": "live",            // "live" | "coming-soon"
      "chapterCount": 5            // recomputed on save
    }
  ]
}
```

### Per-book content file (`en/books/{slug}.json`)

```jsonc
{
  "title": "Meraj un Nabi",
  "author": "Hajee Mahboob Kassim",
  "description": "…",
  "cover": "#3f3aa8",
  "chapters": [
    { "heading": "About the Author", "paragraphs": ["…", "…"] },
    { "heading": "Section 1",        "paragraphs": ["…"] }
  ]
}
```
- **Hinglish books have no per-book file** — the loader's en-fallback serves the
  English text in the hinglish app (see `getContent` in
  `src/config/content/index.js`: a **missing** file falls back to `en/`, and an
  **empty `{}` shell** is also treated as missing). Empty shells are never
  written: identical empty JSON objects get deduped by Vite into a shared chunk
  that breaks the `import.meta.glob` JSON import contract.
- **Loader**: the glob in `src/config/content/index.js` is `./**/*.json` so these
  nested files are bundled/code-split (a single-level glob would silently drop them).
- **Import**: `scripts/import-books.mjs` extracts `.docx`/`.pdf` and auto-splits;
  **admin** edits books via the 📚 Books tab (see `docs/scripts.md`).

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

## Quick Jump (shared, language-independent)

`quickJump` is a single **top-level** array of selection indices — it is **not** stored
per-language. The same list is used for every language, and the label shown in the
Quick Jump sheet is derived at render time from the source item's own `title`
(or `heading` for `duas`), so each language automatically displays its own text.

```json
{
  "quickJump": [0, 22, 29],
  "en":  { "title": "...", "sections": [ /* ... */ ] },
  "hinglish": { "title": "...", "sections": [ /* ... */ ] }
  // "urdu": { ... }  ← planned
}
```

- The indices point into the page's content array (`sections`, `duas`, `items`, or `verses`).
- Order in the array **is** the order shown in the Quick Jump sheet — it does not have to be
  sorted (e.g. `[4, 17, 12, 13, 22]` is valid).
- Because it lives at the top level, it appears once per file — no duplicate labels to keep in sync.
- The Admin Panel's **Quick Jump** editor manages this list (add / remove / reorder / re-select
  items via a dropdown of the source items).

---

## Custom Pages (created in the Admin Panel)

Pages created/duplicated via the Admin **Pages** tab are **custom pages**: they get a
content JSON file in **each active language folder** (`src/config/content/{lang}/`)
**and** a registry entry in `src/config/pageRoutes.json` with
`{ custom: true, renderer: 'generic' }` and a stable `custom-…` id (never derived from
the slug, so a rename keeps identity). They render publicly at `/slug` through the
**generic renderer** — see the collection shapes, Quick Jump rules, and **plain-text
safety rules** in [`components.md`](components.md) (`GenericContentPage` /
`GenericContentRenderer`).

Key rules:
- **Active languages only.** New-page templates generate locales for the languages in
  `LanguageContext.jsx` only — currently `en`, `hinglish`. If a language is added there,
  every new/duplicated page automatically gets a locale (data-driven, no hardcoded codes;
  see `generateTemplate` + `activeLanguages` in `scripts/content-editor.mjs`).
- **Create/duplicate/delete/rename are transactional** across **every** active language
  folder + the registry (+ navigation for delete/rename by stable `pageId`). Collisions,
  reserved routes (`/`, `/settings`, `/admin`, `/api`), and non-renamable pages (Home,
  Calendar) are rejected server-side with no partial writes.
- **Deleting** a custom page removes its content files (all languages), registry entry,
  and any nav references by `pageId`.
- **Rename** moves the file in every language folder and keeps the old route as a
  redirect alias (`scripts/page-rename.mjs` walks `getActiveLanguageDirs()`).
- **Build-time content.** A new/renamed/deleted custom page reaches the public site
  after `npm run build` + deploy (content is included via the Vite glob).

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

Controls the order and icons of navigation elements. Each entry carries a stable
`pageId` that maps to the page-route registry; the app resolves the current
canonical route from the registry at render time, so a page rename is reflected
in navigation automatically.

```json
{
  "bottomNav": [
    { "pageId": "home", "to": "/", "icon": "faHouse", "key": "home" },
    { "pageId": "khatm", "to": "/khatm", "icon": "faStar", "key": "khatmEKhwajagan" },
    { "pageId": "sijrahNama", "to": "/sijrah-nama", "icon": "faBook", "key": "sijrah" },
    { "pageId": "roshni", "to": "/roshni", "icon": "faLightbulb", "key": "roshni" },
    { "pageId": "dua", "to": "/dua", "icon": "faMosque", "key": "duas" }
  ],
  "sideDrawer": [
    { "pageId": "home", "to": "/", "icon": "faHouse", "key": "home" },
    { "pageId": "dua", "to": "/dua", "icon": "faMosque", "key": "duas" },
    ...
  ]
}
```

The `key` field maps to `strings.nav[key]` or `strings.drawer[key]` for the label.
The `pageId` field is the page's stable registry id (or its content-file basename).
At render time the app resolves the **live** route from the registry via
`routeForNavItem` (see `src/config/pageRoutes.js`), so a nav entry keeps working
even after a page is renamed — a `pageId` entered as a slug (e.g. `my-new-page`)
resolves just like the opaque id. `to` is the fallback.

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

`src/config/view.json` currently holds only a global default:

```json
{
  "defaultMode": "slide"
}
```

All pages use this global default. `ViewContext.jsx` (`getPageMode`) applies it
unless the user has a saved global preference in `localStorage`
(`kqcmm_view_mode`). A per-page `pages` map may be re-added later via the admin
**Settings** editor (view config), but it is not currently populated.

---

## Content Editing

### Using the Local Editor (recommended)
```bash
npm run edit
# Opens http://localhost:3030
```
- Sidebar lists the 10 generic content pages (calendar is managed by its own 📅 tab, so it is excluded from the Pages list)
- Language tabs switch between en/hinglish (urdu appears once it ships)
- Auto-resizing text areas with real Enter for line breaks
- Add/delete/reorder array items with buttons
- Save button writes back to `src/config/content/{lang}/pagename.json`

### Direct JSON Editing
Edit `src/config/content/{lang}/pagename.json` files directly:
- Use `\n` for line breaks inside strings
- Edit each language folder separately (en/, hinglish/) — and urdu/ when added
- Run `npm run build` to verify

### Content Checklist for New Pages
1. Create `src/config/content/en/pagename.json` AND `src/config/content/hinglish/pagename.json` (urdu: planned)
2. Each language file has `title` + `sections` (or appropriate field names)
3. Add keys to `src/config/strings/*.json` for nav labels
4. Keep section structure identical across all languages

---

## Changelog

The version history is split into two records:

- **Public** (`src/config/content/changelog.json`, shown on `/changelog`): user-facing changes only, in each live language.
- **Developer** (`docs/DEVCHANGELOG.md`): the complete record, including internal/refactor/docs/build changes, curated per version.

When work lands, update both together. Public entries describe only what end users see; dev entries hold everything.
