/** HonestCV brand mark: document with a verified check (matches favicon.svg). */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="7" fill="oklch(0.5 0.18 265)" />
      <path
        d="M10 6.5h8.5L23 11v14.5a1 1 0 0 1-1 1H10a1 1 0 0 1-1-1v-18a1 1 0 0 1 1-1z"
        fill="white"
      />
      <path d="M18.5 6.5V11H23z" fill="#c7d2fe" />
      <path
        d="M12 15h8M12 18.5h8M12 22h5"
        stroke="#a5b4fc"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="22" cy="22.5" r="6" fill="#059669" />
      <path
        d="M19.5 22.6l1.8 1.8 3.2-3.6"
        fill="none"
        stroke="white"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
