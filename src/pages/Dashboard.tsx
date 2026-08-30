/**
 * Resume dashboard: card grid of the current draft plus every saved copy,
 * with open / duplicate / rename / delete. All data lives in localStorage.
 */

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Copy, FilePlus2, Pencil, Trash2 } from 'lucide-react'

import { SiteFooter, SiteHeader, usePageMeta } from '@/components/Layout'
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
import { scoreResume } from '@/lib/ats'
import {
  type Resume,
  type ResumeVersion,
  deleteResumeVersion,
  duplicateResumeVersion,
  emptyResume,
  listResumeVersions,
  loadResume,
  renameResumeVersion,
  saveResume,
  saveResumeVersion,
} from '@/lib/resume'

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
  const [versions, setVersions] = useState<ResumeVersion[]>(() => listResumeVersions())
  const [draft] = useState<Resume | null>(() => loadResume())
  const [confirmOpen, setConfirmOpen] = useState<ResumeVersion | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<ResumeVersion | null>(null)
  const [renaming, setRenaming] = useState<{ id: string; name: string } | null>(null)

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
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
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
