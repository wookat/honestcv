import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, BadgeCheck, CircleAlert, FileUp, Target } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { SiteFooter, SiteHeader, usePageMeta } from '@/components/Layout'
import { scoreResumeText } from '@/lib/ats'
import { IMPORT_ACCEPT, extractTextFromFile } from '@/lib/extractFile'
import { parseResumeText } from '@/lib/importText'
import { loadResume, saveResume } from '@/lib/resume'

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

export default function AtsChecker() {
  usePageMeta(
    'Free ATS Resume Checker — Instant Match Score | HonestCV',
    'Paste your resume and a job description to get an instant ATS match score, missing keywords and format checks. 100% free, no sign-up — runs entirely in your browser.'
  )
  const [resumeText, setResumeText] = useState('')
  const [jd, setJd] = useState('')
  const [checked, setChecked] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [fileBusy, setFileBusy] = useState(false)
  const [fileError, setFileError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  const openInBuilder = () => {
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
      saveResume(parsed)
    } else if (existing) {
      existing.jobDescription = jd
      saveResume(existing)
    }
    void navigate('/builder')
  }

  const result = useMemo(
    () => (checked ? scoreResumeText(resumeText, jd) : null),
    [checked, resumeText, jd]
  )

  return (
    <div className="bg-muted/30 flex min-h-screen flex-col">
      <SiteHeader
        action={
          <Button asChild size="sm">
            <Link to="/builder">
              Build my resume <ArrowRight />
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
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="resume-text">Your resume (paste or upload)</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 gap-1 text-xs"
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
                  const file = e.target.files?.[0]
                  e.target.value = ''
                  if (!file) return
                  setFileBusy(true)
                  setFileError('')
                  extractTextFromFile(file)
                    .then((text) => {
                      if (!text.trim())
                        throw new Error(
                          'No text found in this file — it may be a scanned image. Paste the text instead.'
                        )
                      setResumeText(text)
                      setChecked(false)
                    })
                    .catch((err: unknown) =>
                      setFileError(
                        err instanceof Error ? err.message : 'Could not read this file.'
                      )
                    )
                    .finally(() => setFileBusy(false))
                }}
              />
            </div>
            {fileError && <p className="text-destructive text-xs">{fileError}</p>}
            <Textarea
              id="resume-text"
              rows={12}
              placeholder="Paste your full resume text here…"
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
            <p className="text-muted-foreground mt-2 text-xs">
              Paste your resume text to enable the check, or{' '}
              <button
                type="button"
                className="hover:text-foreground underline underline-offset-2"
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
                <h2 className="text-lg font-semibold">Your ATS match score</h2>
                <span
                  className={`text-3xl font-bold ${
                    result.score >= 70
                      ? 'text-emerald-600'
                      : result.score >= 40
                        ? 'text-amber-600'
                        : 'text-destructive'
                  }`}
                >
                  {result.score}/100
                </span>
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
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {result.missing.map((k) => (
                        <Badge key={k} variant="outline">
                          {k}
                        </Badge>
                      ))}
                      {result.missing.length === 0 && (
                        <p className="text-muted-foreground text-sm">
                          Nothing missing — great match!
                        </p>
                      )}
                    </div>
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

              <div className="mt-5 space-y-2">
                <p className="text-sm font-medium">Format &amp; content checks</p>
                {result.checks.map((c) => (
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

              <div className="bg-muted/50 mt-6 rounded-lg border p-4 text-center">
                <p className="text-sm font-medium">
                  Fix the gaps in minutes with the free HonestCV builder
                </p>
                <p className="text-muted-foreground mt-1 text-sm">
                  AI rewrites your bullets toward this exact job, live ATS score as you
                  edit, and clean PDF/DOCX export. No sign-up, no subscription.
                </p>
                <Button className="mt-3 h-auto max-w-full whitespace-normal" onClick={openInBuilder}>
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
      </main>

      <SiteFooter />
    </div>
  )
}
