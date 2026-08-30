/**
 * Job search: a two-pane remote-jobs board (list + detail) with a local
 * application pipeline. "Target my resume" copies the job's title and
 * description into the current draft so the existing JD tailoring and ATS
 * scoring flow picks it up in the editor.
 */

import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, BriefcaseBusiness, ExternalLink, Search } from 'lucide-react'

import { SiteFooter, SiteHeader, usePageMeta } from '@/components/Layout'
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
import {
  JOB_CATEGORIES,
  JOB_STATUSES,
  JOB_STATUS_LABELS,
  type JobListing,
  type JobStatus,
  type PipelineEntry,
  listPipeline,
  removeFromPipeline,
  searchJobs,
  upsertPipeline,
} from '@/lib/jobs'
import { emptyResume, loadResume, saveResume } from '@/lib/resume'

type Tab = 'all' | JobStatus

const postedAgo = (iso: string) => {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (!iso || Number.isNaN(days) || days < 0) return ''
  if (days === 0) return 'today'
  return days === 1 ? '1 day ago' : `${days} days ago`
}

export default function Jobs() {
  usePageMeta(
    'Job search — RezUp',
    'Browse remote jobs, track your applications, and target your resume to a posting in one click.'
  )
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('all')
  const [query, setQuery] = useState(() => loadResume()?.targetRole ?? '')
  const [category, setCategory] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const [sort, setSort] = useState<'relevance' | 'newest'>('relevance')
  const [jobs, setJobs] = useState<JobListing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pipeline, setPipeline] = useState<PipelineEntry[]>(() => listPipeline())
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [mobileDetail, setMobileDetail] = useState(false)
  const [confirmTarget, setConfirmTarget] = useState<JobListing | null>(null)

  const fetchJobs = (q: string, cat = '') =>
    searchJobs(q, cat)
      .then((list) => {
        setJobs(list)
        setSelectedId((cur) => cur ?? list[0]?.id ?? null)
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))

  const runSearch = (q: string, cat = category) => {
    setLoading(true)
    setError('')
    void fetchJobs(q, cat)
  }

  useEffect(() => {
    void fetchJobs(loadResume()?.targetRole ?? '')
  }, [])

  const statusOf = useMemo(() => {
    const map = new Map<string, JobStatus>()
    for (const e of pipeline) map.set(e.job.id, e.status)
    return map
  }, [pipeline])

  const loc = locationFilter.trim().toLowerCase()
  const base: JobListing[] =
    tab === 'all' ? jobs : pipeline.filter((e) => e.status === tab).map((e) => e.job)
  const filtered =
    tab === 'all' && loc ? base.filter((j) => j.location.toLowerCase().includes(loc)) : base
  const shown =
    tab === 'all' && sort === 'newest'
      ? [...filtered].sort(
          (a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()
        )
      : filtered
  const selected =
    shown.find((j) => j.id === selectedId) ??
    jobs.find((j) => j.id === selectedId) ??
    pipeline.find((e) => e.job.id === selectedId)?.job ??
    null

  const counts = useMemo(() => {
    const c = { saved: 0, applied: 0, interviewing: 0, rejected: 0 }
    for (const e of pipeline) c[e.status]++
    return c
  }, [pipeline])

  const setStatus = (job: JobListing, status: JobStatus | 'none') => {
    setPipeline(status === 'none' ? removeFromPipeline(job.id) : upsertPipeline(job, status))
  }

  const targetResume = (job: JobListing) => {
    const draft = loadResume() ?? emptyResume()
    saveResume({ ...draft, targetRole: job.title, jobDescription: job.description })
    void navigate('/builder')
  }

  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader
        action={
          <Button asChild size="sm" variant="outline">
            <a href="/dashboard">My resumes</a>
          </Button>
        }
      />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <h1 className="text-2xl font-bold">Job search</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Remote jobs via{' '}
          <a href="https://remotive.com" target="_blank" rel="noopener noreferrer" className="underline">
            Remotive
          </a>
          . Your application pipeline is stored in this browser only.
        </p>

        <div
          className="mt-4 flex flex-wrap gap-1.5"
          role="group"
          aria-label="Filter jobs by application status"
        >
          {(
            [
              ['all', `All jobs`],
              ...JOB_STATUSES.map((s) => [s, `${JOB_STATUS_LABELS[s]} (${counts[s]})`]),
            ] as [Tab, string][]
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={tab === value}
              onClick={() => {
                setTab(value)
                setMobileDetail(false)
              }}
              className={`min-h-10 rounded-md border px-3 py-1 text-xs font-medium transition sm:min-h-8 ${
                tab === value
                  ? 'border-primary ring-primary/40 ring-2'
                  : 'hover:border-muted-foreground/40'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'all' && (
          <form
            className="mt-4 flex flex-wrap items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              setSelectedId(null)
              runSearch(query.trim())
            }}
          >
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by job title, e.g. frontend developer"
              aria-label="Search jobs by title"
              className="h-10 w-full max-w-md sm:w-auto sm:flex-1"
            />
            <Button type="submit" className="min-h-10 gap-1.5">
              <Search className="size-4" /> Search
            </Button>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value)
                setSelectedId(null)
                runSearch(query.trim(), e.target.value)
              }}
              aria-label="Filter by category"
              className="border-input bg-background h-10 rounded-md border px-2 text-sm"
            >
              <option value="">All categories</option>
              {JOB_CATEGORIES.map(([slug, label]) => (
                <option key={slug} value={slug}>
                  {label}
                </option>
              ))}
            </select>
            <Input
              type="search"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              placeholder="Location, e.g. Europe"
              aria-label="Filter by location"
              className="h-10 w-36"
            />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as 'relevance' | 'newest')}
              aria-label="Sort jobs"
              className="border-input bg-background h-10 rounded-md border px-2 text-sm"
            >
              <option value="relevance">Relevance</option>
              <option value="newest">Newest</option>
            </select>
          </form>
        )}

        <div className="mt-6 grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <div
            className={`bg-card max-h-[70vh] overflow-y-auto rounded-md border ${
              mobileDetail ? 'hidden md:block' : ''
            }`}
          >
            {loading ? (
              <p className="text-muted-foreground p-4 text-sm">Loading jobs…</p>
            ) : error ? (
              <p className="text-destructive p-4 text-sm">{error}</p>
            ) : shown.length === 0 ? (
              <p className="text-muted-foreground p-4 text-sm">
                {tab === 'all'
                  ? 'No jobs found — try another search term.'
                  : `Nothing ${JOB_STATUS_LABELS[tab].toLowerCase()} yet — use the status buttons on a job to track it.`}
              </p>
            ) : (
              <ul>
                {shown.map((j) => (
                  <li key={j.id} className="border-b last:border-b-0">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedId(j.id)
                        setMobileDetail(true)
                      }}
                      aria-pressed={selected?.id === j.id}
                      className={`hover:bg-accent block w-full px-4 py-3 text-left ${
                        selected?.id === j.id ? 'bg-accent border-primary border-l-2' : ''
                      }`}
                    >
                      <span className="flex items-start gap-2">
                        {j.logo && (
                          <img
                            src={j.logo}
                            alt=""
                            loading="lazy"
                            className="mt-0.5 size-8 shrink-0 rounded border object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                        )}
                        <span className="min-w-0">
                          <p className="truncate text-sm font-medium">{j.title}</p>
                          <p className="text-muted-foreground truncate text-xs">
                            {j.company} · {j.location}
                          </p>
                        </span>
                      </span>
                      <p className="text-muted-foreground mt-0.5 text-xs">
                        {postedAgo(j.postedAt)}
                        {statusOf.has(j.id) && (
                          <span className="text-primary ml-2 font-medium">
                            {JOB_STATUS_LABELS[statusOf.get(j.id) as JobStatus]}
                          </span>
                        )}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div
            className={`bg-card max-h-[70vh] overflow-y-auto rounded-md border p-4 ${
              mobileDetail ? '' : 'hidden md:block'
            }`}
          >
            {selected ? (
              <>
                <button
                  type="button"
                  onClick={() => setMobileDetail(false)}
                  className="text-muted-foreground hover:text-foreground mb-2 inline-flex min-h-10 items-center gap-1 text-sm md:hidden"
                >
                  <ArrowLeft className="size-4" /> Back to list
                </button>
                <div className="flex items-center gap-3">
                  {selected.logo && (
                    <img
                      src={selected.logo}
                      alt=""
                      className="size-10 shrink-0 rounded border object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  )}
                  <h2 className="text-lg font-semibold">{selected.title}</h2>
                </div>
                <p className="text-muted-foreground mt-1 text-sm">
                  {selected.company} · {selected.location}
                  {selected.type && ` · ${selected.type}`}
                  {selected.salary && ` · ${selected.salary}`}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Button
                    type="button"
                    size="sm"
                    className="min-h-10 gap-1.5 sm:min-h-8"
                    onClick={() => setConfirmTarget(selected)}
                  >
                    <BriefcaseBusiness className="size-4" /> Target my resume
                  </Button>
                  <Button asChild size="sm" variant="outline" className="min-h-10 gap-1.5 sm:min-h-8">
                    <a href={selected.url} target="_blank" rel="noopener noreferrer">
                      Apply on site <ExternalLink className="size-3.5" />
                    </a>
                  </Button>
                </div>
                <div
                  className="mt-3 flex flex-wrap gap-1.5"
                  role="group"
                  aria-label="Track this job"
                >
                  {JOB_STATUSES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      aria-pressed={statusOf.get(selected.id) === s}
                      onClick={() =>
                        setStatus(selected, statusOf.get(selected.id) === s ? 'none' : s)
                      }
                      className={`min-h-10 rounded-md border px-2 py-1 text-xs font-medium transition sm:min-h-8 ${
                        statusOf.get(selected.id) === s
                          ? 'border-primary ring-primary/40 ring-2'
                          : 'hover:border-muted-foreground/40'
                      }`}
                    >
                      {JOB_STATUS_LABELS[s]}
                    </button>
                  ))}
                </div>
                <p className="text-muted-foreground mt-4 whitespace-pre-wrap text-sm">
                  {selected.description}
                </p>
              </>
            ) : (
              <p className="text-muted-foreground text-sm">Select a job to see the details.</p>
            )}
          </div>
        </div>
      </main>
      <SiteFooter />

      <Dialog open={confirmTarget !== null} onOpenChange={(o) => !o && setConfirmTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Target "{confirmTarget?.title}"?</DialogTitle>
            <DialogDescription>
              This sets the job title and description on your current draft so the ATS score and
              AI tailoring in the editor aim at this posting. It replaces the draft's current
              target job, if any.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setConfirmTarget(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => confirmTarget && targetResume(confirmTarget)}
            >
              Target and open editor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
