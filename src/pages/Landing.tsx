import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  Copy,
  FileDown,
  FileText,
  FileUp,
  LayoutDashboard,
  Lock,
  ScanSearch,
  ShieldCheck,
  MessagesSquare,
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
import { IMPORT_ACCEPT, extractTextFromFile } from '@/lib/extractFile'
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
            <div className="absolute top-4 right-4 flex items-center gap-3 dark:bg-card/95 rounded-lg border bg-white/95 px-3.5 py-2.5 shadow-lg backdrop-blur sm:top-8 sm:right-8">
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

const SUITE = [
  {
    icon: FileText,
    title: 'Cover letters',
    text: 'Generate a cover letter tailored to a specific job posting, edit it, and export it on a letterhead PDF or DOCX that matches your resume.',
    cta: 'Write a cover letter',
    to: '/builder?doc=cover',
    learnMore: '/cover-letter-generator/',
  },
  {
    icon: MessagesSquare,
    title: 'Interview prep',
    text: 'Get likely questions for your target role, practice your answers, and receive AI feedback on what worked and what to sharpen.',
    cta: 'Prep for an interview',
    to: '/builder?doc=interview',
    learnMore: '/interview-prep/',
  },
  {
    icon: BriefcaseBusiness,
    title: 'Job search',
    text: 'Browse remote job postings, track applications through a saved-to-offer pipeline, and target your resume or a cover letter at any posting in one click.',
    cta: 'Search jobs',
    to: '/jobs',
  },
  {
    icon: LayoutDashboard,
    title: 'Resume dashboard',
    text: 'Keep a named resume copy per application, manage your cover letters and prep docs, and restore any automatic edit checkpoint.',
    cta: 'Open my dashboard',
    to: '/dashboard',
  },
]

/** Sector cards mirroring EXAMPLE_GROUPS in scripts/build-seo.mjs (static
 * /examples/ pages are generated at build time, so slugs are duplicated here). */
const EXAMPLE_SECTORS = [
  {
    name: 'Tech & data',
    count: 6,
    roles: [
      ['Software Engineer', 'software-engineer'],
      ['Data Analyst', 'data-analyst'],
      ['Product Manager', 'product-manager'],
    ],
  },
  {
    name: 'Business & finance',
    count: 8,
    roles: [
      ['Marketing Manager', 'marketing-manager'],
      ['Accountant', 'accountant'],
      ['Project Manager', 'project-manager'],
    ],
  },
  {
    name: 'Healthcare & education',
    count: 5,
    roles: [
      ['Registered Nurse', 'registered-nurse'],
      ['Medical Assistant', 'medical-assistant'],
      ['Teacher', 'teacher'],
    ],
  },
  {
    name: 'Trades & transport',
    count: 4,
    roles: [
      ['Electrician', 'electrician'],
      ['Truck Driver', 'truck-driver'],
      ['Warehouse Worker', 'warehouse-worker'],
    ],
  },
  {
    name: 'Customer-facing & office',
    count: 7,
    roles: [
      ['Customer Service', 'customer-service'],
      ['Retail Associate', 'retail-associate'],
      ['Administrative Assistant', 'administrative-assistant'],
    ],
  },
] as const

/** Static in-page demos of the builder's core tools, built from the real UI
 * patterns (no invented users or ratings — just the product itself). */
function ShowcaseAtsScore() {
  return (
    <div className="bg-card rounded-xl border p-5 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">ATS match score</p>
        <ScoreRing score={72} size={56} />
      </div>
      <div className="mt-3 text-xs">
        <p className="font-medium text-green-700">Matched (4)</p>
        <div className="mt-1 flex flex-wrap gap-1">
          {['react', 'typescript', 'testing', 'agile'].map((kw) => (
            <span
              key={kw}
              className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-green-800"
            >
              <span aria-hidden className="text-green-600">✓</span> {kw}
            </span>
          ))}
        </div>
        <p className="mt-2 font-medium text-red-700">Missing (2)</p>
        <div className="mt-1 flex flex-wrap gap-1">
          {['kubernetes', 'graphql'].map((kw) => (
            <span key={kw} className="bg-muted inline-flex items-center overflow-hidden rounded-full border">
              <span className="px-2 py-0.5">+ {kw}</span>
              <span className="border-l px-1.5 py-1">
                <Sparkles aria-hidden className="size-3" />
              </span>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

function ShowcaseTailor() {
  return (
    <div className="bg-card space-y-2 rounded-xl border p-5 text-sm shadow-sm">
      <p className="text-muted-foreground text-xs font-medium">Frontend Engineer at Acme</p>
      <p className="text-muted-foreground line-through decoration-red-300">
        Responsible for the checkout page and helped with testing.
      </p>
      <p className="font-medium text-emerald-800">
        Rebuilt the checkout flow in React, cutting load time 38% and raising conversion [add %].
      </p>
      <div className="flex gap-2 pt-1">
        <span className="bg-primary text-primary-foreground inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium">
          <Check className="size-3" /> Accept
        </span>
        <span className="inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium">
          Keep original
        </span>
      </div>
    </div>
  )
}

function ShowcaseBreakdown() {
  const dims: [string, number, string][] = [
    ['Keyword match', 72, 'Missing keyword: "kubernetes"'],
    ['ATS structure', 83, 'Skills section filled · Education listed'],
    ['Quantified impact', 40, 'No number: "Led the migration project…"'],
  ]
  return (
    <div className="bg-card space-y-3 rounded-xl border p-5 shadow-sm">
      <p className="text-sm font-medium">Score breakdown</p>
      {dims.map(([label, score, finding]) => (
        <div key={label}>
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium">{label}</span>
            <span className={score >= 80 ? 'text-emerald-600' : score >= 50 ? 'text-amber-600' : 'text-red-600'}>
              {score}
            </span>
          </div>
          <div aria-hidden className="bg-muted mt-1 h-1.5 w-full overflow-hidden rounded-full">
            <div
              className={`h-full rounded-full ${score >= 80 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-500' : 'bg-red-400'}`}
              style={{ width: `${score}%` }}
            />
          </div>
          <p className="text-muted-foreground mt-0.5 text-xs">{finding}</p>
        </div>
      ))}
    </div>
  )
}

const SHOWCASES: {
  eyebrow: string
  title: string
  text: string
  cta: string
  visual: () => React.JSX.Element
}[] = [
  {
    eyebrow: 'Keyword targeting',
    title: 'See your ATS match — and close every keyword gap',
    text: 'Paste any job description and the match score updates live as you type. Every missing keyword is one click from your Skills list, or one click from an AI-drafted bullet that works it into your real experience.',
    cta: 'Check a job description',
    visual: ShowcaseAtsScore,
  },
  {
    eyebrow: 'AI tailoring',
    title: 'AI rewrites you approve line by line',
    text: 'The AI rewords your summary and bullets toward the job — stronger verbs, the JD’s exact keywords, quantified impact. It never invents facts: gaps become [add %] placeholders, and nothing changes until you accept it.',
    cta: 'Tailor my resume',
    visual: ShowcaseTailor,
  },
  {
    eyebrow: 'Score breakdown',
    title: 'Know exactly what to fix, and what it’s worth',
    text: 'One dialog breaks your score into keyword match, ATS structure and six writing-quality checks — each with the specific lines to fix. Transparent rules, computed in your browser, no black box.',
    cta: 'See my breakdown',
    visual: ShowcaseBreakdown,
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

/** Hero drop zone: extracts an uploaded resume in the browser and opens the ATS checker scored. */
function HeroResumeDrop() {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)

  const handleFile = (file: File | undefined) => {
    if (!file || busy) return
    setBusy(true)
    setError('')
    extractTextFromFile(file)
      .then((text) => {
        if (text.trim().length < 30) {
          setError('No text found in this file — it may be a scanned image. Try the checker and paste your resume instead.')
          setBusy(false)
          return
        }
        void navigate('/ats-checker', { state: { resumeText: text } })
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Could not read this file.')
        setBusy(false)
      })
  }

  return (
    <div className="animate-rise mx-auto mt-6 max-w-xl [--rise-delay:240ms]">
      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          handleFile(e.dataTransfer.files?.[0])
        }}
        className={`flex min-h-14 w-full items-center justify-center gap-2.5 rounded-xl border-2 border-dashed px-4 py-3 text-sm transition-colors ${
          dragOver
            ? 'border-primary bg-primary/5 text-foreground'
            : 'text-muted-foreground hover:border-primary/50 hover:text-foreground border-border dark:bg-card/60 bg-white/60'
        }`}
      >
        <FileUp className="size-4 shrink-0" />
        {busy ? (
          'Reading your resume…'
        ) : (
          <span>
            <span className="text-foreground font-medium">Upload or drop your resume</span>
            {' — get your free ATS score'}
          </span>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={IMPORT_ACCEPT}
        className="hidden"
        onChange={(e) => {
          handleFile(e.target.files?.[0])
          e.target.value = ''
        }}
      />
      {error && <p className="text-destructive mt-2 text-xs">{error}</p>}
      <p className="text-muted-foreground mt-2 text-xs">
        PDF, DOCX or TXT · read entirely in your browser — never uploaded to a server.
      </p>
    </div>
  )
}

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
              <span className="hidden lg:inline">Build my resume</span>
              <span className="lg:hidden">Builder</span> <ArrowRight />
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
          <HeroResumeDrop />
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

        {/* The problem: ATS filtering */}
        <section aria-labelledby="problem-heading" className="mx-auto max-w-5xl px-4 pt-24">
          <div className="grid items-center gap-10 md:grid-cols-2">
            <div>
              <p className="text-primary text-sm font-medium tracking-widest uppercase">The problem</p>
              <h2 id="problem-heading" className="mt-2 text-3xl font-semibold tracking-tight">
                It&apos;s usually not a person rejecting you — it&apos;s a parser
              </h2>
              <p className="text-muted-foreground mt-4">
                Most companies run every resume through Applicant Tracking Systems (ATS)
                before a recruiter ever sees it. If the software can&apos;t parse your
                layout, or the keywords from the job posting aren&apos;t there, you&apos;re
                filtered out — silently, with no explanation.
              </p>
              <p className="text-muted-foreground mt-3">
                That&apos;s why every RezUp template is single-column real text, and why
                the match score checks your resume against the actual job description
                before you send it.
              </p>
              <Button asChild variant="outline" className="mt-5">
                <Link to="/ats-checker">
                  Run the free ATS check <ArrowRight />
                </Link>
              </Button>
            </div>
            <div aria-hidden className="bg-card mx-auto w-full max-w-md rounded-xl border p-5 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-medium">
                <ScanSearch className="text-primary size-4" /> Applicant Tracking System
              </div>
              <div className="mt-4 space-y-2 text-xs">
                {(
                  [
                    ['Name', 'Detected', true],
                    ['Contact info', 'Detected', true],
                    ['Experience', '3 positions detected', true],
                    ['Skills', 'Parsed as body text', false],
                  ] as [string, string, boolean][]
                ).map(([field, status, ok]) => (
                  <div key={field} className="flex items-center justify-between rounded-md border px-3 py-2">
                    <span className="font-medium">{field}</span>
                    <span className={ok ? 'text-emerald-600' : 'text-red-600'}>{status}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-md border bg-red-50 px-3 py-2.5 text-xs text-red-800">
                Match against job description: <strong>47%</strong> — filtered out before
                a recruiter sees it
              </div>
            </div>
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

        {/* Feature showcases */}
        <section aria-labelledby="showcase-heading" className="mx-auto max-w-5xl space-y-20 px-4 pb-24">
          <h2 id="showcase-heading" className="sr-only">
            The tools in action
          </h2>
          {SHOWCASES.map((s, i) => (
            <div
              key={s.eyebrow}
              className={`grid items-center gap-8 md:grid-cols-2 ${i % 2 === 1 ? 'md:[&>*:first-child]:order-2' : ''}`}
            >
              <div>
                <p className="text-primary text-sm font-medium tracking-widest uppercase">{s.eyebrow}</p>
                <h3 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{s.title}</h3>
                <p className="text-muted-foreground mt-3">{s.text}</p>
                <Button asChild variant="outline" className="mt-5">
                  <Link to="/builder">
                    {s.cta} <ArrowRight />
                  </Link>
                </Button>
              </div>
              <div aria-hidden className="mx-auto w-full max-w-md">
                <s.visual />
              </div>
            </div>
          ))}
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

        {/* Product suite */}
        <section aria-labelledby="suite-heading" className="mx-auto max-w-5xl px-4 pb-24">
          <h2 id="suite-heading" className="text-center text-3xl font-semibold tracking-tight">
            More than a resume builder
          </h2>
          <p className="text-muted-foreground mx-auto mt-2 max-w-2xl text-center text-sm">
            Everything from finding the posting to walking into the interview — all free
            during beta, all working from the same resume.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {SUITE.map((s) => (
              <Card
                key={s.title}
                className="py-0 transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-md"
              >
                <CardContent className="flex h-full flex-col p-5">
                  <s.icon className="text-primary mb-2 size-6" />
                  <h3 className="font-semibold">{s.title}</h3>
                  <p className="text-muted-foreground mt-1 text-sm">{s.text}</p>
                  <div className="mt-auto flex items-center gap-4 pt-3">
                    <Button asChild variant="link" className="h-auto px-0">
                      <Link to={s.to}>
                        {s.cta} <ArrowRight />
                      </Link>
                    </Button>
                    {'learnMore' in s && (
                      <a
                        href={s.learnMore}
                        className="text-muted-foreground hover:text-foreground text-sm underline underline-offset-4"
                      >
                        How it works
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
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

        {/* Resume examples */}
        <section aria-labelledby="examples-heading" className="mx-auto max-w-5xl px-4 pb-24">
          <h2 id="examples-heading" className="text-center text-3xl font-semibold tracking-tight">
            Steal the structure from 30 real resume examples
          </h2>
          <p className="text-muted-foreground mx-auto mt-2 max-w-2xl text-center text-sm">
            Complete resumes for real roles — summary, bullets, skills and all — not
            lorem ipsum. Open one, see how it's put together, then start yours.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {EXAMPLE_SECTORS.map((s) => (
              <Card
                key={s.name}
                className="py-0 transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-md"
              >
                <CardContent className="p-5">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="font-semibold">{s.name}</h3>
                    <span className="text-muted-foreground text-xs">{s.count} examples</span>
                  </div>
                  <ul className="mt-2">
                    {s.roles.map(([role, slug]) => (
                      <li key={slug}>
                        <a
                          className="text-muted-foreground hover:text-primary flex min-h-10 items-center text-sm underline-offset-4 hover:underline"
                          href={`/examples/${slug}/`}
                        >
                          {role} resume example
                        </a>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
            <Card className="border-dashed py-0">
              <CardContent className="flex h-full flex-col items-start justify-center p-5">
                <h3 className="font-semibold">Every role, one place</h3>
                <p className="text-muted-foreground mt-1 text-sm">
                  All 30 examples, grouped by sector, each with a matching template you
                  can start from.
                </p>
                <Button asChild variant="link" className="mt-2 h-auto min-h-10 px-0">
                  <a href="/examples/">
                    View all 30 examples <ArrowRight />
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
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
                  <Badge className="bg-emerald-700 text-white">Best value</Badge>
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
          <div className="mt-6 flex justify-center">
            <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-900">
              <ShieldCheck className="size-4 shrink-0" />
              7-day money-back guarantee · your card is never stored
            </div>
          </div>
          <p className="text-muted-foreground mt-3 text-center text-xs">
            <Lock className="mr-1 inline size-3" />
            {freeMode
              ? 'No payment is collected during the beta — no card on file, nothing that renews.'
              : 'Payments processed by our merchant of record. Refunds within 7 days — email support@zalize.com.'}
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
                    <th className="py-2.5 pl-3 text-left font-medium text-neutral-400">
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
                      <td className="py-3 pl-3 text-neutral-400">{them}</td>
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
                  ? 'Everything in both plans: the full editor, all 25 templates, the live preview, the ATS match score, AI tools, and PDF/DOCX downloads. We only ask for an email before your first download.'
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
                'Will the AI invent experience I don\u2019t have?',
                'No. The AI only rewords what you actually wrote — stronger verbs, the job posting\u2019s keywords, clearer impact. Where a number would help but you didn\u2019t give one, it inserts an [add %] placeholder for you to fill in. Nothing changes until you accept each edit.',
              ],
              [
                'Can I import my LinkedIn profile or an existing resume?',
                'Yes. Upload the PDF LinkedIn saves from your profile (More \u2192 Save to PDF), or any PDF/DOCX/TXT resume, and the sections are pre-filled for you to review — entirely in your browser, nothing is uploaded to a server.',
              ],
              [
                'How is RezUp different from Zety or LiveCareer?',
                'One payment instead of a recurring subscription, AI that never fabricates, and no account or server-side resume storage. See the detailed side-by-side pages: RezUp vs Zety and RezUp vs LiveCareer, linked in the footer.',
              ],
              [
                'Can I keep editing after I pay?',
                'Forever. Your one-time purchase unlocks unlimited downloads — come back next year, update your resume, and export again at no extra cost.',
              ],
              [
                'How do refunds work?',
                'If RezUp isn\u2019t for you, email support@zalize.com within 7 days of purchase for a full refund — no forms, no retention flow. Since we never store your card, there\u2019s nothing to cancel afterwards.',
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
