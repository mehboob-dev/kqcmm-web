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

// --- Additional granular events (D) ------------------------------------------

/** User tapped Share in the header (Web Share API or clipboard fallback). */
export const trackShare = (method) => trackEvent('share_used', { share_method: method })

/** User opened the quick-jump sheet. */
export const trackQuickJumpOpen = () => trackEvent('quick_jump_open')

/** User jumped to a section via quick-jump. */
export const trackQuickJumpSelect = (page, index) =>
  trackEvent('quick_jump_select', { page, section_index: index })

/** User changed the base font size. */
export const trackFontSize = (size) => trackEvent('adjust_font_size', { font_size: size })

/** User changed the font family. */
export const trackFontFamily = (family) => trackEvent('select_font_family', { font_family: family })

/** User navigated months/years in the Hijri calendar. */
export const trackCalendarNav = (direction, year, month) =>
  trackEvent('calendar_nav', { calendar_direction: direction, year, month })

/** User toggled the Hijri/Gregorian display in the calendar. */
export const trackCalendarToggle = (view) => trackEvent('calendar_toggle', { calendar_view: view })

// --- Onboarding (walkthrough) -------------------------------------------------

/** The first-run walkthrough started (automatic or replay). */
export const trackOnboardingStart = (source) => trackEvent('onboarding_start', { source })
/** A walkthrough step became active. */
export const trackOnboardingStep = (stepId, index) => trackEvent('onboarding_step', { step_id: stepId, step_index: index })
/** The user finished the walkthrough. */
export const trackOnboardingComplete = () => trackEvent('onboarding_complete')
/** The user skipped/dismissed the walkthrough. */
export const trackOnboardingSkip = (reason) => trackEvent('onboarding_skip', { reason })

// --- Error tracking (C) ------------------------------------------------------

/**
 * Send a JavaScript error as a GA4 `exception` event so crashes and runtime
 * errors surface in Analytics (Events → exception). Safe no-op when disabled.
 * Wrap in a named handler so GA's own errors never loop back here.
 */
export const trackError = (message, source, lineno) =>
  trackEvent('exception', {
    description: String(message || '').slice(0, 500),
    source: source || '',
    lineno: lineno || 0,
    fatal: true,
  })

let errorTrackingInstalled = false

/**
 * Install global error listeners (window 'error' + 'unhandledrejection').
 * Call once at app start. Guarded so it never double-installs and never
 * causes an error of its own (any throw inside is swallowed).
 */
export function initErrorTracking() {
  if (errorTrackingInstalled || typeof window === 'undefined') return
  errorTrackingInstalled = true
  try {
    window.addEventListener('error', (event) => {
      // GA script/3rd-party errors are noise — skip them.
      const src = event?.filename || ''
      if (src.includes('googletagmanager.com') || src.includes('gtag')) return
      trackError(event?.message || 'Uncaught error', event?.filename, event?.lineno)
    })
    window.addEventListener('unhandledrejection', (event) => {
      const reason = event?.reason
      trackError(
        reason?.message || String(reason) || 'Unhandled promise rejection',
        reason?.stack ? 'unhandledrejection' : '',
        0,
      )
    })
  } catch { /* never let tracking setup break the app */ }
}
