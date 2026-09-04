import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, BadgeCheck, CircleAlert, FileUp, Target } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ScanIllustration } from '@/components/Illustrations'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { SiteFooter, SiteHeader, usePageMeta } from '@/components/Layout'
import { ScoreRing } from '@/components/ScoreRing'
import {
  CHECK_CATEGORIES,
  applicationReadiness,
  highPriorityKeywords,
  scoreResumeText,
} from '@/lib/ats'
import { IMPORT_ACCEPT, extractResumeFile, type FileCheck } from '@/lib/extractFile'
import { priorityFixes, resumeHealth } from '@/lib/guidance'
import { parseResumeText } from '@/lib/importText'
import { loadResume, saveResume, setActiveVersionId } from '@/lib/resume'

const EXAMPLE_RESUME = `Jordan Reyes
Software Engineer
jordan.reyes@email.com | (555) 210-4432 | Austin, TX

Summary
Software engineer with 5 years of experience building web applications and APIs.

Experience
Software Engineer — Acme Corp | Jun 2021 – Present
- Built REST APIs in Node.js serving 2M requests/day
- Cut deployment time from 40 to 12 minutes by introducing CI/CD pipelines

Junior Developer — Startly | Jul 2019 – May 2021
- Developed React components used across 3 product teams

Education
University of Texas at Austin — BS, Computer Science, 2019

Skills
JavaScript, TypeScript, React, Node.js, PostgreSQL, Docker`

const EXAMPLE_JD = `We are looking for a Senior Software Engineer to join our platform team.

Requirements:
- 4+ years of experience with JavaScript/TypeScript and React
- Experience building and operating REST APIs (Node.js)
- Familiarity with PostgreSQL, Docker and Kubernetes
- Experience with CI/CD pipelines and AWS
- Strong communication skills`

type JdSegment = { text: string; kind: 'plain' | 'matched' | 'missing' }

/** Split the JD into segments so matched/missing keywords can be highlighted inline. */
function segmentJd(jd: string, matched: string[], missing: string[]): JdSegment[] {
  const kinds = new Map<string, 'matched' | 'missing'>()
  for (const k of matched) kinds.set(k.toLowerCase(), 'matched')
  for (const k of missing) kinds.set(k.toLowerCase(), 'missing')
  const kws = [...kinds.keys()].sort((a, b) => b.length - a.length)
  if (kws.length === 0) return [{ text: jd, kind: 'plain' }]
  const escaped = kws.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const re = new RegExp(`(?<![\\w/#+.-])(${escaped.join('|')})(?![\\w/#+-])`, 'gi')
  const out: JdSegment[] = []
  let last = 0
  for (const m of jd.matchAll(re)) {
    const i = m.index
    if (i > last) out.push({ text: jd.slice(last, i), kind: 'plain' })
    out.push({ text: m[0], kind: kinds.get(m[0].toLowerCase()) ?? 'matched' })
    last = i + m[0].length
  }
  if (last < jd.length) out.push({ text: jd.slice(last), kind: 'plain' })
  return out
}

const DRAFT_KEY = 'honestcv.atsCheckerDraft'

interface CheckerDraft {
  resumeText: string
  jd: string
  checked: boolean
}

/** Same-tab draft of the pasted texts, so a refresh doesn't lose them. */
function loadDraft(): CheckerDraft | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return null
    const d = parsed as Partial<Record<keyof CheckerDraft, unknown>>
    if (typeof d.resumeText !== 'string' || typeof d.jd !== 'string') return null
    return { resumeText: d.resumeText, jd: d.jd, checked: d.checked === true }
  } catch {
    return null
  }
}

export default function AtsChecker() {
  usePageMeta(
    'Free ATS Resume Checker — Instant Match Score | RezUp',
    'Paste your resume and a job description to get an instant ATS match score, missing keywords and format checks. 100% free, no sign-up — runs entirely in your browser.'
  )
  const { state } = useLocation() as { state?: { resumeText?: string } }
  const [draft] = useState(() => (state?.resumeText ? null : loadDraft()))
  const [resumeText, setResumeText] = useState(state?.resumeText ?? draft?.resumeText ?? '')
  const [jd, setJd] = useState(draft?.jd ?? '')
  const [checked, setChecked] = useState(Boolean(state?.resumeText) || (draft?.checked ?? false))
  const [linkCopied, setLinkCopied] = useState(false)
  const [fileBusy, setFileBusy] = useState(false)
  const [fileError, setFileError] = useState('')
  const [fileChecks, setFileChecks] = useState<{ name: string; checks: FileCheck[] } | null>(
    null
  )
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  const handleFile = (file: File | undefined) => {
    if (!file || fileBusy) return
    setFileBusy(true)
    setFileError('')
    extractResumeFile(file)
      .then(({ text, checks }) => {
        if (!text.trim())
          throw new Error(
            'No text found in this file — it may be a scanned image. Paste the text instead.'
          )
        setResumeText(text)
        setFileChecks({ name: file.name, checks })
        setChecked(false)
      })
      .catch((err: unknown) =>
        setFileError(err instanceof Error ? err.message : 'Could not read this file.')
      )
      .finally(() => setFileBusy(false))
  }

  const openInBuilder = (anchor?: string) => {
    const existing = loadResume()
    const hasContent = Boolean(
      existing && (existing.contact.fullName || existing.experience.length)
    )
    if (
      !hasContent ||
      window.confirm(
        'Replace the resume currently saved in the builder with this pasted one? (Cancel keeps your saved resume; the job description still carries over.)'
      )
    ) {
      const parsed = parseResumeText(resumeText)
      parsed.jobDescription = jd
      setActiveVersionId(null)
      saveResume(parsed)
    } else if (existing && jd.trim()) {
      existing.jobDescription = jd
      saveResume(existing)
    }
    void navigate(anchor ? `/builder?jump=${anchor}` : '/builder')
  }

  useEffect(() => {
    try {
      if (!resumeText && !jd) sessionStorage.removeItem(DRAFT_KEY)
      else sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ resumeText, jd, checked }))
    } catch {
      // storage unavailable (e.g. disabled) — the page still works, just without refresh safety
    }
  }, [resumeText, jd, checked])

  const result = useMemo(
    () => (checked ? scoreResumeText(resumeText, jd) : null),
    [checked, resumeText, jd]
  )
  const isExample = resumeText === EXAMPLE_RESUME && jd === EXAMPLE_JD

  const prevScanRef = useRef<Map<string, boolean> | null>(null)
  const [fixedChecks, setFixedChecks] = useState<Set<string>>(() => new Set())
  useEffect(() => {
    if (!result) return
    const prev = prevScanRef.current
    prevScanRef.current = new Map(result.checks.map((c) => [c.label, c.pass]))
    setFixedChecks(
      prev
        ? new Set(
            result.checks
              .filter((c) => c.pass && prev.get(c.label) === false)
              .map((c) => c.label)
          )
        : new Set()
    )
  }, [result])

  const analysis = useMemo(() => {
    if (!result) return null
    const parsed = parseResumeText(resumeText)
    parsed.jobDescription = jd
    const health = resumeHealth(parsed)
    return { health, fixes: priorityFixes(result, health) }
  }, [result, resumeText, jd])

  return (
    <div className="bg-muted/30 flex min-h-screen flex-col">
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

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10">
        <div className="text-center">
          <Badge variant="secondary" className="mb-3 gap-1">
            <Target className="size-3" /> Free ATS resume checker
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Will your resume pass the ATS?
          </h1>
          <p className="text-muted-foreground mx-auto mt-3 max-w-2xl">
            Paste your resume and the job description to get an instant match score,
            missing keywords and format checks. 100% free, no sign-up — everything runs
            in your browser and never touches our servers.
          </p>
          <div className="mt-5">
            <Button
              type="button"
              variant="outline"
              className="min-h-10 sm:min-h-9"
              onClick={() => {
                setResumeText(EXAMPLE_RESUME)
                setJd(EXAMPLE_JD)
                setChecked(true)
              }}
            >
              <Target /> See an example score first
            </Button>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div
            className={`space-y-1.5 rounded-lg transition-colors ${
              dragOver ? 'ring-primary bg-primary/5 ring-2 ring-offset-2' : ''
            }`}
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
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label htmlFor="resume-text">Your resume (paste or upload)</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-10 gap-1 text-xs sm:h-7"
                disabled={fileBusy}
                onClick={() => fileRef.current?.click()}
              >
                <FileUp className="size-3" />
                {fileBusy ? 'Reading…' : 'Upload PDF / DOCX'}
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept={IMPORT_ACCEPT}
                className="hidden"
                onChange={(e) => {
                  handleFile(e.target.files?.[0])
                  e.target.value = ''
                }}
              />
            </div>
            {fileError && <p className="text-destructive text-xs">{fileError}</p>}
            <Textarea
              id="resume-text"
              rows={12}
              placeholder="Paste your full resume text here — or drop a PDF / DOCX file on this box…"
              value={resumeText}
              onChange={(e) => {
                setResumeText(e.target.value)
                setChecked(false)
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="jd-text">Job description</Label>
            <Textarea
              id="jd-text"
              rows={12}
              placeholder="Paste the job posting you're applying to…"
              value={jd}
              onChange={(e) => {
                setJd(e.target.value)
                setChecked(false)
              }}
            />
          </div>
        </div>

        <div className="mt-4 text-center">
          <Button
            size="lg"
            disabled={resumeText.trim().length < 30}
            onClick={() => setChecked(true)}
          >
            Check my ATS score <ArrowRight />
          </Button>
          {resumeText.trim().length < 30 && (
            <ScanIllustration className="mx-auto mt-4 h-24" />
          )}
          {resumeText.trim().length < 30 && (
            <p className="text-muted-foreground mt-2 text-xs">
              Paste your resume text to enable the check, or{' '}
              <button
                type="button"
                className="hover:text-foreground relative -my-3 inline-flex items-center py-3 underline underline-offset-2 sm:my-0 sm:py-0"
                onClick={() => {
                  setResumeText(EXAMPLE_RESUME)
                  setJd(EXAMPLE_JD)
                  setChecked(true)
                }}
              >
                see an example score
              </button>
              .
            </p>
          )}
        </div>

        {result && (
          <Card className="mt-8 py-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">
                    {isExample ? 'Example ATS match score' : 'Your ATS match score'}
                  </h2>
                  {isExample && (
                    <Badge
                      variant="secondary"
                      className="mt-1 max-w-full gap-1 text-left whitespace-normal"
                    >
                      <Target className="size-3 shrink-0" /> Example report — paste your
                      own resume above to check yours
                    </Badge>
                  )}
                </div>
                <ScoreRing score={result.score} />
              </div>

              <p className="text-muted-foreground mt-2 text-sm">
                {result.keywordScore === null
                  ? 'Structure looks ' +
                    (result.structureScore >= 70 ? 'solid' : 'improvable') +
                    ' — paste the job description to see how well your keywords match.'
                  : result.score >= 70
                    ? 'Great match — your resume covers most of the keywords this job asks for.'
                    : result.score >= 40
                      ? 'Decent start — add the missing keywords below (where they are true of you) to improve your match.'
                      : 'Needs work — this resume is missing most of the keywords the job description emphasizes.'}
              </p>

              <div className="text-muted-foreground mt-2 flex gap-5 text-sm">
                {result.keywordScore !== null && (
                  <span>
                    Keyword match{' '}
                    <span className="text-foreground font-semibold">
                      {result.keywordScore}/100
                    </span>
                  </span>
                )}
                <span>
                  Structure{' '}
                  <span className="text-foreground font-semibold">
                    {result.structureScore}/100
                  </span>
                </span>
                {result.keywordScore === null && (
                  <span className="text-xs">
                    Add a job description to get a keyword match score.
                  </span>
                )}
              </div>

              <details className="text-muted-foreground mt-3 rounded-md border bg-muted/30 px-3 py-2 text-sm">
                <summary className="text-foreground cursor-pointer text-sm font-medium">
                  What do these scores mean?
                </summary>
                <ul className="mt-2 space-y-1.5">
                  <li>
                    <strong className="text-foreground">Keyword match</strong> — how many of
                    the job ad&apos;s key terms appear in your resume. Recruiters and ATS
                    filters search for these exact words, so a low score usually means
                    you&apos;ll be skipped even if you&apos;re qualified.
                  </li>
                  <li>
                    <strong className="text-foreground">Structure</strong> — whether your
                    resume has the parts a parser expects: contact info, clear section
                    headings, dates and bullet points. Fancy layouts often fail here.
                  </li>
                  <li>
                    <strong className="text-foreground">How it&apos;s combined</strong> —
                    overall score = keyword match ×70% + structure ×30% (structure only when
                    no job ad is pasted). It&apos;s a transparent rule-based check run in your
                    browser — it mirrors what parsers scan for but can&apos;t predict a hiring
                    decision.
                  </li>
                  <li>
                    <strong className="text-foreground">What to do</strong> — add the
                    missing keywords below <em>only where they&apos;re true of you</em>, keep
                    the layout simple, then re-check. Aim for 70+.
                  </li>
                </ul>
              </details>

              {analysis && (
                <div className="mt-4 rounded-lg border p-3">
                  <p className="text-sm font-medium">Priority fixes</p>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    What to fix first, ranked by how many score points each item
                    recovers. Writing-quality items are guidance and not counted
                    in the ATS score.
                  </p>
                  {analysis.fixes.length === 0 ? (
                    <p className="mt-1.5 text-xs text-emerald-600">
                      No priority fixes — every check passes and all writing
                      dimensions score 80+.
                    </p>
                  ) : (
                    <ul className="mt-2 space-y-1.5">
                      {analysis.fixes.map((f) => (
                        <li key={f.text} className="flex items-start gap-2 text-xs">
                          <span
                            className={`mt-0.5 inline-flex shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                              f.impact === 'high'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {f.impact === 'high' ? 'High' : 'Med'}
                          </span>
                          <span className="text-muted-foreground">
                            {f.text}{' '}
                            <span className="text-foreground/70 whitespace-nowrap tabular-nums">
                              +{f.points} pts
                            </span>
                            <button
                              type="button"
                              className="text-primary ml-1.5 inline-flex min-h-10 items-center underline sm:min-h-0"
                              onClick={() =>
                                openInBuilder(
                                  f.anchor ??
                                    (f.text.startsWith('Add missing job keywords')
                                      ? 'target'
                                      : undefined)
                                )
                              }
                            >
                              Fix in builder →
                            </button>
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
                    {analysis.health.dimensions.map((d) => (
                      <span key={d.id} className="text-xs">
                        <span className="text-muted-foreground">{d.label}</span>{' '}
                        <span
                          className={`font-semibold tabular-nums ${
                            d.score < 50
                              ? 'text-red-700 dark:text-red-400'
                              : d.score < 80
                                ? 'text-amber-700 dark:text-amber-400'
                                : 'text-emerald-700 dark:text-emerald-400'
                          }`}
                        >
                          {d.score}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {jd.trim() && (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium">
                      Matched keywords ({result.matched.length})
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {result.matched.map((k) => (
                        <Badge key={k} variant="secondary">
                          {k}
                        </Badge>
                      ))}
                      {result.matched.length === 0 && (
                        <p className="text-muted-foreground text-sm">None yet.</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      Missing keywords ({result.missing.length})
                    </p>
                    {result.missing.length === 0 ? (
                      <p className="text-muted-foreground mt-2 text-sm">
                        Nothing missing — great match!
                      </p>
                    ) : (
                      (() => {
                        const high = highPriorityKeywords(jd, result.missing)
                        const groups = [
                          {
                            label: 'High priority',
                            hint: 'title, requirements or repeated in the posting',
                            kws: result.missing.filter((k) => high.has(k)),
                            cls: 'border-red-300 text-red-700 dark:border-red-900 dark:text-red-400',
                          },
                          {
                            label: 'Remaining',
                            hint: 'also mentioned in the posting',
                            kws: result.missing.filter((k) => !high.has(k)),
                            cls: '',
                          },
                        ]
                        return groups.map((g) =>
                          g.kws.length === 0 ? null : (
                            <div key={g.label} className="mt-2">
                              <p className="text-muted-foreground text-xs">
                                {g.label} ({g.kws.length}) — {g.hint}
                              </p>
                              <div className="mt-1 flex flex-wrap gap-1.5">
                                {g.kws.map((k) => (
                                  <Badge key={k} variant="outline" className={g.cls}>
                                    {k}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )
                        )
                      })()
                    )}
                  </div>
                </div>
              )}

              {jd.trim() && (result.matched.length > 0 || result.missing.length > 0) && (
                <div className="mt-5">
                  <p className="text-sm font-medium">Job description with keywords highlighted</p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    <span className="rounded bg-emerald-100 px-1 text-emerald-900">green</span>{' '}
                    = already on your resume,{' '}
                    <span className="rounded bg-amber-100 px-1 text-amber-900">amber</span> =
                    missing.
                  </p>
                  <div className="bg-muted/40 mt-2 max-h-56 overflow-y-auto rounded-md border p-3 text-sm whitespace-pre-wrap">
                    {segmentJd(jd, result.matched, result.missing).map((s, i) =>
                      s.kind === 'plain' ? (
                        <span key={i}>{s.text}</span>
                      ) : (
                        <mark
                          key={i}
                          className={`rounded px-0.5 ${
                            s.kind === 'matched'
                              ? 'bg-emerald-100 text-emerald-900'
                              : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          {s.text}
                        </mark>
                      )
                    )}
                  </div>
                </div>
              )}

              {jd.trim() && result.keywordDetail.length > 0 && (
                <div className="mt-5">
                  <p className="text-sm font-medium">Keyword frequency</p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    How often each keyword appears in your resume vs the job ad —
                    missing keywords first.
                  </p>
                  <div className="mt-2 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-muted-foreground border-b text-left text-xs">
                          <th className="py-1.5 pr-2 font-medium">Keyword</th>
                          <th className="px-2 py-1.5 text-right font-medium">In resume</th>
                          <th className="px-2 py-1.5 text-right font-medium">In job ad</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.keywordDetail.slice(0, 12).map((k) => (
                          <tr key={k.keyword} className="border-b last:border-0">
                            <td className="py-1.5 pr-2">{k.keyword}</td>
                            <td
                              className={`px-2 py-1.5 text-right tabular-nums ${
                                k.inResume === 0 ? 'text-destructive font-medium' : ''
                              }`}
                            >
                              {k.inResume === 0 ? '✕' : k.inResume}
                            </td>
                            <td className="text-muted-foreground px-2 py-1.5 text-right tabular-nums">
                              {k.inJobAd}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {fileChecks && (
                <div className="mt-5 space-y-2">
                  <p className="text-sm font-medium">
                    Uploaded file checks{' '}
                    <span className="text-muted-foreground font-normal">
                      ({fileChecks.name})
                    </span>
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Hidden formatting in the file itself — tables, images, columns,
                    headers — can break ATS parsing even when the text reads fine. Not
                    counted in the score.
                  </p>
                  {fileChecks.checks.map((c) => (
                    <div key={c.label} className="flex items-start gap-2 text-sm">
                      {c.pass ? (
                        <BadgeCheck className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                      ) : (
                        <CircleAlert className="text-destructive mt-0.5 size-4 shrink-0" />
                      )}
                      <span>
                        <span className="font-medium">{c.label}</span>
                        {!c.pass && (
                          <span className="text-muted-foreground"> — {c.hint}</span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-5 space-y-4">
                <p className="text-sm font-medium">Format &amp; content checks</p>
                {(() => {
                  const readiness = applicationReadiness(result)
                  return (
                    <div
                      className={`rounded-md px-2.5 py-1.5 text-xs ${
                        readiness.tier === 'ready'
                          ? 'bg-emerald-100 text-emerald-800'
                          : readiness.tier === 'almost'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                      }`}
                    >
                      <span className="font-semibold">
                        Application ready:{' '}
                        {readiness.tier === 'ready'
                          ? 'Ready to send'
                          : readiness.tier === 'almost'
                            ? 'Almost there'
                            : 'Needs work'}
                      </span>
                      {readiness.blockers.length > 0 && (
                        <span> — {readiness.blockers.join(' · ')}</span>
                      )}
                    </div>
                  )
                })()}
                {CHECK_CATEGORIES.map((cat) => {
                  const rows = result.checks.filter((c) => c.category === cat.key)
                  if (rows.length === 0) return null
                  return (
                    <div key={cat.key} className="space-y-2">
                      <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                        {cat.label}{' '}
                        <span className="font-normal normal-case">
                          · {rows.filter((c) => c.pass).length}/{rows.length}
                        </span>
                      </p>
                      {rows.map((c) => (
                        <div key={c.label} className="flex items-start gap-2 text-sm">
                          {c.pass ? (
                            <BadgeCheck className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                          ) : (
                            <CircleAlert className="text-destructive mt-0.5 size-4 shrink-0" />
                          )}
                          <span>
                            <span className="font-medium">{c.label}</span>
                            {c.pass && fixedChecks.has(c.label) && (
                              <span className="ml-1.5 rounded bg-emerald-100 px-1 py-0.5 text-[10px] font-semibold text-emerald-800">
                                Fixed since last check
                              </span>
                            )}
                            {!c.pass && (
                              <span className="text-muted-foreground"> — {c.hint}</span>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>

              <div className="bg-muted/50 mt-6 rounded-lg border p-4 text-center">
                <p className="text-sm font-medium">
                  Fix the gaps in minutes with the free RezUp builder
                </p>
                <p className="text-muted-foreground mt-1 text-sm">
                  AI rewrites your bullets toward this exact job, live ATS score as you
                  edit, and clean PDF/DOCX export. No sign-up, no subscription.
                </p>
                <Button className="mt-3 h-auto max-w-full whitespace-normal" onClick={() => openInBuilder()}>
                  Fix it in the builder — resume &amp; job carried over <ArrowRight />
                </Button>
              </div>

              <p className="text-muted-foreground mt-4 text-center text-xs">
                Know someone job hunting?{' '}
                <button
                  type="button"
                  className="text-primary underline"
                  onClick={() => {
                    void navigator.clipboard
                      .writeText('https://cv.zalize.com/ats-checker')
                      .then(() => setLinkCopied(true))
                  }}
                >
                  {linkCopied ? 'Link copied!' : 'Copy the checker link'}
                </button>{' '}
                — free, no sign-up, nothing leaves the browser.
              </p>
            </CardContent>
          </Card>
        )}

        <section className="mt-14">
          <h2 className="text-center text-xl font-semibold">How the checker works</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {[
              {
                step: '1',
                title: 'Paste or drop your resume',
                text: 'Paste the text, or drop a PDF / DOCX — it’s read entirely in your browser and never uploaded to a server.',
              },
              {
                step: '2',
                title: 'Get your score instantly',
                text: 'A transparent rule-based check scores keyword match against the job ad (70%) and ATS-safe structure (30%) — with every matched and missing keyword listed.',
              },
              {
                step: '3',
                title: 'Fix the gaps in the builder',
                text: 'One click carries your resume and the job description into the free builder, where AI rewrites target the exact keywords you’re missing.',
              },
            ].map((s) => (
              <div key={s.step} className="bg-card rounded-lg border p-4">
                <div className="bg-primary/10 text-primary flex size-7 items-center justify-center rounded-full text-sm font-semibold">
                  {s.step}
                </div>
                <p className="mt-2 text-sm font-medium">{s.title}</p>
                <p className="text-muted-foreground mt-1 text-sm">{s.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-center text-xl font-semibold">Common questions</h2>
          <div className="mx-auto mt-4 max-w-2xl space-y-2">
            {[
              {
                q: 'Is the ATS checker really free?',
                a: 'Yes — the checker is free with no sign-up, no email and no usage cap. RezUp makes money from one-time resume-download purchases, so the checker has no paywall.',
              },
              {
                q: 'Is my resume uploaded anywhere?',
                a: 'No. The file is parsed and scored by JavaScript running in your browser — the text never leaves your device and we never store it.',
              },
              {
                q: 'How is the score calculated?',
                a: 'Overall score = keyword match × 70% + structure × 30%. Keyword match counts how many of the job ad’s key terms appear in your resume; structure checks for the parts a parser expects (contact info, headings, dates, bullets). It’s a transparent rule-based check, not a black box.',
              },
              {
                q: 'Does a high score guarantee interviews?',
                a: 'No — no checker can promise that. A high score means ATS filters and keyword-scanning recruiters are unlikely to skip you for mechanical reasons; the content of your experience still has to earn the interview.',
              },
            ].map((f) => (
              <details key={f.q} className="bg-card rounded-lg border px-4 py-3">
                <summary className="cursor-pointer text-sm font-medium">{f.q}</summary>
                <p className="text-muted-foreground mt-2 text-sm">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
