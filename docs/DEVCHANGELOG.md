# Developer Changelog

**Holds EVERYTHING** — user-facing and internal (refactors, docs, build, admin internals, tooling). The public [`/changelog`](content.md#changelog) shows only user-facing changes; this file is the complete record.

Maintain both changelogs together when work lands. Latest version at the top.

## 7.1.0 — 2026-10-16

### User-facing
- **Finger-following slide swipes** — the current slide translates with the drag (rubber-banded at first/last), then commits on distance (>72px) or flick velocity (>0.55px/ms) and springs back otherwise. Two-phase settle: the dragged card slides out, the next enters directionally.
- **Cursor spotlight** — desktop pointers paint a soft accent light on cards/tiles (`--spot-x/--spot-y` radial). Touch-only and reduced-motion devices skip it entirely.
- **Scroll reveals** — below-fold cards/sections rise into view (`.rv` → `.rv-in`); above-fold stays untouched (View Transition snapshots must not capture hidden content); slide-stage cards excluded (they have directional entry already).
- **Splash scene** — splash image stays full-bleed and uncropped (`object-fit: fill`, as before); aurora orbs (shared `auroraDrift`) + twinkling star field sit behind it as a loading backdrop; countdown is a glass pill with a conic progress ring (`--splash-pct`).
- **Expanding dock** — inactive tabs icon-only; active tab `flex-grow: 2.4` into the gradient pill with animated label (`max-width`/`margin`); install tab keeps its label.
- **Counter tap ring** — keyed `.cnt-pulse` ring (cntRing) fired on every count change.

### Internal / docs
- **`src/utils/spotlight.js` (new)** — single document `pointermove` listener (passive) + rAF; sets `--spot-x/--spot-y` only on the matched target (`:is(.card, .quick-link, .dash-continue, .dash-dua, .moon-card, .book-card-item)`).
- **`src/utils/reveal.js` (new)** — IntersectionObserver + MutationObserver (async content) scanner rooted at `.main-content`; WeakSet-guarded; 60ms debounce; skips `.slide-stage`, short elements, reduced-motion.
- **`src/components/ContentView.jsx`** — swipe handlers rewritten (drag ref, `stageEl()` inline-style driving, settle timer with unmount cleanup); `wrapRef` on the slide scroller; `onTouchCancel`.
- **`src/styles.css`** — SPATIAL SHELL section (spotlight `::after` on the six target types, `.rv/.rv-in`, `.cnt-pulse`); splash block replaced (scene classes); dock block reworked (row layout, `.nav-label`, flex-grow transition).
- **`src/components/BottomNav.jsx`** — labels wrapped in `.nav-label` spans; install tab gets `.is-install`.
- **`src/components/SplashScreen.jsx`** — scene markup (aurora, stars, logo ring, arch, conic countdown).
- **Version bump** — 7.0.0 → 7.1.0 in package.json, About.jsx, public changelogs (en + hinglish) and this file.
- Verified: full build (15 routes + 404), 353 tests.

---

## 7.0.0 — 2026-10-16

### User-facing
- **Aurora body** — the entire app now sits on a living gradient canvas: four blurred radial orbs (built from each theme's accent trio) drift slowly behind every screen, with a soft film-grain overlay. Replaces the flat solid-background shell.
- **Floating glass copilot bar** — the header + Hijri strip are now one inset, rounded, blurred glass pill hovering over the content (was: full-width colored bar with a solid accent strip). Buttons, language pills and the strip were recolored for glass; strip shows accent-on-muted text with a hairline divider.
- **Moon phases** — a real feature derived from the stored Hijri calendar data: an animated SVG moon shows today's phase on the home date hero and a "Tonight's Moon" card on the Calendar page (phase name + illumination %). Pure computation from `monthStarts` (each Hijri month begins at the new crescent).
- **Energetic color + type** — explore tiles rotate three vivid gradient chips; bigger radii (12/18/26), heavier display headings, uppercase tracked eyebrows, letter-spacing tune-ups.
- **Book cover morph** — opening a book from the library animates the cover into the reader hero (named view transition per slug).

### Internal / docs
- **`src/styles.css`** — new "AURORA (7.0.0)" section at the end: `--accent-3` for all 12 themes, `.app-shell` canvas (`::before` orbs + `auroraDrift`, `::after` SVG-turbulence grain, `isolation: isolate`), `.main-content` transparent (aurora shows through), glass pill chrome + hijri strip restyle, `body.zen`-compatible hidden transform, moon classes (`.moon-dark/.moon-lit/.moon-ring`, `.dash-moon*`, `.moon-card*`), type upgrades, tile gradients. Token scale bumped (`--radius-sm/md/lg` 12/18/26).
- **`src/utils/moonPhase.js` (new)** — `moonPhaseInfo(hijriDay, monthLength) → { key, fraction, illumination }`; 8 phase keys; boundaries: new <0.04/≥0.98, quarters at 0.22–0.28 / 0.72–0.78, full 0.45–0.55; clamps day/len with 30-day fallback. Pure.
- **`src/utils/hijriCalendar.js`** — new `hijriMonthLength(monthStarts, hijriYear, hijriMonth)`: 29/30 from the distance between stored month starts; 30 fallback for the last entry.
- **`scripts/test-moon-phase.mjs` (new)** — 31 assertions (phase mapping 29/30-day months, illumination monotonicity, clamping, month-length lookup); wired into `npm test` (353 total).
- **`src/components/MoonPhaseIcon.jsx` (new)** — SVG phase renderer: outer limb semicircle + elliptical terminator with `rx = R·|cos(2π·fraction)|`, sweep flags by waxing/waning; no assets.
- **`Home.jsx`** — date-hero memo computes `moon` via `hijriMonthLength` + `moonPhaseInfo`; `.dash-moon` block (icon + phase label) inside the hero; hero gets symmetric 96px side padding.
- **`Calendar.jsx`** — "Tonight's Moon" `.moon-card` under the page title (icon + phase + illumination %).
- **`BooksIndex.jsx` / `BookReader.jsx`** — `viewTransitionName: book-cover-<slug>` on covers for the morph.
- **Strings** — `moon.*` (title, illuminated, 8 phases) added to en + hinglish.
- **Docs sync** — `docs/styling.md` (Aurora section, moon classes, utility table), `docs/components.md` (MoonPhaseIcon, moon utils, cover morph), `CLAUDE.md` (version, tree, conventions).
- **Version bump** — `6.2.0` → `7.0.0` (major: new visual system), synchronized package.json, About.jsx, dev changelog, and public changelogs in English and Hinglish.

---

## 6.2.0 — 2026-10-16

### User-facing
- **Page transitions** — native View Transitions on every navigation: old page sinks away, new page springs up (tabs, menu, home cards, book covers, back links, 404 CTA, Hijri strip).
- **Directional slide mode** — the next slide enters from the side you're moving toward (forward = from right, back = from left); swipes animate the same way.
- **Rolling counter** — the zikr counter number rolls into place on every +/− change.
- **Skeleton loaders** — every page's plain "Loading..." text replaced with shimmering placeholder cards (mihrab-arched hero placeholder) that preview the layout while content loads.
- **Copy toast** — sharing now shows a soft gradient confirmation pill at the top instead of a browser alert.
- **Aurora hero** — the dashboard "today" card has a slow rotating conic light behind the arch.
- **Modern details** — thin scrollbars, `100dvh` viewport (mobile URL-bar safe), `text-wrap: balance/pretty` line breaking.

### Internal / docs
- **`ContentView.jsx`** — `dir` state; keyed `.slide-stage` (`.from-right`/`.from-left`); swipes routed through `goTo()` so direction tracking stays correct; keyed `.cnt-digit` roll; inline mount animation removed from the slide container.
- **`ContentSkeleton.jsx` (new)** — `{ rows, hero }` shimmer placeholders; consumed by all 14 content pages + `Layout` fallback (`About`/`Changelog` use `hero={false}`).
- **`src/utils/toast.js` (new)** — `showToast(message)` vanilla DOM pill (`#app-toast`, reflow-replay enter, 2s auto-dismiss, `role="status"`); used by Layout + BookReader share (both `alert()` calls removed).
- **View transitions** — `viewTransition` prop: BottomNav tabs, SideDrawer menu links, Home (date hero, continue, dua, quick links), HijriStrip, BooksIndex covers, BookReader back links, About version link, NotFound CTA. `::view-transition-old/new(root)` keyframes (vtOld/vtNew); `html:active-view-transition` guard suppresses mount/stagger animations during snapshot capture; reduced-motion overrides for the pseudo-elements.
- **`styles.css`** — skeleton (`.skel*`, `skelSweep`), toast (`.app-toast`), aurora (`dash-date::after` conic + `auroraSpin`), scrollbars, `100dvh`, text-wrap, motion system section.
- **Docs sync** — `docs/styling.md` (skeleton/toast/aurora/modern details in shell sections), `docs/components.md` (ContentSkeleton, toast util, ContentView motion), `CLAUDE.md` (version, tree, motion conventions).
- **Version bump** — `6.1.0` → `6.2.0`, synchronized package.json, About.jsx, dev changelog, and public changelogs in English and Hinglish.

---

## 6.1.0 — 2026-10-15

### User-facing
- **Full-screen magazine menu** — the side drawer is gone; the top-left button now opens a full-viewport menu with numbered editorial links (01–15), staggered entrance animations, icon chips, and a star-pattern backdrop. Escape and backdrop-tap close it.
- **Dashboard Home** — replaced the logo-hero + tiles page with: compact brand row, mihrab-arched "today" hero (Hijri date + up to two event labels, taps through to the calendar), continue-reading card (last opened book + saved chapter + progress bar), dua of the day card (rotates by day of month), then the config-driven explore grid and a closing ornament.
- **Focus reading mode** — every content page (including books) now has an expand button in the reading bar; it hides the top chrome, bottom dock, reading progress and quick-jump FAB while reading, and restores everything on exit or route change.
- **Immersive chrome** — the header + Hijri strip slide away when reading downward (>140px) and return on scroll-up; a 3px gradient reading-progress line tracks scroll position.
- **Mihrab hero arches** — content page heroes now use a 150px domed top radius with a subtle 8-point star-tile pattern over the accent mesh.

### Internal / docs
- **`SideDrawer.jsx`** — rewritten as the full-screen menu (`.menu-panel`, `.menu-overlay`, `.menu-link*`); `data-tour="drawer-nav"` preserved; `drawer-bg.jpg` public asset no longer referenced.
- **`Home.jsx`** — dashboard restructure; loads calendar/dua/books-index via `usePageContent` (module-cached after first import); new `strings.home.*` keys (en + hinglish): `explore`, `continueReading`, `duaOfDay`, `readNow`, `chapter`.
- **`BookReader.jsx`** — writes `kqcmm_last_book` (localStorage, best-effort) on open so Home can offer continue-reading.
- **`Layout.jsx`** — header + HijriStrip wrapped in a fixed `.top-chrome` that publishes `--chrome-h` (ResizeObserver); `.main-content` reserves that space; rAF-throttled scroll listener drives `--read-progress` and the chrome hide/show; refs `shellRef`/`chromeRef`; state renamed `menuOpen`.
- **`ContentView.jsx`** — zen toggle (body class `zen`), reading bar now always rendered (books included); `.zen-btn` with `faExpand`/`faCompress` (iconMap additions); reading bar radius 24 (dock match) and drops into the dock slot while zen is active.
- **`styles.css`** — `.top-chrome`/`.read-progress`, mihrab `.page-hero` + SVG star pattern, `.menu-*` system, `.dash-*` system, `.ornament`/`.pattern-layer` shared utilities, `body.zen` rules; z-order: reading bar 55 · dock 60 · chrome 100 · reading progress 102 · quick-jump backdrop/sheet 150/160 · menu 200/201.
- **Docs sync** — `docs/components.md` (menu overlay, dashboard Home, Layout chrome, ContentView zen), `docs/styling.md` (menu/dash/chrome/zen primitives, utility table), `CLAUDE.md` (version, tree notes, conventions).
- **Version bump** — `6.0.0` → `6.1.0`, synchronized package.json, About.jsx, dev changelog, and public changelogs in English and Hinglish.

---

## 6.0.0 — 2026-10-15

### User-facing
- **"Noor" full redesign** — the app received a completely new visual identity across all 12 themes: per-theme gradient accents (`--accent-2`), glassmorphism surfaces, luminous depth tiles, pill-shaped gradient eyebrows, and refined wordmark typography. This is a breaking visual change over the 5.x look.
- **Floating glass dock** — the bottom navigation is now a floating glass dock (fixed, inset 12px, radius 24px, backdrop blur) with a gradient pill for the active tab and a `navPop` animation; the header gains a 2px gradient seam.
- **Home rework** — new star-and-crescent watermark, gradient logo ring, "Explore" section label, gradient wordmark title (with dark/OLED bright override), and depth-tile quick links with gradient icon chips.
- **Content pages & reading dock** — cards are borderless with layered shadows, gradient accent rails, gradient title markers and numeral badges; the counter/slide bar floats in a glass capsule above the dock with `clamp()` sizing for small phones.
- **Sheets** — Settings is a bottom sheet on mobile / centered panel on desktop (grab handle, blurred backdrop, hairline sections, segmented List/Slide control); Quick Jump is a glass sheet with rounded hover rows and gradient number chips; the walkthrough panel gets gradient progress and primary buttons.
- **Standalone pages** — splash countdown is now a pulsing glass pill with a circular number badge; changelog timeline gets gradient dots/chips; About version number is gradient text; 404 shows a larger gradient numeral with a gradient-deep button.

### Internal / docs
- **Token layer (`src/styles.css` `:root`)** — `--accent-2` added to all 12 theme blocks; derived tokens `--accent-grad`, `--accent-grad-deep` (84% accent + `#111`, safe for white text on amber/gold), `--glass-bg`, `--glass-border`, `--hairline`, `--shadow-md`, `--shadow-lg`, `--glass-blur` built with `color-mix()`; `--radius-md` 14→16px, `--radius-lg` 20→22px.
- **`BottomNav.jsx`** — dock is `position: fixed` and publishes `--bottom-nav-height` (viewport bottom → dock top); `.main-content`/`.reading-bar` consume it; z-index map: dock 60, reading bar 55, header 100, drawer 201, settings 301, tour 1000–1002, splash 9999.
- **`SettingsPopup.jsx`** — inline-styled backdrop and scroll body converted to `.settings-backdrop` (blur) and `.settings-modal-body` classes; close button now FA `faXmark`.
- **`SplashScreen.jsx`** — countdown markup split into `.splash-count-text` + `.splash-count-num` (dot trail removed).
- **`Home.jsx`** — `.home-hero-mark`, `.home-logo-ring`, `.home-eyebrow`, `.home-section-label` markup added; quick-link chevron removed.
- **Docs sync** — `docs/styling.md` (Noor token layer, dock, sheets, reading dock), `docs/components.md` (dock/sheet/splash behavior), `CLAUDE.md` (version, Noor styling conventions).
- **Version bump** — `5.19.0` → `6.0.0`, synchronized package.json, About.jsx, dev changelog, and public changelogs in English and Hinglish.

---

## 5.19.0 — 2026-10-15

### User-facing
- **Full UI revamp completed** — the remaining pages and shared shell components (Duas, Khatm-e-Khwajagan, Fateha Khwani, Roshni, Sijrah Nama, About, 404, Home hero, header, bottom nav, drawer, quick jump, Hijri strip, reading bar) now share one modern design language: hero headers and numbered cards on content pages, icon chips in navigation, tactile press feedback everywhere.
- **Changelog timeline** — `/changelog` renders versions as a vertical timeline (accent dots, version chips, "Latest" badge, dates, custom list markers).
- **Haptic feedback** — `hapticTap()` vibration on tab, drawer, slide/counter, quick-jump, settings option and view-mode taps (supported devices only; safe no-op elsewhere).
- **Walkthrough progress bar** — the onboarding tour panel shows a track/bar beneath "Step X of Y", width `((stepIdx+1)/steps.length)×100%`.
- **Settings & splash polish** — icon-based List/Slide buttons with FA `faList`/`faBookOpen`, class-based replay button, option-tap haptics; splash gets a slow `splashZoom` settle, bottom shade gradient, and blurred countdown pill; About version card links to `/changelog`; refreshed 404 (gradient code, pill button).

### Internal / docs
- **Design tokens (`src/styles.css` `:root`)** — `--radius-sm/md/lg` (10/14/20px), `--ease-spring` (`cubic-bezier(0.16, 1, 0.3, 1)`), `--focus-ring`; global `:focus-visible` accent outline, accent `::selection`, transparent tap-highlight, and a blanket `prefers-reduced-motion` override appended at the end of the stylesheet.
- **Card system upgrade** — `.card` layered shadows + hover lift (gated by `@media (hover: hover)`); `.card-title` heading-colored with accent marker bar (suppressed in `.card-head`/`.borderless`); new `.card-head`/`.card-num` numbered-card primitives; `.page-hero*` hero primitives; `.page-title` gradient underline.
- **`src/utils/haptics.js` (new)** — `hapticTap(ms = 10)` wraps `navigator.vibrate` with a safe no-op; called from gesture handlers only (never on mount).
- **`ContentView.jsx`** — slide-nav/counter bar converted from inline styles to classes (`.reading-bar`, `.slide-group`, `.slide-btn`, `.slide-pos`, `.counter-group`, `.cnt-btn`, `.cnt-value`, `.cnt-reset`).
- **`FontAwesome.jsx`** — iconMap adds `faDownload`, `faMoon`, `faChevronRight`, `faArrowRight`, `faList`.
- **`SettingsPopup.jsx` / `SplashScreen.jsx` / `NotFound.jsx` / `Changelog.jsx` / `About.jsx` / `OnboardingTour.jsx`** — class-based markup, FA icons replacing emoji, haptics, tour progress bar.
- **Docs sync** — `docs/styling.md` (design tokens, accessibility/motion, haptics table, card + page primitives, utility classes, splash), `docs/components.md` (ContentView styling hooks, BottomNav, SettingsPopup, SplashScreen, tour progress bar), `CLAUDE.md` (version, `haptics.js` in tree, styling conventions).
- **Version bump** — `5.18.0` → `5.19.0`, synchronized package.json, About.jsx, dev changelog, and public changelogs in English and Hinglish.

---

## 5.18.0 — 2026-10-13

### User-facing
- **App-wide UI Revamp across key pages** — Modernized the visual hierarchy, typography, cards, and interactive flows while strictly maintaining the app's existing 11+ semantic theme tokens without external CSS frameworks.
- **Calendar Page Modernization** — Added multi-attribute search across 2,360+ Islamic occasions, category filter chips (All, Festivals, Blessed Saints / Urs, Monthly), and an interactive day inspector detail panel upon clicking any calendar grid cell.
- **Biographies & History Modernization** — Updated `Hmk.jsx`, `SalimPappa.jsx`, and `Abbajaan.jsx` with prominent hero banners, category badges, numbered chronology timelines, and styled quote cards.
- **Books Library & Reader Modernization** — Revamped `/books` index grid with realistic aspect-ratio covers, spine accents, and metadata badges. Added styled cover headers and reading progress cards to `/books/:slug`.
- **Home & Settings Polish** — Upgraded home quick links with elevated hover states and accent borders, and updated SettingsPopup into a structured modal dialog with clean option groupings.

### Internal / docs
- **Edge Prerender Resolution on Windows** — Configured fallback resolution for Microsoft Edge (`C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`) in `scripts/prerender.mjs` for seamless static SEO prerendering on Windows development machines.
- **React Hook Order Regularization** — Ensured all hook calls in `Calendar.jsx` run unconditionally on every render, preventing hook count discrepancies across data loading states.
- **Version bump** — `5.17.0` → `5.18.0`, synchronized package.json, About.jsx, dev changelog, and public changelogs in English and Hinglish.

---

## 5.17.0 — 2026-09-02

### User-facing
- **Added new Dua** — *Khwaja, The Refuge of the Destitute* (*Ghareebon Ke Sahare, Khwaja*) added to `src/config/content/en/dua.json` and `src/config/content/hinglish/dua.json`.

### Internal / docs
- **Version bump** — `5.16.1` → `5.17.0`, public and developer changelogs synchronized.

---

## 5.16.1 — 2026-08-10

### User-facing
- **Home tile icons now follow the theme accent** — `src/styles.css` `.quick-link .ql-icon` gains `color: var(--accent)`. Previously the tile icons inherited `--text` (near-black in light themes), so the theme visibly tinted the bottom nav but not the home tiles. Now every accent theme (Teal, Indigo, Gold, Amber, OLED, …) tints the tiles consistently with the active bottom-nav tab.
- **Reading font sizes bumped** — `src/context/FontContext.jsx` `fontSizes`: Small 14→16px, Medium 16→18px, Large 18→20px, X-Large 21→22px (X-Small 12px, XX-Large 24px unchanged).
- **Two home tiles re-iconed** — `src/config/home.json`: Duas tile `faHandsPraying`→`faMosque`, Khatm tile `faStarAndCrescent`→`faStar`.

### Internal / docs
- **`src/components/PwaSupport.jsx` + `src/App.jsx`** — `PwaSupport` now mounts **above** the splash gate so the service-worker registration (and therefore the update check) starts as soon as the site opens, during the splash, instead of only after the splash resolves at home. Toasts are gated on a new `ready` prop (false while the splash shows) so the offline banner / "updated" toast never cover the splash art. Also fixed a latent bug where the "✅ App updated" toast fired on **every** app mount (the `needRefresh`-effect ran with the initial `false` state) — now guarded by an `updatedOnce` ref so it only appears after a real update reload.
- **`src/styles.css`** — `.quick-link .ql-icon { font-size: 28px; color: var(--accent); }`; document the accent-tinted icon rule in `docs/styling.md` (*Theme-aware icons*).
- **Docs sync** — font-size tables corrected in `docs/styling.md` and `CLAUDE.md` (were still listing 14/16/18/21px).
- **Public changelog cleaned of dev-side content** — removed purely admin/internal entries from `src/config/content/{en,hinglish}/changelog.json`: the 5.16.0 "Unified Books & Pages Editor" entry and the 5.5.0 "Improved admin panel" entry (their user-facing content already lives in the corresponding dev entries; the removed versions no longer render on `/changelog`). Reworded 5.15.0 to drop the admin-panel mechanism, and stripped the admin-tooling bullets from 5.6.0 (Calendar editor) and 2.0.0 (Content Editor web UI). All of it remains in full in `docs/DEVCHANGELOG.md`.
- **Version bump** — `5.16.0` → `5.16.1`, changelogs (en/hinglish public + dev) synchronized.

---

## 5.16.0 — 2026-08-08

### User-facing
- **Books Editor unified with Pages Editor** in the Admin panel — books are now curated directly via the shared `ContentEditor` with dynamic language tabs (`English`, `Hinglish`, etc.), collapsible chapter management, chapter merging (`⊕`), cover color swatches, and live styled book previews.
- **Auto-expanding textareas** — text fields in the admin panel automatically expand and shrink with content, showing full paragraphs and multi-line text without internal scrollbars.

### Internal / docs
- **`scripts/admin/src/components/ContentEditor.jsx`** — unified editor handling both Pages and Books. Added support for collapsible chapter groups, cover color palette picker, boolean checkboxes, and chapter merge controls.
- **`scripts/admin/src/components/ui/AutoTextarea.jsx` (new)** — reusable auto-resizing textarea component driven by `useLayoutEffect` and `scrollHeight`.
- **`scripts/admin/src/components/BooksEditor.jsx`** — removed (replaced by `ContentEditor.jsx` integration in `App.jsx`).
- **`scripts/content-editor.mjs`** — `readBookMerged` dynamically serves translation templates for all active languages; `writeBookSplit` saves non-empty translations to disk without rigid chapter heading constraints.
- **Schema cleanup** — removed obsolete `isAuto` flag from books schema, import scripts, and admin logic.
- **Version bump** — `5.15.0` → `5.16.0`, docs and changelogs synchronized.

---

## 5.15.0 — 2026-08-08

### User-facing
- **Home page tiles are now editable** — the quick-link grid on `/` is no longer hardcoded. The admin panel's new **🏠 Home** tab lets you add, remove, reorder, and re-icon the tiles. Tile labels are **always auto-derived** from each target page's localized name (`strings.drawer[titleKey]`), so tiles stay translated automatically in every language with zero manual label editing.

### Internal / docs
- **`src/config/home.json` (new)** — the tiles config: `{ "tiles": [{ "pageId": "...", "icon": "fa..." }, ...] }`. Seeded with the 10 pre-existing quick links (`dua`, `hmk`, `sijrahNama`, `fatehaKhwani`, `khatm`, `salimPappa`, `roshni`, `abbajaan`, `calendar`, `about`). Statically imported by `Home.jsx` (same pattern as `navigation.json` → `SideDrawer`/`BottomNav`).
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
- **Books section** — the written works of **Hajee Mahboob Kassim** are now readable in the app: a **Books index** (`/books`) with themed cover cards, and a dedicated **book reader** (`/books/:slug`) with **view modes** (list / slide, same as the rest of the app), chapters-as-cards reading, **QuickJump** chapter navigation, **reading progress** (persisted, with resume), and **share** (Web Share / copy link). 9 book JSON files are generated; the 3 legacy `.doc` works show as "coming soon" until converted (the registry `_index.json` controls their live vs coming-soon status, currently setting 2 as live and 10 as coming-soon).

### Internal / docs
- **Content model** — books live in `src/config/content/{en,hinglish}/books/`: `_index.json` is the book registry (slug, title, author, cover, description, status live/coming-soon, chapterCount); each `{slug}.json` holds `title`/`author`/`description`/`cover`/`chapters[]` where each chapter is `{ heading, paragraphs[] }`. Hinglish books have **no per-book file** — the loader falls back to `en/` when a file is missing.
- **Import pipeline** — `scripts/import-books.mjs` + `scripts/extract-pdf.py`:
  - `.docx` extracted via unzip → `word/document.xml` → `<w:t>` runs (native Node).
  - `.pdf` extracted via pymupdf (shells out to `python`, UTF-8 stdout; `maxBuffer` 64MB for large books).
  - **Auto-split** (v1): docx uses real heading detection (`isHeading`: short uppercase / known markers / colon / roman-numeral); pdfs chunk into ~800-word numbered sections (page-fragment noise filtered: page numbers, repeating headers/footers, TOC lines).
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
