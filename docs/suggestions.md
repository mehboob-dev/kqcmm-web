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

---

## 🔍 Content & Discovery

### 8. Search across content
Search all 10 content JSONs in the current language. Show results grouped by page with highlighted matches. See [search feature discussion](#).

### 9. Quran browser
`public/quran.json` (1.1MB, 114 surahs, 6236 verses) is unused. Could add a Quran reading page with surah list, juz markers, search.

### 10. Scroll position memory
Remember scroll position on pages like Khatm (30 steps) so users don't lose their place on refresh. Use `sessionStorage` or `localStorage`.

### 11. Tasbih counter
Standalone digital tasbih (prayer bead counter) tool. Simple UI: tap to count, reset button.

### 12. Bookmarks / favorites
Let users bookmark specific verses or sections. Store in IndexedDB or localStorage.

---

## 🎵 Audio & Media

### 13. Audio recitations
Play MP3 recitations alongside duas/khatm verses. Auto-scroll to highlight current verse.

### 14. Video integration
Embed spiritual talks or kalam videos (YouTube / local).

---

## ⚙️ Technical

### 15. Lazy loading / code splitting
Split pages with `React.lazy()` so they only load on demand. Quick performance win.

### 16. Urdu web fonts
Nastaliq/Naskh fonts referenced in font picker but never loaded via `@font-face` — only work if device has them installed. Add Google Fonts or self-hosted fonts.

### 17. Service worker update refinements
- Show loading progress during SW install
- Add a "Cache size" display in settings
- Option to re-cache all content

### 18. Analytics
Privacy-respecting analytics (e.g., Plausible, Umami) to see which pages are most visited.

---

## 📄 Content

### 19. Content versioning
Track changes to content JSONs — simple changelog or git-based.

### 20. Auto-translate pipeline
Improve Hinglish/Urdu sync scripts to handle more content types.

### 21. Expand About page
Currently sparse. Could include:
- Full mission statement
- Contact form or email
- Photo gallery of events
- Downloadable resources

---

## 🧪 Testing & Quality

### 22. Add tests
No test framework exists. Add basic smoke tests for rendering key pages.

### 23. Error boundaries
Catch React render errors gracefully with a friendly fallback UI.

### 24. Accessibility audit
- Screen reader labels
- Keyboard navigation
- Focus management for modals/drawers
- High contrast mode
