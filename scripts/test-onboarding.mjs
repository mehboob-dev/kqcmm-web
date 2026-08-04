#!/usr/bin/env node
/**
 * Unit tests for src/utils/onboarding.js (pure, no framework).
 * Run: node scripts/test-onboarding.mjs
 */
import {
  ONBOARDING_VERSION,
  ONBOARDING_KEY,
  readOnboardingState,
  shouldStartOnboarding,
  markOnboardingCompleted,
  markOnboardingSkipped,
  clearOnboardingState,
  needsLanguageChoice,
  onboardingStepsForPath,
} from '../src/utils/onboarding.js'

let pass = 0, fail = 0
function assert(cond, name, extra = '') {
  if (cond) { pass++; console.log('  ✓', name) }
  else { fail++; console.log('  ✗', name, extra) }
}
function eq(a, b, name) { assert(a === b, name, `(got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`) }

// In-memory fake storage (guards setItem/removeItem errors).
function fakeStorage(seed = {}) {
  const map = new Map(Object.entries(seed))
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
  }
}

console.log('--- readOnboardingState ---')
assert(readOnboardingState(fakeStorage(), 'k') === null, 'no value -> null')
assert(readOnboardingState(fakeStorage({ k: 'not-json' }), 'k') === null, 'malformed JSON -> null')
assert(readOnboardingState(fakeStorage({ k: '{}' }), 'k') === null, 'empty object -> null')
assert(readOnboardingState(fakeStorage({ k: JSON.stringify({ version: 99, status: 'completed' }) }), 'k') === null, 'unknown version -> null')
assert(readOnboardingState(fakeStorage({ k: JSON.stringify({ version: ONBOARDING_VERSION, status: 'garbage' }) }), 'k') === null, 'unknown status -> null')
const done = readOnboardingState(fakeStorage({ k: JSON.stringify({ version: ONBOARDING_VERSION, status: 'completed', completedAt: 'x' }) }), 'k')
assert(done && done.status === 'completed', 'completed record parsed')
const skip = readOnboardingState(fakeStorage({ k: JSON.stringify({ version: ONBOARDING_VERSION, status: 'skipped' }) }), 'k')
assert(skip && skip.status === 'skipped', 'skipped record parsed')
assert(readOnboardingState(null, 'k') === null, 'null storage -> null')

console.log('--- shouldStartOnboarding ---')
assert(shouldStartOnboarding(null), 'no state -> start')
assert(shouldStartOnboarding({ status: 'completed' }) === false, 'completed -> no start')
assert(shouldStartOnboarding({ status: 'skipped' }) === false, 'skipped -> no start')

console.log('--- mark/clear ---')
const s1 = fakeStorage()
markOnboardingCompleted(s1, 'k')
const c1 = readOnboardingState(s1, 'k')
assert(c1 && c1.status === 'completed', 'completed persisted')
const s2 = fakeStorage()
markOnboardingSkipped(s2, 'k')
assert(readOnboardingState(s2, 'k').status === 'skipped', 'skipped persisted')
const s3 = fakeStorage({ k: JSON.stringify({ version: ONBOARDING_VERSION, status: 'completed' }) })
clearOnboardingState(s3, 'k')
assert(readOnboardingState(s3, 'k') === null, 'clear removes state')
const s4 = fakeStorage()
markOnboardingCompleted(s4, 'k')
clearOnboardingState(s4, 'k')
assert(readOnboardingState(s4, 'k') === null, 'clear after mark')

console.log('--- storage failure tolerance ---')
const throwing = {
  getItem: () => { throw new Error('blocked') },
  setItem: () => { throw new Error('blocked') },
  removeItem: () => { throw new Error('blocked') },
}
assert(readOnboardingState(throwing, 'k') === null, 'read failure -> null (no throw)')
let threw = false
try { markOnboardingCompleted(throwing, 'k'); markOnboardingSkipped(throwing, 'k'); clearOnboardingState(throwing, 'k') } catch { threw = true }
assert(!threw, 'write failures do not throw')

console.log('--- needsLanguageChoice ---')
assert(needsLanguageChoice(() => null) === true, 'no saved lang -> needs choice')
assert(needsLanguageChoice(() => 'en') === false, 'saved lang -> no choice')
assert(needsLanguageChoice(() => { throw new Error('x') }) === false, 'storage failure -> no choice (safe)')

console.log('--- onboardingStepsForPath ---')
const homeSteps = onboardingStepsForPath('/')
eq(homeSteps.length, 18, 'home route gets 18 interactive steps')
eq(homeSteps[0].id, 'welcome', 'welcome step first on /')
assert(homeSteps.some(s => s.type === 'guided-tap'), 'home flow includes guided-tap steps')

// No Home step has type: 'nav'
assert(!homeSteps.some(s => s.type === 'nav'), 'no home step has type: nav')

// Four route-choice steps exist
const routeChoiceSteps = homeSteps.filter(s => s.type === 'route-choice')
eq(routeChoiceSteps.length, 4, 'four route-choice steps exist')

// One return-home-* guided step exists
const returnHomeSteps = homeSteps.filter(s => s.id.startsWith('return-home-'))
eq(returnHomeSteps.length, 1, 'one return-home-* step exists')
assert(returnHomeSteps.every(s => s.type === 'guided-tap' && s.target === 'bottom-home'), 'all return-home steps are guided-tap targeting bottom-home')

// Each choice targets the correct card/button and has the correct destination route
const fatehaChoice = homeSteps.find(s => s.id === 'choose-fateha')
eq(fatehaChoice?.target, 'home-link-fatehaKhwani', 'fateha choice targets fateha card')
eq(fatehaChoice?.to, '/fateha-khwani', 'fateha choice destination route is correct')

const sijrahChoice = homeSteps.find(s => s.id === 'choose-sijrah')
eq(sijrahChoice?.target, 'home-link-sijrah', 'sijrah choice targets sijrah card')
eq(sijrahChoice?.to, '/sijrah-nama', 'sijrah choice destination route is correct')

const roshniChoice = homeSteps.find(s => s.id === 'choose-roshni')
eq(roshniChoice?.target, 'bottom-nav-roshni', 'roshni choice targets bottom nav button')
eq(roshniChoice?.to, '/roshni', 'roshni choice destination route is correct')

const duaChoice = homeSteps.find(s => s.id === 'choose-dua')
eq(duaChoice?.target, 'bottom-nav-dua', 'dua choice targets bottom nav button')
eq(duaChoice?.to, '/dua', 'dua choice destination route is correct')

// Guided-tap steps target the real control hooks
const slideNext = homeSteps.find(s => s.id === 'slide-next')
eq(slideNext?.type, 'guided-tap', 'slide-next is guided-tap')
eq(slideNext?.target, 'slide-next', 'slide-next targets data-tour="slide-next"')
const counterInc = homeSteps.find(s => s.id === 'counter-inc')
eq(counterInc?.target, 'counter-inc', 'counter-inc targets data-tour="counter-inc"')
// Last step is finish
eq(homeSteps[homeSteps.length - 1].id, 'finish', 'last home step is finish')

const deepSteps = onboardingStepsForPath('/khatm')
eq(deepSteps.length, 5, 'deep link gets 5 shell steps')
assert(!deepSteps.some(s => s.type === 'nav'), 'deep link never navigates')
assert(deepSteps.some(s => s.type === 'guided-tap'), 'deep link has guided-tap steps')
assert(!deepSteps.some(s => s.id === 'home-links'), 'deep link omits home-links step')
eq(deepSteps.map(s => s.id).join(','), 'welcome,header-menu,header-settings,hijri-strip,finish', 'deep order stable')

console.log('--- key/version constants ---')
eq(ONBOARDING_KEY, 'kqcmm_onboarding_v1', 'storage key stable')
eq(ONBOARDING_VERSION, 1, 'version stable')

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
