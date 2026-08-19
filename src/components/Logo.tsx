/** RezUp brand mark (Zalize family syntax v2, matches favicon.svg). */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 96 96" className={className} aria-hidden>
      <defs>
        <linearGradient id="logo-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#12A990" />
          <stop offset="1" stopColor="#0A6E63" />
        </linearGradient>
        <linearGradient id="logo-l" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5EE0C8" />
          <stop offset="1" stopColor="#1FBFA4" />
        </linearGradient>
      </defs>
      <rect width="96" height="96" rx="24" fill="#fff" />
      <rect x=".5" y=".5" width="95" height="95" rx="23.5" fill="none" stroke="#E4E7EC" />
      <path d="M42 12C24 21 14 36 14 54c0 15 11 27 28 29V12z" fill="url(#logo-g)" opacity=".6" />
      <path d="M54 12c18 9 28 24 28 42 0 15-11 27-28 29V12z" fill="url(#logo-g)" />
      <circle cx="48" cy="48" r="8.5" fill="url(#logo-l)" />
    </svg>
  )
}
