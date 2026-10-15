let timer

// Minimal app-wide toast: a glass/gradient pill that drops from the top.
// Vanilla DOM on purpose — callable from any component or event handler
// without context plumbing. Re-triggering restarts the animation + timer.
export function showToast(message) {
  if (typeof document === 'undefined' || !message) return
  let el = document.getElementById('app-toast')
  if (!el) {
    el = document.createElement('div')
    el.id = 'app-toast'
    el.className = 'app-toast'
    el.setAttribute('role', 'status')
    el.setAttribute('aria-live', 'polite')
    document.body.appendChild(el)
  }
  el.textContent = message
  el.classList.remove('show')
  void el.offsetWidth // force reflow so the enter transition replays
  el.classList.add('show')
  clearTimeout(timer)
  timer = setTimeout(() => el.classList.remove('show'), 2000)
}
