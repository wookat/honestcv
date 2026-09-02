import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowDown,
  Award,
  BookOpen,
  BookText,
  Contact,
  ArrowUp,
  Briefcase,
  Check,
  ChevronDown,
  ChevronUp,
  Bookmark,
  BookmarkPlus,
  ImagePlus,
  ClipboardPaste,
  Download,
  Eye,
  EyeOff,
  FileText,
  Copy,
  FileUp,
  GraduationCap,
  GripVertical,
  HeartPulse,
  History,
  LayoutGrid,
  LayoutTemplate,
  Save,
  Share2,
  Lightbulb,
  Shield,
  Bot,
  ListChecks,
  ListOrdered,
  Loader2,
  Lock,
  MessagesSquare,
  Plus,
  Pencil,
  Sparkles,
  Star,
  Target,
  Timer,
  Trash2,
  Undo2,
  Redo2,
  Unlock,
  Users,
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
import { MonthYearField } from '@/components/MonthYearField'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { LintedTextarea } from '@/components/LintedTextarea'
import { markShortcutKeyDown } from '@/lib/markShortcuts'
import { SiteFooter, SiteHeader, usePageMeta } from '@/components/Layout'
import {
  FreeDownloadDialog,
  UpgradeDialog,
  hasSubscribed,
  useFreeMode,
  useLicense,
} from '@/components/Paywall'
import { AssistantPanel } from '@/components/AssistantPanel'
import { PhotoCropDialog, type PhotoDraft } from '@/components/PhotoCropDialog'
import { DraftIllustration } from '@/components/Illustrations'
import { ResumePreview } from '@/components/ResumePreview'
import {
  applyKeywordHighlight,
  clearKeywordHighlight,
  supportsKeywordHighlight,
} from '@/lib/keywordHighlight'
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
  aiSuggestBullet,
  aiSummaryDraft,
  aiTailor,
  fetchAiQuota,
} from '@/lib/api'
import {
  type AtsResult,
  type SectionAnchor,
  CHECK_CATEGORIES,
  applicationReadiness,
  atsScoreSummary,
  bestExperienceForKeyword,
  highPriorityKeywords,
  matchReport,
  scoreResume,
} from '@/lib/ats'
import {
  RESPONSE_WINDOW_SECONDS,
  analyzeAnswer,
  analyzeDelivery,
  analyzeFillerSounds,
  analyzeQuickFillers,
  analyzeTone,
  localInterviewQuestions,
  sessionReport,
} from '@/lib/interviewAnalysis'
import {
  ACTION_VERBS,
  type BulletIssue,
  type HealthDimension,
  type HealthFinding,
  type HealthReport,
  bulletMix,
  checkBullets,
  diffNewWords,
  priorityFixes,
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

import { downloadText, professionalFileName } from '@/lib/download'
import { saveCareerDoc, updateCareerDoc } from '@/lib/documents'
import { trackEvent } from '@/lib/track'
import {
  type ShareLink,
  SHARE_SLUG_RE,
  createShareLink,
  loadShareLink,
  revokeShareLink,
} from '@/lib/share'

import {
  type ExperienceItem,
  type Resume,
  type ResumeVersion,
  aiTargetRole,
  deleteResumeVersion,
  EXPERIENCE_LEVELS,
  EXPERIENCE_LEVEL_LABELS,
  recommendedSectionOrder,
  sectionEmphasisFor,
  duplicateResumeVersion,
  emptyAward,
  emptyCertification,
  emptyPublication,
  emptyReference,
  type ReferenceKind,
  emptyMilitaryService,
  emptyAgent,
  emptyCustomSection,
  emptyEducation,
  emptyExperience,
  emptyCoursework,
  emptyInvolvement,
  emptyProject,
  emptyResume,
  exampleToResume,
  FONT_SCALE,
  LINE_SPACING,
  SECTION_SPACING,
  loadResume,
  newId,
  orderedSectionKeys,
  listResumeVersions,
  listResumeHistory,
  getActiveVersionId,
  setActiveVersionId,
  syncActiveVersion,
  listExperienceLibrary,
  saveExperienceToLibrary,
  deleteLibraryExperience,
  type SavedExperience,
  listEducationLibrary,
  saveEducationToLibrary,
  deleteLibraryEducation,
  type SavedEducation,
  listProjectLibrary,
  saveProjectToLibrary,
  deleteLibraryProject,
  type SavedProject,
  listInvolvementLibrary,
  saveInvolvementToLibrary,
  deleteLibraryInvolvement,
  type SavedInvolvement,
  listCourseworkLibrary,
  saveCourseworkToLibrary,
  deleteLibraryCoursework,
  type SavedCoursework,
  listAwardLibrary,
  saveAwardToLibrary,
  deleteLibraryAward,
  type SavedAward,
  listReferenceLibrary,
  saveReferenceToLibrary,
  deleteLibraryReference,
  type SavedReference,
  listPublicationLibrary,
  savePublicationToLibrary,
  deleteLibraryPublication,
  type SavedPublication,
  listCertLibrary,
  saveCertToLibrary,
  deleteLibraryCert,
  type SavedCertification,
  listSkillsLibrary,
  saveSkillsToLibrary,
  deleteLibrarySkills,
  type SavedSkills,
  listSummaryLibrary,
  saveSummaryToLibrary,
  deleteLibrarySummary,
  type SavedSummary,
  recordResumeSnapshot,
  type ResumeSnapshot,
  resumeToPlainText,
  resumeToMarkdown,
  sampleResume,
  saveResume,
  type ExamplePerson,
  saveResumeVersion,
  updateResumeVersion,
  sectionLabel,
  HIDEABLE_CONTACT_FIELDS,
  type HideableContactField,
  type AutoSortSection,
  skillLines,
  categorizeSkills,
  sortEntriesByDate,
  TEXT_INKS,
  visibleResume,
  RESUME_LANGUAGES,
  type ResumeLanguage,
  resumeLanguageOf,
} from '@/lib/resume'
import { TemplateThumb } from '@/components/TemplateThumb'
import {
  bulletStartersFor,
  provenSkills,
  skillBulletStarters,
  skillSuggestionsFor,
} from '@/lib/bulletStarters'
import {
  ACCENT_CHOICES,
  TEMPLATES,
  TEMPLATE_FILTERS,
  getTemplate,
  recommendedTemplates,
} from '@/lib/templates'
import {
  loadTemplateFavorites,
  loadTemplateRecents,
  recordTemplateRecent,
  toggleTemplateFavorite,
} from '@/lib/templatePrefs'

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
      syncActiveVersion(resume)
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
        syncActiveVersion(pending.current)
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

/** Debounced fractional length of the exported PDF, shown next to the preview. */
function usePdfLength(resume: Resume): import('@/lib/pdf').ResumeLength | null {
  const [len, setLen] = useState<import('@/lib/pdf').ResumeLength | null>(null)
  const seq = useRef(0)
  useEffect(() => {
    const id = ++seq.current
    const t = window.setTimeout(() => {
      void import('@/lib/pdf')
        .then((m) => m.measureResumePdf(resume))
        .then((n) => {
          if (seq.current === id) setLen(n)
        })
        .catch(() => undefined)
    }, 800)
    return () => window.clearTimeout(t)
  }, [resume])
  return len
}

const FIT_COMBOS: Array<
  [NonNullable<Resume['fontScale']>, NonNullable<Resume['lineSpacing']>]
> = [
  ['xl', 'relaxed'],
  ['l', 'relaxed'],
  ['xl', 'normal'],
  ['m', 'relaxed'],
  ['l', 'normal'],
  ['xl', 'compact'],
  ['s', 'relaxed'],
  ['m', 'normal'],
  ['l', 'compact'],
  ['xs', 'relaxed'],
  ['s', 'normal'],
  ['m', 'compact'],
  ['xs', 'normal'],
  ['s', 'compact'],
  ['xs', 'compact'],
]

/** Combos from this index on are retried at tighter section spacing when nothing fits one page. */
const TIGHT_COMBO_START = 7

const SCALE_NAME = {
  xs: 'extra small',
  s: 'small',
  m: 'medium',
  l: 'large',
  xl: 'extra large',
} as const

const SCALE_STEPS = ['xs', 's', 'm', 'l', 'xl'] as const

const SPACING_STEPS = ['xtight', 'compact', 'normal', 'relaxed', 'loose'] as const

const SECTION_STEPS = ['xtight', 'tight', 'normal', 'roomy', 'xroomy'] as const

/** Global undo/redo: snapshots resume state (throttled), Ctrl/Cmd+Z and Ctrl/Cmd+Shift+Z / Ctrl/Cmd+Y */
function useUndo(
  resume: Resume,
  setResume: React.Dispatch<React.SetStateAction<Resume>>
) {
  const history = useRef<Resume[]>([])
  const future = useRef<Resume[]>([])
  const last = useRef(resume)
  const lastPush = useRef(0)
  const restoring = useRef(false)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  useEffect(() => {
    if (restoring.current) {
      restoring.current = false
      last.current = resume
      return
    }
    if (resume === last.current) return
    if (future.current.length > 0) {
      future.current = []
      setCanRedo(false)
    }
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
    future.current.push(last.current)
    if (future.current.length > 50) future.current.shift()
    restoring.current = true
    setCanUndo(history.current.length > 0)
    setCanRedo(true)
    setResume(prev)
  }, [setResume])

  const redo = useCallback(() => {
    const next = future.current.pop()
    if (!next) return
    history.current.push(last.current)
    if (history.current.length > 50) history.current.shift()
    restoring.current = true
    setCanUndo(true)
    setCanRedo(future.current.length > 0)
    setResume(next)
  }, [setResume])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return
      const key = e.key.toLowerCase()
      const isUndo = key === 'z' && !e.shiftKey
      const isRedo = (key === 'z' && e.shiftKey) || key === 'y'
      if (!isUndo && !isRedo) return
      const el = document.activeElement
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) return
      e.preventDefault()
      if (isRedo) redo()
      else undo()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [undo, redo])

  return { undo, canUndo, redo, canRedo }
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

/** Event dispatched by ATS-check "Fix" links to scroll the matching editor section into view */
const JUMP_EVENT = 'honestcv:jump-section'

/** Optional editor sections that stay out of the way until they have content or are added */
const OPTIONAL_SECTION_META: { key: string; label: string; icon: React.ReactNode }[] = [
  { key: 'involvement', label: 'Involvement', icon: <Users className="size-3.5" /> },
  { key: 'coursework', label: 'Coursework', icon: <BookOpen className="size-3.5" /> },
  { key: 'awards', label: 'Awards & honors', icon: <Award className="size-3.5" /> },
  { key: 'publications', label: 'Publications', icon: <BookText className="size-3.5" /> },
  { key: 'references', label: 'References', icon: <Contact className="size-3.5" /> },
  { key: 'military', label: 'Military service', icon: <Shield className="size-3.5" /> },
  { key: 'agents', label: 'Agents', icon: <Bot className="size-3.5" /> },
]
const OPTIONAL_SECTION_KEYS = OPTIONAL_SECTION_META.map((s) => s.key)

/** Anchors accepted by the ?jump= deep link from the ATS checker */
const JUMP_ANCHORS = [
  'target',
  'contact',
  'summary',
  'experience',
  'education',
  'skills',
  ...OPTIONAL_SECTION_KEYS,
]

/** True while focus sits inside an entry card of the given auto-sorted section */
function autoSortHeld(key: AutoSortSection): boolean {
  return !!document.activeElement?.closest(`[data-autosort-scope="${key}"]`)
}

/** Re-file experience/education newest-first when their "Sort by date" toggle is on */
function applyAutoSort(r: Resume, isHeld?: (key: AutoSortSection) => boolean): Resume {
  const keys = (r.autoSortByDate ?? []).filter((k) => !isHeld?.(k))
  if (!keys.length) return r
  let next = r
  if (keys.includes('experience')) {
    const sorted = sortEntriesByDate(
      r.experience,
      (x) => x.startDate,
      (x) => x.endDate
    )
    if (sorted.some((it, i) => it !== r.experience[i])) next = { ...next, experience: sorted }
  }
  if (keys.includes('education')) {
    const sorted = sortEntriesByDate(
      r.education,
      (x) => x.startDate,
      (x) => x.endDate
    )
    if (sorted.some((it, i) => it !== r.education[i])) next = { ...next, education: sorted }
  }
  return next
}

function Section({
  title,
  icon,
  children,
  defaultOpen = true,
  anchor,
  hidden = false,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
  anchor?: string
  /** Render nothing (optional section without content that the user hasn't added) */
  hidden?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const [flash, setFlash] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!anchor) return
    const onJump = (ev: Event) => {
      if ((ev as CustomEvent<string>).detail !== anchor) return
      setOpen(true)
      requestAnimationFrame(() => {
        ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
      setFlash(true)
      window.setTimeout(() => setFlash(false), 1600)
    }
    window.addEventListener(JUMP_EVENT, onJump)
    return () => window.removeEventListener(JUMP_EVENT, onJump)
  }, [anchor])
  if (hidden) return null
  return (
    <Card
      ref={ref}
      data-section-anchor={anchor}
      className={`scroll-mt-28 py-0 transition-shadow ${flash ? 'ring-primary/60 ring-2' : ''}`}
    >
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

/** Sticky chip bar listing the visible editor sections; the section in view is highlighted */
function SectionNav({
  sections,
  onJump,
  score,
  onOpenReport,
}: {
  sections: { key: string; label: string }[]
  onJump: (key: string) => void
  score: number
  onOpenReport: () => void
}) {
  const keyList = sections.map((s) => s.key).join('|')
  const keys = useMemo(() => keyList.split('|'), [keyList])
  const [active, setActive] = useState(keys[0])
  useEffect(() => {
    const visible = new Set<string>()
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const key = (e.target as HTMLElement).dataset.sectionAnchor
          if (!key) continue
          if (e.isIntersecting) visible.add(key)
          else visible.delete(key)
        }
        const first = keys.find((k) => visible.has(k))
        if (first) setActive(first)
      },
      { rootMargin: '-110px 0px -55% 0px' }
    )
    for (const k of keys) {
      const el = document.querySelector(`[data-section-anchor="${k}"]`)
      if (el) io.observe(el)
    }
    return () => io.disconnect()
  }, [keys])
  return (
    <nav
      aria-label="Resume sections"
      className="bg-background/85 sticky top-14 z-10 flex items-center gap-1 rounded-lg border px-1 py-1 backdrop-blur"
    >
      <div className="min-w-0 flex-1 overflow-x-auto [scrollbar-width:none]">
        <div className="flex w-max gap-0.5">
          {sections.map((s) => (
            <button
              key={s.key}
              type="button"
              aria-current={active === s.key ? 'true' : undefined}
              className={`min-h-10 rounded-md px-2.5 text-xs whitespace-nowrap transition-colors sm:min-h-8 ${
                active === s.key
                  ? 'bg-secondary text-foreground font-medium'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
              onClick={() => onJump(s.key)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
      <button
        type="button"
        aria-label={`Resume health score ${score} out of 100 — ${scoreVerdict(score)} — open full report`}
        title="Resume health — open full report"
        className={`inline-flex min-h-10 shrink-0 items-center gap-1 rounded-md border px-2 text-xs font-medium tabular-nums transition-colors sm:min-h-8 ${
          score >= 80
            ? 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            : score >= 50
              ? 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100'
              : 'border-red-300 bg-red-50 text-red-700 hover:bg-red-100'
        }`}
        onClick={onOpenReport}
      >
        <HeartPulse aria-hidden className="size-3.5" />
        {score}
        <span className="hidden font-normal sm:inline">· {scoreVerdict(score)}</span>
      </button>
    </nav>
  )
}

/** Plain-words tier for a 0-100 score, matching the three color bands */
const scoreVerdict = (score: number) =>
  score >= 80 ? 'Strong' : score >= 50 ? 'Getting there' : 'Needs work'

/** Point on the gauge arc for a 0-100 value (semicircle, left = 0) */
const gaugePoint = (value: number, radius: number): [number, number] => {
  const rad = ((180 - value * 1.8) * Math.PI) / 180
  return [100 + radius * Math.cos(rad), 100 - radius * Math.sin(rad)]
}

const gaugeArc = (from: number, to: number, radius: number) => {
  const [x1, y1] = gaugePoint(from, radius)
  const [x2, y2] = gaugePoint(to, radius)
  return `M ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2}`
}

/** Semicircular score dial: colored band arc, needle, score + verdict */
function ScoreGauge({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(100, score))
  const [nx, ny] = gaugePoint(clamped, 62)
  return (
    <div
      role="img"
      aria-label={`Resume strength ${clamped} out of 100 — ${scoreVerdict(clamped)}`}
      className="mx-auto w-40 max-w-full"
    >
      <svg viewBox="0 0 200 118" aria-hidden className="block w-full">
        <path d={gaugeArc(0, 50, 80)} fill="none" strokeWidth={12} strokeLinecap="round" className="stroke-red-400" />
        <path d={gaugeArc(50, 80, 80)} fill="none" strokeWidth={12} className="stroke-amber-400" />
        <path d={gaugeArc(80, 100, 80)} fill="none" strokeWidth={12} strokeLinecap="round" className="stroke-emerald-500" />
        <line x1={100} y1={100} x2={nx} y2={ny} strokeWidth={3} strokeLinecap="round" className="stroke-foreground" />
        <circle cx={100} cy={100} r={5} className="fill-foreground" />
        <text x={20} y={116} textAnchor="middle" className="fill-muted-foreground text-[11px]">
          0
        </text>
        <text x={180} y={116} textAnchor="middle" className="fill-muted-foreground text-[11px]">
          100
        </text>
      </svg>
      <div className="-mt-1 text-center">
        <span className="text-2xl font-semibold tabular-nums">{clamped}</span>
        <span className="text-muted-foreground block text-xs">{scoreVerdict(clamped)}</span>
      </div>
    </div>
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
    'Build an ATS-friendly resume in your browser: 25 templates, drag-and-drop sections, live ATS match score, free PDF & DOCX download. No account, no subscription.'
  )
  useEffect(() => trackEvent('builder-start'), [])
  const [resume, setResumeRaw] = useState<Resume>(() => {
    const r = applyAutoSort(loadResume() ?? emptyResume())
    // ?template=<id> deep link from the landing gallery / static template pages
    const wanted = new URLSearchParams(window.location.search).get('template')
    if (wanted && TEMPLATES.some((t) => t.id === wanted) && r.templateId !== wanted) {
      const next = { ...r, templateId: wanted }
      saveResume(next)
      return next
    }
    return r
  })
  /** Every update passes through applyAutoSort so toggled-on sections stay filed;
   * a section is held in place while focus is inside one of its entry cards and
   * re-filed when the card blurs (commit-at-boundary, like Rezi's save). */
  const setResume = useCallback<React.Dispatch<React.SetStateAction<Resume>>>((action) => {
    setResumeRaw((prev) =>
      applyAutoSort(typeof action === 'function' ? action(prev) : action, autoSortHeld)
    )
  }, [])
  const releaseAutoSort = useCallback(
    (key: AutoSortSection) => (e: React.FocusEvent<HTMLDivElement>) => {
      if (e.relatedTarget && e.currentTarget.contains(e.relatedTarget)) return
      setResumeRaw((prev) =>
        (prev.autoSortByDate ?? []).includes(key) ? applyAutoSort(prev) : prev
      )
    },
    []
  )
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [upgradeReason, setUpgradeReason] = useState('')
  const [aiBusy, setAiBusy] = useState<string | null>(null)
  const [hlLine, setHlLine] = useState<{ key: string; line: number } | null>(null)
  const [aiError, setAiError] = useState('')
  const [aiErrorTag, setAiErrorTag] = useState<string | null>(null)
  const [freeLeft, setFreeLeft] = useState<number | null>(null)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [dlError, setDlError] = useState<string | null>(null)
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false)
  const [downloaded, setDownloaded] = useState<string | null>(null)
  const [shareOpen, setShareOpen] = useState(false)
  const [shareCopied, setShareCopied] = useState(false)
  const [shareLinkOpen, setShareLinkOpen] = useState(false)
  const [shareLink, setShareLink] = useState<ShareLink | null>(() => loadShareLink())
  const [shareBusy, setShareBusy] = useState(false)
  const [shareError, setShareError] = useState('')
  const [shareLinkCopied, setShareLinkCopied] = useState(false)
  const [shareSlug, setShareSlug] = useState('')
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
  const [previewView, setPreviewView] = useState<'pages' | 'flow'>(() =>
    localStorage.getItem('honestcv.previewView') === 'flow' ? 'flow' : 'pages'
  )
  const [healthOpen, setHealthOpen] = useState(false)
  const [kwBulletFor, setKwBulletFor] = useState<string | null>(null)
  /** Paint matched JD keywords in the preview via the CSS Custom Highlight API */
  const [highlightKw, setHighlightKw] = useState(false)
  const previewWrapRef = useRef<HTMLDivElement>(null)
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
    original?: string
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
  const [activeVersionId, setActiveVersionIdState] = useState<string | null>(() =>
    getActiveVersionId()
  )
  const linkVersion = (id: string | null) => {
    setActiveVersionId(id)
    setActiveVersionIdState(id)
  }
  const activeVersion = activeVersionId
    ? (versions.find((v) => v.id === activeVersionId) ?? null)
    : null
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameText, setRenameText] = useState('')
  const [renameFolder, setRenameFolder] = useState('')
  const versionFolders = useMemo(() => {
    const names = new Set<string>()
    for (const v of versions) if (v.folder) names.add(v.folder)
    return [...names].sort((a, b) => a.localeCompare(b))
  }, [versions])
  const commitRename = (v: ResumeVersion) => {
    const name = renameText.trim() || v.name
    const folder = renameFolder.trim() || undefined
    if (name !== v.name || folder !== v.folder)
      setVersions(updateResumeVersion(v.id, { name, folder }))
    setRenamingId(null)
  }
  const [finalCheckOpen, setFinalCheckOpen] = useState(false)
  const finalCheckFmt = useRef<'pdf' | 'docx' | 'txt' | 'md' | null>(null)
  const freeMode = useFreeMode()
  const { license, refresh } = useLicense()
  const saveState = useDebouncedSave(resume)
  const shown = useMemo(() => visibleResume(resume), [resume])
  const pdfLength = usePdfLength(shown)
  const [fitBusy, setFitBusy] = useState(false)
  const [fitMsg, setFitMsg] = useState('')
  const autoFit = useCallback(async () => {
    setFitBusy(true)
    setFitMsg('')
    try {
      const { countResumePdfPages } = await import('@/lib/pdf')
      const currentSections = resume.sectionSpacing ?? 'normal'
      const spacingStages: Array<NonNullable<Resume['sectionSpacing']>> = [currentSections]
      for (const s of ['tight', 'xtight'] as const) {
        if (SECTION_STEPS.indexOf(s) < SECTION_STEPS.indexOf(currentSections))
          spacingStages.push(s)
      }
      let best: {
        fontScale: NonNullable<Resume['fontScale']>
        lineSpacing: NonNullable<Resume['lineSpacing']>
        sectionSpacing: NonNullable<Resume['sectionSpacing']>
        pages: number
      } | null = null
      outer: for (let stage = 0; stage < spacingStages.length; stage++) {
        const sectionSpacing = spacingStages[stage]
        const combos = stage === 0 ? FIT_COMBOS : FIT_COMBOS.slice(TIGHT_COMBO_START)
        for (const [fontScale, lineSpacing] of combos) {
          const pages = await countResumePdfPages({
            ...shown,
            fontScale,
            lineSpacing,
            sectionSpacing,
          })
          if (!best || pages < best.pages)
            best = { fontScale, lineSpacing, sectionSpacing, pages }
          if (pages === 1) break outer
        }
      }
      if (!best) return
      const same =
        best.fontScale === (resume.fontScale ?? 'm') &&
        best.lineSpacing === (resume.lineSpacing ?? 'normal') &&
        best.sectionSpacing === currentSections
      if (!same) {
        setResume((r) => ({
          ...r,
          fontScale: best.fontScale,
          lineSpacing: best.lineSpacing,
          sectionSpacing: best.sectionSpacing,
        }))
      }
      const parts = [`${SCALE_NAME[best.fontScale]} text`, `${best.lineSpacing} spacing`]
      if (best.sectionSpacing !== currentSections)
        parts.push(`${best.sectionSpacing} sections`)
      setFitMsg(
        same
          ? `Already at the best fit — ${best.pages} page${best.pages === 1 ? '' : 's'}`
          : `Fits ${best.pages} page${best.pages === 1 ? '' : 's'} — set ${parts.join(', ')}`
      )
    } catch {
      setFitMsg('Auto-fit failed — please try again')
    } finally {
      setFitBusy(false)
    }
  }, [resume, shown, setResume])
  const [templateFilter, setTemplateFilter] = useState('all')
  const templateRecs = useMemo(() => recommendedTemplates(resume), [resume])
  const [templateCompare, setTemplateCompare] = useState(false)
  const [compareIds, setCompareIds] = useState<string[]>([])
  const [compareOpen, setCompareOpen] = useState(false)
  const [templateFavs, setTemplateFavs] = useState<string[]>(loadTemplateFavorites)
  const [templateRecents, setTemplateRecents] = useState<string[]>(loadTemplateRecents)
  /** Which pane is visible on small screens (both show side-by-side on lg+) */
  const [mobilePane, setMobilePane] = useState<'edit' | 'preview'>('edit')
  /** Optional sections the user added this visit — shown even while still empty */
  const [addedSections, setAddedSections] = useState<string[]>([])
  /** Scroll the editor section that fixes a failing ATS check into view */
  const jumpToSection = (anchor: string) => {
    setMobilePane('edit')
    if (OPTIONAL_SECTION_KEYS.includes(anchor))
      setAddedSections((s) => (s.includes(anchor) ? s : [...s, anchor]))
    requestAnimationFrame(() =>
      window.dispatchEvent(new CustomEvent(JUMP_EVENT, { detail: anchor }))
    )
  }
  // ?jump=<anchor> deep link from the ATS checker's per-fix "Fix →" buttons
  useEffect(() => {
    const anchor = new URLSearchParams(window.location.search).get('jump')
    if (anchor === null) return
    window.history.replaceState(null, '', window.location.pathname)
    if (!JUMP_ANCHORS.includes(anchor)) return
    const t = window.setTimeout(() => jumpToSection(anchor), 150)
    return () => window.clearTimeout(t)
  }, [])
  /** Entry card currently ring-flashed after a score-finding jump */
  const [flashEntryId, setFlashEntryId] = useState<string | null>(null)
  /** Scroll a specific experience card into view, expanding it if collapsed */
  const jumpToEntry = (id: string) => {
    setMobilePane('edit')
    setCollapsedEntries((s) => {
      if (!s.has(id)) return s
      const next = new Set(s)
      next.delete(id)
      return next
    })
    requestAnimationFrame(() => {
      document
        .querySelector(`[data-entry-id="${id}"]`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setFlashEntryId(id)
      window.setTimeout(() => setFlashEntryId((cur) => (cur === id ? null : cur)), 1600)
    })
  }
  /** An optional section card renders when it has entries or was added this visit */
  const sectionShown = (key: string) =>
    ((resume[key as keyof Resume] as unknown[] | undefined)?.length ?? 0) > 0 ||
    addedSections.includes(key)
  const navSections = [
    { key: 'contact', label: 'Contact' },
    { key: 'summary', label: 'Summary' },
    { key: 'experience', label: 'Experience' },
    { key: 'education', label: 'Education' },
    { key: 'projects', label: 'Projects' },
    ...OPTIONAL_SECTION_META.filter((s) => sectionShown(s.key)).map((s) => ({
      key: s.key,
      label: s.label,
    })),
    { key: 'skills', label: 'Skills' },
    { key: 'custom', label: 'Custom' },
  ]
  const autoSortOn = (key: AutoSortSection) => (resume.autoSortByDate ?? []).includes(key)
  const toggleAutoSort = (key: AutoSortSection) =>
    setResume((r) => {
      const cur = r.autoSortByDate ?? []
      return {
        ...r,
        autoSortByDate: cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key],
      }
    })
  const { undo, canUndo, redo, canRedo } = useUndo(resume, setResume)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [expLibrary, setExpLibrary] = useState<SavedExperience[]>(() => listExperienceLibrary())
  const [expLibraryOpen, setExpLibraryOpen] = useState(false)
  const [expLibrarySavedId, setExpLibrarySavedId] = useState<string | null>(null)
  const [eduLibrary, setEduLibrary] = useState<SavedEducation[]>(() => listEducationLibrary())
  const [eduLibraryOpen, setEduLibraryOpen] = useState(false)
  const [eduLibrarySavedId, setEduLibrarySavedId] = useState<string | null>(null)
  const [projLibrary, setProjLibrary] = useState<SavedProject[]>(() => listProjectLibrary())
  const [projLibraryOpen, setProjLibraryOpen] = useState(false)
  const [projLibrarySavedId, setProjLibrarySavedId] = useState<string | null>(null)
  const [invLibrary, setInvLibrary] = useState<SavedInvolvement[]>(() => listInvolvementLibrary())
  const [invLibraryOpen, setInvLibraryOpen] = useState(false)
  const [invLibrarySavedId, setInvLibrarySavedId] = useState<string | null>(null)
  const [cwLibrary, setCwLibrary] = useState<SavedCoursework[]>(() => listCourseworkLibrary())
  const [cwLibraryOpen, setCwLibraryOpen] = useState(false)
  const [cwLibrarySavedId, setCwLibrarySavedId] = useState<string | null>(null)
  const [awardLibrary, setAwardLibrary] = useState<SavedAward[]>(() => listAwardLibrary())
  const [awardLibraryOpen, setAwardLibraryOpen] = useState(false)
  const [awardLibrarySavedId, setAwardLibrarySavedId] = useState<string | null>(null)
  const [certLibrary, setCertLibrary] = useState<SavedCertification[]>(() => listCertLibrary())
  const [certLibraryOpen, setCertLibraryOpen] = useState(false)
  const [certLibrarySavedId, setCertLibrarySavedId] = useState<string | null>(null)
  const photoInputRef = useRef<HTMLInputElement | null>(null)
  const [photoError, setPhotoError] = useState('')
  const [photoDraft, setPhotoDraft] = useState<PhotoDraft | null>(null)
  const closePhotoDraft = () => {
    setPhotoDraft((d) => {
      if (d) URL.revokeObjectURL(d.url)
      return null
    })
  }
  const [pubLibrary, setPubLibrary] = useState<SavedPublication[]>(() => listPublicationLibrary())
  const [pubLibraryOpen, setPubLibraryOpen] = useState(false)
  const [pubLibrarySavedId, setPubLibrarySavedId] = useState<string | null>(null)
  const [refLibrary, setRefLibrary] = useState<SavedReference[]>(() => listReferenceLibrary())
  const [refLibraryOpen, setRefLibraryOpen] = useState(false)
  const [refLibrarySavedId, setRefLibrarySavedId] = useState<string | null>(null)
  const [collapsedEntries, setCollapsedEntries] = useState<Set<string>>(() => new Set())
  const toggleEntry = (id: string) =>
    setCollapsedEntries((s) => {
      const next = new Set(s)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  const [skillsLibrary, setSkillsLibrary] = useState<SavedSkills[]>(() => listSkillsLibrary())
  const [skillsLibraryOpen, setSkillsLibraryOpen] = useState(false)
  const [skillsLibrarySaved, setSkillsLibrarySaved] = useState(false)
  const [summaryLibrary, setSummaryLibrary] = useState<SavedSummary[]>(() => listSummaryLibrary())
  const [summaryLibraryOpen, setSummaryLibraryOpen] = useState(false)
  const [summaryLibrarySaved, setSummaryLibrarySaved] = useState(false)
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
      linkVersion(null)
      return {
        ...exampleToResume(person),
        // Keep a template the user deliberately picked
        ...(cur.templateId !== emptyResume().templateId ? { templateId: cur.templateId } : {}),
      }
    })
  }, [setResume])

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
    () => scoreResume(shown, shown.jobDescription, pdfLength?.pages ?? null),
    [shown, pdfLength]
  )
  useEffect(() => {
    if (!highlightKw || !shown.jobDescription.trim() || ats.matched.length === 0) {
      clearKeywordHighlight()
      return
    }
    const t = window.setTimeout(() => {
      if (previewWrapRef.current) applyKeywordHighlight(previewWrapRef.current, ats.matched)
    }, 150)
    return () => window.clearTimeout(t)
  }, [highlightKw, shown, ats.matched, previewView])
  useEffect(() => clearKeywordHighlight, [])
  const prevPassRef = useRef<Map<string, boolean> | null>(null)
  const [fixedChecks, setFixedChecks] = useState<Set<string>>(() => new Set())
  useEffect(() => {
    const prev = prevPassRef.current
    prevPassRef.current = new Map(ats.checks.map((c) => [c.label, c.pass]))
    if (!prev) return
    setFixedChecks((old) => {
      const fixed = new Set(old)
      let changed = false
      for (const c of ats.checks) {
        if (c.pass && prev.get(c.label) === false && !fixed.has(c.label)) {
          fixed.add(c.label)
          changed = true
        } else if (!c.pass && fixed.has(c.label)) {
          fixed.delete(c.label)
          changed = true
        }
      }
      return changed ? fixed : old
    })
  }, [ats])
  const highKw = useMemo(
    () => highPriorityKeywords(shown.jobDescription, ats.missing),
    [shown.jobDescription, ats.missing]
  )
  const readiness = useMemo(() => applicationReadiness(ats), [ats])
  /** Missing JD keywords for skill-tailored bullet starters — high priority first, cap 6. */
  const starterSkills = useMemo(
    () => [
      ...ats.missing.filter((kw) => highKw.has(kw)),
      ...ats.missing.filter((kw) => !highKw.has(kw)),
    ].slice(0, 6),
    [ats.missing, highKw]
  )
  /** Lexicon skills the resume body demonstrates but the Skills section never lists. */
  const proven = useMemo(
    () => provenSkills(resumeToPlainText(shown), shown.skills).slice(0, 10),
    [shown]
  )

  const set = useCallback(<K extends keyof Resume>(key: K, value: Resume[K]) => {
    setResume((r) => ({ ...r, [key]: value }))
  }, [setResume])
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
    apply: (out: string) => void,
    emphasis?: 'key-numbers'
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
          role: aiTargetRole(resume),
          jobDescription: resume.jobDescription,
          language: resume.language,
        },
        wantVariants,
        emphasis
      )
      if (freeRemaining !== null) setFreeLeft(freeRemaining)
      if (texts && texts.length > 1) {
        setVariantPick({
          title: kind === 'summary' ? 'Pick a summary' : 'Pick a rewrite',
          candidates: texts,
          original: text,
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

  /** Review dialog for an AI-suggested bullet: apply / edit / regenerate */
  const [bulletSuggest, setBulletSuggest] = useState<{
    kind: 'exp' | 'proj' | 'inv'
    entryId: string
    variant?: 'key-numbers'
    text: string
  } | null>(null)

  /** Where a suggested bullet is drafted from and applied to, per entry kind. */
  const suggestTargetFor = (
    kind: 'exp' | 'proj' | 'inv',
    id: string
  ):
    | {
        role: string
        company: string
        companyInfo?: string
        bullets: string[]
        section?: 'project' | 'involvement'
        notReady: string
        apply: (line: string) => void
      }
    | undefined => {
    if (kind === 'exp') {
      const e = resume.experience.find((x) => x.id === id)
      if (!e) return undefined
      return {
        role: e.role,
        company: e.company,
        companyInfo: e.companyInfo?.trim() || undefined,
        bullets: e.bullets.filter((b) => b.trim()),
        notReady: 'Add a job title or company first — the bullet is drafted for that role.',
        apply: (line) => setExp(id, { bullets: [...e.bullets.filter((b) => b.trim()), line] }),
      }
    }
    if (kind === 'proj') {
      const p = resume.projects.find((x) => x.id === id)
      if (!p) return undefined
      return {
        role: p.name,
        company: p.org ?? '',
        bullets: p.description.split('\n').filter((b) => b.trim()),
        section: 'project',
        notReady:
          'Add a project name or organization first — the bullet is drafted for that project.',
        apply: (line) =>
          setResume((r) => ({
            ...r,
            projects: r.projects.map((x) =>
              x.id === id
                ? {
                    ...x,
                    description: [...x.description.split('\n').filter((b) => b.trim()), line].join(
                      '\n'
                    ),
                  }
                : x
            ),
          })),
      }
    }
    const inv = (resume.involvement ?? []).find((x) => x.id === id)
    if (!inv) return undefined
    return {
      role: inv.role,
      company: inv.organization,
      bullets: inv.description.split('\n').filter((b) => b.trim()),
      section: 'involvement',
      notReady:
        'Add a role or organization first — the bullet is drafted for that involvement.',
      apply: (line) =>
        setResume((r) => ({
          ...r,
          involvement: (r.involvement ?? []).map((x) =>
            x.id === id
              ? {
                  ...x,
                  description: [...x.description.split('\n').filter((b) => b.trim()), line].join(
                    '\n'
                  ),
                }
              : x
          ),
        })),
    }
  }

  const runSuggestBullet = async (
    kind: 'exp' | 'proj' | 'inv',
    id: string,
    variant?: 'key-numbers'
  ) => {
    const tag = variant ? `${kind}-${id}-suggest-nums` : `${kind}-${id}-suggest`
    const target = suggestTargetFor(kind, id)
    if (!target) return
    if (!target.role.trim() && !target.company.trim()) {
      setAiErrorTag(tag)
      setAiError(target.notReady)
      return
    }
    setAiBusy(tag)
    setAiError('')
    setAiErrorTag(tag)
    try {
      const { text, freeRemaining } = await aiSuggestBullet({
        role: target.role,
        company: target.company,
        companyInfo: target.companyInfo,
        bullets: target.bullets,
        resumeText: resumeToPlainText(shown),
        variant,
        language: resume.language,
        section: target.section,
      })
      if (freeRemaining !== null) setFreeLeft(freeRemaining)
      const line = (text.split('\n')[0] ?? '').replace(/^[-•]\s*/, '').trim()
      if (line) setBulletSuggest({ kind, entryId: id, variant, text: line })
    } catch (err) {
      if (err instanceof PaymentRequiredError && !freeMode) requireUnlock(err.message)
      else setAiError((err as Error).message)
    } finally {
      setAiBusy(null)
    }
  }

  const bulletSuggestTarget = bulletSuggest
    ? suggestTargetFor(bulletSuggest.kind, bulletSuggest.entryId)
    : undefined
  const bulletSuggestBusy =
    bulletSuggest !== null &&
    (aiBusy === `${bulletSuggest.kind}-${bulletSuggest.entryId}-suggest` ||
      aiBusy === `${bulletSuggest.kind}-${bulletSuggest.entryId}-suggest-nums`)

  /** Setup dialog for the summary draft: position framing + skills to emphasize */
  const [summaryDraftSetup, setSummaryDraftSetup] = useState<{
    position: string
    picked: string[]
  } | null>(null)

  const summaryPositionOptions = useMemo(() => {
    const seen = new Set<string>()
    const out: string[] = []
    for (const role of [resume.targetRole, ...resume.experience.map((e) => e.role)]) {
      const r = role.trim()
      const key = r.toLowerCase()
      if (r && !seen.has(key)) {
        seen.add(key)
        out.push(r)
      }
    }
    return out
  }, [resume.targetRole, resume.experience])

  const summarySkillOptions = useMemo(() => {
    const seen = new Set<string>()
    const out: string[] = []
    for (const line of skillLines(resume)) {
      for (const part of line.text.split(',')) {
        const s = part.trim()
        const key = s.toLowerCase()
        if (s && s.length <= 40 && !seen.has(key)) {
          seen.add(key)
          out.push(s)
        }
        if (out.length >= 18) return out
      }
    }
    return out
  }, [resume])

  const resumeHasContent =
    resume.experience.some((e) => e.role.trim() || e.bullets.some((b) => b.trim())) ||
    resume.skills.trim().length > 0 ||
    resume.education.some((e) => e.degree.trim() || e.school.trim())

  const runSummaryDraft = async (position: string, highlights: string[]) => {
    const tag = 'summary-draft'
    if (!resumeHasContent) {
      setAiErrorTag(tag)
      setAiError('Add some experience or skills first — the draft is written only from your resume.')
      return
    }
    setAiBusy(tag)
    setAiError('')
    setAiErrorTag(tag)
    try {
      const { texts, freeRemaining } = await aiSummaryDraft({
        resumeText: resumeToPlainText({ ...shown, summary: '' }),
        role: position.trim() || aiTargetRole(resume),
        highlights: highlights.length ? highlights : undefined,
        jobDescription: resume.jobDescription.trim() || undefined,
        language: resume.language,
      })
      if (freeRemaining !== null) setFreeLeft(freeRemaining)
      setVariantPick({
        title: 'Pick a summary',
        candidates: texts,
        original: resume.summary,
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
  /** Setup dialog for skill suggestions: what the user did + category focus */
  const [skillExploreSetup, setSkillExploreSetup] = useState<{
    context: string
    category: string
  } | null>(null)

  const runSkillSuggest = async (context = '', category = '') => {
    const tag = 'skill-suggest'
    if (!resume.skills.trim() && !resume.targetRole.trim() && !context.trim()) {
      setAiErrorTag(tag)
      setAiError(
        'Add a target role, a few skills, or describe what you did — suggestions build on what you already have.'
      )
      return
    }
    setAiBusy(tag)
    setAiError('')
    setAiErrorTag(tag)
    try {
      const { skills, freeRemaining } = await aiSkillSuggest({
        skills: resume.skills,
        role: aiTargetRole(resume),
        jobDescription: resume.jobDescription,
        context: context.trim() ? context.trim().slice(0, 200) : undefined,
        category: category.trim() ? category.trim() : undefined,
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
  const assistantFixes = useMemo(() => priorityFixes(ats, health), [ats, health])

  const insertKeywordBullet = useCallback((expId: string, text: string) => {
    setResume((r) => ({
      ...r,
      experience: r.experience.map((e) =>
        e.id === expId ? { ...e, bullets: [...e.bullets.filter((b) => b.trim()), text] } : e
      ),
    }))
  }, [setResume])

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
  }, [setResume])

  const finalCheckIssues = useMemo(() => {
    const issues: string[] = []
    for (const c of ats.checks) if (!c.pass) issues.push(`${c.label} — ${c.hint}`)
    const countIssues = (lines: string[]) =>
      checkBullets(lines).reduce((m, r) => m + r.issues.length, 0) +
      (bulletMix(lines).balanced ? 0 : 1)
    const bulletIssueCount =
      shown.experience.reduce((n, e) => n + countIssues(e.bullets), 0) +
      shown.projects.reduce((n, p) => n + countIssues(p.description.split('\n')), 0) +
      (shown.involvement ?? []).reduce((n, i) => n + countIssues(i.description.split('\n')), 0)
    if (bulletIssueCount > 0)
      issues.push(
        `${bulletIssueCount} bullet-quality warning${bulletIssueCount === 1 ? '' : 's'} in Experience/Projects/Involvement (weak openers, missing numbers…)`
      )
    const placeholderCount = resumeToPlainText(shown).match(/\[[^\]\n]{1,60}\]/g)?.length ?? 0
    if (placeholderCount > 0)
      issues.push(
        `${placeholderCount} bracket placeholder${placeholderCount === 1 ? '' : 's'} like [add %] still in the resume — replace with your real details`
      )
    return issues
  }, [ats, shown])

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
    setDlError(null)
    try {
      const fname = (ext: string) =>
        professionalFileName([resume.contact.fullName, resume.targetRole, 'resume'], ext)
      if (fmt === 'pdf')
        await (await import('@/lib/pdf')).downloadResumePdf(shown, fname('pdf'))
      else if (fmt === 'docx')
        await (await import('@/lib/docx')).downloadResumeDocx(shown, fname('docx'))
      else if (fmt === 'md') downloadText(resumeToMarkdown(shown), fname('md'), 'text/markdown')
      else downloadText(resumeToPlainText(shown), fname('txt'))
      setDlDone(true)
      if (!localStorage.getItem('honestcv.shared')) {
        localStorage.setItem('honestcv.shared', '1')
        setShareCopied(false)
        setShareOpen(true)
      }
      setDownloaded(fmt)
      window.setTimeout(() => setDownloaded((cur) => (cur === fmt ? null : cur)), 1800)
    } catch (e) {
      setDlError(
        `${fmt.toUpperCase()} download failed: ${e instanceof Error ? e.message : String(e)}`
      )
    } finally {
      setDownloading(null)
    }
  }

  /** `notReady`: reason the AI action can't run yet — renders the button disabled
   *  with the reason as visible helper text instead of a post-click error. */
  const aiButton = (
    tag: string,
    label: string,
    onClick: () => void,
    notReady?: string | boolean
  ) => (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onClick}
        disabled={Boolean(aiBusy) || Boolean(notReady)}
        className="h-10 gap-1 text-xs sm:h-7"
        title={
          (typeof notReady === 'string' && notReady ? notReady : undefined) ??
          (!unlocked && freeLeft !== null
            ? `${freeLeft} free AI use${freeLeft === 1 ? '' : 's'} left`
            : undefined)
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
      {typeof notReady === 'string' && notReady && (
        <p className="text-muted-foreground w-full text-xs">{notReady}</p>
      )}
      {!notReady && aiError && aiErrorTag === tag && (
        <p className="text-destructive text-xs">{aiError}</p>
      )}
    </>
  )

  return (
    <div className="bg-muted/30 flex min-h-screen flex-col">
      <SiteHeader
        action={
          <div className="flex items-center gap-1 sm:gap-2">
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
              onClick={redo}
              disabled={!canRedo}
              title="Redo (Ctrl+Shift+Z)"
              className="hidden min-h-10 min-w-10 sm:inline-flex sm:min-h-8 sm:min-w-8"
            >
              <Redo2 className="size-3.5" />
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
              className="hidden 2xl:inline-flex"
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
            <div className="relative 2xl:hidden">
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
              className="hidden 2xl:inline-flex"
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
              className="hidden 2xl:inline-flex"
            >
              {downloaded === 'txt' ? <Check className="animate-pop text-emerald-600" /> : <Download />} TXT
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => void download('md')}
              disabled={Boolean(downloading)}
              title="Markdown version — handy for AI tools, GitHub profiles and quick edits"
              className="hidden 2xl:inline-flex"
            >
              {downloaded === 'md' ? <Check className="animate-pop text-emerald-600" /> : <Download />} MD
            </Button>
          </div>
        }
      />

      {dlError && (
        <div className="mx-auto w-full max-w-7xl px-4 pt-3">
          <p
            className="flex items-start justify-between gap-2 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800"
            role="alert"
          >
            <span>{dlError}</span>
            <button type="button" className="underline" onClick={() => setDlError(null)}>
              Dismiss
            </button>
          </p>
        </div>
      )}
      <main className="mx-auto grid w-full max-w-7xl flex-1 gap-6 px-4 py-6 pb-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:pb-6">
        <h1 className="sr-only">Resume builder</h1>
        {/* ---- Left: editor ---- */}
        <div className={`min-w-0 space-y-4 ${mobilePane === 'edit' ? '' : 'hidden lg:block'}`}>
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
                setActiveVersionIdState(getActiveVersionId())
                setVersionName(resume.targetRole || '')
                setRenamingId(null)
                setVersionsOpen(true)
              }}
            >
              <Copy className="size-3" />{' '}
              {activeVersion ? (
                <span className="max-w-28 truncate">{activeVersion.name}</span>
              ) : (
                <>Copies{versions.length > 0 ? ` (${versions.length})` : ''}</>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-10 gap-1 text-xs sm:h-7"
              title="Get a read-only link anyone can open — no signup needed"
              onClick={() => {
                setShareError('')
                setShareLinkCopied(false)
                setShareLinkOpen(true)
              }}
            >
              <Share2 className="size-3" /> Share link
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
                    linkVersion(null)
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
            </div>
            <div className="mt-1">
              <ScoreGauge score={strength.score} />
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

          <SectionNav
            sections={navSections}
            onJump={jumpToSection}
            score={health.score}
            onOpenReport={() => {
              localStorage.setItem('honestcv.seen.health', '1')
              setHealthSeen(true)
              setHealthOpen(true)
            }}
          />

          <Section
            title="Target job (powers AI + ATS score)"
            icon={<Target className="size-4" />}
            anchor="target"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="targetRole">Target role</Label>
                <Input
                  id="targetRole"
                  className="h-11 sm:h-9"
                  placeholder="e.g. Frontend Engineer"
                  value={resume.targetRole}
                  onChange={(e) => set('targetRole', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="targetCompany">Company</Label>
                <Input
                  id="targetCompany"
                  className="h-11 sm:h-9"
                  placeholder="e.g. Acme Corp"
                  value={resume.targetCompany ?? ''}
                  onChange={(e) => set('targetCompany', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="experienceLevel">Experience level</Label>
                <select
                  id="experienceLevel"
                  className="h-11 w-full rounded-md border bg-transparent px-2 text-sm sm:h-9"
                  value={resume.experienceLevel ?? ''}
                  onChange={(e) =>
                    set('experienceLevel', e.target.value as Resume['experienceLevel'])
                  }
                >
                  <option value="">Auto</option>
                  {EXPERIENCE_LEVELS.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {EXPERIENCE_LEVEL_LABELS[lvl]}
                    </option>
                  ))}
                </select>
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

          <Section title="Contact" icon={<FileText className="size-4" />} anchor="contact">
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
              ).map(([key, label, ph]) => {
                const hideable = (HIDEABLE_CONTACT_FIELDS as string[]).includes(key)
                const fieldHidden =
                  hideable && (resume.hiddenContact ?? []).includes(key as HideableContactField)
                return (
                  <div key={key} className={`space-y-1.5 ${fieldHidden ? 'opacity-60' : ''}`}>
                    <div className="flex items-center justify-between gap-1">
                      <Label htmlFor={`c-${key}`}>
                        {label}
                        {fieldHidden && (
                          <span className="text-muted-foreground ml-1.5 text-[10px] font-semibold uppercase">
                            Hidden
                          </span>
                        )}
                      </Label>
                      {hideable && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 shrink-0 p-0"
                          title={
                            fieldHidden
                              ? 'Show on resume'
                              : 'Hide from resume — kept here, left out of the resume'
                          }
                          aria-pressed={fieldHidden}
                          aria-label={`${fieldHidden ? 'Show' : 'Hide'} ${label} ${fieldHidden ? 'on' : 'from'} resume`}
                          onClick={() =>
                            setResume((r) => {
                              const cur = r.hiddenContact ?? []
                              const f = key as HideableContactField
                              return {
                                ...r,
                                hiddenContact: cur.includes(f)
                                  ? cur.filter((x) => x !== f)
                                  : [...cur, f],
                              }
                            })
                          }
                        >
                          {fieldHidden ? (
                            <EyeOff className="size-3.5" />
                          ) : (
                            <Eye className="size-3.5" />
                          )}
                        </Button>
                      )}
                    </div>
                    <Input
                      id={`c-${key}`}
                      placeholder={ph}
                      value={resume.contact[key]}
                      onChange={(e) => setContact(key, e.target.value)}
                      onKeyDown={key === 'fullName' ? markShortcutKeyDown : undefined}
                    />
                  </div>
                )
              })}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {resume.photo && (
                <img
                  src={resume.photo}
                  alt="Profile photo"
                  className="size-12 rounded border object-cover"
                />
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="min-h-10 sm:min-h-8"
                title="Optional photo shown top-right on the preview and PDF — many regions expect resumes without one"
                onClick={() => photoInputRef.current?.click()}
              >
                <ImagePlus className="size-4" /> {resume.photo ? 'Change photo' : 'Add photo (optional)'}
              </Button>
              {resume.photo && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive min-h-10 sm:min-h-8"
                  aria-label="Remove photo"
                  onClick={() => {
                    setPhotoError('')
                    setResume((r) => ({ ...r, photo: undefined }))
                  }}
                >
                  <Trash2 className="size-3.5" /> Remove
                </Button>
              )}
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                aria-label="Upload profile photo"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  e.target.value = ''
                  if (!file) return
                  setPhotoError('')
                  const url = URL.createObjectURL(file)
                  const img = new Image()
                  img.onload = () => {
                    if (Math.min(img.naturalWidth, img.naturalHeight) < 1) {
                      URL.revokeObjectURL(url)
                      setPhotoError('Could not read that image — try a JPG or PNG.')
                      return
                    }
                    setPhotoDraft({ url, width: img.naturalWidth, height: img.naturalHeight })
                  }
                  img.onerror = () => {
                    URL.revokeObjectURL(url)
                    setPhotoError('Could not read that image — try a JPG or PNG.')
                  }
                  img.src = url
                }}
              />
              {photoError && <span className="text-destructive text-xs">{photoError}</span>}
              {photoDraft && (
                <PhotoCropDialog
                  draft={photoDraft}
                  onSave={(dataUrl) => {
                    setResume((r) => ({ ...r, photo: dataUrl }))
                    closePhotoDraft()
                  }}
                  onCancel={closePhotoDraft}
                />
              )}
            </div>
          </Section>

          <Section title="Summary" icon={<FileText className="size-4" />} anchor="summary">
            <Textarea
              rows={3}
              placeholder="2-3 sentences: who you are, years of experience, biggest strengths and wins."
              value={resume.summary}
              onChange={(e) => set('summary', e.target.value)}
              onKeyDown={(ev) => markShortcutKeyDown(ev)}
            />
            <div className="flex flex-wrap items-center gap-2">
              {resume.summary.trim()
                ? aiButton('summary', 'AI polish summary', () =>
                    void runRewrite('summary', 'summary', resume.summary, (out) =>
                      set('summary', out)
                    )
                  )
                : aiButton(
                    'summary-draft',
                    'Draft from my resume',
                    () =>
                      setSummaryDraftSetup({
                        position: aiTargetRole(resume),
                        picked: [],
                      }),
                    !resumeHasContent &&
                      'Add some experience or skills first — the draft is written only from your resume.'
                  )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-9"
                title="Save summary to library — reuse it in other resume copies"
                aria-label="Save summary to library"
                disabled={!resume.summary.trim()}
                onClick={() => {
                  setSummaryLibrary(saveSummaryToLibrary(resume.summary))
                  setSummaryLibrarySaved(true)
                  window.setTimeout(() => setSummaryLibrarySaved(false), 1600)
                }}
              >
                {summaryLibrarySaved ? (
                  <Check className="size-3.5 text-green-600" />
                ) : (
                  <BookmarkPlus className="size-3.5" />
                )}
              </Button>
              {summaryLibrary.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  title="Insert a summary you saved from any resume copy"
                  onClick={() => setSummaryLibraryOpen((v) => !v)}
                >
                  <Bookmark className="size-4" /> From library ({summaryLibrary.length})
                </Button>
              )}
            </div>
            {summaryLibraryOpen && summaryLibrary.length > 0 && (
              <div className="min-w-0 space-y-2 overflow-hidden rounded-lg border p-3">
                <p className="text-muted-foreground text-xs font-medium">Saved summaries</p>
                {summaryLibrary.map((s) => (
                  <div key={s.id} className="flex min-w-0 items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm">
                        {s.summary.split('\n').map((l) => l.trim()).filter(Boolean)[0] ??
                          'Untitled summary'}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        Saved {new Date(s.savedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-10 text-xs sm:h-7"
                        onClick={() =>
                          setResume((r) => ({
                            ...r,
                            summary: r.summary.trim()
                              ? `${r.summary.replace(/\s+$/, '')}\n${s.summary}`
                              : s.summary,
                          }))
                        }
                      >
                        Insert
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive h-10 sm:h-7"
                        title="Remove from library"
                        aria-label={`Remove saved summary ${s.summary.split('\n').map((l) => l.trim()).filter(Boolean)[0] ?? 'Untitled summary'}`}
                        onClick={() => setSummaryLibrary(deleteLibrarySummary(s.id))}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section title="Experience" icon={<Briefcase className="size-4" />} anchor="experience">
            {resume.experience.length > 1 && (
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-10 text-xs sm:h-7"
                  title={
                    autoSortOn('experience')
                      ? 'Auto-sort is on — roles stay newest first as you edit'
                      : 'Keep roles sorted newest first — ongoing roles on top'
                  }
                  aria-pressed={autoSortOn('experience')}
                  onClick={() => toggleAutoSort('experience')}
                >
                  <ArrowDown className="size-3.5" /> Sort by date
                  {autoSortOn('experience') && <Check className="size-3.5" />}
                </Button>
              </div>
            )}
            {resume.experience.map((e, idx) => (
              <div
                key={e.id}
                {...expDrag.dropProps(idx)}
                data-autosort-scope="experience"
                data-entry-id={e.id}
                onBlurCapture={releaseAutoSort('experience')}
                className={`space-y-2 rounded-lg border p-3 transition ${
                  expDrag.overIndex === idx ? 'border-primary bg-primary/5' : ''
                } ${e.hidden ? 'opacity-60' : ''} ${
                  flashEntryId === e.id ? 'ring-primary/60 ring-2' : ''
                }`}
              >
                <div className="flex min-w-0 flex-wrap items-center justify-between">
                  <p className="text-muted-foreground flex min-w-0 basis-full items-center gap-1 text-xs font-medium sm:basis-auto">
                    <span
                      {...expDrag.handleProps(idx)}
                      role="button"
                      className="text-muted-foreground/60 hover:text-foreground -my-2.5 -ml-1 cursor-grab touch-none p-3.5 active:cursor-grabbing sm:my-0 sm:p-1"
                      title="Drag to reorder"
                      aria-label={`Drag role ${idx + 1} to reorder`}
                    >
                      <GripVertical className="size-3.5" />
                    </span>
                    <span className="shrink-0">Role {idx + 1}</span>
                    {(e.role.trim() || e.company.trim()) && (
                      <span className="text-foreground min-w-0 truncate font-normal">
                        — {[e.role, e.company].filter((x) => x.trim()).join(', ')}
                      </span>
                    )}
                    {e.hidden && (
                      <span className="bg-muted text-muted-foreground shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase">
                        Hidden
                      </span>
                    )}
                    <EntryAuditChip
                      findings={[
                        ...((e.role.trim() || e.company.trim()) && !e.startDate.trim()
                          ? [DATE_FINDING]
                          : []),
                        ...bulletFindings(e.bullets, Boolean(e.role.trim() || e.company.trim())),
                      ]}
                      filled={Boolean(e.role.trim() || e.company.trim())}
                      checks={EXPERIENCE_CHECKS}
                      expandable={collapsedEntries.has(e.id)}
                      onExpand={() => toggleEntry(e.id)}
                      label={`Role ${idx + 1}`}
                    />
                  </p>
                  <div className="ml-auto flex shrink-0 items-center">
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
                      className="h-10 sm:h-7"
                      title="Save role to library — reuse it in other resume copies"
                      aria-label={`Save role ${idx + 1} to library`}
                      disabled={!e.role.trim() && !e.company.trim() && !e.bullets.some((b) => b.trim())}
                      onClick={() => {
                        setExpLibrary(saveExperienceToLibrary(e))
                        setExpLibrarySavedId(e.id)
                        window.setTimeout(() => setExpLibrarySavedId((v) => (v === e.id ? null : v)), 1600)
                      }}
                    >
                      {expLibrarySavedId === e.id ? (
                        <Check className="size-3.5 text-green-600" />
                      ) : (
                        <BookmarkPlus className="size-3.5" />
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-10 sm:h-7"
                      title={e.hidden ? 'Show on resume' : 'Hide from resume — kept here, left out of the resume'}
                      aria-pressed={e.hidden === true}
                      aria-label={`${e.hidden ? 'Show' : 'Hide'} role ${idx + 1} ${e.hidden ? 'on' : 'from'} resume`}
                      onClick={() =>
                        setResume((r) => ({
                          ...r,
                          experience: r.experience.map((x) =>
                            x.id === e.id ? { ...x, hidden: !x.hidden } : x
                          ),
                        }))
                      }
                    >
                      {e.hidden ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
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
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-10 sm:h-7"
                      title={collapsedEntries.has(e.id) ? 'Expand role' : 'Collapse role'}
                      aria-expanded={!collapsedEntries.has(e.id)}
                      aria-label={`${collapsedEntries.has(e.id) ? 'Expand' : 'Collapse'} role ${idx + 1}`}
                      onClick={() => toggleEntry(e.id)}
                    >
                      {collapsedEntries.has(e.id) ? (
                        <ChevronDown className="size-3.5" />
                      ) : (
                        <ChevronUp className="size-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
                {!collapsedEntries.has(e.id) && (
                  <>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor={`exp-${e.id}-role`}>
                      {e.company.trim() ? `Your role at ${e.company.trim()}` : 'Your role'}
                    </Label>
                    <Input
                      id={`exp-${e.id}-role`}
                      placeholder="Job title"
                      onKeyDown={markShortcutKeyDown}
                      value={e.role}
                      onChange={(ev) => setExp(e.id, { role: ev.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`exp-${e.id}-company`}>Which company was this?</Label>
                    <Input
                      id={`exp-${e.id}-company`}
                      placeholder="Company"
                      onKeyDown={markShortcutKeyDown}
                      value={e.company}
                      onChange={(ev) => setExp(e.id, { company: ev.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`exp-${e.id}-location`}>
                      {e.company.trim()
                        ? `Where was ${e.company.trim()} based?`
                        : 'Where was this?'}
                    </Label>
                    <Input
                      id={`exp-${e.id}-location`}
                      placeholder="Location"
                      value={e.location}
                      onChange={(ev) => setExp(e.id, { location: ev.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`exp-${e.id}-start`}>
                      {e.company.trim()
                        ? `When were you at ${e.company.trim()}?`
                        : 'When was this?'}
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      <MonthYearField
                        id={`exp-${e.id}-start`}
                        placeholder="Start (Jun 2023)"
                        value={e.startDate}
                        onChange={(v) => setExp(e.id, { startDate: v })}
                      />
                      <MonthYearField
                        allowPresent
                        placeholder="End (Present)"
                        value={e.endDate}
                        onChange={(v) => setExp(e.id, { endDate: v })}
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`exp-${e.id}-companyinfo`}>
                    {e.company.trim()
                      ? `About ${e.company.trim()} (optional)`
                      : 'About the company (optional)'}
                  </Label>
                  <Input
                    id={`exp-${e.id}-companyinfo`}
                    placeholder="e.g. Series B fintech, ~200 people, B2B payments"
                    onKeyDown={markShortcutKeyDown}
                    value={e.companyInfo ?? ''}
                    onChange={(ev) => setExp(e.id, { companyInfo: ev.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    One line of context shown under the role — helps recruiters place unknown
                    companies and gives the AI writer better context.
                  </p>
                </div>
                {(e.role.trim() || e.company.trim()) && !e.startDate.trim() && (
                  <p className="text-xs text-amber-700">
                    ⚠ Dates are missing — add a start date so ATS parsers can place this role on
                    your timeline.
                  </p>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor={`exp-${e.id}-bullets`}>
                    {e.company.trim()
                      ? `What did you achieve at ${e.company.trim()}?`
                      : 'What did you achieve?'}
                  </Label>
                  <LintedTextarea
                    id={`exp-${e.id}-bullets`}
                    rows={4}
                    placeholder={'One achievement per line, e.g.\nCut deploy time by 60% by introducing CI caching\nLed a team of 3 engineers on the checkout redesign'}
                    value={e.bullets.join('\n')}
                    highlightLine={hlLine?.key === `exp-${e.id}` ? hlLine.line : null}
                    onChange={(ev) => setExp(e.id, { bullets: ev.target.value.split('\n') })}
                  />
                </div>
                <BulletGuidance
                  bullets={e.bullets}
                  entryFilled={Boolean(e.role.trim() || e.company.trim())}
                  onHoverLine={(n) => setHlLine(n === null ? null : { key: `exp-${e.id}`, line: n })}
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
                  skills={starterSkills}
                  onAdd={(s) =>
                    setExp(e.id, {
                      bullets: [...e.bullets.filter((b) => b.trim()), s],
                    })
                  }
                />
                {aiButton(
                  `exp-${e.id}-suggest`,
                  'Suggest a bullet',
                  () => void runSuggestBullet('exp', e.id),
                  !e.role.trim() &&
                    !e.company.trim() &&
                    'Add a job title or company first — the bullet is drafted for that role.'
                )}
                {aiButton(
                  `exp-${e.id}-suggest-nums`,
                  '…with key numbers',
                  () => void runSuggestBullet('exp', e.id, 'key-numbers'),
                  !e.role.trim() &&
                    !e.company.trim() &&
                    'Add a job title or company first — the bullet is drafted for that role.'
                )}
                {aiButton(
                  `exp-${e.id}`,
                  'AI rewrite bullets',
                  () =>
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
                    ),
                  !e.bullets.some((b) => b.trim()) &&
                    'Write a rough bullet first — the AI rewrites your draft, it never invents experience.'
                )}
                {aiButton(
                  `exp-${e.id}-nums`,
                  '…with key numbers',
                  () =>
                    void runRewrite(
                      `exp-${e.id}-nums`,
                      'bullets',
                      e.bullets.filter((b) => b.trim()).join('\n'),
                      (out) =>
                        setExp(e.id, {
                          bullets: out
                            .split('\n')
                            .map((l) => l.replace(/^[-•]\s*/, '').trim())
                            .filter(Boolean),
                        }),
                      'key-numbers'
                    ),
                  !e.bullets.some((b) => b.trim()) &&
                    'Write a rough bullet first — the AI rewrites your draft, it never invents experience.'
                )}
                  </>
                )}
              </div>
            ))}
            <div className="flex flex-wrap items-center gap-2">
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
              {expLibrary.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  title="Insert a role you saved from any resume copy"
                  onClick={() => setExpLibraryOpen((v) => !v)}
                >
                  <Bookmark className="size-4" /> From library ({expLibrary.length})
                </Button>
              )}
            </div>
            {expLibraryOpen && expLibrary.length > 0 && (
              <div className="min-w-0 space-y-2 overflow-hidden rounded-lg border p-3">
                <p className="text-muted-foreground text-xs font-medium">Saved roles</p>
                {expLibrary.map((s) => (
                  <div key={s.id} className="flex min-w-0 items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm">
                        {[s.data.role, s.data.company].filter((x) => x.trim()).join(' — ') ||
                          'Untitled role'}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        Saved {new Date(s.savedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-10 text-xs sm:h-7"
                        onClick={() =>
                          setResume((r) => ({
                            ...r,
                            experience: [
                              ...r.experience.filter(
                                (x) =>
                                  x.role.trim() ||
                                  x.company.trim() ||
                                  x.bullets.some((b) => b.trim())
                              ),
                              { ...s.data, id: newId(), bullets: [...s.data.bullets] },
                            ],
                          }))
                        }
                      >
                        Insert
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive h-10 sm:h-7"
                        title="Remove from library"
                        aria-label={`Remove saved role ${[s.data.role, s.data.company].filter((x) => x.trim()).join(' — ') || 'Untitled role'}`}
                        onClick={() => setExpLibrary(deleteLibraryExperience(s.id))}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section title="Education" icon={<GraduationCap className="size-4" />} anchor="education">
            {resume.education.length > 1 && (
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-10 text-xs sm:h-7"
                  title={
                    autoSortOn('education')
                      ? 'Auto-sort is on — education stays newest first as you edit'
                      : 'Keep education sorted newest first — ongoing studies on top'
                  }
                  aria-pressed={autoSortOn('education')}
                  onClick={() => toggleAutoSort('education')}
                >
                  <ArrowDown className="size-3.5" /> Sort by date
                  {autoSortOn('education') && <Check className="size-3.5" />}
                </Button>
              </div>
            )}
            {resume.education.map((e, idx) => (
              <div
                key={e.id}
                {...eduDrag.dropProps(idx)}
                data-autosort-scope="education"
                onBlurCapture={releaseAutoSort('education')}
                className={`space-y-2 rounded-lg border p-3 transition ${
                  eduDrag.overIndex === idx ? 'border-primary bg-primary/5' : ''
                } ${e.hidden ? 'opacity-60' : ''}`}
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
                  <span className="shrink-0">Education {idx + 1}</span>
                  {(e.degree.trim() || e.school.trim()) && (
                    <span className="text-foreground min-w-0 truncate font-normal">
                      — {[e.degree, e.school].filter((x) => x.trim()).join(', ')}
                    </span>
                  )}
                  {e.hidden && (
                    <span className="bg-muted text-muted-foreground shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase">
                      Hidden
                    </span>
                  )}
                  <EntryAuditChip
                    findings={
                      (e.degree.trim() || e.school.trim()) && !e.startDate.trim()
                        ? [DATE_FINDING]
                        : []
                    }
                    filled={Boolean(e.degree.trim() || e.school.trim())}
                    checks={DATE_CHECKS}
                    expandable={collapsedEntries.has(e.id)}
                    onExpand={() => toggleEntry(e.id)}
                    label={`Education ${idx + 1}`}
                  />
                  <span className="grow" />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="-my-2 h-10 shrink-0 sm:h-7"
                    title={e.hidden ? 'Show on resume' : 'Hide from resume — kept here, left out of the resume'}
                    aria-pressed={e.hidden === true}
                    aria-label={`${e.hidden ? 'Show' : 'Hide'} education ${idx + 1} ${e.hidden ? 'on' : 'from'} resume`}
                    onClick={() =>
                      setResume((r) => ({
                        ...r,
                        education: r.education.map((x) =>
                          x.id === e.id ? { ...x, hidden: !x.hidden } : x
                        ),
                      }))
                    }
                  >
                    {e.hidden ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="-my-2 h-10 shrink-0 sm:h-7"
                    title={collapsedEntries.has(e.id) ? 'Expand education' : 'Collapse education'}
                    aria-expanded={!collapsedEntries.has(e.id)}
                    aria-label={`${collapsedEntries.has(e.id) ? 'Expand' : 'Collapse'} education ${idx + 1}`}
                    onClick={() => toggleEntry(e.id)}
                  >
                    {collapsedEntries.has(e.id) ? (
                      <ChevronDown className="size-3.5" />
                    ) : (
                      <ChevronUp className="size-3.5" />
                    )}
                  </Button>
                </p>
                {!collapsedEntries.has(e.id) && (
                  <>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor={`edu-${e.id}-degree`}>Degree and major</Label>
                    <Input
                      id={`edu-${e.id}-degree`}
                      placeholder="Degree (B.S. Computer Science)"
                      onKeyDown={markShortcutKeyDown}
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
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`edu-${e.id}-school`}>Where did you study?</Label>
                    <Input
                      id={`edu-${e.id}-school`}
                      placeholder="School"
                      onKeyDown={markShortcutKeyDown}
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
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`edu-${e.id}-location`}>
                      {e.school.trim()
                        ? `Where is ${e.school.trim()} located?`
                        : 'Where is it located?'}
                    </Label>
                    <Input
                      id={`edu-${e.id}-location`}
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
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`edu-${e.id}-start`}>When did you study?</Label>
                    <div className="grid grid-cols-2 gap-2">
                    <MonthYearField
                      id={`edu-${e.id}-start`}
                      placeholder="Start (2017)"
                      value={e.startDate}
                      onChange={(v) =>
                        setResume((r) => ({
                          ...r,
                          education: r.education.map((x) =>
                            x.id === e.id ? { ...x, startDate: v } : x
                          ),
                        }))
                      }
                    />
                    <MonthYearField
                      allowPresent
                      placeholder="End (2021)"
                      value={e.endDate}
                      onChange={(v) =>
                        setResume((r) => ({
                          ...r,
                          education: r.education.map((x) =>
                            x.id === e.id ? { ...x, endDate: v } : x
                          ),
                        }))
                      }
                    />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="GPA (3.8/4.0 — optional)"
                    value={e.gpa ?? ''}
                    onChange={(ev) =>
                      setResume((r) => ({
                        ...r,
                        education: r.education.map((x) =>
                          x.id === e.id ? { ...x, gpa: ev.target.value } : x
                        ),
                      }))
                    }
                  />
                  <Input
                    placeholder="Minor (Mathematics — optional)"
                    value={e.minor ?? ''}
                    onChange={(ev) =>
                      setResume((r) => ({
                        ...r,
                        education: r.education.map((x) =>
                          x.id === e.id ? { ...x, minor: ev.target.value } : x
                        ),
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <Input
                    placeholder="Details (honors, thesis — optional)"
                    onKeyDown={markShortcutKeyDown}
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
                    className="h-9 shrink-0"
                    title="Save education to library — reuse it in other resume copies"
                    aria-label={`Save education ${idx + 1} to library`}
                    disabled={!e.school.trim() && !e.degree.trim() && !e.details.trim()}
                    onClick={() => {
                      setEduLibrary(saveEducationToLibrary(e))
                      setEduLibrarySavedId(e.id)
                      window.setTimeout(() => setEduLibrarySavedId((v) => (v === e.id ? null : v)), 1600)
                    }}
                  >
                    {eduLibrarySavedId === e.id ? (
                      <Check className="size-3.5 text-green-600" />
                    ) : (
                      <BookmarkPlus className="size-3.5" />
                    )}
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
                  </>
                )}
              </div>
            ))}
            <div className="flex flex-wrap items-center gap-2">
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
              {eduLibrary.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  title="Insert an education entry you saved from any resume copy"
                  onClick={() => setEduLibraryOpen((v) => !v)}
                >
                  <Bookmark className="size-4" /> From library ({eduLibrary.length})
                </Button>
              )}
            </div>
            {eduLibraryOpen && eduLibrary.length > 0 && (
              <div className="min-w-0 space-y-2 overflow-hidden rounded-lg border p-3">
                <p className="text-muted-foreground text-xs font-medium">Saved education</p>
                {eduLibrary.map((s) => (
                  <div key={s.id} className="flex min-w-0 items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm">
                        {[s.data.degree, s.data.school].filter((x) => x.trim()).join(' — ') ||
                          'Untitled education'}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        Saved {new Date(s.savedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-10 text-xs sm:h-7"
                        onClick={() =>
                          setResume((r) => ({
                            ...r,
                            education: [
                              ...r.education.filter(
                                (x) => x.school.trim() || x.degree.trim() || x.details.trim()
                              ),
                              { ...s.data, id: newId() },
                            ],
                          }))
                        }
                      >
                        Insert
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive h-10 sm:h-7"
                        title="Remove from library"
                        aria-label={`Remove saved education ${[s.data.degree, s.data.school].filter((x) => x.trim()).join(' — ') || 'Untitled education'}`}
                        onClick={() => setEduLibrary(deleteLibraryEducation(s.id))}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section
            title="Projects (optional)"
            icon={<FileText className="size-4" />}
            defaultOpen={false}
            anchor="projects"
          >
            {resume.projects.map((p, pIdx) => (
              <div
                key={p.id}
                className={`space-y-2 rounded-lg border p-3 ${p.hidden ? 'opacity-60' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-muted-foreground flex min-w-0 items-center gap-1 text-xs font-medium">
                    <span className="shrink-0">Project {pIdx + 1}</span>
                    {p.name.trim() && (
                      <span className="text-foreground min-w-0 truncate font-normal">
                        — {p.name.trim()}
                      </span>
                    )}
                    {p.hidden && (
                      <span className="bg-muted text-muted-foreground shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase">
                        Hidden
                      </span>
                    )}
                    <EntryAuditChip
                      findings={bulletFindings(p.description.split('\n'), false)}
                      filled={Boolean(p.name.trim())}
                      checks={BULLET_CATEGORIES}
                      expandable={collapsedEntries.has(p.id)}
                      onExpand={() => toggleEntry(p.id)}
                      label={`Project ${pIdx + 1}`}
                    />
                  </p>
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
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-10 sm:h-7"
                      title="Save project to library — reuse it in other resume copies"
                      aria-label={`Save project ${pIdx + 1} to library`}
                      disabled={!p.name.trim() && !p.link.trim() && !p.description.trim()}
                      onClick={() => {
                        setProjLibrary(saveProjectToLibrary(p))
                        setProjLibrarySavedId(p.id)
                        window.setTimeout(
                          () => setProjLibrarySavedId((v) => (v === p.id ? null : v)),
                          1600
                        )
                      }}
                    >
                      {projLibrarySavedId === p.id ? (
                        <Check className="size-3.5 text-green-600" />
                      ) : (
                        <BookmarkPlus className="size-3.5" />
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-10 sm:h-7"
                      title={p.hidden ? 'Show on resume' : 'Hide from resume — kept here, left out of the resume'}
                      aria-pressed={p.hidden === true}
                      aria-label={`${p.hidden ? 'Show' : 'Hide'} project ${pIdx + 1} ${p.hidden ? 'on' : 'from'} resume`}
                      onClick={() =>
                        setResume((r) => ({
                          ...r,
                          projects: r.projects.map((x) =>
                            x.id === p.id ? { ...x, hidden: !x.hidden } : x
                          ),
                        }))
                      }
                    >
                      {p.hidden ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-10 sm:h-7"
                      title={collapsedEntries.has(p.id) ? 'Expand project' : 'Collapse project'}
                      aria-expanded={!collapsedEntries.has(p.id)}
                      aria-label={`${collapsedEntries.has(p.id) ? 'Expand' : 'Collapse'} project ${pIdx + 1}`}
                      onClick={() => toggleEntry(p.id)}
                    >
                      {collapsedEntries.has(p.id) ? (
                        <ChevronDown className="size-3.5" />
                      ) : (
                        <ChevronUp className="size-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
                {!collapsedEntries.has(p.id) && (
                  <>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Input
                    placeholder="Project name"
                    onKeyDown={markShortcutKeyDown}
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
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Organization (optional)"
                    onKeyDown={markShortcutKeyDown}
                    value={p.org ?? ''}
                    onChange={(ev) =>
                      setResume((r) => ({
                        ...r,
                        projects: r.projects.map((x) =>
                          x.id === p.id ? { ...x, org: ev.target.value } : x
                        ),
                      }))
                    }
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <MonthYearField
                      placeholder="Start (2024)"
                      value={p.startDate ?? ''}
                      onChange={(v) =>
                        setResume((r) => ({
                          ...r,
                          projects: r.projects.map((x) =>
                            x.id === p.id ? { ...x, startDate: v } : x
                          ),
                        }))
                      }
                    />
                    <MonthYearField
                      allowPresent
                      placeholder="End"
                      value={p.endDate ?? ''}
                      onChange={(v) =>
                        setResume((r) => ({
                          ...r,
                          projects: r.projects.map((x) =>
                            x.id === p.id ? { ...x, endDate: v } : x
                          ),
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="flex items-start justify-between gap-2">
                  <LintedTextarea
                    rows={2}
                    placeholder="What it does and your impact"
                    value={p.description}
                    highlightLine={hlLine?.key === `proj-${p.id}` ? hlLine.line : null}
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
                <BulletGuidance
                  bullets={p.description.split('\n')}
                  onHoverLine={(n) => setHlLine(n === null ? null : { key: `proj-${p.id}`, line: n })}
                  busyLine={
                    aiBusy?.startsWith(`proj-${p.id}-line-`)
                      ? Number(aiBusy.slice(`proj-${p.id}-line-`.length))
                      : null
                  }
                  onFix={(idx) =>
                    void runRewrite(
                      `proj-${p.id}-line-${idx}`,
                      'bullets',
                      p.description.split('\n')[idx] ?? '',
                      (out) =>
                        setResume((r) => ({
                          ...r,
                          projects: r.projects.map((x) =>
                            x.id === p.id
                              ? {
                                  ...x,
                                  description: x.description
                                    .split('\n')
                                    .map((b, i) =>
                                      i === idx
                                        ? (out.split('\n')[0] ?? '')
                                            .replace(/^[-•]\s*/, '')
                                            .trim() || b
                                        : b
                                    )
                                    .join('\n'),
                                }
                              : x
                          ),
                        }))
                    )
                  }
                />
                <div className="flex flex-wrap items-center gap-2">
                {aiButton(
                  `proj-${p.id}-suggest`,
                  'Suggest a bullet',
                  () => void runSuggestBullet('proj', p.id),
                  !p.name.trim() &&
                    !(p.org ?? '').trim() &&
                    'Add a project name or organization first — the bullet is drafted for that project.'
                )}
                {aiButton(
                  `proj-${p.id}-suggest-nums`,
                  '…with key numbers',
                  () => void runSuggestBullet('proj', p.id, 'key-numbers'),
                  !p.name.trim() &&
                    !(p.org ?? '').trim() &&
                    'Add a project name or organization first — the bullet is drafted for that project.'
                )}
                {aiButton(
                  `proj-${p.id}`,
                  'AI rewrite bullets',
                  () =>
                    void runRewrite(
                      `proj-${p.id}`,
                      'bullets',
                      p.description
                        .split('\n')
                        .filter((b) => b.trim())
                        .join('\n'),
                      (out) =>
                        setResume((r) => ({
                          ...r,
                          projects: r.projects.map((x) =>
                            x.id === p.id
                              ? {
                                  ...x,
                                  description: out
                                    .split('\n')
                                    .map((l) => l.replace(/^[-•]\s*/, '').trim())
                                    .filter(Boolean)
                                    .join('\n'),
                                }
                              : x
                          ),
                        }))
                    ),
                  !p.description.trim() &&
                    'Write a rough bullet first — the AI rewrites your draft, it never invents experience.'
                )}
                {aiButton(
                  `proj-${p.id}-nums`,
                  '…with key numbers',
                  () =>
                    void runRewrite(
                      `proj-${p.id}-nums`,
                      'bullets',
                      p.description
                        .split('\n')
                        .filter((b) => b.trim())
                        .join('\n'),
                      (out) =>
                        setResume((r) => ({
                          ...r,
                          projects: r.projects.map((x) =>
                            x.id === p.id
                              ? {
                                  ...x,
                                  description: out
                                    .split('\n')
                                    .map((l) => l.replace(/^[-•]\s*/, '').trim())
                                    .filter(Boolean)
                                    .join('\n'),
                                }
                              : x
                          ),
                        })),
                      'key-numbers'
                    ),
                  !p.description.trim() &&
                    'Write a rough bullet first — the AI rewrites your draft, it never invents experience.'
                )}
                </div>
                  </>
                )}
              </div>
            ))}
            <div className="flex flex-wrap items-center gap-2">
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
              {projLibrary.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  title="Insert a project you saved from any resume copy"
                  onClick={() => setProjLibraryOpen((v) => !v)}
                >
                  <Bookmark className="size-4" /> From library ({projLibrary.length})
                </Button>
              )}
            </div>
            {projLibraryOpen && projLibrary.length > 0 && (
              <div className="min-w-0 space-y-2 overflow-hidden rounded-lg border p-3">
                <p className="text-muted-foreground text-xs font-medium">Saved projects</p>
                {projLibrary.map((s) => (
                  <div key={s.id} className="flex min-w-0 items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm">
                        {s.data.name.trim() ||
                          s.data.description.split('\n').map((l) => l.trim()).filter(Boolean)[0] ||
                          'Untitled project'}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        Saved {new Date(s.savedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-10 text-xs sm:h-7"
                        onClick={() =>
                          setResume((r) => ({
                            ...r,
                            projects: [
                              ...r.projects.filter(
                                (x) => x.name.trim() || x.link.trim() || x.description.trim()
                              ),
                              { ...s.data, id: newId() },
                            ],
                          }))
                        }
                      >
                        Insert
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive h-10 sm:h-7"
                        title="Remove from library"
                        aria-label={`Remove saved project ${s.data.name.trim() || 'Untitled project'}`}
                        onClick={() => setProjLibrary(deleteLibraryProject(s.id))}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section
            title="Involvement"
            icon={<Users className="size-4" />}
            anchor="involvement"
            hidden={!sectionShown('involvement')}
          >
            <p className="text-muted-foreground text-xs">
              Campus or community organizations — clubs, societies, volunteering.
            </p>
            {(resume.involvement ?? []).map((inv, invIdx) => (
              <div
                key={inv.id}
                className={`space-y-2 rounded-lg border p-3 ${inv.hidden ? 'opacity-60' : ''}`}
              >
                {inv.hidden && (
                  <p className="text-muted-foreground text-[10px] font-semibold uppercase">
                    Hidden — left out of the resume
                  </p>
                )}
                <div className="grid gap-2 sm:grid-cols-2">
                  <Input
                    placeholder="Role (e.g. Selected Member)"
                    onKeyDown={markShortcutKeyDown}
                    value={inv.role}
                    onChange={(ev) =>
                      setResume((r) => ({
                        ...r,
                        involvement: (r.involvement ?? []).map((x) =>
                          x.id === inv.id ? { ...x, role: ev.target.value } : x
                        ),
                      }))
                    }
                  />
                  <Input
                    placeholder="Organization"
                    onKeyDown={markShortcutKeyDown}
                    value={inv.organization}
                    onChange={(ev) =>
                      setResume((r) => ({
                        ...r,
                        involvement: (r.involvement ?? []).map((x) =>
                          x.id === inv.id ? { ...x, organization: ev.target.value } : x
                        ),
                      }))
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="College or city (optional)"
                    value={inv.location}
                    onChange={(ev) =>
                      setResume((r) => ({
                        ...r,
                        involvement: (r.involvement ?? []).map((x) =>
                          x.id === inv.id ? { ...x, location: ev.target.value } : x
                        ),
                      }))
                    }
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <MonthYearField
                      placeholder="Start (2024)"
                      value={inv.startDate}
                      onChange={(v) =>
                        setResume((r) => ({
                          ...r,
                          involvement: (r.involvement ?? []).map((x) =>
                            x.id === inv.id ? { ...x, startDate: v } : x
                          ),
                        }))
                      }
                    />
                    <MonthYearField
                      allowPresent
                      placeholder="End"
                      value={inv.endDate}
                      onChange={(v) =>
                        setResume((r) => ({
                          ...r,
                          involvement: (r.involvement ?? []).map((x) =>
                            x.id === inv.id ? { ...x, endDate: v } : x
                          ),
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="flex items-start justify-between gap-2">
                  <LintedTextarea
                    rows={2}
                    placeholder="What you did there — one bullet per line"
                    value={inv.description}
                    highlightLine={hlLine?.key === `inv-${inv.id}` ? hlLine.line : null}
                    onChange={(ev) =>
                      setResume((r) => ({
                        ...r,
                        involvement: (r.involvement ?? []).map((x) =>
                          x.id === inv.id ? { ...x, description: ev.target.value } : x
                        ),
                      }))
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="min-h-10 shrink-0 sm:min-h-9"
                    title={inv.hidden ? 'Show on resume' : 'Hide from resume — kept here, left out of the resume'}
                    aria-pressed={inv.hidden === true}
                    aria-label={`${inv.hidden ? 'Show' : 'Hide'} involvement ${invIdx + 1} ${inv.hidden ? 'on' : 'from'} resume`}
                    onClick={() =>
                      setResume((r) => ({
                        ...r,
                        involvement: (r.involvement ?? []).map((x) =>
                          x.id === inv.id ? { ...x, hidden: !x.hidden } : x
                        ),
                      }))
                    }
                  >
                    {inv.hidden ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="min-h-10 shrink-0 sm:min-h-9"
                    title="Save involvement to library — reuse it in other resume copies"
                    aria-label={`Save involvement ${invIdx + 1} to library`}
                    disabled={
                      !inv.role.trim() && !inv.organization.trim() && !inv.description.trim()
                    }
                    onClick={() => {
                      setInvLibrary(saveInvolvementToLibrary(inv))
                      setInvLibrarySavedId(inv.id)
                      window.setTimeout(
                        () => setInvLibrarySavedId((v) => (v === inv.id ? null : v)),
                        1600
                      )
                    }}
                  >
                    {invLibrarySavedId === inv.id ? (
                      <Check className="size-3.5 text-green-600" />
                    ) : (
                      <BookmarkPlus className="size-3.5" />
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive min-h-10 shrink-0 sm:min-h-9"
                    title="Delete involvement"
                    aria-label="Delete involvement"
                    onClick={() =>
                      setResume((r) => ({
                        ...r,
                        involvement: (r.involvement ?? []).filter((x) => x.id !== inv.id),
                      }))
                    }
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
                <BulletGuidance
                  bullets={inv.description.split('\n')}
                  onHoverLine={(n) => setHlLine(n === null ? null : { key: `inv-${inv.id}`, line: n })}
                  busyLine={
                    aiBusy?.startsWith(`inv-${inv.id}-line-`)
                      ? Number(aiBusy.slice(`inv-${inv.id}-line-`.length))
                      : null
                  }
                  onFix={(idx) =>
                    void runRewrite(
                      `inv-${inv.id}-line-${idx}`,
                      'bullets',
                      inv.description.split('\n')[idx] ?? '',
                      (out) =>
                        setResume((r) => ({
                          ...r,
                          involvement: (r.involvement ?? []).map((x) =>
                            x.id === inv.id
                              ? {
                                  ...x,
                                  description: x.description
                                    .split('\n')
                                    .map((b, i) =>
                                      i === idx
                                        ? (out.split('\n')[0] ?? '')
                                            .replace(/^[-•]\s*/, '')
                                            .trim() || b
                                        : b
                                    )
                                    .join('\n'),
                                }
                              : x
                          ),
                        }))
                    )
                  }
                />
                <div className="flex flex-wrap items-center gap-2">
                {aiButton(
                  `inv-${inv.id}-suggest`,
                  'Suggest a bullet',
                  () => void runSuggestBullet('inv', inv.id),
                  !inv.role.trim() &&
                    !inv.organization.trim() &&
                    'Add a role or organization first — the bullet is drafted for that involvement.'
                )}
                {aiButton(
                  `inv-${inv.id}-suggest-nums`,
                  '…with key numbers',
                  () => void runSuggestBullet('inv', inv.id, 'key-numbers'),
                  !inv.role.trim() &&
                    !inv.organization.trim() &&
                    'Add a role or organization first — the bullet is drafted for that involvement.'
                )}
                {aiButton(
                  `inv-${inv.id}`,
                  'AI rewrite bullets',
                  () =>
                    void runRewrite(
                      `inv-${inv.id}`,
                      'bullets',
                      inv.description
                        .split('\n')
                        .filter((b) => b.trim())
                        .join('\n'),
                      (out) =>
                        setResume((r) => ({
                          ...r,
                          involvement: (r.involvement ?? []).map((x) =>
                            x.id === inv.id
                              ? {
                                  ...x,
                                  description: out
                                    .split('\n')
                                    .map((l) => l.replace(/^[-•]\s*/, '').trim())
                                    .filter(Boolean)
                                    .join('\n'),
                                }
                              : x
                          ),
                        }))
                    ),
                  !inv.description.trim() &&
                    'Write a rough bullet first — the AI rewrites your draft, it never invents experience.'
                )}
                {aiButton(
                  `inv-${inv.id}-nums`,
                  '…with key numbers',
                  () =>
                    void runRewrite(
                      `inv-${inv.id}-nums`,
                      'bullets',
                      inv.description
                        .split('\n')
                        .filter((b) => b.trim())
                        .join('\n'),
                      (out) =>
                        setResume((r) => ({
                          ...r,
                          involvement: (r.involvement ?? []).map((x) =>
                            x.id === inv.id
                              ? {
                                  ...x,
                                  description: out
                                    .split('\n')
                                    .map((l) => l.replace(/^[-•]\s*/, '').trim())
                                    .filter(Boolean)
                                    .join('\n'),
                                }
                              : x
                          ),
                        })),
                      'key-numbers'
                    ),
                  !inv.description.trim() &&
                    'Write a rough bullet first — the AI rewrites your draft, it never invents experience.'
                )}
                </div>
              </div>
            ))}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="min-h-10 sm:min-h-8"
                onClick={() =>
                  setResume((r) => ({
                    ...r,
                    involvement: [...(r.involvement ?? []), emptyInvolvement()],
                  }))
                }
              >
                <Plus className="size-4" /> Add involvement
              </Button>
              {invLibrary.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="min-h-10 sm:min-h-8"
                  title="Insert an involvement entry you saved from any resume copy"
                  onClick={() => setInvLibraryOpen((v) => !v)}
                >
                  <Bookmark className="size-4" /> From library ({invLibrary.length})
                </Button>
              )}
            </div>
            {invLibraryOpen && invLibrary.length > 0 && (
              <div className="min-w-0 space-y-2 overflow-hidden rounded-lg border p-3">
                <p className="text-muted-foreground text-xs font-medium">Saved involvement</p>
                {invLibrary.map((s) => (
                  <div key={s.id} className="flex min-w-0 items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm">
                        {[s.data.role, s.data.organization]
                          .filter((x) => x.trim())
                          .join(' — ') || 'Untitled involvement'}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        Saved {new Date(s.savedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-10 text-xs sm:h-7"
                        onClick={() =>
                          setResume((r) => ({
                            ...r,
                            involvement: [
                              ...(r.involvement ?? []).filter(
                                (x) =>
                                  x.role.trim() || x.organization.trim() || x.description.trim()
                              ),
                              { ...s.data, id: newId() },
                            ],
                          }))
                        }
                      >
                        Insert
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive h-10 sm:h-7"
                        title="Remove from library"
                        aria-label={`Remove saved involvement ${[s.data.role, s.data.organization].filter((x) => x.trim()).join(' — ') || 'Untitled involvement'}`}
                        onClick={() => setInvLibrary(deleteLibraryInvolvement(s.id))}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section
            title="Coursework"
            icon={<BookOpen className="size-4" />}
            anchor="coursework"
            hidden={!sectionShown('coursework')}
          >
            <p className="text-muted-foreground text-xs">
              Relevant courses — useful when you have little work experience.
            </p>
            {(resume.coursework ?? []).map((cw, cwIdx) => (
              <div
                key={cw.id}
                className={`space-y-2 rounded-lg border p-3 ${cw.hidden ? 'opacity-60' : ''}`}
              >
                {cw.hidden && (
                  <p className="text-muted-foreground text-[10px] font-semibold uppercase">
                    Hidden — left out of the resume
                  </p>
                )}
                <div className="grid gap-2 sm:grid-cols-2">
                  <Input
                    placeholder="Course name (e.g. Intro to Computer Systems)"
                    onKeyDown={markShortcutKeyDown}
                    value={cw.name}
                    onChange={(ev) =>
                      setResume((r) => ({
                        ...r,
                        coursework: (r.coursework ?? []).map((x) =>
                          x.id === cw.id ? { ...x, name: ev.target.value } : x
                        ),
                      }))
                    }
                  />
                  <div className="grid grid-cols-[1fr_5rem] gap-2">
                    <Input
                      placeholder="Where (school or platform)"
                      onKeyDown={markShortcutKeyDown}
                      value={cw.institution}
                      onChange={(ev) =>
                        setResume((r) => ({
                          ...r,
                          coursework: (r.coursework ?? []).map((x) =>
                            x.id === cw.id ? { ...x, institution: ev.target.value } : x
                          ),
                        }))
                      }
                    />
                    <Input
                      placeholder="When"
                      value={cw.date}
                      onChange={(ev) =>
                        setResume((r) => ({
                          ...r,
                          coursework: (r.coursework ?? []).map((x) =>
                            x.id === cw.id ? { ...x, date: ev.target.value } : x
                          ),
                        }))
                      }
                    />
                  </div>
                </div>
                <Input
                  placeholder="Skills used (optional, up to 3 — e.g. Teamwork, SQL)"
                  onKeyDown={markShortcutKeyDown}
                  value={cw.skill}
                  onChange={(ev) =>
                    setResume((r) => ({
                      ...r,
                      coursework: (r.coursework ?? []).map((x) =>
                        x.id === cw.id ? { ...x, skill: ev.target.value } : x
                      ),
                    }))
                  }
                />
                {cw.skill.split(',').filter((s) => s.trim()).length > 3 && (
                  <p className="text-muted-foreground text-xs">
                    Only the first 3 skills appear on the resume.
                  </p>
                )}
                <div className="flex items-start justify-between gap-2">
                  <Textarea
                    rows={2}
                    placeholder="How you applied it — one bullet per line"
                    onKeyDown={markShortcutKeyDown}
                    value={cw.description}
                    onChange={(ev) =>
                      setResume((r) => ({
                        ...r,
                        coursework: (r.coursework ?? []).map((x) =>
                          x.id === cw.id ? { ...x, description: ev.target.value } : x
                        ),
                      }))
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="min-h-10 shrink-0 sm:min-h-9"
                    title={cw.hidden ? 'Show on resume' : 'Hide from resume — kept here, left out of the resume'}
                    aria-pressed={cw.hidden === true}
                    aria-label={`${cw.hidden ? 'Show' : 'Hide'} coursework ${cwIdx + 1} ${cw.hidden ? 'on' : 'from'} resume`}
                    onClick={() =>
                      setResume((r) => ({
                        ...r,
                        coursework: (r.coursework ?? []).map((x) =>
                          x.id === cw.id ? { ...x, hidden: !x.hidden } : x
                        ),
                      }))
                    }
                  >
                    {cw.hidden ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="min-h-10 shrink-0 sm:min-h-9"
                    title="Save coursework to library — reuse it in other resume copies"
                    aria-label={`Save coursework ${cwIdx + 1} to library`}
                    disabled={
                      !cw.name.trim() && !cw.institution.trim() && !cw.description.trim()
                    }
                    onClick={() => {
                      setCwLibrary(saveCourseworkToLibrary(cw))
                      setCwLibrarySavedId(cw.id)
                      window.setTimeout(
                        () => setCwLibrarySavedId((v) => (v === cw.id ? null : v)),
                        1600
                      )
                    }}
                  >
                    {cwLibrarySavedId === cw.id ? (
                      <Check className="size-3.5 text-green-600" />
                    ) : (
                      <BookmarkPlus className="size-3.5" />
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive min-h-10 shrink-0 sm:min-h-9"
                    title="Delete coursework"
                    aria-label="Delete coursework"
                    onClick={() =>
                      setResume((r) => ({
                        ...r,
                        coursework: (r.coursework ?? []).filter((x) => x.id !== cw.id),
                      }))
                    }
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            ))}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="min-h-10 sm:min-h-8"
                onClick={() =>
                  setResume((r) => ({
                    ...r,
                    coursework: [...(r.coursework ?? []), emptyCoursework()],
                  }))
                }
              >
                <Plus className="size-4" /> Add coursework
              </Button>
              {cwLibrary.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="min-h-10 sm:min-h-8"
                  title="Insert a coursework entry you saved from any resume copy"
                  onClick={() => setCwLibraryOpen((v) => !v)}
                >
                  <Bookmark className="size-4" /> From library ({cwLibrary.length})
                </Button>
              )}
            </div>
            {cwLibraryOpen && cwLibrary.length > 0 && (
              <div className="min-w-0 space-y-2 overflow-hidden rounded-lg border p-3">
                <p className="text-muted-foreground text-xs font-medium">Saved coursework</p>
                {cwLibrary.map((s) => (
                  <div key={s.id} className="flex min-w-0 items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm">
                        {[s.data.name, s.data.institution]
                          .filter((x) => x.trim())
                          .join(' — ') || 'Untitled course'}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        Saved {new Date(s.savedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-10 text-xs sm:h-7"
                        onClick={() =>
                          setResume((r) => ({
                            ...r,
                            coursework: [
                              ...(r.coursework ?? []).filter(
                                (x) =>
                                  x.name.trim() || x.institution.trim() || x.description.trim()
                              ),
                              { ...s.data, id: newId() },
                            ],
                          }))
                        }
                      >
                        Insert
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive h-10 sm:h-7"
                        title="Remove from library"
                        aria-label={`Remove saved coursework ${[s.data.name, s.data.institution].filter((x) => x.trim()).join(' — ') || 'Untitled course'}`}
                        onClick={() => setCwLibrary(deleteLibraryCoursework(s.id))}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section
            title="Awards & honors"
            icon={<Award className="size-4" />}
            anchor="awards"
            hidden={!sectionShown('awards')}
          >
            <p className="text-muted-foreground text-xs">
              Awards, honors and recognitions that back up your track record.
            </p>
            {(resume.awards ?? []).map((a, aIdx) => (
              <div
                key={a.id}
                className={`space-y-2 rounded-lg border p-3 ${a.hidden ? 'opacity-60' : ''}`}
              >
                {a.hidden && (
                  <p className="text-muted-foreground text-[10px] font-semibold uppercase">
                    Hidden — left out of the resume
                  </p>
                )}
                <div className="grid gap-2 sm:grid-cols-2">
                  <Input
                    placeholder="Award name (e.g. Dean's List)"
                    onKeyDown={markShortcutKeyDown}
                    value={a.name}
                    onChange={(ev) =>
                      setResume((r) => ({
                        ...r,
                        awards: (r.awards ?? []).map((x) =>
                          x.id === a.id ? { ...x, name: ev.target.value } : x
                        ),
                      }))
                    }
                  />
                  <div className="grid grid-cols-[1fr_5rem] gap-2">
                    <Input
                      placeholder="Awarded by (organization)"
                      onKeyDown={markShortcutKeyDown}
                      value={a.organization}
                      onChange={(ev) =>
                        setResume((r) => ({
                          ...r,
                          awards: (r.awards ?? []).map((x) =>
                            x.id === a.id ? { ...x, organization: ev.target.value } : x
                          ),
                        }))
                      }
                    />
                    <Input
                      placeholder="When"
                      value={a.date}
                      onChange={(ev) =>
                        setResume((r) => ({
                          ...r,
                          awards: (r.awards ?? []).map((x) =>
                            x.id === a.id ? { ...x, date: ev.target.value } : x
                          ),
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="flex items-start justify-between gap-2">
                  <Textarea
                    rows={2}
                    placeholder="Why it's relevant — one bullet per line"
                    onKeyDown={markShortcutKeyDown}
                    value={a.description}
                    onChange={(ev) =>
                      setResume((r) => ({
                        ...r,
                        awards: (r.awards ?? []).map((x) =>
                          x.id === a.id ? { ...x, description: ev.target.value } : x
                        ),
                      }))
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="min-h-10 shrink-0 sm:min-h-9"
                    title={a.hidden ? 'Show on resume' : 'Hide from resume — kept here, left out of the resume'}
                    aria-pressed={a.hidden === true}
                    aria-label={`${a.hidden ? 'Show' : 'Hide'} award ${aIdx + 1} ${a.hidden ? 'on' : 'from'} resume`}
                    onClick={() =>
                      setResume((r) => ({
                        ...r,
                        awards: (r.awards ?? []).map((x) =>
                          x.id === a.id ? { ...x, hidden: !x.hidden } : x
                        ),
                      }))
                    }
                  >
                    {a.hidden ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="min-h-10 shrink-0 sm:min-h-9"
                    title="Save award to library — reuse it in other resume copies"
                    aria-label={`Save award ${aIdx + 1} to library`}
                    disabled={
                      !a.name.trim() && !a.organization.trim() && !a.description.trim()
                    }
                    onClick={() => {
                      setAwardLibrary(saveAwardToLibrary(a))
                      setAwardLibrarySavedId(a.id)
                      window.setTimeout(
                        () => setAwardLibrarySavedId((v) => (v === a.id ? null : v)),
                        1600
                      )
                    }}
                  >
                    {awardLibrarySavedId === a.id ? (
                      <Check className="size-3.5 text-green-600" />
                    ) : (
                      <BookmarkPlus className="size-3.5" />
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive min-h-10 shrink-0 sm:min-h-9"
                    title="Delete award"
                    aria-label="Delete award"
                    onClick={() =>
                      setResume((r) => ({
                        ...r,
                        awards: (r.awards ?? []).filter((x) => x.id !== a.id),
                      }))
                    }
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            ))}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="min-h-10 sm:min-h-8"
                onClick={() =>
                  setResume((r) => ({
                    ...r,
                    awards: [...(r.awards ?? []), emptyAward()],
                  }))
                }
              >
                <Plus className="size-4" /> Add award
              </Button>
              {awardLibrary.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="min-h-10 sm:min-h-8"
                  title="Insert an award entry you saved from any resume copy"
                  onClick={() => setAwardLibraryOpen((v) => !v)}
                >
                  <Bookmark className="size-4" /> From library ({awardLibrary.length})
                </Button>
              )}
            </div>
            {awardLibraryOpen && awardLibrary.length > 0 && (
              <div className="min-w-0 space-y-2 overflow-hidden rounded-lg border p-3">
                <p className="text-muted-foreground text-xs font-medium">Saved awards</p>
                {awardLibrary.map((s) => (
                  <div key={s.id} className="flex min-w-0 items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm">
                        {[s.data.name, s.data.organization]
                          .filter((x) => x.trim())
                          .join(' — ') || 'Untitled award'}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        Saved {new Date(s.savedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-10 text-xs sm:h-7"
                        onClick={() =>
                          setResume((r) => ({
                            ...r,
                            awards: [
                              ...(r.awards ?? []).filter(
                                (x) =>
                                  x.name.trim() || x.organization.trim() || x.description.trim()
                              ),
                              { ...s.data, id: newId() },
                            ],
                          }))
                        }
                      >
                        Insert
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive h-10 sm:h-7"
                        title="Remove from library"
                        aria-label={`Remove saved award ${[s.data.name, s.data.organization].filter((x) => x.trim()).join(' — ') || 'Untitled award'}`}
                        onClick={() => setAwardLibrary(deleteLibraryAward(s.id))}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section
            title="Publications"
            icon={<BookText className="size-4" />}
            anchor="publications"
            hidden={!sectionShown('publications')}
          >
            <p className="text-muted-foreground text-xs">
              Papers, articles and talks — with the journal or conference they appeared in.
            </p>
            <datalist id="publication-kinds">
              <option value="Journal Article" />
              <option value="Conference Paper" />
              <option value="Book" />
              <option value="Book Chapter" />
              <option value="Thesis" />
              <option value="Patent" />
              <option value="Preprint" />
              <option value="Magazine Article" />
              <option value="Blog Post" />
            </datalist>
            {(resume.publications ?? []).map((pub, pubIdx) => (
              <div
                key={pub.id}
                className={`space-y-2 rounded-lg border p-3 ${pub.hidden ? 'opacity-60' : ''}`}
              >
                {pub.hidden && (
                  <p className="text-muted-foreground text-[10px] font-semibold uppercase">
                    Hidden — left out of the resume
                  </p>
                )}
                <div className="grid gap-2 sm:grid-cols-2">
                  <Input
                    placeholder="Publication title"
                    onKeyDown={markShortcutKeyDown}
                    value={pub.title}
                    onChange={(ev) =>
                      setResume((r) => ({
                        ...r,
                        publications: (r.publications ?? []).map((x) =>
                          x.id === pub.id ? { ...x, title: ev.target.value } : x
                        ),
                      }))
                    }
                  />
                  <div className="grid grid-cols-[1fr_5rem] gap-2">
                    <Input
                      placeholder="Journal / conference"
                      onKeyDown={markShortcutKeyDown}
                      value={pub.venue}
                      onChange={(ev) =>
                        setResume((r) => ({
                          ...r,
                          publications: (r.publications ?? []).map((x) =>
                            x.id === pub.id ? { ...x, venue: ev.target.value } : x
                          ),
                        }))
                      }
                    />
                    <Input
                      placeholder="When"
                      value={pub.date}
                      onChange={(ev) =>
                        setResume((r) => ({
                          ...r,
                          publications: (r.publications ?? []).map((x) =>
                            x.id === pub.id ? { ...x, date: ev.target.value } : x
                          ),
                        }))
                      }
                    />
                  </div>
                  <Input
                    placeholder="Type — e.g. Journal Article"
                    onKeyDown={markShortcutKeyDown}
                    list="publication-kinds"
                    value={pub.kind ?? ''}
                    onChange={(ev) =>
                      setResume((r) => ({
                        ...r,
                        publications: (r.publications ?? []).map((x) =>
                          x.id === pub.id ? { ...x, kind: ev.target.value || undefined } : x
                        ),
                      }))
                    }
                  />
                </div>
                <div className="flex items-start justify-between gap-2">
                  <Textarea
                    rows={2}
                    placeholder="Additional information — one bullet per line"
                    onKeyDown={markShortcutKeyDown}
                    value={pub.description}
                    onChange={(ev) =>
                      setResume((r) => ({
                        ...r,
                        publications: (r.publications ?? []).map((x) =>
                          x.id === pub.id ? { ...x, description: ev.target.value } : x
                        ),
                      }))
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="min-h-10 shrink-0 sm:min-h-9"
                    title={pub.hidden ? 'Show on resume' : 'Hide from resume — kept here, left out of the resume'}
                    aria-pressed={pub.hidden === true}
                    aria-label={`${pub.hidden ? 'Show' : 'Hide'} publication ${pubIdx + 1} ${pub.hidden ? 'on' : 'from'} resume`}
                    onClick={() =>
                      setResume((r) => ({
                        ...r,
                        publications: (r.publications ?? []).map((x) =>
                          x.id === pub.id ? { ...x, hidden: !x.hidden } : x
                        ),
                      }))
                    }
                  >
                    {pub.hidden ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="min-h-10 shrink-0 sm:min-h-9"
                    title="Save publication to library — reuse it in other resume copies"
                    aria-label={`Save publication ${pubIdx + 1} to library`}
                    disabled={
                      !pub.title.trim() &&
                      !pub.venue.trim() &&
                      !(pub.kind ?? '').trim() &&
                      !pub.description.trim()
                    }
                    onClick={() => {
                      setPubLibrary(savePublicationToLibrary(pub))
                      setPubLibrarySavedId(pub.id)
                      window.setTimeout(
                        () => setPubLibrarySavedId((v) => (v === pub.id ? null : v)),
                        1600
                      )
                    }}
                  >
                    {pubLibrarySavedId === pub.id ? (
                      <Check className="size-3.5 text-green-600" />
                    ) : (
                      <BookmarkPlus className="size-3.5" />
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive min-h-10 shrink-0 sm:min-h-9"
                    title="Delete publication"
                    aria-label="Delete publication"
                    onClick={() =>
                      setResume((r) => ({
                        ...r,
                        publications: (r.publications ?? []).filter((x) => x.id !== pub.id),
                      }))
                    }
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            ))}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="min-h-10 sm:min-h-8"
                onClick={() =>
                  setResume((r) => ({
                    ...r,
                    publications: [...(r.publications ?? []), emptyPublication()],
                  }))
                }
              >
                <Plus className="size-4" /> Add publication
              </Button>
              {pubLibrary.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="min-h-10 sm:min-h-8"
                  title="Insert a publication you saved from any resume copy"
                  onClick={() => setPubLibraryOpen((v) => !v)}
                >
                  <Bookmark className="size-4" /> From library ({pubLibrary.length})
                </Button>
              )}
            </div>
            {pubLibraryOpen && pubLibrary.length > 0 && (
              <div className="min-w-0 space-y-2 overflow-hidden rounded-lg border p-3">
                <p className="text-muted-foreground text-xs font-medium">Saved publications</p>
                {pubLibrary.map((s) => (
                  <div key={s.id} className="flex min-w-0 items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm">
                        {[s.data.title, s.data.venue]
                          .filter((x) => x.trim())
                          .join(' — ') || 'Untitled publication'}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        Saved {new Date(s.savedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-10 text-xs sm:h-7"
                        onClick={() =>
                          setResume((r) => ({
                            ...r,
                            publications: [
                              ...(r.publications ?? []).filter(
                                (x) =>
                                  x.title.trim() ||
                                  x.venue.trim() ||
                                  (x.kind ?? '').trim() ||
                                  x.description.trim()
                              ),
                              { ...s.data, id: newId() },
                            ],
                          }))
                        }
                      >
                        Insert
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive h-10 sm:h-7"
                        title="Remove from library"
                        aria-label={`Remove saved publication ${[s.data.title, s.data.venue].filter((x) => x.trim()).join(' — ') || 'Untitled publication'}`}
                        onClick={() => setPubLibrary(deleteLibraryPublication(s.id))}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section
            title="References"
            icon={<Contact className="size-4" />}
            anchor="references"
            hidden={!sectionShown('references')}
          >
            <p className="text-muted-foreground text-xs">
              People who can vouch for you — with their role and how to reach them.
            </p>
            {(resume.references ?? []).map((ref, refIdx) => (
              <div
                key={ref.id}
                className={`space-y-2 rounded-lg border p-3 ${ref.hidden ? 'opacity-60' : ''}`}
              >
                {ref.hidden && (
                  <p className="text-muted-foreground text-[10px] font-semibold uppercase">
                    Hidden — left out of the resume
                  </p>
                )}
                <div className="grid gap-2 sm:grid-cols-2">
                  <Input
                    placeholder="Full name"
                    onKeyDown={markShortcutKeyDown}
                    value={ref.name}
                    onChange={(ev) =>
                      setResume((r) => ({
                        ...r,
                        references: (r.references ?? []).map((x) =>
                          x.id === ref.id ? { ...x, name: ev.target.value } : x
                        ),
                      }))
                    }
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Job title"
                      onKeyDown={markShortcutKeyDown}
                      value={ref.title}
                      onChange={(ev) =>
                        setResume((r) => ({
                          ...r,
                          references: (r.references ?? []).map((x) =>
                            x.id === ref.id ? { ...x, title: ev.target.value } : x
                          ),
                        }))
                      }
                    />
                    <Input
                      placeholder="Employer"
                      onKeyDown={markShortcutKeyDown}
                      value={ref.employer}
                      onChange={(ev) =>
                        setResume((r) => ({
                          ...r,
                          references: (r.references ?? []).map((x) =>
                            x.id === ref.id ? { ...x, employer: ev.target.value } : x
                          ),
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Input
                    type="email"
                    placeholder="Email"
                    value={ref.email}
                    onChange={(ev) =>
                      setResume((r) => ({
                        ...r,
                        references: (r.references ?? []).map((x) =>
                          x.id === ref.id ? { ...x, email: ev.target.value } : x
                        ),
                      }))
                    }
                  />
                  <Input
                    placeholder="Phone"
                    value={ref.phone}
                    onChange={(ev) =>
                      setResume((r) => ({
                        ...r,
                        references: (r.references ?? []).map((x) =>
                          x.id === ref.id ? { ...x, phone: ev.target.value } : x
                        ),
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <select
                    aria-label="Reference type"
                    className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
                    value={ref.kind}
                    onChange={(ev) =>
                      setResume((r) => ({
                        ...r,
                        references: (r.references ?? []).map((x) =>
                          x.id === ref.id
                            ? { ...x, kind: ev.target.value as ReferenceKind }
                            : x
                        ),
                      }))
                    }
                  >
                    <option value="">Reference type (optional)</option>
                    <option value="professional">Professional</option>
                    <option value="personal">Personal</option>
                  </select>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="min-h-10 shrink-0 sm:min-h-9"
                    title={ref.hidden ? 'Show on resume' : 'Hide from resume — kept here, left out of the resume'}
                    aria-pressed={ref.hidden === true}
                    aria-label={`${ref.hidden ? 'Show' : 'Hide'} reference ${refIdx + 1} ${ref.hidden ? 'on' : 'from'} resume`}
                    onClick={() =>
                      setResume((r) => ({
                        ...r,
                        references: (r.references ?? []).map((x) =>
                          x.id === ref.id ? { ...x, hidden: !x.hidden } : x
                        ),
                      }))
                    }
                  >
                    {ref.hidden ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="min-h-10 shrink-0 sm:min-h-9"
                    title="Save reference to library — reuse it in other resume copies"
                    aria-label={`Save reference ${refIdx + 1} to library`}
                    disabled={
                      !ref.name.trim() && !ref.employer.trim() && !ref.email.trim()
                    }
                    onClick={() => {
                      setRefLibrary(saveReferenceToLibrary(ref))
                      setRefLibrarySavedId(ref.id)
                      window.setTimeout(
                        () => setRefLibrarySavedId((v) => (v === ref.id ? null : v)),
                        1600
                      )
                    }}
                  >
                    {refLibrarySavedId === ref.id ? (
                      <Check className="size-3.5 text-green-600" />
                    ) : (
                      <BookmarkPlus className="size-3.5" />
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive min-h-10 shrink-0 sm:min-h-9"
                    title="Delete reference"
                    aria-label="Delete reference"
                    onClick={() =>
                      setResume((r) => ({
                        ...r,
                        references: (r.references ?? []).filter((x) => x.id !== ref.id),
                      }))
                    }
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            ))}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="min-h-10 sm:min-h-8"
                onClick={() =>
                  setResume((r) => ({
                    ...r,
                    references: [...(r.references ?? []), emptyReference()],
                  }))
                }
              >
                <Plus className="size-4" /> Add reference
              </Button>
              {refLibrary.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="min-h-10 sm:min-h-8"
                  title="Insert a reference you saved from any resume copy"
                  onClick={() => setRefLibraryOpen((v) => !v)}
                >
                  <Bookmark className="size-4" /> From library ({refLibrary.length})
                </Button>
              )}
            </div>
            {refLibraryOpen && refLibrary.length > 0 && (
              <div className="min-w-0 space-y-2 overflow-hidden rounded-lg border p-3">
                <p className="text-muted-foreground text-xs font-medium">Saved references</p>
                {refLibrary.map((s) => (
                  <div key={s.id} className="flex min-w-0 items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm">
                        {[s.data.name, s.data.employer]
                          .filter((x) => x.trim())
                          .join(' — ') || 'Untitled reference'}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        Saved {new Date(s.savedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-10 text-xs sm:h-7"
                        onClick={() =>
                          setResume((r) => ({
                            ...r,
                            references: [
                              ...(r.references ?? []).filter(
                                (x) =>
                                  x.name.trim() || x.employer.trim() || x.email.trim()
                              ),
                              { ...s.data, id: newId() },
                            ],
                          }))
                        }
                      >
                        Insert
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive h-10 sm:h-7"
                        title="Remove from library"
                        aria-label={`Remove saved reference ${[s.data.name, s.data.employer].filter((x) => x.trim()).join(' — ') || 'Untitled reference'}`}
                        onClick={() => setRefLibrary(deleteLibraryReference(s.id))}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section
            title="Military service"
            icon={<Shield className="size-4" />}
            anchor="military"
            hidden={!sectionShown('military')}
          >
            <p className="text-muted-foreground text-xs">
              Your service record — rank, branch, where you were stationed and what you did.
            </p>
            {(resume.military ?? []).map((m) => (
              <div
                key={m.id}
                className={`space-y-2 rounded-lg border p-3 ${m.hidden ? 'opacity-60' : ''}`}
              >
                {m.hidden && (
                  <p className="text-muted-foreground text-[10px] font-semibold uppercase">
                    Hidden — left out of the resume
                  </p>
                )}
                <div className="grid gap-2 sm:grid-cols-2">
                  <Input
                    placeholder="Rank or position (e.g. Sergeant)"
                    onKeyDown={markShortcutKeyDown}
                    value={m.rank}
                    onChange={(ev) =>
                      setResume((r) => ({
                        ...r,
                        military: (r.military ?? []).map((x) =>
                          x.id === m.id ? { ...x, rank: ev.target.value } : x
                        ),
                      }))
                    }
                  />
                  <Input
                    placeholder="Branch (e.g. Army)"
                    onKeyDown={markShortcutKeyDown}
                    value={m.branch}
                    onChange={(ev) =>
                      setResume((r) => ({
                        ...r,
                        military: (r.military ?? []).map((x) =>
                          x.id === m.id ? { ...x, branch: ev.target.value } : x
                        ),
                      }))
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Stationed at (e.g. Fort Bragg, NC)"
                    onKeyDown={markShortcutKeyDown}
                    value={m.location}
                    onChange={(ev) =>
                      setResume((r) => ({
                        ...r,
                        military: (r.military ?? []).map((x) =>
                          x.id === m.id ? { ...x, location: ev.target.value } : x
                        ),
                      }))
                    }
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <MonthYearField
                      placeholder="Start (2020)"
                      value={m.startDate}
                      onChange={(v) =>
                        setResume((r) => ({
                          ...r,
                          military: (r.military ?? []).map((x) =>
                            x.id === m.id ? { ...x, startDate: v } : x
                          ),
                        }))
                      }
                    />
                    <MonthYearField
                      allowPresent
                      placeholder="End"
                      value={m.endDate}
                      onChange={(v) =>
                        setResume((r) => ({
                          ...r,
                          military: (r.military ?? []).map((x) =>
                            x.id === m.id ? { ...x, endDate: v } : x
                          ),
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="flex items-start justify-between gap-2">
                  <Textarea
                    rows={2}
                    placeholder="Responsibilities and accomplishments — one bullet per line"
                    onKeyDown={markShortcutKeyDown}
                    value={m.description}
                    onChange={(ev) =>
                      setResume((r) => ({
                        ...r,
                        military: (r.military ?? []).map((x) =>
                          x.id === m.id ? { ...x, description: ev.target.value } : x
                        ),
                      }))
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="min-h-10 shrink-0 sm:min-h-9"
                    title={m.hidden ? 'Show on resume' : 'Hide from resume — kept here, left out of the resume'}
                    aria-pressed={m.hidden === true}
                    aria-label={`${m.hidden ? 'Show' : 'Hide'} military service ${m.hidden ? 'on' : 'from'} resume`}
                    onClick={() =>
                      setResume((r) => ({
                        ...r,
                        military: (r.military ?? []).map((x) =>
                          x.id === m.id ? { ...x, hidden: !x.hidden } : x
                        ),
                      }))
                    }
                  >
                    {m.hidden ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive min-h-10 shrink-0 sm:min-h-9"
                    title="Delete military service"
                    aria-label="Delete military service"
                    onClick={() =>
                      setResume((r) => ({
                        ...r,
                        military: (r.military ?? []).filter((x) => x.id !== m.id),
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
              className="min-h-10 sm:min-h-8"
              onClick={() =>
                setResume((r) => ({
                  ...r,
                  military: [...(r.military ?? []), emptyMilitaryService()],
                }))
              }
            >
              <Plus className="size-4" /> Add military service
            </Button>
          </Section>

          <Section
            title="Agents"
            icon={<Bot className="size-4" />}
            anchor="agents"
            hidden={!sectionShown('agents')}
          >
            <p className="text-muted-foreground text-xs">
              AI agents you built — what they were called, when, and why they mattered.
            </p>
            {(resume.agents ?? []).map((a) => (
              <div
                key={a.id}
                className={`space-y-2 rounded-lg border p-3 ${a.hidden ? 'opacity-60' : ''}`}
              >
                {a.hidden && (
                  <p className="text-muted-foreground text-[10px] font-semibold uppercase">
                    Hidden — left out of the resume
                  </p>
                )}
                <div className="grid gap-2 sm:grid-cols-2">
                  <Input
                    placeholder="Agent name, e.g. Support Triage Agent"
                    onKeyDown={markShortcutKeyDown}
                    value={a.name}
                    onChange={(ev) =>
                      setResume((r) => ({
                        ...r,
                        agents: (r.agents ?? []).map((x) =>
                          x.id === a.id ? { ...x, name: ev.target.value } : x
                        ),
                      }))
                    }
                  />
                  <Input
                    placeholder="When built, e.g. 2026"
                    value={a.date}
                    onChange={(ev) =>
                      setResume((r) => ({
                        ...r,
                        agents: (r.agents ?? []).map((x) =>
                          x.id === a.id ? { ...x, date: ev.target.value } : x
                        ),
                      }))
                    }
                  />
                </div>
                <Input
                  placeholder="Skills used, e.g. Task Automation, Workflow Management"
                  onKeyDown={markShortcutKeyDown}
                  value={a.skills}
                  onChange={(ev) =>
                    setResume((r) => ({
                      ...r,
                      agents: (r.agents ?? []).map((x) =>
                        x.id === a.id ? { ...x, skills: ev.target.value } : x
                      ),
                    }))
                  }
                />
                <div className="flex items-start justify-between gap-2">
                  <Textarea
                    rows={2}
                    placeholder="How building the agent was relevant — one bullet per line"
                    onKeyDown={markShortcutKeyDown}
                    value={a.description}
                    onChange={(ev) =>
                      setResume((r) => ({
                        ...r,
                        agents: (r.agents ?? []).map((x) =>
                          x.id === a.id ? { ...x, description: ev.target.value } : x
                        ),
                      }))
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="min-h-10 shrink-0 sm:min-h-9"
                    title={a.hidden ? 'Show on resume' : 'Hide from resume — kept here, left out of the resume'}
                    aria-pressed={a.hidden === true}
                    aria-label={`${a.hidden ? 'Show' : 'Hide'} agent ${a.hidden ? 'on' : 'from'} resume`}
                    onClick={() =>
                      setResume((r) => ({
                        ...r,
                        agents: (r.agents ?? []).map((x) =>
                          x.id === a.id ? { ...x, hidden: !x.hidden } : x
                        ),
                      }))
                    }
                  >
                    {a.hidden ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive min-h-10 shrink-0 sm:min-h-9"
                    title="Delete agent"
                    aria-label="Delete agent"
                    onClick={() =>
                      setResume((r) => ({
                        ...r,
                        agents: (r.agents ?? []).filter((x) => x.id !== a.id),
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
              className="min-h-10 sm:min-h-8"
              onClick={() =>
                setResume((r) => ({
                  ...r,
                  agents: [...(r.agents ?? []), emptyAgent()],
                }))
              }
            >
              <Plus className="size-4" /> Add agent
            </Button>
          </Section>

          {OPTIONAL_SECTION_META.some((s) => !sectionShown(s.key)) && (
            <Card className="py-0">
              <CardContent className="p-4">
                <p className="flex items-center gap-2 font-medium">
                  <Plus className="size-4" />
                  Add a section
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  Optional sections appear here until you need them.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {OPTIONAL_SECTION_META.filter((s) => !sectionShown(s.key)).map((s) => (
                    <Button
                      key={s.key}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="min-h-10 sm:min-h-8"
                      onClick={() => jumpToSection(s.key)}
                    >
                      {s.icon} {s.label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Section title="Skills & certifications" icon={<Sparkles className="size-4" />} anchor="skills">
            <div className="space-y-1.5">
              <Label htmlFor="skills">Skills (comma-separated)</Label>
              <Textarea
                id="skills"
                rows={2}
                placeholder="React, TypeScript, Node.js, PostgreSQL, AWS…"
                onKeyDown={markShortcutKeyDown}
                value={resume.skills}
                onChange={(e) => set('skills', e.target.value)}
              />
              {resume.skills.split(/[,\n]/).filter((s) => s.trim()).length >= 8 &&
                !skillLines(resume).some((l) => l.label) && (
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-muted-foreground text-xs">
                      Tip: recruiters scan long skill lists faster when they're grouped —
                      put each category on its own line, e.g. “Languages: Python,
                      TypeScript” then “Cloud: AWS, Terraform”.
                    </p>
                    {categorizeSkills(resume.skills) !== null && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="min-h-10 sm:min-h-8"
                        onClick={() => {
                          const grouped = categorizeSkills(resume.skills)
                          if (grouped !== null) set('skills', grouped)
                        }}
                      >
                        <Sparkles className="size-3.5" /> Group into categories
                      </Button>
                    )}
                  </div>
                )}
              <div className="flex flex-wrap items-center gap-2">
                {aiButton(
                  'skills',
                  'AI clean up skills',
                  () =>
                    void runRewrite('skills', 'skills', resume.skills, (out) =>
                      set('skills', out)
                    ),
                  !resume.skills.trim() &&
                    'Add some skills first — the AI cleans up your list, it never invents skills.'
                )}
                {aiButton('skill-suggest', 'AI suggest related skills', () =>
                  setSkillExploreSetup({ context: '', category: '' })
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-9"
                  title="Save skills to library — reuse them in other resume copies"
                  aria-label="Save skills to library"
                  disabled={!resume.skills.trim()}
                  onClick={() => {
                    setSkillsLibrary(saveSkillsToLibrary(resume.skills))
                    setSkillsLibrarySaved(true)
                    window.setTimeout(() => setSkillsLibrarySaved(false), 1600)
                  }}
                >
                  {skillsLibrarySaved ? (
                    <Check className="size-3.5 text-green-600" />
                  ) : (
                    <BookmarkPlus className="size-3.5" />
                  )}
                </Button>
                {skillsLibrary.length > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    title="Insert a skills set you saved from any resume copy"
                    onClick={() => setSkillsLibraryOpen((v) => !v)}
                  >
                    <Bookmark className="size-4" /> From library ({skillsLibrary.length})
                  </Button>
                )}
              </div>
              {skillsLibraryOpen && skillsLibrary.length > 0 && (
                <div className="min-w-0 space-y-2 overflow-hidden rounded-lg border p-3">
                  <p className="text-muted-foreground text-xs font-medium">Saved skills</p>
                  {skillsLibrary.map((s) => (
                    <div key={s.id} className="flex min-w-0 items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm">
                          {s.skills.split('\n').map((l) => l.trim()).filter(Boolean)[0] ??
                            'Untitled skills'}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          Saved {new Date(s.savedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-10 text-xs sm:h-7"
                          onClick={() =>
                            setResume((r) => ({
                              ...r,
                              skills: r.skills.trim()
                                ? `${r.skills.replace(/\s+$/, '')}\n${s.skills}`
                                : s.skills,
                            }))
                          }
                        >
                          Insert
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-destructive h-10 sm:h-7"
                          title="Remove from library"
                          aria-label={`Remove saved skills ${s.skills.split('\n').map((l) => l.trim()).filter(Boolean)[0] ?? 'Untitled skills'}`}
                          onClick={() => setSkillsLibrary(deleteLibrarySkills(s.id))}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {proven.length > 0 && (
                <div className="text-xs">
                  <span className="text-muted-foreground">
                    Mentioned in your experience but not listed in Skills — recruiters scan
                    this section first:
                  </span>
                  <span className="mt-1 flex flex-wrap gap-1">
                    {proven.map((kw) => (
                      <button
                        key={kw}
                        type="button"
                        className="bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 rounded-full border px-2 py-0.5"
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
                    ))}
                  </span>
                </div>
              )}
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
            <div className="space-y-2">
              <Label>Certifications (optional)</Label>
              {(resume.certItems ?? []).map((c, cIdx) => (
                <div
                  key={c.id}
                  className={`space-y-2 rounded-md border p-3 ${c.hidden ? 'opacity-60' : ''}`}
                >
                  {c.hidden && (
                    <p className="text-muted-foreground text-[10px] font-semibold uppercase">
                      Hidden — left out of the resume
                    </p>
                  )}
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Input
                      placeholder="Certificate name (AWS Solutions Architect)"
                      onKeyDown={markShortcutKeyDown}
                      value={c.name}
                      onChange={(ev) =>
                        setResume((r) => ({
                          ...r,
                          certItems: (r.certItems ?? []).map((x) =>
                            x.id === c.id ? { ...x, name: ev.target.value } : x
                          ),
                        }))
                      }
                    />
                    <div className="grid grid-cols-[1fr_auto] gap-2">
                      <Input
                        placeholder="Issuer (Amazon Web Services)"
                        onKeyDown={markShortcutKeyDown}
                        value={c.issuer}
                        onChange={(ev) =>
                          setResume((r) => ({
                            ...r,
                            certItems: (r.certItems ?? []).map((x) =>
                              x.id === c.id ? { ...x, issuer: ev.target.value } : x
                            ),
                          }))
                        }
                      />
                      <Input
                        className="w-24"
                        placeholder="2024"
                        value={c.date}
                        onChange={(ev) =>
                          setResume((r) => ({
                            ...r,
                            certItems: (r.certItems ?? []).map((x) =>
                              x.id === c.id ? { ...x, date: ev.target.value } : x
                            ),
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <Textarea
                      rows={2}
                      placeholder="How it's relevant (optional)"
                      onKeyDown={markShortcutKeyDown}
                      value={c.description}
                      onChange={(ev) =>
                        setResume((r) => ({
                          ...r,
                          certItems: (r.certItems ?? []).map((x) =>
                            x.id === c.id ? { ...x, description: ev.target.value } : x
                          ),
                        }))
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="min-h-10 shrink-0 sm:min-h-9"
                      title={c.hidden ? 'Show on resume' : 'Hide from resume — kept here, left out of the resume'}
                      aria-pressed={c.hidden === true}
                      aria-label={`${c.hidden ? 'Show' : 'Hide'} certification ${cIdx + 1} ${c.hidden ? 'on' : 'from'} resume`}
                      onClick={() =>
                        setResume((r) => ({
                          ...r,
                          certItems: (r.certItems ?? []).map((x) =>
                            x.id === c.id ? { ...x, hidden: !x.hidden } : x
                          ),
                        }))
                      }
                    >
                      {c.hidden ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="min-h-10 shrink-0 sm:min-h-9"
                      title="Save certification to library — reuse it in other resume copies"
                      aria-label={`Save certification ${cIdx + 1} to library`}
                      disabled={!c.name.trim() && !c.issuer.trim() && !c.description.trim()}
                      onClick={() => {
                        setCertLibrary(saveCertToLibrary(c))
                        setCertLibrarySavedId(c.id)
                        window.setTimeout(
                          () => setCertLibrarySavedId((v) => (v === c.id ? null : v)),
                          1600
                        )
                      }}
                    >
                      {certLibrarySavedId === c.id ? (
                        <Check className="size-3.5 text-green-600" />
                      ) : (
                        <BookmarkPlus className="size-3.5" />
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive min-h-10 shrink-0 sm:min-h-9"
                      title="Delete certification"
                      aria-label="Delete certification"
                      onClick={() =>
                        setResume((r) => ({
                          ...r,
                          certItems: (r.certItems ?? []).filter((x) => x.id !== c.id),
                        }))
                      }
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="min-h-10 sm:min-h-8"
                  onClick={() =>
                    setResume((r) => ({
                      ...r,
                      certItems: [...(r.certItems ?? []), emptyCertification()],
                    }))
                  }
                >
                  <Plus className="size-4" /> Add certification
                </Button>
                {certLibrary.length > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="min-h-10 sm:min-h-8"
                    title="Insert a certification you saved from any resume copy"
                    onClick={() => setCertLibraryOpen((v) => !v)}
                  >
                    <Bookmark className="size-4" /> From library ({certLibrary.length})
                  </Button>
                )}
              </div>
              {certLibraryOpen && certLibrary.length > 0 && (
                <div className="min-w-0 space-y-2 overflow-hidden rounded-lg border p-3">
                  <p className="text-muted-foreground text-xs font-medium">
                    Saved certifications
                  </p>
                  {certLibrary.map((s) => (
                    <div key={s.id} className="flex min-w-0 items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm">
                          {[s.data.name, s.data.issuer]
                            .filter((x) => x.trim())
                            .join(' — ') || 'Untitled certification'}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          Saved {new Date(s.savedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-10 text-xs sm:h-7"
                          onClick={() =>
                            setResume((r) => ({
                              ...r,
                              certItems: [
                                ...(r.certItems ?? []).filter(
                                  (x) => x.name.trim() || x.issuer.trim() || x.description.trim()
                                ),
                                { ...s.data, id: newId() },
                              ],
                            }))
                          }
                        >
                          Insert
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-destructive h-10 sm:h-7"
                          title="Remove from library"
                          aria-label={`Remove saved certification ${[s.data.name, s.data.issuer].filter((x) => x.trim()).join(' — ') || 'Untitled certification'}`}
                          onClick={() => setCertLibrary(deleteLibraryCert(s.id))}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="certs">Additional certifications (free text, optional)</Label>
              <Input
                id="certs"
                placeholder="AWS Solutions Architect (2024), PMP…"
                onKeyDown={markShortcutKeyDown}
                value={resume.certifications}
                onChange={(e) => set('certifications', e.target.value)}
              />
            </div>
          </Section>

          <Section
            title="Custom sections (optional)"
            icon={<Plus className="size-4" />}
            defaultOpen={resume.customSections.length > 0}
            anchor="custom"
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
                    onKeyDown={markShortcutKeyDown}
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
                  onKeyDown={markShortcutKeyDown}
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
            {(() => {
              const rec = recommendedSectionOrder(resume)
              if (!rec || !resume.experienceLevel) return null
              const emphasis = sectionEmphasisFor(resume.experienceLevel)
              return (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-sky-200 bg-sky-50 px-2.5 py-2 dark:border-sky-900 dark:bg-sky-950/40">
                  <span className="text-xs text-sky-800 dark:text-sky-200">
                    Recommended for {EXPERIENCE_LEVEL_LABELS[resume.experienceLevel]}:{' '}
                    {emphasis === 'education-first'
                      ? 'education near the top'
                      : 'experience right after the summary'}
                    .
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() =>
                      setResume((r) => {
                        const next = recommendedSectionOrder(r)
                        return next ? { ...r, sectionOrder: next } : r
                      })
                    }
                  >
                    Apply recommended order
                  </Button>
                </div>
              )
            })()}
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
          {pdfLength !== null && (
            <div className="flex flex-wrap items-center gap-2">
              <span
                role="img"
                aria-label={`Resume fills ${Math.round(Math.min(pdfLength.length, 1) * 100)}% of the first page`}
                className="bg-muted inline-block h-1.5 w-16 overflow-hidden rounded-full"
              >
                <span
                  className={`block h-full rounded-full ${
                    pdfLength.pages > 1 || pdfLength.length < 0.45 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.round(Math.min(pdfLength.length, 1) * 100)}%` }}
                />
              </span>
              <p
                className={`text-xs ${
                  pdfLength.pages > 1 || pdfLength.length < 0.45
                    ? 'text-amber-700'
                    : 'text-muted-foreground'
                }`}
              >
                Resume length: {pdfLength.length.toFixed(2)} page
                {pdfLength.length > 1 ? 's' : ''}
                {pdfLength.pages > 1
                  ? ' — recruiters prefer one page; consider trimming older roles or long bullets'
                  : pdfLength.length < 0.45
                    ? ' — looks sparse; add relevant bullets or roles to fill most of the page'
                    : ' — one page is ideal for most applications'}
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
            {[
              ...(templateRecs.length > 0
                ? [{ id: 'foryou', label: `For you (${templateRecs.length})` }]
                : []),
              ...TEMPLATE_FILTERS.map((f) => ({ id: f.id, label: f.label })),
              { id: 'saved', label: `Saved (${templateFavs.length})` },
              { id: 'recent', label: 'Recent' },
            ].map((f) => (
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
            <button
              type="button"
              aria-pressed={templateCompare}
              title="Pick 2–3 templates to see your resume in each, side by side"
              onClick={() => {
                setTemplateCompare((on) => {
                  if (on) setCompareIds([])
                  return !on
                })
              }}
              className={`rounded-full border px-2 py-0.5 text-[11px] transition ${
                templateCompare
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'hover:border-muted-foreground/40'
              }`}
            >
              Compare
            </button>
            {templateCompare && (
              <Button
                variant="outline"
                size="sm"
                className="h-6 px-2 text-[11px]"
                disabled={compareIds.length < 2}
                onClick={() => setCompareOpen(true)}
              >
                {compareIds.length < 2
                  ? 'Pick 2–3 to compare'
                  : `Compare ${compareIds.length} side by side`}
              </Button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(templateFilter === 'foryou'
              ? templateRecs
                  .map((rec) => TEMPLATES.find((t) => t.id === rec.id))
                  .filter((t): t is (typeof TEMPLATES)[number] => t !== undefined)
              : templateFilter === 'saved'
                ? TEMPLATES.filter((t) => templateFavs.includes(t.id))
                : templateFilter === 'recent'
                ? templateRecents
                    .map((id) => TEMPLATES.find((t) => t.id === id))
                    .filter((t): t is (typeof TEMPLATES)[number] => t !== undefined)
                : TEMPLATES.filter(
                    (TEMPLATE_FILTERS.find((f) => f.id === templateFilter) ?? TEMPLATE_FILTERS[0])
                      .match,
                  )
            ).map((t) => (
              <span key={t.id} className="relative">
                <button
                  type="button"
                  title={t.description}
                  aria-pressed={
                    templateCompare ? compareIds.includes(t.id) : resume.templateId === t.id
                  }
                  onClick={() => {
                    if (templateCompare) {
                      setCompareIds((ids) =>
                        ids.includes(t.id)
                          ? ids.filter((id) => id !== t.id)
                          : ids.length >= 3
                            ? ids
                            : [...ids, t.id]
                      )
                      return
                    }
                    set('templateId', t.id)
                    setTemplateRecents(recordTemplateRecent(t.id))
                  }}
                  className={`w-16 rounded-md border p-1 transition ${
                    (templateCompare ? compareIds.includes(t.id) : resume.templateId === t.id)
                      ? 'border-primary ring-primary/40 ring-2'
                      : 'hover:border-muted-foreground/40'
                  }`}
                >
                  <TemplateThumb t={t} />
                  <span className="mt-0.5 block truncate text-center text-[10px] leading-tight">
                    {t.name}
                  </span>
                </button>
                <button
                  type="button"
                  title={templateFavs.includes(t.id) ? 'Remove from saved' : 'Save template'}
                  aria-label={
                    templateFavs.includes(t.id)
                      ? `Remove ${t.name} from saved templates`
                      : `Save ${t.name} template`
                  }
                  aria-pressed={templateFavs.includes(t.id)}
                  onClick={(e) => {
                    e.stopPropagation()
                    setTemplateFavs(toggleTemplateFavorite(t.id))
                  }}
                  className="bg-background/90 absolute -top-1.5 -right-1.5 flex size-6 items-center justify-center rounded-full border shadow-sm"
                >
                  <Star
                    className={`size-3.5 ${
                      templateFavs.includes(t.id)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-muted-foreground'
                    }`}
                  />
                </button>
                {templateCompare && compareIds.includes(t.id) && (
                  <span
                    aria-hidden
                    className="bg-primary text-primary-foreground absolute -top-1.5 -left-1.5 flex size-5 items-center justify-center rounded-full text-[10px] font-semibold shadow-sm"
                  >
                    {compareIds.indexOf(t.id) + 1}
                  </span>
                )}
              </span>
            ))}
            {templateFilter === 'foryou' && templateRecs.length > 0 && (
              <span className="text-muted-foreground w-full text-xs">
                Recommended for your resume:{' '}
                {templateRecs
                  .map((rec) => `${getTemplate(rec.id).name} — ${rec.reason}`)
                  .join(' · ')}
              </span>
            )}
            {templateFilter === 'foryou' && templateRecs.length === 0 && (
              <span className="text-muted-foreground w-full text-xs">
                No recommendations right now — set an experience level or browse all templates.
              </span>
            )}
            {templateFilter === 'saved' && templateFavs.length === 0 && (
              <span className="text-muted-foreground w-full text-xs">
                No saved templates yet — click the star on a template to keep it here.
              </span>
            )}
            {templateFilter === 'recent' && templateRecents.length === 0 && (
              <span className="text-muted-foreground w-full text-xs">
                No recently used templates yet — pick a template and it will show up here.
              </span>
            )}
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
              <span className="text-muted-foreground text-[11px]">Text color</span>
              {(
                [
                  ['default', 'Default — soft near-black body text'],
                  ['black', 'Black — maximum-contrast print look'],
                  ['navy', 'Navy — deep blue body text'],
                ] as const
              ).map(([value, hint]) => {
                const active = (resume.textColor ?? 'default') === value
                return (
                  <button
                    key={value}
                    type="button"
                    title={`${hint} — applies to preview, PDF and DOCX`}
                    aria-label={`Text color ${value}`}
                    aria-pressed={active}
                    onClick={() => set('textColor', value)}
                    className="-m-0.5 flex size-10 items-center justify-center rounded-full sm:size-8"
                  >
                    <span
                      aria-hidden
                      className={`block size-5 rounded-full border-2 transition ${
                        active ? 'border-primary scale-110' : 'border-transparent hover:scale-110'
                      }`}
                      style={{ background: TEXT_INKS[value] }}
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
              <label htmlFor="resume-language" className="text-muted-foreground text-[11px]">
                Language
              </label>
              <select
                id="resume-language"
                title="Resume language — localizes default section headings and AI writer output"
                value={resumeLanguageOf(resume)}
                onChange={(e) => set('language', e.target.value as ResumeLanguage)}
                className="bg-background h-7 rounded-md border px-1.5 text-[11px] font-medium"
              >
                {(Object.keys(RESUME_LANGUAGES) as ResumeLanguage[]).map((code) => (
                  <option key={code} value={code}>
                    {RESUME_LANGUAGES[code]}
                  </option>
                ))}
              </select>
            </span>
            <span className="flex flex-wrap items-center gap-1">
              <span className="mx-1 h-5 border-l" aria-hidden />
              <span className="text-muted-foreground text-[11px]">Font</span>
              {(
                [
                  ['auto', 'Auto', 'Follow the template’s font'],
                  ['serif', 'Serif', 'Georgia / Times — traditional look'],
                  ['sans', 'Sans', 'Inter / Calibri — modern look'],
                  ['mono', 'Mono', 'Courier — typewriter look'],
                  ['merriweather', 'Merri', 'Merriweather — classic resume serif'],
                  ['sourcesans', 'Source', 'Source Sans — modern humanist sans'],
                  ['robotomono', 'Roboto', 'Roboto Mono — clean monospace'],
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
              <button
                type="button"
                aria-label="Decrease text size"
                title="Smaller text — applies to preview, PDF and DOCX"
                disabled={(resume.fontScale ?? 'm') === 'xs'}
                onClick={() => {
                  const i = SCALE_STEPS.indexOf(resume.fontScale ?? 'm')
                  if (i > 0) set('fontScale', SCALE_STEPS[i - 1])
                }}
                className="hover:border-muted-foreground/40 rounded-md border px-2 py-1 text-[11px] font-medium transition disabled:opacity-40"
              >
                A−
              </button>
              <span
                title={`Text size: ${SCALE_NAME[resume.fontScale ?? 'm']}`}
                aria-live="polite"
                className="min-w-10 text-center text-[11px] font-medium tabular-nums"
              >
                {Math.round(FONT_SCALE[resume.fontScale ?? 'm'] * 100)}%
              </span>
              <button
                type="button"
                aria-label="Increase text size"
                title="Larger text — applies to preview, PDF and DOCX"
                disabled={(resume.fontScale ?? 'm') === 'xl'}
                onClick={() => {
                  const i = SCALE_STEPS.indexOf(resume.fontScale ?? 'm')
                  if (i < SCALE_STEPS.length - 1) set('fontScale', SCALE_STEPS[i + 1])
                }}
                className="hover:border-muted-foreground/40 rounded-md border px-2 py-1 text-[11px] font-medium transition disabled:opacity-40"
              >
                A+
              </button>
            </span>
            <span className="flex items-center gap-1">
              <span className="mx-1 h-5 border-l" aria-hidden />
              <span className="text-muted-foreground text-[11px]">Spacing</span>
              <button
                type="button"
                aria-label="Decrease line spacing"
                title="Tighter lines — applies to preview, PDF and DOCX"
                disabled={(resume.lineSpacing ?? 'normal') === 'xtight'}
                onClick={() => {
                  const i = SPACING_STEPS.indexOf(resume.lineSpacing ?? 'normal')
                  if (i > 0) set('lineSpacing', SPACING_STEPS[i - 1])
                }}
                className="hover:border-muted-foreground/40 rounded-md border px-2 py-1 text-[11px] font-medium transition disabled:opacity-40"
              >
                −
              </button>
              <span
                title={`Line spacing: ${resume.lineSpacing ?? 'normal'}`}
                aria-live="polite"
                className="min-w-10 text-center text-[11px] font-medium tabular-nums"
              >
                {LINE_SPACING[resume.lineSpacing ?? 'normal'].toFixed(2)}
              </span>
              <button
                type="button"
                aria-label="Increase line spacing"
                title="Looser lines — applies to preview, PDF and DOCX"
                disabled={(resume.lineSpacing ?? 'normal') === 'loose'}
                onClick={() => {
                  const i = SPACING_STEPS.indexOf(resume.lineSpacing ?? 'normal')
                  if (i < SPACING_STEPS.length - 1) set('lineSpacing', SPACING_STEPS[i + 1])
                }}
                className="hover:border-muted-foreground/40 rounded-md border px-2 py-1 text-[11px] font-medium transition disabled:opacity-40"
              >
                +
              </button>
            </span>
            <span className="flex items-center gap-1">
              <span className="mx-1 h-5 border-l" aria-hidden />
              <span className="text-muted-foreground text-[11px]">Sections</span>
              <button
                type="button"
                aria-label="Decrease section spacing"
                title="Less space between sections — applies to preview, PDF and DOCX"
                disabled={(resume.sectionSpacing ?? 'normal') === 'xtight'}
                onClick={() => {
                  const i = SECTION_STEPS.indexOf(resume.sectionSpacing ?? 'normal')
                  if (i > 0) set('sectionSpacing', SECTION_STEPS[i - 1])
                }}
                className="hover:border-muted-foreground/40 rounded-md border px-2 py-1 text-[11px] font-medium transition disabled:opacity-40"
              >
                −
              </button>
              <span
                title={`Section spacing: ${resume.sectionSpacing ?? 'normal'}`}
                aria-live="polite"
                className="min-w-10 text-center text-[11px] font-medium tabular-nums"
              >
                {SECTION_SPACING[resume.sectionSpacing ?? 'normal'].toFixed(2)}
              </span>
              <button
                type="button"
                aria-label="Increase section spacing"
                title="More space between sections — applies to preview, PDF and DOCX"
                disabled={(resume.sectionSpacing ?? 'normal') === 'xroomy'}
                onClick={() => {
                  const i = SECTION_STEPS.indexOf(resume.sectionSpacing ?? 'normal')
                  if (i < SECTION_STEPS.length - 1) set('sectionSpacing', SECTION_STEPS[i + 1])
                }}
                className="hover:border-muted-foreground/40 rounded-md border px-2 py-1 text-[11px] font-medium transition disabled:opacity-40"
              >
                +
              </button>
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
            <span className="flex items-center gap-1">
              <span className="mx-1 h-5 border-l" aria-hidden />
              <span className="text-muted-foreground text-[11px]">Indent</span>
              {(
                [
                  ['off', 'Off', 'Bullets flush with the section text'],
                  ['on', 'On', 'Indent bullet lists'],
                ] as const
              ).map(([value, label, hint]) => (
                <button
                  key={value}
                  type="button"
                  title={`${hint} — applies to preview, PDF and DOCX`}
                  aria-pressed={(resume.bulletIndent ?? 'off') === value}
                  onClick={() => set('bulletIndent', value)}
                  className={`rounded-md border px-2 py-1 text-[11px] font-medium transition ${
                    (resume.bulletIndent ?? 'off') === value
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
              <span className="text-muted-foreground text-[11px]">Stack roles</span>
              {(
                [
                  ['off', 'Off', 'Each experience entry shows its own company line'],
                  ['on', 'On', 'Consecutive roles at the same company stack under one company heading — great for promotions'],
                ] as const
              ).map(([value, label, hint]) => (
                <button
                  key={value}
                  type="button"
                  title={`${hint} — applies to preview and all exports`}
                  aria-pressed={(resume.groupByCompany ?? 'off') === value}
                  onClick={() => set('groupByCompany', value)}
                  className={`rounded-md border px-2 py-1 text-[11px] font-medium transition ${
                    (resume.groupByCompany ?? 'off') === value
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
              <span className="text-muted-foreground text-[11px]">Icons</span>
              {(
                [
                  ['off', 'Off', 'Contact line with text separators'],
                  ['on', 'On', 'Small icons before each contact field'],
                ] as const
              ).map(([value, label, hint]) => (
                <button
                  key={value}
                  type="button"
                  title={`${hint} — applies to preview and PDF (DOCX keeps text separators)`}
                  aria-pressed={(resume.contactIcons ?? 'off') === value}
                  onClick={() => set('contactIcons', value)}
                  className={`rounded-md border px-2 py-1 text-[11px] font-medium transition ${
                    (resume.contactIcons ?? 'off') === value
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
              <span className="text-muted-foreground text-[11px]">View</span>
              {(
                [
                  ['pages', 'Pages', 'Preview as separate page frames'],
                  ['flow', 'Flow', 'Preview as one continuous flow with page-break markers'],
                ] as const
              ).map(([value, label, hint]) => (
                <button
                  key={value}
                  type="button"
                  title={`${hint} — preview only, PDF is unchanged`}
                  aria-pressed={previewView === value}
                  onClick={() => {
                    setPreviewView(value)
                    localStorage.setItem('honestcv.previewView', value)
                  }}
                  className={`rounded-md border px-2 py-1 text-[11px] font-medium transition ${
                    previewView === value
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
                      ? `Score = keyword coverage ×70% + structure checks ×30%. Keyword coverage is the share of the job posting\u2019s top keywords (extracted by frequency, stop-words removed) that appear in your resume${ats.ignored.length > 0 ? ` — ${ats.ignored.length} keyword${ats.ignored.length === 1 ? '' : 's'} you marked not relevant ${ats.ignored.length === 1 ? 'is' : 'are'} excluded` : ''}. Structure is the ${ats.checks.length}-point checklist below — each check has equal weight.`
                      : `Without a job description the score is the ${ats.checks.length}-point structure checklist below — each check has equal weight (${ats.checks.filter((c) => c.pass).length} of ${ats.checks.length} passing). Paste a job description above to add the stricter keyword-coverage half.`}
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
                      {supportsKeywordHighlight() && (
                        <label className="text-muted-foreground mt-1 flex w-fit cursor-pointer items-center gap-1.5">
                          <input
                            type="checkbox"
                            className="accent-primary size-3.5"
                            checked={highlightKw}
                            onChange={(e) => setHighlightKw(e.target.checked)}
                          />
                          Highlight in preview
                        </label>
                      )}
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
                    <div className="bg-muted/40 rounded-lg border p-2.5">
                      <p className="font-medium">
                        Is this missing keyword relevant to your experience?
                      </p>
                      <p className="mt-1.5 flex items-center gap-2">
                        <span className="bg-primary/10 text-foreground inline-flex items-center rounded-full border px-2.5 py-0.5 font-medium">
                          {ats.missing[0]}
                        </span>
                        <span className="text-muted-foreground">1 of {ats.missing.length}</span>
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <Button
                          size="sm"
                          className="h-10 text-xs sm:h-7"
                          onClick={() => setKwBulletFor(ats.missing[0])}
                        >
                          <Sparkles aria-hidden className="size-3" /> Yes — draft a bullet
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-10 text-xs sm:h-7"
                          onClick={() =>
                            set(
                              'skills',
                              resume.skills.trim()
                                ? `${resume.skills.replace(/,\s*$/, '')}, ${ats.missing[0]}`
                                : ats.missing[0]
                            )
                          }
                        >
                          Add to Skills
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-muted-foreground h-10 text-xs sm:h-7"
                          onClick={() =>
                            set('ignoredKeywords', [
                              ...(resume.ignoredKeywords ?? []),
                              ats.missing[0],
                            ])
                          }
                        >
                          No — not relevant
                        </Button>
                      </div>
                    </div>
                  )}
                  {(
                    [
                      [
                        'High priority',
                        ats.missing.filter((kw) => highKw.has(kw)),
                        'font-medium text-red-700',
                        '— core terms in this posting (title, requirements, repeated); add to Skills or let AI draft a bullet:',
                      ],
                      [
                        'Remaining',
                        ats.missing.filter((kw) => !highKw.has(kw)),
                        'font-medium text-amber-700',
                        '— also mentioned in the posting; add the ones you genuinely have:',
                      ],
                    ] as const
                  ).map(([label, kws, cls, blurb]) =>
                    kws.length === 0 ? null : (
                    <div key={label}>
                      <span className={cls}>
                        {label} ({kws.length})
                      </span>{' '}
                      <span className="text-muted-foreground">
                        {blurb}
                      </span>
                      <span className="mt-1 flex flex-wrap gap-1">
                        {kws.map((kw) => (
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
                            <button
                              type="button"
                              className="hover:bg-primary/10 text-muted-foreground border-l px-1.5 py-0.5"
                              title={`Not relevant to me — exclude "${kw}" from the score`}
                              aria-label={`Mark ${kw} as not relevant`}
                              onClick={() =>
                                set('ignoredKeywords', [...(resume.ignoredKeywords ?? []), kw])
                              }
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </span>
                    </div>
                    )
                  )}
                  {ats.ignored.length > 0 && (
                    <div>
                      <span className="text-muted-foreground font-medium">
                        Excluded ({ats.ignored.length})
                      </span>{' '}
                      <span className="text-muted-foreground">
                        — marked not relevant; not counted in coverage. Click to restore:
                      </span>
                      <span className="mt-1 flex flex-wrap gap-1">
                        {ats.ignored.map((kw) => (
                          <button
                            key={kw}
                            type="button"
                            className="text-muted-foreground hover:bg-primary/10 inline-flex items-center rounded-full border border-dashed px-2 py-0.5 line-through"
                            title={`Restore "${kw}" to the keyword pool`}
                            aria-label={`Restore ${kw} to the keyword pool`}
                            onClick={() =>
                              set(
                                'ignoredKeywords',
                                (resume.ignoredKeywords ?? []).filter(
                                  (k) => k.toLowerCase() !== kw.toLowerCase()
                                )
                              )
                            }
                          >
                            {kw}
                          </button>
                        ))}
                      </span>
                    </div>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-muted-foreground h-10 text-xs sm:h-7"
                    onClick={() => jumpToSection('target')}
                  >
                    Update job description →
                  </Button>
                </div>
              ) : (
                <p className="text-muted-foreground mt-2 text-xs">
                  Paste a job description in "Target job" to see keyword matches.{' '}
                  <button
                    type="button"
                    className="text-primary inline-flex min-h-10 items-center underline sm:min-h-0"
                    onClick={() => jumpToSection('target')}
                  >
                    Add a job description →
                  </button>
                </p>
              )}
              <div className="mt-3 space-y-3">
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
                {CHECK_CATEGORIES.map((cat) => {
                  const rows = ats.checks.filter((c) => c.category === cat.key)
                  if (rows.length === 0) return null
                  return (
                    <div key={cat.key}>
                      <p className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
                        {cat.label}{' '}
                        <span className="font-normal normal-case">
                          · {rows.filter((c) => c.pass).length}/{rows.length}
                        </span>
                      </p>
                      <ul className="mt-1 space-y-1 text-xs">
                        {rows.map((c) => (
                          <li key={c.label} className="flex items-start gap-1.5">
                            <span className={c.pass ? 'text-green-600' : 'text-red-500'}>
                              {c.pass ? '✓' : '✗'}
                            </span>
                            <span>
                              <span className="font-medium">{c.label}</span>
                              {c.pass && fixedChecks.has(c.label) && (
                                <span className="ml-1.5 rounded bg-emerald-100 px-1 py-0.5 text-[10px] font-semibold text-emerald-800">
                                  Fixed
                                </span>
                              )}
                              {!c.pass && <span className="text-muted-foreground"> — {c.hint}</span>}
                              {!c.pass && c.anchor && (
                                <button
                                  type="button"
                                  className="text-primary ml-1.5 inline-flex min-h-10 items-center underline sm:min-h-0"
                                  onClick={() => c.anchor && jumpToSection(c.anchor)}
                                >
                                  Fix →
                                </button>
                              )}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <div className="rounded-lg border bg-slate-100/90 p-3 sm:p-6 dark:bg-slate-900/40">
            <div ref={previewWrapRef} className="shadow-lg">
              <ResumePreview
                resume={shown}
                paginated
                view={previewView}
                onSectionJump={(key) =>
                  jumpToSection(
                    key === 'certifications' ? 'skills' : key.startsWith('custom:') ? 'custom' : key
                  )
                }
                onEdit={setResume}
              />
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
        initialCompany={
          toolOpen === 'cover' ? toolCompany || (resume.targetCompany ?? '') : toolCompany
        }
        onClose={() => setToolOpen(null)}
        resume={shown}
        onQuota={setFreeLeft}
        onJumpToTarget={() => {
          setToolOpen(null)
          jumpToSection('target')
        }}
      />
      {tailorOpen && (
        <TailorDialog
          resume={shown}
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
        onJump={jumpToSection}
        onJumpEntry={jumpToEntry}
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
        resume={shown}
        jobDescription={resume.jobDescription}
        scoreSummary={atsScoreSummary(ats)}
        ats={ats}
        fixes={assistantFixes}
        onQuota={setFreeLeft}
        onPaymentRequired={(msg) => {
          if (!freeMode) requireUnlock(msg)
        }}
        onApply={(action) => {
          if (action.type === 'summary') {
            setResume((r) => ({ ...r, summary: action.value }))
            return
          }
          if (action.type === 'bullet') {
            setResume((r) => {
              const visible = r.experience.filter((e) => !e.hidden)
              if (visible.length === 0) return r
              const wanted = action.entry.toLowerCase()
              const matches = (s: string) => {
                const t = s.trim().toLowerCase()
                return Boolean(t) && (t.includes(wanted) || wanted.includes(t))
              }
              const target =
                visible.find((e) => matches(e.company) || matches(e.role)) ?? visible[0]
              const replaceWanted = action.replace?.trim().toLowerCase()
              const replaceIdx = replaceWanted
                ? target.bullets.findIndex((b) => {
                    const t = b.trim().toLowerCase()
                    return Boolean(t) && (t.includes(replaceWanted) || replaceWanted.includes(t))
                  })
                : -1
              return {
                ...r,
                experience: r.experience.map((e) =>
                  e.id === target.id
                    ? {
                        ...e,
                        bullets:
                          replaceIdx >= 0
                            ? e.bullets.map((b, bi) => (bi === replaceIdx ? action.value : b))
                            : [...e.bullets.filter((b) => b.trim()), action.value],
                      }
                    : e
                ),
              }
            })
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
        onLocate={(action) => {
          if (window.innerWidth < 640) setAssistantOpen(false)
          if (action.type === 'summary') {
            jumpToSection('summary')
            return
          }
          if (action.type === 'skills') {
            jumpToSection('skills')
            return
          }
          const visible = shown.experience.filter((e) => !e.hidden)
          if (visible.length === 0) {
            jumpToSection('experience')
            return
          }
          const wanted = action.entry.toLowerCase()
          const matches = (s: string) => {
            const t = s.trim().toLowerCase()
            return Boolean(t) && (t.includes(wanted) || wanted.includes(t))
          }
          const target = visible.find((e) => matches(e.company) || matches(e.role)) ?? visible[0]
          jumpToEntry(target.id)
        }}
      />
      {kwBulletFor !== null && (
        <KeywordBulletDialog
          keyword={kwBulletFor}
          resume={shown}
          onClose={() => setKwBulletFor(null)}
          onQuota={setFreeLeft}
          onInsert={insertKeywordBullet}
        />
      )}
      <Dialog open={compareOpen} onOpenChange={setCompareOpen}>
        <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Compare templates side by side</DialogTitle>
            <DialogDescription>
              Your resume rendered in each template — pick the one that fits best.
            </DialogDescription>
          </DialogHeader>
          <div
            className={`grid gap-4 ${compareIds.length === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}
          >
            {compareIds
              .map((id) => TEMPLATES.find((t) => t.id === id))
              .filter((t): t is (typeof TEMPLATES)[number] => t !== undefined)
              .map((t) => (
                <div key={t.id} className="flex min-w-0 flex-col gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {t.name}
                      {resume.templateId === t.id && (
                        <span className="text-muted-foreground font-normal"> · current</span>
                      )}
                    </p>
                    <p className="text-muted-foreground truncate text-xs">
                      {t.description} · {t.tags.join(' · ')}
                    </p>
                  </div>
                  <div
                    aria-hidden
                    className="pointer-events-none h-80 select-none overflow-hidden rounded-md border bg-slate-100 sm:h-96 dark:bg-slate-900/40"
                  >
                    <div className="origin-top" style={{ zoom: compareIds.length === 3 ? 0.34 : 0.5 }}>
                      <ResumePreview resume={{ ...shown, templateId: t.id }} />
                    </div>
                  </div>
                  <Button
                    variant={resume.templateId === t.id ? 'secondary' : 'default'}
                    size="sm"
                    className="min-h-10 sm:min-h-8"
                    onClick={() => {
                      set('templateId', t.id)
                      setTemplateRecents(recordTemplateRecent(t.id))
                      setCompareOpen(false)
                      setTemplateCompare(false)
                      setCompareIds([])
                    }}
                  >
                    Use this template
                  </Button>
                </div>
              ))}
          </div>
        </DialogContent>
      </Dialog>
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
            {Boolean(variantPick?.original?.trim()) && (
              <div className="bg-muted/40 rounded-lg border border-dashed p-3 text-sm">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="text-muted-foreground text-xs font-medium">Your original</span>
                  <button
                    type="button"
                    className="text-primary min-h-10 text-xs underline underline-offset-2 sm:min-h-0"
                    onClick={() => setVariantPick(null)}
                  >
                    Keep my original
                  </button>
                </div>
                <span className="whitespace-pre-wrap">{variantPick?.original}</span>
              </div>
            )}
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
                {variantPick.original?.trim()
                  ? diffNewWords(variantPick.original, cand).map((chunk, j) =>
                      chunk.added ? (
                        <span
                          key={String(j)}
                          className="rounded-sm bg-emerald-100 dark:bg-emerald-900/50"
                        >
                          {chunk.text}
                        </span>
                      ) : (
                        chunk.text
                      )
                    )
                  : cand}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
      <Dialog
        open={bulletSuggest !== null}
        onOpenChange={(o) => !o && setBulletSuggest(null)}
      >
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Suggested bullet</DialogTitle>
            <DialogDescription>
              Review the draft before it lands on your resume — edit it, regenerate a new
              version, or apply it as is.
            </DialogDescription>
          </DialogHeader>
          {bulletSuggest && (
            <div className="space-y-3">
              <Textarea
                rows={3}
                value={bulletSuggest.text}
                onChange={(e) => setBulletSuggest({ ...bulletSuggest, text: e.target.value })}
                aria-label="Suggested bullet text"
              />
              {aiError &&
                aiErrorTag?.startsWith(
                  `${bulletSuggest.kind}-${bulletSuggest.entryId}-suggest`
                ) && <p className="text-destructive text-sm">{aiError}</p>}
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  className="min-h-10 sm:min-h-9"
                  disabled={!bulletSuggest.text.trim() || bulletSuggestBusy || !bulletSuggestTarget}
                  onClick={() => {
                    const cur = bulletSuggestTarget
                    if (!cur) return
                    const line = bulletSuggest.text.split('\n')[0]?.trim() ?? ''
                    if (!line) return
                    cur.apply(line)
                    setBulletSuggest(null)
                  }}
                >
                  Apply to entry
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-10 sm:min-h-9"
                  disabled={bulletSuggestBusy || !bulletSuggestTarget}
                  onClick={() =>
                    void runSuggestBullet(
                      bulletSuggest.kind,
                      bulletSuggest.entryId,
                      bulletSuggest.variant
                    )
                  }
                >
                  {bulletSuggestBusy ? <Loader2 className="animate-spin" /> : <Sparkles />}
                  {bulletSuggestBusy ? 'Writing…' : 'Regenerate'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="min-h-10 sm:min-h-9"
                  onClick={() => setBulletSuggest(null)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={summaryDraftSetup !== null}
        onOpenChange={(o) => !o && setSummaryDraftSetup(null)}
      >
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Draft my summary</DialogTitle>
            <DialogDescription>
              Pick the position to frame the summary around and up to 5 skills to emphasize.
              Drafts use only facts already on your resume.
              {resume.jobDescription.trim() &&
                ' Wording is tailored toward your target job description.'}
            </DialogDescription>
          </DialogHeader>
          {summaryDraftSetup && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="summary-draft-position">Position highlight</Label>
                {summaryPositionOptions.length > 0 ? (
                  <select
                    id="summary-draft-position"
                    className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
                    value={summaryDraftSetup.position}
                    onChange={(e) =>
                      setSummaryDraftSetup({ ...summaryDraftSetup, position: e.target.value })
                    }
                  >
                    {summaryPositionOptions.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    id="summary-draft-position"
                    placeholder="e.g. Software Engineer"
                    value={summaryDraftSetup.position}
                    onChange={(e) =>
                      setSummaryDraftSetup({ ...summaryDraftSetup, position: e.target.value })
                    }
                  />
                )}
              </div>
              {summarySkillOptions.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-sm font-medium">
                    Skills highlight{' '}
                    <span className="text-muted-foreground font-normal">
                      (optional, up to 5)
                    </span>
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {summarySkillOptions.map((s) => {
                      const on = summaryDraftSetup.picked.includes(s)
                      return (
                        <button
                          key={s}
                          type="button"
                          aria-pressed={on}
                          disabled={!on && summaryDraftSetup.picked.length >= 5}
                          className={`rounded-full border px-2.5 py-1 text-xs transition disabled:opacity-40 ${
                            on
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'hover:border-primary hover:bg-muted/50'
                          }`}
                          onClick={() =>
                            setSummaryDraftSetup({
                              ...summaryDraftSetup,
                              picked: on
                                ? summaryDraftSetup.picked.filter((p) => p !== s)
                                : [...summaryDraftSetup.picked, s],
                            })
                          }
                        >
                          {s}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
              <Button
                type="button"
                className="w-full"
                onClick={() => {
                  const { position, picked } = summaryDraftSetup
                  setSummaryDraftSetup(null)
                  void runSummaryDraft(position, picked)
                }}
              >
                <Sparkles className="size-4" /> Write 3 drafts
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={skillExploreSetup !== null}
        onOpenChange={(o) => !o && setSkillExploreSetup(null)}
      >
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Explore skills</DialogTitle>
            <DialogDescription>
              Optionally describe what you did and pick a focus — suggestions are ideas to
              confirm, tap only skills you actually have.
            </DialogDescription>
          </DialogHeader>
          {skillExploreSetup && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="skill-explore-context">What did you do?</Label>
                <Input
                  id="skill-explore-context"
                  placeholder="e.g. built React dashboards"
                  maxLength={200}
                  value={skillExploreSetup.context}
                  onChange={(e) =>
                    setSkillExploreSetup({ ...skillExploreSetup, context: e.target.value })
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      const { context, category } = skillExploreSetup
                      setSkillExploreSetup(null)
                      void runSkillSuggest(context, category)
                    }
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="skill-explore-category">
                  Focus on{' '}
                  <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <select
                  id="skill-explore-category"
                  className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
                  value={skillExploreSetup.category}
                  onChange={(e) =>
                    setSkillExploreSetup({ ...skillExploreSetup, category: e.target.value })
                  }
                >
                  <option value="">Any kind of skill</option>
                  <option value="hard skills">Hard skills</option>
                  <option value="soft skills">Soft skills</option>
                  <option value="tools and software">Tools &amp; software</option>
                  <option value="languages">Languages</option>
                </select>
              </div>
              <Button
                type="button"
                className="w-full"
                onClick={() => {
                  const { context, category } = skillExploreSetup
                  setSkillExploreSetup(null)
                  void runSkillSuggest(context, category)
                }}
              >
                <Sparkles className="size-4" /> Suggest skills
              </Button>
            </div>
          )}
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
        <DialogContent
          className="sm:max-w-lg"
          onEscapeKeyDown={(e) => {
            if (renamingId) {
              e.preventDefault()
              setRenamingId(null)
            }
          }}
        >
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
                const next = saveResumeVersion(
                  versionName.trim() || 'Untitled copy',
                  resume
                )
                setVersions(next)
                linkVersion(next[0]?.id ?? null)
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
                  <div className="min-w-0 flex-1">
                    {renamingId === v.id ? (
                      <div
                        className="space-y-1.5"
                        onBlur={(e) => {
                          if (!e.currentTarget.contains(e.relatedTarget as Node))
                            commitRename(v)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') commitRename(v)
                        }}
                      >
                        <Input
                          autoFocus
                          value={renameText}
                          onChange={(e) => setRenameText(e.target.value)}
                          className="h-8"
                          aria-label={`Rename ${v.name}`}
                        />
                        <Input
                          value={renameFolder}
                          onChange={(e) => setRenameFolder(e.target.value)}
                          list="builder-version-folders"
                          placeholder="Folder (optional)"
                          className="h-8"
                          aria-label={`Folder for ${v.name}`}
                        />
                        <datalist id="builder-version-folders">
                          {versionFolders.map((f) => (
                            <option key={f} value={f} />
                          ))}
                        </datalist>
                      </div>
                    ) : (
                      <p className="truncate font-medium">
                        {v.name}
                        {v.id === activeVersionId && (
                          <span className="text-primary ml-1.5 text-xs font-normal">
                            · editing
                          </span>
                        )}
                      </p>
                    )}
                    <p className="text-muted-foreground truncate text-xs">
                      {new Date(v.updatedAt).toLocaleString()}
                      {v.folder ? ` · ${v.folder}` : ''} · ATS{' '}
                      {scoreResume(visibleResume(v.data), v.data.jobDescription).score}/100
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-10 w-10 p-0 text-xs sm:h-7 sm:w-7"
                      aria-label={`Rename copy ${v.name}`}
                      onClick={() => {
                        setRenameText(v.name)
                        setRenameFolder(v.folder ?? '')
                        setRenamingId(v.id)
                      }}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-10 w-10 p-0 text-xs sm:h-7 sm:w-7"
                      aria-label={`Duplicate copy ${v.name}`}
                      onClick={() => setVersions(duplicateResumeVersion(v.id))}
                    >
                      <Copy className="size-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-10 text-xs sm:h-7"
                      disabled={v.id === activeVersionId}
                      onClick={() => {
                        linkVersion(v.id)
                        setResume({ ...emptyResume(), ...v.data })
                        setVersionsOpen(false)
                      }}
                    >
                      Open
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive h-10 text-xs sm:h-7"
                      onClick={() => {
                        setVersions(deleteResumeVersion(v.id))
                        if (v.id === activeVersionId) linkVersion(null)
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <p className="text-muted-foreground text-xs">
            {activeVersion
              ? `Edits save to "${activeVersion.name}" automatically — open another copy to switch without losing work.`
              : "Opening a copy replaces what's in the editor — save the current resume as a copy first if you want to keep it."}
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
      <Dialog open={shareLinkOpen} onOpenChange={setShareLinkOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share this resume</DialogTitle>
            <DialogDescription>
              Anyone with the link sees a read-only snapshot of this resume — no
              signup needed. Turn it off anytime.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="flex items-center gap-2 font-medium">
              {shareLink ? (
                <Unlock aria-hidden className="size-4" />
              ) : (
                <Lock aria-hidden className="size-4" />
              )}
              Anyone with the link
            </span>
            <select
              aria-label="Link access"
              className="border-input bg-background h-10 rounded-md border px-3 text-sm"
              value={shareLink ? 'view' : 'off'}
              disabled={shareBusy}
              onChange={(e) => {
                setShareError('')
                setShareLinkCopied(false)
                if (e.target.value === 'view') {
                  const slug = shareSlug.trim()
                  if (slug && !SHARE_SLUG_RE.test(slug)) {
                    setShareError(
                      'Custom links use 3–40 lowercase letters, numbers and hyphens.'
                    )
                    return
                  }
                  setShareBusy(true)
                  createShareLink(shown, slug || undefined)
                    .then((link) => setShareLink(link))
                    .catch((err: unknown) =>
                      setShareError(err instanceof Error ? err.message : 'Sharing failed.')
                    )
                    .finally(() => setShareBusy(false))
                } else {
                  setShareBusy(true)
                  void revokeShareLink()
                    .then(() => setShareLink(null))
                    .finally(() => setShareBusy(false))
                }
              }}
            >
              <option value="off">No access</option>
              <option value="view">Can view</option>
            </select>
          </div>
          {!shareLink && !shareBusy && (
            <div className="space-y-1">
              <label
                htmlFor="share-custom-slug"
                className="text-sm font-medium"
              >
                Custom link <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground shrink-0 text-sm">
                  cv.zalize.com/s/
                </span>
                <Input
                  id="share-custom-slug"
                  value={shareSlug}
                  placeholder="jordan-reyes"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  onChange={(e) => {
                    setShareError('')
                    setShareSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))
                  }}
                />
              </div>
              <p className="text-muted-foreground text-xs">
                Pick a memorable address, or leave blank for a private random
                link. 3–40 lowercase letters, numbers and hyphens.
              </p>
            </div>
          )}
          {shareBusy && (
            <p className="text-muted-foreground text-sm" role="status">
              {shareLink ? 'Turning off…' : 'Creating link…'}
            </p>
          )}
          {shareError && (
            <p className="text-destructive text-sm" role="alert">
              {shareError}
            </p>
          )}
          {shareLink && !shareBusy && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={shareLink.url}
                  aria-label="Share link"
                  onFocus={(e) => e.target.select()}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-10 shrink-0"
                  onClick={() => {
                    void navigator.clipboard
                      .writeText(shareLink.url)
                      .then(() => setShareLinkCopied(true))
                  }}
                >
                  {shareLinkCopied ? 'Copied!' : 'Copy'}
                </Button>
              </div>
              <p className="text-muted-foreground text-xs">
                The link shows a snapshot from{' '}
                {new Date(shareLink.sharedAt).toLocaleString()} — publish again
                after edits to update it. Unshared links expire after 180 days.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-10 sm:h-8"
                disabled={shareBusy}
                onClick={() => {
                  setShareError('')
                  setShareLinkCopied(false)
                  setShareBusy(true)
                  createShareLink(shown)
                    .then((link) => setShareLink(link))
                    .catch((err: unknown) =>
                      setShareError(err instanceof Error ? err.message : 'Sharing failed.')
                    )
                    .finally(() => setShareBusy(false))
                }}
              >
                Publish latest version
              </Button>
            </div>
          )}
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
                      linkVersion(null)
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
                    linkVersion(null)
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
              linkVersion(null)
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

function BulletIdeas({
  role,
  skills,
  onAdd,
}: {
  role: string
  skills: string[]
  onAdd: (s: string) => void
}) {
  const [open, setOpen] = useState(false)
  const starters = useMemo(() => bulletStartersFor(role), [role])
  const tailored = useMemo(() => skillBulletStarters(role, skills), [role, skills])
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
          {tailored.length > 0 && (
            <li>
              <div className="text-muted-foreground text-[11px] font-medium">
                Tailored to your target job — keywords the posting wants that your resume
                doesn&apos;t show yet:
              </div>
              <ul className="mt-1 space-y-1">
                {tailored.map((s) => (
                  <li key={s}>
                    <button
                      type="button"
                      className="bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/40 dark:hover:bg-sky-900/40 w-full rounded-md border px-2 py-1.5 text-left text-xs"
                      title="Add this bullet"
                      onClick={() => onAdd(s)}
                    >
                      + {s}
                    </button>
                  </li>
                ))}
              </ul>
            </li>
          )}
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

type AuditFinding = { category: string; line?: number }

const AUDIT_CATEGORY: Record<BulletIssue['kind'], string> = {
  'weak-opener': 'Weak bullet points',
  'first-person': 'Personal pronouns',
  'no-metric': 'Quantified bullet points',
  filler: 'Filler words',
  buzzword: 'Buzzwords',
  passive: 'Passive voice',
  punctuation: 'Punctuation & capitalization',
  'too-long': 'Bullet length',
  'too-short': 'Bullet length',
}

/** Distinct bullet-level audit categories (AUDIT_CATEGORY collapses two kinds). */
const BULLET_CATEGORIES = [
  'Weak bullet points',
  'Quantified bullet points',
  'Personal pronouns',
  'Filler words',
  'Buzzwords',
  'Passive voice',
  'Punctuation & capitalization',
  'Bullet length',
]

const AUDIT_EXPLANATION: Record<string, string> = {
  'Weak bullet points': 'Open each bullet with a strong action verb instead of "worked" or "was".',
  'Quantified bullet points': 'Add a number that shows scale or impact — team size, %, time or money.',
  'Personal pronouns': 'Drop I / me / my — resume bullets are written without pronouns.',
  'Filler words': 'Cut empty phrases like "responsible for" or "various" — say what you did.',
  Buzzwords: 'Swap vague buzzwords for the concrete skill or result behind them.',
  'Passive voice': 'Rewrite in active voice so you — not the task — are the subject.',
  'Punctuation & capitalization': 'Start with a capital letter and keep end punctuation consistent.',
  'Bullet length': 'Keep each bullet roughly one line — long enough to be specific, short enough to scan.',
  'Number of bullet points': 'Aim for 3–6 bullets per role — enough evidence without padding.',
  'Dates are missing': 'Recruiters need dates to place this on your timeline and verify experience.',
}

const DATE_FINDING: AuditFinding = { category: 'Dates are missing' }

const EXPERIENCE_CHECKS = ['Number of bullet points', 'Dates are missing', ...BULLET_CATEGORIES]
const DATE_CHECKS = ['Dates are missing']

function bulletFindings(bullets: string[], entryFilled: boolean): AuditFinding[] {
  const findings: AuditFinding[] = checkBullets(bullets).flatMap((r) =>
    r.issues.map((i) => ({ category: AUDIT_CATEGORY[i.kind], line: r.index + 1 }))
  )
  if (!bulletMix(bullets).balanced) findings.push({ category: 'Quantified bullet points' })
  const count = bullets.filter((b) => b.trim()).length
  if (entryFilled && (count < 3 || count > 6))
    findings.unshift({ category: 'Number of bullet points' })
  return findings
}

function EntryAuditChip({
  findings,
  filled,
  checks,
  expandable,
  onExpand,
  label,
}: {
  findings: AuditFinding[]
  filled: boolean
  /** Ordered audit category names that apply to this section type. */
  checks: string[]
  /** Whether the card is collapsed, so the warning chip can expand it. */
  expandable: boolean
  onExpand: () => void
  label: string
}) {
  const groups = new Map<string, number[]>()
  for (const f of findings) {
    const lines = groups.get(f.category) ?? []
    if (f.line !== undefined) lines.push(f.line)
    groups.set(f.category, lines)
  }
  const passedNames = checks.filter((c) => !groups.has(c))
  const passed = passedNames.length
  const panel = (
    <div
      aria-hidden
      className="bg-popover text-popover-foreground fixed inset-x-4 bottom-20 z-40 hidden rounded-md border p-2 text-left shadow-md group-focus-within:block group-hover:block sm:absolute sm:inset-x-auto sm:top-full sm:right-0 sm:bottom-auto sm:mt-1 sm:w-64"
    >
      <ul className="space-y-1 text-[11px] leading-snug font-normal">
        {[...groups.entries()].map(([category, lines]) => (
          <li key={category} className="text-amber-700">
            ⚠ {category}
            {lines.length > 0 && (
              <span className="text-muted-foreground">
                {' '}
                — line{lines.length === 1 ? '' : 's'} {[...new Set(lines)].join(', ')}
              </span>
            )}
            {AUDIT_EXPLANATION[category] && (
              <span className="text-muted-foreground block">{AUDIT_EXPLANATION[category]}</span>
            )}
          </li>
        ))}
        {passed > 0 && (
          <li className="text-emerald-700">
            ✓ {passed} best practice{passed === 1 ? '' : 's'} applied
            <span className="text-muted-foreground block">{passedNames.join(', ')}</span>
          </li>
        )}
      </ul>
    </div>
  )
  if (findings.length === 0) {
    if (!filled) return null
    return (
      <span className="group relative flex shrink-0">
        <span
          tabIndex={0}
          className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700"
          aria-label={`${label}: ${checks.length} best practice${checks.length === 1 ? '' : 's'} applied`}
        >
          ✓
        </span>
        {panel}
      </span>
    )
  }
  if (!expandable) {
    return (
      <span className="group relative flex shrink-0">
        <span
          tabIndex={0}
          className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700"
          aria-label={`${label}: ${findings.length} suggestion${findings.length === 1 ? '' : 's'}`}
        >
          ⚠ {findings.length}
        </span>
        {panel}
      </span>
    )
  }
  return (
    <span className="group relative flex shrink-0">
      <button
        type="button"
        className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 transition hover:bg-amber-100"
        aria-label={`${label}: ${findings.length} suggestion${findings.length === 1 ? '' : 's'} — expand to review`}
        onPointerDown={onExpand}
        onClick={(e) => {
          if (e.detail === 0) onExpand()
        }}
      >
        ⚠ {findings.length}
      </button>
      {panel}
    </span>
  )
}

function BulletGuidance({
  bullets,
  onFix,
  busyLine,
  entryFilled = false,
  onHoverLine,
}: {
  bullets: string[]
  onFix?: (index: number) => void
  busyLine?: number | null
  entryFilled?: boolean
  /** Highlight the referenced line in the editor while a suggestion is hovered/focused. */
  onHoverLine?: (line: number | null) => void
}) {
  const results = useMemo(() => checkBullets(bullets), [bullets])
  const mix = useMemo(() => bulletMix(bullets), [bullets])
  const count = bullets.filter((b) => b.trim()).length
  const countNote = entryFilled && (count < 3 || count > 6)
  if (results.length === 0 && !countNote && mix.balanced) {
    if (!entryFilled || count === 0) return null
    return (
      <p className="text-xs text-emerald-700">
        ✓ Bullet best practices applied — 3–6 bullets, quantified, capitalized and punctuated.
      </p>
    )
  }
  return (
    <ul className="space-y-0.5 text-xs">
      {countNote && (
        <li className="text-amber-700">
          ⚠ Include 3–6 bullet points per role — {count === 0 ? 'none' : count} found in this one.
        </li>
      )}
      {!mix.balanced && (
        <li className="text-amber-700">
          ⚠ Key numbers in {mix.quantified} of {mix.total} bullet
          {mix.total === 1 ? '' : 's'} — aim for a balanced mix of descriptive and key-number
          bullets (%, $, count or timeframe).
        </li>
      )}
      {results.slice(0, 4).map((r) => (
        <li
          key={r.index}
          className="text-amber-700"
          onMouseEnter={() => onHoverLine?.(r.index)}
          onMouseLeave={() => onHoverLine?.(null)}
        >
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
              onFocus={() => onHoverLine?.(r.index)}
              onBlur={() => onHoverLine?.(null)}
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
  onJumpToTarget,
}: {
  kind: 'cover' | 'interview' | 'resignation' | null
  initialCompany?: string
  onClose: () => void
  resume: Resume
  onQuota: (remaining: number) => void
  onJumpToTarget: () => void
}) {
  const [company, setCompany] = useState(initialCompany)
  const [addressee, setAddressee] = useState('')
  const [highlights, setHighlights] = useState('')
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
  const [session, setSession] = useState<{
    questions: string[]
    idx: number
    entries: { q: string; a: string; fb: string }[]
  } | null>(null)
  const [lastKind, setLastKind] = useState(kind)
  const [timerStart, setTimerStart] = useState<number | null>(null)
  const [timerNow, setTimerNow] = useState(0)
  const [elapsedSec, setElapsedSec] = useState<number | null>(null)

  useEffect(() => {
    if (timerStart === null) return
    const id = window.setInterval(() => {
      setTimerNow(Date.now())
      if ((Date.now() - timerStart) / 1000 >= RESPONSE_WINDOW_SECONDS) {
        setElapsedSec(RESPONSE_WINDOW_SECONDS)
        setTimerStart(null)
      }
    }, 250)
    return () => window.clearInterval(id)
  }, [timerStart])

  const stopTimer = () => {
    if (timerStart === null) return
    setElapsedSec(Math.min(Math.round((Date.now() - timerStart) / 1000), RESPONSE_WINDOW_SECONDS))
    setTimerStart(null)
  }

  const resetTimer = () => {
    setTimerStart(null)
    setElapsedSec(null)
  }

  const analysis = useMemo(() => {
    if (kind !== 'interview') return null
    if (answer.trim().split(/\s+/).filter(Boolean).length < 10) return null
    return analyzeAnswer(answer, resume.jobDescription, resume.ignoredKeywords ?? [])
  }, [kind, answer, resume.jobDescription, resume.ignoredKeywords])

  const delivery = useMemo(
    () => (kind === 'interview' && elapsedSec !== null ? analyzeDelivery(answer, elapsedSec) : null),
    [kind, answer, elapsedSec]
  )

  const quickFillers = useMemo(
    () => (kind === 'interview' && analysis ? analyzeQuickFillers(answer, elapsedSec ?? undefined) : null),
    [kind, analysis, answer, elapsedSec]
  )

  const fillerSounds = useMemo(
    () => (kind === 'interview' && analysis ? analyzeFillerSounds(answer, elapsedSec ?? undefined) : null),
    [kind, analysis, answer, elapsedSec]
  )

  const tone = useMemo(
    () => (kind === 'interview' && analysis ? analyzeTone(answer) : null),
    [kind, analysis, answer]
  )

  /** JD keywords demonstrated in this answer that the resume itself still lacks. */
  const resumeGaps = useMemo(() => {
    if (kind !== 'interview' || !analysis?.keywords) return []
    const report = matchReport(resumeToPlainText(resume), resume.jobDescription ?? '')
    if (!report) return []
    const missingFromResume = new Set(report.missing)
    return analysis.keywords.covered.filter((k) => missingFromResume.has(k))
  }, [kind, analysis, resume])

  if (kind !== lastKind) {
    setLastKind(kind)
    if (kind !== null) setCompany(initialCompany)
    setAddressee('')
    setHighlights('')
    setResult('')
    setError('')
    setSavedId(null)
    setFeedback('')
    setFeedbackError('')
    setFeedbackBusy(false)
    setSuggested([])
    setSuggestBusy(false)
    setSession(null)
    setQuestion('')
    setAnswer('')
    setTimerStart(null)
    setElapsedSec(null)
  }

  const docFileName = (ext: string) =>
    kind === 'interview'
      ? professionalFileName([resume.contact.fullName, 'interview-prep'], ext)
      : kind === 'cover'
        ? professionalFileName([resume.contact.fullName, company, 'cover-letter'], ext)
        : professionalFileName([resume.contact.fullName, 'resignation-letter'], ext)

  type PracticeSession = { questions: string[]; idx: number; entries: { q: string; a: string; fb: string }[] }

  const sessionEntries = (s: PracticeSession) => {
    const entries = [...s.entries]
    if (answer.trim() || feedback) {
      entries.push({ q: s.questions[s.idx], a: answer.trim(), fb: feedback })
    }
    return entries
  }

  const finishSession = (s: PracticeSession, entries: { q: string; a: string; fb: string }[]) => {
    const role = aiTargetRole(resume) || 'your target job'
    const transcript = entries
      .map(
        (e, i) =>
          `Q${i + 1}. ${e.q}\n\nYour answer:\n${e.a || '[skipped]'}${e.fb ? `\n\nAI coaching:\n${e.fb}` : ''}`
      )
      .join('\n\n---\n\n')
    const report = sessionReport(entries, resume.jobDescription, resume.ignoredKeywords ?? [])
    setResult(
      `Practice session — ${role}\n${entries.length} of ${s.questions.length} questions answered\n\n${report ? `${report}\n\n` : ''}${transcript}`
    )
    setSavedId(null)
    setSession(null)
    setQuestion('')
    setAnswer('')
    setFeedback('')
    setFeedbackError('')
    resetTimer()
  }

  const advanceSession = (s: PracticeSession) => {
    const entries = sessionEntries(s)
    if (s.idx + 1 >= s.questions.length) {
      finishSession(s, entries)
      return
    }
    const next = { ...s, idx: s.idx + 1, entries }
    setSession(next)
    setQuestion(next.questions[next.idx])
    setAnswer('')
    setFeedback('')
    setFeedbackError('')
    resetTimer()
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
        role: aiTargetRole(resume),
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
        role: aiTargetRole(resume),
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
              role: aiTargetRole(resume),
              addressee: addressee.trim() || undefined,
              highlights: highlights.trim() || undefined,
              language: resume.language,
            })
          : await aiInterviewBrief({
              resumeText,
              jobDescription: jd,
              role: aiTargetRole(resume),
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
    const to = addressee.trim() || 'Hiring Manager'
    const spotlight = highlights.trim()
      ? `\n\nI'd particularly like to highlight: ${highlights.trim()}.`
      : ''
    setResult(
      `Dear ${to},\n\nI'm writing to apply for the ${role} position at ${co}. [One sentence on why this company or team specifically — a product, a mission, a recent launch.]\n\nIn my current role at [current company], I [your strongest, most relevant achievement — with a real number if you have one]. Before that, I [second relevant achievement or responsibility]. These map directly to what you're looking for: [requirement from the job description you meet best].${spotlight}\n\nI'd welcome the chance to talk about how I can help ${co} [team goal from the posting]. Thank you for your consideration.\n\nSincerely,\n${name}`
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
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="company">Company name</Label>
              <Input
                id="company"
                placeholder="e.g. Stripe"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cover-addressee">Hiring manager (optional)</Label>
              <Input
                id="cover-addressee"
                placeholder="e.g. Maya Chen"
                value={addressee}
                onChange={(e) => setAddressee(e.target.value)}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="cover-highlights">Details to highlight (optional)</Label>
              <Textarea
                id="cover-highlights"
                rows={2}
                placeholder="e.g. led the 2024 checkout redesign; fluent in Spanish"
                value={highlights}
                onChange={(e) => setHighlights(e.target.value)}
              />
            </div>
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
                      ? m.downloadTextPdf(title, result, docFileName('pdf'))
                      : m.downloadLetterPdf(resume, result, docFileName('pdf'))
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
                      ? m.downloadTextDocx(title, result, docFileName('docx'))
                      : m.downloadLetterDocx(resume, result, docFileName('docx'))
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
              {session && (
                <div className="bg-muted/50 space-y-1 rounded-md border px-3 py-2">
                  <p className="text-muted-foreground text-xs">
                    Question {session.idx + 1} of {session.questions.length}
                  </p>
                  <p className="text-sm">{session.questions[session.idx]}</p>
                </div>
              )}
              {!session && suggested.length > 0 && (
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
              {!session && suggested.length > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="min-h-10 sm:min-h-8"
                  onClick={() => {
                    setSession({ questions: suggested, idx: 0, entries: [] })
                    setQuestion(suggested[0])
                    setAnswer('')
                    setFeedback('')
                    setFeedbackError('')
                  }}
                >
                  <ListChecks /> Practice all {suggested.length}
                </Button>
              )}
              {!session && (
                <Input
                  id="practice-question"
                  placeholder="e.g. Tell me about a time you led a difficult project"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  maxLength={300}
                  className="min-h-10 sm:min-h-9"
                />
              )}
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
              <div className="flex flex-wrap items-center gap-2">
                {timerStart === null ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="min-h-10 sm:min-h-8"
                    onClick={() => {
                      setElapsedSec(null)
                      setTimerNow(Date.now())
                      setTimerStart(Date.now())
                    }}
                  >
                    <Timer />
                    {elapsedSec === null ? 'Start 2-minute window' : 'Retime answer'}
                  </Button>
                ) : (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="min-h-10 sm:min-h-8"
                      onClick={stopTimer}
                    >
                      <Timer />
                      Stop timer
                    </Button>
                    <span className="text-muted-foreground text-xs tabular-nums" role="timer">
                      {(() => {
                        const left = Math.max(
                          0,
                          RESPONSE_WINDOW_SECONDS - Math.floor((timerNow - timerStart) / 1000)
                        )
                        return `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')} left — answer out loud while you type`
                      })()}
                    </span>
                  </>
                )}
                {timerStart === null && elapsedSec !== null && (
                  <span className="text-muted-foreground text-xs tabular-nums">
                    Timed: {elapsedSec}s
                  </span>
                )}
              </div>
            </div>
            {analysis && (
              <div className="bg-muted/50 space-y-2 rounded-md border px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">
                    Practice score: <span className="tabular-nums">{analysis.score}</span>/100
                  </p>
                  <p className="text-muted-foreground text-xs">Instant · local — no AI used</p>
                </div>
                <p
                  className={
                    analysis.lengthBand === 'ideal'
                      ? 'text-xs text-emerald-700 dark:text-emerald-400'
                      : 'text-xs text-amber-700 dark:text-amber-400'
                  }
                >
                  {analysis.words} words — {analysis.lengthHint}
                </p>
                <div className="flex flex-wrap gap-1.5" aria-label="STAR structure coverage">
                  {(
                    [
                      ['Situation/context', analysis.star.context, 'set the scene: when, where, what was at stake'],
                      ['Action (yours)', analysis.star.action, 'say what you did — “I led / built / fixed…”'],
                      ['Result', analysis.star.result, 'end with the outcome — ideally a number'],
                    ] as const
                  ).map(([label, ok, hint]) => (
                    <span
                      key={label}
                      title={ok ? undefined : hint}
                      className={
                        ok
                          ? 'rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400'
                          : 'rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800 dark:bg-amber-950 dark:text-amber-400'
                      }
                    >
                      {ok ? '✓' : '·'} {label}
                    </span>
                  ))}
                </div>
                {analysis.keywords && (
                  <p className="text-muted-foreground text-xs">
                    Job keywords used: {analysis.keywords.covered.length}/
                    {analysis.keywords.covered.length + analysis.keywords.missing.length}
                    {analysis.keywords.missing.length > 0 &&
                      analysis.keywords.highPriorityMissing.length === 0 && (
                        <> — try working in: {analysis.keywords.missing.slice(0, 5).join(', ')}</>
                      )}
                  </p>
                )}
                {analysis.keywords && analysis.keywords.highPriorityMissing.length > 0 && (
                  <>
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      High priority: {analysis.keywords.highPriorityMissing.slice(0, 5).join(', ')}
                    </p>
                    {analysis.keywords.missing.length >
                      analysis.keywords.highPriorityMissing.length && (
                      <p className="text-muted-foreground text-xs">
                        Also mentioned:{' '}
                        {analysis.keywords.missing
                          .filter((k) => !analysis.keywords?.highPriorityMissing.includes(k))
                          .slice(0, 5)
                          .join(', ')}
                      </p>
                    )}
                  </>
                )}
                {resumeGaps.length > 0 && (
                  <p className="text-xs text-sky-700 dark:text-sky-400">
                    Add to your resume: you used{' '}
                    {resumeGaps.slice(0, 5).join(', ')}
                    {resumeGaps.length > 5 && <> +{resumeGaps.length - 5} more</>} in this answer,
                    but {resumeGaps.length === 1 ? "it's" : "they're"} not on your resume yet.{' '}
                    <button
                      type="button"
                      onClick={onJumpToTarget}
                      className="font-medium underline underline-offset-2"
                    >
                      Open keyword targeting →
                    </button>
                  </p>
                )}
                {delivery && (
                  <>
                    <p
                      className={
                        delivery.paceBand === 'ideal'
                          ? 'text-xs text-emerald-700 dark:text-emerald-400'
                          : 'text-xs text-amber-700 dark:text-amber-400'
                      }
                    >
                      Pace: {delivery.wpm} wpm — {delivery.paceHint}
                    </p>
                    <p
                      className={
                        delivery.windowBand === 'ideal'
                          ? 'text-xs text-emerald-700 dark:text-emerald-400'
                          : 'text-xs text-amber-700 dark:text-amber-400'
                      }
                    >
                      Speaking time: {delivery.windowPct}% of the 2-minute window — {delivery.windowHint}
                    </p>
                  </>
                )}
                {((quickFillers && quickFillers.total > 0) || analysis.weHeavy) && (
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    {quickFillers && quickFillers.total > 0 && (
                      <>
                        Quick fillers to cut:{' '}
                        {quickFillers.hits
                          .map(
                            (h) =>
                              `“${h.phrase}” ×${h.count}${h.atStart > 0 ? ` (${h.atStart} at sentence start)` : ''}`
                          )
                          .join(', ')}
                        {quickFillers.perMinute !== null && <> — {quickFillers.perMinute}/min</>}
                        {'. '}
                      </>
                    )}
                    {analysis.weHeavy && <>Mostly “we” — interviewers want your part; use “I”.</>}
                  </p>
                )}
                {fillerSounds && fillerSounds.total > 0 && (
                  <p
                    className={
                      fillerSounds.band === 'good'
                        ? 'text-xs text-emerald-700 dark:text-emerald-400'
                        : 'text-xs text-amber-700 dark:text-amber-400'
                    }
                  >
                    Filler sounds:{' '}
                    {fillerSounds.hits.map((h) => `“${h.sound}” ×${h.count}`).join(', ')}
                    {fillerSounds.perMinute !== null && (
                      <>
                        {' — '}
                        {fillerSounds.perMinute}/min
                        {fillerSounds.band === 'good'
                          ? ', within the 1–2 per minute guideline.'
                          : ' — aim for no more than 1–2 per minute; pause instead of filling silence.'}
                      </>
                    )}
                    {fillerSounds.perMinute === null && '.'}
                  </p>
                )}
                {tone && (
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Tone:{' '}
                    {(
                      [
                        ['clarity', tone.clarity],
                        ['confidence', tone.confidence],
                        ['enthusiasm', tone.enthusiasm],
                      ] as const
                    ).map(([name, dim], i) => (
                      <span key={name}>
                        {i > 0 && ' · '}
                        <span
                          className={
                            dim.good
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-amber-700 dark:text-amber-400'
                          }
                        >
                          {name} — {dim.detail}
                        </span>
                      </span>
                    ))}
                    .
                  </p>
                )}
              </div>
            )}
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
              {!session && (
                <Button
                  onClick={() => void suggestQuestions()}
                  disabled={feedbackBusy || suggestBusy}
                  variant="outline"
                  className="min-h-10 sm:min-h-9"
                >
                  {suggestBusy ? <Loader2 className="animate-spin" /> : <Sparkles />}
                  {suggestBusy ? 'Thinking…' : 'Suggest questions'}
                </Button>
              )}
              {!session && (
                <Button
                  onClick={() => {
                    setSuggested(localInterviewQuestions(resume))
                    setFeedbackError('')
                  }}
                  disabled={feedbackBusy || suggestBusy}
                  variant="outline"
                  className="min-h-10 sm:min-h-9"
                >
                  <ListChecks /> Instant questions
                </Button>
              )}
              {session && (
                <>
                  <Button
                    onClick={() => advanceSession(session)}
                    disabled={feedbackBusy}
                    className="min-h-10 sm:min-h-9"
                  >
                    {session.idx + 1 >= session.questions.length
                      ? 'Finish session'
                      : 'Next question'}
                  </Button>
                  <Button
                    onClick={() => finishSession(session, sessionEntries(session))}
                    disabled={feedbackBusy}
                    variant="outline"
                    className="min-h-10 sm:min-h-9"
                  >
                    End early
                  </Button>
                </>
              )}
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

/** Apply accepted tailoring suggestions to a copy of the resume (for the report). */
function applyTailored(resume: Resume, accepted: TailorSuggestion[]): Resume {
  const byId = new Map(accepted.map((r) => [r.id, r.suggestion]))
  return {
    ...resume,
    summary: byId.get('summary') ?? resume.summary,
    experience: resume.experience.map((e) => ({
      ...e,
      bullets: e.bullets.map((b, i) => byId.get(`${e.id}:${i}`) ?? b),
    })),
  }
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
  const [snapshot, setSnapshot] = useState<Resume>(resume)

  const run = async () => {
    setSnapshot(resume)
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
        role: aiTargetRole(resume),
        language: resume.language,
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
  const jd = snapshot.jobDescription
  const report = useMemo(() => {
    if (!rows || rows.length === 0 || !jd.trim()) return null
    const before = scoreResume(snapshot, jd)
    if (before.keywordScore === null) return null
    const accepted = rows.filter((r) => r.status === 'accepted')
    const after = scoreResume(applyTailored(snapshot, accepted), jd)
    const beforeSet = new Set(before.matched)
    return {
      before,
      after,
      gained: after.matched.filter((k) => !beforeSet.has(k)),
      accepted: accepted.length,
      kept: rows.filter((r) => r.status === 'skipped').length,
    }
  }, [rows, jd, snapshot])
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
        {report && (
          <div className="space-y-2 rounded-lg border bg-muted/40 p-3 text-sm" data-testid="tailor-report">
            <p className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">
              Tailoring report
            </p>
            <p>
              Keyword match:{' '}
              <span className="font-medium">
                {report.before.matched.length} of{' '}
                {report.before.matched.length + report.before.missing.length} ·{' '}
                {report.before.keywordScore}%
              </span>
              {' → '}
              <span
                className={`font-medium ${
                  (report.after.keywordScore ?? 0) > (report.before.keywordScore ?? 0)
                    ? 'text-emerald-700'
                    : ''
                }`}
              >
                {report.after.matched.length} of{' '}
                {report.after.matched.length + report.after.missing.length} ·{' '}
                {report.after.keywordScore}%
              </span>
              <span className="text-muted-foreground">
                {' '}
                with {report.accepted} accepted · {report.kept} kept
              </span>
            </p>
            {report.gained.length > 0 && (
              <p className="flex flex-wrap items-center gap-1 text-xs">
                <span className="text-muted-foreground">Newly covered:</span>
                {report.gained.map((k) => (
                  <span
                    key={k}
                    className="rounded-full bg-emerald-100 px-2 py-0.5 font-medium text-emerald-800"
                  >
                    {k}
                  </span>
                ))}
              </p>
            )}
            {report.after.missing.length > 0 && (
              <p className="flex flex-wrap items-center gap-1 text-xs">
                <span className="text-muted-foreground">Still missing:</span>
                {report.after.missing.slice(0, 6).map((k) => (
                  <span key={k} className="rounded-full bg-muted px-2 py-0.5">
                    {k}
                  </span>
                ))}
                {report.after.missing.length > 6 && (
                  <span className="text-muted-foreground">
                    +{report.after.missing.length - 6} more
                  </span>
                )}
              </p>
            )}
          </div>
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

/** Deep-dive guide for each score dimension, served from our own /guides pages. */
const DIMENSION_GUIDES: Record<string, string> = {
  keywords: '/guides/resume-keywords',
  'ats-structure': '/guides/ats-friendly-resume',
  quantification: '/guides/resume-bullet-points',
  verbs: '/guides/resume-action-verbs',
  brevity: '/guides/how-long-should-a-resume-be',
  buzzwords: '/guides/common-resume-mistakes',
  consistency: '/guides/best-resume-format',
  completeness: '/guides/best-resume-format',
}

/** Rule-based multi-dimension score breakdown — no AI calls, computed locally. */
function HealthDialog({
  open,
  onClose,
  health,
  ats,
  onJump,
  onJumpEntry,
}: {
  open: boolean
  onClose: () => void
  health: HealthReport
  ats: AtsResult
  onJump: (anchor: SectionAnchor) => void
  onJumpEntry: (id: string) => void
}) {
  const jump = (anchor: SectionAnchor) => {
    onClose()
    requestAnimationFrame(() => onJump(anchor))
  }
  const jumpEntry = (id: string) => {
    onClose()
    requestAnimationFrame(() => onJumpEntry(id))
  }
  const fixes = priorityFixes(ats, health)
  const structureFindings = ats.checks
    .filter((c) => !c.pass)
    .map((c) => ({ text: `${c.label} \u2014 ${c.hint}`, anchor: c.anchor }))
  const atsDimensions: (HealthDimension & {
    richFindings?: { text: string; anchor?: SectionAnchor }[]
  })[] = [
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
      findings: structureFindings.map((f) => f.text),
      richFindings: structureFindings,
    },
  ]
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Score breakdown — ATS {ats.score}/100 · Writing{' '}
            {`${health.score}/100 (${scoreVerdict(health.score)})`}
          </DialogTitle>
          <DialogDescription>
            Every check is rule-based and computed in your browser — a transparent heuristic, not
            a hiring prediction. Nothing leaves your device.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-lg border p-3">
            <p className="text-sm font-medium">Priority fixes</p>
            {fixes.length === 0 ? (
              <p className="mt-1.5 text-xs text-emerald-600">
                No priority fixes — every check passes and all dimensions score 80+.
              </p>
            ) : (
              <ul className="mt-1.5 space-y-1.5">
                {fixes.map((f) => (
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
                      {f.text}
                      {f.anchor && (
                        <button
                          type="button"
                          className="text-primary ml-1.5 inline-flex min-h-10 items-center underline sm:min-h-0"
                          onClick={() => f.anchor && jump(f.anchor)}
                        >
                          Fix →
                        </button>
                      )}
                      {!f.anchor && f.entryId && f.entryLabel && (
                        <button
                          type="button"
                          className="text-primary ml-1.5 inline-flex min-h-10 items-center underline sm:min-h-0"
                          aria-label={`Go to entry: ${f.entryLabel}`}
                          onClick={() => f.entryId && jumpEntry(f.entryId)}
                        >
                          → {f.entryLabel}
                        </button>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {[
            ...atsDimensions,
            ...(health.dimensions as (HealthDimension & {
              richFindings?: { text: string; anchor?: SectionAnchor }[]
            })[]),
          ].map((d) => (
            <div key={d.id} className="rounded-lg border p-3">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="font-medium">
                  {d.label}
                  {d.anchor && d.score < 100 && d.findings.length > 0 && (
                    <button
                      type="button"
                      className="text-primary ml-1.5 inline-flex min-h-10 items-center text-xs font-normal underline sm:min-h-0"
                      onClick={() => d.anchor && jump(d.anchor)}
                    >
                      Fix →
                    </button>
                  )}
                  {DIMENSION_GUIDES[d.id] && (
                    <a
                      href={DIMENSION_GUIDES[d.id]}
                      target="_blank"
                      rel="noopener"
                      aria-label={`Read the ${d.label} guide — opens in a new tab`}
                      className="text-muted-foreground hover:text-foreground ml-1.5 inline-flex min-h-10 items-center gap-0.5 text-xs font-normal underline sm:min-h-0"
                    >
                      <BookOpen aria-hidden className="size-3" />
                      Guide
                    </a>
                  )}
                </span>
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
                  {(
                    (d.richFindings ?? d.findings.map((text) => ({ text }))) as (HealthFinding & {
                      anchor?: SectionAnchor
                    })[]
                  ).map((f) => (
                    <li key={f.text}>
                      {f.text}
                      {f.anchor && (
                        <button
                          type="button"
                          className="text-primary ml-1.5 inline-flex min-h-10 items-center underline sm:min-h-0"
                          onClick={() => f.anchor && jump(f.anchor)}
                        >
                          Fix →
                        </button>
                      )}
                      {f.entryId && f.entryLabel && (
                        <button
                          type="button"
                          className="text-primary ml-1.5 inline-flex min-h-10 items-center underline sm:min-h-0"
                          aria-label={`Go to entry: ${f.entryLabel}`}
                          onClick={() => f.entryId && jumpEntry(f.entryId)}
                        >
                          → {f.entryLabel}
                        </button>
                      )}
                    </li>
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

/** Entry-list sections compared by entry id in checkpoint summaries */
const SNAPSHOT_ENTRY_SECTIONS: { key: keyof Resume; label: string }[] = [
  { key: 'experience', label: 'Experience' },
  { key: 'education', label: 'Education' },
  { key: 'projects', label: 'Projects' },
  { key: 'certItems', label: 'Certifications' },
  { key: 'involvement', label: 'Involvement' },
  { key: 'coursework', label: 'Coursework' },
  { key: 'awards', label: 'Awards' },
  { key: 'publications', label: 'Publications' },
  { key: 'references', label: 'References' },
  { key: 'military', label: 'Military service' },
  { key: 'agents', label: 'Agents' },
  { key: 'customSections', label: 'Custom sections' },
]

const SNAPSHOT_TARGET_KEYS: (keyof Resume)[] = [
  'targetRole',
  'jobDescription',
  'experienceLevel',
  'targetCompany',
  'ignoredKeywords',
]

/** Section-level summary of what restoring `snap` would change vs `current`. */
function snapshotChanges(snap: Resume, current: Resume): string[] {
  const changes: string[] = []
  const handled = new Set<string>(['summary', 'skills', 'contact', 'hiddenContact'])
  if (
    JSON.stringify(snap.contact) !== JSON.stringify(current.contact) ||
    JSON.stringify(snap.hiddenContact ?? []) !== JSON.stringify(current.hiddenContact ?? [])
  )
    changes.push('Contact')
  if (snap.summary !== current.summary) changes.push('Summary')
  if (snap.skills !== current.skills) changes.push('Skills')
  for (const { key, label } of SNAPSHOT_ENTRY_SECTIONS) {
    handled.add(key)
    const a = (snap[key] ?? []) as { id: string }[]
    const b = (current[key] ?? []) as { id: string }[]
    const bById = new Map(b.map((e) => [e.id, JSON.stringify(e)]))
    let added = 0
    let removed = 0
    let edited = 0
    for (const entry of a) {
      const other = bById.get(entry.id)
      if (other === undefined) added += 1
      else if (other !== JSON.stringify(entry)) edited += 1
    }
    const aIds = new Set(a.map((e) => e.id))
    for (const entry of b) if (!aIds.has(entry.id)) removed += 1
    let differs = added > 0 || removed > 0 || edited > 0
    if (key === 'certItems') {
      handled.add('certifications')
      if (snap.certifications !== current.certifications) differs = true
    }
    if (differs) {
      const parts = [
        edited > 0 ? `${edited} edited` : '',
        added > 0 ? `+${added}` : '',
        removed > 0 ? `\u2212${removed}` : '',
      ].filter(Boolean)
      changes.push(parts.length > 0 ? `${label} (${parts.join(', ')})` : label)
    }
  }
  if (
    SNAPSHOT_TARGET_KEYS.some(
      (k) => JSON.stringify(snap[k] ?? null) !== JSON.stringify(current[k] ?? null)
    )
  )
    changes.push('Target job')
  for (const k of SNAPSHOT_TARGET_KEYS) handled.add(k)
  const rest = new Set([...Object.keys(snap), ...Object.keys(current)])
  for (const k of rest) {
    if (handled.has(k)) continue
    if (
      JSON.stringify(snap[k as keyof Resume] ?? null) !==
      JSON.stringify(current[k as keyof Resume] ?? null)
    ) {
      changes.push('Design & layout')
      break
    }
  }
  return changes
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
              const changes =
                JSON.stringify(s.data) === currentJson ? [] : snapshotChanges(s.data, resume)
              const isCurrent = changes.length === 0
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
                    {changes.length > 0 && (
                      <p className="text-muted-foreground text-xs">
                        Differs from current:{' '}
                        {changes.slice(0, 4).join(' · ')}
                        {changes.length > 4 ? ` · +${changes.length - 4} more` : ''}
                      </p>
                    )}
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
  const [bestId] = useState(() =>
    bestExperienceForKeyword(
      resume.experience
        .filter((e) => !e.hidden)
        .map((e) => ({
          id: e.id,
          text: [e.role, e.company, e.companyInfo ?? '', ...e.bullets].join('\n'),
        })),
      keyword,
      resume.jobDescription
    )
  )
  const [expId, setExpId] = useState(bestId ?? resume.experience[0]?.id ?? '')
  const [inserted, setInserted] = useState(false)

  const run = async () => {
    setBusy(true)
    setError('')
    try {
      const { text: drafted, freeRemaining } = await aiKeywordBullet({
        keyword,
        resumeText: resumeToPlainText(resume),
        jobDescription: resume.jobDescription,
        role: aiTargetRole(resume),
        language: resume.language,
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
                    {([e.role, e.company].filter(Boolean).join(' at ') || 'Experience') +
                      (e.id === bestId && resume.experience.length > 1 ? ' — best match' : '')}
                  </option>
                ))}
              </select>
              {bestId !== null && resume.experience.length > 1 && (
                <p className="text-muted-foreground text-xs">
                  Preselected the role that best matches this keyword — change it if you disagree.
                </p>
              )}
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
