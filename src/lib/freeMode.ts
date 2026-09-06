import { useEffect, useState } from 'react'

/** Launch/traffic mode: server flag making downloads free. Seeded from the
 * build-time wrangler.jsonc value so the first render matches the prerendered
 * shell; the server response stays authoritative if the flag ever diverges. */
export function useFreeMode() {
  const [freeMode, setFreeMode] = useState(__FREE_MODE__)
  useEffect(() => {
    let cancelled = false
    fetch('/api/billing/status')
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { freeMode?: boolean } | null) => {
        if (!cancelled && d) setFreeMode(d.freeMode === true)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])
  return freeMode
}
