/**
 * KQCMM Analytics helpers (Google Analytics 4 via gtag.js)
 * =========================================================
 * Thin, defensive wrapper around the global gtag() function that index.html
 * defines. Works even if the script hasn't loaded yet (dataLayer pushes are
 * buffered by GA) or if the Measurement ID is still the placeholder — gtag()
 * is always defined, so none of these helpers ever throw.
 */

// Placeholder that the snippet in index.html uses before the real ID is set.
const PLACEHOLDER_ID = 'G-XXXXXXX'

/** Safe reference to window.gtag; defined inline in index.html. */
function gtag(...args) {
  const fn = window.gtag || (() => {})
  try { return fn(...args) } catch { /* never break the app for analytics */ }
}

/** True once a real Measurement ID has been configured. */
export function isGtagConfigured() {
  const src = document
    ?.querySelector('script[src*="googletagmanager.com/gtag/js"]')?.src
  return Boolean(src) && !src.includes(PLACEHOLDER_ID)
}

/**
 * Send a page view. GA4's default config already records page_view on load;
 * this is for SPA route changes where the browser doesn't fire a new load.
 * Call with the canonical page path (no base prefix).
 */
export function trackPageView(path, title) {
  if (!path) return
  gtag('event', 'page_view', {
    page_path: path,
    ...(title ? { page_title: title } : {}),
    // SPA: avoid double-counting the initial load page_view.
    // GA4 dedupes by page_path+page_location, but this is harmless and safe.
  })
}

/** Custom event with arbitrary parameters (flattened under event_params). */
export function trackEvent(name, params = {}) {
  if (!name) return
  gtag('event', name, params)
}

// --- KQCMM-specific convenience helpers -------------------------------------

/** User picked a language. */
export const trackLanguage = (lang) => trackEvent('select_language', { language: lang })

/** User switched visual theme. */
export const trackTheme = (theme) => trackEvent('select_theme', { theme })

/** User used the content counter (- / + / reset). */
export const trackCounter = (action, count) =>
  trackEvent('counter_use', { counter_action: action, count })

/** User skipped the splash screen before its countdown ended. */
export const trackSplashSkip = () => trackEvent('splash_skip')

/** User started reading a section (viewed a slide) in slide mode. */
export const trackSlideView = (section, index) =>
  trackEvent('slide_view', { section, slide_index: index })

/** User tapped "install" / added to home screen. */
export const trackInstall = () => trackEvent('pwa_install')

/** User switched between list/slide view modes. */
export const trackViewMode = (mode) => trackEvent('select_view_mode', { view_mode: mode })
