#!/usr/bin/env node
/**
 * Unit tests for src/utils/moonPhase.js and the hijriMonthLength helper.
 * Run: node scripts/test-moon-phase.mjs
 */
import { moonPhaseInfo, MOON_PHASES } from '../src/utils/moonPhase.js'
import { hijriMonthLength, daysBetween, parseISODate } from '../src/utils/hijriCalendar.js'

let pass = 0, fail = 0
function assert(cond, name, extra = '') {
  if (cond) { pass++; console.log(`  ✓ ${name}`) }
  else { fail++; console.log(`  ✗ ${name} ${extra}`) }
}

console.log('\nmoonPhaseInfo — core mapping (30-day month)')
{
  const d1 = moonPhaseInfo(1, 30)
  assert(d1.key === 'new', 'day 1 → new')
  assert(d1.fraction === 0, 'day 1 → fraction 0')
  assert(d1.illumination < 0.01, 'day 1 → illumination ≈ 0')

  const q1 = moonPhaseInfo(8, 30)
  assert(q1.key === 'firstQuarter', 'day 8/30 → first quarter')

  const full = moonPhaseInfo(15, 30)
  assert(full.key === 'full', 'day 15/30 → full')
  assert(full.illumination > 0.95, 'day 15/30 → illumination > 95%')

  const lq = moonPhaseInfo(23, 30)
  assert(lq.key === 'lastQuarter', 'day 23/30 → last quarter')

  const d28 = moonPhaseInfo(28, 30)
  assert(d28.key === 'waningCrescent', 'day 28/30 → waning crescent')

  const d30 = moonPhaseInfo(30, 30)
  assert(d30.key === 'waningCrescent', 'day 30/30 → waning crescent (pre-new)')
  assert(d30.illumination < 0.05, 'day 30/30 → illumination ≈ 0')
}

console.log('\nmoonPhaseInfo — 29-day month')
{
  assert(moonPhaseInfo(15, 29).key === 'full', 'day 15/29 → full')
  assert(moonPhaseInfo(29, 29).key === 'waningCrescent', 'day 29/29 → waning crescent')
  assert(moonPhaseInfo(8, 29).key === 'firstQuarter', 'day 8/29 → first quarter')
}

console.log('\nmoonPhaseInfo — illumination shape')
{
  const up = [1, 4, 8, 12, 15].map(d => moonPhaseInfo(d, 30).illumination)
  const rising = up.every((v, i) => i === 0 || v > up[i - 1])
  assert(rising, 'illumination rises from day 1 → full')

  const down = [16, 20, 23, 27, 30].map(d => moonPhaseInfo(d, 30).illumination)
  const falling = down.every((v, i) => i === 0 || v < down[i - 1])
  assert(falling, 'illumination falls from full → day 30')

  const all = Array.from({ length: 30 }, (_, i) => moonPhaseInfo(i + 1, 30).illumination)
  assert(all.every(v => v >= 0 && v <= 1), 'illumination always within [0, 1]')
}

console.log('\nmoonPhaseInfo — clamping & invalid input')
{
  assert(moonPhaseInfo(0, 30).key === 'new', 'day 0 clamps to day 1')
  assert(moonPhaseInfo(31, 30).key === 'waningCrescent', 'day 31 clamps to month end')
  assert(moonPhaseInfo(31, 29).fraction === 28 / 29, 'clamp respects 29-day month')
  assert(moonPhaseInfo(NaN, 30).key === 'new', 'NaN day → treated as 1')
  assert(moonPhaseInfo(5, 0).fraction === 4 / 30, 'invalid month length → 30 fallback')
  assert(moonPhaseInfo(5, 45).fraction === 4 / 30, 'out-of-range month length → 30 fallback')
  assert(MOON_PHASES.includes(moonPhaseInfo(20, 30).key), 'every result key is a known phase')
}

console.log('\nhijriMonthLength — from stored monthStarts')
{
  const starts = [
    { hijriYear: 1447, hijriMonth: 3, gregorianStart: '2025-08-25' },
    { hijriYear: 1447, hijriMonth: 4, gregorianStart: '2025-09-24' },
    { hijriYear: 1447, hijriMonth: 5, gregorianStart: '2025-10-24' },
    { hijriYear: 1447, hijriMonth: 6, gregorianStart: '2025-11-23' },
  ]
  assert(hijriMonthLength(starts, 1447, 3) === 30, 'Sha\'ban 1447 → 30 days')
  assert(hijriMonthLength(starts, 1447, 4) === 30, 'Ramadan 1447 → 30 days')
  assert(hijriMonthLength(starts, 1447, 6) === 30, 'last stored entry → 30 fallback')
  assert(hijriMonthLength(starts, 1400, 1) === 30, 'unknown month → 30 fallback')
  assert(hijriMonthLength([], 1447, 3) === 30, 'empty array → 30 fallback')
  assert(hijriMonthLength(null, 1447, 3) === 30, 'null → 30 fallback')

  // 29-day month: next start 29 days after this one
  const a = parseISODate('2025-08-25')
  const b = parseISODate('2025-09-23')
  assert(daysBetween(a, b) === 29, 'daysBetween sanity → 29')
  const starts29 = [
    { hijriYear: 1447, hijriMonth: 3, gregorianStart: '2025-08-25' },
    { hijriYear: 1447, hijriMonth: 4, gregorianStart: '2025-09-23' },
  ]
  assert(hijriMonthLength(starts29, 1447, 3) === 29, 'picks up a 29-day month')
}

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
