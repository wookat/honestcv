/** Tiny motion helpers (requestAnimationFrame tweens; no animation library). */

import { useEffect, useRef, useState } from 'react'

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

/** Animated count from 0 to `target` (renders `target` directly under reduced motion). */
export function useCountUp(target: number, durationSec = 0.9): number {
  const [value, setValue] = useState(prefersReducedMotion() ? target : 0)
  const prev = useRef<number | null>(null)
  useEffect(() => {
    const reduced = prefersReducedMotion()
    const from = reduced ? target : (prev.current ?? 0)
    prev.current = target
    if (reduced || durationSec <= 0 || from === target) {
      setValue(target)
      return
    }
    let raf = 0
    const start = performance.now()
    const durationMs = durationSec * 1000
    const tick = (now: number) => {
      const t = Math.min((now - start) / durationMs, 1)
      setValue(Math.round(from + (target - from) * easeOutCubic(t)))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, durationSec])
  return value
}
