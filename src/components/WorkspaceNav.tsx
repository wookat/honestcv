/**
 * Persistent workspace sidebar shared by the app routes (/dashboard, /jobs).
 * Hidden below md; the mobile hamburger menu covers the same destinations.
 */

import { useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { BadgeCheck, BriefcaseBusiness, FilePlus2, FileText, Files, LibraryBig } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { listCareerDocs } from '@/lib/documents'
import { listPipeline } from '@/lib/jobs'
import { listResumeVersions, loadResume } from '@/lib/resume'

interface NavItem {
  label: string
  to: string
  icon: React.ComponentType<{ className?: string }>
  count?: number
  active: boolean
}

export function WorkspaceNav() {
  const { pathname } = useLocation()
  const counts = useMemo(
    () => ({
      resumes: listResumeVersions().length + (loadResume() ? 1 : 0),
      docs: listCareerDocs().length,
      pipeline: listPipeline().length,
    }),
    []
  )
  const items: NavItem[] = [
    { label: 'My resumes', to: '/dashboard', icon: Files, count: counts.resumes, active: pathname === '/dashboard' },
    { label: 'Career documents', to: '/dashboard#documents', icon: FileText, count: counts.docs, active: false },
    { label: 'Sample library', to: '/dashboard#samples', icon: LibraryBig, active: false },
    { label: 'Job search', to: '/jobs', icon: BriefcaseBusiness, count: counts.pipeline, active: pathname === '/jobs' },
    { label: 'ATS checker', to: '/ats-checker', icon: BadgeCheck, active: pathname === '/ats-checker' },
  ]
  return (
    <aside className="hidden w-56 shrink-0 md:block" aria-label="Workspace">
      <div className="sticky top-20 space-y-4">
        <Button asChild className="w-full gap-2">
          <Link to="/builder">
            <FilePlus2 className="size-4" /> Create new resume
          </Link>
        </Button>
        <nav className="space-y-0.5" aria-label="Workspace sections">
          {items.map(({ label, to, icon: Icon, count, active }) => (
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
              {typeof count === 'number' && count > 0 && (
                <span className="text-muted-foreground text-xs tabular-nums">{count}</span>
              )}
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  )
}
