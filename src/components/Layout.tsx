import { Link } from 'react-router-dom'
import { FileCheck2 } from 'lucide-react'

export function SiteHeader({ action }: { action?: React.ReactNode }) {
  return (
    <header className="bg-background/85 sticky top-0 z-20 border-b backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <FileCheck2 className="text-primary size-5" aria-hidden />
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
        <p className="space-x-3">
          <a className="hover:text-foreground underline" href="/vs/zety">HonestCV vs Zety</a>
          <a className="hover:text-foreground underline" href="/vs/livecareer">vs LiveCareer</a>
          <a className="hover:text-foreground underline" href="/resume-builder-one-time-payment">One-time payment resume builders</a>
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
