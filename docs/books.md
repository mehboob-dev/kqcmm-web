# Books — Hajee Mahboob Kassim Library Integration

Design & implementation reference for bringing the written works of **Hajee Mahboob
Kassim** into the KQCMM app as a first-class reading experience.

**Why this doc exists:** the books are large, multi-format English documents (docx /
doc / pdf) that must be extracted, chunked into a reading-friendly structure, and
surfaced through the app — a dedicated reader page, an index page, and an admin
curation tool. This is the full plan: content model, import pipeline, frontend,
admin, routing, docs, and verification.

---

## 1. Source material

Located at `D:\Work\KQCMM\Content\Books` — **12 works**, all English, 3 formats.

| # | File | Format | Est. words | Ships v1? |
|---|---|---|---|---|
| 1 | `GOD SAID LET THERE BE LIGHT.docx` | docx | ~large | ✅ |
| 2 | `MiladunNabi.pdf` | pdf | 119 pp | ✅ |
| 3 | `OH LIGHT ! GUIDE US THROUGH NUCLEAR HOLOCAUST.docx` | docx | ~large | ✅ |
| 4 | `Pappa - Lailatul_Qadar[1].pdf` | pdf | 60 pp | ✅ |
| 5 | `Pappa - Meraj un Nabi.docx` | docx | ~4–5k | ✅ |
| 6 | `Pappa-ISLAM-MILADUNNabi.doc` | doc (OLE2) | — | 🔒 v2 |
| 7 | `Pappa-MaulaAli.doc` | doc (OLE2) | — | 🔒 v2 |
| 8 | `Pappa-Panjatan Pak and Wasilah in the Quran.pdf` | pdf | 229 KB | ✅ |
| 9 | `THE ORIGINAL TEACHINGS OF JESUS.pdf` | pdf | 483 pp | ✅ |
| 10 | `THE PANJATAN PAK AND WASILAH IN THE LIGHT OF THE QUR'AN.docx` | docx | small | ✅ |
| 11 | `Talaq Talaq Talaq- In the light of Quran & Hadiths.doc` | doc (OLE2) | — | 🔒 v2 |
| 12 | `What-is-Hazrat-Muhammad.docx` | docx | ~2.7k | ✅ |

> **v1 ships 9 books** (docx + pdf — cleanly extractable). The **3 `.doc` (OLE2
> binary)** books are held back to v2 until converted to docx/pdf, per the interview
> decision. They appear on the index as **"coming soon"** cards.

### Format extraction summary (verified)

| Format | Method | Status |
|---|---|---|
| `.docx` | unzip → `word/document.xml` → strip XML tags → split `<w:p>` | ✅ verified |
| `.pdf` | `pymupdf` (python) text extraction | ✅ verified (all text-based, not scanned) |
| `.doc` | OLE2 binary — crude text runs only | 🔒 held back |

---

## 2. Decisions (from the interview)

| # | Question | Decision |
|---|---|---|
| Q1 | Layout | **Books index + per-book pages** |
| Q2 | Registration | **Dedicated `BookReader` component** (not generic) |
| Q3 | Book page | Header + chapters as cards + themed cover; chapter navigation via **QuickJump** (list/slide view modes) |
| Q4 | Extras | Reading progress + share-a-book |
| Q5 | Chapter model | **Auto-split now** (headings where clean, else numbered chunks); curated later via admin |
| Q6 | Language | Both langs, **en-filled** — hinglish has **no per-book file**, loader falls back to `en/` |
| Q7 | Index | Simple cover cards (gradient + title + blurb) |
| Q8 | `.doc` | Ship 9, add 3 later ("coming soon") |
| Q9 | Admin curation | **Dedicated Books admin editor** |

---

## 3. Content model

### 3.1 Directory layout

Books live under the existing per-language content folders, in a `books/` subdir:

```
src/config/content/
├── en/
│   ├── books/
│   │   ├── meraj-un-nabi.json
│   │   ├── milad-un-nabi.json
│   │   ├── ... (9 live books)
│   │   └── _index.json            # book registry: order, slugs, blurb, cover, status
│   └── ... (existing pages)
└── hinglish/
    └── books/
        └── _index.json            # slug + title + status only (see §3.2b)
```

Hinglish books have **no per-book `{slug}.json` file** — the loader's en-fallback
(§3.3) serves the English text when the active language is hinglish. Empty `{}`
shells are **never written**: identical empty JSON objects get deduped by Vite
into a shared chunk that breaks the `import.meta.glob` JSON import contract
(React hydration errors #418/#423). The `import-books.mjs` importer and the
`{slug}.json` `getContent` empty-shell fallback in `src/config/content/index.js`
both exist to keep this safe.

### 3.2 `_index.json` — the book registry (source of truth for the index page)

```jsonc
{
  "books": [
    {
      "slug": "meraj-un-nabi",
      "title": "Meraj un Nabi",
      "author": "Hajee Mahboob Kassim",
      "description": "The Holy Prophet's night journey to Heaven.",
      "cover": "#3f3aa8",             // themed cover gradient base color
      "status": "live",                // "live" | "coming-soon"
      "chapterCount": 5                // chapters.length, computed at import/reindex
    },
    { "slug": "maula-ali", "title": "Maula Ali", "status": "coming-soon" }  // v2 book, no content file yet
  ]
}
```

- **`_index.json` drives the `/books` index** — order, blurbs, covers, live vs coming-soon.
- Live entries carry `chapterCount` (computed by `registryEntries()` in
  `scripts/import-books.mjs` from the content file's `chapters.length`);
  coming-soon entries omit it (no content file yet).
- Adding a book = add a slug entry + a content file; the index updates automatically.

### 3.3 Per-book content file (`en/books/{slug}.json`)

```jsonc
{
  "title": "Meraj un Nabi",
  "author": "Hajee Mahboob Kassim",
  "description": "The Holy Prophet's night journey to Heaven.",
  "cover": "#9d2b4a",
  "chapters": [
    {
      "heading": "About the Author",          // auto-detected heading, or "Section 1"
      "isAuto": true,                          // true = auto-split, admin can change
      "paragraphs": [
        "Hajee Mahboob Kassim ...",
        "From childhood he always had ..."
      ]
    },
    {
      "heading": "The Ascension",
      "isAuto": true,
      "paragraphs": [ "...", "..." ]
    }
  ]
}
```

- **`chapters[].paragraphs`** = an array of text blocks, rendered as cards.
- **`isAuto`** marks auto-split chapters so the admin Books editor can present them
  for curation (rename / merge / delete → set `isAuto: false`).
- The **`en`/`hinglish` split**: the book file's keys are the book's own fields
  (`title`, `author`, `chapters`, …) — **not** language keys. `usePageContent`
  already returns the whole file; the en-fallback gives hinglish the English text.

### 3.3b The loader fallback (why hinglish needs no files)

`getContent(lang, file)` in `src/config/content/index.js`:
1. Tries `./{lang}/{file}.json`.
2. If the file is **missing** OR resolves to an **empty object**, it falls back
   to `./en/{file}.json`.

So a hinglish user gets `en/books/{slug}.json` with zero extra files shipped.
The `import.meta.glob('./**/*.json', { import: 'default' })` pattern in that file
is what makes nested `books/` content code-split correctly.

### 3.4 Why `chapters` ≠ `sections`

The app's generic renderer reads `sections`/`duas`/`items`/`verses`. Books use a
dedicated `chapters` shape so:
- `BookReader` renders each chapter via `ContentView` (list/slide) with a
  **QuickJump** bottom sheet for jumping between chapters.
- The admin Books editor has a chapter-specific UI (reorder/rename/merge).
- Books never collide with generic-page rendering.

---

## 4. Import pipeline

### 4.1 Overview

```
Content/Books/*.{docx,pdf}            (9 clean sources)
        │
        ▼
scripts/import-books.mjs
   ├─ extract-text()   ──► plain text paragraphs
   ├─ split-chapters() ─► { heading?, paragraphs[] }[]
   ├─ build-book()     ─► book JSON
   ▼
src/config/content/en/books/{slug}.json      (full book)
src/config/content/en/books/_index.json       (registry, with chapterCount)
src/config/content/hinglish/books/_index.json (slug + title + status only)
```

No `hinglish/books/{slug}.json` files are emitted — see §3.3b for why.

### 4.2 Extraction

| Format | Step |
|---|---|
| `.docx` | `unzip -p file.docx word/document.xml` → strip `<w:p>...</w:p>` boundaries → decode XML entities → collapse whitespace → drop empty paragraphs |
| `.pdf` | `python scripts/extract-pdf.py file.pdf` (pymupdf `get_text()` per page, concatenated, page-break → paragraph break) |

The importer shells out to `python` for PDFs (pymupdf is installed) and does docx
natively in Node (zip + regex on `document.xml`).

### 4.3 Auto-split heuristics (v1 — admin curates later)

Given an array of extracted paragraphs `P[]`, produce `chapters[]`:

1. **Detect headings** — a paragraph is a *candidate heading* if it:
   - is short (< 12 words), and
   - is mostly uppercase OR ends with `:` OR matches a known marker list
     (`ABOUT THE AUTHOR`, `CHAPTER`, `PART`, `SECTION`, roman numerals, `I.`, `II.`…)
2. **Start a new chapter** on a detected heading.
3. **Chunk long prose** — when a stretch of non-heading paragraphs exceeds
   `~800 words`, cut into numbered sections (`Section 1`, `Section 2`, …) at the
   nearest paragraph boundary.
4. Every produced chapter gets `isAuto: true`.

```
P[] ──► [heading] [prose × N] [prose × M>threshold] [heading] ...
        └─► Chapter("About the Author", prose×N)
            └─► Chapter("Section 1", prose×M-split)
            └─► Chapter("Next Heading", ...)
```

> The split is a **starting point for curation**, not the final structure. The
> admin Books editor (Part 3) is the tool to merge/rename/reorder into real
> chapters. `isAuto` makes it easy to tell which are still machine-made.

### 4.4 Slug mapping

| Source file | Slug |
|---|---|
| `Pappa - Meraj un Nabi.docx` | `meraj-un-nabi` |
| `MiladunNabi.pdf` | `milad-un-nabi` |
| … | lowercase, hyphenated, per-book curated |

The slug list lives in `scripts/import-books.mjs` (a `BOOKS` table: `{ file, slug, title, cover, description }`), so the importer knows exactly what to emit and the index stays deterministic.

---

## 5. Frontend

### 5.1 Route map

```
/books                     BooksIndex.jsx     — cover-card grid
/books/:slug               BookReader.jsx     — one book's reading experience
```

Registered in `src/config/pageRoutes.json`:

```jsonc
{ "id": "books",     "component": "BooksIndex",  "contentFile": null,       "route": "/books",     "renamable": false, "aliases": [] },
{ "id": "bookReader", "component": "BookReader", "contentFile": null,       "route": "/books/:slug","renamable": false, "aliases": [] }
```

- `BookReader` resolves its own content by `useParams().slug` → `books/{slug}`
  (it does **not** use a `contentFile` in the registry — the slug IS the file).
- Prerender (Part 5) must emit `/books` plus **one page per live book slug**
  (`/books/meraj-un-nabi`, …) so each book is SEO-prerendered.

### 5.2 `BooksIndex.jsx` — `/books`

```
┌────────────────────────────────────────────────┐
│  Books                                          │
│  Written works of Hajee Mahboob Kassim          │
│                                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────┐ │
│  │  MERAJ      │  │  MILADUN    │  │ MAULA   │ │
│  │  UN NABI    │  │  NABI       │  │ ALI     │ │
│  │  (cover)    │  │  (cover)    │  │ (soon)  │ │
│  │  Hajee M.K. │  │  Hajee M.K. │  │ 🔒      │ │
│  └─────────────┘  └─────────────┘  └─────────┘ │
│  ┌─────────────┐  ┌─────────────┐               │
│  │  JESUS      │  │  ...        │               │
│  │  (cover)    │  │             │               │
│  │  483 pages  │  │             │               │
│  └─────────────┘  └─────────────┘               │
└────────────────────────────────────────────────┘
```

- Reads `books/_index.json` (`usePageContent(lang, 'books/_index')` — en-fallback).
- **Live cards** → `<Link to="/books/{slug}">`; **coming-soon cards** → non-link,
  dimmed, "🔒 Coming soon".
- Cover = a CSS gradient from the book's `cover` color (`--accent` fallback) with
  the title overlaid — no image assets.

### 5.3 `BookReader.jsx` — `/books/:slug`

```
┌────────────────────────────────────────────────────┐
│  ◀ Books                              ↗ Share     │
│  ┌──────────────────────────────────────────┐      │
│  │  MERAJ UN NABI          (cover gradient) │      │
│  │  Hajee Mahboob Kassim                    │      │
│  └──────────────────────────────────────────┘      │
│  The Holy Prophet's night journey…                 │
│  ▮▮▮▮▮▮░░░░  Reading progress — 42%          │      │
│                                                  │
│  ┌──────────────────────────────────────────┐      │
│  │  About the Author                        │      │
│  │  Hajee Mahboob Kassim was born …         │  card │
│  └──────────────────────────────────────────┘      │
│  ┌──────────────────────────────────────────┐      │
│  │  …                                        │  card │
│  └──────────────────────────────────────────┘      │
│                                                  │
│  (list mode: all chapters stacked; slide mode:   │
│   ⏮ ◀ 1/5 ▶ ⏭ fixed bar — see ContentView)      │
│                     [📖 QuickJump FAB]            │
└────────────────────────────────────────────────────┘
```

Components/behaviour:
- **Header**: back-to-books, book title, author, description.
- **Themed cover**: same gradient treatment as the index card (shared
  `coverGradient(cover)` util exported from `BooksIndex.jsx`).
- **Chapters via `ContentView`**: each chapter is a `<section>` of
  paragraph-cards, rendered in list or slide mode exactly like the rest of the
  app (respects the global view-mode setting; `showCounter={false}` hides the
  counter bar — books are reading, not zikr counting).
- **QuickJump chapter navigation**: a floating `📖` FAB (shared
  `QuickJump` component) opens a bottom sheet listing `chapters[].heading`; tap
  to jump. `indices={chapters.map((_, i) => i)}`,
  `sourceItems={chapters}`, `labelKey="heading"`, `onJump` → ContentView's
  `jumpTo`. This **replaces** the plan's TOC dropdown.
- **Reading progress**: `bookProgress.js` stores `{ slug: lastChapterIndex }`
  (chapter index, not paragraph) in localStorage under `kqcmm_book_progress`;
  the progress bar reflects it and "Resume" jumps back on reload.
- **Progress tracking**: `ContentView`'s `onIndexChange` reports the active
  chapter — in slide mode the current slide, in list mode the chapter whose
  section crosses the viewport band (IntersectionObserver with
  `rootMargin: '-40% 0px -55% 0px'` over `[data-section-index]`).
- **Share**: Web Share API with `title`/`text`/`url` (the existing `handleShare`
  pattern in `Layout.jsx`); optional image-card share (backlog 1b) later.

### 5.4 `src/utils/bookProgress.js`

Pure helpers (unit-testable, `scripts/test-book-progress.mjs`):
- `readProgress(slug)` / `saveProgress(slug, chapterIndex)` — localStorage
  `kqcmm_book_progress` (one JSON object keyed by slug → last-read **chapter
  index**, 0-based).
- `progressPct(slug, totalChapters)` → 0–100, computed as
  `min(100, round(((idx + 1) / totalChapters) * 100))`.
- Storage-failure tolerant (same guard pattern as `onboarding.js`).

---

## 6. Admin Books editor

A new admin tab (**📚 Books**) in `scripts/admin/src/App.jsx` + a new
`scripts/admin/src/components/BooksEditor.jsx`.

```
Admin → Books
┌──────────────────────────────────────────────┐
│  [book dropdown ▼]  Meraj un Nabi           │
│  Title      ▸ Meraj un Nabi                 │
│  Author     ▸ Hajee Mahboob Kassim          │
│  Cover      ▸ [color picker swatches]       │
│  Description▸ The Holy Prophet's …          │
│  ── Chapters ──────────────────────────────  │
│  1. About the Author    [↑][↓][✎][🗑]      │
│  2. Section 1           [↑][↓][✎][🗑]      │
│  3. Section 2           [↑][↓][✎][🗑]      │
│     [ + Add chapter ]                      │
│  [ Save ]  [unsaved…]                       │
└──────────────────────────────────────────────┘
```

- **API endpoints** (in `scripts/content-editor.mjs`):
  - `GET /api/books` — list books (registry from `en/books/_index.json`).
  - `GET /api/books/:slug` — one book's full content.
  - `POST /api/books/:slug` — save (title/author/cover/description/chapters);
    also refreshes the registry's `chapterCount`. No hinglish file is written.
  - Reorder/merge are client-side in `BooksEditor.jsx` (reorder via array moves,
    merge = append one chapter's paragraphs to the other + delete).
- Reuses the existing save/status toolbar pattern (`forwardRef` +
  `onStatusChange`) used by Calendar/Strings/Nav editors.
- Server-side validation: `chapters` must be a non-empty array, headings
  non-empty and ≤ 200 chars, each chapter needs a `paragraphs` array.

---

## 7. Routing, nav & Home integration

- **`pageRoutes.json`**: add `books` and `bookReader` entries (Section 5.1).
- **`navigation.json`**: add a `books` entry to the **side drawer** (icon `faBook`,
  label key `books`). Not in bottom nav (5-item limit).
- **Home page**: optionally add a "Books" quick-link card (the `homePageRoutes`
  list in `Home.jsx` reads from a config — add `books` there).
- **Strings**: add `books` label + `books.*` UI strings (title, author, chapters,
  share, coming soon, progress) to `en.json` and `hinglish.json`.
- **SeoHead**: each book page gets title/description (title + author + blurb).

---

## 8. Pre-rendering & SEO

`scripts/prerender.mjs` derives routes from `pageRoutes.json` (flat routes). For
`/books/:slug` we need one static page per live book. Approach:

1. Keep `/books` in the registry (prerendered normally).
2. Extend prerender to also read `books/_index.json` and emit
   `/books/{slug}/index.html` for every `status: "live"` book.

```
dist/
├── books/index.html              (BooksIndex)
└── books/meraj-un-nabi/index.html (BookReader — pre-rendered, full SEO meta)
```

SEO: each book page sets `title`, `description`, OG tags via `SeoHead` —
`"{BookTitle} — Hajee Mahboob Kassim"`.

---

## 9. Docs, changelog & version

### 9.1 Docs
- **New** `docs/books.md` (this file) → link from `docs/index.md`, `README.md`
  docs table, `MEMORY.md` index.
- `docs/components.md` — add `BooksIndex.jsx`, `BookReader.jsx`,
  `bookProgress.js` sections.
- `docs/content.md` — add the **books content shape** (`_index.json`, per-book
  `chapters`, en-filled hinglish).
- `docs/scripts.md` — add `import-books.mjs` + `extract-pdf.py`.
- `CLAUDE.md` — project tree (books files, BooksEditor, BookReader, BooksIndex).
- `docs/suggestions.md` — mark the books feature as shipped (✅).

### 9.2 Version & changelog
- **New feature → minor bump: `5.12.1` → `5.13.0`**.
- `package.json`, `src/pages/About.jsx`, `CLAUDE.md` version, and both changelogs
  (`src/config/content/{en,hinglish}/changelog.json` + `docs/DEVCHANGELOG.md`).
- Public changelog (en + hinglish): "Read the written works of Hajee Mahboob
  Kassim — 9 books with chapters, reading progress, and share."

---

## 10. Verification

1. **Tests** — `npm test` all pass (322: 126+88+43+46+19), including
   `scripts/test-book-progress.mjs` (19 progress-helper tests).
2. **Build** — `npm run build` clean; prerender emits `/books` + one page per live
   book slug (23 routes total: 14 registered + 0 aliases + 9 per-book expansions).
3. **Manual** — `npm run dev`:
   - `/books` shows 9 live + 3 coming-soon cards; covers render.
   - `/books/meraj-un-nabi` shows cover, chapters as cards, view-mode switch
     (list/slide), QuickJump chapter jump; progress persists and "Resume" works;
     share opens Web Share.
   - Language switch to Hinglish still shows English books (en-fallback).
   - Admin → Books tab lists books, edits chapters (reorder/rename/merge/save).
4. **Drift audit** — re-run doc greps; verify no stale route/count claims.

---

## 11. Build order (recommended)

| Step | Deliverable | Depends on |
|---|---|---|
| 1 | `docs/books.md` (this doc) | — |
| 2 | Import pipeline + 9 content files | 1 |
| 3 | `bookProgress.js` + tests | 1 |
| 4 | `BooksIndex.jsx` + routes/nav | 2, 3 |
| 5 | `BookReader.jsx` + SEO/prerender | 4 |
| 6 | Admin Books editor | 2 |
| 7 | Docs, changelog, version, build | 2–6 |
