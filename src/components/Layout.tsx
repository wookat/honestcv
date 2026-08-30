import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, Menu, X } from 'lucide-react'
import { LogoMark } from '@/components/Logo'

/** Sets the document title and meta description for the current route. */
export function usePageMeta(title: string, description: string) {
  useEffect(() => {
    document.title = title
    document.querySelector('meta[name="description"]')?.setAttribute('content', description)
  }, [title, description])
}

const RESOURCE_LINKS: [string, string][] = [
  ['Resume guides', '/guides/'],
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

export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="text-muted-foreground mx-auto max-w-6xl space-y-2 px-4 py-6 text-center text-xs">
        <p>
          © {new Date().getFullYear()} RezUp · part of Zalize · Pay once, own it
          forever. No subscriptions, no auto-renewals, no trial traps.
        </p>
        <p>No account needed. Your resume stays in your browser — we never store it.</p>
        <p className="space-x-3">
          <Link className="hover:text-foreground underline" to="/ats-checker">Free ATS checker</Link>
          <a className="hover:text-foreground underline" href="/vs/zety">RezUp vs Zety</a>
          <a className="hover:text-foreground underline" href="/guides/">Resume guides</a>
          <a className="hover:text-foreground underline" href="/examples/">Resume examples</a>
          <a className="hover:text-foreground underline" href="/templates/">Resume templates</a>
          <a className="hover:text-foreground underline" href="/vs/livecareer">vs LiveCareer</a>
          <a className="hover:text-foreground underline" href="/resume-builder-one-time-payment">One-time payment resume builders</a>
          <a className="hover:text-foreground underline" href="/about">About</a>
          <a className="hover:text-foreground underline" href="/terms">Terms &amp; refunds</a>
          <a className="hover:text-foreground underline" href="/privacy">Privacy</a>
          <a className="hover:text-foreground underline" href="mailto:support@zalize.com">Contact</a>
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
