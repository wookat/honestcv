import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Download, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ResumePreview } from '@/components/ResumePreview'
import { professionalFileName } from '@/lib/download'
import { fetchSharedResume } from '@/lib/share'
import type { Resume } from '@/lib/resume'

export default function SharedResume() {
  const { id } = useParams()
  const [state, setState] = useState<
    | { status: 'loading' }
    | { status: 'gone' }
    | { status: 'error'; message: string }
    | { status: 'ready'; resume: Resume; createdAt: number }
  >(id ? { status: 'loading' } : { status: 'gone' })
  const [attempt, setAttempt] = useState(0)
  const [dl, setDl] = useState<'idle' | 'busy' | 'failed'>('idle')

  const downloadPdf = async () => {
    if (state.status !== 'ready' || dl === 'busy') return
    setDl('busy')
    try {
      const { contact, targetRole } = state.resume
      await (await import('@/lib/pdf')).downloadResumePdf(
        state.resume,
        professionalFileName([contact.fullName, targetRole, 'resume'], 'pdf')
      )
      setDl('idle')
    } catch {
      setDl('failed')
    }
  }

  useEffect(() => {
    if (!id) return
    let cancelled = false
    fetchSharedResume(id).then(
      (data) => {
        if (cancelled) return
        setState(data ? { status: 'ready', ...data } : { status: 'gone' })
      },
      (err: unknown) => {
        if (cancelled) return
        const message =
          err instanceof Error && err.message
            ? err.message
            : 'Loading the resume failed — try again.'
        setState({ status: 'error', message })
      }
    )
    return () => {
      cancelled = true
    }
  }, [id, attempt])

  return (
    <div className="bg-muted/40 min-h-screen">
      <header className="bg-background border-b">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3">
          <p className="text-muted-foreground text-sm">
            Shared resume — read-only snapshot
          </p>
          <div className="flex items-center gap-2">
            {state.status === 'ready' && (
              <Button size="sm" onClick={() => void downloadPdf()} disabled={dl === 'busy'}>
                <Download /> {dl === 'busy' ? 'Preparing…' : 'Download PDF'}
              </Button>
            )}
            {state.status === 'ready' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.print()}
                title="Print this resume or save it as PDF from the print dialog"
              >
                <Printer /> Print
              </Button>
            )}
            <Button asChild size="sm">
              <Link to="/builder">Build your own free resume</Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-2 py-6 sm:px-4">
        {dl === 'failed' && (
          <div
            role="alert"
            className="border-destructive/50 bg-destructive/10 text-destructive mx-auto mb-4 flex max-w-3xl flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
          >
            <span>Preparing the PDF failed — check your connection, then reload and try again.</span>
            <Button size="sm" variant="outline" onClick={() => window.location.reload()}>
              Reload page
            </Button>
          </div>
        )}
        {state.status === 'loading' && (
          <div aria-busy="true" className="bg-background mx-auto aspect-[17/22] max-w-3xl animate-pulse rounded-md border" />
        )}
        {state.status === 'error' && (
          <div className="bg-background mx-auto max-w-lg rounded-lg border p-8 text-center" role="alert">
            <h1 className="text-lg font-semibold">Couldn't load this resume</h1>
            <p className="text-muted-foreground mt-2 text-sm">{state.message}</p>
            <Button className="mt-4" size="sm" variant="outline" onClick={() => {
                setState({ status: 'loading' })
                setAttempt((n) => n + 1)
              }}>
              Try again
            </Button>
          </div>
        )}
        {state.status === 'gone' && (
          <div className="bg-background mx-auto max-w-lg rounded-lg border p-8 text-center">
            <h1 className="text-lg font-semibold">This link is no longer available</h1>
            <p className="text-muted-foreground mt-2 text-sm">
              The owner turned off sharing, or the link expired. Ask them to share
              a fresh link.
            </p>
          </div>
        )}
        {state.status === 'ready' && (
          <div className="mx-auto max-w-3xl">
            <div className="bg-background overflow-x-auto rounded-md border shadow-sm">
              <ResumePreview resume={state.resume} paginated />
            </div>
            {state.createdAt > 0 && (
              <p className="text-muted-foreground mt-2 text-center text-xs">
                Snapshot shared {new Date(state.createdAt).toLocaleDateString()}
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
