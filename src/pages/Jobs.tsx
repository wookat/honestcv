/**
 * Job search: a two-pane remote-jobs board (list + detail) with a local
 * application pipeline. "Target my resume" copies the job's title and
 * description into the current draft so the existing JD tailoring and ATS
 * scoring flow picks it up in the editor.
 */

import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  BriefcaseBusiness,
  ExternalLink,
  FileText,
  Lightbulb,
  Search,
  StickyNote,
} from 'lucide-react'

import { SiteFooter, SiteHeader, usePageMeta } from '@/components/Layout'
import { PlanCard, WorkspaceNav } from '@/components/WorkspaceNav'
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
  attentionCount,
  followUpEmail,
  isLocationAgnostic,
  listPipeline,
  locationFacets,
  removeFromPipeline,
  removeManyFromPipeline,
  searchJobs,
  reminderDue,
  setPipelineNotes,
  setPipelineReminder,
  setPipelineVersion,
  staleDays,
  structureJobDescription,
  timelineOf,
  updateStatuses,
  upsertPipeline,
} from '@/lib/jobs'
import { listCareerDocs } from '@/lib/documents'
import { matchReport, matchScore } from '@/lib/ats'
import {
  createResumeVersion,
  emptyResume,
  listResumeVersions,
  loadResume,
  resumeToPlainText,
  saveResume,
  setActiveVersionId,
  syncActiveVersion,
  visibleResume,
} from '@/lib/resume'

/** Qualitative tint for a keyword-match percentage (same thresholds as the score bands). */
const matchTone = (pct: number) =>
  pct >= 80
    ? 'bg-emerald-100 text-emerald-800'
    : pct >= 50
      ? 'bg-amber-100 text-amber-800'
      : 'bg-red-100 text-red-800'

type Tab = 'all' | 'tracked' | JobStatus

const TAB_PARAMS: readonly Tab[] = [
  'all',
  'tracked',
  'saved',
  'applied',
  'interviewing',
  'offer',
  'rejected',
]

const postedAgo = (iso: string) => {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (!iso || Number.isNaN(days) || days < 0) return ''
  if (days === 0) return 'today'
  return days === 1 ? '1 day ago' : `${days} days ago`
}

const shortDate = (ms: number) =>
  new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

/** yyyy-mm-dd → "Mon D" using the day's components (no timezone shifting). */
const shortDay = (day: string) => {
  const [y, m, d] = day.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

const agoFromMs = (ms: number) => {
  const days = Math.floor((Date.now() - ms) / 86_400_000)
  if (!ms || Number.isNaN(days) || days < 0) return ''
  if (days === 0) return 'today'
  return days === 1 ? '1 day ago' : `${days} days ago`
}

export default function Jobs() {
  usePageMeta(
    'Job search — RezUp',
    'Browse remote jobs, track your applications, and target your resume to a posting in one click.'
  )
  const navigate = useNavigate()
  // Search context lives in the query string so refresh/back/share keeps your place.
  // ?attention=1 deep link opens the queue filtered to applications needing a follow-up.
  const [seedParams] = useState(() => new URLSearchParams(window.location.search))
  const seedAttention = seedParams.get('attention') === '1'
  const seedTab = TAB_PARAMS.find((t) => t === seedParams.get('tab'))
  const [tab, setTab] = useState<Tab>(seedAttention ? 'tracked' : (seedTab ?? 'all'))
  const [followUpOnly, setFollowUpOnly] = useState(seedAttention)
  // ?q= deep link (e.g. the assistant's "Find matching jobs") seeds the search;
  // present-but-empty means a deliberately cleared search box
  const [seedQuery] = useState(() => {
    const q = seedParams.get('q')
    return q === null ? null : q.trim()
  })
  const [query, setQuery] = useState(() => seedQuery ?? loadResume()?.targetRole ?? '')
  const [category, setCategory] = useState(() => seedParams.get('cat') ?? '')
  const [locationFilter, setLocationFilter] = useState(() => seedParams.get('loc') ?? '')
  const [typeFilter, setTypeFilter] = useState(() => seedParams.get('type') ?? '')
  const [skillsFilter, setSkillsFilter] = useState(() => seedParams.get('skills') ?? '')
  const [tagsExpandedId, setTagsExpandedId] = useState<string | null>(null)
  const [sort, setSort] = useState<'relevance' | 'newest' | 'match'>(() => {
    const s = seedParams.get('sort')
    return s === 'newest' || s === 'match' ? s : 'relevance'
  })
  const [excluded, setExcluded] = useState<ReadonlySet<JobStatus>>(new Set())
  const [jobs, setJobs] = useState<JobListing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pipeline, setPipeline] = useState<PipelineEntry[]>(() => listPipeline())
  const [selectedId, setSelectedId] = useState<string | null>(() => seedParams.get('job'))
  const [mobileDetail, setMobileDetail] = useState(false)
  const [bulkMode, setBulkMode] = useState(false)
  const [bulkIds, setBulkIds] = useState<ReadonlySet<string>>(new Set())
  const [confirmBulkUntrack, setConfirmBulkUntrack] = useState(false)
  const [confirmTarget, setConfirmTarget] = useState<{
    job: JobListing
    intent: 'target' | 'cover'
  } | null>(null)
  const [notesDraft, setNotesDraft] = useState<{ jobId: string; text: string } | null>(null)
  const [reportOpenId, setReportOpenId] = useState<string | null>(null)
  const [confirmUntrack, setConfirmUntrack] = useState<JobListing | null>(null)
  const [followUpDraft, setFollowUpDraft] = useState<{ subject: string; body: string } | null>(
    null
  )
  const [followUpCopied, setFollowUpCopied] = useState<'idle' | 'copied' | 'failed'>('idle')

  const fetchJobs = (q: string, cat = '') =>
    searchJobs(q, cat)
      .then((list) => {
        setJobs(list)
        setSelectedId((cur) =>
          cur && (list.some((j) => j.id === cur) || listPipeline().some((e) => e.job.id === cur))
            ? cur
            : (list[0]?.id ?? null)
        )
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))

  const runSearch = (q: string, cat = category) => {
    setLoading(true)
    setError('')
    void fetchJobs(q, cat)
  }

  useEffect(() => {
    void fetchJobs(seedQuery ?? loadResume()?.targetRole ?? '', seedParams.get('cat') ?? '')
    // seedQuery/seedParams are set once from the URL and never change
  }, [seedQuery, seedParams])

  useEffect(() => {
    const params = new URLSearchParams()
    if (query !== (loadResume()?.targetRole ?? '')) params.set('q', query)
    if (tab !== 'all') params.set('tab', tab)
    if (followUpOnly && tab === 'tracked') params.set('attention', '1')
    if (category) params.set('cat', category)
    if (locationFilter) params.set('loc', locationFilter)
    if (typeFilter) params.set('type', typeFilter)
    if (skillsFilter) params.set('skills', skillsFilter)
    if (sort !== 'relevance') params.set('sort', sort)
    if (selectedId) params.set('job', selectedId)
    const qs = params.toString()
    window.history.replaceState(null, '', window.location.pathname + (qs ? `?${qs}` : ''))
  }, [query, tab, followUpOnly, category, locationFilter, typeFilter, skillsFilter, sort, selectedId])

  const statusOf = useMemo(() => {
    const map = new Map<string, JobStatus>()
    for (const e of pipeline) map.set(e.job.id, e.status)
    return map
  }, [pipeline])

  const updatedAtOf = useMemo(() => {
    const map = new Map<string, number>()
    for (const e of pipeline) map.set(e.job.id, e.updatedAt)
    return map
  }, [pipeline])

  const hasNotes = useMemo(() => {
    const set = new Set<string>()
    for (const e of pipeline) if (e.notes?.trim()) set.add(e.job.id)
    return set
  }, [pipeline])

  const resumeText = useMemo(() => {
    const draft = loadResume()
    return draft ? resumeToPlainText(draft) : ''
  }, [])

  const matchOf = useMemo(() => {
    const map = new Map<string, number>()
    if (!resumeText.trim()) return map
    for (const j of [...jobs, ...pipeline.map((e) => e.job)]) {
      if (map.has(j.id)) continue
      const m = matchScore(resumeText, j.description)
      if (m !== null) map.set(j.id, m)
    }
    return map
  }, [resumeText, jobs, pipeline])

  /** Keyword match of each job's own targeted copy — tailoring progress per application. */
  const tailoredMatchOf = useMemo(() => {
    const map = new Map<string, number>()
    const versions = listResumeVersions()
    for (const e of pipeline) {
      if (!e.resumeVersionId) continue
      const v = versions.find((x) => x.id === e.resumeVersionId)
      if (!v) continue
      const m = matchScore(resumeToPlainText(visibleResume(v.data)), e.job.description)
      if (m !== null) map.set(e.job.id, m)
    }
    return map
  }, [pipeline])

  /** Word-boundary regex for a skills-filter term (R243 semantics). */
  const termRegex = (term: string) => {
    const t = term.toLowerCase()
    const escaped = t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const lead = /^\w/.test(t) ? '\\b' : ''
    const tail = /\w$/.test(t) ? '\\b' : ''
    return new RegExp(`${lead}${escaped}${tail}`)
  }

  /** Skill tags shared by two or more tracked jobs — Rezi's cue to tailor a copy. */
  const repeatedSkills = useMemo(() => {
    const counts = new Map<string, { tag: string; count: number }>()
    for (const e of pipeline) {
      const perJob = new Set<string>()
      for (const tag of e.job.tags ?? []) {
        const key = tag.toLowerCase()
        if (perJob.has(key)) continue
        perJob.add(key)
        const cur = counts.get(key)
        if (cur) cur.count += 1
        else counts.set(key, { tag, count: 1 })
      }
    }
    return [...counts.values()]
      .filter((s) => s.count >= 2)
      .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
      .slice(0, 12)
  }, [pipeline])

  /** Every distinct location across listings and tracked jobs, for the input's autocomplete. */
  const locationOptions = useMemo(
    () =>
      locationFacets(
        [...jobs, ...pipeline.map((e) => e.job)].map((j) => j.location),
        Infinity
      )
        .map((f) => f.label)
        .sort((a, b) => a.localeCompare(b)),
    [jobs, pipeline]
  )

  const loc = locationFilter.trim().toLowerCase()
  /** Whole application queue, grouped saved → applied → interviewing → offer → rejected,
   *  most recently updated first within a group. */
  const trackedQueue = useMemo(
    () =>
      JOB_STATUSES.flatMap((s) =>
        pipeline
          .filter(
            (e) => e.status === s && (!followUpOnly || staleDays(e) !== null || reminderDue(e))
          )
          .sort((a, b) => b.updatedAt - a.updatedAt)
          .map((e) => e.job)
      ),
    [pipeline, followUpOnly]
  )
  const base: JobListing[] =
    tab === 'all'
      ? jobs
      : tab === 'tracked'
        ? trackedQueue
        : pipeline.filter((e) => e.status === tab).map((e) => e.job)
  const afterExclude =
    tab === 'all' && excluded.size > 0
      ? base.filter((j) => {
          const s = statusOf.get(j.id)
          return !(s && excluded.has(s))
        })
      : base
  const afterType =
    tab === 'all' && typeFilter
      ? afterExclude.filter((j) => j.type.toLowerCase() === typeFilter)
      : afterExclude
  const skillTerms = skillsFilter
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  const activeSkillTerms = new Set(skillTerms.map((t) => t.toLowerCase()))
  /** Add a skill tag to the filter, or remove it if already active. */
  const toggleSkillTerm = (rawTag: string) => {
    const tag = rawTag.replace(/,/g, ' ').replace(/\s+/g, ' ').trim()
    if (!tag) return
    const kept = skillTerms.filter((t) => t.toLowerCase() !== tag.toLowerCase())
    const next = kept.length === skillTerms.length ? [...kept, tag] : kept
    setSkillsFilter(next.join(', '))
    setTab('all')
  }
  const afterSkills =
    tab === 'all' && skillTerms.length > 0
      ? afterType.filter((j) => {
          const haystack = `${j.title}\n${j.description}\n${(j.tags ?? []).join('\n')}`.toLowerCase()
          return skillTerms.every((term) => termRegex(term).test(haystack))
        })
      : afterType
  /** Candidate locations in the current results (pre-location-filter) with counts. */
  const locFacets = tab === 'all' ? locationFacets(afterSkills.map((j) => j.location)) : []
  const directMatches =
    tab === 'all' && loc
      ? afterSkills.filter((j) => j.location.toLowerCase().includes(loc))
      : afterSkills
  const anywhereMatches =
    tab === 'all' && loc
      ? afterSkills.filter(
          (j) => !j.location.toLowerCase().includes(loc) && isLocationAgnostic(j.location)
        )
      : []
  const applySort = (list: JobListing[]) =>
    tab === 'all' && sort === 'newest'
      ? [...list].sort(
          (a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()
        )
      : tab === 'all' && sort === 'match'
        ? [...list].sort(
            (a, b) =>
              (matchOf.get(b.id) ?? -1) - (matchOf.get(a.id) ?? -1) ||
              new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()
          )
        : list
  const sortedAnywhere = applySort(anywhereMatches)
  const shown = [...applySort(directMatches), ...sortedAnywhere]
  /** Index of the first location-agnostic result when the location input splits the list. */
  const anywhereStart = sortedAnywhere.length > 0 ? shown.length - sortedAnywhere.length : -1
  const selected =
    shown.find((j) => j.id === selectedId) ??
    jobs.find((j) => j.id === selectedId) ??
    pipeline.find((e) => e.job.id === selectedId)?.job ??
    null

  /** Keyword breakdown for the selected job — targeted copy when linked, else the draft. */
  const selectedReport = (() => {
    if (!selected) return null
    const entry = pipeline.find((e) => e.job.id === selected.id)
    const version = entry?.resumeVersionId
      ? listResumeVersions().find((v) => v.id === entry.resumeVersionId)
      : undefined
    const text = version ? resumeToPlainText(visibleResume(version.data)) : resumeText
    if (!text.trim()) return null
    const report = matchReport(text, selected.description)
    return report ? { ...report, source: version ? ('copy' as const) : ('draft' as const) } : null
  })()

  const counts = useMemo(() => {
    const c = { saved: 0, applied: 0, interviewing: 0, offer: 0, rejected: 0 }
    for (const e of pipeline) c[e.status]++
    return c
  }, [pipeline])

  /** The job's targeted copy if the pipeline links one that still exists. */
  const linkedVersion = (jobId: string) => {
    const id = pipeline.find((e) => e.job.id === jobId)?.resumeVersionId
    return id ? listResumeVersions().find((v) => v.id === id) : undefined
  }

  /** Prepare a saved copy of the current draft targeted at this job. */
  const prepareTargetedCopy = (job: JobListing) => {
    const draft = loadResume() ?? emptyResume()
    const version = createResumeVersion(
      `${job.title} — ${job.company}`,
      {
        ...draft,
        targetRole: job.title,
        targetCompany: job.company,
        jobDescription: job.description,
      },
      'Job applications'
    )
    if (!listPipeline().some((e) => e.job.id === job.id)) upsertPipeline(job, 'saved')
    setPipeline(setPipelineVersion(job.id, version.id))
    return version
  }

  const setStatus = (job: JobListing, status: JobStatus | 'none') => {
    if (status === 'none') {
      const entry = pipeline.find((e) => e.job.id === job.id)
      if (entry && (entry.notes?.trim() || timelineOf(entry).length > 1)) {
        setConfirmUntrack(job)
        return
      }
      setPipeline(removeFromPipeline(job.id))
      return
    }
    setPipeline(upsertPipeline(job, status))
    if (status === 'saved' && !linkedVersion(job.id)) prepareTargetedCopy(job)
  }

  const targetResume = (job: JobListing, intent: 'target' | 'cover') => {
    if (intent === 'target') {
      const version = linkedVersion(job.id) ?? prepareTargetedCopy(job)
      saveResume(version.data)
      setActiveVersionId(version.id)
      void navigate('/builder')
      return
    }
    const draft = loadResume() ?? emptyResume()
    const next = {
      ...draft,
      targetRole: job.title,
      targetCompany: job.company,
      jobDescription: job.description,
    }
    saveResume(next)
    syncActiveVersion(next)
    void navigate(
      `/builder?doc=cover&company=${encodeURIComponent(job.company)}&job=${encodeURIComponent(job.id)}`
    )
  }

  /** Set the draft's target job and open the interview prep tools in the editor. */
  const openInterviewPrep = (job: JobListing) => {
    const draft = loadResume() ?? emptyResume()
    const next = {
      ...draft,
      targetRole: job.title,
      targetCompany: job.company,
      jobDescription: job.description,
    }
    saveResume(next)
    syncActiveVersion(next)
    void navigate('/builder?doc=interview')
  }

  /** The next recommended action for a tracked job, from its status and tailoring progress. */
  const nextStep = (
    entry: PipelineEntry
  ): { text: string; label: string; onClick?: () => void; href?: string } => {
    const job = entry.job
    if (entry.status === 'rejected')
      return {
        text: 'Keep momentum — look for similar roles.',
        label: 'Search similar jobs',
        onClick: () => {
          setTab('all')
          setQuery(job.title)
          runSearch(job.title)
        },
      }
    if (entry.status === 'offer')
      return {
        text: 'You have an offer — leave your current role on good terms.',
        label: 'Open resignation letter',
        onClick: () => void navigate('/builder?doc=resignation'),
      }
    if (entry.status === 'applied' || entry.status === 'interviewing')
      return {
        text:
          entry.status === 'applied'
            ? 'Prepare for the interview while the application is fresh.'
            : 'Practice interview questions before the next round.',
        label: 'Open interview prep',
        onClick: () => openInterviewPrep(job),
      }
    if (!linkedVersion(job.id))
      return {
        text: 'Create a resume targeted at this job.',
        label: 'Target my resume',
        onClick: () => setConfirmTarget({ job, intent: 'target' }),
      }
    const match = tailoredMatchOf.get(job.id)
    if (match !== undefined && match < 80)
      return {
        text: `Improve your targeted copy — ${match}% keyword match.`,
        label: 'Open targeted resume',
        onClick: () => targetResume(job, 'target'),
      }
    return {
      text: 'Your copy is well tailored — apply while the posting is open.',
      label: 'Apply on site',
      href: job.url,
    }
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
      <main className="mx-auto flex w-full max-w-6xl flex-1 items-start gap-8 px-4 py-8">
        <WorkspaceNav />
        <div className="min-w-0 flex-1">
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
              ['tracked', `Tracked (${pipeline.length})`],
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
                setBulkMode(false)
                setBulkIds(new Set())
                if (value !== 'all' && selectedId) {
                  const st = statusOf.get(selectedId)
                  if (!st || (value !== 'tracked' && st !== value)) setSelectedId(null)
                }
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
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value)
                setSelectedId(null)
              }}
              aria-label="Filter by job type"
              className="border-input bg-background h-10 rounded-md border px-2 text-sm"
            >
              <option value="">All types</option>
              <option value="full time">Full time</option>
              <option value="part time">Part time</option>
              <option value="contract">Contract</option>
              <option value="freelance">Freelance</option>
              <option value="internship">Internship</option>
              <option value="other">Other</option>
            </select>
            <Input
              type="search"
              value={skillsFilter}
              onChange={(e) => setSkillsFilter(e.target.value)}
              placeholder="Skills, e.g. React, SQL"
              aria-label="Filter by skills"
              className="h-10 w-40"
            />
            <Input
              type="search"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              placeholder="Location, e.g. Europe"
              aria-label="Filter by location"
              className="h-10 w-36"
              list="job-location-options"
            />
            <datalist id="job-location-options">
              {locationOptions.map((label) => (
                <option key={label.toLowerCase()} value={label} />
              ))}
            </datalist>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as 'relevance' | 'newest')}
              aria-label="Sort jobs"
              className="border-input bg-background h-10 rounded-md border px-2 text-sm"
            >
              <option value="relevance">Relevance</option>
              <option value="newest">Newest</option>
              {matchOf.size > 0 && <option value="match">Best match</option>}
            </select>
          </form>
        )}

        {tab === 'all' && pipeline.length > 0 && (
          <div
            className="mt-3 flex flex-wrap items-center gap-1.5"
            role="group"
            aria-label="Hide jobs you are already tracking"
          >
            <span className="text-muted-foreground text-xs font-medium">Hide:</span>
            {JOB_STATUSES.map((s) => {
              const hits = jobs.filter((j) => statusOf.get(j.id) === s).length
              return (
                <button
                  key={s}
                  type="button"
                  aria-pressed={excluded.has(s)}
                  onClick={() =>
                    setExcluded((prev) => {
                      const next = new Set(prev)
                      if (next.has(s)) next.delete(s)
                      else next.add(s)
                      return next
                    })
                  }
                  className={`min-h-10 rounded-md border px-3 py-1 text-xs font-medium transition sm:min-h-8 ${
                    excluded.has(s)
                      ? 'border-primary ring-primary/40 ring-2'
                      : 'hover:border-muted-foreground/40'
                  }`}
                >
                  {JOB_STATUS_LABELS[s]}
                  {hits > 0 ? ` (${hits})` : ''}
                </button>
              )
            })}
          </div>
        )}

        {tab === 'all' && loading && locFacets.length === 0 && (
          <div aria-hidden="true" className="mt-3 flex animate-pulse flex-wrap items-center gap-1.5">
            <span className="text-muted-foreground text-xs font-medium">Locations:</span>
            {[112, 148, 96, 168, 128, 104, 144].map((w, i) => (
              <span
                key={i}
                style={{ width: w }}
                className="bg-muted inline-block min-h-10 rounded-md border sm:min-h-8"
              />
            ))}
          </div>
        )}
        {tab === 'all' && locFacets.length > 0 && (
          <div
            className="mt-3 flex flex-wrap items-center gap-1.5"
            role="group"
            aria-label="Filter by a location found in these results"
          >
            <span className="text-muted-foreground text-xs font-medium">Locations:</span>
            {locFacets.map((f) => {
              const active = locationFilter.trim().toLowerCase() === f.label.toLowerCase()
              return (
                <button
                  key={f.label.toLowerCase()}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setLocationFilter(active ? '' : f.label)}
                  className={`min-h-10 rounded-md border px-3 py-1 text-xs font-medium transition sm:min-h-8 ${
                    active ? 'border-primary ring-primary/40 ring-2' : 'hover:border-muted-foreground/40'
                  }`}
                >
                  {f.label} ({f.count})
                </button>
              )
            })}
          </div>
        )}

        {tab === 'tracked' && pipeline.length > 0 && (
          <div
            className="mt-3 flex flex-wrap items-center gap-2"
            role="group"
            aria-label="Bulk actions on tracked jobs"
          >
            {(attentionCount(pipeline) > 0 || followUpOnly) && (
              <button
                type="button"
                aria-pressed={followUpOnly}
                title="Show only applications with no status update in 7+ days"
                onClick={() => setFollowUpOnly((v) => !v)}
                className={`min-h-10 rounded-md border px-3 py-1 text-xs font-medium transition sm:min-h-8 ${
                  followUpOnly
                    ? 'border-amber-300 bg-amber-100 text-amber-800'
                    : 'hover:border-muted-foreground/40'
                }`}
              >
                Needs follow-up ({attentionCount(pipeline)})
              </button>
            )}
            <button
              type="button"
              aria-pressed={bulkMode}
              onClick={() => {
                setBulkMode((v) => !v)
                setBulkIds(new Set())
              }}
              className={`min-h-10 rounded-md border px-3 py-1 text-xs font-medium transition sm:min-h-8 ${
                bulkMode ? 'border-primary ring-primary/40 ring-2' : 'hover:border-muted-foreground/40'
              }`}
            >
              {bulkMode ? 'Done selecting' : 'Select…'}
            </button>
            {bulkMode && bulkIds.size > 0 && (
              <>
                <span className="text-muted-foreground text-xs font-medium">
                  {bulkIds.size} selected
                </span>
                <select
                  value=""
                  onChange={(e) => {
                    const status = e.target.value as JobStatus
                    if (!status) return
                    setPipeline(updateStatuses([...bulkIds], status))
                    setBulkIds(new Set())
                  }}
                  aria-label="Move selected jobs to a status"
                  className="border-input bg-background min-h-10 rounded-md border px-1.5 text-xs sm:min-h-8"
                >
                  <option value="" disabled>
                    Move to…
                  </option>
                  {JOB_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {JOB_STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-destructive min-h-10 sm:min-h-8"
                  onClick={() => setConfirmBulkUntrack(true)}
                >
                  Untrack {bulkIds.size}
                </Button>
                <button
                  type="button"
                  onClick={() => setBulkIds(new Set())}
                  className="text-muted-foreground hover:text-foreground min-h-10 text-xs underline-offset-2 hover:underline sm:min-h-8"
                >
                  Clear
                </button>
              </>
            )}
          </div>
        )}

        <div className="mt-6 grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <div
            className={`bg-card max-h-[70vh] overflow-y-auto rounded-md border ${
              mobileDetail ? 'hidden md:block' : ''
            }`}
          >
            {tab === 'tracked' && repeatedSkills.length > 0 && (
              <div className="bg-muted/40 flex flex-wrap items-center gap-1.5 border-b px-4 py-2">
                <span
                  className="text-muted-foreground text-xs font-medium"
                  title="Skills asked for by two or more of your tracked jobs — a cue to tailor a resume copy toward them"
                >
                  Repeated skills:
                </span>
                {repeatedSkills.map(({ tag, count }) => {
                  const active = activeSkillTerms.has(tag.toLowerCase())
                  const onResume =
                    resumeText.trim() !== '' && termRegex(tag).test(resumeText.toLowerCase())
                  return (
                    <button
                      key={tag.toLowerCase()}
                      type="button"
                      aria-pressed={active}
                      title={
                        (active
                          ? `Remove "${tag}" from the skills filter`
                          : `Find more jobs asking for "${tag}"`) +
                        (resumeText.trim() !== '' && !onResume
                          ? ` — not on your resume yet`
                          : '')
                      }
                      onClick={() => toggleSkillTerm(tag)}
                      className={
                        active
                          ? 'bg-primary text-primary-foreground inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs'
                          : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs'
                      }
                    >
                      {tag} ×{count}
                      {resumeText.trim() !== '' && !onResume && (
                        <span
                          aria-label="Not on your resume yet"
                          className="size-1.5 rounded-full bg-amber-500"
                        />
                      )}
                    </button>
                  )
                })}
              </div>
            )}
            {loading ? (
              <div aria-busy="true" className="animate-pulse">
                <p className="sr-only">Loading jobs…</p>
                {Array.from({ length: 8 }, (_, i) => (
                  <div key={i} className="flex items-center gap-3 border-b p-4 last:border-b-0">
                    <div className="bg-muted size-10 shrink-0 rounded" />
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="bg-muted h-4 w-3/4 rounded" />
                      <div className="bg-muted h-3 w-1/2 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <p className="text-destructive p-4 text-sm">{error}</p>
            ) : shown.length === 0 ? (
              <p className="text-muted-foreground p-4 text-sm">
                {tab === 'all'
                  ? 'No jobs found — try another search term.'
                  : tab === 'tracked'
                    ? followUpOnly
                      ? 'No applications need a follow-up right now.'
                      : 'Nothing tracked yet — use the status buttons on a job to track it.'
                    : `Nothing ${JOB_STATUS_LABELS[tab].toLowerCase()} yet — use the status buttons on a job to track it.`}
              </p>
            ) : (
              <ul>
                {shown.map((j, i) => {
                  const status = statusOf.get(j.id)
                  const updated = updatedAtOf.get(j.id)
                  return (
                    <li key={j.id} className="border-b last:border-b-0">
                      {i === anywhereStart && (
                        <p className="bg-muted/60 text-muted-foreground border-b px-4 py-1.5 text-xs font-medium">
                          Open to any location ({sortedAnywhere.length})
                        </p>
                      )}
                      {tab === 'tracked' && status && status !== statusOf.get(shown[i - 1]?.id ?? '') && (
                        <p className="bg-muted/60 text-muted-foreground border-b px-4 py-1.5 text-xs font-medium">
                          {JOB_STATUS_LABELS[status]} ({counts[status]})
                        </p>
                      )}
                      <div
                        className={`hover:bg-accent relative px-4 py-3 ${
                          selected?.id === j.id ? 'bg-accent border-primary border-l-2' : ''
                        } ${tab === 'tracked' && bulkMode ? 'flex items-start gap-2.5' : ''}`}
                      >
                        {tab === 'tracked' && bulkMode && (
                          <input
                            type="checkbox"
                            checked={bulkIds.has(j.id)}
                            onChange={() =>
                              setBulkIds((prev) => {
                                const next = new Set(prev)
                                if (next.has(j.id)) next.delete(j.id)
                                else next.add(j.id)
                                return next
                              })
                            }
                            aria-label={`Select ${j.title} at ${j.company}`}
                            className="accent-primary mt-1 size-4 shrink-0"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedId(j.id)
                            setMobileDetail(true)
                          }}
                          aria-pressed={selected?.id === j.id}
                          className="block w-full text-left"
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
                            <span className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">{j.title}</p>
                              <p className="text-muted-foreground truncate text-xs">
                                {j.company} · {j.location}
                              </p>
                            </span>
                            {tailoredMatchOf.has(j.id) ? (
                              <span
                                className={`mt-0.5 shrink-0 rounded-full px-1.5 py-0.5 text-[11px] font-medium ${matchTone(tailoredMatchOf.get(j.id) as number)}`}
                              >
                                {(tailoredMatchOf.get(j.id) as number) >= 80
                                  ? 'Tailored'
                                  : 'Tailoring'}{' '}
                                · {tailoredMatchOf.get(j.id)}%
                              </span>
                            ) : (
                              matchOf.has(j.id) && (
                                <span className="bg-primary/10 text-primary mt-0.5 shrink-0 rounded-full px-1.5 py-0.5 text-[11px] font-medium">
                                  {matchOf.get(j.id)}% match
                                </span>
                              )
                            )}
                          </span>
                          <p className="text-muted-foreground mt-0.5 text-xs">
                            {postedAgo(j.postedAt)}
                            {status && updated && (
                              <span className="text-primary ml-2 font-medium">
                                {JOB_STATUS_LABELS[status]} {agoFromMs(updated)}
                              </span>
                            )}
                            {(() => {
                              const entry = pipeline.find((e) => e.job.id === j.id)
                              const stale = entry ? staleDays(entry) : null
                              const due = entry !== undefined && reminderDue(entry)
                              return (
                                <>
                                  {stale !== null && (
                                    <span className="ml-2 rounded-full bg-amber-100 px-1.5 py-0.5 text-[11px] font-medium text-amber-800">
                                      No update · {stale}d
                                    </span>
                                  )}
                                  {due && (
                                    <span className="ml-2 rounded-full bg-amber-100 px-1.5 py-0.5 text-[11px] font-medium text-amber-800">
                                      Follow up due
                                    </span>
                                  )}
                                </>
                              )
                            })()}
                            {hasNotes.has(j.id) && (
                              <StickyNote
                                aria-label="Has notes"
                                role="img"
                                className="text-muted-foreground ml-2 inline size-3.5 align-[-2px]"
                              />
                            )}
                          </p>
                        </button>
                        <div className="mt-1.5 flex items-center gap-1.5">
                          <button
                            type="button"
                            aria-pressed={status !== undefined}
                            onClick={() => setStatus(j, status ? 'none' : 'saved')}
                            className={`min-h-10 rounded-md border px-2 py-0.5 text-xs font-medium transition sm:min-h-7 ${
                              status
                                ? 'border-primary ring-primary/40 ring-2'
                                : 'hover:border-muted-foreground/40'
                            }`}
                          >
                            {status ? (status === 'saved' ? 'Saved' : 'Tracked') : 'Save'}
                          </button>
                          <select
                            value={status ?? 'none'}
                            onChange={(e) => setStatus(j, e.target.value as JobStatus | 'none')}
                            aria-label={`Status of ${j.title} at ${j.company}`}
                            className="border-input bg-background min-h-10 rounded-md border px-1.5 text-xs sm:min-h-7"
                          >
                            <option value="none">No status</option>
                            {JOB_STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {JOB_STATUS_LABELS[s]}
                              </option>
                            ))}
                          </select>
                        </div>
                        </div>
                      </div>
                    </li>
                  )
                })}
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
                  {tailoredMatchOf.has(selected.id) ? (
                    <span
                      className={
                        (tailoredMatchOf.get(selected.id) as number) >= 80
                          ? 'ml-2 font-medium text-emerald-700'
                          : (tailoredMatchOf.get(selected.id) as number) >= 50
                            ? 'ml-2 font-medium text-amber-700'
                            : 'ml-2 font-medium text-red-700'
                      }
                    >
                      Targeted copy: {tailoredMatchOf.get(selected.id)}% keyword match
                    </span>
                  ) : (
                    matchOf.has(selected.id) && (
                      <span className="text-primary ml-2 font-medium">
                        {matchOf.get(selected.id)}% keyword match with your resume
                      </span>
                    )
                  )}
                </p>
                {selectedReport && (
                  <div className="mt-2">
                    <button
                      type="button"
                      aria-expanded={reportOpenId === selected.id}
                      onClick={() =>
                        setReportOpenId((cur) => (cur === selected.id ? null : selected.id))
                      }
                      className="text-primary text-xs font-medium underline-offset-2 hover:underline"
                    >
                      {reportOpenId === selected.id ? 'Hide tailoring report' : 'Tailoring report'}
                    </button>
                    {reportOpenId === selected.id && (
                      <div className="bg-muted/40 mt-2 rounded-md border p-2.5 text-xs">
                        <p className="text-muted-foreground">
                          Against{' '}
                          {selectedReport.source === 'copy'
                            ? 'the targeted copy for this job'
                            : 'your current resume draft'}
                          : covered {selectedReport.covered.length} of{' '}
                          {selectedReport.covered.length + selectedReport.missing.length} job
                          keywords.
                        </p>
                        {selectedReport.missing.length === 0 ? (
                          <p className="mt-1 font-medium text-emerald-700 dark:text-emerald-400">
                            All job keywords covered.
                          </p>
                        ) : (
                          <>
                            {selectedReport.highPriorityMissing.length > 0 && (
                              <div className="mt-1.5 flex flex-wrap items-center gap-1">
                                <span className="font-medium text-amber-700 dark:text-amber-400">
                                  High priority missing:
                                </span>
                                {selectedReport.highPriorityMissing.slice(0, 10).map((kw) => (
                                  <span
                                    key={kw}
                                    className="rounded-full bg-amber-100 px-1.5 py-0.5 text-amber-800 dark:bg-amber-950"
                                  >
                                    {kw}
                                  </span>
                                ))}
                                {selectedReport.highPriorityMissing.length > 10 && (
                                  <span className="text-muted-foreground">
                                    +{selectedReport.highPriorityMissing.length - 10} more
                                  </span>
                                )}
                              </div>
                            )}
                            {selectedReport.missing.length >
                              selectedReport.highPriorityMissing.length && (
                              <div className="mt-1.5 flex flex-wrap items-center gap-1">
                                <span className="text-muted-foreground font-medium">
                                  Also missing:
                                </span>
                                {selectedReport.missing
                                  .filter((kw) => !selectedReport.highPriorityMissing.includes(kw))
                                  .slice(0, 10)
                                  .map((kw) => (
                                    <span
                                      key={kw}
                                      className="bg-muted text-muted-foreground rounded-full px-1.5 py-0.5"
                                    >
                                      {kw}
                                    </span>
                                  ))}
                                {selectedReport.missing.length -
                                  selectedReport.highPriorityMissing.length >
                                  10 && (
                                  <span className="text-muted-foreground">
                                    +
                                    {selectedReport.missing.length -
                                      selectedReport.highPriorityMissing.length -
                                      10}{' '}
                                    more
                                  </span>
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
                {(selected.tags?.length ?? 0) > 0 && (
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className="text-muted-foreground text-xs font-medium">Skills:</span>
                    {(tagsExpandedId === selected.id
                      ? (selected.tags ?? [])
                      : (selected.tags ?? []).slice(0, 10)
                    ).map((tag) => {
                      const active = activeSkillTerms.has(tag.toLowerCase())
                      return (
                        <button
                          key={tag}
                          type="button"
                          aria-pressed={active}
                          title={active ? `Remove "${tag}" from the skills filter` : `Filter jobs by "${tag}"`}
                          onClick={() => toggleSkillTerm(tag)}
                          className={
                            active
                              ? 'bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs'
                              : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground rounded-full px-2 py-0.5 text-xs'
                          }
                        >
                          {tag}
                        </button>
                      )
                    })}
                    {(selected.tags?.length ?? 0) > 10 && tagsExpandedId !== selected.id && (
                      <button
                        type="button"
                        onClick={() => setTagsExpandedId(selected.id)}
                        className="text-primary text-xs underline-offset-2 hover:underline"
                      >
                        +{(selected.tags?.length ?? 0) - 10} more
                      </button>
                    )}
                  </div>
                )}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Button
                    type="button"
                    size="sm"
                    className="min-h-10 gap-1.5 sm:min-h-8"
                    onClick={() => setConfirmTarget({ job: selected, intent: 'target' })}
                  >
                    <BriefcaseBusiness className="size-4" />{' '}
                    {linkedVersion(selected.id) ? 'Open targeted resume' : 'Target my resume'}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="min-h-10 gap-1.5 sm:min-h-8"
                    onClick={() => setConfirmTarget({ job: selected, intent: 'cover' })}
                  >
                    <FileText className="size-4" /> Cover letter
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
                {(() => {
                  const entry = pipeline.find((e) => e.job.id === selected.id)
                  if (!entry) return null
                  const steps = timelineOf(entry)
                  const notes =
                    notesDraft?.jobId === selected.id ? notesDraft.text : (entry.notes ?? '')
                  const step = nextStep(entry)
                  return (
                    <div className="bg-muted/40 mt-4 rounded-md border p-3">
                      <div className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1.5 border-b pb-3">
                        <p className="flex items-center gap-1.5 text-sm">
                          <Lightbulb aria-hidden className="text-primary size-4 shrink-0" />
                          <span className="font-medium">Next step:</span> {step.text}
                        </p>
                        {step.href ? (
                          <Button
                            asChild
                            type="button"
                            size="sm"
                            variant="outline"
                            className="min-h-10 sm:min-h-7"
                          >
                            <a href={step.href} target="_blank" rel="noopener noreferrer">
                              {step.label} <ExternalLink className="size-3.5" />
                            </a>
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="min-h-10 sm:min-h-7"
                            onClick={step.onClick}
                          >
                            {step.label}
                          </Button>
                        )}
                      </div>
                      {(() => {
                        const coverDoc = entry.coverDocId
                          ? listCareerDocs().find((d) => d.id === entry.coverDocId)
                          : undefined
                        if (!coverDoc) return null
                        return (
                          <p className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                            <span className="text-muted-foreground">Cover letter:</span>
                            <span className="font-medium">{coverDoc.title}</span>
                            <button
                              type="button"
                              className="text-primary underline-offset-2 hover:underline"
                              onClick={() => void navigate(`/documents?doc=${coverDoc.id}`)}
                            >
                              Open
                            </button>
                          </p>
                        )
                      })()}
                      <p className="text-sm font-medium">Application timeline</p>
                      <ol className="mt-1.5 flex flex-wrap items-center gap-y-1 text-xs">
                        {steps.map((step, i) => (
                          <li key={`${step.status}-${step.at}`} className="flex items-center">
                            {i > 0 && (
                              <span aria-hidden className="text-muted-foreground mx-1.5">
                                →
                              </span>
                            )}
                            <span
                              className={
                                i === steps.length - 1
                                  ? 'bg-primary/10 text-primary rounded-full px-2 py-0.5 font-medium'
                                  : 'text-muted-foreground'
                              }
                            >
                              {JOB_STATUS_LABELS[step.status]} · {shortDate(step.at)}
                            </span>
                          </li>
                        ))}
                      </ol>
                      {(() => {
                        const stale = staleDays(entry)
                        const canDraft =
                          entry.status === 'applied' ||
                          entry.status === 'interviewing' ||
                          entry.status === 'offer'
                        return (
                          canDraft && (
                            <div className="mt-1.5 flex flex-wrap items-center gap-2">
                              {stale !== null && (
                                <p className="text-xs font-medium text-amber-700">
                                  No update in {stale} days — consider following up.
                                </p>
                              )}
                              <button
                                type="button"
                                className="min-h-8 rounded-md border px-2 py-0.5 text-xs font-medium transition hover:border-muted-foreground/40"
                                onClick={() => {
                                  setFollowUpCopied('idle')
                                  setFollowUpDraft(
                                    followUpEmail(entry, loadResume()?.contact.fullName)
                                  )
                                }}
                              >
                                {entry.status === 'offer'
                                  ? 'Draft thank-you email'
                                  : 'Draft follow-up email'}
                              </button>
                            </div>
                          )
                        )
                      })()}
                      <label htmlFor="job-remind" className="mt-3 block text-sm font-medium">
                        Remind me to follow up
                      </label>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <input
                          id="job-remind"
                          type="date"
                          value={entry.remindOn ?? ''}
                          onChange={(e) =>
                            setPipeline(
                              setPipelineReminder(selected.id, e.target.value || null)
                            )
                          }
                          className="border-input bg-background min-h-8 rounded-md border px-2.5 py-1 text-sm"
                        />
                        {entry.remindOn !== undefined && (
                          <button
                            type="button"
                            className="min-h-8 rounded-md border px-2 py-0.5 text-xs font-medium transition hover:border-muted-foreground/40"
                            onClick={() => setPipeline(setPipelineReminder(selected.id, null))}
                          >
                            Clear reminder
                          </button>
                        )}
                        {entry.remindOn !== undefined && reminderDue(entry) && (
                          <p className="text-xs font-medium text-amber-700">
                            Reminder due {shortDay(entry.remindOn)} — consider following up.
                          </p>
                        )}
                      </div>
                      <label
                        htmlFor="job-notes"
                        className="mt-3 block text-sm font-medium"
                      >
                        Notes
                      </label>
                      <textarea
                        id="job-notes"
                        value={notes}
                        onChange={(e) =>
                          setNotesDraft({ jobId: selected.id, text: e.target.value })
                        }
                        onBlur={() => {
                          if (notesDraft?.jobId !== selected.id) return
                          setPipeline(setPipelineNotes(selected.id, notesDraft.text))
                          setNotesDraft(null)
                        }}
                        rows={3}
                        placeholder="Recruiter name, interview dates, follow-ups… saved in this browser only."
                        className="border-input bg-background mt-1 w-full rounded-md border px-2.5 py-1.5 text-sm"
                      />
                    </div>
                  )
                })()}
                <div className="mt-4">
                  {structureJobDescription(selected.description).map((s, i) => (
                    <section key={i} className={i > 0 ? 'mt-4' : undefined}>
                      {s.heading !== null && (
                        <h3 className="text-foreground/80 text-xs font-semibold tracking-wide uppercase">
                          {s.heading}
                        </h3>
                      )}
                      {s.body && (
                        <p
                          className={`text-muted-foreground whitespace-pre-wrap text-sm ${s.heading !== null ? 'mt-1' : ''}`}
                        >
                          {s.body}
                        </p>
                      )}
                    </section>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-muted-foreground text-sm">Select a job to see the details.</p>
            )}
          </div>
        </div>
        <PlanCard className="mt-8 md:hidden" />
        </div>
      </main>
      <SiteFooter />

      <Dialog open={confirmTarget !== null} onOpenChange={(o) => !o && setConfirmTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {confirmTarget?.intent === 'cover'
                ? `Write a cover letter for "${confirmTarget.job.title}"?`
                : `Open a resume targeted at "${confirmTarget?.job.title}"?`}
            </DialogTitle>
            <DialogDescription>
              {confirmTarget?.intent === 'cover'
                ? "This sets the job title and description on your current draft so the ATS score and AI tailoring in the editor aim at this posting, then opens the cover letter tool pre-filled for this company. It replaces the draft's current target job, if any."
                : confirmTarget && linkedVersion(confirmTarget.job.id)
                  ? 'This job already has a targeted copy of your resume — the editor opens that copy. Your other resumes keep their own target jobs.'
                  : 'This saves a copy of your resume targeted at this posting (filed under “Job applications” on your dashboard) and opens it in the editor. Your current draft keeps its own target job.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setConfirmTarget(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => confirmTarget && targetResume(confirmTarget.job, confirmTarget.intent)}
            >
              {confirmTarget?.intent === 'cover'
                ? 'Open cover letter tool'
                : confirmTarget && linkedVersion(confirmTarget.job.id)
                  ? 'Open targeted copy'
                  : 'Create copy and open editor'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmUntrack !== null} onOpenChange={(o) => !o && setConfirmUntrack(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{`Stop tracking "${confirmUntrack?.title ?? ''}"?`}</DialogTitle>
            <DialogDescription>
              {(() => {
                const entry = confirmUntrack
                  ? pipeline.find((e) => e.job.id === confirmUntrack.id)
                  : undefined
                const steps = entry ? timelineOf(entry).length : 0
                const parts = [
                  steps > 1 ? `its application timeline (${steps} status changes)` : '',
                  entry?.notes?.trim() ? 'your notes' : '',
                ].filter(Boolean)
                return `This removes the job from your pipeline and deletes ${parts.join(' and ')}. Targeted resume copies stay on your dashboard.`
              })()}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              className="min-h-10"
              onClick={() => setConfirmUntrack(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="min-h-10"
              onClick={() => {
                if (confirmUntrack) setPipeline(removeFromPipeline(confirmUntrack.id))
                setConfirmUntrack(null)
              }}
            >
              Stop tracking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={followUpDraft !== null} onOpenChange={(o) => !o && setFollowUpDraft(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Follow-up email</DialogTitle>
            <DialogDescription>
              A ready-to-send draft — edit it below, then copy it into your email client.
            </DialogDescription>
          </DialogHeader>
          {followUpDraft && (
            <div className="space-y-3">
              <div>
                <label htmlFor="follow-up-subject" className="block text-sm font-medium">
                  Subject
                </label>
                <Input
                  id="follow-up-subject"
                  className="mt-1"
                  value={followUpDraft.subject}
                  onChange={(e) =>
                    setFollowUpDraft({ ...followUpDraft, subject: e.target.value })
                  }
                />
              </div>
              <div>
                <label htmlFor="follow-up-body" className="block text-sm font-medium">
                  Message
                </label>
                <textarea
                  id="follow-up-body"
                  className="border-input bg-background mt-1 min-h-48 w-full rounded-md border px-3 py-2 text-sm"
                  value={followUpDraft.body}
                  onChange={(e) => setFollowUpDraft({ ...followUpDraft, body: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              className="min-h-10"
              onClick={() => setFollowUpDraft(null)}
            >
              Close
            </Button>
            {followUpDraft && (
              <Button asChild variant="outline" className="min-h-10">
                <a
                  href={`mailto:?subject=${encodeURIComponent(followUpDraft.subject)}&body=${encodeURIComponent(followUpDraft.body)}`}
                >
                  Open in email app
                </a>
              </Button>
            )}
            <Button
              type="button"
              className="min-h-10"
              onClick={() => {
                if (!followUpDraft) return
                void navigator.clipboard
                  .writeText(`Subject: ${followUpDraft.subject}\n\n${followUpDraft.body}`)
                  .then(
                    () => setFollowUpCopied('copied'),
                    () => setFollowUpCopied('failed')
                  )
              }}
            >
              {followUpCopied === 'copied'
                ? 'Copied'
                : followUpCopied === 'failed'
                  ? 'Copy failed'
                  : 'Copy email'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmBulkUntrack} onOpenChange={(o) => !o && setConfirmBulkUntrack(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{`Stop tracking ${bulkIds.size} job${bulkIds.size === 1 ? '' : 's'}?`}</DialogTitle>
            <DialogDescription>
              This removes the selected jobs from your pipeline and deletes their application
              timelines and notes. Targeted resume copies stay on your dashboard.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              className="min-h-10"
              onClick={() => setConfirmBulkUntrack(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="min-h-10"
              onClick={() => {
                setPipeline(removeManyFromPipeline([...bulkIds]))
                setBulkIds(new Set())
                setConfirmBulkUntrack(false)
              }}
            >
              Stop tracking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
