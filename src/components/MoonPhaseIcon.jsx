// Animated SVG moon that renders any phase from `fraction`
// (0 = new, 0.5 = full, ~1 = next new; from moonPhaseInfo). The lit region is
// a single path: an outer semicircle on the lit limb plus an elliptical
// terminator arc whose width is R·|cos(2π·fraction)| — the classic
// moon-phase construction, no images and no external assets.
export default function MoonPhaseIcon({ fraction = 0, size = 64, className = '' }) {
  const f = Math.min(1, Math.max(0, Number(fraction) || 0))
  const waxing = f < 0.5
  const rx = 46 * Math.abs(Math.cos(2 * Math.PI * f))
  const outerSweep = waxing ? 1 : 0
  const innerSweep = f < 0.5 ? outerSweep : 1 - outerSweep
  const d = `M 50 4 A 46 46 0 0 ${outerSweep} 50 96 A ${rx.toFixed(2)} 46 0 0 ${innerSweep} 50 4 Z`

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      aria-hidden="true"
      focusable="false"
    >
      <circle className="moon-dark" cx="50" cy="50" r="46" />
      <path className="moon-lit" d={d} />
      <circle className="moon-ring" cx="50" cy="50" r="46" />
    </svg>
  )
}
