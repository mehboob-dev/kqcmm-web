// Lightweight tactile feedback via the Web Vibration API. Silently no-ops on
// devices/browsers without support (iOS Safari) so callers stay simple.
export function hapticTap(ms = 10) {
  if (typeof navigator === 'undefined' || !navigator.vibrate) return
  try { navigator.vibrate(ms) } catch (e) { /* ignore */ }
}
