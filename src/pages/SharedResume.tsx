import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ResumePreview } from '@/components/ResumePreview'
import { fetchSharedResume } from '@/lib/share'
import type { Resume } from '@/lib/resume'

export default function SharedResume() {
  const { id } = useParams()
  const [state, setState] = useState<
    | { status: 'loading' }
    | { status: 'gone' }
    | { status: 'ready'; resume: Resume; createdAt: number }
  >(id ? { status: 'loading' } : { status: 'gone' })

  useEffect(() => {
    if (!id) return
    let cancelled = false
    void fetchSharedResume(id).then((data) => {
      if (cancelled) return
      setState(data ? { status: 'ready', ...data } : { status: 'gone' })
    })
    return () => {
      cancelled = true
    }
  }, [id])

  return (
    <div className="bg-muted/40 min-h-screen">
      <header className="bg-background border-b">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3">
          <p className="text-muted-foreground text-sm">
            Shared resume — read-only snapshot
          </p>
          <Button asChild size="sm">
            <Link to="/builder">Build your own free resume</Link>
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-2 py-6 sm:px-4">
        {state.status === 'loading' && (
          <div aria-busy="true" className="bg-background mx-auto aspect-[17/22] max-w-3xl animate-pulse rounded-md border" />
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
