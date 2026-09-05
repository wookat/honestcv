/**
 * Resume dashboard: card grid of the current draft plus every saved copy,
 * with open / download / duplicate / rename / delete. All data lives in localStorage.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  BriefcaseBusiness,
  ChevronDown,
  ChevronRight,
  Copy,
  Download,
  FileDown,
  FilePlus2,
  FileText,
  FileUp,
  FolderInput,
  LayoutGrid,
  List,
  Loader2,
  MessagesSquare,
  Pencil,
  Search,
  Star,
  Trash2,
  Undo2,
  X,
} from 'lucide-react'

import { SiteFooter, SiteHeader, usePageMeta } from '@/components/Layout'
import {
  FreeDownloadDialog,
  UpgradeDialog,
  hasSubscribed,
  useFreeMode,
  useLicense,
} from '@/components/Paywall'
import { PlanCard, WorkspaceNav } from '@/components/WorkspaceNav'
import { ResumePreview } from '@/components/ResumePreview'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { scoreResume } from '@/lib/ats'
import { downloadText, professionalFileName } from '@/lib/download'
import { IMPORT_ACCEPT, extractTextFromFile } from '@/lib/extractFile'
import { exportWorkspace, parseWorkspaceBackup, restoreWorkspace } from '@/lib/workspace'
import { looksLikeLinkedInExport, parseResumeText } from '@/lib/importText'
import {
  type CareerDoc,
  type CareerDocKind,
  deleteCareerDoc,
  duplicateCareerDoc,
  listCareerDocs,
  renameCareerDoc,
  restoreCareerDoc,
  saveCareerDoc,
  splitAtSignature,
  updateCareerDoc,
} from '@/lib/documents'
import { LETTER_EXAMPLES, type LetterExample } from '@/lib/letterExamples'
import {
  EXPERIENCE_LEVELS,
  EXPERIENCE_LEVEL_LABELS,
  RESUME_LANGUAGES,
  type ResumeLanguage,
  type ExamplePerson,
  type Resume,
  type ResumeVersion,
  deleteResumeVersion,
  deleteResumeVersions,
  duplicateResumeVersion,
  emptyResume,
  exampleToResume,
  getActiveVersionId,
  listResumeVersions,
  loadResume,
  restoreResumeVersion,
  saveResume,
  saveResumeVersion,
  setActiveVersionId,
  updateResumeVersion,
  visibleResume,
} from '@/lib/resume'
import { hasShareLink, revokeShareLinksFor } from '@/lib/share'
import { resolveTemplate } from '@/lib/templates'

interface ExampleEntry {
  slug: string
  role: string
  sector: string
  person: ExamplePerson
}

const editedAgo = (ms: number) => {
  if (!ms) return 'Edited a while ago'
  const days = Math.floor((Date.now() - ms) / 86400000)
  if (days <= 0) return 'Edited today'
  return days === 1 ? 'Edited 1 day ago' : `Edited ${days} days ago`
}

/** Formatted letter preview mirroring the letterhead PDF/DOCX export. */
function LetterPreview({
  doc,
  text,
  letterhead,
}: {
  doc: CareerDoc
  text: string
  letterhead: Resume
}) {
  const tpl = resolveTemplate(letterhead.templateId, letterhead.accentColor)
  const c = letterhead.contact
  const contactLine = [c.email, c.phone, c.location, c.website].filter(Boolean).join(' \u00b7 ')
  const signature = doc.kind !== 'interview' ? doc.signature : undefined
  const split = signature ? splitAtSignature(text) : { before: text, after: '' }
  const toParagraphs = (t: string) =>
    t
      .split(/\n{2,}/)
      .map((b) => b.trim())
      .filter(Boolean)
  const paragraphs = toParagraphs(split.before)
  const afterParagraphs = signature ? toParagraphs(split.after) : []
  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const hasLetterhead = doc.kind !== 'interview' && (c.fullName.trim() !== '' || contactLine !== '')
  return (
    <div
      className={`overflow-y-auto rounded-md border bg-white p-6 text-[13px] leading-relaxed text-neutral-900 shadow-sm sm:p-8 ${
        tpl.serif ? 'font-serif' : 'font-sans'
      }`}
      style={{ maxHeight: '55vh' }}
    >
      {doc.kind === 'interview' ? (
        <p className="text-base font-bold">{doc.title}</p>
      ) : (
        <>
          {c.fullName.trim() !== '' && <p className="text-base font-bold">{c.fullName.trim()}</p>}
          {contactLine !== '' && (
            <p className="mt-0.5 text-[11px] text-neutral-500">{contactLine}</p>
          )}
          {hasLetterhead && (
            <hr className="mt-3 border-t" style={{ borderColor: tpl.accent }} aria-hidden />
          )}
          <p className={`text-[11px] text-neutral-500 ${hasLetterhead ? 'mt-4' : ''}`}>{date}</p>
        </>
      )}
      {paragraphs.length === 0 ? (
        <p className="mt-4 text-neutral-400 italic">
          Nothing to preview yet — write something in the Edit tab.
        </p>
      ) : (
        paragraphs.map((p, i) => (
          <p key={i} className="mt-4 whitespace-pre-wrap">
            {p}
          </p>
        ))
      )}
      {signature && (
        <img src={signature} alt="Signature" className="mt-3 max-h-16 w-auto max-w-40" />
      )}
      {afterParagraphs.map((p, i) => (
        <p key={`after-${i}`} className="mt-2 whitespace-pre-wrap">
          {p}
        </p>
      ))}
    </div>
  )
}

function Thumb({ resume }: { resume: Resume }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none relative h-44 select-none overflow-hidden rounded-t-md border-b bg-slate-100"
    >
      <div
        className="absolute top-3 left-4 origin-top-left"
        style={{ width: 'calc((100% - 2rem) / 0.35)', transform: 'scale(0.35)' }}
      >
        <ResumePreview resume={visibleResume(resume)} />
      </div>
    </div>
  )
}

export default function Dashboard({ section }: { section?: 'documents' | 'samples' } = {}) {
  usePageMeta(
    section === 'documents'
      ? 'Career documents — RezUp'
      : section === 'samples'
        ? 'Sample library — RezUp'
        : 'My resumes — RezUp',
    section === 'documents'
      ? 'Cover letters, interview prep and resignation letters you saved. Everything stays in your browser.'
      : section === 'samples'
        ? 'Start from a proven resume example for your role. Everything stays in your browser.'
        : 'Manage your resume drafts and job-tailored copies. Everything stays in your browser.'
  )
  const navigate = useNavigate()
  const { hash } = useLocation()
  useEffect(() => {
    if (hash) document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' })
  }, [hash])
  const [versions, setVersions] = useState<ResumeVersion[]>(() => listResumeVersions())
  const [draft] = useState<Resume | null>(() => loadResume())
  const [activeId] = useState<string | null>(() => getActiveVersionId())
  // The copy the Builder is currently editing (if any) — its card is the
  // live content, so the separate draft card would be a duplicate.
  const activeCopy = activeId ? (versions.find((v) => v.id === activeId) ?? null) : null
  const [confirmOpen, setConfirmOpen] = useState<ResumeVersion | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<ResumeVersion | null>(null)
  const [editing, setEditing] = useState<{
    id: string
    name: string
    folder: string
    targetRole: string
    targetCompany: string
    experienceLevel: NonNullable<Resume['experienceLevel']>
    jobDescription: string
  } | null>(null)
  const [docs, setDocs] = useState<CareerDoc[]>(() => listCareerDocs())
  const [storageError, setStorageError] = useState(false)
  /** Applies a document mutation; surfaces the storage-full alert when nothing was written. */
  const applyDocs = (next: CareerDoc[] | null): boolean => {
    if (next === null) {
      setStorageError(true)
      return false
    }
    setDocs(next)
    return true
  }
  /** Applies a resume-copy mutation; surfaces the storage-full alert when nothing was written. */
  const applyVersions = (next: ResumeVersion[] | null): boolean => {
    if (next === null) {
      setStorageError(true)
      return false
    }
    setVersions(next)
    return true
  }
  // On /documents the type filter lives in the query string so refresh/share keeps your place.
  const [docSeedParams] = useState(() =>
    section === 'documents' ? new URLSearchParams(window.location.search) : null
  )
  const [docKind, setDocKind] = useState<CareerDocKind | 'all'>(() => {
    const kind = docSeedParams?.get('kind')
    return kind === 'cover' || kind === 'interview' || kind === 'resignation' ? kind : 'all'
  })
  // ?doc=<id> deep link (e.g. the /jobs "Cover letter: … Open" row) opens the viewer;
  // the kind-filter URL sync effect drops the one-shot param after mount.
  const [openDoc, setOpenDoc] = useState<CareerDoc | null>(() => {
    const id = docSeedParams?.get('doc')
    return id ? (listCareerDocs().find((d) => d.id === id) ?? null) : null
  })
  // A dead ?doc= link (document deleted or wrong id) gets an honest notice
  // instead of silently showing the plain documents list.
  const [docLinkNotFound, setDocLinkNotFound] = useState(() => {
    const id = docSeedParams?.get('doc')
    return Boolean(id) && !listCareerDocs().some((d) => d.id === id)
  })
  const [docText, setDocText] = useState(() => openDoc?.text ?? '')
  const [docCopied, setDocCopied] = useState<'idle' | 'copied' | 'failed'>('idle')
  const [docView, setDocView] = useState<'edit' | 'preview'>('edit')
  const [confirmDeleteDoc, setConfirmDeleteDoc] = useState<CareerDoc | null>(null)
  const [renamingDoc, setRenamingDoc] = useState<{ doc: CareerDoc; title: string } | null>(null)
  const [previewLetter, setPreviewLetter] = useState<LetterExample | null>(null)
  const signatureInputRef = useRef<HTMLInputElement>(null)
  const [signatureError, setSignatureError] = useState('')
  const [confirmingDocClose, setConfirmingDocClose] = useState(false)
  const docImportInputRef = useRef<HTMLInputElement>(null)
  const [docImportBusy, setDocImportBusy] = useState(false)
  const [docImportError, setDocImportError] = useState('')
  const importInputRef = useRef<HTMLInputElement>(null)
  const [importBusy, setImportBusy] = useState(false)
  const [importError, setImportError] = useState('')
  const [importDragOver, setImportDragOver] = useState(false)
  const [confirmImport, setConfirmImport] = useState<Resume | null>(null)
  const [importedLinkedIn, setImportedLinkedIn] = useState(false)
  const [linkedInOpen, setLinkedInOpen] = useState(false)
  const [examples, setExamples] = useState<ExampleEntry[]>([])
  const [examplesState, setExamplesState] = useState<'loading' | 'ready' | 'failed'>('loading')
  // On /samples the filters live in the query string so refresh/share keeps your place.
  const [seedParams] = useState(() =>
    section === 'samples' ? new URLSearchParams(window.location.search) : null
  )
  const [exampleQuery, setExampleQuery] = useState(() => seedParams?.get('q') ?? '')
  const [exampleSector, setExampleSector] = useState(() => seedParams?.get('sector') ?? 'All')
  const [previewExample, setPreviewExample] = useState<ExampleEntry | null>(null)
  const [savedSamples, setSavedSamples] = useState<string[]>(() => {
    try {
      const parsed: unknown = JSON.parse(localStorage.getItem('honestcv.savedSamples') || '[]')
      return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : []
    } catch {
      return []
    }
  })
  const [savedOnly, setSavedOnly] = useState(() => seedParams?.get('saved') === '1')
  const toggleSavedSample = (slug: string) =>
    setSavedSamples((s) => {
      const next = s.includes(slug) ? s.filter((x) => x !== slug) : [...s, slug]
      localStorage.setItem('honestcv.savedSamples', JSON.stringify(next))
      return next
    })
  const [newOpen, setNewOpen] = useState(false)
  const [newKeepCopy, setNewKeepCopy] = useState(true)
  const [newRole, setNewRole] = useState('')
  const [newCompany, setNewCompany] = useState('')
  const [newLevel, setNewLevel] = useState<NonNullable<Resume['experienceLevel']>>('')
  const [newLanguage, setNewLanguage] = useState<ResumeLanguage>('en')
  const [newJd, setNewJd] = useState('')
  const freeMode = useFreeMode()
  const { license } = useLicense()
  const unlocked = Boolean(license)
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [freeDlOpen, setFreeDlOpen] = useState(false)
  const pendingDl = useRef<{ resume: Resume; fmt: 'pdf' | 'docx' } | null>(null)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [dlError, setDlError] = useState<string | null>(null)
  const [view, setView] = useState<'grid' | 'list'>(() =>
    localStorage.getItem('honestcv.dashboardView') === 'list' ? 'list' : 'grid'
  )
  const changeView = (v: 'grid' | 'list') => {
    setView(v)
    localStorage.setItem('honestcv.dashboardView', v)
  }
  const [sortBy, setSortBy] = useState<'edited' | 'created' | 'name'>('edited')
  const [copyQuery, setCopyQuery] = useState('')
  const [folderFilter, setFolderFilter] = useState<string>('all')
  const [moving, setMoving] = useState<ResumeVersion | 'bulk' | null>(null)
  const [moveNewName, setMoveNewName] = useState('')
  const [bulkMode, setBulkMode] = useState(false)
  const [bulkIds, setBulkIds] = useState<ReadonlySet<string>>(new Set())
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false)
  const [renamingFolder, setRenamingFolder] = useState<{ from: string; to: string } | null>(null)
  const [confirmRemoveFolder, setConfirmRemoveFolder] = useState<string | null>(null)
  const workspaceFileRef = useRef<HTMLInputElement>(null)
  const [pendingRestore, setPendingRestore] = useState<Record<string, string> | null>(null)
  const [workspaceError, setWorkspaceError] = useState('')
  const [undoDelete, setUndoDelete] = useState<
    | { kind: 'copy'; version: ResumeVersion; index: number }
    | { kind: 'copies'; entries: { version: ResumeVersion; index: number }[] }
    | { kind: 'doc'; doc: CareerDoc; index: number }
    | null
  >(null)

  useEffect(() => {
    if (!undoDelete) return
    const t = setTimeout(() => setUndoDelete(null), 10000)
    return () => clearTimeout(t)
  }, [undoDelete])
  const [collapsedFolders, setCollapsedFolders] = useState<string[]>(() => {
    try {
      const parsed: unknown = JSON.parse(
        localStorage.getItem('honestcv.dashboardFoldersCollapsed') || '[]'
      )
      return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : []
    } catch {
      return []
    }
  })
  const toggleFolder = (f: string) =>
    setCollapsedFolders((c) => {
      const next = c.includes(f) ? c.filter((x) => x !== f) : [...c, f]
      localStorage.setItem('honestcv.dashboardFoldersCollapsed', JSON.stringify(next))
      return next
    })
  const moveVersionTo = (folder: string | undefined) => {
    if (!moving) return
    if (moving === 'bulk') {
      let next: ResumeVersion[] | null = versions
      for (const id of bulkSelected) {
        next = updateResumeVersion(id, { folder })
        if (next === null) break
      }
      if (!applyVersions(next)) return
      setBulkIds(new Set())
    } else if (!applyVersions(updateResumeVersion(moving.id, { folder }))) {
      return
    }
    setMoving(null)
    setMoveNewName('')
  }
  const toggleBulk = (id: string) =>
    setBulkIds((s) => {
      const next = new Set(s)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  /** Selection pruned to copies that still exist. */
  const bulkSelected = versions.filter((v) => bulkIds.has(v.id)).map((v) => v.id)
  const renameFolder = (from: string, to: string) => {
    let next: ResumeVersion[] | null = versions
    for (const v of versions) {
      if (v.folder !== from) continue
      next = updateResumeVersion(v.id, { folder: to })
      if (next === null) break
    }
    if (!applyVersions(next)) return
    setCollapsedFolders((c) => {
      const updated = c.map((x) => (x === from ? to : x))
      localStorage.setItem('honestcv.dashboardFoldersCollapsed', JSON.stringify(updated))
      return updated
    })
  }
  const removeFolder = (name: string) => {
    let next: ResumeVersion[] | null = versions
    for (const v of versions) {
      if (v.folder !== name) continue
      next = updateResumeVersion(v.id, { folder: undefined })
      if (next === null) break
    }
    applyVersions(next)
  }
  const folders = useMemo(() => {
    const names = new Set<string>()
    for (const v of versions) if (v.folder) names.add(v.folder)
    return [...names].sort((a, b) => a.localeCompare(b))
  }, [versions])
  const activeFolder =
    folderFilter === 'all' || folderFilter === 'none' || folders.includes(folderFilter)
      ? folderFilter
      : 'all'
  const sortedVersions = useMemo(() => {
    const q = copyQuery.trim().toLowerCase()
    const arr = versions.filter(
      (v) =>
        (activeFolder === 'all'
          ? true
          : activeFolder === 'none'
            ? !v.folder
            : v.folder === activeFolder) &&
        (!q || v.name.toLowerCase().includes(q) || (v.folder ?? '').toLowerCase().includes(q))
    )
    if (sortBy === 'name') arr.sort((a, b) => a.name.localeCompare(b.name))
    else if (sortBy === 'created')
      arr.sort((a, b) => (b.createdAt ?? b.updatedAt) - (a.createdAt ?? a.updatedAt))
    else arr.sort((a, b) => b.updatedAt - a.updatedAt)
    return arr
  }, [versions, sortBy, activeFolder, copyQuery])
  const folderGroups = useMemo(() => {
    if (activeFolder !== 'all' || folders.length === 0) return []
    return folders
      .map((f) => [f, sortedVersions.filter((v) => v.folder === f)] as const)
      .filter(([, list]) => list.length > 0)
  }, [activeFolder, folders, sortedVersions])
  const ungroupedVersions = useMemo(
    () => (folderGroups.length > 0 ? sortedVersions.filter((v) => !v.folder) : sortedVersions),
    [folderGroups, sortedVersions]
  )

  const docDownload = (d: CareerDoc, text: string, fmt: 'pdf' | 'docx' | 'txt', key: string) => (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="min-h-10 gap-1 px-2 text-xs sm:min-h-8"
      title={`Download ${d.title} as ${fmt.toUpperCase()}`}
      disabled={downloading === key}
      onClick={async () => {
        setDownloading(key)
        setDlError(null)
        try {
          const letterhead = draft ?? emptyResume()
          const name = professionalFileName([letterhead.contact.fullName, d.title], fmt)
          if (fmt === 'txt') {
            downloadText(d.kind === 'interview' ? `${d.title}\n\n${text}` : text, name)
          } else if (fmt === 'pdf') {
            const m = await import('@/lib/pdf')
            if (d.kind === 'interview') await m.downloadTextPdf(d.title, text, name)
            else await m.downloadLetterPdf(letterhead, text, name, d.signature)
          } else {
            const m = await import('@/lib/docx')
            if (d.kind === 'interview') await m.downloadTextDocx(d.title, text, name)
            else await m.downloadLetterDocx(letterhead, text, name, d.signature)
          }
        } catch (e) {
          setDlError(
            `${fmt.toUpperCase()} download failed: ${e instanceof Error ? e.message : String(e)}`
          )
        } finally {
          setDownloading(null)
        }
      }}
    >
      {downloading === key ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <FileDown className="size-3.5" />
      )}
      {fmt.toUpperCase()}
    </Button>
  )

  const runDownload = async (r: Resume, fmt: 'pdf' | 'docx', key: string) => {
    setDownloading(key)
    setDlError(null)
    try {
      const name = professionalFileName([r.contact.fullName, r.targetRole, 'resume'], fmt)
      const out = visibleResume(r)
      if (fmt === 'pdf') await (await import('@/lib/pdf')).downloadResumePdf(out, name)
      else await (await import('@/lib/docx')).downloadResumeDocx(out, name)
      if (!localStorage.getItem('honestcv.shared')) localStorage.setItem('honestcv.shared', '1')
    } catch (e) {
      setDlError(
        `${fmt.toUpperCase()} download failed: ${e instanceof Error ? e.message : String(e)}`
      )
    } finally {
      setDownloading(null)
    }
  }

  const download = (r: Resume, fmt: 'pdf' | 'docx', key: string) => {
    if (!unlocked) {
      if (!freeMode) {
        setUpgradeOpen(true)
        return
      }
      if (!hasSubscribed() && !localStorage.getItem('honestcv.shared')) {
        pendingDl.current = { resume: r, fmt }
        setFreeDlOpen(true)
        return
      }
    }
    void runDownload(r, fmt, key)
  }

  const dlButton = (r: Resume, fmt: 'pdf' | 'docx', key: string, label: string) => (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="min-h-10 gap-1 px-2 text-xs sm:min-h-8"
      title={`Download ${label} as ${fmt.toUpperCase()}`}
      disabled={downloading === key}
      onClick={() => download(r, fmt, key)}
    >
      {downloading === key ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <FileDown className="size-3.5" />
      )}
      {fmt.toUpperCase()}
      <span className="sr-only"> — download {label}</span>
    </Button>
  )

  const [examplesAttempt, setExamplesAttempt] = useState(0)
  useEffect(() => {
    let cancelled = false
    void fetch('/examples/examples.json')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((list: ExampleEntry[]) => {
        if (cancelled) return
        setExamples(list)
        setExamplesState('ready')
      })
      .catch(() => {
        if (!cancelled) setExamplesState('failed')
      })
    return () => {
      cancelled = true
    }
  }, [examplesAttempt])

  const sectors = useMemo(
    () => ['All', ...Array.from(new Set(examples.map((e) => e.sector)))],
    [examples]
  )
  // A seeded ?sector= that isn't a real industry falls back to All.
  const activeSector = examples.length > 0 && !sectors.includes(exampleSector) ? 'All' : exampleSector
  useEffect(() => {
    if (section !== 'samples') return
    const params = new URLSearchParams()
    if (exampleQuery) params.set('q', exampleQuery)
    if (activeSector !== 'All') params.set('sector', activeSector)
    if (savedOnly) params.set('saved', '1')
    const qs = params.toString()
    window.history.replaceState(null, '', window.location.pathname + (qs ? `?${qs}` : ''))
  }, [section, exampleQuery, activeSector, savedOnly])
  // A seeded ?kind= with no matching saved docs falls back to All (its chip is hidden).
  const activeDocKind = docKind !== 'all' && !docs.some((d) => d.kind === docKind) ? 'all' : docKind
  useEffect(() => {
    if (section !== 'documents') return
    const params = new URLSearchParams()
    if (activeDocKind !== 'all') params.set('kind', activeDocKind)
    const qs = params.toString()
    window.history.replaceState(null, '', window.location.pathname + (qs ? `?${qs}` : ''))
  }, [section, activeDocKind])
  const filteredExamples = useMemo(() => {
    const q = exampleQuery.trim().toLowerCase()
    return examples.filter(
      (e) =>
        (!savedOnly || savedSamples.includes(e.slug)) &&
        (activeSector === 'All' || e.sector === activeSector) &&
        (!q || e.role.toLowerCase().includes(q) || e.sector.toLowerCase().includes(q))
    )
  }, [examples, exampleQuery, activeSector, savedOnly, savedSamples])

  const closeNewDialog = () => {
    setNewOpen(false)
    setNewRole('')
    setNewCompany('')
    setNewLevel('')
    setNewLanguage('en')
    setNewJd('')
    setNewKeepCopy(true)
  }

  const startNewResume = () => {
    if (draft && newKeepCopy && !activeCopy) {
      if (
        !applyVersions(
          saveResumeVersion(draft.targetRole || draft.contact.fullName || 'Untitled resume', draft)
        )
      )
        return
    }
    setActiveVersionId(null)
    saveResume({
      ...emptyResume(),
      targetRole: newRole.trim(),
      targetCompany: newCompany.trim() || undefined,
      experienceLevel: newLevel,
      language: newLanguage === 'en' ? undefined : newLanguage,
      jobDescription: newJd.trim(),
    })
    void navigate('/builder')
  }

  const openCopy = (v: ResumeVersion) => {
    setActiveVersionId(v.id)
    saveResume({ ...emptyResume(), ...v.data })
    void navigate('/builder')
  }

  const openImported = (r: Resume) => {
    setActiveVersionId(null)
    saveResume(r)
    void navigate('/builder')
  }

  const versionActions = (v: ResumeVersion) => (
    <>
      <Button
        type="button"
        size="sm"
        className="min-h-10 flex-1 sm:min-h-8 sm:flex-none"
        onClick={() => (draft && !activeCopy ? setConfirmOpen(v) : openCopy(v))}
      >
        Open
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="min-h-10 sm:min-h-8"
        title="Duplicate this copy"
        onClick={() => applyVersions(duplicateResumeVersion(v.id))}
      >
        <Copy className="size-3.5" />
        <span className="sr-only">Duplicate {v.name}</span>
      </Button>
      {dlButton({ ...emptyResume(), ...v.data }, 'pdf', `${v.id}-pdf`, v.name)}
      {dlButton({ ...emptyResume(), ...v.data }, 'docx', `${v.id}-docx`, v.name)}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="min-h-10 sm:min-h-8"
        title="Move to folder"
        onClick={() => {
          setMoveNewName('')
          setMoving(v)
        }}
      >
        <FolderInput className="size-3.5" />
        <span className="sr-only">Move {v.name} to a folder</span>
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="min-h-10 sm:min-h-8"
        title="Edit name & target job"
        onClick={() =>
          setEditing({
            id: v.id,
            name: v.name,
            folder: v.folder || '',
            targetRole: v.data.targetRole || '',
            targetCompany: v.data.targetCompany || '',
            experienceLevel: v.data.experienceLevel || '',
            jobDescription: v.data.jobDescription || '',
          })
        }
      >
        <Pencil className="size-3.5" />
        <span className="sr-only">Edit name and target job for {v.name}</span>
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="text-destructive min-h-10 sm:min-h-8"
        title="Delete this copy"
        onClick={() => setConfirmDelete(v)}
      >
        <Trash2 className="size-3.5" />
        <span className="sr-only">Delete {v.name}</span>
      </Button>
    </>
  )

  const bulkCheckbox = (v: ResumeVersion) => (
    <input
      type="checkbox"
      checked={bulkIds.has(v.id)}
      onChange={() => toggleBulk(v.id)}
      aria-label={`Select ${v.name}`}
      className="accent-primary mt-0.5 size-4 shrink-0"
    />
  )

  const versionCard = (v: ResumeVersion) => (
    <div key={v.id} className="bg-card flex flex-col rounded-md border shadow-sm">
      <Thumb resume={{ ...emptyResume(), ...v.data }} />
      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="flex items-start gap-2">
          {bulkMode && bulkCheckbox(v)}
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{v.name}</p>
            <p className="text-muted-foreground text-xs">
              {editedAgo(v.updatedAt)} · ATS{' '}
              {scoreResume(visibleResume(v.data), v.data.jobDescription).score}/100
              {v.folder ? ` · ${v.folder}` : ''}
              {v.id === activeCopy?.id ? ' · Open in the editor' : ''}
            </p>
          </div>
        </div>
        <div className="mt-auto flex flex-wrap gap-1.5">{versionActions(v)}</div>
      </div>
    </div>
  )

  const versionRow = (v: ResumeVersion) => (
    <li
      key={v.id}
      className="bg-card flex flex-col gap-2 rounded-md border p-3 lg:flex-row lg:items-center lg:justify-between"
    >
      <div className="flex items-start gap-2">
        {bulkMode && bulkCheckbox(v)}
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{v.name}</p>
          <p className="text-muted-foreground text-xs">
            {editedAgo(v.updatedAt)} · ATS{' '}
            {scoreResume(visibleResume(v.data), v.data.jobDescription).score}/100
            {v.folder ? ` · ${v.folder}` : ''}
            {v.id === activeCopy?.id ? ' · Open in the editor' : ''}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">{versionActions(v)}</div>
    </li>
  )

  const handleImportDocFile = (file: File | undefined) => {
    if (!file || docImportBusy) return
    setDocImportBusy(true)
    setDocImportError('')
    extractTextFromFile(file)
      .then((text) => {
        if (text.trim().length < 30) {
          setDocImportError('No text found in this file — it may be a scanned image.')
          return
        }
        const title =
          file.name
            .replace(/\.[^.]+$/, '')
            .replace(/[-_]+/g, ' ')
            .replace(/\s+/g, ' ')
            .trim() || 'Imported cover letter'
        const doc = saveCareerDoc('cover', title, text)
        if (!doc) {
          setDocImportError('Not saved — your browser storage is full. Free up space and try again.')
          return
        }
        setDocs(listCareerDocs())
        setOpenDoc(doc)
        setDocText(doc.text)
        setDocCopied('idle')
        setDocView('edit')
      })
      .catch((err: unknown) => {
        setDocImportError(err instanceof Error ? err.message : 'Could not read this file.')
      })
      .finally(() => setDocImportBusy(false))
  }

  const handleImportFile = (file: File | undefined) => {
    if (!file || importBusy) return
    setImportBusy(true)
    setImportError('')
    extractTextFromFile(file)
      .then((text) => {
        if (text.trim().length < 30) {
          setImportError('No text found in this file — it may be a scanned image.')
          setImportBusy(false)
          return
        }
        const parsed = parseResumeText(text)
        if (draft) {
          setImportedLinkedIn(looksLikeLinkedInExport(text))
          setConfirmImport(parsed)
          setImportBusy(false)
        } else {
          openImported(parsed)
        }
      })
      .catch((err: unknown) => {
        setImportError(err instanceof Error ? err.message : 'Could not read this file.')
        setImportBusy(false)
      })
  }

  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader
        action={
          <Button asChild size="sm">
            <Link to="/builder">Open editor</Link>
          </Button>
        }
      />
      {dlError && (
        <div className="mx-auto w-full max-w-6xl px-4 pt-3">
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
      <main id="main" tabIndex={-1} className="mx-auto flex w-full max-w-6xl flex-1 items-start gap-8 px-4 py-8">
        <WorkspaceNav onCreate={() => setNewOpen(true)} />
        <div className="min-w-0 flex-1">
        {!section && (
        <>
        <div className="mb-6 grid gap-3 md:hidden">
          <Link
            to="/builder?assistant=1"
            className="bg-card hover:bg-accent flex items-center gap-3 rounded-md border p-4"
          >
            <MessagesSquare className="text-primary size-5 shrink-0" />
            <span className="min-w-0">
              <span className="block text-sm font-semibold">AI assistant</span>
              <span className="text-muted-foreground block truncate text-xs">
                Chat about your resume, get targeted suggestions
              </span>
            </span>
          </Link>
          <Link
            to="/jobs"
            className="bg-card hover:bg-accent flex items-center gap-3 rounded-md border p-4"
          >
            <BriefcaseBusiness className="text-primary size-5 shrink-0" />
            <span className="min-w-0">
              <span className="block text-sm font-semibold">Job search</span>
              <span className="text-muted-foreground block truncate text-xs">
                Remote jobs + your application pipeline
              </span>
            </span>
          </Link>
        </div>
        <h1 className="text-2xl font-bold">My resumes</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          One copy per job you're applying to. Everything is stored in this browser only.
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-10 gap-1 text-xs sm:h-7"
            title="Save everything — copies, documents, job pipeline, libraries — to one .json file"
            onClick={() => {
              downloadText(exportWorkspace(), 'rezup-workspace-backup.json', 'application/json')
            }}
          >
            <Download className="size-3" /> Back up everything
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-10 gap-1 text-xs sm:h-7"
            title="Restore a workspace backup file into this browser"
            onClick={() => workspaceFileRef.current?.click()}
          >
            <FileUp className="size-3" /> Restore
          </Button>
          <input
            ref={workspaceFileRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            aria-label="Restore a workspace backup file"
            onChange={(e) => {
              const file = e.target.files?.[0]
              e.target.value = ''
              if (!file) return
              void file.text().then((raw) => {
                const data = parseWorkspaceBackup(raw)
                if (!data) {
                  setWorkspaceError('That file is not a RezUp workspace backup.')
                  return
                }
                setWorkspaceError('')
                setPendingRestore(data)
              })
            }}
          />
          {workspaceError && (
            <p role="alert" className="text-destructive text-xs">
              {workspaceError}
            </p>
          )}
        </div>

        {versions.length > 0 && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
            <div className="relative">
              <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2" />
              <input
                type="search"
                value={copyQuery}
                onChange={(e) => setCopyQuery(e.target.value)}
                placeholder="Search copies"
                aria-label="Search saved copies by name or folder"
                className="bg-card min-h-10 w-44 rounded-md border py-1 pr-2 pl-7 text-sm sm:min-h-8"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <label htmlFor="version-sort" className="text-muted-foreground text-xs">
                Sort saved copies
              </label>
              <select
                id="version-sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'edited' | 'created' | 'name')}
                className="bg-card min-h-10 rounded-md border px-2 text-sm sm:min-h-8"
              >
                <option value="edited">Last edited</option>
                <option value="created">Date created</option>
                <option value="name">Name A–Z</option>
              </select>
            </div>
            {versions.length > 1 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                aria-pressed={bulkMode}
                className={`min-h-10 sm:min-h-8 ${bulkMode ? 'border-primary ring-primary/40 ring-2' : ''}`}
                onClick={() => {
                  setBulkMode((v) => !v)
                  setBulkIds(new Set())
                }}
              >
                {bulkMode ? 'Done selecting' : 'Select…'}
              </Button>
            )}
            <div className="flex gap-1" role="group" aria-label="Saved copies view">
              <Button
                type="button"
                variant={view === 'grid' ? 'default' : 'outline'}
                size="sm"
                className="min-h-10 sm:min-h-8"
                aria-pressed={view === 'grid'}
                title="Grid view"
                onClick={() => changeView('grid')}
              >
                <LayoutGrid className="size-3.5" />
                <span className="sr-only">Grid view</span>
              </Button>
              <Button
                type="button"
                variant={view === 'list' ? 'default' : 'outline'}
                size="sm"
                className="min-h-10 sm:min-h-8"
                aria-pressed={view === 'list'}
                title="List view"
                onClick={() => changeView('list')}
              >
                <List className="size-3.5" />
                <span className="sr-only">List view</span>
              </Button>
            </div>
          </div>
        )}

        {bulkMode && (
          <div
            role="group"
            aria-label="Bulk actions on saved copies"
            className="bg-card mt-3 flex flex-wrap items-center gap-2 rounded-md border p-2"
          >
            <span className="text-muted-foreground text-xs" role="status">
              {bulkSelected.length} selected
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="min-h-10 sm:min-h-8"
              onClick={() => setBulkIds(new Set(sortedVersions.map((v) => v.id)))}
            >
              Select all shown
            </Button>
            {bulkSelected.length > 0 && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="min-h-10 sm:min-h-8"
                  onClick={() => {
                    setMoveNewName('')
                    setMoving('bulk')
                  }}
                >
                  <FolderInput className="size-3.5" />
                  Move to folder…
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-destructive min-h-10 sm:min-h-8"
                  onClick={() => setConfirmBulkDelete(true)}
                >
                  <Trash2 className="size-3.5" />
                  Delete {bulkSelected.length}…
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="min-h-10 sm:min-h-8"
                  onClick={() => setBulkIds(new Set())}
                >
                  Clear
                </Button>
              </>
            )}
          </div>
        )}

        {folders.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="Filter copies by folder">
            {(
              [
                ['all', 'All', versions.length],
                ...folders.map(
                  (f) => [f, f, versions.filter((v) => v.folder === f).length] as const
                ),
                ['none', 'No folder', versions.filter((v) => !v.folder).length],
              ] as const
            )
              .filter(([k, , count]) => k === 'all' || count > 0)
              .map(([k, label, count]) => (
                <button
                  key={k}
                  type="button"
                  aria-pressed={activeFolder === k}
                  onClick={() => setFolderFilter(k)}
                  className={`min-h-10 rounded-md border px-2 py-1 text-xs font-medium transition sm:min-h-8 ${
                    activeFolder === k
                      ? 'border-primary ring-primary/40 ring-2'
                      : 'hover:border-muted-foreground/40'
                  }`}
                >
                  {label} ({count})
                </button>
              ))}
          </div>
        )}

        <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 ${versions.length > 0 ? 'mt-3' : 'mt-6'}`}>
          {draft && !activeCopy ? (
            <div className="bg-card flex flex-col rounded-md border shadow-sm">
              <Thumb resume={draft} />
              <div className="flex flex-1 flex-col gap-2 p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {draft.targetRole || draft.contact.fullName || 'Current draft'}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Current draft · ATS {scoreResume(visibleResume(draft), draft.jobDescription).score}/100
                  </p>
                </div>
                <div className="mt-auto flex flex-wrap gap-1.5">
                  <Button asChild size="sm" className="min-h-10 flex-1 sm:min-h-8">
                    <Link to="/builder">Continue editing</Link>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="min-h-10 gap-1 sm:min-h-8"
                    onClick={() =>
                      applyVersions(
                        saveResumeVersion(
                          draft.targetRole || draft.contact.fullName || 'Untitled copy',
                          draft
                        )
                      )
                    }
                  >
                    <Copy className="size-3.5" /> Save as copy
                  </Button>
                  {dlButton(draft, 'pdf', 'draft-pdf', 'current draft')}
                  {dlButton(draft, 'docx', 'draft-docx', 'current draft')}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-card flex min-h-64 flex-col items-center justify-center gap-3 rounded-md border border-dashed p-6 text-center">
              <FilePlus2 className="text-muted-foreground size-8" />
              <p className="text-muted-foreground text-sm">
                No resume yet — create your first one in the editor.
              </p>
              <Button asChild size="sm">
                <Link to="/builder">Create my resume</Link>
              </Button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setNewOpen(true)}
            className="bg-card hover:border-primary/50 border-border flex min-h-64 flex-col items-center justify-center gap-3 rounded-md border-2 border-dashed p-6 text-center transition-colors"
          >
            <FilePlus2 className="text-muted-foreground size-8" />
            <p className="text-sm font-medium">Start a new resume</p>
            <p className="text-muted-foreground text-xs">
              Optionally target a job from the first keystroke — your current draft can be kept as
              a copy.
            </p>
          </button>

          <div className="flex flex-col">
            <button
              type="button"
              disabled={importBusy}
              onClick={() => importInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault()
                setImportDragOver(true)
              }}
              onDragLeave={() => setImportDragOver(false)}
              onDrop={(e) => {
                e.preventDefault()
                setImportDragOver(false)
                handleImportFile(e.dataTransfer.files?.[0])
              }}
              className={`flex min-h-64 flex-1 flex-col items-center justify-center gap-3 rounded-md border-2 border-dashed p-6 text-center transition-colors ${
                importDragOver
                  ? 'border-primary bg-primary/5'
                  : 'bg-card hover:border-primary/50 border-border'
              }`}
            >
              <FileUp className="text-muted-foreground size-8" />
              <p className="text-sm font-medium">
                {importBusy ? 'Reading your resume…' : 'Import a resume'}
              </p>
              <p className="text-muted-foreground text-xs">
                Click or drop a PDF, DOCX or TXT here — read entirely in your browser.
              </p>
              {importError && <p className="text-destructive text-xs">{importError}</p>}
            </button>
            <button
              type="button"
              onClick={() => setLinkedInOpen(true)}
              className="text-primary mt-2 self-center text-xs underline-offset-4 hover:underline"
            >
              No resume yet? Import your LinkedIn profile →
            </button>
            <input
              ref={importInputRef}
              type="file"
              accept={IMPORT_ACCEPT}
              className="hidden"
              onChange={(e) => {
                handleImportFile(e.target.files?.[0])
                e.target.value = ''
              }}
            />
          </div>

          {view === 'grid' && ungroupedVersions.map((v) => versionCard(v))}
        </div>

        {view === 'list' && ungroupedVersions.length > 0 && (
          <ul className="mt-4 space-y-2">{ungroupedVersions.map((v) => versionRow(v))}</ul>
        )}

        {copyQuery.trim() !== '' && versions.length > 0 && sortedVersions.length === 0 && (
          <p role="status" className="text-muted-foreground mt-4 text-sm">
            No saved copies match “{copyQuery.trim()}”.
          </p>
        )}

        {folderGroups.map(([f, list]) => {
          const isCollapsed = collapsedFolders.includes(f)
          return (
            <section key={f} className="mt-6">
              <div className="flex items-center gap-1">
                <h2 className="contents">
                  <button
                    type="button"
                    aria-expanded={!isCollapsed}
                    onClick={() => toggleFolder(f)}
                    className="hover:bg-accent flex min-h-10 items-center gap-1.5 rounded-md px-2 py-1 text-sm font-semibold sm:min-h-8"
                  >
                    {isCollapsed ? (
                      <ChevronRight className="size-4" aria-hidden />
                    ) : (
                      <ChevronDown className="size-4" aria-hidden />
                    )}
                    {f}
                    <span className="text-muted-foreground font-normal">({list.length})</span>
                  </button>
                </h2>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="min-h-10 sm:min-h-8"
                  title={`Rename folder ${f}`}
                  onClick={() => setRenamingFolder({ from: f, to: f })}
                >
                  <Pencil className="size-3.5" />
                  <span className="sr-only">Rename folder {f}</span>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive min-h-10 sm:min-h-8"
                  title={`Remove folder ${f}`}
                  onClick={() => setConfirmRemoveFolder(f)}
                >
                  <Trash2 className="size-3.5" />
                  <span className="sr-only">Remove folder {f}</span>
                </Button>
              </div>
              {!isCollapsed &&
                (view === 'grid' ? (
                  <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {list.map((v) => versionCard(v))}
                  </div>
                ) : (
                  <ul className="mt-2 space-y-2">{list.map((v) => versionRow(v))}</ul>
                ))}
            </section>
          )
        })}
        </>
        )}

        {section !== 'samples' && (
        <>
        {section === 'documents' ? (
          <h1 className="text-2xl font-bold">Career documents</h1>
        ) : (
          <h2 id="documents" className="mt-10 scroll-mt-20 text-lg font-semibold">Career documents</h2>
        )}
        <p className="text-muted-foreground mt-1 text-sm">
          Documents you saved from the AI tools in the editor.
        </p>
        {docLinkNotFound && (
          <div
            role="alert"
            className="border-destructive/50 bg-destructive/10 mt-3 flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
          >
            <span>The document in that link wasn&apos;t found — it may have been deleted.</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDocLinkNotFound(false)}
            >
              Dismiss
            </Button>
          </div>
        )}
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Button asChild variant="outline" size="sm" className="min-h-10 sm:min-h-8">
            <Link to="/builder?doc=cover">
              <FilePlus2 className="size-3.5" /> New cover letter
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="min-h-10 sm:min-h-8">
            <Link to="/builder?doc=interview">
              <FilePlus2 className="size-3.5" /> New interview prep
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="min-h-10 sm:min-h-8">
            <Link to="/builder?doc=resignation">
              <FilePlus2 className="size-3.5" /> New resignation letter
            </Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-h-10 sm:min-h-8"
            disabled={docImportBusy}
            onClick={() => docImportInputRef.current?.click()}
          >
            <FileUp className="size-3.5" />{' '}
            {docImportBusy ? 'Reading your letter…' : 'Import a cover letter'}
          </Button>
          <input
            ref={docImportInputRef}
            type="file"
            accept={IMPORT_ACCEPT}
            className="hidden"
            aria-label="Import a cover letter file"
            onChange={(e) => {
              handleImportDocFile(e.target.files?.[0])
              e.target.value = ''
            }}
          />
        </div>
        {docImportError && <p className="text-destructive mt-2 text-xs">{docImportError}</p>}
        <div className="mt-4">
          {section === 'documents' ? (
            <h2 className="text-sm font-semibold">Letter examples</h2>
          ) : (
            <h3 className="text-sm font-semibold">Letter examples</h3>
          )}
          <p className="text-muted-foreground mt-0.5 text-xs">
            Start from a proven letter for your role — placeholders show exactly what to fill in.
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="Letter examples">
            {LETTER_EXAMPLES.map((e) => (
              <button
                key={e.slug}
                type="button"
                onClick={() => setPreviewLetter(e)}
                className="bg-card hover:border-muted-foreground/40 min-h-10 cursor-pointer rounded-md border px-2.5 py-1 text-left text-xs transition sm:min-h-8"
              >
                <span className="font-medium">{e.role}</span>{' '}
                <span className="text-muted-foreground">
                  · {e.kind === 'cover' ? 'Cover letter' : 'Resignation'}
                </span>
              </button>
            ))}
          </div>
        </div>
        {docs.length > 0 && (
          <div
            className="mt-4 flex flex-wrap gap-1.5"
            role="group"
            aria-label="Filter documents by type"
          >
            {(
              [
                ['all', 'All'],
                ['cover', 'Cover letters'],
                ['interview', 'Interview prep'],
                ['resignation', 'Resignation letters'],
              ] as const
            )
              .filter(([k]) => k === 'all' || docs.some((d) => d.kind === k))
              .map(([k, label]) => {
                const count = k === 'all' ? docs.length : docs.filter((d) => d.kind === k).length
                return (
                  <button
                    key={k}
                    type="button"
                    aria-pressed={activeDocKind === k}
                    onClick={() => setDocKind(k)}
                    className={`min-h-10 rounded-md border px-2 py-1 text-xs font-medium transition sm:min-h-8 ${
                      activeDocKind === k
                        ? 'border-primary ring-primary/40 ring-2'
                        : 'hover:border-muted-foreground/40'
                    }`}
                  >
                    {label} ({count})
                  </button>
                )
              })}
          </div>
        )}
        {docs.length === 0 ? (
          <p className="text-muted-foreground mt-4 rounded-md border border-dashed p-4 text-sm">
            Nothing saved yet — generate a cover letter, interview brief or resignation letter in
            the{' '}
            <Link to="/builder" className="underline">
              editor
            </Link>{' '}
            and hit “Save to My resumes”.
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {docs
              .filter((d) => activeDocKind === 'all' || d.kind === activeDocKind)
              .map((d) => (
              <li
                key={d.id}
                className="bg-card flex items-center justify-between gap-2 rounded-md border p-3"
              >
                <div className="flex min-w-0 items-center gap-2">
                  {d.kind === 'interview' ? (
                    <MessagesSquare className="text-primary size-4 shrink-0" />
                  ) : (
                    <FileText className="text-primary size-4 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{d.title}</p>
                    <p className="text-muted-foreground text-xs">
                      {d.kind === 'cover'
                        ? 'Cover letter'
                        : d.kind === 'resignation'
                          ? 'Resignation letter'
                          : 'Interview prep'}{' '}
                      · {editedAgo(d.updatedAt)}
                    </p>
                  </div>
                </div>
                <div className="flex min-w-0 flex-wrap justify-end gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="min-h-10 sm:min-h-8"
                    onClick={() => {
                      setOpenDoc(d)
                      setDocText(d.text)
                      setDocCopied('idle')
                      setDocView('edit')
                    }}
                  >
                    Open
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="min-h-10 sm:min-h-8"
                    title="Rename this document"
                    onClick={() => setRenamingDoc({ doc: d, title: d.title })}
                  >
                    <Pencil className="size-3.5" />
                    <span className="sr-only">Rename {d.title}</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="min-h-10 sm:min-h-8"
                    title="Duplicate this document"
                    onClick={() => applyDocs(duplicateCareerDoc(d.id))}
                  >
                    <Copy className="size-3.5" />
                    <span className="sr-only">Duplicate {d.title}</span>
                  </Button>
                  {docDownload(d, d.text, 'pdf', `${d.id}-pdf`)}
                  {docDownload(d, d.text, 'docx', `${d.id}-docx`)}
                  {docDownload(d, d.text, 'txt', `${d.id}-txt`)}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-destructive min-h-10 sm:min-h-8"
                    title="Delete this document"
                    onClick={() => setConfirmDeleteDoc(d)}
                  >
                    <Trash2 className="size-3.5" />
                    <span className="sr-only">Delete {d.title}</span>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
        </>
        )}
        {section === 'samples' && examplesState === 'failed' && (
          <>
            <h1 className="text-2xl font-bold">Sample library</h1>
            <div
              role="alert"
              className="border-destructive/50 bg-destructive/10 mt-4 rounded-md border p-4 text-sm"
            >
              <p>Loading the sample library failed — check your connection and try again.</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => {
                  setExamplesState('loading')
                  setExamplesAttempt((n) => n + 1)
                }}
              >
                Try again
              </Button>
            </div>
          </>
        )}
        {section !== 'documents' && examples.length > 0 && (
          <>
            {section === 'samples' ? (
              <h1 className="text-2xl font-bold">Sample library</h1>
            ) : (
              <h2 id="samples" className="mt-10 scroll-mt-20 text-lg font-semibold">Sample library</h2>
            )}
            <p className="text-muted-foreground mt-1 text-sm">
              Start from a proven example for your role, then make it yours in the editor.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Input
                type="search"
                value={exampleQuery}
                onChange={(e) => setExampleQuery(e.target.value)}
                placeholder="Search samples by role or industry"
                aria-label="Search samples by role or industry"
                className="h-10 max-w-xs"
              />
              <div
                className="flex flex-wrap gap-1.5"
                role="group"
                aria-label="Filter samples by industry"
              >
                <button
                  type="button"
                  aria-pressed={savedOnly}
                  onClick={() => setSavedOnly((v) => !v)}
                  className={`inline-flex min-h-10 items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition sm:min-h-8 ${
                    savedOnly
                      ? 'border-primary ring-primary/40 ring-2'
                      : 'hover:border-muted-foreground/40'
                  }`}
                >
                  <Star className="size-3" aria-hidden />
                  Saved ({savedSamples.length})
                </button>
                {sectors.map((s) => (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={activeSector === s}
                    onClick={() => setExampleSector(s)}
                    className={`min-h-10 rounded-md border px-2 py-1 text-xs font-medium transition sm:min-h-8 ${
                      activeSector === s
                        ? 'border-primary ring-primary/40 ring-2'
                        : 'hover:border-muted-foreground/40'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            {filteredExamples.length === 0 ? (
              <p className="text-muted-foreground mt-4 rounded-md border border-dashed p-4 text-sm">
                {savedOnly && savedSamples.length === 0
                  ? 'No saved samples yet — tap the star on a sample to keep it here.'
                  : savedOnly
                    ? 'No saved samples match these filters — clear the search or industry filter.'
                    : `No samples match “${exampleQuery}” — try another role or clear the search.`}
              </p>
            ) : (
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredExamples.slice(0, 9).map((e) => (
                  <div
                    key={e.slug}
                    className="bg-card relative flex flex-col rounded-md border shadow-sm"
                  >
                    <button
                      type="button"
                      onClick={() => setPreviewExample(e)}
                      className="focus-visible:ring-ring cursor-pointer rounded-t-md text-left focus-visible:ring-2 focus-visible:outline-none"
                    >
                      <span className="sr-only">Preview {e.role} sample</span>
                      <Thumb resume={exampleToResume(e.person)} />
                    </button>
                    <button
                      type="button"
                      aria-pressed={savedSamples.includes(e.slug)}
                      aria-label={
                        savedSamples.includes(e.slug)
                          ? `Remove ${e.role} sample from saved`
                          : `Save ${e.role} sample`
                      }
                      title={savedSamples.includes(e.slug) ? 'Remove from saved' : 'Save sample'}
                      onClick={() => toggleSavedSample(e.slug)}
                      className="bg-background/90 hover:border-muted-foreground/40 absolute top-2 right-2 flex size-10 cursor-pointer items-center justify-center rounded-md border shadow-sm sm:size-8"
                    >
                      <Star
                        className={`size-4 ${
                          savedSamples.includes(e.slug)
                            ? 'fill-amber-400 text-amber-500'
                            : 'text-muted-foreground'
                        }`}
                        aria-hidden
                      />
                    </button>
                    <div className="flex flex-1 flex-col gap-2 p-3">
                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() => setPreviewExample(e)}
                          className="block w-full cursor-pointer truncate text-left text-sm font-medium hover:underline"
                        >
                          {e.role}
                        </button>
                        <p className="text-muted-foreground text-xs">{e.sector}</p>
                      </div>
                      <div className="mt-auto">
                        <Button asChild size="sm" className="min-h-10 w-full sm:min-h-8">
                          <Link to={`/builder?example=${e.slug}`}>Use this example</Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <p className="text-muted-foreground mt-3 text-sm">
              Showing {Math.min(filteredExamples.length, 9)} of {filteredExamples.length}
              {' · '}
              <a href="/examples/" className="underline">
                Browse all examples
              </a>
            </p>
          </>
        )}
        <PlanCard className="mt-8 md:hidden" />
        </div>
      </main>
      <SiteFooter />

      <Dialog open={previewExample !== null} onOpenChange={(o) => !o && setPreviewExample(null)}>
        <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-3xl">
          {previewExample && (
            <>
              <DialogHeader>
                <DialogTitle>{previewExample.role}</DialogTitle>
                <DialogDescription>
                  {previewExample.sector} sample — read it in full, then load it into the editor.
                </DialogDescription>
              </DialogHeader>
              <div className="min-h-0 flex-1 overflow-y-auto rounded-md border bg-slate-100 p-3 sm:p-5">
                <ResumePreview resume={exampleToResume(previewExample.person)} paginated />
              </div>
              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  aria-pressed={savedSamples.includes(previewExample.slug)}
                  className="min-h-10 sm:min-h-9"
                  onClick={() => toggleSavedSample(previewExample.slug)}
                >
                  <Star
                    className={`size-4 ${
                      savedSamples.includes(previewExample.slug)
                        ? 'fill-amber-400 text-amber-500'
                        : ''
                    }`}
                    aria-hidden
                  />
                  {savedSamples.includes(previewExample.slug) ? 'Saved' : 'Save sample'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-10 sm:min-h-9"
                  onClick={() => setPreviewExample(null)}
                >
                  Close
                </Button>
                <Button asChild className="min-h-10 sm:min-h-9">
                  <Link to={`/builder?example=${previewExample.slug}`}>Use this example</Link>
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={newOpen} onOpenChange={(o) => (o ? setNewOpen(true) : closeNewDialog())}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Start a new resume</DialogTitle>
            <DialogDescription>
              Targeting a job now pre-fills keyword matching in the editor — both fields are
              optional.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="new-resume-role" className="text-sm font-medium">
                  Target role
                </label>
                <Input
                  id="new-resume-role"
                  name="new-resume-role"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  placeholder="e.g. Senior Frontend Engineer"
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="new-resume-company" className="text-sm font-medium">
                  Company
                </label>
                <Input
                  id="new-resume-company"
                  name="new-resume-company"
                  value={newCompany}
                  onChange={(e) => setNewCompany(e.target.value)}
                  placeholder="e.g. Acme Corp"
                  className="h-10"
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="new-resume-level" className="text-sm font-medium">
                  Experience level
                </label>
                <select
                  id="new-resume-level"
                  name="new-resume-level"
                  className="h-10 w-full rounded-md border bg-transparent px-2 text-sm"
                  value={newLevel}
                  onChange={(e) =>
                    setNewLevel(e.target.value as NonNullable<Resume['experienceLevel']>)
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
              <div className="space-y-1.5">
                <label htmlFor="new-resume-language" className="text-sm font-medium">
                  Language
                </label>
                <select
                  id="new-resume-language"
                  name="new-resume-language"
                  title="Resume language — localizes default section headings and AI writer output"
                  className="h-10 w-full rounded-md border bg-transparent px-2 text-sm"
                  value={newLanguage}
                  onChange={(e) => setNewLanguage(e.target.value as ResumeLanguage)}
                >
                  {(Object.keys(RESUME_LANGUAGES) as ResumeLanguage[]).map((code) => (
                    <option key={code} value={code}>
                      {RESUME_LANGUAGES[code]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="new-resume-jd" className="text-sm font-medium">
                Job description
              </label>
              <Textarea
                id="new-resume-jd"
                name="new-resume-jd"
                rows={5}
                value={newJd}
                onChange={(e) => setNewJd(e.target.value)}
                placeholder="Paste the job posting to score your resume against it as you write"
                className="text-xs"
              />
            </div>
            {draft && !activeCopy && (
              <label className="flex min-h-10 cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={newKeepCopy}
                  onChange={(e) => setNewKeepCopy(e.target.checked)}
                  className="size-4"
                />
                Keep a copy of my current draft in My resumes
              </label>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              className="min-h-10"
              onClick={closeNewDialog}
            >
              Cancel
            </Button>
            <Button type="button" className="min-h-10" onClick={startNewResume}>
              Create resume
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Resume settings</DialogTitle>
            <DialogDescription>
              Rename this copy or point it at a different job — its ATS score updates against the
              new posting.
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label htmlFor="edit-version-name" className="text-sm font-medium">
                  Name
                </label>
                <Input
                  id="edit-version-name"
                  name="edit-version-name"
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  className="h-10"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="edit-version-role" className="text-sm font-medium">
                    Target role
                  </label>
                  <Input
                    id="edit-version-role"
                    name="edit-version-role"
                    value={editing.targetRole}
                    onChange={(e) => setEditing({ ...editing, targetRole: e.target.value })}
                    placeholder="e.g. Senior Frontend Engineer"
                    className="h-10"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="edit-version-company" className="text-sm font-medium">
                    Company
                  </label>
                  <Input
                    id="edit-version-company"
                    name="edit-version-company"
                    value={editing.targetCompany}
                    onChange={(e) => setEditing({ ...editing, targetCompany: e.target.value })}
                    placeholder="e.g. Acme Corp"
                    className="h-10"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="edit-version-level" className="text-sm font-medium">
                  Experience level
                </label>
                <select
                  id="edit-version-level"
                  name="edit-version-level"
                  className="h-10 w-full rounded-md border bg-transparent px-2 text-sm"
                  value={editing.experienceLevel}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      experienceLevel: e.target.value as NonNullable<Resume['experienceLevel']>,
                    })
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
              <div className="space-y-1.5">
                <label htmlFor="edit-version-folder" className="text-sm font-medium">
                  Folder
                </label>
                <Input
                  id="edit-version-folder"
                  name="edit-version-folder"
                  list="version-folders"
                  value={editing.folder}
                  onChange={(e) => setEditing({ ...editing, folder: e.target.value })}
                  placeholder="e.g. Backend roles — leave empty for no folder"
                  className="h-10"
                />
                <datalist id="version-folders">
                  {folders.map((f) => (
                    <option key={f} value={f} />
                  ))}
                </datalist>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="edit-version-jd" className="text-sm font-medium">
                  Job description
                </label>
                <Textarea
                  id="edit-version-jd"
                  name="edit-version-jd"
                  rows={5}
                  value={editing.jobDescription}
                  onChange={(e) => setEditing({ ...editing, jobDescription: e.target.value })}
                  placeholder="Paste the job posting to score this copy against it"
                  className="text-xs"
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              className="min-h-10"
              onClick={() => setEditing(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="min-h-10"
              onClick={() => {
                if (!editing) return
                const current = versions.find((v) => v.id === editing.id)
                if (
                  current &&
                  !applyVersions(
                    updateResumeVersion(editing.id, {
                      name: editing.name.trim() || current.name,
                      folder: editing.folder.trim() || undefined,
                      data: {
                        ...current.data,
                        targetRole: editing.targetRole.trim(),
                        targetCompany: editing.targetCompany.trim() || undefined,
                        experienceLevel: editing.experienceLevel,
                        jobDescription: editing.jobDescription,
                      },
                    })
                  )
                )
                  return
                setEditing(null)
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmOpen !== null} onOpenChange={(o) => !o && setConfirmOpen(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Open "{confirmOpen?.name}"?</DialogTitle>
            <DialogDescription>
              This replaces what's currently in the editor. Save the current draft as
              a copy first if you want to keep it.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            {draft && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (
                    !applyVersions(
                      saveResumeVersion(
                        draft.targetRole || draft.contact.fullName || 'Untitled copy',
                        draft
                      )
                    )
                  )
                    return
                  if (confirmOpen) openCopy(confirmOpen)
                }}
              >
                Save draft as copy, then open
              </Button>
            )}
            <Button type="button" onClick={() => confirmOpen && openCopy(confirmOpen)}>
              Open and replace draft
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmImport !== null} onOpenChange={(o) => !o && setConfirmImport(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Open the imported resume?</DialogTitle>
            <DialogDescription>
              {importedLinkedIn
                ? 'This file was recognized as a LinkedIn profile export and mapped section-by-section — review the result before sending it anywhere. '
                : ''}
              {activeCopy
                ? `This replaces what's currently in the editor. Your current work is already saved to "${activeCopy.name}" — that copy keeps its content.`
                : "This replaces what's currently in the editor. Save the current draft as a copy first if you want to keep it."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            {draft && !activeCopy && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (
                    !applyVersions(
                      saveResumeVersion(
                        draft.targetRole || draft.contact.fullName || 'Untitled copy',
                        draft
                      )
                    )
                  )
                    return
                  if (confirmImport) openImported(confirmImport)
                }}
              >
                Save draft as copy, then open
              </Button>
            )}
            <Button type="button" onClick={() => confirmImport && openImported(confirmImport)}>
              Open and replace draft
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={linkedInOpen} onOpenChange={setLinkedInOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Import your LinkedIn profile</DialogTitle>
            <DialogDescription>
              LinkedIn's own profile export becomes a pre-filled resume — read entirely in your
              browser, nothing is uploaded anywhere.
            </DialogDescription>
          </DialogHeader>
          <ol className="list-decimal space-y-2 pl-5 text-sm">
            <li>
              On LinkedIn, open your profile and choose <strong>More</strong> (or{' '}
              <strong>Resources</strong>) → <strong>Save to PDF</strong>.
            </li>
            <li>Pick the downloaded PDF below — sections are mapped automatically.</li>
            <li>Review the imported resume before sending it anywhere.</li>
          </ol>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setLinkedInOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                setLinkedInOpen(false)
                importInputRef.current?.click()
              }}
            >
              Choose the LinkedIn PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={previewLetter !== null} onOpenChange={(o) => !o && setPreviewLetter(null)}>
        <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-2xl">
          {previewLetter && (
            <>
              <DialogHeader>
                <DialogTitle>{previewLetter.role}</DialogTitle>
                <DialogDescription>
                  {previewLetter.kind === 'cover'
                    ? 'Cover letter example'
                    : 'Resignation letter example'}{' '}
                  — load it, then replace the [placeholders] with your details.
                </DialogDescription>
              </DialogHeader>
              <div className="min-h-0 flex-1 overflow-y-auto rounded-md border p-3 sm:p-4">
                <LetterPreview
                  doc={{
                    id: 'example',
                    kind: previewLetter.kind,
                    title: previewLetter.role,
                    text: previewLetter.text,
                    updatedAt: 0,
                  }}
                  text={previewLetter.text}
                  letterhead={draft ?? emptyResume()}
                />
              </div>
              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-10 sm:min-h-9"
                  onClick={() => setPreviewLetter(null)}
                >
                  Close
                </Button>
                <Button
                  type="button"
                  className="min-h-10 sm:min-h-9"
                  onClick={() => {
                    const e = previewLetter
                    const title =
                      e.kind === 'cover'
                        ? `${e.role} cover letter`
                        : `Resignation letter — ${e.role}`
                    const doc = saveCareerDoc(e.kind, title, e.text)
                    if (!doc) {
                      setStorageError(true)
                      return
                    }
                    setDocs(listCareerDocs())
                    setPreviewLetter(null)
                    setOpenDoc(doc)
                    setDocText(doc.text)
                    setDocCopied('idle')
                    setDocView('edit')
                  }}
                >
                  Use this example
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={openDoc !== null}
        onOpenChange={(o) => {
          if (!o) {
            if (openDoc && docText !== openDoc.text) {
              setConfirmingDocClose(true)
              return
            }
            setOpenDoc(null)
            setSignatureError('')
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{openDoc?.title}</DialogTitle>
            <DialogDescription>
              {openDoc?.kind === 'cover'
                ? 'Cover letter'
                : openDoc?.kind === 'resignation'
                  ? 'Resignation letter'
                  : 'Interview prep brief'}{' '}
              — edits are saved to this browser.
            </DialogDescription>
          </DialogHeader>
          <div
            role="group"
            aria-label="Switch between editing and preview"
            className="flex gap-1 rounded-md border p-1 self-start"
          >
            {(
              [
                ['edit', 'Edit'],
                ['preview', 'Preview'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={docView === value}
                onClick={() => setDocView(value)}
                className={`min-h-10 cursor-pointer rounded px-3 text-xs font-medium transition sm:min-h-8 ${
                  docView === value ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {openDoc && openDoc.kind !== 'interview' && (
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={signatureInputRef}
                type="file"
                accept="image/png,image/jpeg"
                className="hidden"
                aria-label="Signature image"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  e.target.value = ''
                  if (!file || !openDoc) return
                  setSignatureError('')
                  if (file.size > 1024 * 1024) {
                    setSignatureError('Signature image is too large — use a file under 1 MB.')
                    return
                  }
                  const img = new Image()
                  const url = URL.createObjectURL(file)
                  img.onload = () => {
                    URL.revokeObjectURL(url)
                    const scale = Math.min(1, 480 / img.naturalWidth)
                    const canvas = document.createElement('canvas')
                    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale))
                    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale))
                    canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height)
                    const dataUrl = canvas.toDataURL('image/png')
                    if (applyDocs(updateCareerDoc(openDoc.id, { signature: dataUrl }))) {
                      setOpenDoc({ ...openDoc, signature: dataUrl })
                    }
                  }
                  img.onerror = () => {
                    URL.revokeObjectURL(url)
                    setSignatureError('Could not read that image — use a PNG or JPEG file.')
                  }
                  img.src = url
                }}
              />
              {openDoc.signature ? (
                <>
                  <img
                    src={openDoc.signature}
                    alt="Signature"
                    className="max-h-10 w-auto max-w-32 rounded border bg-white p-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => signatureInputRef.current?.click()}
                  >
                    Replace signature
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (applyDocs(updateCareerDoc(openDoc.id, { signature: '' }))) {
                        const next = { ...openDoc }
                        delete next.signature
                        setOpenDoc(next)
                      }
                    }}
                  >
                    Remove
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => signatureInputRef.current?.click()}
                >
                  Add signature
                </Button>
              )}
              {signatureError !== '' && (
                <p role="alert" className="text-destructive text-xs">
                  {signatureError}
                </p>
              )}
            </div>
          )}
          {docView === 'preview' && openDoc ? (
            <LetterPreview doc={openDoc} text={docText} letterhead={draft ?? emptyResume()} />
          ) : (
            <Textarea
              id="career-doc-text"
              name="career-doc-text"
              rows={14}
              value={docText}
              onChange={(e) => setDocText(e.target.value)}
              className="font-mono text-xs"
              aria-label="Document text"
            />
          )}
          <DialogFooter className="gap-2">
            {openDoc && docDownload(openDoc, docText, 'pdf', 'viewer-pdf')}
            {openDoc && docDownload(openDoc, docText, 'docx', 'viewer-docx')}
            {openDoc && docDownload(openDoc, docText, 'txt', 'viewer-txt')}
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                void navigator.clipboard.writeText(docText).then(
                  () => setDocCopied('copied'),
                  () => setDocCopied('failed')
                )
              }}
            >
              {docCopied === 'copied'
                ? 'Copied'
                : docCopied === 'failed'
                  ? 'Copy failed'
                  : 'Copy text'}
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (openDoc && !applyDocs(updateCareerDoc(openDoc.id, { text: docText }))) return
                setOpenDoc(null)
              }}
            >
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmingDocClose} onOpenChange={(o) => !o && setConfirmingDocClose(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Discard unsaved changes?</DialogTitle>
            <DialogDescription>
              {`Discard unsaved changes to "${openDoc?.title ?? ''}"?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmingDocClose(false)}>
              Keep editing
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setConfirmingDocClose(false)
                setOpenDoc(null)
                setSignatureError('')
              }}
            >
              Discard changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={confirmDeleteDoc !== null}
        onOpenChange={(o) => !o && setConfirmDeleteDoc(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete "{confirmDeleteDoc?.title}"?</DialogTitle>
            <DialogDescription>
              This removes the document from this browser permanently.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setConfirmDeleteDoc(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (confirmDeleteDoc) {
                  const index = docs.findIndex((d) => d.id === confirmDeleteDoc.id)
                  const next = deleteCareerDoc(confirmDeleteDoc.id)
                  if (applyDocs(next) && next) {
                    if (docKind !== 'all' && !next.some((d) => d.kind === docKind)) setDocKind('all')
                    setUndoDelete({ kind: 'doc', doc: confirmDeleteDoc, index: Math.max(index, 0) })
                  }
                }
                setConfirmDeleteDoc(null)
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDelete !== null} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete "{confirmDelete?.name}"?</DialogTitle>
            <DialogDescription>
              This removes the copy from this browser permanently.
              {confirmDelete && hasShareLink(confirmDelete.id)
                ? ' Its public share link will also be turned off.'
                : ''}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setConfirmDelete(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (confirmDelete) {
                  const index = versions.findIndex((v) => v.id === confirmDelete.id)
                  if (!applyVersions(deleteResumeVersion(confirmDelete.id))) {
                    setConfirmDelete(null)
                    return
                  }
                  revokeShareLinksFor([confirmDelete.id])
                  setUndoDelete({
                    kind: 'copy',
                    version: confirmDelete,
                    index: Math.max(index, 0),
                  })
                }
                setConfirmDelete(null)
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmBulkDelete} onOpenChange={(o) => !o && setConfirmBulkDelete(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Delete {bulkSelected.length} {bulkSelected.length === 1 ? 'copy' : 'copies'}?
            </DialogTitle>
            <DialogDescription>
              This removes the selected copies from this browser permanently.
              {(() => {
                const linked = bulkSelected.filter((id) => hasShareLink(id)).length
                if (linked === 0) return ''
                return linked === 1
                  ? ' One of them has a public share link, which will also be turned off.'
                  : ` ${linked} of them have public share links, which will also be turned off.`
              })()}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setConfirmBulkDelete(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                const entries = versions
                  .map((version, index) => ({ version, index }))
                  .filter((e) => bulkIds.has(e.version.id))
                if (entries.length > 0) {
                  if (!applyVersions(deleteResumeVersions(entries.map((e) => e.version.id)))) {
                    setConfirmBulkDelete(false)
                    return
                  }
                  revokeShareLinksFor(entries.map((e) => e.version.id))
                  setUndoDelete({ kind: 'copies', entries })
                }
                setBulkIds(new Set())
                setConfirmBulkDelete(false)
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={moving !== null}
        onOpenChange={(o) => {
          if (!o) {
            setMoving(null)
            setMoveNewName('')
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {moving === 'bulk'
                ? `Move ${bulkSelected.length} ${bulkSelected.length === 1 ? 'copy' : 'copies'} to a folder`
                : `Move "${moving?.name ?? ''}" to a folder`}
            </DialogTitle>
            <DialogDescription>
              Folders group your saved copies on this dashboard — the copy itself is unchanged.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            {folders.map((f) => (
              <Button
                key={f}
                type="button"
                variant={moving !== 'bulk' && moving?.folder === f ? 'default' : 'outline'}
                className="min-h-10 justify-start sm:min-h-8"
                onClick={() => moveVersionTo(f)}
              >
                {f}
              </Button>
            ))}
            {(moving === 'bulk' || moving?.folder) && (
              <Button
                type="button"
                variant="outline"
                className="min-h-10 justify-start sm:min-h-8"
                onClick={() => moveVersionTo(undefined)}
              >
                Remove from folder
              </Button>
            )}
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                if (moveNewName.trim()) moveVersionTo(moveNewName.trim())
              }}
            >
              <Input
                value={moveNewName}
                onChange={(e) => setMoveNewName(e.target.value)}
                placeholder="New folder name…"
                aria-label="New folder name"
              />
              <Button type="submit" variant="outline" disabled={!moveNewName.trim()}>
                Create &amp; move
              </Button>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={renamingDoc !== null} onOpenChange={(o) => !o && setRenamingDoc(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rename "{renamingDoc?.doc.title}"</DialogTitle>
            <DialogDescription>
              The new name appears in this list and on downloads of this document.
            </DialogDescription>
          </DialogHeader>
          <form
            className="grid gap-3"
            onSubmit={(e) => {
              e.preventDefault()
              if (renamingDoc && renamingDoc.title.trim()) {
                if (applyDocs(renameCareerDoc(renamingDoc.doc.id, renamingDoc.title.trim()))) {
                  setRenamingDoc(null)
                }
              }
            }}
          >
            <Input
              value={renamingDoc?.title ?? ''}
              onChange={(e) => setRenamingDoc((r) => (r ? { ...r, title: e.target.value } : r))}
              aria-label="Document name"
            />
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setRenamingDoc(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!renamingDoc?.title.trim()}>
                Rename
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={renamingFolder !== null} onOpenChange={(o) => !o && setRenamingFolder(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rename folder "{renamingFolder?.from}"</DialogTitle>
            <DialogDescription>All copies in this folder move with it.</DialogDescription>
          </DialogHeader>
          <form
            className="grid gap-3"
            onSubmit={(e) => {
              e.preventDefault()
              if (renamingFolder && renamingFolder.to.trim()) {
                renameFolder(renamingFolder.from, renamingFolder.to.trim())
                setRenamingFolder(null)
              }
            }}
          >
            <Input
              value={renamingFolder?.to ?? ''}
              onChange={(e) =>
                setRenamingFolder((r) => (r ? { ...r, to: e.target.value } : r))
              }
              aria-label="Folder name"
            />
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setRenamingFolder(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!renamingFolder?.to.trim()}>
                Rename
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={confirmRemoveFolder !== null}
        onOpenChange={(o) => !o && setConfirmRemoveFolder(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remove folder "{confirmRemoveFolder}"?</DialogTitle>
            <DialogDescription>
              The copies inside are kept — they just won't be in a folder anymore.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setConfirmRemoveFolder(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (confirmRemoveFolder) removeFolder(confirmRemoveFolder)
                setConfirmRemoveFolder(null)
              }}
            >
              Remove folder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={pendingRestore !== null} onOpenChange={(o) => !o && setPendingRestore(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Restore this workspace backup?</DialogTitle>
            <DialogDescription>
              Everything currently in this browser — resumes, copies, documents, job pipeline and
              libraries — is replaced with the backup. This can't be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setPendingRestore(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (!pendingRestore) return
                if (restoreWorkspace(pendingRestore)) {
                  window.location.reload()
                  return
                }
                setPendingRestore(null)
                setStorageError(true)
              }}
            >
              Replace and restore
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <FreeDownloadDialog
        open={freeDlOpen}
        onOpenChange={setFreeDlOpen}
        onUnlocked={() => {
          const p = pendingDl.current
          pendingDl.current = null
          if (p) void runDownload(p.resume, p.fmt, 'pending')
        }}
      />
      <UpgradeDialog
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        reason="Downloading your resume as PDF or DOCX is the one thing we charge for — once, not monthly."
      />

      {storageError && (
        <div
          role="alert"
          className="bg-background fixed inset-x-4 bottom-4 z-50 mx-auto flex w-fit max-w-full items-center gap-3 rounded-lg border p-3 text-sm shadow-lg"
        >
          <span className="min-w-0">
            Not saved — your browser storage is full. Free up space and try again.
          </span>
          <button
            type="button"
            aria-label="Dismiss"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => setStorageError(false)}
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {undoDelete && (
        <div
          role="status"
          className="bg-background fixed inset-x-4 bottom-4 z-50 mx-auto flex w-fit max-w-full items-center gap-3 rounded-lg border p-3 text-sm shadow-lg"
        >
          <span className="min-w-0 truncate">
            {undoDelete.kind === 'copies'
              ? `Deleted ${undoDelete.entries.length} ${undoDelete.entries.length === 1 ? 'copy' : 'copies'}`
              : `Deleted "${undoDelete.kind === 'copy' ? undoDelete.version.name : undoDelete.doc.title}"`}
          </span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              if (undoDelete.kind === 'copy') {
                if (!applyVersions(restoreResumeVersion(undoDelete.version, undoDelete.index)))
                  return
              } else if (undoDelete.kind === 'copies') {
                let next: ResumeVersion[] | null = versions
                for (const e of undoDelete.entries) {
                  next = restoreResumeVersion(e.version, e.index)
                  if (next === null) break
                }
                if (!applyVersions(next)) return
              } else if (!applyDocs(restoreCareerDoc(undoDelete.doc, undoDelete.index))) {
                return
              }
              setUndoDelete(null)
            }}
          >
            <Undo2 className="size-4" />
            Undo
          </Button>
          <button
            type="button"
            aria-label="Dismiss"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => setUndoDelete(null)}
          >
            <X className="size-4" />
          </button>
        </div>
      )}
    </div>
  )
}
