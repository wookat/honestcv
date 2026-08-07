/** Original brand-style empty-state illustrations (indigo/emerald, matches LogoMark). */

export function ScanIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 100" className={className} aria-hidden>
      <rect x="34" y="8" width="60" height="84" rx="5" fill="white" stroke="oklch(0.5 0.18 265 / 0.35)" strokeWidth="2" />
      <path d="M44 24h40M44 34h40M44 44h28M44 58h40M44 68h34" stroke="#c7d2fe" strokeWidth="4" strokeLinecap="round" />
      <rect x="40" y="52" width="48" height="2.5" rx="1.25" fill="oklch(0.7 0.15 165 / 0.6)" />
      <circle cx="112" cy="62" r="20" fill="none" stroke="oklch(0.5 0.18 265)" strokeWidth="4" />
      <path d="M126 76l14 14" stroke="oklch(0.5 0.18 265)" strokeWidth="5" strokeLinecap="round" />
      <path d="M104 62l6 6 10-11" fill="none" stroke="#059669" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function DraftIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 100" className={className} aria-hidden>
      <rect x="50" y="8" width="60" height="84" rx="5" fill="white" stroke="oklch(0.5 0.18 265 / 0.35)" strokeWidth="2" />
      <path d="M60 26h40" stroke="oklch(0.5 0.18 265)" strokeWidth="5" strokeLinecap="round" />
      <path d="M60 38h40M60 48h30M60 62h40M60 72h24" stroke="#c7d2fe" strokeWidth="4" strokeLinecap="round" />
      <g transform="rotate(40 122 66)">
        <rect x="116" y="40" width="12" height="42" rx="2" fill="#059669" />
        <path d="M116 82l6 10 6-10z" fill="#fbbf24" />
        <rect x="116" y="34" width="12" height="6" rx="1" fill="#0c4a6e" />
      </g>
    </svg>
  )
}
