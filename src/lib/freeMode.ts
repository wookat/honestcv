import { useEffect, useState } from 'react'

/** Launch/traffic mode: server flag making downloads free */
export function useFreeMode() {
  const [freeMode, setFreeMode] = useState(false)
  useEffect(() => {
    let cancelled = false
    fetch('/api/billing/status')
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { freeMode?: boolean } | null) => {
        if (!cancelled && d?.freeMode === true) setFreeMode(true)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])
  return freeMode
}
