import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useView } from '../context/ViewContext'
import {
  readOnboardingState,
  shouldStartOnboarding,
  markOnboardingCompleted,
  markOnboardingSkipped,
  needsLanguageChoice,
  onboardingStepsForPath,
} from '../utils/onboarding'
import {
  trackOnboardingStart,
  trackOnboardingStep,
  trackOnboardingComplete,
  trackOnboardingSkip,
} from '../utils/analytics'

/**
 * First-run walkthrough. It starts automatically only on the home route, while
 * Replay starts the complete demonstration from any route. The route plan is
 * captured at the beginning of each run so navigation cannot change its order.
 *
 * Guided-tap steps deliberately leave the app shell interactive. The highlighted
 * real control advances the tour after its normal click handler has run; a
 * missing control falls back to the regular Next button instead of trapping the
 * user on a page that cannot provide that interaction.
 */
const INERT_ATTR = 'inert'

function targetEl(tourKey, interactiveOnly = false) {
  if (!tourKey || typeof document === 'undefined') return null
  const el = document.querySelector(`[data-tour="${tourKey}"]`)
  if (interactiveOnly && el?.matches(':disabled, [aria-disabled="true"]')) return null
  return el
}

function targetRect(el) {
  if (!el) return null
  const r = el.getBoundingClientRect()
  if (r.width === 0 || r.height === 0) return null
  return { top: r.top, left: r.left, width: r.width, height: r.height }
}

function routeBeforeStep(steps, index, initialRoute = '/') {
  let route = initialRoute
  for (let i = 0; i < index; i++) {
    if (steps[i]?.type === 'nav' && steps[i].to) route = steps[i].to
  }
  return route
}

export default function OnboardingTour({ strings, pathname, replayToken, navigate, onFinish }) {
  const [phase, setPhase] = useState('idle') // 'language' | 'tour' | 'idle'
  const [stepIdx, setStepIdx] = useState(0)
  const [rect, setRect] = useState(null)
  const [awaitingTap, setAwaitingTap] = useState(false)
  const [navPending, setNavPending] = useState(false)
  const [targetReady, setTargetReady] = useState(false)
  const startedRunRef = useRef(null)
  const runTokenRef = useRef(replayToken)
  const startPathRef = useRef(null)
  const previousFocusRef = useRef(null)
  const panelRef = useRef(null)
  const forcedSlideRef = useRef(false)
  const originalViewModeRef = useRef(null)
  const { slideMode, setViewMode } = useView()

  // A replay is a new run, not merely a prop update on the old idle tour.
  // Reset the captured route synchronously so the render after replay uses the
  // full home demonstration even when Replay was pressed on another page.
  if (runTokenRef.current !== replayToken) {
    runTokenRef.current = replayToken
    startPathRef.current = replayToken > 0 ? '/' : pathname
  }
  if (startPathRef.current === null) {
    startPathRef.current = replayToken > 0 ? '/' : pathname
  }

  const steps = useMemo(
    () => onboardingStepsForPath(startPathRef.current),
    [pathname, replayToken],
  )
  const step = steps[stepIdx]
  const isLast = stepIdx >= steps.length - 1
  const tour = strings?.onboarding || {}
  const stepStrings = tour.steps || {}
  const interactiveStep = phase === 'tour' && step && (step.type === 'guided-tap' || step.type === 'route-choice')

  const restoreFocus = useCallback(() => {
    const opener = previousFocusRef.current
    previousFocusRef.current = null
    if (opener?.isConnected && typeof opener.focus === 'function') opener.focus()
  }, [])

  const restoreViewMode = useCallback(() => {
    if (!forcedSlideRef.current) return
    forcedSlideRef.current = false
    setViewMode(originalViewModeRef.current ? 'slide' : 'list')
    originalViewModeRef.current = null
  }, [setViewMode])

  const finish = useCallback(() => {
    markOnboardingCompleted()
    trackOnboardingComplete()
    setPhase('idle')
    setAwaitingTap(false)
    setNavPending(false)
    restoreViewMode()
    restoreFocus()
    // The tour can end away from Home — the home flow's final route-choice step
    // (choose-dua) leaves the user on /dua. Land them back on the home page.
    if (navigate && pathname !== '/') navigate('/')
  }, [navigate, pathname, restoreFocus, restoreViewMode])

  const skip = useCallback((reason = 'button') => {
    markOnboardingSkipped()
    trackOnboardingSkip(reason)
    setPhase('idle')
    setAwaitingTap(false)
    setNavPending(false)
    restoreViewMode()
    restoreFocus()
  }, [restoreFocus, restoreViewMode])

  const advance = useCallback(() => {
    setAwaitingTap(false)
    setNavPending(false)
    setStepIdx(i => Math.min(i + 1, steps.length - 1))
  }, [steps.length])

  const goNext = useCallback(() => {
    if (!step) return

    // Route-choice steps are completed by clicking the highlighted home link.
    // They intentionally have no auto-navigation fallback.
    if (step.type === 'route-choice') return

    // Navigation remains supported for any future non-choice step. Next requests
    // the route, then the tour waits for the router to confirm it.
    if (step.type === 'nav') {
      if (pathname === step.to) {
        advance()
      } else if (navigate && !navPending) {
        setNavPending(true)
        navigate(step.to)
      } else if (!navigate) {
        advance()
      }
      return
    }

    if (isLast) finish()
    else advance()
  }, [advance, finish, isLast, navigate, navPending, pathname, step])

  const onRouteChoice = useCallback(() => {
    if (step?.type !== 'route-choice') return
    setNavPending(true)
  }, [step])

  const goBack = useCallback(() => {
    const nextIdx = Math.max(stepIdx - 1, 0)
    const expectedRoute = routeBeforeStep(steps, nextIdx, startPathRef.current === '/' ? '/' : pathname)
    setStepIdx(nextIdx)
    setAwaitingTap(false)
    setNavPending(false)
    if (navigate && pathname !== expectedRoute) navigate(expectedRoute)
  }, [navigate, pathname, stepIdx, steps])

  // Start exactly once for each replay token. Automatic starts remain restricted
  // to '/', so a deep link is never unexpectedly blocked by the tour.
  useEffect(() => {
    if (!strings || startedRunRef.current === replayToken) return
    if (replayToken === 0) {
      if (pathname !== '/') return
      if (!shouldStartOnboarding(readOnboardingState())) return
    }

    startedRunRef.current = replayToken
    previousFocusRef.current = document.activeElement
    setStepIdx(0)
    setAwaitingTap(false)
    setNavPending(false)
    trackOnboardingStart(replayToken > 0 ? 'replay' : 'automatic')

    if (replayToken > 0 && pathname !== '/' && navigate) navigate('/')
    setPhase(needsLanguageChoice() ? 'language' : 'tour')
  }, [navigate, pathname, replayToken, strings])

  // Replay can be requested while the user was in list mode. The demonstration
  // needs the slide controls, but the user's original view preference is
  // restored when the run ends.
  useEffect(() => {
    if (phase !== 'tour' || slideMode || forcedSlideRef.current) return
    originalViewModeRef.current = slideMode
    forcedSlideRef.current = true
    setViewMode('slide')
  }, [phase, setViewMode, slideMode])

  // A navigation or user-selected route step is complete only after the
  // destination route has rendered.
  useEffect(() => {
    if (phase !== 'tour' || !['nav', 'route-choice'].includes(step?.type)) return
    const match = pathname === step.to
    const shouldAdvance = step.type === 'route-choice' ? match : (navPending && match)
    if (shouldAdvance) advance()
  }, [advance, navPending, pathname, phase, step])

  // Listen to the actual highlighted home link. Its normal Link navigation is
  // allowed to run; this only records that the user made the choice. The
  // observer covers returning to Home after each selected section.
  useEffect(() => {
    if (phase !== 'tour' || step?.type !== 'route-choice') return undefined
    let currentEl = null
    const onClick = () => onRouteChoice()
    const sync = () => {
      const nextEl = targetEl(step.target, true)
      if (nextEl === currentEl) return
      if (currentEl) currentEl.removeEventListener('click', onClick)
      currentEl = nextEl
      if (currentEl) currentEl.addEventListener('click', onClick)
    }
    sync()
    const observer = typeof MutationObserver === 'undefined' ? null : new MutationObserver(sync)
    observer?.observe(document.body, { childList: true, subtree: true })
    return () => {
      observer?.disconnect()
      if (currentEl) currentEl.removeEventListener('click', onClick)
    }
  }, [onRouteChoice, phase, step])

  // Route-choice steps never open a section on the user's behalf. The user
  // first returns Home with the guided bottom-home step, then chooses the next
  // real Home card themselves.

  // Route-choice steps should never show a normal Next action while the
  // highlighted link is available. The fallback only protects unusual custom
  // routes where that hook is absent.

  // Track target element presence centrally to trigger state refresh/rerender.
  useEffect(() => {
    if (phase !== 'tour' || !step?.target) {
      setTargetReady(false)
      return undefined
    }
    const sync = () => {
      const el = targetEl(step.target, true)
      setTargetReady(Boolean(el))
      if (el) {
        const r = el.getBoundingClientRect()
        if (r.width > 0 && r.height > 0) {
          const isOffscreen = r.bottom < 0 || r.top > window.innerHeight
          if (isOffscreen && typeof el.scrollIntoView === 'function') {
            el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
          }
        }
      }
    }
    sync()
    const observer = typeof MutationObserver === 'undefined' ? null : new MutationObserver(sync)
    observer?.observe(document.body, { childList: true, subtree: true })
    return () => {
      observer?.disconnect()
      setTargetReady(false)
    }
  }, [phase, step?.target])

  // If a route-choice target is not currently present, keep the tour recoverable
  // instead of presenting a disabled action with no way forward.
  const routeChoiceWaiting = step?.type === 'route-choice' && navPending && pathname !== step.to
  const routeChoiceReady = step?.type === 'route-choice' && targetReady && !routeChoiceWaiting
  const routeChoiceFallback = step?.type === 'route-choice' && !targetReady
  const routeChoiceAction = routeChoiceFallback ? (isLast ? finish : advance) : undefined

  // Attach to the actual control. MutationObserver covers the short interval
  // between a route/view-mode change and the control being mounted.
  useEffect(() => {
    if (phase !== 'tour' || step?.type !== 'guided-tap') {
      setAwaitingTap(false)
      return undefined
    }

    let currentEl = null
    let handled = false
    let timer = null
    const onClick = () => {
      if (handled) return
      handled = true
      setAwaitingTap(false)
      // Let the control's React handler update its own state first.
      timer = window.setTimeout(advance, 0)
    }
    const sync = () => {
      const nextEl = targetEl(step.target, true)
      if (nextEl === currentEl) return
      if (currentEl) currentEl.removeEventListener('click', onClick)
      currentEl = nextEl
      if (currentEl) {
        currentEl.addEventListener('click', onClick)
        setAwaitingTap(true)
      } else {
        // No matching control (for example, a list-mode fallback): allow Next.
        setAwaitingTap(false)
      }
    }

    sync()
    const observer = typeof MutationObserver === 'undefined' ? null : new MutationObserver(sync)
    observer?.observe(document.body, { childList: true, subtree: true })
    return () => {
      observer?.disconnect()
      if (currentEl) currentEl.removeEventListener('click', onClick)
      if (timer !== null) window.clearTimeout(timer)
      setAwaitingTap(false)
    }
  }, [advance, phase, slideMode, step])

  // Keep the spotlight aligned with scrolling, resizing, view-mode changes, and
  // late-mounted route content.
  const reposition = useCallback(() => {
    if (phase !== 'tour' || !step?.target) {
      setRect(null)
      return
    }
    setRect(targetRect(targetEl(step.target)))
  }, [phase, step])

  useEffect(() => {
    if (phase !== 'tour' || !step?.target) {
      setRect(null)
      return undefined
    }

    reposition()
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(reposition)
    const attachResizeTarget = () => {
      const el = targetEl(step.target)
      if (el) ro?.observe(el)
      reposition()
    }
    attachResizeTarget()
    const winResize = () => reposition()
    window.addEventListener('resize', winResize)
    const main = document.querySelector('.main-content')
    main?.addEventListener('scroll', reposition, { passive: true })
    const mutation = typeof MutationObserver === 'undefined' ? null : new MutationObserver(attachResizeTarget)
    mutation?.observe(document.body, { childList: true, subtree: true })

    return () => {
      ro?.disconnect()
      mutation?.disconnect()
      window.removeEventListener('resize', winResize)
      main?.removeEventListener('scroll', reposition)
    }
  }, [phase, reposition, slideMode, step])

  // The shell is modal for informational/spotlight/nav steps. Guided taps are
  // the exception: the spotlight is pointer-transparent and the real control
  // must remain reachable.
  useEffect(() => {
    const root = document.getElementById('root')
    if (!root) return undefined
    if (phase === 'idle' || interactiveStep) {
      root.removeAttribute(INERT_ATTR)
      return undefined
    }

    const hadInert = root.hasAttribute(INERT_ATTR)
    root.setAttribute(INERT_ATTR, '')
    return () => {
      if (!hadInert) root.removeAttribute(INERT_ATTR)
    }
  }, [phase, interactiveStep])

  useEffect(() => {
    if (phase !== 'idle') panelRef.current?.focus()
  }, [phase, stepIdx])

  useEffect(() => {
    if (phase === 'tour' && step) {
      trackOnboardingStep(step.id, stepIdx)
      document.body.setAttribute('data-tour-step', step.id)
    } else {
      document.body.removeAttribute('data-tour-step')
    }
    return () => {
      document.body.removeAttribute('data-tour-step')
    }
  }, [phase, step, stepIdx])

  const onKeyDown = useCallback((event) => {
    if (phase === 'idle') return
    if (event.key === 'Escape') {
      event.preventDefault()
      skip('escape')
      return
    }
    if (event.key !== 'Tab') return

    const panel = panelRef.current
    if (!panel) return
    const focusables = [...panel.querySelectorAll('button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])')]
    if (!focusables.length) return
    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }, [phase, skip])

  useEffect(() => {
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onKeyDown])

  const pickLanguage = (code) => {
    onFinish?.(code)
    setPhase('tour')
  }

  if (phase === 'idle') return null

  const progressLabel = (tour.progress || 'Step {current} of {total}')
    .replace('{current}', String(stepIdx + 1))
    .replace('{total}', String(steps.length))

  if (phase === 'language') {
    return createPortal(
      <div className="tour-backdrop" data-tour-role="language">
        <div className="tour-panel tour-lang" role="dialog" aria-modal="true" aria-labelledby="tour-lang-title" ref={panelRef} tabIndex={-1}>
          <h2 id="tour-lang-title" className="tour-title">
            {tour.langTitle || 'Choose language'}
            <span className="tour-lang-sub">{tour.langSub}</span>
          </h2>
          <div className="tour-lang-buttons">
            <button className="tour-btn tour-btn-primary" onClick={() => pickLanguage('en')}>{tour.langEnglish || 'English'}</button>
            <button className="tour-btn" onClick={() => pickLanguage('hinglish')}>{tour.langHinglish || 'Hinglish'}</button>
          </div>
          <button className="tour-btn tour-btn-ghost" onClick={() => skip('button')}>{tour.langClose || tour.close || 'Close'}</button>
        </div>
      </div>,
      document.body,
    )
  }

  const spotlight = rect ? { top: rect.top, left: rect.left, width: rect.width, height: rect.height } : null
  const guided = step?.type === 'guided-tap' && awaitingTap
  const routeChoice = step?.type === 'route-choice'
  const centered =
    !step?.target ||
    step?.type === 'nav' ||
    step?.type === 'route-choice' ||
    step?.type === 'spotlight' ||
    step?.type === 'guided-tap'
  const waitingForNav = ['nav', 'route-choice'].includes(step?.type) && navPending && pathname !== step.to
  const actionLabel = waitingForNav
    ? (tour.opening || 'Opening…')
    : (isLast ? (tour.done || 'Finish') : (tour.next || 'Next'))
  const actionDisabled = waitingForNav || (routeChoice && routeChoiceReady)
  const actionHandler = routeChoiceFallback ? routeChoiceAction : goNext
  const actionText = routeChoiceFallback ? (isLast ? (tour.done || 'Finish') : (tour.next || 'Next')) : actionLabel

  return createPortal(
    <div
      className={'tour-backdrop' + (spotlight ? ' tour-backdrop-spotlight' : '') + (interactiveStep ? ' tour-backdrop-live' : '')}
      data-tour-role="tour"
    >
      {spotlight && <div className="tour-spotlight tour-awaiting" style={spotlight} />}
      <div
        className={'tour-panel tour-step' + (centered ? ' tour-panel-center' : '')}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-step-title"
        aria-describedby="tour-step-body"
        ref={panelRef}
        tabIndex={-1}
      >
        <div className="tour-progress">{progressLabel}</div>
        <h2 id="tour-step-title" className="tour-title">{stepStrings[step?.id]?.title || ''}</h2>
        <p id="tour-step-body" className="tour-body">{stepStrings[step?.id]?.body || ''}</p>
        <div className="tour-actions">
          <button className="tour-btn tour-btn-ghost" onClick={() => skip('button')}>{tour.skip || 'Skip tour'}</button>
          {stepIdx > 0 && <button className="tour-btn" onClick={goBack}>{tour.back || 'Back'}</button>}
          {guided
            ? <button className="tour-btn tour-btn-primary" disabled>{tour.tapHint || 'Press the highlighted button'}</button>
            : <button className="tour-btn tour-btn-primary" onClick={actionHandler} disabled={actionDisabled}>{actionText}</button>}
        </div>
      </div>
    </div>,
    document.body,
  )
}
