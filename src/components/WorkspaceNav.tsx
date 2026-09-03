/**
 * Persistent workspace sidebar shared by the app routes (/dashboard, /jobs).
 * Hidden below md; the mobile hamburger menu covers the same destinations.
 */

import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  BadgeCheck,
  BriefcaseBusiness,
  FilePlus2,
  FileText,
  Files,
  LibraryBig,
  MessagesSquare,
  Sparkles,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { fetchAiQuota } from '@/lib/api'
import { listCareerDocs } from '@/lib/documents'
import { attentionCount, listPipeline } from '@/lib/jobs'
import { loadLicense } from '@/lib/license'
import { listResumeVersions, loadResume } from '@/lib/resume'

const PLAN_LABELS = { resume: 'Resume plan', bundle: 'Bundle plan' } as const

interface NavItem {
  label: string
  to: string
  icon: React.ComponentType<{ className?: string }>
  count?: number
  /** Items that have gone quiet and need a follow-up, shown as an amber badge */
  attention?: number
  active: boolean
}

export function PlanCard({ className }: { className?: string } = {}) {
  const license = loadLicense()
  const [freeLeft, setFreeLeft] = useState<number | null>(null)
  useEffect(() => {
    if (license) return
    let cancelled = false
    void fetchAiQuota().then((n) => {
      if (!cancelled) setFreeLeft(n)
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <div className={`bg-card rounded-md border p-3 text-sm ${className ?? ''}`} aria-label="Your plan">
      <p className="font-medium">{license ? PLAN_LABELS[license.plan] : 'Free plan'}</p>
      {license ? (
        <p className="text-muted-foreground mt-1 flex items-center gap-1.5 text-xs">
          <Sparkles className="size-3.5 shrink-0" /> Unlimited AI
        </p>
      ) : (
        <>
          {freeLeft !== null && (
            <p className="text-muted-foreground mt-1 flex items-center gap-1.5 text-xs">
              <Sparkles className="size-3.5 shrink-0" />
              <span>
                Free AI credits left:{' '}
                <span className="text-foreground font-medium tabular-nums">{freeLeft}</span>
              </span>
            </p>
          )}
          <a
            href="/pricing/"
            className="text-primary mt-2 inline-flex min-h-10 items-center text-xs font-medium underline-offset-4 hover:underline md:min-h-6"
          >
            Upgrade
          </a>
        </>
      )}
    </div>
  )
}

export function WorkspaceNav({ onCreate }: { onCreate?: () => void } = {}) {
  const { pathname } = useLocation()
  const counts = useMemo(
    () => ({
      resumes: listResumeVersions().length + (loadResume() ? 1 : 0),
      docs: listCareerDocs().length,
      pipeline: listPipeline().length,
      attention: attentionCount(),
    }),
    []
  )
  const items: NavItem[] = [
    { label: 'My resumes', to: '/dashboard', icon: Files, count: counts.resumes, active: pathname === '/dashboard' },
    { label: 'Career documents', to: '/documents', icon: FileText, count: counts.docs, active: pathname === '/documents' },
    { label: 'Sample library', to: '/samples', icon: LibraryBig, active: pathname === '/samples' },
    {
      label: 'Job search',
      to: '/jobs',
      icon: BriefcaseBusiness,
      count: counts.pipeline,
      attention: counts.attention,
      active: pathname === '/jobs',
    },
    { label: 'ATS checker', to: '/ats-checker', icon: BadgeCheck, active: pathname === '/ats-checker' },
    { label: 'AI assistant', to: '/builder?assistant=1', icon: MessagesSquare, active: false },
  ]
  return (
    <aside className="hidden w-56 shrink-0 md:block" aria-label="Workspace">
      <div className="sticky top-20 space-y-4">
        {onCreate ? (
          <Button type="button" className="w-full gap-2" onClick={onCreate}>
            <FilePlus2 className="size-4" /> Create new resume
          </Button>
        ) : (
          <Button asChild className="w-full gap-2">
            <Link to="/builder">
              <FilePlus2 className="size-4" /> Create new resume
            </Link>
          </Button>
        )}
        <nav className="space-y-0.5" aria-label="Workspace sections">
          {items.map(({ label, to, icon: Icon, count, attention, active }) => (
            <Link
              key={label}
              to={to}
              aria-current={active ? 'page' : undefined}
              className={`flex min-h-9 items-center gap-2 rounded-md px-2.5 text-sm ${
                active
                  ? 'bg-accent text-foreground font-medium'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
            >
              <Icon className="size-4 shrink-0" />
              <span className="flex-1 truncate">{label}</span>
              {typeof attention === 'number' && attention > 0 && (
                <span
                  className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[11px] font-medium text-amber-800 tabular-nums"
                  title={`${attention} tracked application${attention === 1 ? '' : 's'} with no status update in 7+ days`}
                  aria-label={`${attention} tracked application${attention === 1 ? '' : 's'} with no status update in 7+ days`}
                >
                  {attention}
                </span>
              )}
              {typeof count === 'number' && count > 0 && (
                <span className="text-muted-foreground text-xs tabular-nums">{count}</span>
              )}
            </Link>
          ))}
        </nav>
        <PlanCard />
      </div>
    </aside>
  )
}
