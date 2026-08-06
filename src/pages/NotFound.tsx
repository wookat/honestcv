import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SiteFooter, SiteHeader, usePageMeta } from '@/components/Layout'

export default function NotFound() {
  usePageMeta(
    'Page not found — HonestCV',
    'That page does not exist. Build an ATS-friendly resume or check your ATS match score for free.'
  )
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto flex max-w-2xl flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <p className="text-muted-foreground text-sm font-medium">404</p>
        <h1 className="mt-2 text-3xl font-bold">Page not found</h1>
        <p className="text-muted-foreground mt-3">
          The page you&apos;re looking for doesn&apos;t exist or has moved. Here&apos;s
          where you probably want to go:
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link to="/builder">
              Build my resume free <ArrowRight />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/ats-checker">Check my ATS score</Link>
          </Button>
        </div>
        <ul className="text-muted-foreground mt-8 space-y-1.5 text-sm">
          <li>
            <a className="hover:text-foreground underline underline-offset-2" href="/guides/">
              Resume guides
            </a>
          </li>
          <li>
            <a className="hover:text-foreground underline underline-offset-2" href="/templates/">
              Resume templates
            </a>
          </li>
          <li>
            <a className="hover:text-foreground underline underline-offset-2" href="/vs/">
              HonestCV vs other builders
            </a>
          </li>
        </ul>
      </main>
      <SiteFooter />
    </div>
  )
}
