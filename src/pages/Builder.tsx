import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowDown,
  ArrowUp,
  Briefcase,
  Check,
  ChevronDown,
  ChevronUp,
  ClipboardPaste,
  Download,
  FileText,
  Copy,
  FileUp,
  GraduationCap,
  GripVertical,
  History,
  LayoutGrid,
  LayoutTemplate,
  Save,
  Lightbulb,
  ListChecks,
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
import { AssistantPanel } from '@/components/AssistantPanel'
import { DraftIllustration } from '@/components/Illustrations'
import { ResumePreview } from '@/components/ResumePreview'
import { ScoreRing } from '@/components/ScoreRing'
import {
  PaymentRequiredError,
  type TailorItemInput,
  aiCoverLetter,
  aiKeywordBullet,
  aiInterviewBrief,
  aiInterviewFeedback,
  aiInterviewQuestions,
  aiResignationLetter,
  aiRewrite,
  aiSkillSuggest,
  aiSummaryDraft,
  aiTailor,
  fetchAiQuota,
} from '@/lib/api'
import { type AtsResult, scoreResume } from '@/lib/ats'
import {
  ACTION_VERBS,
  type HealthDimension,
  type HealthReport,
  checkBullets,
  resumeHealth,
  resumeStrength,
} from '@/lib/guidance'
import { parseResumeText } from '@/lib/importText'
import {
  parseShareId,
  fetchResumeProfile,
  resumeFromProfile,
  zalizeSessionEmail,
  fetchZalizePrimary,
} from '@/lib/resumeCenter'
import { IMPORT_ACCEPT, extractTextFromFile } from '@/lib/extractFile'

import { downloadText } from '@/lib/download'
import { saveCareerDoc, updateCareerDoc } from '@/lib/documents'
import { trackEvent } from '@/lib/track'

import {
  type ExperienceItem,
  type Resume,
  type ResumeVersion,
  deleteResumeVersion,
  emptyCustomSection,
  emptyEducation,
  emptyExperience,
  emptyProject,
  emptyResume,
  exampleToResume,
  loadResume,
  newId,
  orderedSectionKeys,
  listResumeVersions,
  listResumeHistory,
  recordResumeSnapshot,
  type ResumeSnapshot,
  resumeToPlainText,
  resumeToMarkdown,
  sampleResume,
  saveResume,
  type ExamplePerson,
  saveResumeVersion,
  sectionLabel,
} from '@/lib/resume'
import { TemplateThumb } from '@/components/TemplateThumb'
import { bulletStartersFor, skillSuggestionsFor } from '@/lib/bulletStarters'
import { ACCENT_CHOICES, TEMPLATES, TEMPLATE_FILTERS, getTemplate } from '@/lib/templates'

function useDebouncedSave(resume: Resume): 'saving' | 'saved' {
  const t = useRef<number | undefined>(undefined)
  const [state, setState] = useState<'saving' | 'saved'>('saved')
  const first = useRef(true)
  const pending = useRef<Resume | null>(null)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    setState('saving')
    pending.current = resume
    window.clearTimeout(t.current)
    t.current = window.setTimeout(() => {
      saveResume(resume)
      recordResumeSnapshot(resume)
      pending.current = null
      setState('saved')
    }, 400)
    return () => window.clearTimeout(t.current)
  }, [resume])
  useEffect(() => {
    // Flush an in-flight debounced save if the tab is closed or hidden
    const flush = () => {
      if (pending.current) {
        saveResume(pending.current)
        recordResumeSnapshot(pending.current)
        pending.current = null
      }
    }
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flush()
    }
    window.addEventListener('pagehide', flush)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('pagehide', flush)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])
  return state
}

/** Debounced page count of the exported PDF, shown next to the preview. */
function usePdfPageCount(resume: Resume): number | null {
  const [pages, setPages] = useState<number | null>(null)
  const seq = useRef(0)
  useEffect(() => {
    const id = ++seq.current
    const t = window.setTimeout(() => {
      void import('@/lib/pdf')
        .then((m) => m.countResumePdfPages(resume))
        .then((n) => {
          if (seq.current === id) setPages(n)
        })
        .catch(() => undefined)
    }, 800)
    return () => window.clearTimeout(t)
  }, [resume])
  return pages
}

const FIT_COMBOS: Array<
  [NonNullable<Resume['fontScale']>, NonNullable<Resume['lineSpacing']>]
> = [
  ['l', 'relaxed'],
  ['l', 'normal'],
  ['m', 'relaxed'],
  ['l', 'compact'],
  ['m', 'normal'],
  ['s', 'relaxed'],
  ['m', 'compact'],
  ['s', 'normal'],
  ['s', 'compact'],
]

const SCALE_NAME = { s: 'small', m: 'medium', l: 'large' } as const

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
          className="flex min-h-10 w-full items-center justify-between text-left font-medium sm:min-h-0"
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

/** Elapsed-time wait hint shown while an AI call is in flight */
function AiWaitHint() {
  const [seconds, setSeconds] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [])
  return (
    <p role="status" className="text-muted-foreground text-xs">
      Rewriting… usually takes 15–40 seconds ({seconds}s)
    </p>
  )
}

export default function Builder() {
  usePageMeta(
    'Resume Builder — RezUp',
    'Build an ATS-friendly resume in your browser: 22 templates, drag-and-drop sections, live ATS match score, free PDF & DOCX download. No account, no subscription.'
  )
  useEffect(() => trackEvent('builder-start'), [])
  const [resume, setResume] = useState<Resume>(() => {
    const r = loadResume() ?? emptyResume()
    // ?template=<id> deep link from the landing gallery / static template pages
    const wanted = new URLSearchParams(window.location.search).get('template')
    if (wanted && TEMPLATES.some((t) => t.id === wanted) && r.templateId !== wanted) {
      const next = { ...r, templateId: wanted }
      saveResume(next)
      return next
    }
    return r
  })
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [upgradeReason, setUpgradeReason] = useState('')
  const [aiBusy, setAiBusy] = useState<string | null>(null)
  const [aiError, setAiError] = useState('')
  const [aiErrorTag, setAiErrorTag] = useState<string | null>(null)
  const [freeLeft, setFreeLeft] = useState<number | null>(null)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false)
  const [downloaded, setDownloaded] = useState<string | null>(null)
  const [shareOpen, setShareOpen] = useState(false)
  const [shareCopied, setShareCopied] = useState(false)
  // ?doc=cover&company=<name> deep link from the /jobs board's "Cover letter" action
  const [toolOpen, setToolOpen] = useState<'cover' | 'interview' | 'resignation' | null>(() => {
    const doc = new URLSearchParams(window.location.search).get('doc')
    return doc === 'cover' || doc === 'interview' || doc === 'resignation' ? doc : null
  })
  const [toolCompany] = useState(
    () => new URLSearchParams(window.location.search).get('company') ?? ''
  )
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('doc')) {
      window.history.replaceState(null, '', window.location.pathname)
    }
  }, [])
  const [tailorOpen, setTailorOpen] = useState(false)
  const [healthOpen, setHealthOpen] = useState(false)
  const [kwBulletFor, setKwBulletFor] = useState<string | null>(null)
  const [checklistOpen, setChecklistOpen] = useState(
    () =>
      !localStorage.getItem('honestcv.tourDone') && !localStorage.getItem('honestcv.shared')
  )
  const [tailorSeen, setTailorSeen] = useState(() =>
    Boolean(localStorage.getItem('honestcv.seen.tailor'))
  )
  const [healthSeen, setHealthSeen] = useState(() =>
    Boolean(localStorage.getItem('honestcv.seen.health'))
  )
  const [tailorUsed, setTailorUsed] = useState(() =>
    Boolean(localStorage.getItem('honestcv.seen.tailor'))
  )
  const [dlDone, setDlDone] = useState(() => Boolean(localStorage.getItem('honestcv.shared')))
  const [freeDlOpen, setFreeDlOpen] = useState(false)
  const pendingDl = useRef<'pdf' | 'docx' | 'txt' | 'md' | null>(null)
  const [variantPick, setVariantPick] = useState<{
    title: string
    candidates: string[]
    apply: (text: string) => void
  } | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [importText, setImportText] = useState('')
  const [importBusy, setImportBusy] = useState(false)
  const [importError, setImportError] = useState('')
  const [rcInput, setRcInput] = useState('')
  const [rcBusy, setRcBusy] = useState(false)
  const [zaEmail, setZaEmail] = useState<string | null>(null)
  const [zaBusy, setZaBusy] = useState(false)
  useEffect(() => {
    if (importOpen) void zalizeSessionEmail().then(setZaEmail)
  }, [importOpen])
  const importFileRef = useRef<HTMLInputElement>(null)
  const backupFileRef = useRef<HTMLInputElement>(null)
  const [restoreError, setRestoreError] = useState('')
  const [versionsOpen, setVersionsOpen] = useState(false)
  const [versions, setVersions] = useState<ResumeVersion[]>(() => listResumeVersions())
  const [versionName, setVersionName] = useState('')
  const [finalCheckOpen, setFinalCheckOpen] = useState(false)
  const finalCheckFmt = useRef<'pdf' | 'docx' | 'txt' | 'md' | null>(null)
  const freeMode = useFreeMode()
  const { license, refresh } = useLicense()
  const saveState = useDebouncedSave(resume)
  const pdfPages = usePdfPageCount(resume)
  const [fitBusy, setFitBusy] = useState(false)
  const [fitMsg, setFitMsg] = useState('')
  const autoFit = useCallback(async () => {
    setFitBusy(true)
    setFitMsg('')
    try {
      const { countResumePdfPages } = await import('@/lib/pdf')
      let best: { fontScale: 's' | 'm' | 'l'; lineSpacing: 'compact' | 'normal' | 'relaxed'; pages: number } | null = null
      for (const [fontScale, lineSpacing] of FIT_COMBOS) {
        const pages = await countResumePdfPages({ ...resume, fontScale, lineSpacing })
        if (!best || pages < best.pages) best = { fontScale, lineSpacing, pages }
        if (pages === 1) break
      }
      if (!best) return
      const same =
        best.fontScale === (resume.fontScale ?? 'm') &&
        best.lineSpacing === (resume.lineSpacing ?? 'normal')
      if (!same) {
        setResume((r) => ({ ...r, fontScale: best.fontScale, lineSpacing: best.lineSpacing }))
      }
      setFitMsg(
        same
          ? `Already at the best fit — ${best.pages} page${best.pages === 1 ? '' : 's'}`
          : `Fits ${best.pages} page${best.pages === 1 ? '' : 's'} — set ${SCALE_NAME[best.fontScale]} text, ${best.lineSpacing} spacing`
      )
    } catch {
      setFitMsg('Auto-fit failed — please try again')
    } finally {
      setFitBusy(false)
    }
  }, [resume, setResume])
  const [templateFilter, setTemplateFilter] = useState('all')
  /** Which pane is visible on small screens (both show side-by-side on lg+) */
  const [mobilePane, setMobilePane] = useState<'edit' | 'preview'>('edit')
  const { undo, canUndo } = useUndo(resume, setResume)
  const [historyOpen, setHistoryOpen] = useState(false)
  // ?assistant=1 deep link from the workspace sidebar / mobile menu "AI assistant" entries
  const [assistantOpen, setAssistantOpen] = useState(
    () => new URLSearchParams(window.location.search).get('assistant') === '1'
  )
  const { pathname, search } = useLocation()
  const navigate = useNavigate()
  useEffect(() => {
    if (new URLSearchParams(search).get('assistant') !== '1') return
    navigate(pathname, { replace: true })
    const id = window.setTimeout(() => setAssistantOpen(true), 0)
    return () => window.clearTimeout(id)
  }, [search, pathname, navigate])
  const expDrag = useDragReorder((from, to) =>
    setResume((r) => ({ ...r, experience: reorder(r.experience, from, to) }))
  )
  const eduDrag = useDragReorder((from, to) =>
    setResume((r) => ({ ...r, education: reorder(r.education, from, to) }))
  )
  const secDrag = useDragReorder((from, to) =>
    setResume((r) => ({ ...r, sectionOrder: reorder(orderedSectionKeys(r), from, to) }))
  )

  // Role examples generated by scripts/build-seo.mjs, shared by the
  // ?example=<slug> deep link and the empty-state role picker.
  const [examples, setExamples] = useState<
    { slug: string; role: string; sector: string; person: ExamplePerson }[]
  >(
    []
  )
  const applyExample = useCallback((person: ExamplePerson) => {
    setResume((cur) => {
      const hasContent = Boolean(cur.contact.fullName || cur.summary)
      if (
        hasContent &&
        !window.confirm(
          'Replace your current resume content with this example? Your saved copies are unaffected.'
        )
      )
        return cur
      return {
        ...exampleToResume(person),
        // Keep a template the user deliberately picked
        ...(cur.templateId !== emptyResume().templateId ? { templateId: cur.templateId } : {}),
      }
    })
  }, [])

  useEffect(() => {
    let cancelled = false
    void fetch('/examples/examples.json')
      .then((r) => (r.ok ? r.json() : []))
      .then((list: { slug: string; role: string; sector: string; person: ExamplePerson }[]) => {
        if (cancelled) return
        setExamples(list)
        // ?example=<slug> deep link from the /examples/ pages
        const slug = new URLSearchParams(window.location.search).get('example')
        const entry = slug ? list.find((e) => e.slug === slug) : undefined
        if (!entry) return
        window.history.replaceState(null, '', window.location.pathname)
        applyExample(entry.person)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [applyExample])

  const unlocked = Boolean(license)
  const hasBundlePlan = license?.plan === 'bundle'
  useEffect(() => {
    if (unlocked) return
    let cancelled = false
    void fetchAiQuota().then((n) => {
      if (!cancelled && n !== null) setFreeLeft((prev) => prev ?? n)
    })
    return () => {
      cancelled = true
    }
  }, [unlocked])
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
    if (!text.trim()) {
      setAiErrorTag(tag)
      setAiError(
        kind === 'summary'
          ? 'Write a rough summary first — the AI polishes your draft, it never invents one.'
          : kind === 'skills'
            ? 'Add some skills first — the AI cleans up your list, it never invents skills.'
            : 'Write a rough bullet first — the AI rewrites your draft, it never invents experience.'
      )
      return
    }
    setAiBusy(tag)
    setAiError('')
    setAiErrorTag(tag)
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

  const runSummaryDraft = async () => {
    const tag = 'summary-draft'
    const hasContent =
      resume.experience.some((e) => e.role.trim() || e.bullets.some((b) => b.trim())) ||
      resume.skills.trim().length > 0 ||
      resume.education.some((e) => e.degree.trim() || e.school.trim())
    if (!hasContent) {
      setAiErrorTag(tag)
      setAiError('Add some experience or skills first — the draft is written only from your resume.')
      return
    }
    setAiBusy(tag)
    setAiError('')
    setAiErrorTag(tag)
    try {
      const { texts, freeRemaining } = await aiSummaryDraft({
        resumeText: resumeToPlainText({ ...resume, summary: '' }),
        role: resume.targetRole,
      })
      if (freeRemaining !== null) setFreeLeft(freeRemaining)
      setVariantPick({
        title: 'Pick a summary',
        candidates: texts,
        apply: (out) => set('summary', out),
      })
    } catch (e) {
      if (e instanceof PaymentRequiredError && !freeMode) requireUnlock(e.message)
      else setAiError((e as Error).message)
    } finally {
      setAiBusy(null)
    }
  }

  const [aiSkillChips, setAiSkillChips] = useState<string[] | null>(null)

  const runSkillSuggest = async () => {
    const tag = 'skill-suggest'
    if (!resume.skills.trim() && !resume.targetRole.trim()) {
      setAiErrorTag(tag)
      setAiError('Add a target role or a few skills first — suggestions build on what you already have.')
      return
    }
    setAiBusy(tag)
    setAiError('')
    setAiErrorTag(tag)
    try {
      const { skills, freeRemaining } = await aiSkillSuggest({
        skills: resume.skills,
        role: resume.targetRole,
        jobDescription: resume.jobDescription,
      })
      if (freeRemaining !== null) setFreeLeft(freeRemaining)
      setAiSkillChips(skills)
    } catch (e) {
      if (e instanceof PaymentRequiredError && !freeMode) requireUnlock(e.message)
      else setAiError((e as Error).message)
    } finally {
      setAiBusy(null)
    }
  }

  const strength = useMemo(() => resumeStrength(resume), [resume])
  const health = useMemo(() => resumeHealth(resume), [resume])

  const insertKeywordBullet = useCallback((expId: string, text: string) => {
    setResume((r) => ({
      ...r,
      experience: r.experience.map((e) =>
        e.id === expId ? { ...e, bullets: [...e.bullets.filter((b) => b.trim()), text] } : e
      ),
    }))
  }, [])

  const applyTailorSuggestion = useCallback((id: string, text: string) => {
    if (id === 'summary') {
      setResume((r) => ({ ...r, summary: text }))
      return
    }
    const sep = id.lastIndexOf(':')
    const expId = id.slice(0, sep)
    const idx = Number(id.slice(sep + 1))
    setResume((r) => ({
      ...r,
      experience: r.experience.map((e) =>
        e.id === expId ? { ...e, bullets: e.bullets.map((b, i) => (i === idx ? text : b)) } : e
      ),
    }))
  }, [])

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

  const download = async (fmt: 'pdf' | 'docx' | 'txt' | 'md', skipFinalCheck = false) => {
    if (!unlocked) {
      if (!freeMode) {
        requireUnlock(
          'Downloading your resume as PDF or DOCX is the one thing we charge for — once, not monthly.'
        )
        return
      }
      // A prior download (honestcv.shared) means the gate was already passed —
      // don't ask for the email twice.
      if (!hasSubscribed() && !localStorage.getItem('honestcv.shared')) {
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
      if (fmt === 'pdf')
        await (await import('@/lib/pdf')).downloadResumePdf(resume, `${name}-resume.pdf`)
      else if (fmt === 'docx')
        await (await import('@/lib/docx')).downloadResumeDocx(resume, `${name}-resume.docx`)
      else if (fmt === 'md')
        downloadText(resumeToMarkdown(resume), `${name}-resume.md`, 'text/markdown')
      else downloadText(resumeToPlainText(resume), `${name}-resume.txt`)
      setDlDone(true)
      if (!localStorage.getItem('honestcv.shared')) {
        localStorage.setItem('honestcv.shared', '1')
        setShareCopied(false)
        setShareOpen(true)
      }
      setDownloaded(fmt)
      window.setTimeout(() => setDownloaded((cur) => (cur === fmt ? null : cur)), 1800)
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
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onClick}
        disabled={Boolean(aiBusy) || disabled}
        className="h-10 gap-1 text-xs sm:h-7"
        title={
          !unlocked && freeLeft !== null
            ? `${freeLeft} free AI use${freeLeft === 1 ? '' : 's'} left`
            : undefined
        }
      >
        {aiBusy === tag ? (
          <Loader2 className="size-3 animate-spin" />
        ) : (
          <Wand2 className="size-3" />
        )}
        {label}
      </Button>
      {aiBusy === tag && <AiWaitHint />}
      {aiError && aiErrorTag === tag && (
        <p className="text-destructive text-xs">{aiError}</p>
      )}
    </>
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
                <Unlock className="size-3" /> Free during beta
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
              className="hidden min-h-10 min-w-10 sm:inline-flex sm:min-h-8 sm:min-w-8"
            >
              <Undo2 className="size-3.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setHistoryOpen(true)}
              title="Edit history — automatic checkpoints of this draft"
              className="min-h-10 min-w-10 sm:min-h-8 sm:min-w-8"
            >
              <History className="size-3.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setAssistantOpen(true)}
              title="Resume assistant — chat about your draft and job search"
              className="min-h-10 min-w-10 sm:min-h-8 sm:min-w-8"
            >
              <MessagesSquare className="size-3.5" />
            </Button>
            <Button
              size="sm"
              onClick={() => void download('pdf')}
              disabled={Boolean(downloading)}
              className="hidden sm:inline-flex"
            >
              {downloading === 'pdf' ? (
                <Loader2 className="animate-spin" />
              ) : downloaded === 'pdf' ? (
                <Check className="animate-pop text-emerald-400" />
              ) : (
                <Download />
              )}
              PDF
            </Button>
            <div className="relative sm:hidden">
              <Button
                size="sm"
                variant="outline"
                aria-haspopup="true"
                aria-expanded={downloadMenuOpen}
                title="Download your resume"
                disabled={Boolean(downloading)}
                onClick={() => setDownloadMenuOpen((o) => !o)}
                className="min-h-10"
              >
                {downloading ? <Loader2 className="animate-spin" /> : <Download />}
                <ChevronDown className={`size-3.5 transition-transform ${downloadMenuOpen ? 'rotate-180' : ''}`} />
              </Button>
              {downloadMenuOpen && (
                <div className="bg-background absolute right-0 top-full z-30 mt-2 min-w-40 rounded-md border p-1 shadow-lg">
                  {(['pdf', 'docx', 'txt', 'md'] as const).map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      className="text-foreground hover:bg-accent flex min-h-10 w-full items-center gap-2 rounded-sm px-3 text-sm"
                      onClick={() => {
                        setDownloadMenuOpen(false)
                        void download(fmt)
                      }}
                    >
                      <Download className="size-3.5" /> {fmt.toUpperCase()}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => void download('docx')}
              disabled={Boolean(downloading)}
              className="hidden sm:inline-flex"
            >
              {downloading === 'docx' ? (
                <Loader2 className="animate-spin" />
              ) : downloaded === 'docx' ? (
                <Check className="animate-pop text-emerald-600" />
              ) : (
                <Download />
              )}{' '}
              DOCX
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => void download('txt')}
              disabled={Boolean(downloading)}
              title="Plain-text version — handy for online application forms and ATS paste boxes"
              className="hidden sm:inline-flex"
            >
              {downloaded === 'txt' ? <Check className="animate-pop text-emerald-600" /> : <Download />} TXT
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => void download('md')}
              disabled={Boolean(downloading)}
              title="Markdown version — handy for AI tools, GitHub profiles and quick edits"
              className="hidden md:inline-flex"
            >
              {downloaded === 'md' ? <Check className="animate-pop text-emerald-600" /> : <Download />} MD
            </Button>
          </div>
        }
      />

      <main className="mx-auto grid w-full max-w-7xl flex-1 gap-6 px-4 py-6 pb-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:pb-6">
        <h1 className="sr-only">Resume builder</h1>
        {/* ---- Left: editor ---- */}
        <div className={`space-y-4 ${mobilePane === 'edit' ? '' : 'hidden lg:block'}`}>
          {resume === null ||
            (!resume.contact.fullName && !resume.summary && (
              <div className="rounded-lg border border-dashed p-3 text-center text-sm">
                <DraftIllustration className="mx-auto mb-1 h-20" />
                Starting fresh?{' '}
                <button
                  type="button"
                  className="text-primary relative -my-3 inline-flex items-center py-3 underline sm:my-0 sm:py-0"
                  onClick={() =>
                    setResume({
                      ...sampleResume(),
                      // Keep a template the user deliberately picked; otherwise
                      // use the sample's themed default
                      ...(resume && resume.templateId !== emptyResume().templateId
                        ? { templateId: resume.templateId }
                        : {}),
                    })
                  }
                >
                  Load an example resume
                </button>{' '}
                to see how it works, or{' '}
                <button
                  type="button"
                  className="text-primary relative -my-3 inline-flex items-center py-3 underline sm:my-0 sm:py-0"
                  onClick={() => setImportOpen(true)}
                >
                  import your existing resume (PDF/DOCX/text)
                </button>
                .
                {examples.length > 0 && (
                  <span className="mt-3 flex flex-wrap items-center justify-center gap-2">
                    <label htmlFor="example-role" className="text-muted-foreground">
                      Or start from your role:
                    </label>
                    <select
                      id="example-role"
                      className="h-11 rounded-md border px-2 text-sm"
                      value=""
                      onChange={(e) => {
                        const entry = examples.find((x) => x.slug === e.target.value)
                        if (entry) applyExample(entry.person)
                      }}
                    >
                      <option value="">Choose a role…</option>
                      {[...new Set(examples.map((e) => e.sector))].map((sector) => (
                        <optgroup key={sector} label={sector}>
                          {examples
                            .filter((e) => e.sector === sector)
                            .map((e) => (
                              <option key={e.slug} value={e.slug}>
                                {e.role}
                              </option>
                            ))}
                        </optgroup>
                      ))}
                    </select>
                  </span>
                )}
              </div>
            ))}

          {checklistOpen && (
            <div className="bg-card rounded-lg border p-3" data-testid="getting-started">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-sm font-medium">
                  <ListChecks className="text-primary size-4" /> Getting started
                </span>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground relative -my-3 inline-flex items-center py-3 text-xs underline sm:my-0 sm:py-0"
                  onClick={() => {
                    localStorage.setItem('honestcv.tourDone', '1')
                    setChecklistOpen(false)
                  }}
                >
                  Dismiss
                </button>
              </div>
              <ol className="mt-2 space-y-1 text-sm">
                {(
                  [
                    [
                      Boolean(resume.contact.fullName.trim()),
                      'Add your details — or load the example / import your resume above',
                    ],
                    [
                      Boolean(resume.jobDescription.trim()),
                      'Paste the job description you\u2019re applying to (Target job below)',
                    ],
                    [
                      tailorUsed,
                      'Check your ATS match and let AI tailor your bullets to that job',
                    ],
                    [dlDone, 'Download your resume as PDF or DOCX'],
                  ] as [boolean, string][]
                ).map(([done, label], i) => (
                  <li key={label} className="flex items-start gap-2">
                    {done ? (
                      <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                    ) : (
                      <span
                        aria-hidden
                        className="text-muted-foreground border-muted-foreground/40 mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border text-[10px]"
                      >
                        {i + 1}
                      </span>
                    )}
                    <span className={done ? 'text-muted-foreground line-through' : ''}>
                      {label}
                      {done && <span className="sr-only"> (done)</span>}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-10 gap-1 text-xs sm:h-7"
              onClick={() => setImportOpen(true)}
            >
              <FileUp className="size-3" /> Import resume (PDF/DOCX/text)
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-10 gap-1 text-xs sm:h-7"
              title="Save a .json backup of this resume — everything lives in this browser only"
              onClick={() => {
                const name = (resume.contact.fullName || 'resume')
                  .replace(/\s+/g, '-')
                  .toLowerCase()
                downloadText(
                  JSON.stringify(resume, null, 2),
                  `${name}-rezup-backup.json`,
                  'application/json'
                )
              }}
            >
              <Download className="size-3" /> Backup
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-10 gap-1 text-xs sm:h-7"
              title="Restore a resume from a .json backup"
              onClick={() => backupFileRef.current?.click()}
            >
              <FileUp className="size-3" /> Restore
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-10 gap-1 text-xs sm:h-7"
              title="Save and switch between copies tailored to different jobs"
              onClick={() => {
                setVersions(listResumeVersions())
                setVersionName(resume.targetRole || '')
                setVersionsOpen(true)
              }}
            >
              <Copy className="size-3" /> Copies{versions.length > 0 ? ` (${versions.length})` : ''}
            </Button>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-10 gap-1 text-xs sm:h-7"
              title="See all your resumes and copies in one place"
            >
              <Link to="/dashboard">
                <LayoutGrid className="size-3" /> My resumes
              </Link>
            </Button>
            <input
              ref={backupFileRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                e.target.value = ''
                if (!file) return
                void file.text().then((raw) => {
                  try {
                    const parsed = JSON.parse(raw) as Resume
                    if (!parsed.contact || !Array.isArray(parsed.experience)) {
                      setRestoreError('That file is not a RezUp backup.')
                      return
                    }
                    setRestoreError('')
                    setResume({ ...emptyResume(), ...parsed })
                  } catch {
                    setRestoreError('That file is not a RezUp backup.')
                  }
                })
              }}
            />
          </div>
          {restoreError && (
            <p className="text-destructive text-right text-xs" role="alert">
              {restoreError}
            </p>
          )}

          <div className="bg-card rounded-lg border p-3">
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="font-medium">Resume strength</span>
              <span className="text-muted-foreground text-xs">{strength.score}%</span>
            </div>
            <div
              className="bg-muted mt-2 h-1.5 w-full overflow-hidden rounded-full"
              role="progressbar"
              aria-label="Resume strength"
              aria-valuenow={strength.score}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className={`h-full rounded-full transition-all ${
                  strength.score >= 80
                    ? 'bg-emerald-500'
                    : strength.score >= 50
                      ? 'bg-amber-500'
                      : 'bg-red-400'
                }`}
                style={{ width: `${strength.score}%` }}
              />
            </div>
            {strength.missing.length > 0 && (
              <p className="text-muted-foreground mt-2 text-xs">
                Next: {strength.missing.slice(0, 2).join(' · ')}
                {strength.missing.length > 2 ? ` · +${strength.missing.length - 2} more` : ''}
              </p>
            )}
            <button
              type="button"
              className="text-primary relative mt-2 -mb-3 inline-flex min-h-10 items-center gap-1.5 text-xs underline sm:mb-0 sm:min-h-0"
              onClick={() => {
                localStorage.setItem('honestcv.seen.health', '1')
                setHealthSeen(true)
                setHealthOpen(true)
              }}
            >
              Full health report — {health.score}/100 across {health.dimensions.length} checks
              {!healthSeen && (
                <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                  New
                </Badge>
              )}
            </button>
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
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                size="sm"
                className="h-10 gap-1 text-xs sm:h-7"
                disabled={!resume.jobDescription.trim()}
                title="AI rewords your summary and bullets toward this job — review each change before it's applied"
                onClick={() => {
                  localStorage.setItem('honestcv.seen.tailor', '1')
                  setTailorSeen(true)
                  setTailorUsed(true)
                  setTailorOpen(true)
                }}
              >
                <Sparkles className="size-3" /> Tailor to this job
                {!tailorSeen && (
                  <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                    New
                  </Badge>
                )}
              </Button>
              {!resume.jobDescription.trim() ? (
                <span className="text-muted-foreground text-xs">
                  Paste a job description to enable tailoring
                </span>
              ) : (
                freeLeft !== null &&
                !unlocked && (
                  <span className="text-muted-foreground text-xs">
                    {freeLeft} free AI use{freeLeft === 1 ? '' : 's'} left
                  </span>
                )
              )}
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
              {resume.summary.trim()
                ? aiButton('summary', 'AI polish summary', () =>
                    void runRewrite('summary', 'summary', resume.summary, (out) =>
                      set('summary', out)
                    )
                  )
                : aiButton('summary-draft', 'Draft from my resume', () => void runSummaryDraft())}
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
                      className="text-muted-foreground/60 hover:text-foreground -my-2.5 -ml-1 cursor-grab touch-none p-3.5 active:cursor-grabbing sm:my-0 sm:p-1"
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
                      className="h-10 sm:h-7"
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
                      className="h-10 sm:h-7"
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
                      className="h-10 sm:h-7"
                      title="Duplicate role — handy for a promotion at the same company"
                      aria-label={`Duplicate role ${idx + 1}`}
                      onClick={() =>
                        setResume((r) => {
                          const i = r.experience.findIndex((x) => x.id === e.id)
                          const copy = {
                            ...r.experience[i],
                            id: newId(),
                            bullets: [...r.experience[i].bullets],
                          }
                          const experience = [...r.experience]
                          experience.splice(i + 1, 0, copy)
                          return { ...r, experience }
                        })
                      }
                    >
                      <Copy className="size-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive h-10 sm:h-7"
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
                <BulletGuidance
                  bullets={e.bullets}
                  busyLine={
                    aiBusy?.startsWith(`exp-${e.id}-line-`)
                      ? Number(aiBusy.slice(`exp-${e.id}-line-`.length))
                      : null
                  }
                  onFix={(idx) =>
                    void runRewrite(
                      `exp-${e.id}-line-${idx}`,
                      'bullets',
                      e.bullets[idx] ?? '',
                      (out) =>
                        setExp(e.id, {
                          bullets: e.bullets.map((b, i) =>
                            i === idx
                              ? (out.split('\n')[0] ?? '').replace(/^[-•]\s*/, '').trim() || b
                              : b
                          ),
                        })
                    )
                  }
                />
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
                    className="text-muted-foreground/60 hover:text-foreground -my-2.5 -ml-1 cursor-grab touch-none p-3.5 active:cursor-grabbing sm:my-0 sm:p-1"
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
                    className="h-9 shrink-0"
                    title="Duplicate education — handy for a second degree at the same school"
                    aria-label={`Duplicate education ${idx + 1}`}
                    onClick={() =>
                      setResume((r) => {
                        const i = r.education.findIndex((x) => x.id === e.id)
                        const copy = { ...r.education[i], id: newId() }
                        const education = [...r.education]
                        education.splice(i + 1, 0, copy)
                        return { ...r, education }
                      })
                    }
                  >
                    <Copy className="size-3.5" />
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
            {resume.projects.map((p, pIdx) => (
              <div key={p.id} className="space-y-2 rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <p className="text-muted-foreground text-xs font-medium">Project {pIdx + 1}</p>
                  <div className="flex items-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-10 sm:h-7"
                      disabled={pIdx === 0}
                      title="Move up"
                      aria-label={`Move project ${pIdx + 1} up`}
                      onClick={() =>
                        setResume((r) => ({ ...r, projects: moveItem(r.projects, pIdx, -1) }))
                      }
                    >
                      <ArrowUp className="size-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-10 sm:h-7"
                      disabled={pIdx === resume.projects.length - 1}
                      title="Move down"
                      aria-label={`Move project ${pIdx + 1} down`}
                      onClick={() =>
                        setResume((r) => ({ ...r, projects: moveItem(r.projects, pIdx, 1) }))
                      }
                    >
                      <ArrowDown className="size-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-10 sm:h-7"
                      title="Duplicate project"
                      aria-label={`Duplicate project ${pIdx + 1}`}
                      onClick={() =>
                        setResume((r) => {
                          const i = r.projects.findIndex((x) => x.id === p.id)
                          const copy = { ...r.projects[i], id: newId() }
                          const projects = [...r.projects]
                          projects.splice(i + 1, 0, copy)
                          return { ...r, projects }
                        })
                      }
                    >
                      <Copy className="size-3.5" />
                    </Button>
                  </div>
                </div>
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
              <div className="flex flex-wrap items-center gap-2">
                {aiButton('skills', 'AI clean up skills', () =>
                  void runRewrite('skills', 'skills', resume.skills, (out) =>
                    set('skills', out)
                  )
                )}
                {aiButton('skill-suggest', 'AI suggest related skills', () =>
                  void runSkillSuggest()
                )}
              </div>
              {(() => {
                const have = new Set(
                  resume.skills.split(/[,\n]/).map((s) => s.trim().toLowerCase())
                )
                const chips = (aiSkillChips ?? skillSuggestionsFor(resume.targetRole)).filter(
                  (s) => !have.has(s.toLowerCase())
                )
                if (chips.length === 0) return null
                return (
                  <div className="text-xs">
                    <span className="text-muted-foreground">
                      {aiSkillChips
                        ? 'Related to your skills and role — tap only skills you actually have:'
                        : 'Common for your target role — tap only skills you actually have:'}
                    </span>
                    <span className="mt-1 flex flex-wrap gap-1">
                      {chips.map((kw) => (
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
                )
              })()}
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
                      className="text-muted-foreground/60 hover:text-foreground -my-2.5 cursor-grab touch-none p-3.5 active:cursor-grabbing sm:my-0 sm:p-1"
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
                      className="h-10 sm:h-7"
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
                      className="h-10 sm:h-7"
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


          {freeLeft !== null && !unlocked && (
            <p className="text-muted-foreground text-xs">
              {freeLeft} free AI rewrite{freeLeft === 1 ? '' : 's'} left
              {freeMode ? ' — resets within 30 days.' : ' — unlock once for unlimited.'}
            </p>
          )}
        </div>

        {/* ---- Right: preview + ATS ---- */}
        <div
          id="preview"
          className={`scroll-mt-16 space-y-4 lg:sticky lg:top-20 lg:self-start ${
            mobilePane === 'preview' ? '' : 'hidden lg:block'
          }`}
        >
          {pdfPages !== null && (
            <div className="flex flex-wrap items-center gap-2">
              <p
                className={`text-xs ${pdfPages > 1 ? 'text-amber-700' : 'text-muted-foreground'}`}
              >
                PDF export: {pdfPages} page{pdfPages === 1 ? '' : 's'}
                {pdfPages > 1 &&
                  ' — recruiters prefer one page; consider trimming older roles or long bullets'}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="h-10 gap-1 text-xs sm:h-7"
                disabled={fitBusy}
                title="Pick the most readable text size and line spacing that fit the fewest pages"
                onClick={() => void autoFit()}
              >
                <Wand2 className="size-3" /> {fitBusy ? 'Fitting…' : 'Auto-fit'}
              </Button>
              {fitMsg && (
                <p role="status" className="text-muted-foreground text-xs">
                  {fitMsg}
                </p>
              )}
            </div>
          )}
          <div
            className="flex flex-wrap items-center gap-1.5"
            role="group"
            aria-label="Filter templates by style"
          >
            {TEMPLATE_FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                aria-pressed={templateFilter === f.id}
                onClick={() => setTemplateFilter(f.id)}
                className={`rounded-full border px-2 py-0.5 text-[11px] transition ${
                  templateFilter === f.id
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'hover:border-muted-foreground/40'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {TEMPLATES.filter(
              (TEMPLATE_FILTERS.find((f) => f.id === templateFilter) ?? TEMPLATE_FILTERS[0]).match,
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                title={t.description}
                aria-pressed={resume.templateId === t.id}
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
            <span className="text-muted-foreground w-full text-xs">
              {getTemplate(resume.templateId).name}:{' '}
              {getTemplate(resume.templateId).description} ·{' '}
              {getTemplate(resume.templateId).tags.join(' · ')}
            </span>
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
                    aria-pressed={active}
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
            <span className="flex items-center gap-1">
              <span className="mx-1 h-5 border-l" aria-hidden />
              {(['letter', 'a4'] as const).map((size) => (
                <button
                  key={size}
                  type="button"
                  title={
                    size === 'letter'
                      ? 'US Letter — standard in the US and Canada'
                      : 'A4 — standard in the UK, Europe and most other countries'
                  }
                  aria-pressed={(resume.pageSize === 'a4' ? 'a4' : 'letter') === size}
                  onClick={() => set('pageSize', size)}
                  className={`rounded-md border px-2 py-1 text-[11px] font-medium transition ${
                    (resume.pageSize === 'a4' ? 'a4' : 'letter') === size
                      ? 'border-primary ring-primary/40 ring-2'
                      : 'hover:border-muted-foreground/40'
                  }`}
                >
                  {size === 'letter' ? 'Letter' : 'A4'}
                </button>
              ))}
            </span>
            <span className="flex items-center gap-1">
              <span className="mx-1 h-5 border-l" aria-hidden />
              <span className="text-muted-foreground text-[11px]">Font</span>
              {(
                [
                  ['auto', 'Auto', 'Follow the template’s font'],
                  ['serif', 'Serif', 'Georgia / Times — traditional look'],
                  ['sans', 'Sans', 'Inter / Calibri — modern look'],
                ] as const
              ).map(([value, label, hint]) => (
                <button
                  key={value}
                  type="button"
                  title={`${hint} — applies to preview, PDF and DOCX`}
                  aria-pressed={(resume.fontFamily ?? 'auto') === value}
                  onClick={() => set('fontFamily', value)}
                  className={`rounded-md border px-2 py-1 text-[11px] font-medium transition ${
                    (resume.fontFamily ?? 'auto') === value
                      ? 'border-primary ring-primary/40 ring-2'
                      : 'hover:border-muted-foreground/40'
                  }`}
                >
                  {label}
                </button>
              ))}
            </span>
            <span className="flex items-center gap-1">
              <span className="mx-1 h-5 border-l" aria-hidden />
              <span className="text-muted-foreground text-[11px]">Text</span>
              {(['s', 'm', 'l'] as const).map((scale) => (
                <button
                  key={scale}
                  type="button"
                  title={`Text size ${scale.toUpperCase()} — applies to preview, PDF and DOCX`}
                  aria-label={`Text size ${scale === 's' ? 'small' : scale === 'l' ? 'large' : 'medium'}`}
                  aria-pressed={(resume.fontScale ?? 'm') === scale}
                  onClick={() => set('fontScale', scale)}
                  className={`rounded-md border px-2 py-1 text-[11px] font-medium transition ${
                    (resume.fontScale ?? 'm') === scale
                      ? 'border-primary ring-primary/40 ring-2'
                      : 'hover:border-muted-foreground/40'
                  }`}
                >
                  {scale.toUpperCase()}
                </button>
              ))}
            </span>
            <span className="flex items-center gap-1">
              <span className="mx-1 h-5 border-l" aria-hidden />
              <span className="text-muted-foreground text-[11px]">Spacing</span>
              {(
                [
                  ['compact', 'Compact'],
                  ['normal', 'Normal'],
                  ['relaxed', 'Relaxed'],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  title={`${label} line spacing — applies to preview, PDF and DOCX`}
                  aria-pressed={(resume.lineSpacing ?? 'normal') === value}
                  onClick={() => set('lineSpacing', value)}
                  className={`rounded-md border px-2 py-1 text-[11px] font-medium transition ${
                    (resume.lineSpacing ?? 'normal') === value
                      ? 'border-primary ring-primary/40 ring-2'
                      : 'hover:border-muted-foreground/40'
                  }`}
                >
                  {label}
                </button>
              ))}
            </span>
            <span className="flex items-center gap-1">
              <span className="mx-1 h-5 border-l" aria-hidden />
              <span className="text-muted-foreground text-[11px]">Sections</span>
              {(
                [
                  ['tight', 'Tight'],
                  ['normal', 'Normal'],
                  ['roomy', 'Roomy'],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  title={`${label} space between sections — applies to preview, PDF and DOCX`}
                  aria-pressed={(resume.sectionSpacing ?? 'normal') === value}
                  onClick={() => set('sectionSpacing', value)}
                  className={`rounded-md border px-2 py-1 text-[11px] font-medium transition ${
                    (resume.sectionSpacing ?? 'normal') === value
                      ? 'border-primary ring-primary/40 ring-2'
                      : 'hover:border-muted-foreground/40'
                  }`}
                >
                  {label}
                </button>
              ))}
            </span>
            <span className="flex items-center gap-1">
              <span className="mx-1 h-5 border-l" aria-hidden />
              <span className="text-muted-foreground text-[11px]">Divider</span>
              {(
                [
                  ['auto', 'Auto', 'Follow the template’s section divider'],
                  ['on', 'On', 'Show a rule under each section heading'],
                  ['off', 'Off', 'Hide section divider rules'],
                ] as const
              ).map(([value, label, hint]) => (
                <button
                  key={value}
                  type="button"
                  title={`${hint} — applies to preview, PDF and DOCX`}
                  aria-pressed={(resume.sectionDivider ?? 'auto') === value}
                  onClick={() => set('sectionDivider', value)}
                  className={`rounded-md border px-2 py-1 text-[11px] font-medium transition ${
                    (resume.sectionDivider ?? 'auto') === value
                      ? 'border-primary ring-primary/40 ring-2'
                      : 'hover:border-muted-foreground/40'
                  }`}
                >
                  {label}
                </button>
              ))}
            </span>
          </div>

          <Card className="py-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4">
                <p className="font-medium">
                  ATS match score{' '}
                  <span className="text-muted-foreground text-xs font-normal">
                    — free, computed in your browser
                  </span>
                </p>
                <ScoreRing score={ats.score} size={72} />
              </div>
              <div className="text-muted-foreground mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                {ats.keywordScore !== null && (
                  <span>
                    Keywords <span className="text-foreground font-medium">{ats.keywordScore}</span>
                    <span className="text-muted-foreground/70"> ×70%</span>
                  </span>
                )}
                <span>
                  Structure <span className="text-foreground font-medium">{ats.structureScore}</span>
                  {ats.keywordScore !== null && (
                    <span className="text-muted-foreground/70"> ×30%</span>
                  )}
                </span>
              </div>
              <button
                type="button"
                className="text-primary mt-2 inline-flex min-h-10 items-center text-xs underline sm:min-h-0"
                onClick={() => {
                  localStorage.setItem('honestcv.seen.health', '1')
                  setHealthSeen(true)
                  setHealthOpen(true)
                }}
              >
                See full score breakdown
              </button>
              <details className="mt-2 text-xs">
                <summary className="text-muted-foreground hover:text-foreground cursor-pointer select-none underline-offset-2 hover:underline">
                  How this score is calculated
                </summary>
                <div className="text-muted-foreground mt-1.5 space-y-1.5 rounded-md border p-2.5">
                  <p>
                    {ats.keywordScore !== null
                      ? 'Score = keyword coverage ×70% + structure checks ×30%. Keyword coverage is the share of the job posting\u2019s top keywords (extracted by frequency, stop-words removed) that appear in your resume. Structure is the 6-point checklist below — each check has equal weight.'
                      : `Without a job description the score is the 6-point structure checklist below — each check has equal weight (${ats.checks.filter((c) => c.pass).length} of ${ats.checks.length} passing). Paste a job description above to add the stricter keyword-coverage half.`}
                  </p>
                  <p>
                    It’s a transparent rule-based check that runs in your browser — it mirrors
                    what resume parsers and recruiters scan for, but it can’t predict a hiring
                    decision.
                    {ats.score === 100 &&
                      ' A 100 means every rule passes, not that an interview is guaranteed.'}
                  </p>
                </div>
              </details>
              {resume.jobDescription.trim() ? (
                <div className="mt-3 space-y-2 text-xs">
                  {ats.matched.length > 0 && (
                    <div>
                      <span className="font-medium text-green-700">
                        Matched ({ats.matched.length})
                      </span>
                      <span className="mt-1 flex flex-wrap gap-1">
                        {ats.matched.map((kw) => (
                          <span
                            key={kw}
                            className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-green-800"
                          >
                            <span aria-hidden className="text-green-600">✓</span> {kw}
                          </span>
                        ))}
                      </span>
                    </div>
                  )}
                  {ats.missing.length > 0 && (
                    <div>
                      <span className="font-medium text-red-700">
                        Missing ({ats.missing.length})
                      </span>{' '}
                      <span className="text-muted-foreground">
                        — for keywords you genuinely have, add to Skills or let AI draft a bullet:
                      </span>
                      <span className="mt-1 flex flex-wrap gap-1">
                        {ats.missing.map((kw) => (
                          <span
                            key={kw}
                            className="bg-muted inline-flex items-center overflow-hidden rounded-full border"
                          >
                            <button
                              type="button"
                              className="hover:bg-primary/10 px-2 py-0.5"
                              title="Add to Skills"
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
                            <button
                              type="button"
                              className="hover:bg-primary/10 border-l px-1.5 py-0.5"
                              title={`Draft an experience bullet using "${kw}"`}
                              aria-label={`Draft a bullet using ${kw}`}
                              onClick={() => setKwBulletFor(kw)}
                            >
                              <Sparkles aria-hidden className="size-3" />
                            </button>
                          </span>
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

          <div className="rounded-lg border bg-slate-100/90 p-3 sm:p-6 dark:bg-slate-900/40">
            <div className="shadow-lg">
              <ResumePreview resume={resume} paginated />
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <Button
              variant="outline"
              className="min-h-10 sm:min-h-9"
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
              className="min-h-10 sm:min-h-9"
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
            <Button
              variant="outline"
              className="min-h-10 sm:min-h-9"
              onClick={() =>
                hasBundlePlan || freeMode
                  ? setToolOpen('resignation')
                  : requireUnlock(
                      'The resignation letter writer is part of the Career Bundle ($19.99, one-time).'
                    )
              }
            >
              <FileText /> Resignation letter{' '}
              {!hasBundlePlan && !freeMode && <Lock className="size-3 opacity-60" />}
            </Button>
          </div>
        </div>
      </main>

      {/* Persistent mobile pane switcher — both panes show side-by-side on lg+ */}
      <div
        role="group"
        aria-label="Switch between editing and preview"
        className="bg-background/95 fixed inset-x-0 bottom-0 z-30 flex justify-center gap-1 border-t p-2 shadow-[0_-2px_8px_rgba(0,0,0,0.06)] backdrop-blur lg:hidden"
      >
        {(
          [
            { pane: 'edit', label: 'Edit', icon: <FileText className="size-4" /> },
            { pane: 'preview', label: 'Preview & score', icon: <LayoutTemplate className="size-4" /> },
          ] as const
        ).map(({ pane, label, icon }) => (
          <button
            key={pane}
            type="button"
            aria-pressed={mobilePane === pane}
            className={`flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-md text-sm font-medium transition ${
              mobilePane === pane
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted'
            }`}
            onClick={() => {
              setMobilePane(pane)
              window.scrollTo({ top: 0 })
            }}
          >
            {icon} {label}
            {pane === 'preview' && (
              <span
                aria-label={`ATS match score ${ats.score} out of 100`}
                className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums ${
                  ats.score >= 80
                    ? 'bg-emerald-100 text-emerald-700'
                    : ats.score >= 50
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-red-100 text-red-700'
                }`}
              >
                {ats.score}
              </span>
            )}
          </button>
        ))}
      </div>

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
        initialCompany={toolCompany}
        onClose={() => setToolOpen(null)}
        resume={resume}
        onQuota={setFreeLeft}
      />
      {tailorOpen && (
        <TailorDialog
          resume={resume}
          onClose={() => setTailorOpen(false)}
          onQuota={setFreeLeft}
          onApply={applyTailorSuggestion}
        />
      )}
      <HealthDialog
        open={healthOpen}
        onClose={() => setHealthOpen(false)}
        health={health}
        ats={ats}
      />
      {historyOpen && (
        <HistoryDialog
          resume={resume}
          onClose={() => setHistoryOpen(false)}
          onRestore={(snap) => {
            recordResumeSnapshot(resume, true)
            setResume({ ...emptyResume(), ...snap.data })
            setHistoryOpen(false)
          }}
        />
      )}
      <AssistantPanel
        open={assistantOpen}
        onClose={() => setAssistantOpen(false)}
        resume={resume}
        jobDescription={resume.jobDescription}
        onQuota={setFreeLeft}
        onPaymentRequired={(msg) => {
          if (!freeMode) requireUnlock(msg)
        }}
        onApply={(action) => {
          if (action.type === 'summary') {
            setResume((r) => ({ ...r, summary: action.value }))
            return
          }
          setResume((r) => {
            const existing = r.skills
              .split(/[,\n]/)
              .map((s) => s.trim())
              .filter(Boolean)
            const have = new Set(existing.map((s) => s.toLowerCase()))
            const added = action.value.filter((s) => !have.has(s.trim().toLowerCase()))
            return { ...r, skills: [...existing, ...added].join(', ') }
          })
        }}
      />
      {kwBulletFor !== null && (
        <KeywordBulletDialog
          keyword={kwBulletFor}
          resume={resume}
          onClose={() => setKwBulletFor(null)}
          onQuota={setFreeLeft}
          onInsert={insertKeywordBullet}
        />
      )}
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
      <Dialog open={versionsOpen} onOpenChange={setVersionsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Resume copies</DialogTitle>
            <DialogDescription>
              Keep one copy per job you're applying to — tailor keywords without
              losing your master version. Copies live in this browser only. Manage
              them visually on <Link to="/dashboard" className="underline">My resumes</Link>.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Input
              value={versionName}
              onChange={(e) => setVersionName(e.target.value)}
              placeholder="Name this copy, e.g. Google — SWE II"
              aria-label="Copy name"
            />
            <Button
              type="button"
              size="sm"
              className="shrink-0"
              onClick={() => {
                setVersions(
                  saveResumeVersion(versionName.trim() || 'Untitled copy', resume)
                )
                setVersionName('')
              }}
            >
              Save current as copy
            </Button>
          </div>
          {versions.length === 0 ? (
            <p className="text-muted-foreground text-sm">No saved copies yet.</p>
          ) : (
            <ul className="max-h-64 space-y-2 overflow-y-auto">
              {versions.map((v) => (
                <li
                  key={v.id}
                  className="flex items-center justify-between gap-2 rounded-md border p-2 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{v.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {new Date(v.updatedAt).toLocaleString()} · ATS{' '}
                      {scoreResume(v.data, v.data.jobDescription).score}/100
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-10 text-xs sm:h-7"
                      onClick={() => {
                        setResume({ ...emptyResume(), ...v.data })
                        setVersionsOpen(false)
                      }}
                    >
                      Load
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive h-10 text-xs sm:h-7"
                      onClick={() => setVersions(deleteResumeVersion(v.id))}
                    >
                      Delete
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <p className="text-muted-foreground text-xs">
            Loading a copy replaces what's in the editor — save the current
            resume as a copy first if you want to keep it.
          </p>
        </DialogContent>
      </Dialog>
      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Resume downloaded — good luck out there</DialogTitle>
            <DialogDescription>
              If RezUp helped, pass the free ATS checker to a friend who's job
              hunting. No signup, no subscription trap — just a match score.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                void navigator.clipboard
                  .writeText('https://cv.zalize.com/ats-checker')
                  .then(() => setShareCopied(true))
              }}
            >
              {shareCopied ? 'Copied!' : 'Copy checker link'}
            </Button>
            <Button type="button" variant="outline" size="sm" asChild>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent('Free ATS resume checker — no signup, runs in your browser: https://cv.zalize.com/ats-checker')}`}
                target="_blank"
                rel="noreferrer"
              >
                Share on X
              </a>
            </Button>
            <Button type="button" variant="outline" size="sm" asChild>
              <a
                href="https://www.linkedin.com/sharing/share-offsite/?url=https%3A%2F%2Fcv.zalize.com%2Fats-checker"
                target="_blank"
                rel="noreferrer"
              >
                Share on LinkedIn
              </a>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog
        open={importOpen}
        onOpenChange={setImportOpen}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import your existing resume</DialogTitle>
            <DialogDescription>
              Upload a PDF, DOCX or TXT file — including the PDF LinkedIn saves
              from your profile (More → Save to PDF) — or paste the text below.
              We'll pre-fill the sections, entirely in your browser; nothing is
              uploaded to a server. Review the result; imports are a starting
              point, not perfect.
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
          {zaEmail && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground text-xs">
                Signed in to Zalize as {zaEmail}:
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={zaBusy}
                onClick={() => {
                  setZaBusy(true)
                  setImportError('')
                  fetchZalizePrimary()
                    .then((rp) => {
                      setResume(resumeFromProfile(rp))
                      setImportOpen(false)
                    })
                    .catch((err: unknown) =>
                      setImportError(err instanceof Error ? err.message : 'Import failed.')
                    )
                    .finally(() => setZaBusy(false))
                }}
              >
                {zaBusy ? 'Importing…' : 'Import my primary resume'}
              </Button>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground text-xs">or pull from Resume Center:</span>
            <input
              className="border-input bg-background h-8 min-w-0 flex-1 rounded-md border px-2 text-xs"
              placeholder="Share link or share ID"
              value={rcInput}
              onChange={(e) => setRcInput(e.target.value)}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={rcBusy || !rcInput.trim()}
              onClick={() => {
                const shareId = parseShareId(rcInput)
                if (!shareId) {
                  setImportError('Paste a Resume Center share link or share ID.')
                  return
                }
                setRcBusy(true)
                setImportError('')
                fetchResumeProfile(shareId)
                  .then((rp) => {
                    setResume(resumeFromProfile(rp))
                    setImportOpen(false)
                    setRcInput('')
                  })
                  .catch((err: unknown) =>
                    setImportError(err instanceof Error ? err.message : 'Import failed.')
                  )
                  .finally(() => setRcBusy(false))
              }}
            >
              {rcBusy ? 'Importing…' : 'Import'}
            </Button>
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
          <li className="pt-1">
            <div className="text-muted-foreground text-[11px] font-medium">
              Or start a bullet with a strong action verb:
            </div>
            <div className="mt-1 space-y-1">
              {ACTION_VERBS.map((g) => (
                <div key={g.group} className="flex flex-wrap items-center gap-1">
                  <span className="text-muted-foreground w-28 shrink-0 text-[10px] uppercase tracking-wide">
                    {g.group}
                  </span>
                  {g.verbs.map((v) => (
                    <button
                      key={v}
                      type="button"
                      className="bg-muted/60 hover:bg-muted rounded border px-1.5 py-0.5 text-[11px]"
                      title={`Start a bullet with “${v}”`}
                      onClick={() => onAdd(`${v} `)}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </li>
        </ul>
      )}
    </div>
  )
}

function BulletGuidance({
  bullets,
  onFix,
  busyLine,
}: {
  bullets: string[]
  onFix?: (index: number) => void
  busyLine?: number | null
}) {
  const results = useMemo(() => checkBullets(bullets), [bullets])
  if (results.length === 0) return null
  return (
    <ul className="space-y-0.5 text-xs">
      {results.slice(0, 4).map((r) => (
        <li key={r.index} className="text-amber-700">
          {r.issues.slice(0, 2).map((issue) => (
            <span key={issue.kind} className="block">
              ⚠ Line {r.index + 1}: {issue.message}
            </span>
          ))}
          {onFix && (
            <button
              type="button"
              className="text-primary mt-0.5 inline-flex min-h-10 items-center gap-1 underline underline-offset-2 disabled:opacity-50 sm:min-h-0"
              disabled={busyLine !== null && busyLine !== undefined}
              onClick={() => onFix(r.index)}
              title={`AI rewrites line ${r.index + 1} — you pick from the suggestions`}
            >
              <Sparkles aria-hidden className="size-3" />
              {busyLine === r.index ? 'Fixing…' : `Fix line ${r.index + 1} with AI`}
            </button>
          )}
        </li>
      ))}
    </ul>
  )
}

function BundleToolDialog({
  kind,
  initialCompany = '',
  onClose,
  resume,
  onQuota,
}: {
  kind: 'cover' | 'interview' | 'resignation' | null
  initialCompany?: string
  onClose: () => void
  resume: Resume
  onQuota: (remaining: number) => void
}) {
  const [company, setCompany] = useState(initialCompany)
  const [currentRole, setCurrentRole] = useState('')
  const [lastDay, setLastDay] = useState('')
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState('')
  const [savedId, setSavedId] = useState<string | null>(null)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState('')
  const [feedbackBusy, setFeedbackBusy] = useState(false)
  const [feedbackError, setFeedbackError] = useState('')
  const [suggested, setSuggested] = useState<string[]>([])
  const [suggestBusy, setSuggestBusy] = useState(false)
  const [lastKind, setLastKind] = useState(kind)

  if (kind !== lastKind) {
    setLastKind(kind)
    if (kind !== null && initialCompany) setCompany(initialCompany)
    setResult('')
    setError('')
    setSavedId(null)
    setFeedback('')
    setFeedbackError('')
    setFeedbackBusy(false)
    setSuggested([])
    setSuggestBusy(false)
  }

  const suggestQuestions = async () => {
    if (!resume.jobDescription.trim()) {
      setFeedbackError('Paste the job description in "Target job" first — questions tailor to it.')
      return
    }
    setSuggestBusy(true)
    setFeedbackError('')
    try {
      const { questions, freeRemaining } = await aiInterviewQuestions({
        resumeText: resumeToPlainText(resume),
        jobDescription: resume.jobDescription,
        role: resume.targetRole,
      })
      setSuggested(questions)
      if (freeRemaining !== null) onQuota(freeRemaining)
    } catch (e) {
      setFeedbackError((e as Error).message)
    } finally {
      setSuggestBusy(false)
    }
  }

  const getFeedback = async () => {
    if (!question.trim()) {
      setFeedbackError('Type the interview question first.')
      return
    }
    if (answer.trim().length < 20) {
      setFeedbackError('Write your answer first — a couple of sentences at least.')
      return
    }
    setFeedbackBusy(true)
    setFeedbackError('')
    try {
      const { text, freeRemaining } = await aiInterviewFeedback({
        question,
        answer,
        resumeText: resumeToPlainText(resume),
        jobDescription: resume.jobDescription,
        role: resume.targetRole,
      })
      setFeedback(text)
      if (freeRemaining !== null) onQuota(freeRemaining)
    } catch (e) {
      setFeedbackError((e as Error).message)
    } finally {
      setFeedbackBusy(false)
    }
  }

  const generate = async () => {
    setBusy(true)
    setError('')
    try {
      if (kind === 'resignation') {
        if (!company.trim() || !currentRole.trim()) {
          setError('Fill in your company and current role first.')
          return
        }
        const { text, freeRemaining } = await aiResignationLetter({
          company,
          role: currentRole,
          lastDay,
          reason,
          name: resume.contact.fullName,
        })
        setResult(text)
        setSavedId(null)
        if (freeRemaining !== null) onQuota(freeRemaining)
        return
      }
      const resumeText = resumeToPlainText(resume)
      const jd = resume.jobDescription
      if (!jd.trim()) {
        setError('Paste the job description in "Target job" first — both tools tailor to it.')
        return
      }
      const { text, freeRemaining } =
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
      setSavedId(null)
      if (freeRemaining !== null) onQuota(freeRemaining)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const insertTemplate = () => {
    if (kind === 'resignation') {
      const name = resume.contact.fullName || '[Your name]'
      const co = company || '[Company]'
      const role = currentRole || '[your role]'
      const day = lastDay || '[last working day — typically two weeks from today]'
      setResult(
        `Dear [Manager name],\n\nPlease accept this letter as formal notice of my resignation from my position as ${role} at ${co}. My last working day will be ${day}.\n\nI'm grateful for the opportunities I've had here — [one specific thing you genuinely appreciated: a project, a skill you grew, the team]. Thank you for your support during my time with the company.\n\nI'm committed to a smooth handover: I'll document my ongoing work and am happy to help train a replacement before I leave.\n\nSincerely,\n${name}`
      )
      setError('')
      return
    }
    if (kind === 'interview') {
      const role = resume.targetRole || '[role]'
      setResult(
        `Interview prep — ${role}\n\n1. Your story (2 minutes)\n- Why you: [the one-line version of your background that fits this role]\n- Why this company: [a product, mission or recent news you genuinely care about]\n- Why now: [what you want next that this role offers]\n\n2. Evidence to have ready\n- [Your strongest achievement relevant to the posting — with the real number]\n- [A hard problem you solved — situation, action, result]\n- [A failure or conflict and what you changed afterwards]\n\n3. Keywords from the posting to work into answers\n- [Copy the top 5 requirements from the job description here]\n\n4. Questions to ask them\n- What does success in this role look like after 6 months?\n- What's the hardest problem the team is working on right now?\n- [A question specific to this company you couldn't ask anywhere else]\n\n5. Logistics\n- [Interviewer names + roles] / [format and length] / [what to bring or prepare]`
      )
      setError('')
      return
    }
    const name = resume.contact.fullName || '[Your name]'
    const role = resume.targetRole || '[role]'
    const co = company || '[Company]'
    setResult(
      `Dear Hiring Manager,\n\nI'm writing to apply for the ${role} position at ${co}. [One sentence on why this company or team specifically — a product, a mission, a recent launch.]\n\nIn my current role at [current company], I [your strongest, most relevant achievement — with a real number if you have one]. Before that, I [second relevant achievement or responsibility]. These map directly to what you're looking for: [requirement from the job description you meet best].\n\nI'd welcome the chance to talk about how I can help ${co} [team goal from the posting]. Thank you for your consideration.\n\nSincerely,\n${name}`
    )
    setError('')
  }

  const title =
    kind === 'cover'
      ? 'Cover Letter'
      : kind === 'resignation'
        ? 'Resignation Letter'
        : 'Interview Prep Brief'
  return (
    <Dialog open={kind !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {kind === 'resignation'
              ? 'A professional, gracious letter — fill in your company and role below.'
              : 'Tailored to your resume and the job description you pasted in "Target job".'}
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
        {kind === 'resignation' && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="res-company">Company you're leaving</Label>
              <Input
                id="res-company"
                placeholder="e.g. Acme Corp"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="res-role">Your current role</Label>
              <Input
                id="res-role"
                placeholder="e.g. Senior Analyst"
                value={currentRole}
                onChange={(e) => setCurrentRole(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="res-last-day">Last working day (optional)</Label>
              <Input
                id="res-last-day"
                placeholder="e.g. March 14"
                value={lastDay}
                onChange={(e) => setLastDay(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="res-reason">Reason — sets the tone (optional)</Label>
              <Input
                id="res-reason"
                placeholder="e.g. new opportunity, relocation"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <Button className="min-h-10 sm:min-h-9" onClick={() => void generate()} disabled={busy}>
            {busy ? <Loader2 className="animate-spin" /> : <Sparkles />}
            {busy ? 'Writing…' : result ? 'Regenerate' : 'Generate'}
          </Button>
          <Button
            className="min-h-10 sm:min-h-9"
            variant="outline"
            onClick={insertTemplate}
            disabled={busy}
          >
            Start from a template
          </Button>
        </div>
        {busy && (
          <p className="text-muted-foreground text-xs" role="status">
            Usually takes 15–40 seconds — the draft appears here for you to edit.
          </p>
        )}
        {error && <p className="text-destructive text-sm">{error}</p>}
        {result && (
          <>
            <Textarea
              rows={14}
              value={result}
              onChange={(e) => setResult(e.target.value)}
              className="font-mono text-xs"
            />
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                className="min-h-10 sm:min-h-8"
                onClick={() =>
                  void import('@/lib/pdf').then((m) =>
                    kind === 'interview'
                      ? m.downloadTextPdf(title, result, 'interview-prep.pdf')
                      : m.downloadLetterPdf(
                          resume,
                          result,
                          kind === 'cover' ? 'cover-letter.pdf' : 'resignation-letter.pdf'
                        )
                  )
                }
              >
                <Download /> PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="min-h-10 sm:min-h-8"
                onClick={() =>
                  void import('@/lib/docx').then((m) =>
                    kind === 'interview'
                      ? m.downloadTextDocx(title, result, 'interview-prep.docx')
                      : m.downloadLetterDocx(
                          resume,
                          result,
                          kind === 'cover' ? 'cover-letter.docx' : 'resignation-letter.docx'
                        )
                  )
                }
              >
                <Download /> DOCX
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="min-h-10 sm:min-h-8"
                title="Keep this document — reopen it anytime from My resumes"
                onClick={() => {
                  const docTitle =
                    kind === 'cover'
                      ? `${company || resume.targetRole || 'Untitled'} — Cover letter`
                      : kind === 'resignation'
                        ? `${company || 'Untitled'} — Resignation letter`
                        : `${resume.targetRole || 'Untitled'} — Interview prep`
                  if (savedId) {
                    updateCareerDoc(savedId, { title: docTitle, text: result })
                  } else {
                    setSavedId(
                      saveCareerDoc(
                        kind === 'cover'
                          ? 'cover'
                          : kind === 'resignation'
                            ? 'resignation'
                            : 'interview',
                        docTitle,
                        result
                      ).id
                    )
                  }
                }}
              >
                {savedId ? (
                  <>
                    <Check /> Saved — update
                  </>
                ) : (
                  <>
                    <Save /> Save to My resumes
                  </>
                )}
              </Button>
            </div>
          </>
        )}
        {kind === 'interview' && (
          <div className="space-y-3 border-t pt-4">
            <div>
              <p className="text-sm font-medium">Practice an answer</p>
              <p className="text-muted-foreground text-xs">
                Type a question and your answer — AI coaches you against your resume and the
                target job.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="practice-question">Interview question</Label>
              {suggested.length > 0 && (
                <ul className="space-y-1">
                  {suggested.map((q) => (
                    <li key={q}>
                      <button
                        type="button"
                        className="bg-muted/50 hover:border-primary/50 w-full rounded-md border px-3 py-2 text-left text-xs"
                        onClick={() => {
                          setQuestion(q)
                          setFeedback('')
                          setFeedbackError('')
                        }}
                      >
                        {q}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <Input
                id="practice-question"
                placeholder="e.g. Tell me about a time you led a difficult project"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                maxLength={300}
                className="min-h-10 sm:min-h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="practice-answer">Your answer</Label>
              <Textarea
                id="practice-answer"
                rows={5}
                placeholder="Answer out loud, then type what you said — honest first drafts get the most useful coaching."
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => void getFeedback()}
                disabled={feedbackBusy || suggestBusy}
                variant="outline"
                className="min-h-10 sm:min-h-9"
              >
                {feedbackBusy ? <Loader2 className="animate-spin" /> : <Sparkles />}
                {feedbackBusy ? 'Coaching…' : 'Get AI feedback'}
              </Button>
              <Button
                onClick={() => void suggestQuestions()}
                disabled={feedbackBusy || suggestBusy}
                variant="outline"
                className="min-h-10 sm:min-h-9"
              >
                {suggestBusy ? <Loader2 className="animate-spin" /> : <Sparkles />}
                {suggestBusy ? 'Thinking…' : 'Suggest questions'}
              </Button>
            </div>
            {feedbackBusy && (
              <p className="text-muted-foreground text-xs" role="status">
                Usually takes 15–40 seconds — feedback appears below.
              </p>
            )}
            {feedbackError && <p className="text-destructive text-sm">{feedbackError}</p>}
            {feedback && (
              <Textarea
                readOnly
                rows={12}
                value={feedback}
                className="font-mono text-xs"
                aria-label="AI feedback on your answer"
              />
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

interface TailorSuggestion {
  id: string
  original: string
  suggestion: string
  where: string
  status: 'pending' | 'accepted' | 'skipped'
}

function tailorItemsFrom(resume: Resume): { items: TailorItemInput[]; where: Map<string, string> } {
  const items: TailorItemInput[] = []
  const where = new Map<string, string>()
  if (resume.summary.trim()) {
    items.push({ id: 'summary', kind: 'summary', text: resume.summary.trim() })
    where.set('summary', 'Summary')
  }
  for (const e of resume.experience) {
    e.bullets.forEach((b, i) => {
      if (!b.trim()) return
      const id = `${e.id}:${i}`
      items.push({ id, kind: 'bullet', text: b.trim() })
      where.set(id, [e.role, e.company].filter(Boolean).join(' at ') || 'Experience')
    })
  }
  return { items, where }
}

/** JD tailoring pass: per-item AI suggestions with review-before-apply. */
function TailorDialog({
  resume,
  onClose,
  onQuota,
  onApply,
}: {
  resume: Resume
  onClose: () => void
  onQuota: (remaining: number) => void
  onApply: (id: string, text: string) => void
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [rows, setRows] = useState<TailorSuggestion[] | null>(null)

  const run = async () => {
    setBusy(true)
    setError('')
    try {
      const { items, where } = tailorItemsFrom(resume)
      if (items.length === 0) {
        setError('Add a summary or experience bullets first — tailoring rewords your real content.')
        return
      }
      const { suggestions, freeRemaining } = await aiTailor({
        items,
        jobDescription: resume.jobDescription,
        role: resume.targetRole,
      })
      if (freeRemaining !== null) onQuota(freeRemaining)
      const byId = new Map(items.map((i) => [i.id, i.text]))
      setRows(
        suggestions
          .filter((s) => s.text.trim() && s.text.trim() !== byId.get(s.id))
          .map((s) => ({
            id: s.id,
            original: byId.get(s.id) ?? '',
            suggestion: s.text.trim(),
            where: where.get(s.id) ?? '',
            status: 'pending' as const,
          }))
      )
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const decide = (id: string, status: 'accepted' | 'skipped') => {
    setRows((rs) => rs?.map((r) => (r.id === id ? { ...r, status } : r)) ?? null)
    if (status === 'accepted') {
      const row = rows?.find((r) => r.id === id)
      if (row) onApply(row.id, row.suggestion)
    }
  }

  const pending = rows?.filter((r) => r.status === 'pending') ?? []
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tailor to this job</DialogTitle>
          <DialogDescription>
            The AI rewords your summary and bullets toward the pasted job description — it mirrors
            the JD's keywords only where your text already supports them, and never invents
            experience. Review each change: nothing is applied until you accept it.
          </DialogDescription>
        </DialogHeader>
        {rows === null && (
          <>
            <Button onClick={() => void run()} disabled={busy}>
              {busy ? <Loader2 className="animate-spin" /> : <Sparkles />}
              {busy ? 'Analyzing your resume against the JD…' : 'Get tailoring suggestions'}
            </Button>
            {busy && (
              <p className="text-muted-foreground text-xs" role="status">
                Usually takes 15–40 seconds — every line comes back for your review before
                anything changes.
              </p>
            )}
          </>
        )}
        {error && <p className="text-destructive text-sm">{error}</p>}
        {rows !== null && rows.length === 0 && (
          <p className="text-sm">
            No changes suggested — your summary and bullets already read well against this job
            description.
          </p>
        )}
        {rows !== null && rows.length > 0 && (
          <>
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="text-muted-foreground">
                {rows.filter((r) => r.status === 'accepted').length} accepted ·{' '}
                {pending.length} to review
              </span>
              {pending.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-10 text-xs sm:h-7"
                  onClick={() => pending.forEach((r) => decide(r.id, 'accepted'))}
                >
                  Accept all remaining
                </Button>
              )}
            </div>
            <div className="space-y-3">
              {rows.map((r) => (
                <div key={r.id} className="space-y-2 rounded-lg border p-3 text-sm">
                  <p className="text-muted-foreground text-xs font-medium">{r.where}</p>
                  <p className="text-muted-foreground line-through decoration-red-300">
                    {r.original}
                  </p>
                  <p className="font-medium text-emerald-800">{r.suggestion}</p>
                  {r.status === 'pending' ? (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="h-10 text-xs sm:h-7"
                        onClick={() => decide(r.id, 'accepted')}
                      >
                        <Check className="size-3" /> Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-10 text-xs sm:h-7"
                        onClick={() => decide(r.id, 'skipped')}
                      >
                        Keep original
                      </Button>
                    </div>
                  ) : (
                    <p
                      className={`text-xs font-medium ${
                        r.status === 'accepted' ? 'text-emerald-700' : 'text-muted-foreground'
                      }`}
                    >
                      {r.status === 'accepted' ? 'Applied to your resume' : 'Kept your original'}
                    </p>
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={onClose}>
                Done
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

/** Rule-based multi-dimension score breakdown — no AI calls, computed locally. */
function HealthDialog({
  open,
  onClose,
  health,
  ats,
}: {
  open: boolean
  onClose: () => void
  health: HealthReport
  ats: AtsResult
}) {
  const atsDimensions: HealthDimension[] = [
    ...(ats.keywordScore !== null
      ? [
          {
            id: 'keywords',
            label: 'Keyword match',
            score: ats.keywordScore,
            summary: `${ats.matched.length} of ${ats.matched.length + ats.missing.length} job-posting keywords found in your resume`,
            plain:
              'ATS software and recruiters search for the job posting\u2019s exact terms \u2014 missing ones can filter you out before a human reads a word.',
            findings: ats.missing.slice(0, 6).map((k) => `Missing keyword: "${k}"`),
          },
        ]
      : []),
    {
      id: 'ats-structure',
      label: 'ATS structure',
      score: ats.structureScore,
      summary: `${ats.checks.filter((c) => c.pass).length} of ${ats.checks.length} structure checks passing`,
      plain:
        'Standard sections and complete contact details are what resume parsers latch onto first.',
      findings: ats.checks.filter((c) => !c.pass).map((c) => `${c.label} \u2014 ${c.hint}`),
    },
  ]
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Score breakdown — ATS {ats.score}/100 · Writing {health.score}/100
          </DialogTitle>
          <DialogDescription>
            Every check is rule-based and computed in your browser — a transparent heuristic, not
            a hiring prediction. Nothing leaves your device.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {[...atsDimensions, ...health.dimensions].map((d) => (
            <div key={d.id} className="rounded-lg border p-3">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="font-medium">{d.label}</span>
                <span
                  className={`tnum text-xs font-semibold ${
                    d.score >= 80
                      ? 'text-emerald-600'
                      : d.score >= 50
                        ? 'text-amber-600'
                        : 'text-red-600'
                  }`}
                >
                  {d.score}
                </span>
              </div>
              <div
                className="bg-muted mt-1.5 h-1.5 w-full overflow-hidden rounded-full"
                role="progressbar"
                aria-label={d.label}
                aria-valuenow={d.score}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className={`h-full rounded-full ${
                    d.score >= 80
                      ? 'bg-emerald-500'
                      : d.score >= 50
                        ? 'bg-amber-500'
                        : 'bg-red-400'
                  }`}
                  style={{ width: `${d.score}%` }}
                />
              </div>
              <p className="text-muted-foreground mt-1.5 text-xs">{d.summary}</p>
              <p className="text-muted-foreground/80 mt-1 text-xs italic">{d.plain}</p>
              {d.findings.length > 0 && (
                <ul className="text-muted-foreground mt-1.5 list-disc space-y-0.5 pl-4 text-xs">
                  {d.findings.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

const snapshotAgo = (ms: number) => {
  const mins = Math.floor((Date.now() - ms) / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return mins === 1 ? '1 minute ago' : `${mins} minutes ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return hours === 1 ? '1 hour ago' : `${hours} hours ago`
  const days = Math.floor(hours / 24)
  return days === 1 ? '1 day ago' : `${days} days ago`
}

/** Automatic checkpoints of the draft — restore rolls the builder back;
 * the pre-restore draft is checkpointed first so restores are reversible. */
function HistoryDialog({
  resume,
  onClose,
  onRestore,
}: {
  resume: Resume
  onClose: () => void
  onRestore: (snap: ResumeSnapshot) => void
}) {
  const [snapshots] = useState<ResumeSnapshot[]>(() => listResumeHistory())
  const currentJson = useMemo(() => JSON.stringify(resume), [resume])
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit history</DialogTitle>
          <DialogDescription>
            The builder keeps a checkpoint of your draft about every 10 minutes while
            you edit. Restoring saves a checkpoint of the current draft first.
          </DialogDescription>
        </DialogHeader>
        {snapshots.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No checkpoints yet — keep editing and one is saved automatically about
            every 10 minutes.
          </p>
        ) : (
          <ul className="space-y-2">
            {snapshots.map((s) => {
              const isCurrent = JSON.stringify(s.data) === currentJson
              return (
                <li
                  key={s.id}
                  className="flex min-h-10 items-center justify-between gap-3 rounded-md border px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{snapshotAgo(s.at)}</p>
                    <p className="text-muted-foreground truncate text-xs">
                      {[s.data.contact.fullName || 'Untitled', s.data.targetRole]
                        .filter(Boolean)
                        .join(' — ')}
                    </p>
                  </div>
                  {isCurrent ? (
                    <span className="text-muted-foreground shrink-0 text-xs">Current</span>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="min-h-10 shrink-0 sm:min-h-8"
                      onClick={() => onRestore(s)}
                    >
                      <History className="size-3.5" /> Restore
                    </Button>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  )
}

/** AI-drafts one bullet that works a missing JD keyword into an experience,
 * grounded in the resume's real content — review before it's inserted. */
function KeywordBulletDialog({
  keyword,
  resume,
  onClose,
  onQuota,
  onInsert,
}: {
  keyword: string
  resume: Resume
  onClose: () => void
  onQuota: (remaining: number) => void
  onInsert: (expId: string, text: string) => void
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [text, setText] = useState<string | null>(null)
  const [expId, setExpId] = useState(resume.experience[0]?.id ?? '')
  const [inserted, setInserted] = useState(false)

  const run = async () => {
    setBusy(true)
    setError('')
    try {
      const { text: drafted, freeRemaining } = await aiKeywordBullet({
        keyword,
        resumeText: resumeToPlainText(resume),
        jobDescription: resume.jobDescription,
        role: resume.targetRole,
      })
      if (freeRemaining !== null) onQuota(freeRemaining)
      setText(drafted)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Draft a bullet for “{keyword}”</DialogTitle>
          <DialogDescription>
            The AI drafts one bullet that works this keyword in, grounded in your existing resume —
            unknowns become [bracketed placeholders] for you to fill in. Only use it if the
            experience is genuinely yours.
          </DialogDescription>
        </DialogHeader>
        {resume.experience.length === 0 ? (
          <p className="text-sm">Add an experience entry first — the bullet needs a role to live under.</p>
        ) : text === null ? (
          <Button onClick={() => void run()} disabled={busy}>
            {busy ? <Loader2 className="animate-spin" /> : <Sparkles />}
            {busy ? 'Drafting…' : 'Draft the bullet'}
          </Button>
        ) : (
          <div className="space-y-3">
            <Textarea
              rows={3}
              value={text}
              onChange={(e) => setText(e.target.value)}
              aria-label="Drafted bullet"
            />
            <div className="space-y-1.5">
              <Label htmlFor="kwBulletExp">Add to</Label>
              <select
                id="kwBulletExp"
                className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
                value={expId}
                onChange={(e) => setExpId(e.target.value)}
              >
                {resume.experience.map((e) => (
                  <option key={e.id} value={e.id}>
                    {[e.role, e.company].filter(Boolean).join(' at ') || 'Experience'}
                  </option>
                ))}
              </select>
            </div>
            {inserted ? (
              <p className="text-sm font-medium text-emerald-700">Added to your resume.</p>
            ) : (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  disabled={!text.trim() || !expId}
                  onClick={() => {
                    onInsert(expId, text.trim())
                    setInserted(true)
                  }}
                >
                  <Check className="size-3" /> Add bullet
                </Button>
                <Button size="sm" variant="outline" onClick={onClose}>
                  Discard
                </Button>
              </div>
            )}
          </div>
        )}
        {error && <p className="text-destructive text-sm">{error}</p>}
      </DialogContent>
    </Dialog>
  )
}
