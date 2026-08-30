/**
 * Resume dashboard: card grid of the current draft plus every saved copy,
 * with open / duplicate / rename / delete. All data lives in localStorage.
 */

import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Copy, FilePlus2, FileText, MessagesSquare, Pencil, Trash2 } from 'lucide-react'

import { SiteFooter, SiteHeader, usePageMeta } from '@/components/Layout'
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
import {
  type CareerDoc,
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
  renameResumeVersion,
  saveResume,
  saveResumeVersion,
} from '@/lib/resume'

interface ExampleEntry {
  slug: string
  role: string
  sector: string
  person: ExamplePerson
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
  const [renaming, setRenaming] = useState<{ id: string; name: string } | null>(null)
  const [docs, setDocs] = useState<CareerDoc[]>(() => listCareerDocs())
  const [openDoc, setOpenDoc] = useState<CareerDoc | null>(null)
  const [docText, setDocText] = useState('')
  const [confirmDeleteDoc, setConfirmDeleteDoc] = useState<CareerDoc | null>(null)
  const [examples, setExamples] = useState<ExampleEntry[]>([])
  const [exampleQuery, setExampleQuery] = useState('')
  const [exampleSector, setExampleSector] = useState('All')

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

  const openCopy = (v: ResumeVersion) => {
    saveResume({ ...emptyResume(), ...v.data })
    void navigate('/builder')
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
        <WorkspaceNav />
        <div className="min-w-0 flex-1">
        <h1 className="text-2xl font-bold">My resumes</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          One copy per job you're applying to. Everything is stored in this browser
          only — use Backup in the editor to keep a file copy.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

          {versions.map((v) => (
            <div key={v.id} className="bg-card flex flex-col rounded-md border shadow-sm">
              <Thumb resume={{ ...emptyResume(), ...v.data }} />
              <div className="flex flex-1 flex-col gap-2 p-3">
                {renaming?.id === v.id ? (
                  <form
                    className="flex gap-1.5"
                    onSubmit={(e) => {
                      e.preventDefault()
                      setVersions(renameResumeVersion(v.id, renaming.name.trim() || v.name))
                      setRenaming(null)
                    }}
                  >
                    <Input
                      autoFocus
                      value={renaming.name}
                      onChange={(e) => setRenaming({ id: v.id, name: e.target.value })}
                      aria-label="New name"
                      className="h-10 sm:h-8"
                    />
                    <Button type="submit" size="sm" className="min-h-10 sm:min-h-8">
                      Save
                    </Button>
                  </form>
                ) : (
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{v.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {new Date(v.updatedAt).toLocaleDateString()} · ATS{' '}
                      {scoreResume(v.data, v.data.jobDescription).score}/100
                    </p>
                  </div>
                )}
                <div className="mt-auto flex flex-wrap gap-1.5">
                  <Button
                    type="button"
                    size="sm"
                    className="min-h-10 flex-1 sm:min-h-8"
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
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="min-h-10 sm:min-h-8"
                    title="Rename this copy"
                    onClick={() => setRenaming({ id: v.id, name: v.name })}
                  >
                    <Pencil className="size-3.5" />
                    <span className="sr-only">Rename {v.name}</span>
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
                </div>
              </div>
            </div>
          ))}
        </div>

        <h2 id="documents" className="mt-10 scroll-mt-20 text-lg font-semibold">Career documents</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Documents you saved from the AI tools in the editor.
        </p>
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
            {docs.map((d) => (
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
                if (confirmDeleteDoc) setDocs(deleteCareerDoc(confirmDeleteDoc.id))
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
    </div>
  )
}
