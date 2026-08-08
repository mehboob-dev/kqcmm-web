# Architectural Decisions (ADR)

Why things are the way they are — the non-obvious choices that future readers
(and future LLM runs) must NOT casually "fix". Each entry explains the decision,
the problem it solves, and the guard against regression. If a rule here looks
odd, it is deliberate; re-read the rationale before changing the code.

---

## D1 — Always `createRoot`, never `hydrateRoot` (render strategy)

**Status:** current · **Source:** `src/main.jsx` · **Guards:** no test (build-time),
so the code comment is the backstop

`main.jsx` renders with `ReactDOM.createRoot(...).render(...)` and **never**
`hydrateRoot`, in production and dev alike.

**Why:** every page loads its content **asynchronously** via `usePageContent(lang, file)`
(`src/config/content/index.js`). The client's **first** render is therefore
`Loading...`. But the prerendered static HTML in `dist/{route}/index.html`
(produced by `scripts/prerender.mjs` for SEO) already contains the **fully
loaded** content. Hydrating the `Loading...` tree against that loaded HTML is a
content mismatch, and React 18 hydration throws **#418 / #423 / #425** on every
page.

**The trade-off:** the prerendered markup is NOT reused by React on boot — it is
simply replaced. That is acceptable because the prerendered HTML exists for
**crawlers** (SEO meta + content), not for first-paint continuity. React mounts
in ~1 frame; no flash is visible.

**Never** "fix" this back to `hydrateRoot` to reuse the server HTML. The only
route to hydration is to make every page's first client render match the
prerendered HTML byte-for-byte (i.e. render synchronously without `Loading...`),
which contradicts the async content loader.

---

## D2 — PWA manifest is owned by `vite-plugin-pwa`, not `public/`

**Status:** current · **Source:** `vite.config.js` · **Files:** no `public/manifest.json`

The manifest is defined inside `VitePWA({ manifest: {...} })` in `vite.config.js`
and emitted as **`manifest.webmanifest`** at build. There is deliberately **no**
`public/manifest.json`.

**Why:** a manual `<link rel="manifest" href="/kqcmm-web/manifest.json">` in
`index.html` combined with the plugin's dev-mode manifest injection double-based
the URL to `/kqcmm-web/kqcmm-web/manifest.json` in dev, breaking the installable
manifest. The plugin now owns both the file and the `<link>` injection
(`devOptions.enabled: true` + `webManifestUrl: '/kqcmm-web/manifest.webmanifest'`),
and `start_url` is the corrected `/kqcmm-web/`.

**Guard:** if you add `public/manifest.json` back, or a manual `<link rel="manifest">`,
you reintroduce the double-base in dev. Verify there is exactly ONE manifest
`<link>` in both dev and `dist/index.html`.

---

## D3 — Empty `{}` JSON shells are NEVER written

**Status:** current · **Source:** `scripts/import-books.mjs`,
`scripts/content-editor.mjs`, `src/config/content/index.js` · **Files:** see below

Hinglish books have **no per-book `{slug}.json` file**. `getContent` in
`src/config/content/index.js` falls back to `en/` when the requested-language
file is **missing** OR is an **empty object** (`Object.keys(data).length === 0`).

**Why:** identical empty `{}` JSON files get **deduped by Vite into a single
shared chunk** (`const a={};export{a as default}`) that is imported alongside
the real `en/` chunks. The `import.meta.glob('./**/*.json', { import: 'default' })`
loader then consumes that placeholder as if it were real book data, breaking the
JSON import contract and the page.

**Guard:** the importer (`import-books.mjs`) and the admin book editor
(`content-editor.mjs`, `POST /api/books/:slug`) must **never** write
`hinglish/books/{slug}.json`. The loader's empty-object check is the safety net,
but the shells should not exist in the first place.

---

## D4 — Content is per-language folders with `en/` fallback

**Status:** current · **Source:** `src/config/content/` · **Related:** `docs/content.md`

Content is split `src/config/content/{en,hinglish}/` (urdu planned), loaded
dynamically per language via `usePageContent(lang, file)`. A language that lacks
a file (or ships an empty shell — see D3) falls back to `en/`. `quickJump` is a
top-level, language-independent list of section indices.

**Why:** code-splits each language's data (clients download only the active
language), and a missing translation never 404s.

---

## D5 — Books are a dedicated content type, not generic pages

**Status:** current · **Source:** `src/config/content/{en,hinglish}/books/`,
`src/pages/BookReader.jsx`, `src/pages/BooksIndex.jsx` · **Related:** `docs/books.md`

Books use a `chapters[{ heading, paragraphs[] }]` shape — **not** the
generic `sections`/`duas`/`items`/`verses` — so `BookReader` (chapters via
`ContentView` list/slide + QuickJump navigation, reading progress) and the admin
**📚 Books** editor behave differently from generic pages.

**Why:** a dedicated shape keeps books from colliding with generic-page rendering
and gives the admin editor a chapter-specific UI (reorder/merge/rename). The
`books/_index.json` registry (slug/title/author/cover/status/chapterCount) drives
the `/books` index and the prerender expansion of `/books/:slug`.
