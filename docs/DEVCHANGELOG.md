# Developer Changelog

**Holds EVERYTHING** — user-facing and internal (refactors, docs, build, admin internals, tooling). The public [`/changelog`](content.md#changelog) shows only user-facing changes; this file is the complete record.

Maintain both changelogs together when work lands. Latest version at the top.

---

## 5.15.0 — 2026-08-08

### User-facing
- **Home page tiles are now editable** — the quick-link grid on `/` is no longer hardcoded. The admin panel's new **🏠 Home** tab lets you add, remove, reorder, and re-icon the tiles. Tile labels are **always auto-derived** from each target page's localized name (`strings.drawer[titleKey]`), so tiles stay translated automatically in every language with zero manual label editing.

### Internal / docs
- **`src/config/home.json` (new)** — the tiles config: `{ "tiles": [{ "pageId": "...", "icon": "fa..." }, ...] }`. Seeded with the 11 pre-existing quick links (`dua`, `hmk`, `sijrahNama`, `fatehaKhwani`, `khatm`, `salimPappa`, `roshni`, `abbajaan`, `calendar`, `books`, `about`). Statically imported by `Home.jsx` (same pattern as `navigation.json` → `SideDrawer`/`BottomNav`).
- **`src/pages/Home.jsx`** — the hardcoded `quickLinks` array is replaced by a map over `homeConfig.tiles`; each tile resolves its route via `routeForNavItem({ pageId })` and its label key via `pageById(tile.pageId)?.titleKey` (falling back to the pageId). Render JSX unchanged — `.quick-link` cards, `data-tour="home-links"` and `data-tour="home-link-*"` hooks intact.
- **`src/components/FontAwesome.jsx`** — `iconMap` grew with the tile icons: `faBookOpen`, `faStarAndCrescent`, `faUserTie`, `faHandHoldingHeart` (all free-solid).
- **Admin** — new **🏠 Home** tab (`HomeEditor.jsx`) mirroring `NavEditor`: reorderable tile rows (page dropdown from the route registry, FA icon picker restricted to icons present in the app's `iconMap` so tiles never render `?`, unknown-page warning tag, live preview strip), header Save + dirty status via `onStatusChange` + `useImperativeHandle`. New API: `GET/POST /api/home` (reads/writes `src/config/home.json`) and `GET /api/routes` (exposes `pageRoutes.json` so the editor's page dropdown includes non-content-file pages like `books`). `useApi.js` gains `getHome`/`saveHome`/`getRoutes`.
- Docs updated: `docs/scripts.md` (new `/api/home` + `/api/routes`), `docs/components.md` (HomeEditor + Home.jsx data source), `docs/architecture.md` route map note if present, `CLAUDE.md` tree, `README.md`, `MEMORY.md`. Version `5.14.0` → `5.15.0` (new feature), public changelog bumped en + hinglish.

---

## 5.14.0 — 2026-08-08

### User-facing
- **Four new warm-gradient themes** — **Gold** (warm gold header with a gradient sheen, deep-gold accent, cream page), **Silver** (steel-blue header, muted slate accent, light-grey page), **Beige** (taupe header, brown accent, warm sand page), and **Amber** (bright amber header with a gradient sheen, deep-amber accent, warm cream page) added to Settings. The theme picker now offers **12 themes** total (Light, Dark, Sepia, Green, Rose, Indigo, Teal, Gold, Silver, Beige, Amber, OLED; default remains Green).

### Internal / docs
- **`src/styles.css`**: four new `[data-theme]` blocks (gold, silver, beige, amber) defining the full 17-variable set each, including a new `--header-grad` (a `linear-gradient(...)`) used by the warm-gradient themes. `.app-header` background changed from `var(--bg-header)` to `var(--header-grad, var(--bg-header))` — the warm-gradient themes get the gradient sheen, every other theme falls back to its flat header color. The `--text-muted` variable (already present in the other themes) is now also defined on the four new blocks, keeping the theme comparison table in `docs/styling.md` uniform.
- **`src/context/ThemeContext.jsx`**: `themes` array grew 8 → 12; each new entry carries a `swatch: { bg, accent }` (taken from the theme's CSS variables) so the Settings picker shows matching circles. **Amber's** swatch accent is `#d97706` (matching `--accent`), and its header text is **dark** (`--header-text: #3d2f14`) — the only warm-gradient theme with dark header text, because its bright `#f59e0b` header needs it for contrast.
- Docs updated (`README.md`, `CLAUDE.md` theme table + tree, `MEMORY.md`, `docs/styling.md` theme count + comparison table + `--header-grad` behavior, `docs/components.md` ThemeContext table, `docs/new-developer-guide.md`); version `5.13.0` → `5.14.0` (new feature), public changelog bumped en + hinglish.

---

## 5.13.0 — 2026-08-06

### User-facing
- **Books section** — the written works of **Hajee Mahboob Kassim** are now readable in the app: a **Books index** (`/books`) with themed cover cards, and a dedicated **book reader** (`/books/:slug`) with **view modes** (list / slide, same as the rest of the app), chapters-as-cards reading, **QuickJump** chapter navigation, **reading progress** (persisted, with resume), and **share** (Web Share / copy link). 9 books ship now; the 3 legacy `.doc` works show as "coming soon" until converted.

### Internal / docs
- **Content model** — books live in `src/config/content/{en,hinglish}/books/`: `_index.json` is the book registry (slug, title, author, cover, description, status live/coming-soon, chapterCount); each `{slug}.json` holds `title`/`author`/`description`/`cover`/`chapters[]` where each chapter is `{ heading, isAuto, paragraphs[] }`. Hinglish books have **no per-book file** — the loader falls back to `en/` when a file is missing.
- **Import pipeline** — `scripts/import-books.mjs` + `scripts/extract-pdf.py`:
  - `.docx` extracted via unzip → `word/document.xml` → `<w:t>` runs (native Node).
  - `.pdf` extracted via pymupdf (shells out to `python`, UTF-8 stdout; `maxBuffer` 64MB for large books).
  - **Auto-split** (v1): docx uses real heading detection (`isHeading`: short uppercase / known markers / colon / roman-numeral); pdfs chunk into ~800-word numbered sections (page-fragment noise filtered: page numbers, repeating headers/footers, TOC lines). Every chapter marked `isAuto: true` — the admin Books editor is the curation tool.
  - Emits en books + `_index.json` only — **no hinglish shell files** (empty `{}` shells trip a Vite dedup-chunk bug that breaks the glob loader's JSON import); idempotent.
- **Loader** — `src/config/content/index.js` glob widened `./*/*.json` → `./**/*.json` so nested `books/` files code-split correctly (without this the book JSONs were silently not bundled); `getContent` now falls back to `en/` for **empty** shells too, not just missing files.
- **Frontend** — `BooksIndex.jsx` (cover-card grid, live + coming-soon), `BookReader.jsx` (cover, header, chapters via `ContentView` list/slide + `QuickJump` chapter jump, IntersectionObserver-driven progress save, share, resume), `src/utils/bookProgress.js` (pure localStorage helpers). `ContentView` gained `showCounter` and `onIndexChange` props.
- **Routing** — `pageRoutes.json` adds `books` (`/books`) and `bookReader` (`/books/:slug`); `App.jsx` maps them; side drawer + Home quick-link added; `books` string in en/hinglish.
- **Prerender** — `scripts/prerender.mjs` expands `/books/:slug` into one static page per live book slug (reads `books/_index.json`).
- **Hydration fix** — `src/main.jsx` now always uses `createRoot`, never `hydrateRoot`. Every page loads its content async via `usePageContent`, so the client's first render is `Loading...` — mismatching the fully-rendered prerendered HTML and making React 18 hydration throw (#418/#423/#425). A clean `createRoot` render on top of the static HTML avoids the mismatch entirely; the prerendered markup is kept for SEO and simply replaced on boot.
- **Manifest fix** — removed the manual `<link rel="manifest">` from `index.html` (dev was double-basing to `/kqcmm-web/kqcmm-web/manifest.json`) and the stale `public/manifest.json`. The PWA plugin now owns manifest injection via `devOptions.enabled` + `webManifestUrl: /kqcmm-web/manifest.webmanifest`; `start_url` corrected to `/kqcmm-web/`. Single manifest link verified in dev and build.
- **Admin** — new **📚 Books** tab (`BooksEditor.jsx`): book list, editable title/author/cover/description, chapter reorder/merge/delete/rename, per-chapter paragraph editing, header Save + dirty status. API: `GET/POST /api/books`, `GET/POST /api/books/:slug` in `content-editor.mjs` with chapter validation.
- Docs: new `docs/books.md` (full design reference), `docs/index.md` + `README.md` linked, `docs/components.md`/`docs/scripts.md`/`CLAUDE.md` updated (in progress).
- Version `5.12.1` → `5.13.0` (new feature), public changelog bumped en + hinglish.
- **CI tooling** — `.github/workflows/deploy.yml` actions bumped to Node-20-native majors: `actions/checkout@v4 → v7`, `actions/setup-node@v4 → v7`, `actions/upload-pages-artifact@v3 → v5`, `actions/deploy-pages@v4 → v5`. The previous majors targeted Node.js 20 and were being force-run on Node 24, emitting deprecation warnings on every deploy; the new majors run natively on Node 24 and clear the warning. No user-visible change — **no public version bump** (stayed `5.13.0`).

---

## Dev (unreleased) — split-language content migration

> **No public version bump** — this is a pure internal refactor with no user-visible
> change (identical UI, content, and routes). Recorded here for the complete history;
> the public changelog was intentionally NOT bumped.

### Internal / docs
- **Calendar perf refactors** (no user-visible change, recorded here):
  - `src/pages/Calendar.jsx`: `eventByOrd` (day→occurrences index) and the month `grid` are now `useMemo`-derived. The grid memo maps each cell to a **fresh** object with its `events` — it no longer mutates the `buildMonthGrid` return (avoids corrupting cached state if the builder ever returns a shared grid). `available` sort comparator already returns `0` on ties.
  - `src/utils/hijriCalendar.js` `enumerateOccurrences`: pre-indexes `monthStarts` by Hijri month (`startsByMonth`) so `hijri-fixed` events look up only their own month's slots instead of scanning all slots; `hijri-monthly` still walks every slot. Behavior identical to the old loop (the map holds the same `{ms, nextMs}` pairs the old scan iterated); the last-configured-month handling is unchanged.
  - Docs updated (`docs/components.md` Calendar data/logic + `enumerateOccurrences` row).
- **Content split per language folder.** Moved `src/config/content/*.json` (flat,
  all-languages-in-one-file) → `src/config/content/{en,hinglish}/*.json` (one folder
  per live language, one file per page). Shared top-level metadata (`quickJump`,
  `schemaVersion`) stays at the top of each file; only that language's content lives
  under its key. One-shot `scripts/migrate-to-split-languages.mjs` performed the split
  (kept for the record; re-running errors since the flat files are gone).
- **New dynamic loader.** `src/config/content/index.js` now exposes
  `usePageContent(lang, file)` — a `import.meta.glob('./*/*.json')` loader that
  code-splits per language and falls back to `en/` when a page is missing in the active
  language. All 12 page components + HijriStrip + GenericContentPage + Layout now
  async-load content and render a `Loading...` state (no module-scope JSON imports).
  `hasContent(lang, file)` / `getContent(lang, file)` gained the language parameter.
- **Calendar special case.** `en/calendar.json` is the source of truth: `monthStarts`,
  its own `monthNames`/`monthNamesShort`, and `events` carrying a `translations`
  `{lang: {label, description}}` map. `hinglish/calendar.json` has inline Hinglish
  `label`/`description` per event. Admin Calendar editor flattens/rebuilds both via
  `mergeCalendarData` / `writeCalendarSplit` in `scripts/content-editor.mjs`.
- **Admin across languages.** `listPages` reads from `en/`; add/remove-language copies
  into every language folder; `page-rename.mjs` walks `getActiveLanguageDirs()` and
  moves the file in each, transactionally with rollback, keeping the old route as an
  alias. `generate-calendar-events.mjs` writes both en + hinglish calendar files.
- **Hydration gated to production** (`import.meta.env.PROD`) in `main.jsx` — local dev
  uses `createRoot` to avoid hydration mismatch on dynamic/localStorage content.
- **`hijriLabel`** gained a `lang` parameter (Urdu/Arabic year suffix `ھ`); all call
  sites (HijriStrip, Calendar) pass it.
- **Tests sandboxed.** `page-rename.mjs` exposes `overridePaths()` / `restorePaths()`;
  `test-page-rename.mjs` now writes to an `fs.mkdtempSync` temp dir instead of the repo
  — the old runs had left `apply-test-*` artifacts in `src/config/content/` that got
  bundled into production. Leftover artifacts deleted.
- Docs updated (`docs/content.md`, `docs/architecture.md` data flow, `CLAUDE.md` tree +
  content architecture, `README.md`, `MEMORY.md`, `docs/components.md`, `docs/scripts.md`,
  `docs/new-developer-guide.md`) for the split-language structure.

---

## 5.12.1 — 2026-08-05

### User-facing
- **Fixed: today's events no longer appear twice** — an event happening today was shown both in the new "Today's Events" section *and* again at the top of "Upcoming Events". Today's events now appear only in the Today's Events section.

### Internal / docs
- **`src/utils/hijriCalendar.js` `splitUpcomingPast`**: the upcoming boundary changed from `>= today` to `> today` (and the docstring updated), so events mapped to today are excluded from the upcoming list. Today's events already live in their own section on the Calendar page (`todayEvents` in `src/pages/Calendar.jsx`).
- **New tests** in `scripts/test-hijri-calendar.mjs` — a today-dated fixed event must be excluded from *both* the upcoming and past lists, while a strictly-future event stays in upcoming. Test count 123 → 126.
- Public changelog (en + hinglish) 5.12.1 entry; version 5.12.0 → 5.12.1 (bug-fix patch).

---

## 5.12.0 — 2026-08-05

### User-facing
- **Three new themes** — **Indigo** (deep indigo header, violet accent, light lavender page), **Teal** (deep teal header, teal accent, mint page), and **OLED** (true-black `#000000` page/cards, emerald accent — saves battery on OLED screens).
- **Theme swatches in Settings** — the theme picker now shows colored circle swatches (page background + accent dot, with the theme name beneath) instead of text buttons, so themes are recognizable at a glance.

### Internal / docs
- **`src/context/ThemeContext.jsx`**: `themes` array grew 5 → 8; each entry now carries `swatch: { bg, accent }` (taken from the theme's CSS variables) used by the Settings picker. 8 themes total (light, dark, sepia, green, rose, indigo, teal, oled). `ThemeProvider` also now **validates the stored theme against known ids** — a stale/garbage `kqcmm_theme` value (e.g. from a removed theme) falls back to `green` instead of setting an unknown `data-theme` with no CSS block, which previously rendered an unstyled page with no matching swatch selected.
- **`src/styles.css`**: three new `[data-theme]` blocks (indigo, teal, oled) defining the full 16-variable set each — all old themes' variables are covered, and the app's `--bg`-driven surfaces (body, shell) respond to OLED `#000000` automatically. Contrast verified: all new text/bg pairs ≥ 12:1; header-text on header ≥ 6.6:1; muted text on page ≥ 4.2:1 (consistent with existing light theme's muted legibility).
- **`src/components/SettingsPopup.jsx`**: `OptionRow` auto-detects swatch options via `options.some(opt => opt.swatch)` — theme row renders circular two-tone swatches with labels + `aria-pressed`/`aria-label`; all other rows (language/font/size) keep text buttons.
- Docs updated (`README.md`, `CLAUDE.md` theme table + tree, `MEMORY.md`, `docs/styling.md` theme system + comparison table + new "Theme Swatches" section + "Adding a New Theme" step, `docs/components.md` ThemeContext + SettingsPopup tables, `docs/architecture.md` settings diagram, `docs/new-developer-guide.md`); version 5.11.0 → 5.12.0, public changelog bumped (new feature) in en + hinglish.

---

## 5.11.0 — 2026-08-05

### User-facing
- **First-run onboarding walkthrough** — a friendly guided tour greets new visitors on the Home page. It offers a language chooser (English/Hinglish) when no language is saved, spotlights the home cards, demonstrates reading in slide mode with the counter, and guides the user through the menu, settings, and the Hijri date strip. The user drives every step (real guided taps on actual controls); Skip / Esc / Close dismiss it, and **Replay walkthrough** (top of the Settings popup) runs the full demonstration from any route. When the tour finishes, it returns the user to the Home page.

### Internal / docs
- **New `src/components/OnboardingTour.jsx`** — portal-based overlay (`createPortal` to `document.body`) with spotlight highlighting, guided-tap and route-choice step types, `inert`-based modal shell (with live pointer-transparent exceptions for guided taps), Tab focus trap, Esc to skip, focus restore to opener, and automatic drawer/settings close as steps move off those controls. Mounted in `Layout.jsx`; step plan captured per-run (`startPathRef`) so navigation never reorders it. **Finish** (`finish`), because the final `route-choice` step ends off Home, navigates back to `/` (`navigate('/')`) when the current path isn't Home.
- **New `src/utils/onboarding.js`** (pure helpers): versioned record `kqcmm_onboarding_v1` (`version:1, status:'completed'|'skipped'`, plus `completedAt`); storage-failure tolerance; `shouldStartOnboarding` (auto-run only with no record); `needsLanguageChoice` (no saved `kqcmm_lang`); deep-link-aware `onboardingStepsForPath` (Home = 18 steps, deep link = 5 shell steps); frozen `ONBOARDING_TARGETS` map of `data-tour` hooks shared by tests and UI.
- **`data-tour` hooks added** — BottomNav (`bottom-nav`, per-item `bottom-nav-<pageId>`, `bottom-home`), Home quick links (`home-links`, `home-link-<labelKey>`), Layout header (`header-menu`, `header-settings`, `header-share`), HijriStrip (`hijri-strip`), ContentView counter (`counter`, `counter-inc/dec/reset`) and slide nav (`slide-nav`, `slide-first/prev/next/last`); aria-labels added on the previously text-only ±/↺/nav buttons.
- **`ViewContext.jsx`**: added `setViewMode(mode, { track })` (persists + optional GA4 `select_view_mode`); OnboardingTour forces slide mode for the demonstration and restores the user's original value via `import.meta`-free `setViewMode`/`restoreViewMode`.
- **`SettingsPopup.jsx`**: optional `onReplayTour` prop renders a "Replay walkthrough" button at the **top** of the popup body (above Language); adds a `settings-open` class on `<body>` while open.
- **Analytics** (`src/utils/analytics.js`): `onboarding_start{source}`, `onboarding_step{step_id, step_index}`, `onboarding_complete`, `onboarding_skip{reason}`.
- **Strings**: `onboarding` block (lang safe, titles/bodies per step, `progress` "Step {current} of {total}", Next/Back/Skip/Finish/Replay) added to en + hinglish.
- **Styles** (`src/styles.css`): `.tour-*` classes (backdrop, spotlight, panel, buttons, lang chooser) at `z-index` 1000–1002 (above header/drawer/settings, below splash/PWA toasts).
- **Prerender** (`scripts/prerender.mjs`): seeds `kqcmm_onboarding_v1` as completed so the static HTML never captures the tour overlay, plus a smoke-check warning if the tour still appears in output.
- **New test** `scripts/test-onboarding.mjs` (pure, fake-storage; validates record parse, start/skip gate, step counts & target/order for home vs deep-link) — wired into `npm test`.
- Docs updated (`docs/components.md` new OnboardingTour section + Layout/ViewContext/SettingsPopup, CLAUDE.md project tree, README); version 5.10.1 → 5.11.0, public changelog bumped (new feature).

---

## 5.10.1 — 2026-08-04

### User-facing
- **Today's Events section on the calendar** — when events fall on today, all of them are listed (split into Monthly | Other columns, same as Upcoming/Past); otherwise the previous next-event countdown strip shows.
- **Fixed: bottom nav / counter bar gap** — the fixed counter and slide bars sat ~8px above the nav on devices with an 8px safe-area inset, and the nav itself was shifted 8px past the viewport bottom (UA body margin).
- **Fixed: Hijri grid month navigation** — the min/max nav bounds compared month keys as strings ("1447-11" < "1447-3"), disabling the prev arrow at 1447-12 so the first configured month was unreachable. Now a numeric key (year×100 + month).
- **Fixed: event list scroll jump** — the calendar's event list columns snapped to top mid-scroll because the sort comparator never returned 0 for equal dates and the occurrence lists were recomputed each render (60s today tick). Memoized + stable comparator.

### Internal / docs
- **Calendar.jsx**: `useMemo` on `occurrences`/`todayEvents`/`available`; stable sort (0 for equal, tie-break by `id`); consolidated duplicate `isMonthly`.
- **Layout geometry fixes** (`BottomNav.jsx`, `styles.css`): `--bottom-nav-height` now published as `window.innerHeight − nav.getBoundingClientRect().top` via a ResizeObserver (absorbs safe-area automatically); explicit `body { margin: 0 }`; `min-height: 0` on `.main-content`; `.bottom-nav { height: auto }` (the var must not drive the nav's own height — feedback loop).
- **Strings**: `calendar.todayEvents` added to en/hinglish.
- Docs updated (`docs/components.md`): Today's Events section, memoization/scroll-stability note.

---

## 5.10.0 — 2026-08-03

### User-facing
- **Islamic calendar ships 2,350 Blessed Days events** — Urs (passing) dates of Sufi awliya and scholars, plus birthdays and special nights, across all 12 Hijri months. Imported from the recovered thesunniway dataset via a deterministic generator (`npm run calendar:gen`); kept as individual `hijri-fixed` events alongside the original 14 admin-managed events (2,364 total).
- **New Rose theme** in Settings (Light/Dark/Sepia/Green/Rose).
- **Two more font sizes** — X-Small (12px) and XX-Large (24px), six sizes total.
- **Capped event dots** — calendar grid cells (max 3 dots + `+N`) and the Hijri strip (dot cluster, no event text) stay compact on busy dates.
- **Removed "Not yet configured" section** — unplaceable events are no longer listed as chips.

### Internal / docs
- **Day-30 rule changed** (`src/utils/hijriCalendar.js` `mapFixedEventToMonth`): day-30 events now default to valid — every month is treated as 30 days until a next-month boundary is set; once set, only the proven length renders (29-day months exclude day 30; the last boundary-less month keeps day 30).
- **Hijri grid bug fixed** (`buildMonthGrid`): grid hardcoded 30 cells, so a 29-day month rendered a phantom "30 Muharram" (= actually 1 Safar). Grid now caps at the proven length (fallback 30 only without a boundary), matching the Gregorian view.
- **New generator** `scripts/generate-calendar-events.mjs` (`npm run calendar:gen`) + committed source `scripts/data/events_merged.json` (2,350 records, filesystem-only, never Vite-bundled). Deterministic + idempotent: preserves existing events, id `thesunniway-<id>`, label = englishName + suffix, description = event type + wisal year, no translations.
- **Theme/font counts updated repo-wide** — 5 themes (Light/Dark/Sepia/Green/Rose), 6 font sizes (12–24px); docs (README, CLAUDE.md, `docs/styling.md`, `docs/components.md`, `docs/architecture.md`, `docs/new-developer-guide.md`, `docs/hijri-calendar-plan.md`, `docs/content.md`, `docs/scripts.md`) refreshed; `docs/hijri-calendar-plan.md` test count 46→123.

---

## 5.9.0 — 2026-08-03 (analytics)

### Internal / docs
- **Google Analytics 4 tracking added** (`index.html` gtag snippet + `src/utils/analytics.js`).
  - No public changelog/version bump — invisible to end users.
  - To activate: replace the `G-XXXXXXX` placeholder Measurement ID with the real GA4 property ID in `index.html`.
  - SPA page views tracked in `Layout.jsx` via `useLocation` (basename stripped). Custom events: `select_language`, `select_theme`, `select_view_mode`, `counter_use` (ContentView), `slide_view` (slide nav), `splash_skip`, `pwa_install` (appinstalled).
  - `gtag()` is a safe no-op until the ID is configured; never breaks the app.
- **GA4 error tracking** — `src/utils/analytics.js` adds `initErrorTracking()` (called in `main.jsx`) wiring global `error` / `unhandledrejection` to GA4 `exception` events. GA-script errors are skipped. No public bump.
- **More granular GA4 events** — `share_used` (Layout share), `quick_jump_open`/`quick_jump_select` (QuickJump, new `page` prop at its 4 call sites: Dua/FatehaKhwani/Khatm/Roshni), `adjust_font_size`/`select_font_family` (FontContext), `calendar_nav`/`calendar_toggle` (Calendar prev/next/today + Hijri↔Gregorian switch).
- **New docs** — `docs/ga4-setup.md` (GA console steps for conversions, own-traffic IP exclusion, custom dimensions + dashboard, enhanced measurement); linked from README, docs/index.md, docs/analytics.md, `analytics.md` events table + error tracking section updated. Internal — no public changelog/version bump.

---

## 5.9.0 — 2026-08-01

### User-facing
- Calendar event lists grouped into **Monthly** and **Other** sections, shown side by side (Upcoming and Past both always visible).
- Each Monthly/Other list **scrolls internally** within a fixed height — the page no longer grows endlessly with recurring events.
- Two-column layout **stacks to a single column on mobile** (<640px).

### Internal / docs
- **Custom pages now render publicly.** Admin-created/duplicated pages are registered in `pageRoutes.json` as `{ custom: true, renderer: 'generic' }` with a stable `custom-…` id, routed by `GenericContentPage.jsx`, and rendered by `GenericContentRenderer.jsx`. Supports `sections`/`duas`/`items`/`verses`/`lineage`/`paragraphs`, Fateha `|||`+`::` master-child blocks, and safe plain-text rendering of unknown fields (no raw HTML). Create/duplicate/delete/rename are transactional on content + registry (+ nav for delete). Deleting removes nav refs by `pageId`. NavEditor gained a page-picker and per-row `pageId` editing. Locale fallback lives in `src/config/content/locale.js` (requested → en → first, `quickJump` excluded). Prerender includes custom routes automatically. **Not a user-facing public change** — no version bump in `changelog.json`.
- Docs expanded for the custom-pages feature: `docs/components.md` documents `GenericContentPage`/`GenericContentRenderer`/`genericContent.js` (supported shapes, safety rules, bounds); `docs/content.md` adds a **Custom Pages** section (registry entry shape, active-languages-only templates via `generateTemplate`+`activeLanguages`, transactional CRUD, build-time glob) and nav `pageId`/`routeForNavItem` resolution; `docs/deployment.md` and `README.md` note routes are registry-driven. Docs-only — no public changelog/version bump.
- Admin panel: added ✏️ **Rename** for fixed pages (slug + route). Renames the content JSON file, updates the public route in the page-route registry, and keeps the old route as a redirect alias so existing links keep working. **Not a user-facing public change** — no version bump in `changelog.json`.
- New `src/config/pageRoutes.json` registry: stable `id`, `component`, `contentFile`, `route`, `titleKey`, `renamable`, `aliases`. `App.jsx` renders routes from it and adds `<Navigate>` redirects for aliases; `Layout.jsx` title map, `Home.jsx` quick links, `SideDrawer`/`BottomNav`, `HijriStrip`, and `SeoHead` paths all resolve routes from it.
- New content loader `src/config/content/index.js` (Vite eager glob) — fixed page components load content by basename instead of direct JSON imports, so a rename no longer breaks source imports.
- `navigation.json` entries gained a stable `pageId` (kept `to`/`key`/`icon` for NavEditor compatibility); nav components prefer the registry route.
- `scripts/page-rename.mjs`: shared `validateSlug` / `buildRename` / `applyRename` with atomic writes + rollback; CLI `node scripts/page-rename.mjs <pageId> <newSlug> [--dry-run]`.
- `scripts/content-editor.mjs`: new `POST /api/page/rename`; generic page GET/POST/DELETE/duplicate/create routes now validate names server-side (path-traversal hardening); `/api/pages` returns `pageId`/`route`/`canRename`.
- `scripts/prerender.mjs`: route list derived from the registry (canonical + aliases).
- New tests `scripts/test-page-rename.mjs` (slug validation, collision/reserved, rename-back, rollback); wired into `npm test`.
- `Calendar.jsx`: event lists split into monthly vs other (rule-based), `EventColumn` renders each as a scrollable vertical column; removed the earlier horizontal-strip/tab approach.
- `styles.css`: `.cal-col-grid`, `.cal-col`, `.cal-ev-scroll` + a `@media (max-width: 640px)` stack rule.
- Admin Translate page fixes (`LanguageEditor.jsx`): language list now derived from `/api/strings` (not object-key guessing — calendar's `monthNames`/`monthNamesShort` were showing as fake languages); removed detection race and hardcoded lang defaults; empty arrays show `[empty]` not `0/0`.
- `docs/scripts.md`: documented the translation-% formula (`countFields` in `LanguageEditor.jsx`, `CONTENT_KEYS` list) — raw fill, not translation parity. No public version bump (admin-internal only).
- `index.html`: removed the browser favicon link. PWA manifest icons (install app) kept.
- `strings` (en/hinglish): Monthly / Other Events labels.
- Docs updated (CLAUDE.md, docs/architecture.md, docs/scripts.md, docs/seo.md, docs/content.md, docs/components.md); version 5.8.0 → 5.9.0.

---

## 5.8.0 — 2026-08-01

### User-facing
- Tap the Hijri date strip (top of every page) to open the Islamic Calendar.
- Calendar events can repeat every month on a chosen Hijri date (`hijri-monthly` rule).
- Past calendar events listed newest-first (descending).

### Internal / docs
- `hijri-monthly` event rule: validator + enumeration (incl. last-configured-month pass); admin "Monthly" rule option.
- Past-list dedup fix: monthly events now show every past occurrence; extracted `splitUpcomingPast` (pure) returning past events descending.
- Admin: header save button + live saved/unsaved status across Calendar/Strings/Nav/Settings (forwardRef + onStatusChange); `useApi` memoized to stop edits being wiped by re-renders; hooks-order + TDZ bugs fixed.
- Admin: month-starts editor rebuilt as a compact free-form add/remove/sort table (scales to 100+ months).
- Clickable `HijriStrip` navigates to `/calendar`.
- Docs updated (components.md, content.md, CLAUDE.md, README.md, DEVCHANGELOG); version 5.7.0 → 5.8.0.

---

## 5.7.0 — 2026-08-01

### User-facing
- Calendar page rebuilt as a navigable month grid — switch between Hijri and Gregorian views, browse months, event days marked.
- Today's Hijri + Gregorian date shown in a thin strip below the header on every page (new `HijriStrip` component).
- Calendar view mode (Hijri/Gregorian) persisted in localStorage.
- 3-letter Hijri month abbreviations in compact grid spots.

### Internal / docs
- `buildMonthGrid` refactored to take an explicit target `{year, month}`; added `buildGregorianMonthGrid`, `hijriMonthOf`, `gregorianMonthOf`.
- Calendar CSS converted to em-based sizing so it inherits the app font-size setting.
- Contrast fix: accent-background elements use white text.
- Docs updated (components.md, content.md, CLAUDE.md, README.md); version 5.6.0 → 5.7.0.

---

## 5.6.0 — 2026-08-01

### User-facing
- Hijri Calendar: today's Islamic date, upcoming event countdown, events mapped automatically.
- Monthly recurring events — repeat on the same Hijri date every month (`hijri-monthly` rule).
- Admin panel: dedicated Calendar editor to set each Hijri month's start date and manage shared events.

### Internal / docs
- New `schemaVersion: 1` in `calendar.json`: top-level `monthStarts` (37 slots) + shared `events` + `monthNames`.
- New `src/utils/hijriCalendar.js`: DST-safe date arithmetic, `gregorianToHijri`, `enumerateOccurrences`, `nextOccurrence`, `validateCalendarConfig`, `splitUpcomingPast`.
- `hijri-monthly` rule: validation + enumeration incl. last-configured-month pass.
- Past-list dedup bug fix — monthly events now show every past occurrence.
- Admin: `/api/calendar` GET/POST with server-side validation; `calendar.json` hidden from generic Pages editor.
- Tooling: `fetch-content.mjs` / `translate-content.mjs` skip calendar (admin-managed).
- 95 unit tests (`npm test`); docs updated; version 5.5.0 → 5.6.0.

---

## 5.5.0 — 2026-07-29

### User-facing
- Improved admin panel: manage languages, translation status, navigation, and page content more easily.

### Internal / docs
- Admin panel features: language add/remove across all pages+strings, clickable translation %, reusable Modal, responsive sidebar, type-aware content editor, visual nav editor, global search.
- Sijrah Nama fixed to use ContentView with slide mode.
- `quickJump` moved from per-language to a shared top-level list; labels derived from source items.
- CI: docs-only pushes skip the GitHub Pages deploy (`paths-ignore`), `workflow_dispatch` + `concurrency` added.
- Doc-drift audit: Urdu marked "planned" (not live), corrected stale counts.
- `update-docs` skill now runs a drift audit every time.

---

## 5.4.0 — 2026-07-26

### User-facing
- Improved swipe sensitivity in slide mode — accidental touches no longer trigger navigation.
- Updated Roshni and Dua icons.

### Internal / docs
- Icons: Roshni `faFire → faLightbulb`, Dua `faHandsPraying → faMosque`.
- Swipe logic: higher threshold, ignores vertical scroll.

---

## 5.3.0 — 2026-07-24

### User-facing
- App auto-updates silently on deploy — no more refresh prompt.
- Urdu fonts now load properly from Google Fonts.

### Internal / docs
- Windows-compatible build script (`fs.copyFileSync` instead of `cp`).
- Cleaned up duplicate string files.
- Added 7 new suggestions (27 total), reorganized categories.

---

## 5.2.0 — 2026-07-23

### User-facing
- Swipe navigation (left/right) in slide mode.
- Install App button in bottom navigation.
- New About page with version info.
- New Changelog page.

### Internal / docs
- Added Suggestions document with future ideas.

---

## 5.1.0 — 2026-07-22

### User-facing
- Full SEO: unique titles and descriptions per page, social sharing previews.

### Internal / docs
- Open Graph + Twitter Card meta tags per page.
- OG image for social sharing.
- Fixed asset paths for direct sub-page access.

---

## 5.0.0 — 2026-07-22

### User-facing
- Full offline support — the app works without an internet connection.
- Installable as an app (PWA) with proper icons.
- Splash screen now skips on repeat visits.

### Internal / docs
- Service Worker with full offline caching; PWA manifest.

---

## 4.0.0 — 2026-07-22

### User-facing
- Faster page loads with pre-rendered content.
- New home page quick links (Roshni, Abbajaan).

### Internal / docs
- Pre-rendering for SEO performance.
- Counter bar width fix for desktop.

---

## 3.0.0 — 2026-07-21

### User-facing
- QuickJump navigation — jump to key sections of long pages.
- Khatm and Fateha Khwani content completed.

### Internal / docs
- All content fully translated (English, Hinglish, Urdu).
- `quickJump` introduced.

---

## 2.0.0 — 2026-07-20

### User-facing
- Content Editor web UI (`npm run edit`) — edit content without touching files.
- Master-child card layout for Fateha Khwani.
- Icons throughout the app.

### Internal / docs
- FontAwesome centralized icon component.

---

## 1.0.0 — 2026-07-10

### User-facing
- Initial release with all pages.
- 4 themes (Light, Dark, Sepia, Green).
- 3 languages (English, Hinglish, Urdu).
- 17 fonts with 4 sizes.
- List and Slide view modes.
- Splash screen.

### Internal / docs
- Initial codebase; content JSON structure.
