# Scripts Reference

All CLI tools and utilities available in the project.

---

## Content Editor / Admin Panel (npm run edit)

**File:** `scripts/content-editor.mjs`  
**Usage:** `npm run edit` → opens `http://localhost:3030`

Two interfaces are served at the same port:

### 1. Admin Panel (Recommended) — `/admin/`
A full React-based admin SPA built in `scripts/admin/`. Built automatically before the server starts.

**Features:**
- **Content Manager** — type-aware fields (titles, textareas, numbers), add/delete/reorder items in arrays, live card preview while you type
- **Quick Jump Editor** — shared, language-independent editor for a page's `quickJump` list: add/remove/reorder entries, pick each target from a dropdown of the source items (sections/duas), no per-language labels to maintain
- **Page CRUD** — create new pages from templates (plain, duas layout, fateha layout), delete, duplicate, **rename** (slug + route)
- **Page Rename** — rename a fixed or custom page's slug: renames the content JSON file **in every active language folder** (`src/config/content/{lang}/`), updates the public route in the page-route registry, and keeps the old route as a redirect alias. Home, the dedicated Calendar page, and protected fixed pages cannot be renamed. Rename is transactional with rollback (see `page-rename.mjs`).
- **Custom pages** — created/duplicated pages get a stable `custom-…` registry id and are rendered publicly at `/slug` via the generic renderer. Deleting a custom page also removes its content files (all languages), registry entry, and navigation references.
- **Navigation Editor** — reorder bottom nav and side drawer, pick icons from a visual selector, edit paths and keys inline
- **Strings Editor** — edit all UI labels (nav text, settings labels) for each language
- **Language Manager** — translation status overview (what % filled per page per language), clickable percentages to jump to a page in a specific language, side-by-side comparison view, add/remove language across all content pages and strings. **How the % works:** `% = non-empty translatable fields ÷ total translatable fields`, per language, computed by `countFields` in `LanguageEditor.jsx`. Only these keys count as translatable content: `title`, `heading`, `text`, `body`, `intro`, `label`, `subtitle`. It measures **raw fill, not translation parity** — a field empty in both languages (or a language with a different field count) shows `< 100%`. The language list comes from `/api/strings` (real codes), not hardcoded keys.
- **Settings Editor** — view mode defaults (list/slide per page)
- **Calendar Editor** — dedicated 📅 tab for the Hijri calendar: manage **month starts** as a free-form, add/remove/sort table (Hijri year + month + Gregorian start per row, auto-sorts on save, duplicates rejected), manage shared events with rule-specific controls (fixed / monthly / Gregorian-relative), validate before saving via `/api/calendar` (schema-validated)
- **Header Save** — Calendar, Strings, Nav, and Settings each show a live **● Unsaved / Saved** badge and a **💾 Save** button in the toolbar (matching the Pages tab); status updates as you type
- **Global Search** — search across all pages and languages

### 2. Legacy Editor — `/`
The original single-page editor. Simpler but still functional.

### API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/pages` | GET | List all content files |
| `/api/page/{name}.json` | GET | Get page content |
| `/api/page/{name}.json` | POST | Save page content |
| `/api/page/{name}.json` | DELETE | Delete a page |
| `/api/page` | PUT | Create a new custom page (content file + registry entry with stable `custom-…` id) |
| `/api/page/duplicate` | POST | Duplicate a page (new stable id, no alias copy) |
| `/api/page/rename` | POST | Rename a fixed or custom page (body: `{ pageId, newSlug }`). Renames the JSON file, updates the registry route, keeps the old route as a redirect alias. Rejects non-renamable pages and invalid/colliding slugs. |
| `/api/search?q=` | GET | Search across all content |
| `/api/nav` | GET | Get navigation config |
| `/api/nav` | POST | Save navigation config |
| `/api/strings` | GET | List string language codes |
| `/api/strings/{lang}` | GET | Get strings for a language |
| `/api/strings/{lang}` | POST | Save strings for a language |
| `/api/strings/{lang}` | PUT | Create new string language |
| `/api/view` | GET | Get view config |
| `/api/view` | POST | Save view config |
| `/api/calendar` | GET | Get calendar config (schema v1) |
| `/api/calendar` | POST | Save calendar config (validated; rejects malformed data atomically) |
| `/api/books` | GET | List the book registry (`en/books/_index.json`) |
| `/api/books/{slug}` | GET | Get one book's full content (`en/books/{slug}.json`) |
| `/api/books/{slug}` | POST | Save a book (validates `chapters` array, headings ≤ 200 chars; refreshes registry `chapterCount`; writes no hinglish file) |
| `/api/templates` | GET | List page templates |
| `/api/content-lang` | PUT | Add a language to all content pages (clones from source or creates empty) |
| `/api/content-lang` | DELETE | Remove a language from all content pages and strings |
| `/api/lang-config` | GET | Get the current language list (from LanguageContext.jsx) |
| `/api/lang-config` | POST | Save updated language list to LanguageContext.jsx |

### Admin Panel Architecture
```
scripts/admin/
├── package.json          # React + Vite deps
├── vite.config.js        # Vite config (proxies /api to :3030)
├── index.html            # Entry point
├── src/
│   ├── main.jsx          # React mount
│   ├── App.jsx           # Main layout + sidebar + routing
│   ├── hooks/
│   │   └── useApi.js     # API client
│   └── components/
│       ├── ContentEditor.jsx  # Content editor + live preview + shared Quick Jump editor
│       ├── NavEditor.jsx      # Navigation editor
│       ├── StringsEditor.jsx  # UI strings editor
│       ├── LanguageEditor.jsx # Translation status + CRUD + compare
│       ├── SettingsEditor.jsx # View config editor
│       ├── CalendarEditor.jsx # Hijri calendar editor (month starts + shared events)
│       ├── BooksEditor.jsx    # Books library editor (metadata + chapter reorder/merge/edit)
│       └── ui/
│           └── Modal.jsx      # Reusable modal dialog component
└── dist/                 # Built output (auto-generated)
```

---

## Sync Other Languages (sync-other-langs.mjs)

**File:** `scripts/sync-other-langs.mjs`  
**Usage:** `node scripts/sync-other-langs.mjs`

Updates **hinglish** and **urdu** sections in khatm.json and fatehaKhwani.json with proper transliteration/translation from Quran XML files.

### Data Sources
| Language | XML Source | Location |
|---|---|---|
| Hinglish | Simple Transliteration | `en_simple_transliteration1.xml` |
| Urdu | Irfan-ul-Quran | `iq_ur.xml` |

### What It Syncs
- **Khatm:** Surah Fatiha, Ikhlas, Alam Nashrah, Muzzammil
- **Fateha:** All surah sections (Fatiha, Ya Sin, Muzzammil, etc.) and composite surah blocks

### Index Mapping
Uses index-based mapping (not regex) to match sections across languages:

```javascript
const khatmSuraMap = [
  { idx: 0, sura: 1 },     // Surah Fatiha
  { idx: 1, sura: 112 },   // Surah Ikhlas
  { idx: 4, sura: 1 },     // Surah Fatiha 7 Times
  // etc.
]
```

### XML Parsing
Uses a custom regex-based parser (no external dependencies) that handles Unicode correctly:

```javascript
function parseQuranXML(filepath) {
  const raw = fs.readFileSync(filepath, 'utf8')
  const q = {}
  const suraRegex = /<sura[^>]*?index="(\d+)"[^>]*?>([\s\S]*?)<\/sura>/gi
  // extracts <sura> blocks and their <aya> children
  return q  // { suraIndex: [{i: verseNum, t: text}, ...] }
}
```

---

## Fetch Content (fetch-content.mjs)

**File:** `scripts/fetch-content.mjs`  
**Usage:** `npm run fetch-content`

Fetches HTML pages from the old Firebase Hosting site and extracts content into JSON files. Useful for initial content migration.

### Fetches From
```
https://kqcmm-7d71b.web.app/{page}.html
```

### Extraction
Uses regex to extract Materialize collapsible sections and `<p>` tags from the old HTML.

---

## Generate Calendar Events (generate-calendar-events.mjs)

**File:** `scripts/generate-calendar-events.mjs`  
**Usage:** `npm run calendar:gen` (or `node scripts/generate-calendar-events.mjs --source <path>`)

Deterministic, idempotent generator that imports the recovered Blessed Days dataset into the Islamic calendar.

- **Reads** `scripts/data/events_merged.json` (2,350 records) + the current **language-split** calendar files `src/config/content/en/calendar.json` and `src/config/content/hinglish/calendar.json`.
- **Preserves** all existing events in both files; **appends** one `hijri-fixed` event per record with id `thesunniway-<source id>`, `hijriMonth`/`hijriDays` from source `month`/`day`.
- **Label** = `englishName` + `(englishSuffix)`; **description** = event type + `Wisal: N AH` when a meaningful wisal year exists (skips `-`/`NULL`/empty). No `translations` — source Urdu stays in `scripts/data/` only.
- **Sorts** generated events by month, day, numeric source id; rewrites only prior `thesunniway-*` entries (reruns replace, never duplicate).
- The raw JSON lives under `scripts/`, so it is **never Vite-bundled** into the browser output.

**Mapping helpers** (`eventLabel`, `eventDescription`) are exported and asserted by `scripts/test-hijri-calendar.mjs` (count, uniqueness, 1:1 source mapping, label/description policy).

---

## Import Books (import-books.mjs + extract-pdf.py)

**Files:** `scripts/import-books.mjs`, `scripts/extract-pdf.py`  
**Usage:** `node scripts/import-books.mjs` (or `--dry-run`, `--reindex`)

Imports the Hajee Mahboob Kassim books from `D:\Work\KQCMM\Content\Books` into
`src/config/content/{en,hinglish}/books/`. See [`docs/books.md`](books.md).

- **`.docx`** extracted natively (unzip → `word/document.xml` → `<w:t>` runs).
- **`.pdf`** extracted via `extract-pdf.py` (pymupdf) — shells out to `python`
  with UTF-8 stdout (`maxBuffer` 64MB for the 483-page book).
- **Auto-split** (v1): docx uses real heading detection; pdfs chunk into ~800-word
  numbered sections (page-fragment noise like page numbers / running headers /
  TOC lines is filtered). Every chapter is `isAuto: true`.
- **Emits**: `en/books/{slug}.json` (full book) + `_index.json` registry in both
  languages. **No hinglish per-book files** are written — the loader falls back
  to `en/` for a missing file (empty `{}` shells would trip a Vite dedup-chunk
  bug that breaks the glob loader). Idempotent.
- **Tests**: `scripts/test-book-progress.mjs` (19 tests, runs under `npm test`) —
  covers `readProgress`/`saveProgress`/`progressPct` incl. storage-failure tolerance.
- The 3 legacy `.doc` (OLE2) books are `status: "coming-soon"` in the registry
  until converted to docx/pdf.

---

## Firestore Import Template (import-to-firebase.mjs)

**File:** `scripts/import-to-firebase.mjs` (generated by fetch-content.mjs)

Template for importing local JSON content into Firestore. Requires Firebase Admin SDK setup.

---

## JSON to JS Converter (json-to-js.mjs)

**File:** `scripts/json-to-js.mjs`  
**Usage:** `node scripts/json-to-js.mjs`

Converts all `src/config/content/{lang}/*.json` files to `.js` modules. Useful if you need template literals for multiline editing (deprecated — use the content editor instead).

---

## Onboarding Walkthrough Tests (test-onboarding.mjs)

**File:** `scripts/test-onboarding.mjs` — runs under `npm test`.

Unit tests for the pure onboarding helpers in `src/utils/onboarding.js`, with no
browser or framework. A fake `storage` (Map-backed) is injected to exercise:

- **Record parse** — `readOnboardingState` returns `null` for no value, malformed
  JSON, empty object, unknown `version`, unknown `status`, or blocked/failing
  storage; parses valid `{version:1, status:'completed'|'skipped'}` records.
- **Start/skip gate** — `shouldStartOnboarding` returns `true` only with **no**
  record (both `completed` and `skipped` suppress the automatic run).
- **Write/clear tolerance** — `markOnboardingCompleted` / `markOnboardingSkipped` /
  `clearOnboardingState` never throw, even when storage throws.
- **Language chooser gate** — `needsLanguageChoice` is `true` only when `kqcmm_lang`
  is unset (storage failure safely returns `false`).
- **Step sequences** — `onboardingStepsForPath('/')` yields **18 steps** with exactly
  4 `route-choice` steps and one `return-home-*` guided step; each choice targets
  the correct `data-tour` hook and destination route; the last step is `finish`.
  Deep-link (`/khatm`) yields **5 shell steps** (`welcome,header-menu,
  header-settings,hijri-strip,finish`), never navigates, and omits `home-links`.
- **Constants** — `ONBOARDING_KEY = 'kqcmm_onboarding_v1'`, `ONBOARDING_VERSION = 1`.

The `ONBOARDING_TARGETS` map (frozen `data-tour` query strings) is exported from
`src/utils/onboarding.js` and shared by the generator, the tour component, and
these tests, so step targets cannot drift between UI and test.

---

## Troubleshooting Scripts

| Symptom | Likely Cause | Fix |
|---|---|---|
| Sync skipped sections | Index mapping wrong | Check section count, update indices |
| Urdu shows `o` instead of `۔` | XML encoding issue | Add `replace(/o$/gm, '۔')` post-processing |
| Editor fails to save | Port 3030 in use | `npx kill-port 3030` then retry |
| Script can't find XML files | Path mismatch | Check `XML_DIR` constant in script |
