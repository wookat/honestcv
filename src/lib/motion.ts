/** Tiny motion helpers (requestAnimationFrame tweens; no animation library). */

import { useEffect, useRef, useState } from 'react'

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

/** Tweened value at `elapsedMs` into a `durationMs` ease-out from `from` to `target`.
 * Progress is clamped to [0, 1]: a rAF timestamp can precede the `performance.now()` the
 * tween was armed with, and an unclamped negative progress would swing past `from`. */
export function countUpValue(
  from: number,
  target: number,
  elapsedMs: number,
  durationMs: number,
): number {
  const t = Math.min(Math.max(elapsedMs / durationMs, 0), 1)
  return Math.round(from + (target - from) * easeOutCubic(t))
}

/**
 * Animated count from 0 to `target` (jumps straight to `target` under reduced motion).
 * The first render is always 0 so prerendered HTML hydrates cleanly whatever the visitor's
 * motion preference; the effect then snaps or tweens.
 */
export function useCountUp(target: number, durationSec = 0.9): number {
  const [value, setValue] = useState(0)
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
      setValue(countUpValue(from, target, now - start, durationMs))
      if (now - start < durationMs) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, durationSec])
  return value
}
