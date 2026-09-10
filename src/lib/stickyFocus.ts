/**
 * Chrome centres a newly focused control in the scrollport when part of it lies
 * inside the document's `scroll-padding` — even a control that sits in a stuck
 * sticky bar and is therefore already in view. The bar stays put and the page
 * behind it jumps by half a viewport on every Tab / click / focus return.
 */

/** Where the page should scroll back to after focus moved into a stuck bar, or null to leave it. */
export function stickyFocusRestore(args: {
  scrollY: number
  lastScrollY: number | null
  stuck: boolean
}): number | null {
  const { scrollY, lastScrollY, stuck } = args
  if (lastScrollY === null || !stuck || scrollY === lastScrollY) return null
  return lastScrollY
}

let lastScrollY: number | null = null
let tracking = false
function trackScroll() {
  if (tracking) return
  tracking = true
  lastScrollY = window.scrollY
  window.addEventListener(
    'scroll',
    () => {
      lastScrollY = window.scrollY
    },
    { passive: true },
  )
}

export function isStuck(bar: HTMLElement): boolean {
  const cs = getComputedStyle(bar)
  return cs.position === 'sticky' && Math.abs(bar.getBoundingClientRect().top - parseFloat(cs.top)) < 1
}

/** Keeps the page where it was when keyboard or pointer focus enters a stuck sticky bar. */
export function keepPageStillOnFocus(bar: HTMLElement): () => void {
  trackScroll()
  const onFocusIn = () => {
    const top = stickyFocusRestore({ scrollY: window.scrollY, lastScrollY, stuck: isStuck(bar) })
    if (top !== null) window.scrollTo({ top, behavior: 'instant' })
  }
  bar.addEventListener('focusin', onFocusIn)
  return () => bar.removeEventListener('focusin', onFocusIn)
}
