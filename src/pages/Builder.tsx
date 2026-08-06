import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowDown,
  ArrowUp,
  Briefcase,
  ChevronDown,
  ChevronUp,
  ClipboardPaste,
  Download,
  FileText,
  FileUp,
  GraduationCap,
  GripVertical,
  Lightbulb,
  ListOrdered,
  Loader2,
  Lock,
  MessagesSquare,
  Plus,
  Sparkles,
  Target,
  Trash2,
  Undo2,
  Unlock,
  Wand2,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { SiteFooter, SiteHeader, usePageMeta } from '@/components/Layout'
import {
  FreeDownloadDialog,
  UpgradeDialog,
  hasSubscribed,
  useFreeMode,
  useLicense,
} from '@/components/Paywall'
import { ResumePreview } from '@/components/ResumePreview'
import {
  PaymentRequiredError,
  aiCoverLetter,
  aiInterviewBrief,
  aiRewrite,
} from '@/lib/api'
import { scoreResume } from '@/lib/ats'
import { checkBullets } from '@/lib/guidance'
import { parseResumeText } from '@/lib/importText'
import { IMPORT_ACCEPT, extractTextFromFile } from '@/lib/extractFile'
import { downloadResumeDocx, downloadTextDocx } from '@/lib/docx'
import { downloadResumePdf, downloadTextPdf } from '@/lib/pdf'
import {
  type ExperienceItem,
  type Resume,
  emptyCustomSection,
  emptyEducation,
  emptyExperience,
  emptyProject,
  emptyResume,
  loadResume,
  orderedSectionKeys,
  resumeToPlainText,
  sampleResume,
  saveResume,
  sectionLabel,
} from '@/lib/resume'
import { TemplateThumb } from '@/components/TemplateThumb'
import { bulletStartersFor } from '@/lib/bulletStarters'
import { ACCENT_CHOICES, TEMPLATES, getTemplate } from '@/lib/templates'

function useDebouncedSave(resume: Resume): 'saving' | 'saved' {
  const t = useRef<number | undefined>(undefined)
  const [state, setState] = useState<'saving' | 'saved'>('saved')
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    setState('saving')
    window.clearTimeout(t.current)
    t.current = window.setTimeout(() => {
      saveResume(resume)
      setState('saved')
    }, 400)
    return () => window.clearTimeout(t.current)
  }, [resume])
  return state
}

/** Global undo: snapshots resume state (throttled) and restores on Ctrl/Cmd+Z */
function useUndo(
  resume: Resume,
  setResume: React.Dispatch<React.SetStateAction<Resume>>
) {
  const history = useRef<Resume[]>([])
  const last = useRef(resume)
  const lastPush = useRef(0)
  const restoring = useRef(false)
  const [canUndo, setCanUndo] = useState(false)

  useEffect(() => {
    if (restoring.current) {
      restoring.current = false
      last.current = resume
      return
    }
    if (resume === last.current) return
    const now = Date.now()
    if (now - lastPush.current > 700) {
      history.current.push(last.current)
      if (history.current.length > 50) history.current.shift()
      lastPush.current = now
      setCanUndo(true)
    }
    last.current = resume
  }, [resume])

  const undo = useCallback(() => {
    const prev = history.current.pop()
    if (!prev) return
    restoring.current = true
    setCanUndo(history.current.length > 0)
    setResume(prev)
  }, [setResume])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== 'z' || e.shiftKey) return
      const el = document.activeElement
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) return
      e.preventDefault()
      undo()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [undo])

  return { undo, canUndo }
}

function moveItem<T>(arr: T[], index: number, delta: number): T[] {
  const next = index + delta
  if (next < 0 || next >= arr.length) return arr
  const copy = [...arr]
  ;[copy[index], copy[next]] = [copy[next], copy[index]]
  return copy
}

function reorder<T>(arr: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= arr.length || to >= arr.length) return arr
  const copy = [...arr]
  const [item] = copy.splice(from, 1)
  copy.splice(to, 0, item)
  return copy
}

/**
 * HTML5 drag-and-drop list reorder. The grip handle is draggable
 * (so inputs inside the card keep normal text selection); the whole
 * card is a drop target.
 */
function useDragReorder(onReorder: (from: number, to: number) => void) {
  const dragFrom = useRef<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)
  const handleProps = (index: number) => ({
    draggable: true,
    onDragStart: (e: React.DragEvent) => {
      dragFrom.current = index
      e.dataTransfer.effectAllowed = 'move'
      const card = (e.target as HTMLElement).closest('[data-drag-card]')
      if (card) e.dataTransfer.setDragImage(card, 20, 20)
    },
    onDragEnd: () => {
      dragFrom.current = null
      setOverIndex(null)
    },
  })
  const dropProps = (index: number) => ({
    'data-drag-card': true,
    onDragOver: (e: React.DragEvent) => {
      if (dragFrom.current === null) return
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
      setOverIndex(index)
    },
    onDragLeave: () => setOverIndex((i) => (i === index ? null : i)),
    onDrop: (e: React.DragEvent) => {
      e.preventDefault()
      if (dragFrom.current !== null && dragFrom.current !== index)
        onReorder(dragFrom.current, index)
      dragFrom.current = null
      setOverIndex(null)
    },
  })
  return { handleProps, dropProps, overIndex }
}

function Section({
  title,
  icon,
  children,
  defaultOpen = true,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <Card className="py-0">
      <CardContent className="p-4">
        <button
          type="button"
          className="flex w-full items-center justify-between text-left font-medium"
          onClick={() => setOpen((o) => !o)}
        >
          <span className="flex items-center gap-2">
            {icon}
            {title}
          </span>
          {open ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </button>
        {open && <div className="mt-3 space-y-3">{children}</div>}
      </CardContent>
    </Card>
  )
}

export default function Builder() {
  usePageMeta(
    'Resume Builder — HonestCV',
    'Build an ATS-friendly resume in your browser: 12 templates, drag-and-drop sections, live ATS match score, free PDF & DOCX download. No account, no subscription.'
  )
  const [resume, setResume] = useState<Resume>(() => loadResume() ?? emptyResume())
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [upgradeReason, setUpgradeReason] = useState('')
  const [aiBusy, setAiBusy] = useState<string | null>(null)
  const [aiError, setAiError] = useState('')
  const [freeLeft, setFreeLeft] = useState<number | null>(null)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [toolOpen, setToolOpen] = useState<'cover' | 'interview' | null>(null)
  const [freeDlOpen, setFreeDlOpen] = useState(false)
  const pendingDl = useRef<'pdf' | 'docx' | null>(null)
  const [variantPick, setVariantPick] = useState<{
    title: string
    candidates: string[]
    apply: (text: string) => void
  } | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [importText, setImportText] = useState('')
  const [importBusy, setImportBusy] = useState(false)
  const [importError, setImportError] = useState('')
  const importFileRef = useRef<HTMLInputElement>(null)
  const [finalCheckOpen, setFinalCheckOpen] = useState(false)
  const finalCheckFmt = useRef<'pdf' | 'docx' | null>(null)
  const freeMode = useFreeMode()
  const { license, refresh } = useLicense()
  const saveState = useDebouncedSave(resume)
  const { undo, canUndo } = useUndo(resume, setResume)
  const expDrag = useDragReorder((from, to) =>
    setResume((r) => ({ ...r, experience: reorder(r.experience, from, to) }))
  )
  const eduDrag = useDragReorder((from, to) =>
    setResume((r) => ({ ...r, education: reorder(r.education, from, to) }))
  )
  const secDrag = useDragReorder((from, to) =>
    setResume((r) => ({ ...r, sectionOrder: reorder(orderedSectionKeys(r), from, to) }))
  )

  const unlocked = Boolean(license)
  const hasBundlePlan = license?.plan === 'bundle'
  const ats = useMemo(
    () => scoreResume(resume, resume.jobDescription),
    [resume]
  )

  const set = useCallback(<K extends keyof Resume>(key: K, value: Resume[K]) => {
    setResume((r) => ({ ...r, [key]: value }))
  }, [])
  const setContact = (key: keyof Resume['contact'], value: string) =>
    setResume((r) => ({ ...r, contact: { ...r.contact, [key]: value } }))
  const setExp = (id: string, patch: Partial<ExperienceItem>) =>
    setResume((r) => ({
      ...r,
      experience: r.experience.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    }))

  const requireUnlock = (reason: string) => {
    setUpgradeReason(reason)
    setUpgradeOpen(true)
  }

  const runRewrite = async (
    tag: string,
    kind: 'bullets' | 'summary' | 'skills',
    text: string,
    apply: (out: string) => void
  ) => {
    if (!text.trim()) return
    setAiBusy(tag)
    setAiError('')
    try {
      const wantVariants = kind !== 'skills'
      const { text: out, texts, freeRemaining } = await aiRewrite(
        kind,
        text,
        {
          role: resume.targetRole,
          jobDescription: resume.jobDescription,
        },
        wantVariants
      )
      if (freeRemaining !== null) setFreeLeft(freeRemaining)
      if (texts && texts.length > 1) {
        setVariantPick({
          title: kind === 'summary' ? 'Pick a summary' : 'Pick a rewrite',
          candidates: texts,
          apply,
        })
      } else {
        apply(out)
      }
    } catch (e) {
      if (e instanceof PaymentRequiredError && !freeMode) requireUnlock(e.message)
      else setAiError((e as Error).message)
    } finally {
      setAiBusy(null)
    }
  }

  const finalCheckIssues = useMemo(() => {
    const issues: string[] = []
    for (const c of ats.checks) if (!c.pass) issues.push(`${c.label} — ${c.hint}`)
    const bulletIssueCount = resume.experience.reduce(
      (n, e) => n + checkBullets(e.bullets).reduce((m, r) => m + r.issues.length, 0),
      0
    )
    if (bulletIssueCount > 0)
      issues.push(
        `${bulletIssueCount} bullet-quality warning${bulletIssueCount === 1 ? '' : 's'} in Experience (weak openers, missing numbers…)`
      )
    const placeholderCount = resumeToPlainText(resume).match(/\[[^\]\n]{1,60}\]/g)?.length ?? 0
    if (placeholderCount > 0)
      issues.push(
        `${placeholderCount} bracket placeholder${placeholderCount === 1 ? '' : 's'} like [add %] still in the resume — replace with your real details`
      )
    return issues
  }, [ats, resume])

  const download = async (fmt: 'pdf' | 'docx', skipFinalCheck = false) => {
    if (!unlocked) {
      if (!freeMode) {
        requireUnlock(
          'Downloading your resume as PDF or DOCX is the one thing we charge for — once, not monthly.'
        )
        return
      }
      if (!hasSubscribed()) {
        pendingDl.current = fmt
        setFreeDlOpen(true)
        return
      }
    }
    if (!skipFinalCheck && finalCheckIssues.length > 0) {
      finalCheckFmt.current = fmt
      setFinalCheckOpen(true)
      return
    }
    setDownloading(fmt)
    try {
      const name = (resume.contact.fullName || 'resume').replace(/\s+/g, '-').toLowerCase()
      if (fmt === 'pdf') await downloadResumePdf(resume, `${name}-resume.pdf`)
      else await downloadResumeDocx(resume, `${name}-resume.docx`)
    } finally {
      setDownloading(null)
    }
  }

  const aiButton = (
    tag: string,
    label: string,
    onClick: () => void,
    disabled?: boolean
  ) => (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={Boolean(aiBusy) || disabled}
      className="h-7 gap-1 text-xs"
    >
      {aiBusy === tag ? (
        <Loader2 className="size-3 animate-spin" />
      ) : (
        <Wand2 className="size-3" />
      )}
      {label}
    </Button>
  )

  return (
    <div className="bg-muted/30 flex min-h-screen flex-col">
      <SiteHeader
        action={
          <div className="flex items-center gap-2">
            {unlocked ? (
              <Badge variant="secondary" className="hidden gap-1 sm:flex">
                <Unlock className="size-3" />
                {hasBundlePlan ? 'Career Bundle' : 'Unlocked'}
              </Badge>
            ) : freeMode ? (
              <Badge variant="secondary" className="hidden gap-1 sm:flex">
                <Unlock className="size-3" /> Free during launch
              </Badge>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setUpgradeOpen(true)}>
                <Lock className="size-3.5" /> Unlock — $9.99 once
              </Button>
            )}
            <span className="text-muted-foreground hidden text-xs sm:inline">
              {saveState === 'saving' ? 'Saving…' : 'Saved'}
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={undo}
              disabled={!canUndo}
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="size-3.5" />
            </Button>
            <Button size="sm" onClick={() => void download('pdf')} disabled={Boolean(downloading)}>
              {downloading ? <Loader2 className="animate-spin" /> : <Download />}
              PDF
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => void download('docx')}
              disabled={Boolean(downloading)}
            >
              <Download /> DOCX
            </Button>
          </div>
        }
      />

      <main className="mx-auto grid w-full max-w-7xl flex-1 gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <h1 className="sr-only">Resume builder</h1>
        {/* ---- Left: editor ---- */}
        <div className="space-y-4">
          {resume === null ||
            (!resume.contact.fullName && !resume.summary && (
              <div className="rounded-lg border border-dashed p-3 text-sm">
                Starting fresh?{' '}
                <button
                  type="button"
                  className="text-primary underline"
                  onClick={() => setResume(sampleResume())}
                >
                  Load an example resume
                </button>{' '}
                to see how it works, or{' '}
                <button
                  type="button"
                  className="text-primary underline"
                  onClick={() => setImportOpen(true)}
                >
                  import your existing resume (PDF/DOCX/text)
                </button>
                .
              </div>
            ))}

          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 gap-1 text-xs"
              onClick={() => setImportOpen(true)}
            >
              <FileUp className="size-3" /> Import resume (PDF/DOCX/text)
            </Button>
          </div>

          <Section title="Target job (powers AI + ATS score)" icon={<Target className="size-4" />}>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="targetRole">Target role</Label>
                <Input
                  id="targetRole"
                  placeholder="e.g. Frontend Engineer"
                  value={resume.targetRole}
                  onChange={(e) => set('targetRole', e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="jd">Job description (paste to get your match score)</Label>
              <Textarea
                id="jd"
                rows={4}
                placeholder="Paste the job posting here — the ATS score below updates live, and AI rewrites will mirror its keywords."
                value={resume.jobDescription}
                onChange={(e) => set('jobDescription', e.target.value)}
              />
            </div>
          </Section>

          <Section title="Contact" icon={<FileText className="size-4" />}>
            <div className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  ['fullName', 'Full name', 'Jordan Reyes'],
                  ['title', 'Professional title', 'Software Engineer'],
                  ['email', 'Email', 'you@email.com'],
                  ['phone', 'Phone', '(555) 210-4432'],
                  ['location', 'Location', 'Austin, TX'],
                  ['website', 'Website (optional)', 'yoursite.com'],
                  ['linkedin', 'LinkedIn (optional)', 'linkedin.com/in/you'],
                ] as const
              ).map(([key, label, ph]) => (
                <div key={key} className="space-y-1.5">
                  <Label htmlFor={`c-${key}`}>{label}</Label>
                  <Input
                    id={`c-${key}`}
                    placeholder={ph}
                    value={resume.contact[key]}
                    onChange={(e) => setContact(key, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </Section>

          <Section title="Summary" icon={<FileText className="size-4" />}>
            <Textarea
              rows={3}
              placeholder="2-3 sentences: who you are, years of experience, biggest strengths and wins."
              value={resume.summary}
              onChange={(e) => set('summary', e.target.value)}
            />
            <div className="flex items-center gap-2">
              {aiButton('summary', 'AI polish summary', () =>
                void runRewrite('summary', 'summary', resume.summary, (out) =>
                  set('summary', out)
                )
              )}
            </div>
          </Section>

          <Section title="Experience" icon={<Briefcase className="size-4" />}>
            {resume.experience.map((e, idx) => (
              <div
                key={e.id}
                {...expDrag.dropProps(idx)}
                className={`space-y-2 rounded-lg border p-3 transition ${
                  expDrag.overIndex === idx ? 'border-primary bg-primary/5' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-muted-foreground flex items-center gap-1 text-xs font-medium">
                    <span
                      {...expDrag.handleProps(idx)}
                      role="button"
                      className="text-muted-foreground/60 hover:text-foreground -ml-1 cursor-grab touch-none p-1 active:cursor-grabbing"
                      title="Drag to reorder"
                      aria-label={`Drag role ${idx + 1} to reorder`}
                    >
                      <GripVertical className="size-3.5" />
                    </span>
                    Role {idx + 1}
                  </p>
                  <div className="flex items-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-9 sm:h-7"
                      disabled={idx === 0}
                      title="Move up"
                      onClick={() =>
                        setResume((r) => ({
                          ...r,
                          experience: moveItem(r.experience, idx, -1),
                        }))
                      }
                    >
                      <ArrowUp className="size-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-9 sm:h-7"
                      disabled={idx === resume.experience.length - 1}
                      title="Move down"
                      onClick={() =>
                        setResume((r) => ({
                          ...r,
                          experience: moveItem(r.experience, idx, 1),
                        }))
                      }
                    >
                      <ArrowDown className="size-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive h-9 sm:h-7"
                      title="Delete role"
                      aria-label={`Delete role ${idx + 1}`}
                      onClick={() =>
                        setResume((r) => ({
                          ...r,
                          experience: r.experience.filter((x) => x.id !== e.id),
                        }))
                      }
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Input
                    placeholder="Job title"
                    value={e.role}
                    onChange={(ev) => setExp(e.id, { role: ev.target.value })}
                  />
                  <Input
                    placeholder="Company"
                    value={e.company}
                    onChange={(ev) => setExp(e.id, { company: ev.target.value })}
                  />
                  <Input
                    placeholder="Location"
                    value={e.location}
                    onChange={(ev) => setExp(e.id, { location: ev.target.value })}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Start (Jun 2023)"
                      value={e.startDate}
                      onChange={(ev) => setExp(e.id, { startDate: ev.target.value })}
                    />
                    <Input
                      placeholder="End (Present)"
                      value={e.endDate}
                      onChange={(ev) => setExp(e.id, { endDate: ev.target.value })}
                    />
                  </div>
                </div>
                <Textarea
                  rows={4}
                  placeholder={'One achievement per line, e.g.\nCut deploy time by 60% by introducing CI caching\nLed a team of 3 engineers on the checkout redesign'}
                  value={e.bullets.join('\n')}
                  onChange={(ev) => setExp(e.id, { bullets: ev.target.value.split('\n') })}
                />
                <BulletGuidance bullets={e.bullets} />
                <BulletIdeas
                  role={`${e.role} ${resume.targetRole}`}
                  onAdd={(s) =>
                    setExp(e.id, {
                      bullets: [...e.bullets.filter((b) => b.trim()), s],
                    })
                  }
                />
                {aiButton(`exp-${e.id}`, 'AI rewrite bullets', () =>
                  void runRewrite(
                    `exp-${e.id}`,
                    'bullets',
                    e.bullets.filter((b) => b.trim()).join('\n'),
                    (out) =>
                      setExp(e.id, {
                        bullets: out
                          .split('\n')
                          .map((l) => l.replace(/^[-•]\s*/, '').trim())
                          .filter(Boolean),
                      })
                  )
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setResume((r) => ({ ...r, experience: [...r.experience, emptyExperience()] }))
              }
            >
              <Plus className="size-4" /> Add role
            </Button>
          </Section>

          <Section title="Education" icon={<GraduationCap className="size-4" />}>
            {resume.education.map((e, idx) => (
              <div
                key={e.id}
                {...eduDrag.dropProps(idx)}
                className={`space-y-2 rounded-lg border p-3 transition ${
                  eduDrag.overIndex === idx ? 'border-primary bg-primary/5' : ''
                }`}
              >
                <p className="text-muted-foreground flex items-center gap-1 text-xs font-medium">
                  <span
                    {...eduDrag.handleProps(idx)}
                    role="button"
                    className="text-muted-foreground/60 hover:text-foreground -ml-1 cursor-grab touch-none p-1 active:cursor-grabbing"
                    title="Drag to reorder"
                    aria-label={`Drag education ${idx + 1} to reorder`}
                  >
                    <GripVertical className="size-3.5" />
                  </span>
                  Education {idx + 1}
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Input
                    placeholder="Degree (B.S. Computer Science)"
                    value={e.degree}
                    onChange={(ev) =>
                      setResume((r) => ({
                        ...r,
                        education: r.education.map((x) =>
                          x.id === e.id ? { ...x, degree: ev.target.value } : x
                        ),
                      }))
                    }
                  />
                  <Input
                    placeholder="School"
                    value={e.school}
                    onChange={(ev) =>
                      setResume((r) => ({
                        ...r,
                        education: r.education.map((x) =>
                          x.id === e.id ? { ...x, school: ev.target.value } : x
                        ),
                      }))
                    }
                  />
                  <Input
                    placeholder="Location"
                    value={e.location}
                    onChange={(ev) =>
                      setResume((r) => ({
                        ...r,
                        education: r.education.map((x) =>
                          x.id === e.id ? { ...x, location: ev.target.value } : x
                        ),
                      }))
                    }
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Start (2017)"
                      value={e.startDate}
                      onChange={(ev) =>
                        setResume((r) => ({
                          ...r,
                          education: r.education.map((x) =>
                            x.id === e.id ? { ...x, startDate: ev.target.value } : x
                          ),
                        }))
                      }
                    />
                    <Input
                      placeholder="End (2021)"
                      value={e.endDate}
                      onChange={(ev) =>
                        setResume((r) => ({
                          ...r,
                          education: r.education.map((x) =>
                            x.id === e.id ? { ...x, endDate: ev.target.value } : x
                          ),
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <Input
                    placeholder="Details (GPA, honors — optional)"
                    value={e.details}
                    onChange={(ev) =>
                      setResume((r) => ({
                        ...r,
                        education: r.education.map((x) =>
                          x.id === e.id ? { ...x, details: ev.target.value } : x
                        ),
                      }))
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-9 shrink-0"
                    disabled={idx === 0}
                    title="Move up"
                    onClick={() =>
                      setResume((r) => ({ ...r, education: moveItem(r.education, idx, -1) }))
                    }
                  >
                    <ArrowUp className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-9 shrink-0"
                    disabled={idx === resume.education.length - 1}
                    title="Move down"
                    onClick={() =>
                      setResume((r) => ({ ...r, education: moveItem(r.education, idx, 1) }))
                    }
                  >
                    <ArrowDown className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive h-9 shrink-0"
                    title="Delete education"
                    aria-label={`Delete education ${idx + 1}`}
                    onClick={() =>
                      setResume((r) => ({
                        ...r,
                        education: r.education.filter((x) => x.id !== e.id),
                      }))
                    }
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setResume((r) => ({ ...r, education: [...r.education, emptyEducation()] }))
              }
            >
              <Plus className="size-4" /> Add education
            </Button>
          </Section>

          <Section title="Projects (optional)" icon={<FileText className="size-4" />} defaultOpen={false}>
            {resume.projects.map((p) => (
              <div key={p.id} className="space-y-2 rounded-lg border p-3">
                <div className="grid gap-2 sm:grid-cols-2">
                  <Input
                    placeholder="Project name"
                    value={p.name}
                    onChange={(ev) =>
                      setResume((r) => ({
                        ...r,
                        projects: r.projects.map((x) =>
                          x.id === p.id ? { ...x, name: ev.target.value } : x
                        ),
                      }))
                    }
                  />
                  <Input
                    placeholder="Link (optional)"
                    value={p.link}
                    onChange={(ev) =>
                      setResume((r) => ({
                        ...r,
                        projects: r.projects.map((x) =>
                          x.id === p.id ? { ...x, link: ev.target.value } : x
                        ),
                      }))
                    }
                  />
                </div>
                <div className="flex items-start justify-between gap-2">
                  <Textarea
                    rows={2}
                    placeholder="What it does and your impact"
                    value={p.description}
                    onChange={(ev) =>
                      setResume((r) => ({
                        ...r,
                        projects: r.projects.map((x) =>
                          x.id === p.id ? { ...x, description: ev.target.value } : x
                        ),
                      }))
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive h-9 shrink-0"
                    title="Delete project"
                    aria-label="Delete project"
                    onClick={() =>
                      setResume((r) => ({
                        ...r,
                        projects: r.projects.filter((x) => x.id !== p.id),
                      }))
                    }
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setResume((r) => ({ ...r, projects: [...r.projects, emptyProject()] }))
              }
            >
              <Plus className="size-4" /> Add project
            </Button>
          </Section>

          <Section title="Skills & certifications" icon={<Sparkles className="size-4" />}>
            <div className="space-y-1.5">
              <Label htmlFor="skills">Skills (comma-separated)</Label>
              <Textarea
                id="skills"
                rows={2}
                placeholder="React, TypeScript, Node.js, PostgreSQL, AWS…"
                value={resume.skills}
                onChange={(e) => set('skills', e.target.value)}
              />
              {aiButton('skills', 'AI clean up skills', () =>
                void runRewrite('skills', 'skills', resume.skills, (out) =>
                  set('skills', out)
                )
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="certs">Certifications (optional)</Label>
              <Input
                id="certs"
                placeholder="AWS Solutions Architect (2024), PMP…"
                value={resume.certifications}
                onChange={(e) => set('certifications', e.target.value)}
              />
            </div>
          </Section>

          <Section
            title="Custom sections (optional)"
            icon={<Plus className="size-4" />}
            defaultOpen={resume.customSections.length > 0}
          >
            <p className="text-muted-foreground text-xs">
              Add anything else — Volunteering, Publications, Awards, Languages… One entry
              per line, shown as bullets.
            </p>
            {resume.customSections.map((s) => (
              <div key={s.id} className="space-y-2 rounded-lg border p-3">
                <div className="flex items-center justify-between gap-2">
                  <Input
                    placeholder="Section title (e.g. Volunteering)"
                    value={s.title}
                    onChange={(ev) =>
                      setResume((r) => ({
                        ...r,
                        customSections: r.customSections.map((x) =>
                          x.id === s.id ? { ...x, title: ev.target.value } : x
                        ),
                      }))
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive h-9 shrink-0"
                    title="Delete section"
                    onClick={() =>
                      setResume((r) => ({
                        ...r,
                        customSections: r.customSections.filter((x) => x.id !== s.id),
                        sectionOrder: r.sectionOrder.filter((k) => k !== `custom:${s.id}`),
                      }))
                    }
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
                <Textarea
                  rows={3}
                  placeholder={'One entry per line, e.g.\nVolunteer mentor, Code for Austin (2023 – Present)\nSpeaker, ReactATX meetup'}
                  value={s.bullets.join('\n')}
                  onChange={(ev) =>
                    setResume((r) => ({
                      ...r,
                      customSections: r.customSections.map((x) =>
                        x.id === s.id ? { ...x, bullets: ev.target.value.split('\n') } : x
                      ),
                    }))
                  }
                />
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setResume((r) => {
                  const s = emptyCustomSection()
                  return {
                    ...r,
                    customSections: [...r.customSections, s],
                    sectionOrder: [...orderedSectionKeys(r), `custom:${s.id}`],
                  }
                })
              }
            >
              <Plus className="size-4" /> Add custom section
            </Button>
          </Section>

          <Section
            title="Section order"
            icon={<ListOrdered className="size-4" />}
            defaultOpen={false}
          >
            <p className="text-muted-foreground text-xs">
              Drag (or use the arrows) to change the order sections appear on your resume.
            </p>
            <ul className="space-y-1.5">
              {orderedSectionKeys(resume).map((key, idx, keys) => (
                <li
                  key={key}
                  {...secDrag.dropProps(idx)}
                  className={`flex items-center justify-between rounded-md border px-2 py-1 text-sm transition ${
                    secDrag.overIndex === idx ? 'border-primary bg-primary/5' : ''
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <span
                      {...secDrag.handleProps(idx)}
                      role="button"
                      className="text-muted-foreground/60 hover:text-foreground cursor-grab touch-none p-1 active:cursor-grabbing"
                      title="Drag to reorder"
                      aria-label={`Drag ${sectionLabel(resume, key)} to reorder`}
                    >
                      <GripVertical className="size-3.5" />
                    </span>
                    {sectionLabel(resume, key)}
                  </span>
                  <span className="flex items-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-9 sm:h-7"
                      disabled={idx === 0}
                      title="Move up"
                      onClick={() =>
                        setResume((r) => ({
                          ...r,
                          sectionOrder: moveItem(orderedSectionKeys(r), idx, -1),
                        }))
                      }
                    >
                      <ArrowUp className="size-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-9 sm:h-7"
                      disabled={idx === keys.length - 1}
                      title="Move down"
                      onClick={() =>
                        setResume((r) => ({
                          ...r,
                          sectionOrder: moveItem(orderedSectionKeys(r), idx, 1),
                        }))
                      }
                    >
                      <ArrowDown className="size-3.5" />
                    </Button>
                  </span>
                </li>
              ))}
            </ul>
          </Section>

          {aiError && <p className="text-destructive text-sm">{aiError}</p>}
          {freeLeft !== null && !unlocked && (
            <p className="text-muted-foreground text-xs">
              {freeLeft} free AI rewrite{freeLeft === 1 ? '' : 's'} left
              {freeMode ? ' — resets within 30 days.' : ' — unlock once for unlimited.'}
            </p>
          )}
        </div>

        {/* ---- Right: preview + ATS ---- */}
        <div id="preview" className="scroll-mt-16 space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div className="flex flex-wrap items-center gap-2">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                title={t.description}
                onClick={() => set('templateId', t.id)}
                className={`w-16 rounded-md border p-1 transition ${
                  resume.templateId === t.id
                    ? 'border-primary ring-primary/40 ring-2'
                    : 'hover:border-muted-foreground/40'
                }`}
              >
                <TemplateThumb t={t} />
                <span className="mt-0.5 block truncate text-center text-[10px] leading-tight">
                  {t.name}
                </span>
              </button>
            ))}
            <span className="flex items-center gap-2">
              <span className="mx-1 h-5 border-l" aria-hidden />
              {ACCENT_CHOICES.map((color) => {
                const active =
                  (resume.accentColor || getTemplate(resume.templateId).accent) === color
                return (
                  <button
                    key={color}
                    type="button"
                    title={`Accent ${color}`}
                    aria-label={`Accent color ${color}`}
                    onClick={() =>
                      set('accentColor', color === getTemplate(resume.templateId).accent ? '' : color)
                    }
                    className="-m-0.5 flex size-8 items-center justify-center rounded-full"
                  >
                    <span
                      aria-hidden
                      className={`block size-5 rounded-full border-2 transition ${
                        active ? 'border-primary scale-110' : 'border-transparent hover:scale-110'
                      }`}
                      style={{ background: color }}
                    />
                  </button>
                )
              })}
            </span>
          </div>

          <Card className="py-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="font-medium">
                  ATS match score{' '}
                  <span className="text-muted-foreground text-xs font-normal">
                    — free, computed in your browser
                  </span>
                </p>
                <span
                  className={`text-2xl font-bold ${
                    ats.score >= 75
                      ? 'text-green-600'
                      : ats.score >= 50
                        ? 'text-amber-600'
                        : 'text-red-600'
                  }`}
                >
                  {ats.score}
                </span>
              </div>
              <div className="bg-muted mt-2 h-2 overflow-hidden rounded-full">
                <div
                  className={`h-full transition-all ${
                    ats.score >= 75
                      ? 'bg-green-600'
                      : ats.score >= 50
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                  }`}
                  style={{ width: `${ats.score}%` }}
                />
              </div>
              <div className="text-muted-foreground mt-2 flex gap-4 text-xs">
                {ats.keywordScore !== null && (
                  <span>
                    Keywords <span className="text-foreground font-medium">{ats.keywordScore}</span>
                  </span>
                )}
                <span>
                  Structure <span className="text-foreground font-medium">{ats.structureScore}</span>
                </span>
              </div>
              {resume.jobDescription.trim() ? (
                <div className="mt-3 space-y-2 text-xs">
                  {ats.matched.length > 0 && (
                    <p>
                      <span className="font-medium text-green-700">
                        Matched ({ats.matched.length}):
                      </span>{' '}
                      {ats.matched.join(', ')}
                    </p>
                  )}
                  {ats.missing.length > 0 && (
                    <div>
                      <span className="font-medium text-red-700">
                        Missing ({ats.missing.length})
                      </span>{' '}
                      <span className="text-muted-foreground">
                        — click a keyword you genuinely have to add it to Skills:
                      </span>
                      <span className="mt-1 flex flex-wrap gap-1">
                        {ats.missing.map((kw) => (
                          <button
                            key={kw}
                            type="button"
                            className="bg-muted hover:bg-primary/10 rounded-full border px-2 py-0.5"
                            onClick={() =>
                              set(
                                'skills',
                                resume.skills.trim()
                                  ? `${resume.skills.replace(/,\s*$/, '')}, ${kw}`
                                  : kw
                              )
                            }
                          >
                            + {kw}
                          </button>
                        ))}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground mt-2 text-xs">
                  Paste a job description in "Target job" to see keyword matches.
                </p>
              )}
              <ul className="mt-3 space-y-1 text-xs">
                {ats.checks.map((c) => (
                  <li key={c.label} className="flex items-start gap-1.5">
                    <span className={c.pass ? 'text-green-600' : 'text-red-500'}>
                      {c.pass ? '✓' : '✗'}
                    </span>
                    <span>
                      <span className="font-medium">{c.label}</span>
                      {!c.pass && <span className="text-muted-foreground"> — {c.hint}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <ResumePreview resume={resume} />

          <div className="grid gap-2 sm:grid-cols-2">
            <Button
              variant="outline"
              onClick={() =>
                hasBundlePlan || freeMode
                  ? setToolOpen('cover')
                  : requireUnlock(
                      'The AI cover letter writer is part of the Career Bundle ($19.99, one-time).'
                    )
              }
            >
              <FileText /> Cover letter{' '}
              {!hasBundlePlan && !freeMode && <Lock className="size-3 opacity-60" />}
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                hasBundlePlan || freeMode
                  ? setToolOpen('interview')
                  : requireUnlock(
                      'Interview prep is part of the Career Bundle ($19.99, one-time).'
                    )
              }
            >
              <MessagesSquare /> Interview prep{' '}
              {!hasBundlePlan && !freeMode && <Lock className="size-3 opacity-60" />}
            </Button>
          </div>
        </div>
      </main>

      <Button
        type="button"
        size="sm"
        variant="secondary"
        className="fixed right-4 bottom-4 z-30 shadow-lg lg:hidden"
        onClick={() =>
          document.getElementById('preview')?.scrollIntoView({ behavior: 'smooth' })
        }
      >
        <FileText className="size-3.5" /> Preview
      </Button>

      <SiteFooter />

      <UpgradeDialog
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        reason={upgradeReason}
        onActivated={() => {
          refresh()
          setUpgradeOpen(false)
        }}
      />
      <BundleToolDialog
        kind={toolOpen}
        onClose={() => setToolOpen(null)}
        resume={resume}
      />
      <Dialog open={variantPick !== null} onOpenChange={(o) => !o && setVariantPick(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{variantPick?.title}</DialogTitle>
            <DialogDescription>
              Three honest takes on your text — nothing invented. Bracketed placeholders like
              [add %] mark where a real number would help.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {variantPick?.candidates.map((cand, i) => (
              <button
                key={cand.slice(0, 40) + String(i)}
                type="button"
                className="hover:border-primary hover:bg-muted/50 w-full rounded-lg border p-3 text-left text-sm whitespace-pre-wrap transition"
                onClick={() => {
                  variantPick.apply(cand)
                  setVariantPick(null)
                }}
              >
                <span className="text-muted-foreground mb-1 block text-xs font-medium">
                  {['Concise', 'Impact-focused', 'Keyword-focused'][i] ?? `Option ${i + 1}`}
                </span>
                {cand}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
      <FreeDownloadDialog
        open={freeDlOpen}
        onOpenChange={setFreeDlOpen}
        onUnlocked={() => {
          const fmt = pendingDl.current
          pendingDl.current = null
          if (fmt) void download(fmt)
        }}
      />
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import your existing resume</DialogTitle>
            <DialogDescription>
              Upload a PDF, DOCX or TXT file — or paste the text below. We'll pre-fill
              the sections, entirely in your browser; nothing is uploaded to a server.
              Review the result; imports are a starting point, not perfect.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={importBusy}
              onClick={() => importFileRef.current?.click()}
            >
              <FileUp className="size-4" />
              {importBusy ? 'Reading file…' : 'Upload PDF / DOCX / TXT'}
            </Button>
            <span className="text-muted-foreground text-xs">or paste the text:</span>
            <input
              ref={importFileRef}
              type="file"
              accept={IMPORT_ACCEPT}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                e.target.value = ''
                if (!file) return
                setImportBusy(true)
                setImportError('')
                extractTextFromFile(file)
                  .then((text) => {
                    if (!text.trim())
                      throw new Error(
                        'No text found in this file — it may be a scanned image. Paste the text instead.'
                      )
                    setImportText(text)
                  })
                  .catch((err: unknown) =>
                    setImportError(err instanceof Error ? err.message : 'Could not read this file.')
                  )
                  .finally(() => setImportBusy(false))
              }}
            />
          </div>
          {importError && <p className="text-destructive text-sm">{importError}</p>}
          <Textarea
            rows={12}
            placeholder={'Jordan Reyes\nSoftware Engineer\njordan@email.com | (555) 210-4432\n\nEXPERIENCE\nSoftware Engineer at Brightlane (Jun 2023 – Present)\n- Led migration of the checkout flow…'}
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            className="font-mono text-xs"
          />
          <Button
            onClick={() => {
              if (!importText.trim()) return
              setResume(parseResumeText(importText))
              setImportOpen(false)
              setImportText('')
            }}
            disabled={!importText.trim()}
          >
            <ClipboardPaste /> Import — replaces current content (Ctrl+Z to undo)
          </Button>
        </DialogContent>
      </Dialog>
      <Dialog open={finalCheckOpen} onOpenChange={setFinalCheckOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Final check before download</DialogTitle>
            <DialogDescription>
              A few things could still be improved — fix them now or download anyway.
            </DialogDescription>
          </DialogHeader>
          <ul className="space-y-1.5 text-sm">
            {finalCheckIssues.map((issue) => (
              <li key={issue} className="flex gap-1.5">
                <span className="text-amber-600">⚠</span>
                <span>{issue}</span>
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setFinalCheckOpen(false)}>
              Keep editing
            </Button>
            <Button
              onClick={() => {
                const fmt = finalCheckFmt.current
                finalCheckFmt.current = null
                setFinalCheckOpen(false)
                if (fmt) void download(fmt, true)
              }}
            >
              <Download /> Download anyway
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function BulletIdeas({ role, onAdd }: { role: string; onAdd: (s: string) => void }) {
  const [open, setOpen] = useState(false)
  const starters = useMemo(() => bulletStartersFor(role), [role])
  return (
    <div>
      <button
        type="button"
        className="text-muted-foreground hover:text-foreground -my-1.5 inline-flex min-h-8 items-center gap-1 py-1.5 text-xs underline underline-offset-2"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <Lightbulb className="size-3" /> {open ? 'Hide bullet ideas' : 'Need ideas? Show bullet starters'}
      </button>
      {open && (
        <ul className="mt-2 space-y-1">
          {starters.map((s) => (
            <li key={s}>
              <button
                type="button"
                className="bg-muted/60 hover:bg-muted w-full rounded-md border px-2 py-1.5 text-left text-xs"
                title="Add this bullet"
                onClick={() => onAdd(s)}
              >
                + {s}
              </button>
            </li>
          ))}
          <li className="text-muted-foreground text-[11px]">
            Replace every [add …] with your real numbers — never invent facts.
          </li>
        </ul>
      )}
    </div>
  )
}

function BulletGuidance({ bullets }: { bullets: string[] }) {
  const results = useMemo(() => checkBullets(bullets), [bullets])
  if (results.length === 0) return null
  return (
    <ul className="space-y-0.5 text-xs">
      {results.slice(0, 4).map((r) =>
        r.issues.slice(0, 2).map((issue) => (
          <li key={`${r.index}-${issue.kind}`} className="text-amber-700">
            ⚠ Line {r.index + 1}: {issue.message}
          </li>
        ))
      )}
    </ul>
  )
}

function BundleToolDialog({
  kind,
  onClose,
  resume,
}: {
  kind: 'cover' | 'interview' | null
  onClose: () => void
  resume: Resume
}) {
  const [company, setCompany] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState('')
  const [lastKind, setLastKind] = useState(kind)

  if (kind !== lastKind) {
    setLastKind(kind)
    setResult('')
    setError('')
  }

  const generate = async () => {
    setBusy(true)
    setError('')
    try {
      const resumeText = resumeToPlainText(resume)
      const jd = resume.jobDescription
      if (!jd.trim()) {
        setError('Paste the job description in "Target job" first — both tools tailor to it.')
        return
      }
      const text =
        kind === 'cover'
          ? await aiCoverLetter({
              resumeText,
              jobDescription: jd,
              company,
              role: resume.targetRole,
            })
          : await aiInterviewBrief({
              resumeText,
              jobDescription: jd,
              role: resume.targetRole,
            })
      setResult(text)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const title = kind === 'cover' ? 'AI Cover Letter' : 'Interview Prep Brief'
  return (
    <Dialog open={kind !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Tailored to your resume and the job description you pasted in "Target job".
          </DialogDescription>
        </DialogHeader>
        {kind === 'cover' && (
          <div className="space-y-1.5">
            <Label htmlFor="company">Company name</Label>
            <Input
              id="company"
              placeholder="e.g. Stripe"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            />
          </div>
        )}
        <Button onClick={() => void generate()} disabled={busy}>
          {busy ? <Loader2 className="animate-spin" /> : <Sparkles />}
          {busy ? 'Writing…' : result ? 'Regenerate' : 'Generate'}
        </Button>
        {error && <p className="text-destructive text-sm">{error}</p>}
        {result && (
          <>
            <Textarea
              rows={14}
              value={result}
              onChange={(e) => setResult(e.target.value)}
              className="font-mono text-xs"
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  void downloadTextPdf(
                    title,
                    result,
                    kind === 'cover' ? 'cover-letter.pdf' : 'interview-prep.pdf'
                  )
                }
              >
                <Download /> PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  void downloadTextDocx(
                    title,
                    result,
                    kind === 'cover' ? 'cover-letter.docx' : 'interview-prep.docx'
                  )
                }
              >
                <Download /> DOCX
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
