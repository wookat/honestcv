import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { LogoMark } from '@/components/Logo'

/** Sets the document title and meta description for the current route. */
export function usePageMeta(title: string, description: string) {
  useEffect(() => {
    document.title = title
    document.querySelector('meta[name="description"]')?.setAttribute('content', description)
  }, [title, description])
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
          <a className="hover:text-foreground" href="/guides/">Guides</a>
          <Link className="hover:text-foreground" to="/ats-checker">ATS Checker</Link>
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
          <a className="hover:bg-accent flex min-h-10 items-center rounded-md px-2 text-sm" href="/guides/">Guides</a>
          <Link className="hover:bg-accent flex min-h-10 items-center rounded-md px-2 text-sm" to="/ats-checker" onClick={() => setMenuOpen(false)}>ATS Checker</Link>
          <a className="hover:bg-accent flex min-h-10 items-center rounded-md px-2 text-sm" href="/pricing/">Pricing</a>
          <Link className="hover:bg-accent flex min-h-10 items-center rounded-md px-2 text-sm" to="/dashboard" onClick={() => setMenuOpen(false)}>My resumes</Link>
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
