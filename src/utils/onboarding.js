/**
 * Onboarding persistence + step-sequence helpers (pure, testable without a
 * browser when a fake `storage` is injected).
 *
 * Versioned storage record:
 *   { "version": 1, "status": "completed" | "skipped", "completedAt": ISO string }
 */
export const ONBOARDING_VERSION = 1
export const ONBOARDING_KEY = 'kqcmm_onboarding_v1'

// A frozen step id -> target query map shared by the generator and the tour
// component so tests and UI stay in sync. Deep-link routes get only the
// globally available shell steps; the Home step is route-specific.
export const ONBOARDING_TARGETS = {
  homeLinks: 'home-links',
  homeFateha: 'home-link-fatehaKhwani',
  homeSijrah: 'home-link-sijrah',
  homeRoshni: 'home-link-roshni',
  homeDua: 'home-link-duas',
  bottomHome: 'bottom-home',
  bottomRoshni: 'bottom-nav-roshni',
  bottomDua: 'bottom-nav-dua',
  headerMenu: 'header-menu',
  headerSettings: 'header-settings',
  hijriStrip: 'hijri-strip',
  slideNext: 'slide-next',
  slidePrev: 'slide-prev',
  slideLast: 'slide-last',
  counterInc: 'counter-inc',
  counterDec: 'counter-dec',
  counterReset: 'counter-reset',
}

/** Is storage available and usable (guards private-mode / non-browser). */
function storageAvailable(storage) {
  try {
    const t = '__kqcmm_ob_test__'
    storage.setItem(t, '1')
    storage.removeItem(t)
    return true
  } catch {
    return false
  }
}

/** Read the parsed record, tolerating storage failure / malformed JSON. */
export function readOnboardingState(storage = globalThis.localStorage, key = ONBOARDING_KEY) {
  if (!storage || !storageAvailable(storage)) return null
  try {
    const raw = storage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed && parsed.version === ONBOARDING_VERSION &&
        (parsed.status === 'completed' || parsed.status === 'skipped')) {
      return parsed
    }
    return null
  } catch {
    return null
  }
}

function writeState(storage, state, key) {
  if (!storage || !storageAvailable(storage)) return
  try {
    storage.setItem(key, JSON.stringify(state))
  } catch {
    /* storage full / blocked — ignore, onboarding must not crash the app */
  }
}

/** Should the auto tour run for this first-visit state? */
export function shouldStartOnboarding(state) {
  return !state
}

/** Mark the tour completed (Done/Finish). */
export function markOnboardingCompleted(storage = globalThis.localStorage, key = ONBOARDING_KEY) {
  writeState(storage, { version: ONBOARDING_VERSION, status: 'completed', completedAt: new Date().toISOString() }, key)
}

/** Mark the tour skipped/dismissed (Skip/Escape/close). */
export function markOnboardingSkipped(storage = globalThis.localStorage, key = ONBOARDING_KEY) {
  writeState(storage, { version: ONBOARDING_VERSION, status: 'skipped', completedAt: new Date().toISOString() }, key)
}

/** Clear stored state so Replay can start again. */
export function clearOnboardingState(storage = globalThis.localStorage, key = ONBOARDING_KEY) {
  if (!storage || !storageAvailable(storage)) return
  try { storage.removeItem(key) } catch { /* ignore */ }
}

/** Should the first-run language chooser show (no saved language)? */
export function needsLanguageChoice(getItem = (k) => globalThis.localStorage?.getItem(k)) {
  try { return !getItem('kqcmm_lang') } catch { return false }
}

/**
 * Build the ordered step list for a given pathname (deep-link aware).
 * Step types:
 *   info        — centered card (welcome, finish, page-explainer).
 *   spotlight   — highlight a persistent shell target.
 *   nav         — legacy programmatic route change (not used by the home flow).
 *   guided-tap  — highlight a real control and advance only when the user taps it.
 *   route-choice — highlight a home link and wait for the user's click; the
 *                  destination route then determines the next tour step.
 */
export function onboardingStepsForPath(pathname, targets = ONBOARDING_TARGETS) {
  const steps = [{ type: 'info', id: 'welcome' }]
  if (pathname === '/') {
    // The home page is the tour's choice screen. The user, not the tour, opens
    // each section. The route-choice listener advances only after the selected
    // real home link has taken the app to its destination.
    steps.push({ type: 'spotlight', id: 'home-links', target: targets.homeLinks })
    steps.push({ type: 'route-choice', id: 'choose-fateha', target: targets.homeFateha, to: '/fateha-khwani' })
    steps.push({ type: 'info', id: 'content-reading' })
    steps.push({ type: 'guided-tap', id: 'slide-next', target: targets.slideNext })
    steps.push({ type: 'guided-tap', id: 'slide-prev', target: targets.slidePrev })
    steps.push({ type: 'guided-tap', id: 'slide-end', target: targets.slideLast })
    steps.push({ type: 'guided-tap', id: 'counter-inc', target: targets.counterInc })
    steps.push({ type: 'guided-tap', id: 'counter-dec', target: targets.counterDec })
    steps.push({ type: 'guided-tap', id: 'counter-reset', target: targets.counterReset })
    steps.push({ type: 'guided-tap', id: 'return-home-sijrah', target: targets.bottomHome })
    steps.push({ type: 'route-choice', id: 'choose-sijrah', target: targets.homeSijrah, to: '/sijrah-nama' })
    steps.push({ type: 'route-choice', id: 'choose-roshni', target: targets.bottomRoshni, to: '/roshni' })
    steps.push({ type: 'route-choice', id: 'choose-dua', target: targets.bottomDua, to: '/dua' })
    steps.push({ type: 'guided-tap', id: 'header-menu', target: targets.headerMenu })
    steps.push({ type: 'guided-tap', id: 'header-settings', target: targets.headerSettings })
    steps.push({ type: 'guided-tap', id: 'hijri-strip', target: targets.hijriStrip })
    steps.push({ type: 'info', id: 'finish' })
  } else {
    // Deep link: shell steps only, never force navigation.
    steps.push({ type: 'guided-tap', id: 'header-menu', target: targets.headerMenu })
    steps.push({ type: 'guided-tap', id: 'header-settings', target: targets.headerSettings })
    steps.push({ type: 'guided-tap', id: 'hijri-strip', target: targets.hijriStrip })
    steps.push({ type: 'info', id: 'finish' })
  }
  return steps
}