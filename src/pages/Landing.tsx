import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BadgeCheck,
  ChevronDown,
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
import { ResumePreview } from '@/components/ResumePreview'
import { TemplateThumb } from '@/components/TemplateThumb'
import { ScoreRing } from '@/components/ScoreRing'
import { sampleResume } from '@/lib/resume'
import { TEMPLATES, TEMPLATE_FILTERS } from '@/lib/templates'

const HERO_RESUME = sampleResume()

/** Skeleton bar for the schematic editor column in the product mock. */
function MockField({ label, w = 'w-full' }: { label: string; w?: string }) {
  return (
    <div>
      <p className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
        {label}
      </p>
      <div className={`bg-muted mt-1 h-6 rounded-md border ${w}`} />
    </div>
  )
}

/** Browser-framed builder mock: editor column + live preview + score ring. */
function ProductMock() {
  return (
    <div className="animate-rise mx-auto mt-14 w-full max-w-5xl px-4 [--rise-delay:240ms]">
      <div className="bg-background overflow-hidden rounded-xl border shadow-2xl">
        <div className="bg-muted/60 flex items-center gap-1.5 border-b px-4 py-2.5" aria-hidden>
          <span className="size-2.5 rounded-full bg-red-400/70" />
          <span className="size-2.5 rounded-full bg-amber-400/70" />
          <span className="size-2.5 rounded-full bg-emerald-400/70" />
          <span className="text-muted-foreground bg-background ml-3 rounded-md border px-3 py-0.5 text-xs">
            cv.zalize.com/builder
          </span>
        </div>
        <div className="grid md:grid-cols-[250px_1fr]">
          <div className="hidden space-y-4 border-r p-5 md:block" aria-hidden>
            <MockField label="Full name" />
            <MockField label="Job title" w="w-4/5" />
            <MockField label="Professional summary" />
            <div className="bg-muted h-16 rounded-md border" />
            <MockField label="Work experience" />
            <div className="bg-muted h-12 rounded-md border" />
            <MockField label="Skills" w="w-3/4" />
            <div className="bg-primary/90 mt-2 flex h-9 items-center justify-center rounded-md">
              <span className="text-primary-foreground text-xs font-medium">Rewrite with AI</span>
            </div>
          </div>
          <div
            className="relative bg-slate-100 p-4 sm:p-8"
            style={{
              maskImage: 'linear-gradient(to bottom, black 82%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, black 82%, transparent 100%)',
            }}
          >
            <div className="mx-auto max-h-[420px] max-w-[540px] overflow-hidden sm:max-h-[480px]">
              <div className="shadow-xl">
                <ResumePreview resume={HERO_RESUME} />
              </div>
            </div>
            <div className="absolute top-4 right-4 flex items-center gap-3 rounded-lg border bg-white/95 px-3.5 py-2.5 shadow-lg backdrop-blur sm:top-8 sm:right-8">
              <ScoreRing score={86} size={56} />
              <div className="text-left text-xs">
                <p className="font-semibold">ATS match score</p>
                <p className="text-muted-foreground">Free · live · in your browser</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

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
    'RezUp — AI Resume Builder. ATS-Friendly Resumes in Minutes.',
    'RezUp: the AI resume builder that gets you interviews faster — free during beta. ATS-friendly templates, free ATS match score, AI rewrites, real PDF & DOCX export. Pay once if you ever pay; never a subscription.'
  )
  const freeMode = useFreeMode()
  const [galleryFilter, setGalleryFilter] = useState('all')
  const [openFaq, setOpenFaq] = useState(0)
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
        <section className="relative mx-auto max-w-6xl px-4 pt-16 pb-4 text-center sm:pt-20">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 -top-14 -z-10 mx-auto h-[420px] max-w-5xl"
            style={{
              background:
                'radial-gradient(60% 70% at 30% 20%, oklch(0.5 0.18 265 / 0.10), transparent 70%), radial-gradient(50% 60% at 75% 35%, oklch(0.7 0.15 165 / 0.10), transparent 70%)',
            }}
          />
          <div className="mx-auto max-w-3xl">
          <Badge variant="secondary" className="animate-rise mb-4 gap-1">
            <Sparkles className="size-3" /> AI-powered. ATS-friendly. Free during beta.
          </Badge>
          <h1 className="animate-rise text-4xl font-semibold tracking-tight [--rise-delay:60ms] sm:text-[3.4rem] sm:leading-[1.1]">
            The AI resume builder that gets you <span className="underline decoration-emerald-500 decoration-4 underline-offset-4">interviews</span>
          </h1>
          <p className="text-muted-foreground animate-rise mx-auto mt-5 max-w-2xl text-lg [--rise-delay:120ms]">
            {freeMode ? (
              <>
                Build an ATS-friendly resume in minutes with AI tailoring and a free
                match score. <strong>Every plan is free during beta</strong> — no card,
                no auto-renewal, nothing that renews.
              </>
            ) : (
              <>
                Build an ATS-friendly resume in minutes with AI tailoring and a free
                match score. Pay <strong>$9.99 one time</strong> to download — not
                $25.95 every four weeks until you remember to cancel.
              </>
            )}
          </p>
          <div className="animate-rise mt-7 flex flex-col items-center justify-center gap-3 [--rise-delay:180ms] sm:flex-row">
            <Button asChild size="lg">
              <Link to="/builder">
                Start free — no sign-up <ArrowRight />
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
              ? 'Free during beta: editor, templates, ATS score, AI tools and downloads — all included.'
              : 'Editing, templates & ATS score are free. Pay only to download.'}
          </p>
          </div>
          <ProductMock />
        </section>

        {/* Trust band */}
        <section aria-label="Why job seekers trust RezUp" className="bg-muted/40 mt-16 border-y">
          <div className="mx-auto grid max-w-5xl grid-cols-2 gap-x-4 gap-y-8 px-4 py-12 text-center sm:grid-cols-4">
            {(
              [
                [`${TEMPLATES.length}`, 'ATS-safe templates, all included'],
                ['30', 'role-specific resume examples'],
                ['35+', 'free, honest resume guides'],
                ['0', 'subscriptions — pay once or nothing'],
              ] as [string, string][]
            ).map(([num, label]) => (
              <div key={label}>
                <p className="text-3xl font-semibold tracking-tight sm:text-4xl">{num}</p>
                <p className="text-muted-foreground mt-1 text-sm">{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section aria-labelledby="how-heading" className="mx-auto max-w-5xl px-4 py-24">
          <h2 id="how-heading" className="text-center text-3xl font-semibold tracking-tight">
            From blank page to sent application in three steps
          </h2>
          <ol className="mt-6 grid gap-4 sm:grid-cols-3">
            {(
              [
                [
                  'Add your experience',
                  'Type it in, import your existing PDF/DOCX resume, or start from an example. Everything stays in your browser.',
                ],
                [
                  'Tailor it to the job',
                  'Paste the job description for a free ATS match score, then let the AI reword your real bullets toward it — you approve every change.',
                ],
                [
                  'Download and apply',
                  'Export a text-based PDF or a real DOCX — ATS-clean, clickable contact links, no watermark.',
                ],
              ] as [string, string][]
            ).map(([title, text], i) => (
              <li
                key={title}
                className={`relative rounded-lg border p-5 ${i === 1 ? 'border-primary/50 shadow-sm' : ''}`}
              >
                {i === 1 && (
                  <Badge className="absolute -top-2.5 right-4 gap-1">
                    <Sparkles className="size-3" /> The RezUp difference
                  </Badge>
                )}
                <span
                  aria-hidden
                  className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-full text-sm font-semibold"
                >
                  {i + 1}
                </span>
                <h3 className="mt-3 font-semibold">{title}</h3>
                <p className="text-muted-foreground mt-1 text-sm">{text}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Features */}
        <section aria-labelledby="features-heading" className="mx-auto grid max-w-5xl gap-4 px-4 pb-24 sm:grid-cols-2">
          <h2 id="features-heading" className="sr-only">
            What you get
          </h2>
          {FEATURES.map((f) => (
            <Card
              key={f.title}
              className="py-0 transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <CardContent className="p-5">
                <f.icon className="text-primary mb-2 size-6" />
                <h3 className="font-semibold">{f.title}</h3>
                <p className="text-muted-foreground mt-1 text-sm">{f.text}</p>
              </CardContent>
            </Card>
          ))}
          <p className="text-muted-foreground mt-2 text-center text-sm sm:col-span-2">
            Curious how the AI works?{' '}
            <a className="text-primary underline underline-offset-4" href="/ai/">
              Explore the AI toolkit
            </a>
            .
          </p>
        </section>

        {/* Templates gallery */}
        <section aria-labelledby="templates-heading" className="mx-auto max-w-5xl px-4 py-24">
          <h2 id="templates-heading" className="text-center text-3xl font-semibold tracking-tight">
            22 ATS-safe templates, one layout rule
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
                className={`min-h-11 rounded-full border px-3.5 py-1 text-xs transition sm:min-h-8 ${
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
                className="hover:border-primary w-20 rounded-md border p-1.5 transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-md"
              >
                <TemplateThumb t={t} />
                <span className="mt-1 block truncate text-center text-xs">{t.name}</span>
                <span className="text-muted-foreground block truncate text-center text-[10px]">
                  {t.tags[0]}
                </span>
              </Link>
            ))}
          </div>
          <p className="text-muted-foreground mt-6 text-center text-sm">
            Not sure what to write? Browse{' '}
            <a className="text-primary underline underline-offset-4" href="/examples/">
              30 complete resume examples by role
            </a>{' '}
            — nurse, engineer, electrician, accountant, retail and more.
          </p>
        </section>

        {/* Pricing */}
        <section className="mx-auto max-w-4xl px-4 py-24">
          <h2 className="text-center text-3xl font-semibold tracking-tight">Simple pricing</h2>
          <p className="text-muted-foreground mt-2 text-center text-sm">
            Pay once, never a subscription. Both plans are free during beta.{' '}
            <a className="text-primary underline underline-offset-4" href="/pricing/">
              See full pricing details
            </a>
            .
          </p>
          {freeMode && (
            <div className="mx-auto mt-4 max-w-xl rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-center text-sm text-emerald-900">
              <strong>Free during beta:</strong> both plans below are fully unlocked at no
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
                <p className="mt-3 text-[2.75rem] leading-none font-bold tracking-tight">
                  $9.99 <span className="text-muted-foreground text-sm font-normal">once, forever</span>
                </p>
                <ul className="text-muted-foreground mt-3 space-y-1.5 text-sm">
                  <li>· Unlimited PDF + DOCX downloads, no watermark</li>
                  <li>· Unlimited AI rewrites &amp; job-targeted tailoring</li>
                  <li>· All 22 ATS-friendly templates</li>
                  <li>· Edit and re-download forever</li>
                </ul>
                <Button asChild className="mt-4 w-full" variant="outline">
                  <Link to="/builder">Start free</Link>
                </Button>
              </CardContent>
            </Card>
            <Card className="border-0 bg-neutral-950 py-0 text-white shadow-xl sm:scale-[1.04]">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Career Bundle</h3>
                  <Badge className="bg-emerald-500 text-white">Best value</Badge>
                </div>
                <p className="mt-3 text-[2.75rem] leading-none font-bold tracking-tight">
                  $19.99 <span className="text-sm font-normal text-neutral-400">once, forever</span>
                </p>
                <ul className="mt-4 space-y-1.5 text-sm text-neutral-300">
                  <li>· Everything in Single Resume</li>
                  <li>· AI cover letters tailored to each job posting</li>
                  <li>· Interview prep brief: likely questions, STAR stories, gaps</li>
                  <li>· All future features included</li>
                </ul>
                <Button asChild className="mt-5 w-full bg-white text-neutral-950 hover:bg-neutral-200">
                  <Link to="/builder">Start free</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
          <p className="text-muted-foreground mt-4 text-center text-xs">
            <Lock className="mr-1 inline size-3" />
            {freeMode
              ? 'No payment is collected during the beta — no card on file, nothing that renews.'
              : 'Payments processed by our merchant of record. 7-day money-back guarantee — email support@zalize.com. Your card is never stored for recurring billing.'}
          </p>
        </section>

        {/* Never monthly — dark story section */}
        <section className="bg-neutral-950 text-white">
          <div className="mx-auto max-w-4xl px-4 py-24 sm:py-32">
            <p className="text-sm font-medium tracking-widest text-emerald-400 uppercase">
              The RezUp promise
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl sm:leading-[1.1]">
              We&apos;ll never charge you monthly.
            </h2>
            <p className="mt-6 max-w-2xl text-neutral-400">
              &ldquo;Zety charged me&rdquo; is one of the most-searched complaints in this
              category. We tested the big builders ourselves (August 2026): a
              $1.95&ndash;$2.95 &ldquo;trial&rdquo; silently becomes $25.95&ndash;$29.95 every
              four weeks, the trial is pre-selected at checkout, and free downloads are
              limited to plain .txt files. A resume is something you need for a few weeks,
              a couple of times a decade — it should be a product you buy, not a
              subscription that hunts you.
            </p>
            <div
              className="mt-12 overflow-x-auto"
              tabIndex={0}
              role="region"
              aria-label="Pricing comparison with other resume builders"
            >
              <table className="w-full min-w-[560px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-white/15">
                    <th className="py-2.5 pr-4 text-left font-medium">
                      <span className="sr-only">Feature</span>
                    </th>
                    <th className="bg-white/5 px-3 py-2.5 text-left font-semibold text-emerald-400">
                      RezUp
                    </th>
                    <th className="py-2.5 pl-3 text-left font-medium text-neutral-500">
                      Typical subscription builder
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON.map(([label, us, them]) => (
                    <tr key={label} className="border-b border-white/10 last:border-0">
                      <td className="py-3 pr-4 font-medium text-neutral-200">{label}</td>
                      <td className="bg-white/5 px-3 py-3">
                        <span className="inline-flex items-center gap-1.5 text-emerald-400">
                          <BadgeCheck className="size-4 shrink-0" /> {us}
                        </span>
                      </td>
                      <td className="py-3 pl-3 text-neutral-500">{them}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-muted/40 border-t">
          <div className="mx-auto max-w-3xl px-4 py-24">
            <h2 className="text-center text-3xl font-semibold tracking-tight">Frequently asked questions</h2>
            <div className="mt-8">
            {[
              [
                'Is it really one payment?',
                freeMode
                  ? 'Yes — and everything is free during the beta. When billing opens, $9.99 (or $19.99 for the bundle) will be charged exactly once. Never a subscription, never a stored card.'
                  : 'Yes. $9.99 (or $19.99 for the bundle) is charged exactly once. There is no plan to cancel because there is no plan — we never store your card for recurring billing.',
              ],
              [
                'What does “free during beta” include?',
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
                  ? 'During the beta, downloads work on every device. Resume content lives in each browser — export a PDF/DOCX or paste your text to move it between devices.'
                  : 'Your purchase comes with a license key — enter it on any device to unlock downloads there. Resume content itself stays on each device.',
              ],
            ].map(([q, a], i) => (
              <div key={q} className="border-b last:border-0">
                <button
                  type="button"
                  className="flex min-h-11 w-full items-center justify-between gap-4 py-4 text-left font-semibold"
                  aria-expanded={openFaq === i}
                  onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
                >
                  {q}
                  <ChevronDown
                    className={`text-muted-foreground size-4 shrink-0 transition-transform duration-200 ${
                      openFaq === i ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <div
                  className={`grid transition-[grid-template-rows] duration-200 ease-out ${
                    openFaq === i ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="text-muted-foreground pb-4 text-sm">{a}</p>
                  </div>
                </div>
              </div>
            ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="mx-auto max-w-3xl px-4 py-24 text-center">
          <h2 className="text-3xl font-semibold tracking-tight">
            Your next job shouldn&apos;t cost a subscription
          </h2>
          <Button asChild size="lg" className="mt-6">
            <Link to="/builder">
              Start building free <ArrowRight />
            </Link>
          </Button>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
