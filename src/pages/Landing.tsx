import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BadgeCheck,
  Ban,
  Copy,
  FileDown,
  Lock,
  ShieldCheck,
  Sparkles,
  Target,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { SiteFooter, SiteHeader, usePageMeta } from '@/components/Layout'
import { useFreeMode } from '@/components/Paywall'
import { TemplateThumb } from '@/components/TemplateThumb'
import { TEMPLATES, TEMPLATE_FILTERS } from '@/lib/templates'

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
    text: 'No account, no sign-up. Your resume lives in your browser, with one-click JSON backup and restore. The only data we ever see is text you explicitly send for AI rewriting.',
  },
  {
    icon: Copy,
    title: 'One copy per job',
    text: 'Save a named copy of your resume for every application — tailor keywords for job B without losing the version you sent to job A.',
  },
  {
    icon: BadgeCheck,
    title: 'Clickable, ATS-clean exports',
    text: 'Your email, website and LinkedIn are live links in both the PDF and the DOCX — recruiters click straight through, and parsers still read every word.',
  },
]

const COMPARISON: [string, string, string][] = [
  ['Cost to download your resume', '$9.99 once', '$1.95–$2.95 “trial” → $25.95–$29.95 every 4 weeks'],
  ['Cost over a 6-month job search', '$9.99', '$150–$180'],
  ['AI rewriting', 'Never invents facts — marks gaps with [add %]', 'Often fabricates metrics and experience'],
  ['Auto-renews / recurring charges', 'Never', 'Yes — cancellation buried in menus'],
  ['ATS match score', 'Free, before paying', 'Behind the paywall'],
  ['Card stored after purchase', 'No', 'Yes, and charged again'],
  ['Account required', 'No', 'Yes'],
  ['Your resume data', 'Stays in your browser', 'Stored on their servers'],
]

export default function Landing() {
  usePageMeta(
    'HonestCV — One-Time Payment Resume Builder. No Subscriptions, Ever.',
    'HonestCV: the resume builder you pay for once — currently in beta with a full free trial of every plan. ATS-friendly templates, free ATS match score, AI rewrites, real PDF & DOCX export. No subscription, no auto-renewal, no trial trap.'
  )
  const freeMode = useFreeMode()
  const [galleryFilter, setGalleryFilter] = useState('all')
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
        <section className="relative mx-auto max-w-4xl px-4 pt-16 pb-12 text-center">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 -top-14 -z-10 mx-auto h-[420px] max-w-5xl"
            style={{
              background:
                'radial-gradient(60% 70% at 30% 20%, oklch(0.5 0.18 265 / 0.10), transparent 70%), radial-gradient(50% 60% at 75% 35%, oklch(0.7 0.15 165 / 0.10), transparent 70%)',
            }}
          />
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
                <strong> We&apos;re in beta: every plan is a full free trial</strong> — no card, no
                auto-renewal, nothing that renews.
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
                Start your free trial — no sign-up <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/ats-checker">
                <Target /> Check my resume&apos;s ATS score
              </Link>
            </Button>
          </div>
          <p className="text-muted-foreground mt-3 text-sm">
            {freeMode
              ? 'Beta free trial: editor, templates, ATS score, AI tools and downloads — all included.'
              : 'Editing, templates & ATS score are free. Pay only to download.'}
          </p>
        </section>

        {/* Features */}
        <section aria-labelledby="features-heading" className="mx-auto grid max-w-5xl gap-4 px-4 py-8 sm:grid-cols-2">
          <h2 id="features-heading" className="sr-only">
            What you get
          </h2>
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

        {/* Templates gallery */}
        <section aria-labelledby="templates-heading" className="mx-auto max-w-5xl px-4 py-10">
          <h2 id="templates-heading" className="text-center text-2xl font-bold">
            22 ATS-safe templates, one honest layout rule
          </h2>
          <p className="text-muted-foreground mx-auto mt-2 max-w-2xl text-center text-sm">
            Every template is single-column real text — the format ATS parsers read
            cleanly. Pick a look, then switch any time; your content stays put.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2" role="group" aria-label="Filter templates by style">
            {TEMPLATE_FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                aria-pressed={galleryFilter === f.id}
                onClick={() => setGalleryFilter(f.id)}
                className={`rounded-full border px-3 py-1 text-xs transition ${
                  galleryFilter === f.id
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'hover:border-primary'
                }`}
              >
                {f.label} ({TEMPLATES.filter(f.match).length})
              </button>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {TEMPLATES.filter(
              (TEMPLATE_FILTERS.find((f) => f.id === galleryFilter) ?? TEMPLATE_FILTERS[0]).match,
            ).map((t) => (
              <Link
                key={t.id}
                to={`/builder?template=${t.id}`}
                title={t.description}
                className="hover:border-primary w-20 rounded-md border p-1.5 transition"
              >
                <TemplateThumb t={t} />
                <span className="mt-1 block truncate text-center text-xs">{t.name}</span>
                <span className="text-muted-foreground block truncate text-center text-[10px]">
                  {t.tags[0]}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Why one-time */}
        <section className="bg-muted/40 border-y">
          <div className="mx-auto max-w-4xl px-4 py-12">
            <h2 className="text-center text-2xl font-bold">
              Why we&apos;ll never charge you monthly
            </h2>
            <p className="text-muted-foreground mx-auto mt-3 max-w-2xl text-center text-sm">
              &ldquo;Zety charged me&rdquo; is one of the most-searched complaints in this
              category. We tested the big builders ourselves (August 2026): a
              $1.95&ndash;$2.95 &ldquo;trial&rdquo; silently becomes $25.95&ndash;$29.95 every
              four weeks, the trial is pre-selected at checkout, and free downloads are
              limited to plain .txt files. A resume is something you need for a few weeks,
              a couple of times a decade — it should be a product you buy, not a
              subscription that hunts you.
            </p>
            <div
              className="mt-8 overflow-x-auto"
              tabIndex={0}
              role="region"
              aria-label="Pricing comparison with other resume builders"
            >
              <table className="w-full min-w-[560px] border-collapse text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 pr-4 text-left font-medium">
                      <span className="sr-only">Feature</span>
                    </th>
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
            Pay once, never a subscription. Both plans are in a full free trial while we&apos;re in beta.
          </p>
          {freeMode && (
            <div className="mx-auto mt-4 max-w-xl rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-center text-sm text-emerald-900">
              <strong>Beta free trial:</strong> both plans below are fully unlocked at no
              charge while we're in beta — downloads included. When billing opens they'll
              stay one-time, never a subscription.
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
                  <li>· All 22 ATS-friendly templates</li>
                  <li>· Edit and re-download forever</li>
                </ul>
                <Button asChild className="mt-4 w-full" variant="outline">
                  <Link to="/builder">Start free trial</Link>
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
                  <Link to="/builder">Start free trial</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
          <p className="text-muted-foreground mt-4 text-center text-xs">
            <Lock className="mr-1 inline size-3" />
            {freeMode
              ? 'No payment is collected during the beta trial — no card on file, nothing that renews.'
              : 'Payments processed by our merchant of record. 7-day money-back guarantee — email support@zalize.com. Your card is never stored for recurring billing.'}
          </p>
        </section>

        {/* FAQ */}
        <section className="bg-muted/40 border-t">
          <div className="mx-auto max-w-3xl space-y-5 px-4 py-12">
            <h2 className="text-center text-2xl font-bold">Honest answers</h2>
            {[
              [
                'Is it really one payment?',
                freeMode
                  ? 'Yes — and during the beta the trial covers everything at no charge. When billing opens, $9.99 (or $19.99 for the bundle) will be charged exactly once. Never a subscription, never a stored card.'
                  : 'Yes. $9.99 (or $19.99 for the bundle) is charged exactly once. There is no plan to cancel because there is no plan — we never store your card for recurring billing.',
              ],
              [
                'What does the beta free trial include?',
                freeMode
                  ? 'Everything in both plans: the full editor, all 22 templates, the live preview, the ATS match score, AI tools, and PDF/DOCX downloads. We only ask for an email before your first download.'
                  : 'The full editor, all templates, the live preview, the ATS match score against any job description, and 5 AI rewrites. You pay only to download PDF/DOCX and for unlimited AI.',
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
                freeMode
                  ? 'During the beta trial, downloads work on every device. Resume content lives in each browser — export a PDF/DOCX or paste your text to move it between devices.'
                  : 'Your purchase comes with a license key — enter it on any device to unlock downloads there. Resume content itself stays on each device.',
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
              Start my free trial <ArrowRight />
            </Link>
          </Button>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
