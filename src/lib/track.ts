/**
 * Minimal honest funnel events: daily aggregate counters only, no user
 * identifiers ever leave the browser. Each event is sent at most once per
 * browser per day (localStorage day stamp), so server-side `ev:<day>:<event>`
 * counters read as "distinct browsers that did X today". Browsers with the
 * honestcv.qa flag (internal QA) never send events.
 */

export type FunnelEvent = 'builder-start' | 'export' | 'ai-use' | 'return'

function isQa(): boolean {
  try {
    return localStorage.getItem('honestcv.qa') === '1'
  } catch {
    return true
  }
}

export function trackEvent(event: FunnelEvent) {
  try {
    if (isQa()) return
    const day = new Date().toISOString().slice(0, 10)
    const stampKey = `honestcv.ev.${event}`
    if (localStorage.getItem(stampKey) === day) return
    localStorage.setItem(stampKey, day)
    navigator.sendBeacon('/api/ev', JSON.stringify({ e: event }))
  } catch {
    /* ignore */
  }
}

/**
 * Record first-seen age locally; a visit more than 24h after the first one
 * counts as a return visit (boolean derived client-side, nothing identifying
 * is sent).
 */
export function trackVisit() {
  try {
    if (isQa()) return
    const key = 'honestcv.firstSeen'
    const first = localStorage.getItem(key)
    if (!first) {
      localStorage.setItem(key, String(Date.now()))
      return
    }
    if (Date.now() - Number(first) > 24 * 3600_000) trackEvent('return')
  } catch {
    /* ignore */
  }
}
