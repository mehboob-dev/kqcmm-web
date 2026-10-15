// Moon phase derived from the stored Hijri calendar data (calendar.json →
// monthStarts). A Hijri month begins with the new crescent, so the day within
// the month maps directly onto the lunation: day 1 ≈ new, mid-month ≈ full,
// month-end ≈ waning crescent. Pure + tested (scripts/test-moon-phase.mjs).

export const MOON_PHASES = [
  'new',
  'waxingCrescent',
  'firstQuarter',
  'waxingGibbous',
  'full',
  'waningGibbous',
  'lastQuarter',
  'waningCrescent',
]

/**
 * Phase info for a Hijri day within its month.
 *
 * @param {number} hijriDay    1-based day within the Hijri month
 * @param {number} monthLength 29 or 30 (from hijriMonthLength); anything else
 *                             falls back to 30
 * @returns {{ key: string, fraction: number, illumination: number }}
 *          key: phase id (see MOON_PHASES); fraction: 0 (new) → ~1 (next new);
 *          illumination: 0 (dark) → 1 (fully lit)
 */
export function moonPhaseInfo(hijriDay, monthLength) {
  const len = Number.isFinite(monthLength) && monthLength >= 29 && monthLength <= 30
    ? monthLength
    : 30
  const day = Math.min(Math.max(Math.floor(Number(hijriDay) || 1), 1), len)
  const fraction = (day - 1) / len
  const illumination = (1 - Math.cos(2 * Math.PI * fraction)) / 2

  let key
  if (fraction < 0.04 || fraction >= 0.98) key = 'new'
  else if (fraction < 0.22) key = 'waxingCrescent'
  else if (fraction < 0.28) key = 'firstQuarter'
  else if (fraction < 0.45) key = 'waxingGibbous'
  else if (fraction < 0.55) key = 'full'
  else if (fraction < 0.72) key = 'waningGibbous'
  else if (fraction < 0.78) key = 'lastQuarter'
  else key = 'waningCrescent'

  return { key, fraction, illumination }
}
