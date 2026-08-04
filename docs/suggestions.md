# Future Suggestions

Ideas and feature requests for future development of KQCMM.

> Ideas **pending a decision** are listed by area below — nothing here is queued or promised. Suggestions that have since been shipped are tracked in the **[✅ Done](#-done)** section, and ones that were considered but not pursued are in the **[🚫 Removed](#-removed)** section at the bottom.

---

## 📱 User Experience

### 1. Share & copy buttons
- Share icon on each dua/verse/card for one-tap WhatsApp sharing (Web Share API)
- "Copy to clipboard" button for individual verses

### 1b. Share a verse as an image card ⭐
Render a single dua/verse/kalam as a **shareable image card** (styled text on a themed background) that users can save or share on WhatsApp. Spiritual verses are shared constantly in this community, and an image card travels better and reads better than a plain link.

**Implementation notes (so this is buildable without re-deriving it):**
- **Source of truth:** the card content comes from the already-localized page content — `usePageContent(lang, page)` returns the per-language payload; each card is a `sections`/`duas`/`verses` item (the same item `ContentView`/`GenericContentRenderer` render). No new content authoring.
- **Rendering:** two viable paths —
  1. **Canvas (no deps):** draw the verse text on a `<canvas>` sized ~1080×1350 (4:5, WhatsApp-friendly) with the current theme's colors (`--accent`, `--bg-card`, `--text` via `getComputedStyle`) and the current font. Wrap in a small async util (e.g. `src/utils/shareImage.js`) that returns a blob. Native, offline, no new dependency.
  2. **html-to-image:** use a library like `html-to-image`/`dom-to-image` on a hidden styled `<div>` if a richer layout (Arabic script, decorative borders) is wanted — adds a dependency, so prefer Canvas unless the design demands it.
- **Share:** `navigator.share({ files: [File] })` (Web Share Level 2) on mobile; fall back to `navigator.clipboard` copy of the image blob URL, or save via an `<a download>`.
- **Entry point:** a small "share image" button on each card (reuse the `data-tour`/card render path so it appears on every content page, not just one).
- **Analytics:** fire a `share_used` GA4 event with `share_method: 'image'` (extend `trackShare` in `src/utils/analytics.js`).

### 2. Long-press context menu on cards
In list mode, long-press a card to show options: "Copy this verse", "Share via WhatsApp", "Bookmark". Power-user feature for mobile.

### 3. Page transition animations
Smooth slide/fade animations between routes instead of instant cut. Polishes the app feel (already have `fadeSlideIn` for toasts — extend to pages).

### 4. Pinned pages
Let users pin their most-visited pages (e.g., Khatm, Dua) to the top of the side drawer or home page for quick access.

### 5. Reading-mode presets
Bundle the existing fonts × sizes into a few named presets ("Comfort", "Large Print", "Classic") so users pick a preset instead of fiddling with two separate controls.

### 6. Copy all / print a page
A "Print" button that opens a clean printable version of a dua/khatm/poetry page, and/or a "copy all" button for the whole page text.

---

## 🔍 Content & Discovery

### 7. Daily verse on home page
Show a random dua/verse/kalam that changes daily on the home page. Could rotate through existing content JSONs ("Verse of the Day"). Makes the app feel alive.

### 8. Scroll position memory
Remember scroll position on pages like Khatm (32 steps) so users don't lose their place on refresh. Use `sessionStorage` or `localStorage`.

### 9. Bookmarks / favorites
Let users bookmark specific verses or sections. Store in IndexedDB or localStorage.

---

## 🙏 Repeat-Recitation Features (core usage)

Ideas shaped around the app's primary cadence — readers recite **Sijrah Nama daily**, **Fateha Khwani weekly**, and check the **calendar randomly** (e.g. for Urs dates). Items are lettered (A–E) so they don't disturb the 1–21 numbering above.

### A. Weekly Fateha completion marker
Fateha Khwani is a **weekly set practice**. Add a "Done this week" toggle/checkmark on the Fateha page, stored per-week in localStorage (`kqcmm_fateha_done_<ISO-week>`) and resetting each Monday. A subtle visible cue ("✓ This week's Fateha complete") honors the ritual without gamification.
- **Storage:** key by ISO week so it self-resets; `localStorage` is fine (no IndexedDB needed).
- **UI:** a small checkmark/state on the Fateha page header; no disruption to reading.
- **Derived, not hardcoded:** week number computed from `new Date()` (ISO week), so it needs no config.

### B. Resume reading position per page
Daily Sijrah reading means returning to a long verse list mid-way. Remember the **last-read card index** per page in localStorage (`kqcmm_resume_<pageId>`) and offer a "Resume" jump on return — so daily readers don't re-scan from the start. This extends **#8 (scroll memory)** from *position* to *which card you were on*.
- Store the current item index (from `ContentView`'s slide/list state), not just pixel scroll.
- Show a small "Resume from card N" affordance on pages that have a saved position.

### C. Continuous scroll view for Sijrah
Sijrah is read daily; the current slide mode is one-card-at-a-time. Add a **continuous scroll** view (all verses in one long scroll, no paging) as an alternative view mode for verse-based pages — reading scripture daily feels more natural as a flowing text than as swiped cards.
- Reuses the existing list-mode renderer; it's a presentation variant, no content change.

### D. "This week's Fateha" temporal framing
Give the weekly Fateha practice a temporal anchor: a small strip on the Fateha page showing **which week** you're on (week # since a stored start date, e.g. "Week 12 of the year"). Pairs with A.
- Derived from the current date; no content authoring needed.

### E. Open to last visit
Returning daily readers should land where their habit is, not on Home every time. On app open, route to the **last-visited page** (stored in localStorage) if the visit is within the same session window; first-time users get Home. Small, high-subtlety — pairs with the onboarding tour's home-first default.

> **Already documented elsewhere:** share-a-verse-as-image-card → **1b**; Hijri↔Gregorian converter → **14**.

---

## 📅 Islamic Calendar (current area)

Ideas specific to the calendar, which is now a full navigable feature.

### 10. Calendar as home widget
Surface today's Hijri date and the next event on the **home page** (or as a small card), not just on the calendar page.

### 11. Event tap → detail
Tap a calendar event to see its full description, related duas/verses, and the surrounding holy days.

### 12. Ramadan / month planner
A dedicated view for Ramadan (or any month) listing each day's recommended dhikr/dua, driven by the existing month-start + event data.

### 13. Notifications for events
Remind users before important events (Eid, Shab-e-Barat, monthly chhatti) using web notifications or the existing PWA infrastructure.

### 14. Hijri ↔ Gregorian date converter
A small tool to answer "what Gregorian date is 15 Shaban?" or "what Hijri date is 1 Aug?" — the conversion engine already exists.

### 15. Event export / add to calendar
Copy an event's date or download an `.ics` file to save it into the phone's native calendar app.

### 16. Printable monthly view
A clean, printable layout of a Hijri/Gregorian month (and its events) for sharing/printing in the community.

---

## 🛠 Admin (content editor)

### 17. Calendar live preview
The admin Calendar editor saves data but doesn't show the public page — a live preview would reduce trial-and-error.

### 18. Duplicate / clone an event
Quickly copy an existing event as a template for a similar one.

---

## 🎵 Audio & Media

### 19. Audio recitations
Play MP3 recitations alongside duas/khatm verses. Auto-scroll to highlight current verse.

### 20. Video integration
Embed spiritual talks or kalam videos (YouTube / local).

---

## ⚙️ Technical

### 21. Accessibility audit
- Screen reader labels
- Keyboard navigation
- Focus management for modals/drawers
- High contrast mode

---

## ✅ Done

Suggestions that have been shipped, kept for the record.

### D1. Hijri date in header
The app-wide `HijriStrip` below the header shows today's Hijri + Gregorian date (with the year) on every page, and is tappable to open the full Islamic Calendar.

### D2. Unit tests
The Hijri calendar logic is covered by 126 unit tests (`npm test`), and the onboarding walkthrough helpers by a further 46. Broader smoke tests for rendering key pages would still be valuable.

### D3. Recently shipped calendar features
- **Hijri Calendar** (v5.6.0) — admin-maintained month starts, today's date, next-event countdown, events mapped automatically.
- **Monthly recurring events** — an event can repeat on a chosen Hijri date every month.
- **Navigable month grid** — switch between Hijri and Gregorian views, browse months, event days marked.
- **Two-column event lists** — Upcoming and Past each split into Monthly | Other side-by-side columns with scrollable lists; responsive on mobile.
- **App-wide Hijri strip** — tap the date strip on any page to open the calendar.
- **Admin Calendar editor** — free-form add/remove/sort month starts and compact event rows, header save + live status.

### D4. Share the app (invite)
A "Share KQCMM" button on the About page using the Web Share API (with a copy-link fallback) so readers can spread the app to their community.

---

## 🚫 Removed

Suggestions considered but not pursued — kept here struck-out for the record.

### R1. ~~Reading progress bar~~
Thin bar at the top of the page showing scroll progress.

### R2. ~~Auto dark mode~~
Switch to dark theme automatically based on time of day or system preference.

### R3. ~~Pull to refresh~~
Pull down on any page to check for content updates.

### R4. ~~Keyboard shortcuts (desktop)~~
Press `1`-`5` for bottom nav items on desktop, arrow keys for slide nav.

### R5. ~~Disable splash toggle~~
Option in settings to permanently skip the splash screen after first visit.

### R6. ~~Quick actions on home page~~
"Today's Khatm progress" widget or "Continue where you left off" on the home page.

### R7. ~~Font preview in settings~~
Live preview of sample text when picking a font or size in settings.

### R8. ~~Search across content~~
User-facing search across all content JSONs (the admin already has a global search).

### R9. ~~Lazy loading / code splitting~~
Split pages with `React.lazy()` so they load on demand.

### R10. ~~Analytics~~
Privacy-respecting analytics (e.g., Plausible, Umami) to see which pages are most visited.

### R11. ~~Error boundaries~~
Catch React render errors gracefully with a friendly fallback UI.

### R12. ~~Expand About page~~
Full mission statement, contact form, photo gallery, downloadable resources.

### R13. ~~Coming-up list (next N events)~~
A "next N events" list beyond the single Next Event strip — dropped as redundant with the existing Upcoming Events section.
