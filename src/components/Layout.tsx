import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, Menu, Monitor, Moon, Sun, X } from 'lucide-react'
import { LogoMark } from '@/components/Logo'
import { type ThemePref, loadThemePref, saveThemePref } from '@/lib/theme'

/** Sets the document title and meta description for the current route. */
export function usePageMeta(title: string, description: string) {
  useEffect(() => {
    document.title = title
    document.querySelector('meta[name="description"]')?.setAttribute('content', description)
  }, [title, description])
}

const RESOURCE_LINKS: [string, string][] = [
  ['Resume guides', '/guides/'],
  ['Cover letter generator', '/cover-letter-generator/'],
  ['Interview prep', '/interview-prep/'],
  ['RezUp vs Zety', '/vs/zety'],
  ['RezUp vs LiveCareer', '/vs/livecareer'],
  ['One-time payment builders', '/resume-builder-one-time-payment'],
  ['About', '/about'],
]

function ResourcesDropdown() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="hover:text-foreground inline-flex items-center gap-1"
      >
        Resources <ChevronDown className={`size-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="bg-background absolute left-0 top-full z-30 mt-2 min-w-56 rounded-md border p-1 shadow-lg">
          {RESOURCE_LINKS.map(([label, href]) => (
            <a key={href} className="text-foreground hover:bg-accent flex min-h-10 items-center rounded-sm px-3 text-sm" href={href}>
              {label}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

const THEME_CYCLE: Record<ThemePref, ThemePref> = {
  light: 'dark',
  dark: 'system',
  system: 'light',
}
const THEME_LABELS: Record<ThemePref, string> = {
  light: 'Light theme',
  dark: 'Dark theme',
  system: 'System theme',
}
const THEME_ICONS: Record<ThemePref, React.ComponentType<{ className?: string }>> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
}

function ThemeToggle() {
  const [pref, setPref] = useState<ThemePref>(() => loadThemePref())
  const Icon = THEME_ICONS[pref]
  const next = THEME_CYCLE[pref]
  return (
    <button
      type="button"
      aria-label={`${THEME_LABELS[pref]} — switch to ${THEME_LABELS[next].toLowerCase()}`}
      title={THEME_LABELS[pref]}
      onClick={() => {
        saveThemePref(next)
        setPref(next)
      }}
      className="text-muted-foreground hover:bg-accent hover:text-foreground inline-flex size-10 items-center justify-center rounded-md"
    >
      <Icon className="size-4.5" />
    </button>
  )
}

export function SiteHeader({ action }: { action?: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false)
  return (
    <header className="bg-background/85 sticky top-0 z-20 border-b backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <LogoMark className="size-6" />
          RezUp
          <span className="text-muted-foreground text-xs font-normal">by Zalize</span>
        </Link>
        <nav aria-label="Main" className="text-muted-foreground hidden items-center gap-5 text-sm md:flex">
          <a className="hover:text-foreground" href="/templates/">Templates</a>
          <a className="hover:text-foreground" href="/examples/">Examples</a>
          <ResourcesDropdown />
          <Link className="hover:text-foreground" to="/ats-checker">ATS Checker</Link>
          <Link className="hover:text-foreground" to="/jobs">Jobs</Link>
          <a className="hover:text-foreground" href="/pricing/">Pricing</a>
        </nav>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          {action}
          <button
            type="button"
            aria-label="Menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
            className="hover:bg-accent -mr-2 inline-flex size-10 items-center justify-center rounded-md md:hidden"
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>
      {menuOpen && (
        <nav
          aria-label="Main"
          className="bg-background border-t px-4 pb-2 md:hidden"
        >
          <a className="hover:bg-accent flex min-h-10 items-center rounded-md px-2 text-sm" href="/templates/">Templates</a>
          <a className="hover:bg-accent flex min-h-10 items-center rounded-md px-2 text-sm" href="/examples/">Examples</a>
          <Link className="hover:bg-accent flex min-h-10 items-center rounded-md px-2 text-sm" to="/ats-checker" onClick={() => setMenuOpen(false)}>ATS Checker</Link>
          <Link className="hover:bg-accent flex min-h-10 items-center rounded-md px-2 text-sm" to="/jobs" onClick={() => setMenuOpen(false)}>Jobs</Link>
          <a className="hover:bg-accent flex min-h-10 items-center rounded-md px-2 text-sm" href="/pricing/">Pricing</a>
          <Link className="hover:bg-accent flex min-h-10 items-center rounded-md px-2 text-sm" to="/dashboard" onClick={() => setMenuOpen(false)}>My resumes</Link>
          <Link className="hover:bg-accent flex min-h-10 items-center rounded-md px-2 text-sm" to="/builder?assistant=1" onClick={() => setMenuOpen(false)}>AI assistant</Link>
          <p className="text-muted-foreground mt-2 px-2 text-xs font-medium tracking-wide uppercase">Resources</p>
          {RESOURCE_LINKS.map(([label, href]) => (
            <a key={href} className="hover:bg-accent flex min-h-10 items-center rounded-md px-2 text-sm" href={href}>{label}</a>
          ))}
        </nav>
      )}
    </header>
  )
}

const FOOTER_COLUMNS: [string, [string, string][]][] = [
  [
    'Product',
    [
      ['Resume builder', '/builder'],
      ['My resumes', '/dashboard'],
      ['Job search', '/jobs'],
      ['Free ATS checker', '/ats-checker'],
      ['Pricing', '/pricing/'],
    ],
  ],
  [
    'Resources',
    [
      ['Resume templates', '/templates/'],
      ['Resume examples', '/examples/'],
      ['Resume guides', '/guides/'],
      ['Cover letter generator', '/cover-letter-generator/'],
      ['Interview prep', '/interview-prep/'],
      ['Resignation letter writer', '/resignation-letter-generator/'],
      ['All comparisons', '/vs/'],
    ],
  ],
  [
    'Compare',
    [
      ['RezUp vs Zety', '/vs/zety'],
      ['RezUp vs LiveCareer', '/vs/livecareer'],
      ['RezUp vs Rezi', '/vs/rezi'],
      ['RezUp vs Enhancv', '/vs/enhancv'],
      ['One-time payment builders', '/resume-builder-one-time-payment'],
    ],
  ],
  [
    'Company',
    [
      ['About', '/about'],
      ['Terms & refunds', '/terms'],
      ['Privacy', '/privacy'],
      ['Contact', 'mailto:support@zalize.com'],
    ],
  ],
]

const INTERNAL_ROUTES = new Set(['/builder', '/dashboard', '/jobs', '/ats-checker'])

export function SiteFooter() {
  return (
    <footer className="border-t">
      <nav
        aria-label="Footer"
        className="mx-auto grid max-w-6xl grid-cols-2 gap-x-8 gap-y-6 px-4 pb-2 pt-8 text-sm md:grid-cols-4"
      >
        {FOOTER_COLUMNS.map(([heading, links]) => (
          <div key={heading}>
            <h2 className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
              {heading}
            </h2>
            <ul className="space-y-2">
              {links.map(([label, href]) => (
                <li key={href}>
                  {INTERNAL_ROUTES.has(href) ? (
                    <Link className="hover:underline" to={href}>{label}</Link>
                  ) : (
                    <a className="hover:underline" href={href}>{label}</a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
      <div className="text-muted-foreground mx-auto max-w-6xl space-y-1 px-4 py-6 text-center text-xs">
        <p>
          © {new Date().getFullYear()} RezUp · part of Zalize · Pay once, own it
          forever. Your resume stays in your browser — we never store it.
        </p>
        <p className="space-x-3">
          <a className="hover:text-foreground underline" href="https://qr.zalize.com">HonestQR</a>
          <a className="hover:text-foreground underline" href="https://pdf.zalize.com">HonestPDF</a>
          <a className="hover:text-foreground underline" href="https://subsleuth.zalize.com">SubSleuth</a>
          <span>— more tools from Zalize</span>
        </p>
      </div>
    </footer>
  )
}
