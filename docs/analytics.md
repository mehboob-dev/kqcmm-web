# Analytics — Google Analytics 4

KQCMM tracks usage with **Google Analytics 4** via the classic `gtag.js` snippet
loaded in `index.html`. Because the site is a static GitHub Pages PWA, tracking is
client-side only — users are counted when a browser loads/runs the app.

## What it tracks

**Automatic (GA4 default measurement, enabled by the gtag config):**
- **Users & geo** — total users, daily/monthly active users, new vs returning, and
  approximate country/city derived from IP (full tracking; `anonymize_ip: false`).
- **Page views / engagement** — time on page, scroll depth, and the standard GA4
  engagement dimensions.

**SPA page views (custom):** route changes are sent as `page_view` events from
`Layout.jsx` via `useLocation`. The `/kqcmm-web/` basename is stripped so paths
match the pre-rendered SEO pages (`/dua`, `/khatm`, ...).

**Custom events:**

| Event | Emitted when | Where |
|---|---|---|
| `select_language` | user switches language | `LanguageContext` |
| `select_theme` | user switches theme | `ThemeContext` |
| `select_view_mode` | user toggles list/slide | `ViewContext` |
| `counter_use` | user taps the −/+ counter | `ContentView` |
| `slide_view` | user navigates slides | `ContentView` |
| `splash_skip` | user taps splash to skip it | `SplashScreen` |
| `pwa_install` | user installs the app | `PwaSupport` (`appinstalled`) |

## Activating (one-time setup)

GA4 is **off by default** — until configured, `gtag()` is a harmless no-op and no
data leaves the browser.

1. Create a GA4 property in [Google Analytics](https://analytics.google.com/).
2. Add a **Web data stream** for your site URL.
3. Note the **Measurement ID** (`G-XXXXXXXXXX`) shown for the stream.
4. In `index.html`, replace **both** placeholder occurrences of `G-XXXXXXX`
   (the `gtag/js` `<script>` `src` and the `gtag('config', ...)` call).
5. Rebuild & deploy (`npm run build` + deploy). Data appears in GA within minutes.

## Privacy & consent

This installation uses **full Google tracking**: standard cookies, IP-based geo
(`anonymize_ip: false`), and no cookie-opt-out banner. Before enabling it, make
sure the site's audience/authorities accept Google's data processing. To reduce
data, set `anonymize_ip: true` in the `gtag('config', ...)` call; for a consent
flow, wire GA's Consent Mode (`gtag('consent', ...)`) rather than a custom banner.

## Notes

- Custom events use GA4's recommended `select_*` naming where possible so they
  slot into standard GA4 reports with no extra custom-dimension setup.
- `src/utils/analytics.js` is a defensive wrapper around the global `gtag()` —
  it never throws and degrades to a no-op if the script hasn't loaded.