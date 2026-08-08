import { useEffect, useState } from 'react'
import { useCountUp, prefersReducedMotion } from '@/lib/motion'

/** Animated circular score gauge (0-100) with a counting number. */
export function ScoreRing({ score, size = 84 }: { score: number; size?: number }) {
  const value = useCountUp(score)
  const [drawn, setDrawn] = useState(prefersReducedMotion())
  useEffect(() => {
    if (prefersReducedMotion()) return
    const id = requestAnimationFrame(() => setDrawn(true))
    return () => cancelAnimationFrame(id)
  }, [score])
  const stroke = 7
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const color =
    score >= 70 ? 'var(--color-emerald-600, #059669)' : score >= 40 ? '#d97706' : '#dc2626'
  return (
    <span
      className="relative inline-flex items-center justify-center"
      role="img"
      aria-label={`Score ${score} out of 100`}
    >
      <svg width={size} height={size} aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          className="text-muted"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={drawn ? c * (1 - score / 100) : c}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 0.9s cubic-bezier(0.22, 1, 0.36, 1)' }}
        />
      </svg>
      <span className="tnum absolute text-xl font-bold" style={{ color }}>
        {value}
      </span>
    </span>
  )
}
