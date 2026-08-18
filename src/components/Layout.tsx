import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { LogoMark } from '@/components/Logo'

/** Sets the document title and meta description for the current route. */
export function usePageMeta(title: string, description: string) {
  useEffect(() => {
    document.title = title
    document.querySelector('meta[name="description"]')?.setAttribute('content', description)
  }, [title, description])
}

export function SiteHeader({ action }: { action?: React.ReactNode }) {
  return (
    <header className="bg-background/85 sticky top-0 z-20 border-b backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <LogoMark className="size-6" />
          HonestCV
        </Link>
        {action}
      </div>
    </header>
  )
}

export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="text-muted-foreground mx-auto max-w-6xl space-y-2 px-4 py-6 text-center text-xs">
        <p>
          © {new Date().getFullYear()} HonestCV · Pay once, own it forever. No
          subscriptions, no auto-renewals, no trial traps.
        </p>
        <p>No account needed. Your resume stays in your browser — we never store it.</p>
        <p>
          Our promise: no paywall tricks · no ads, no spam calls · your data is yours ·
          honest AI —{' '}
          <a className="hover:text-foreground underline" href="https://career.zalize.com/promise/#en" target="_blank" rel="noreferrer">
            learn more
          </a>
        </p>
        <p className="space-x-3">
          <Link className="hover:text-foreground underline" to="/ats-checker">Free ATS checker</Link>
          <a className="hover:text-foreground underline" href="/vs/zety">HonestCV vs Zety</a>
          <a className="hover:text-foreground underline" href="/guides/">Resume guides</a>
          <a className="hover:text-foreground underline" href="/templates/">Resume templates</a>
          <a className="hover:text-foreground underline" href="/vs/livecareer">vs LiveCareer</a>
          <a className="hover:text-foreground underline" href="/resume-builder-one-time-payment">One-time payment resume builders</a>
          <a className="hover:text-foreground underline" href="/about">About</a>
          <a className="hover:text-foreground underline" href="/terms">Terms &amp; refunds</a>
          <a className="hover:text-foreground underline" href="/privacy">Privacy</a>
        </p>
        <p className="space-x-3">
          <a className="hover:text-foreground underline" href="https://qr.zalize.com">HonestQR</a>
          <a className="hover:text-foreground underline" href="https://pdf.zalize.com">HonestPDF</a>
          <a className="hover:text-foreground underline" href="https://subsleuth.zalize.com">SubSleuth</a>
          <span>— more honest tools, same promise</span>
        </p>
      </div>
    </footer>
  )
}
