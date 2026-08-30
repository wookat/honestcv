/**
 * Resume dashboard: card grid of the current draft plus every saved copy,
 * with open / download / duplicate / rename / delete. All data lives in localStorage.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Copy,
  FileDown,
  FilePlus2,
  FileText,
  FileUp,
  LayoutGrid,
  List,
  Loader2,
  MessagesSquare,
  Pencil,
  Trash2,
} from 'lucide-react'

import { SiteFooter, SiteHeader, usePageMeta } from '@/components/Layout'
import {
  FreeDownloadDialog,
  UpgradeDialog,
  hasSubscribed,
  useFreeMode,
  useLicense,
} from '@/components/Paywall'
import { WorkspaceNav } from '@/components/WorkspaceNav'
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
import { IMPORT_ACCEPT, extractTextFromFile } from '@/lib/extractFile'
import { parseResumeText } from '@/lib/importText'
import {
  type CareerDoc,
  type CareerDocKind,
  deleteCareerDoc,
  listCareerDocs,
  updateCareerDoc,
} from '@/lib/documents'
import {
  type ExamplePerson,
  type Resume,
  type ResumeVersion,
  deleteResumeVersion,
  duplicateResumeVersion,
  emptyResume,
  exampleToResume,
  listResumeVersions,
  loadResume,
  saveResume,
  saveResumeVersion,
  updateResumeVersion,
} from '@/lib/resume'

interface ExampleEntry {
  slug: string
  role: string
  sector: string
  person: ExamplePerson
}

const editedAgo = (ms: number) => {
  const days = Math.floor((Date.now() - ms) / 86400000)
  if (days <= 0) return 'Edited today'
  return days === 1 ? 'Edited 1 day ago' : `Edited ${days} days ago`
}

function Thumb({ resume }: { resume: Resume }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none relative h-44 select-none overflow-hidden rounded-t-md border-b bg-slate-100"
    >
      <div className="absolute inset-x-4 top-3 origin-top" style={{ zoom: 0.35 }}>
        <ResumePreview resume={resume} />
      </div>
    </div>
  )
}

export default function Dashboard() {
  usePageMeta(
    'My resumes — RezUp',
    'Manage your resume drafts and job-tailored copies. Everything stays in your browser.'
  )
  const navigate = useNavigate()
  const { hash } = useLocation()
  useEffect(() => {
    if (hash) document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' })
  }, [hash])
  const [versions, setVersions] = useState<ResumeVersion[]>(() => listResumeVersions())
  const [draft] = useState<Resume | null>(() => loadResume())
  const [confirmOpen, setConfirmOpen] = useState<ResumeVersion | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<ResumeVersion | null>(null)
  const [editing, setEditing] = useState<{
    id: string
    name: string
    targetRole: string
    jobDescription: string
  } | null>(null)
  const [docs, setDocs] = useState<CareerDoc[]>(() => listCareerDocs())
  const [docKind, setDocKind] = useState<CareerDocKind | 'all'>('all')
  const [openDoc, setOpenDoc] = useState<CareerDoc | null>(null)
  const [docText, setDocText] = useState('')
  const [confirmDeleteDoc, setConfirmDeleteDoc] = useState<CareerDoc | null>(null)
  const importInputRef = useRef<HTMLInputElement>(null)
  const [importBusy, setImportBusy] = useState(false)
  const [importError, setImportError] = useState('')
  const [importDragOver, setImportDragOver] = useState(false)
  const [confirmImport, setConfirmImport] = useState<Resume | null>(null)
  const [examples, setExamples] = useState<ExampleEntry[]>([])
  const [exampleQuery, setExampleQuery] = useState('')
  const [exampleSector, setExampleSector] = useState('All')
  const [newOpen, setNewOpen] = useState(false)
  const [newKeepCopy, setNewKeepCopy] = useState(true)
  const [newRole, setNewRole] = useState('')
  const [newJd, setNewJd] = useState('')
  const freeMode = useFreeMode()
  const { license } = useLicense()
  const unlocked = Boolean(license)
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [freeDlOpen, setFreeDlOpen] = useState(false)
  const pendingDl = useRef<{ resume: Resume; fmt: 'pdf' | 'docx' } | null>(null)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [view, setView] = useState<'grid' | 'list'>(() =>
    localStorage.getItem('honestcv.dashboardView') === 'list' ? 'list' : 'grid'
  )
  const changeView = (v: 'grid' | 'list') => {
    setView(v)
    localStorage.setItem('honestcv.dashboardView', v)
  }
  const [sortBy, setSortBy] = useState<'edited' | 'name'>('edited')
  const sortedVersions = useMemo(() => {
    const arr = [...versions]
    if (sortBy === 'name') arr.sort((a, b) => a.name.localeCompare(b.name))
    else arr.sort((a, b) => b.updatedAt - a.updatedAt)
    return arr
  }, [versions, sortBy])

  const runDownload = async (r: Resume, fmt: 'pdf' | 'docx', key: string) => {
    setDownloading(key)
    try {
      const name = (r.contact.fullName || 'resume').replace(/\s+/g, '-').toLowerCase()
      if (fmt === 'pdf')
        await (await import('@/lib/pdf')).downloadResumePdf(r, `${name}-resume.pdf`)
      else await (await import('@/lib/docx')).downloadResumeDocx(r, `${name}-resume.docx`)
      if (!localStorage.getItem('honestcv.shared')) localStorage.setItem('honestcv.shared', '1')
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

  useEffect(() => {
    let cancelled = false
    void fetch('/examples/examples.json')
      .then((r) => (r.ok ? r.json() : []))
      .then((list: ExampleEntry[]) => {
        if (!cancelled) setExamples(list)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const sectors = useMemo(
    () => ['All', ...Array.from(new Set(examples.map((e) => e.sector)))],
    [examples]
  )
  const filteredExamples = useMemo(() => {
    const q = exampleQuery.trim().toLowerCase()
    return examples.filter(
      (e) =>
        (exampleSector === 'All' || e.sector === exampleSector) &&
        (!q || e.role.toLowerCase().includes(q) || e.sector.toLowerCase().includes(q))
    )
  }, [examples, exampleQuery, exampleSector])

  const closeNewDialog = () => {
    setNewOpen(false)
    setNewRole('')
    setNewJd('')
    setNewKeepCopy(true)
  }

  const startNewResume = () => {
    if (draft && newKeepCopy) {
      setVersions(
        saveResumeVersion(draft.targetRole || draft.contact.fullName || 'Untitled resume', draft)
      )
    }
    saveResume({ ...emptyResume(), targetRole: newRole.trim(), jobDescription: newJd.trim() })
    void navigate('/builder')
  }

  const openCopy = (v: ResumeVersion) => {
    saveResume({ ...emptyResume(), ...v.data })
    void navigate('/builder')
  }

  const openImported = (r: Resume) => {
    saveResume(r)
    void navigate('/builder')
  }

  const versionActions = (v: ResumeVersion) => (
    <>
      <Button
        type="button"
        size="sm"
        className="min-h-10 flex-1 sm:min-h-8 sm:flex-none"
        onClick={() => (draft ? setConfirmOpen(v) : openCopy(v))}
      >
        Open
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="min-h-10 sm:min-h-8"
        title="Duplicate this copy"
        onClick={() => setVersions(duplicateResumeVersion(v.id))}
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
        title="Edit name & target job"
        onClick={() =>
          setEditing({
            id: v.id,
            name: v.name,
            targetRole: v.data.targetRole || '',
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
      <main className="mx-auto flex w-full max-w-6xl flex-1 items-start gap-8 px-4 py-8">
        <WorkspaceNav onCreate={() => setNewOpen(true)} />
        <div className="min-w-0 flex-1">
        <h1 className="text-2xl font-bold">My resumes</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          One copy per job you're applying to. Everything is stored in this browser
          only — use Backup in the editor to keep a file copy.
        </p>

        {versions.length > 0 && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <label htmlFor="version-sort" className="text-muted-foreground text-xs">
                Sort saved copies
              </label>
              <select
                id="version-sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'edited' | 'name')}
                className="bg-card min-h-10 rounded-md border px-2 text-sm sm:min-h-8"
              >
                <option value="edited">Last edited</option>
                <option value="name">Name A–Z</option>
              </select>
            </div>
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

        <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${versions.length > 0 ? 'mt-3' : 'mt-6'}`}>
          {draft ? (
            <div className="bg-card flex flex-col rounded-md border shadow-sm">
              <Thumb resume={draft} />
              <div className="flex flex-1 flex-col gap-2 p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {draft.targetRole || draft.contact.fullName || 'Current draft'}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Current draft · ATS {scoreResume(draft, draft.jobDescription).score}/100
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
                      setVersions(
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

          {view === 'grid' &&
            sortedVersions.map((v) => (
              <div key={v.id} className="bg-card flex flex-col rounded-md border shadow-sm">
                <Thumb resume={{ ...emptyResume(), ...v.data }} />
                <div className="flex flex-1 flex-col gap-2 p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{v.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {editedAgo(v.updatedAt)} · ATS{' '}
                      {scoreResume(v.data, v.data.jobDescription).score}/100
                    </p>
                  </div>
                  <div className="mt-auto flex flex-wrap gap-1.5">{versionActions(v)}</div>
                </div>
              </div>
            ))}
        </div>

        {view === 'list' && sortedVersions.length > 0 && (
          <ul className="mt-4 space-y-2">
            {sortedVersions.map((v) => (
              <li
                key={v.id}
                className="bg-card flex flex-col gap-2 rounded-md border p-3 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{v.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {editedAgo(v.updatedAt)} · ATS{' '}
                    {scoreResume(v.data, v.data.jobDescription).score}/100
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">{versionActions(v)}</div>
              </li>
            ))}
          </ul>
        )}

        <h2 id="documents" className="mt-10 scroll-mt-20 text-lg font-semibold">Career documents</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Documents you saved from the AI tools in the editor.
        </p>
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
                    aria-pressed={docKind === k}
                    onClick={() => setDocKind(k)}
                    className={`min-h-10 rounded-md border px-2 py-1 text-xs font-medium transition sm:min-h-8 ${
                      docKind === k
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
              .filter((d) => docKind === 'all' || d.kind === docKind)
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
                      ·{' '}
                      {new Date(d.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="min-h-10 sm:min-h-8"
                    onClick={() => {
                      setOpenDoc(d)
                      setDocText(d.text)
                    }}
                  >
                    Open
                  </Button>
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
        {examples.length > 0 && (
          <>
            <h2 id="samples" className="mt-10 scroll-mt-20 text-lg font-semibold">Sample library</h2>
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
                {sectors.map((s) => (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={exampleSector === s}
                    onClick={() => setExampleSector(s)}
                    className={`min-h-10 rounded-md border px-2 py-1 text-xs font-medium transition sm:min-h-8 ${
                      exampleSector === s
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
                No samples match “{exampleQuery}” — try another role or clear the search.
              </p>
            ) : (
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredExamples.slice(0, 9).map((e) => (
                  <div key={e.slug} className="bg-card flex flex-col rounded-md border shadow-sm">
                    <Thumb resume={exampleToResume(e.person)} />
                    <div className="flex flex-1 flex-col gap-2 p-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{e.role}</p>
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
        </div>
      </main>
      <SiteFooter />

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
            {draft && (
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
                if (current) {
                  setVersions(
                    updateResumeVersion(editing.id, {
                      name: editing.name.trim() || current.name,
                      data: {
                        ...current.data,
                        targetRole: editing.targetRole.trim(),
                        jobDescription: editing.jobDescription,
                      },
                    })
                  )
                }
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
                  setVersions(
                    saveResumeVersion(
                      draft.targetRole || draft.contact.fullName || 'Untitled copy',
                      draft
                    )
                  )
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
                  setVersions(
                    saveResumeVersion(
                      draft.targetRole || draft.contact.fullName || 'Untitled copy',
                      draft
                    )
                  )
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

      <Dialog open={openDoc !== null} onOpenChange={(o) => !o && setOpenDoc(null)}>
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
          <Textarea
            id="career-doc-text"
            name="career-doc-text"
            rows={14}
            value={docText}
            onChange={(e) => setDocText(e.target.value)}
            className="font-mono text-xs"
            aria-label="Document text"
          />
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => void navigator.clipboard.writeText(docText)}
            >
              Copy text
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (openDoc) setDocs(updateCareerDoc(openDoc.id, { text: docText }))
                setOpenDoc(null)
              }}
            >
              Save changes
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
                  const next = deleteCareerDoc(confirmDeleteDoc.id)
                  setDocs(next)
                  if (docKind !== 'all' && !next.some((d) => d.kind === docKind)) setDocKind('all')
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
                if (confirmDelete) setVersions(deleteResumeVersion(confirmDelete.id))
                setConfirmDelete(null)
              }}
            >
              Delete
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
    </div>
  )
}
