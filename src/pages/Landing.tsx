import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BadgeCheck,
  Ban,
  FileDown,
  Lock,
  ShieldCheck,
  Sparkles,
  Target,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { SiteFooter, SiteHeader } from '@/components/Layout'
import { useFreeMode } from '@/components/Paywall'

const FEATURES = [
  {
    icon: Target,
    title: 'Free ATS match score',
    text: 'Paste any job description and see your keyword match score instantly — before you pay a cent. It runs in your browser; your resume never touches our servers.',
  },
  {
    icon: Sparkles,
    title: 'AI that tailors, not fabricates',
    text: 'Rewrite bullets, summaries and skills toward the exact job posting. Our AI never invents employers, dates or metrics — it sharpens what you actually did.',
  },
  {
    icon: FileDown,
    title: 'Real PDF + DOCX export',
    text: 'Text-based PDF (not an image) that ATS systems parse cleanly, plus a real .docx that opens in Word and Google Docs. No watermarks.',
  },
  {
    icon: ShieldCheck,
    title: 'Private by design',
    text: 'No account, no sign-up. Your resume lives in your browser. The only data we ever see is text you explicitly send for AI rewriting.',
  },
]

const COMPARISON: [string, string, string][] = [
  ['Cost to download your resume', '$9.99 once', '$2.70 “trial” → $25.95 every 4 weeks'],
  ['Cost over a 6-month job search', '$9.99', '$150–$180'],
  ['Auto-renews / recurring charges', 'Never', 'Yes — cancellation buried in menus'],
  ['ATS match score', 'Free, before paying', 'Behind the paywall'],
  ['Card stored after purchase', 'No', 'Yes, and charged again'],
  ['Account required', 'No', 'Yes'],
  ['Your resume data', 'Stays in your browser', 'Stored on their servers'],
]

export default function Landing() {
  const freeMode = useFreeMode()
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader
        action={
          <Button asChild size="sm">
            <Link to="/builder">
              Build my resume <ArrowRight />
            </Link>
          </Button>
        }
      />

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto max-w-4xl px-4 pt-16 pb-12 text-center">
          <Badge variant="secondary" className="mb-4 gap-1">
            <Ban className="size-3" /> No subscriptions. No trial traps. Ever.
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            The resume builder you pay for <span className="underline decoration-emerald-500 decoration-4 underline-offset-4">once</span>
          </h1>
          <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-lg">
            {freeMode ? (
              <>
                Build an ATS-friendly resume with AI tailoring and a free match score.
                <strong> Downloads are 100% free during our launch</strong> — no card, no
                trial, nothing that renews.
              </>
            ) : (
              <>
                Build an ATS-friendly resume with AI tailoring and a free match score.
                Pay <strong>$9.99 one time</strong> to download — not $25.95 every four
                weeks until you remember to cancel.
              </>
            )}
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link to="/builder">
                Start free — no sign-up <ArrowRight />
              </Link>
            </Button>
            <p className="text-muted-foreground text-sm">
              {freeMode
                ? 'Editor, templates, ATS score, AI tools and downloads — all free right now.'
                : 'Editing, templates & ATS score are free. Pay only to download.'}
            </p>
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto grid max-w-5xl gap-4 px-4 py-8 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <Card key={f.title} className="py-0">
              <CardContent className="p-5">
                <f.icon className="text-primary mb-2 size-6" />
                <h3 className="font-semibold">{f.title}</h3>
                <p className="text-muted-foreground mt-1 text-sm">{f.text}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        {/* Why one-time */}
        <section className="bg-muted/40 border-y">
          <div className="mx-auto max-w-4xl px-4 py-12">
            <h2 className="text-center text-2xl font-bold">
              Why we&apos;ll never charge you monthly
            </h2>
            <p className="text-muted-foreground mx-auto mt-3 max-w-2xl text-center text-sm">
              &ldquo;Zety charged me&rdquo; is one of the most-searched complaints in this
              category. Big resume builders sell a $1.95&ndash;$2.70 &ldquo;trial&rdquo; that
              silently becomes ~$25.95 every four weeks, keep your card on file, and
              bury the cancel button. A resume is something you need for a few weeks,
              a couple of times a decade — it should be a product you buy, not a
              subscription that hunts you.
            </p>
            <div className="mt-8 overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 pr-4 text-left font-medium"></th>
                    <th className="text-primary py-2 pr-4 text-left font-semibold">HonestCV</th>
                    <th className="text-muted-foreground py-2 text-left font-medium">
                      Typical subscription builder
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON.map(([label, us, them]) => (
                    <tr key={label} className="border-b last:border-0">
                      <td className="py-2.5 pr-4 font-medium">{label}</td>
                      <td className="py-2.5 pr-4">
                        <span className="inline-flex items-center gap-1 text-emerald-700">
                          <BadgeCheck className="size-4" /> {us}
                        </span>
                      </td>
                      <td className="text-muted-foreground py-2.5">{them}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="mx-auto max-w-4xl px-4 py-12">
          <h2 className="text-center text-2xl font-bold">Simple, honest pricing</h2>
          <p className="text-muted-foreground mt-2 text-center text-sm">
            Try everything free. Pay once, only when you&apos;re ready to download.
          </p>
          {freeMode && (
            <div className="mx-auto mt-4 max-w-xl rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-center text-sm text-emerald-900">
              <strong>Launch special:</strong> everything below is free right now —
              downloads included. When paid plans open they'll stay one-time, never a
              subscription.
            </div>
          )}
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <Card className="py-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Single Resume</h3>
                  <Badge variant="secondary">One-time</Badge>
                </div>
                <p className="mt-2 text-3xl font-bold">
                  $9.99 <span className="text-muted-foreground text-sm font-normal">once, forever</span>
                </p>
                <ul className="text-muted-foreground mt-3 space-y-1.5 text-sm">
                  <li>· Unlimited PDF + DOCX downloads, no watermark</li>
                  <li>· Unlimited AI rewrites &amp; job-targeted tailoring</li>
                  <li>· All 4 ATS-friendly templates</li>
                  <li>· Edit and re-download forever</li>
                </ul>
                <Button asChild className="mt-4 w-full" variant="outline">
                  <Link to="/builder">Start building free</Link>
                </Button>
              </CardContent>
            </Card>
            <Card className="border-primary border-2 py-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Career Bundle</h3>
                  <Badge>Best value</Badge>
                </div>
                <p className="mt-2 text-3xl font-bold">
                  $19.99 <span className="text-muted-foreground text-sm font-normal">once, forever</span>
                </p>
                <ul className="text-muted-foreground mt-3 space-y-1.5 text-sm">
                  <li>· Everything in Single Resume</li>
                  <li>· AI cover letters tailored to each job posting</li>
                  <li>· Interview prep brief: likely questions, STAR stories, gaps</li>
                  <li>· All future features included</li>
                </ul>
                <Button asChild className="mt-4 w-full">
                  <Link to="/builder">Start building free</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
          <p className="text-muted-foreground mt-4 text-center text-xs">
            <Lock className="mr-1 inline size-3" />
            Payments processed by Paddle. 7-day money-back guarantee — email
            support@zalize.com. Your card is never stored for recurring billing.
          </p>
        </section>

        {/* FAQ */}
        <section className="bg-muted/40 border-t">
          <div className="mx-auto max-w-3xl space-y-5 px-4 py-12">
            <h2 className="text-center text-2xl font-bold">Honest answers</h2>
            {[
              [
                'Is it really one payment?',
                'Yes. $9.99 (or $19.99 for the bundle) is charged exactly once. There is no plan to cancel because there is no plan — we never store your card for recurring billing.',
              ],
              [
                'What exactly is free?',
                'The full editor, all templates, the live preview, the ATS match score against any job description, and 5 AI rewrites. You pay only to download PDF/DOCX and for unlimited AI.',
              ],
              [
                'Will my resume pass ATS systems?',
                'Our templates are single-column, real-text layouts — the format ATS parsers handle best. The PDF export is text-based (selectable, parseable), never an image, and the DOCX is a genuine Word document.',
              ],
              [
                'Where is my data stored?',
                'In your browser (localStorage). We have no accounts and no resume database. The only content that reaches our server is text you explicitly send for AI rewriting, which is processed and returned, not stored.',
              ],
              [
                'What if I need it on another device?',
                'Your purchase comes with a license key — enter it on any device to unlock downloads there. Resume content itself stays on each device.',
              ],
            ].map(([q, a]) => (
              <div key={q}>
                <h3 className="font-semibold">{q}</h3>
                <p className="text-muted-foreground mt-1 text-sm">{a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="mx-auto max-w-3xl px-4 py-14 text-center">
          <h2 className="text-2xl font-bold">Your next job shouldn&apos;t cost a subscription</h2>
          <Button asChild size="lg" className="mt-5">
            <Link to="/builder">
              Build my resume free <ArrowRight />
            </Link>
          </Button>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
