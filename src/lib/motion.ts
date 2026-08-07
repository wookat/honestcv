/** Tiny motion helpers built on the `motion` animation library. */

import { useEffect, useRef, useState } from 'react'
import { animate } from 'motion'

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Animated count from 0 to `target` (renders `target` directly under reduced motion). */
export function useCountUp(target: number, durationSec = 0.9): number {
  const [value, setValue] = useState(prefersReducedMotion() ? target : 0)
  const prev = useRef<number | null>(null)
  useEffect(() => {
    const reduced = prefersReducedMotion()
    const from = reduced ? target : (prev.current ?? 0)
    prev.current = target
    const controls = animate(from, target, {
      duration: reduced ? 0 : durationSec,
      ease: 'easeOut',
      onUpdate: (v) => setValue(Math.round(v)),
    })
    return () => controls.stop()
  }, [target, durationSec])
  return value
}
