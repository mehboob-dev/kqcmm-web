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
- **Page CRUD** — create new pages from templates (plain, duas layout, fateha layout), delete, duplicate
- **Navigation Editor** — reorder bottom nav and side drawer, pick icons from a visual selector, edit paths and keys inline
- **Strings Editor** — edit all UI labels (nav text, settings labels) for each language
- **Language Manager** — translation status overview (what % filled per page per language), clickable percentages to jump to a page in a specific language, side-by-side comparison view, add/remove language across all content pages and strings
- **Settings Editor** — view mode defaults (list/slide per page)
- **Calendar Editor** — dedicated 📅 tab for the Hijri calendar: edit the 37 month-start slots (Gregorian start per Hijri month), manage shared events with rule-specific controls, validate before saving via `/api/calendar` (schema-validated)
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
| `/api/page` | PUT | Create a new page |
| `/api/page/duplicate` | POST | Duplicate a page |
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

## Firestore Import Template (import-to-firebase.mjs)

**File:** `scripts/import-to-firebase.mjs` (generated by fetch-content.mjs)

Template for importing local JSON content into Firestore. Requires Firebase Admin SDK setup.

---

## JSON to JS Converter (json-to-js.mjs)

**File:** `scripts/json-to-js.mjs`  
**Usage:** `node scripts/json-to-js.mjs`

Converts all `src/config/content/*.json` files to `.js` modules. Useful if you need template literals for multiline editing (deprecated — use the content editor instead).

---

## Troubleshooting Scripts

| Symptom | Likely Cause | Fix |
|---|---|---|
| Sync skipped sections | Index mapping wrong | Check section count, update indices |
| Urdu shows `o` instead of `۔` | XML encoding issue | Add `replace(/o$/gm, '۔')` post-processing |
| Editor fails to save | Port 3030 in use | `npx kill-port 3030` then retry |
| Script can't find XML files | Path mismatch | Check `XML_DIR` constant in script |
