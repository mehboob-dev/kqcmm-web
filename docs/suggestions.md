# Future Suggestions

Ideas and feature requests for future development of KQCMM.

---

## 📱 User Experience

### 1. Hijri date in header
Show today's Islamic date on every page — users of spiritual apps always want to know the Hijri date. Could use a small library like `hijri-date` or a simple pre-calculated lookup.

### 2. Reading progress bar
Thin bar at the top of the page showing scroll progress. Useful on long pages like Khatm (30 steps) and Fateha.

### 3. Share & copy buttons
- Share icon on each dua/verse/card for one-tap WhatsApp sharing (Web Share API)
- "Copy to clipboard" button for individual verses

### 4. Auto dark mode
Switch to dark theme automatically based on time of day (sunset/sunrise) or system preference (`prefers-color-scheme`).

### 5. Pull to refresh
Pull down on any page to check for content updates.

### 6. Keyboard shortcuts (desktop)
Press `1`-`5` for bottom nav items on desktop, arrow keys for slide nav.

### 7. Disable splash toggle
Option in settings to permanently skip the splash screen after first visit.

### 8. Quick actions on home page
Add a "Today's Khatm progress" widget or "Continue where you left off" section on the home page instead of just static links.

### 9. Font preview in settings
When picking a font or size in settings, show a live preview of sample text before applying. Helps users decide without trial and error.

### 10. Long-press context menu on cards
In list mode, long-press a card to show options: "Copy this verse", "Share via WhatsApp", "Bookmark". Power-user feature for mobile.

### 11. Page transition animations
Smooth slide/fade animations between routes instead of instant cut. Polishes the app feel (already have `fadeSlideIn` for toasts — extend to pages).

### 12. Pinned pages
Let users pin their most-visited pages (e.g., Khatm, Dua) to the top of the side drawer or home page for quick access.

---

## 🔍 Content & Discovery

### 13. Daily verse on home page
Show a random dua/verse/kalam that changes daily on the home page. Could rotate through existing content JSONs ("Verse of the Day"). Makes the app feel alive.

### 14. Search across content
Search all 11 content JSONs in the current language. Show results grouped by page with highlighted matches.

### 15. Quran browser
`public/quran.json` (1.1MB, 114 surahs, 6236 verses) is unused. Could add a Quran reading page with surah list, juz markers, search.

### 16. Scroll position memory
Remember scroll position on pages like Khatm (30 steps) so users don't lose their place on refresh. Use `sessionStorage` or `localStorage`.

### 17. Tasbih counter
Standalone digital tasbih (prayer bead counter) tool. Simple UI: tap to count, reset button.

### 18. Bookmarks / favorites
Let users bookmark specific verses or sections. Store in IndexedDB or localStorage.

---

## 🎵 Audio & Media

### 19. Audio recitations
Play MP3 recitations alongside duas/khatm verses. Auto-scroll to highlight current verse.

### 20. Video integration
Embed spiritual talks or kalam videos (YouTube / local).

---

## ⚙️ Technical

### 21. Lazy loading / code splitting
Split pages with `React.lazy()` so they only load on demand. Quick performance win.

### 22. Analytics
Privacy-respecting analytics (e.g., Plausible, Umami) to see which pages are most visited.

### 23. Service worker update refinements
- Show loading progress during SW install
- Add a "Cache size" display in settings
- Option to re-cache all content

---

## 📄 Content

### 24. Expand About page
Currently sparse. Could include:
- Full mission statement
- Contact form or email
- Photo gallery of events
- Downloadable resources

---

## 🧪 Testing & Quality

### 25. Add tests
No test framework exists. Add basic smoke tests for rendering key pages.

### 26. Error boundaries
Catch React render errors gracefully with a friendly fallback UI.

### 27. Accessibility audit
- Screen reader labels
- Keyboard navigation
- Focus management for modals/drawers
- High contrast mode
