# Developer Changelog

**Holds EVERYTHING** — user-facing and internal (refactors, docs, build, admin internals, tooling). The public [`/changelog`](content.md#changelog) shows only user-facing changes; this file is the complete record.

Maintain both changelogs together when work lands. Latest version at the top.

---

## 5.9.0 — 2026-08-01

### User-facing
- Calendar event lists grouped into **Monthly** and **Other** sections, shown side by side (Upcoming and Past both always visible).
- Each Monthly/Other list **scrolls internally** within a fixed height — the page no longer grows endlessly with recurring events.
- Two-column layout **stacks to a single column on mobile** (<640px).

### Internal / docs
- **Custom pages now render publicly.** Admin-created/duplicated pages are registered in `pageRoutes.json` as `{ custom: true, renderer: 'generic' }` with a stable `custom-…` id, routed by `GenericContentPage.jsx`, and rendered by `GenericContentRenderer.jsx`. Supports `sections`/`duas`/`items`/`verses`/`lineage`/`paragraphs`, Fateha `|||`+`::` master-child blocks, and safe plain-text rendering of unknown fields (no raw HTML). Create/duplicate/delete/rename are transactional on content + registry (+ nav for delete). Deleting removes nav refs by `pageId`. NavEditor gained a page-picker and per-row `pageId` editing. Locale fallback lives in `src/config/content/locale.js` (requested → en → first, `quickJump` excluded). Prerender includes custom routes automatically. **Not a user-facing public change** — no version bump in `changelog.json`.
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
