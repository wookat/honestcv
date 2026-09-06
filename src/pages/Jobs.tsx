/**
 * Job search: a two-pane remote-jobs board (list + detail) with a local
 * application pipeline. "Target my resume" copies the job's title and
 * description into the current draft so the existing JD tailoring and ATS
 * scoring flow picks it up in the editor.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  BriefcaseBusiness,
  ExternalLink,
  FileText,
  Lightbulb,
  Search,
  StickyNote,
  Undo2,
  X,
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
  type RemovedPipelineEntry,
  attentionCount,
  copyTargetsJob,
  followUpEmail,
  isLocationAgnostic,
  listPipeline,
  locationFacets,
  markFollowedUp,
  removeManyFromPipeline,
  restorePipelineEntries,
  searchJobs,
  reminderDue,
  setPipelineCoverDoc,
  setPipelineInterviewDoc,
  setPipelineNotes,
  setPipelineReminder,
  setPipelineResignationDoc,
  setPipelineVersion,
  staleDays,
  stashUnreadablePipeline,
  structureJobDescription,
  timelineOf,
  updateStatuses,
  upsertPipeline,
} from '@/lib/jobs'
import {
  listCareerDocs,
  rememberLinkedDocJobs,
  type CareerDoc,
  type CareerDocKind,
} from '@/lib/documents'
import { matchReport, matchScore } from '@/lib/ats'
import {
  createResumeVersion,
  emptyResume,
  getActiveVersionId,
  listResumeVersions,
  loadResume,
  resumeHasContent,
  resumeToPlainText,
  saveResume,
  saveResumeVersion,
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

const countLetterPlaceholders = (text: string) => text.match(/\[[^\][\n]{1,120}\]/g)?.length ?? 0

/** "Mon D" for dates in the current year, "Mon D, YYYY" otherwise. */
const shortDateOf = (date: Date) =>
  date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    ...(date.getFullYear() !== new Date().getFullYear() ? { year: 'numeric' as const } : {}),
  })

const shortDate = (ms: number) => shortDateOf(new Date(ms))

/** yyyy-mm-dd formatted from the day's components (no timezone shifting). */
const shortDay = (day: string) => {
  const [y, m, d] = day.split('-').map(Number)
  return shortDateOf(new Date(y, m - 1, d))
}

/** How many of the entry's linked documents still exist (a deleted document leaves its id behind so Undo can relink it). */
const linkedDocCount = (entry: PipelineEntry): number => {
  const ids = new Set(listCareerDocs().map((d) => d.id))
  return [entry.coverDocId, entry.interviewDocId, entry.resignationDocId].filter(
    (id): id is string => id !== undefined && ids.has(id)
  ).length
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
  const [pipelineUnreadable, setPipelineUnreadable] = useState(() => stashUnreadablePipeline())
  const [pipeline, setPipeline] = useState<PipelineEntry[]>(() => {
    const entries = listPipeline()
    rememberLinkedDocJobs(entries)
    return entries
  })
  const [selectedId, setSelectedId] = useState<string | null>(() => seedParams.get('job'))
  // Only selections the user made (row tap or ?job= deep link) belong in the
  // URL; the automatic first-row selection that feeds the desktop pane does not.
  const explicitSelection = useRef(seedParams.get('job') !== null)
  // A ?job= deep link should read like tapping that row: open the detail pane on mobile.
  const [mobileDetail, setMobileDetail] = useState(() => seedParams.get('job') !== null)
  // The ?attention=1 deep link focuses the first application needing a follow-up
  // instead of the first feed job; consumed on the first fetch only.
  const seedAttentionSelect = useRef(seedAttention && seedParams.get('job') === null)
  // Pending ?job= deep link, checked once against the first fetched list so a
  // dead link says so instead of silently showing an unrelated job.
  const [pendingSeedJob, setPendingSeedJob] = useState(() => seedParams.get('job'))
  const [jobLinkNotFound, setJobLinkNotFound] = useState(false)
  // Live job resolved from a ?job= deep link that the current search doesn't cover.
  const [linkedJob, setLinkedJob] = useState<JobListing | null>(null)
  const [linkedJobNotice, setLinkedJobNotice] = useState(false)
  const [trackedFilter, setTrackedFilter] = useState('')
  const [bulkMode, setBulkMode] = useState(false)
  const [bulkIds, setBulkIds] = useState<ReadonlySet<string>>(new Set())
  const [confirmBulkUntrack, setConfirmBulkUntrack] = useState(false)
  const [confirmTarget, setConfirmTarget] = useState<{
    job: JobListing
    intent: 'target' | 'cover' | 'keywords' | 'interview'
  } | null>(null)
  const [notesDraft, setNotesDraft] = useState<{ jobId: string; text: string } | null>(null)
  const [reportOpenId, setReportOpenId] = useState<string | null>(null)
  const [reportKwExpandedId, setReportKwExpandedId] = useState<string | null>(null)
  const [confirmUntrack, setConfirmUntrack] = useState<JobListing | null>(null)
  const [storageError, setStorageError] = useState(false)
  const [followUpDraft, setFollowUpDraft] = useState<{
    jobId: string
    subject: string
    body: string
  } | null>(null)
  const [followUpCopied, setFollowUpCopied] = useState<'idle' | 'copied' | 'failed'>('idle')

  const fetchJobs = (q: string, cat = '') =>
    searchJobs(q, cat)
      .then(async (list) => {
        setJobs(list)
        let seedResolved: JobListing | null = null
        if (pendingSeedJob) {
          setPendingSeedJob(null)
          const known =
            list.some((j) => j.id === pendingSeedJob) ||
            listPipeline().some((e) => e.job.id === pendingSeedJob)
          if (!known) {
            // The first search is seeded from the resume's target role, so a
            // shared link can point at a live job outside it. Check the
            // unfiltered feed before declaring the link dead.
            if (q.trim() || cat) {
              const all = await searchJobs('').catch(() => [] as JobListing[])
              seedResolved = all.find((j) => j.id === pendingSeedJob) ?? null
            }
            if (seedResolved) {
              setLinkedJob(seedResolved)
              setLinkedJobNotice(true)
            } else {
              setJobLinkNotFound(true)
              setMobileDetail(false)
            }
          }
        }
        setSelectedId((cur) => {
          if (
            cur &&
            (list.some((j) => j.id === cur) ||
              listPipeline().some((e) => e.job.id === cur) ||
              seedResolved?.id === cur)
          ) {
            return cur
          }
          explicitSelection.current = false
          if (seedAttentionSelect.current) {
            seedAttentionSelect.current = false
            const first = listPipeline().find((e) => staleDays(e) !== null || reminderDue(e))
            if (first) return first.job.id
          }
          return list[0]?.id ?? null
        })
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
    if (selectedId && explicitSelection.current) params.set('job', selectedId)
    const qs = params.toString()
    window.history.replaceState(window.history.state, '', window.location.pathname + (qs ? `?${qs}` : ''))
  }, [query, tab, followUpOnly, category, locationFilter, typeFilter, skillsFilter, sort, selectedId])

  // On the mobile layout the detail pane covers the list, so browser Back
  // should close it and return to the list instead of leaving /jobs: push a
  // sentinel history entry while the pane is open and pop it on close.
  useEffect(() => {
    if (!mobileDetail) return
    if (!window.matchMedia('(max-width: 767px)').matches) return
    window.history.pushState({ 'hcv-mobile-detail': true }, '')
    const onPop = () => setMobileDetail(false)
    window.addEventListener('popstate', onPop)
    return () => {
      window.removeEventListener('popstate', onPop)
      const state = window.history.state as Record<string, unknown> | null
      if (state && state['hcv-mobile-detail']) window.history.back()
    }
  }, [mobileDetail])

  // The mobile detail pane shares the page scroll with the list, so opening a
  // job deep in the list would land mid-description: show the detail from the
  // top and restore the list's scroll offset when the pane closes.
  const listScrollRef = useRef(0)
  const mobileDetailWasOpen = useRef(false)
  useEffect(() => {
    if (!window.matchMedia('(max-width: 767px)').matches) return
    if (mobileDetail) {
      mobileDetailWasOpen.current = true
      listScrollRef.current = window.scrollY
      window.scrollTo(0, 0)
    } else if (mobileDetailWasOpen.current) {
      mobileDetailWasOpen.current = false
      window.scrollTo(0, listScrollRef.current)
    }
  }, [mobileDetail])

  const statusOf = useMemo(() => {
    const map = new Map<string, JobStatus>()
    for (const e of pipeline) map.set(e.job.id, e.status)
    return map
  }, [pipeline])

  const statusChangedAtOf = useMemo(() => {
    const map = new Map<string, number>()
    for (const e of pipeline) {
      const steps = timelineOf(e)
      map.set(e.job.id, steps[steps.length - 1].at)
    }
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
  const trackedQueue = useMemo(() => {
    const needle = trackedFilter.trim().toLowerCase()
    return JOB_STATUSES.flatMap((s) =>
      pipeline
        .filter(
          (e) =>
            e.status === s &&
            (!followUpOnly || staleDays(e) !== null || reminderDue(e)) &&
            (!needle || `${e.job.title} ${e.job.company}`.toLowerCase().includes(needle))
        )
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .map((e) => e.job)
    )
  }, [pipeline, followUpOnly, trackedFilter])
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
  /** Rows actually listed per status group, so headers stay honest under filters. */
  const shownCounts = (() => {
    const c: Record<JobStatus, number> = { saved: 0, applied: 0, interviewing: 0, offer: 0, rejected: 0 }
    if (tab === 'tracked') {
      for (const j of shown) {
        const s = statusOf.get(j.id)
        if (s) c[s]++
      }
    }
    return c
  })()
  /** Bulk actions only touch rows the user can currently see; selections on rows hidden by a filter stay checked but inert. */
  const visibleBulkIds =
    tab === 'tracked' && bulkIds.size > 0
      ? new Set([...bulkIds].filter((id) => shown.some((j) => j.id === id)))
      : bulkIds
  const selected =
    shown.find((j) => j.id === selectedId) ??
    jobs.find((j) => j.id === selectedId) ??
    pipeline.find((e) => e.job.id === selectedId)?.job ??
    (linkedJob?.id === selectedId ? linkedJob : null) ??
    (selectedId === null ? (shown[0] ?? null) : null)

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

  /** Applies a pipeline mutation; surfaces the storage-full alert when nothing was written. */
  const applyPipeline = (next: PipelineEntry[] | null): boolean => {
    if (next === null) {
      setStorageError(true)
      return false
    }
    setPipeline(next)
    return true
  }

  const [undoUntrack, setUndoUntrack] = useState<RemovedPipelineEntry[] | null>(null)
  useEffect(() => {
    if (!undoUntrack) return
    const t = setTimeout(() => setUndoUntrack(null), 10000)
    return () => clearTimeout(t)
  }, [undoUntrack])
  /** Untracks jobs and offers to put their entries back (status, timeline, notes, links) for 10s. */
  const untrack = (ids: readonly string[]): boolean => {
    const set = new Set(ids)
    const removed = pipeline.flatMap((entry, index) =>
      set.has(entry.job.id) ? [{ entry, index }] : []
    )
    if (!applyPipeline(removeManyFromPipeline(ids))) return false
    setUndoUntrack(removed.length > 0 ? removed : null)
    return true
  }

  /** The job's targeted copy if the pipeline links one that still exists. */
  const linkedVersion = (jobId: string) => {
    const id = pipeline.find((e) => e.job.id === jobId)?.resumeVersionId
    return id ? listResumeVersions().find((v) => v.id === id) : undefined
  }

  /** The job's saved cover letter / interview brief if the pipeline links one that still exists. */
  const linkedDoc = (jobId: string, kind: 'cover' | 'interview') => {
    const entry = pipeline.find((e) => e.job.id === jobId)
    const id = kind === 'cover' ? entry?.coverDocId : entry?.interviewDocId
    return id ? listCareerDocs().find((d) => d.id === id) : undefined
  }

  /** Documents written for this job (they remember it) other than the one the pipeline links. */
  const earlierDocsFor = (entry: PipelineEntry, kind: CareerDocKind): CareerDoc[] => {
    const linkedId =
      kind === 'cover'
        ? entry.coverDocId
        : kind === 'interview'
          ? entry.interviewDocId
          : entry.resignationDocId
    return listCareerDocs()
      .filter((d) => d.kind === kind && d.forJob?.id === entry.job.id && d.id !== linkedId)
      .sort((a, b) => b.updatedAt - a.updatedAt)
  }

  /** Rows for a job's earlier documents of one kind; offers to link one when the job has no live linked document. */
  const earlierDocRows = (entry: PipelineEntry, kind: CareerDocKind, hasLinked: boolean) => {
    const noun =
      kind === 'cover'
        ? 'Cover letter'
        : kind === 'interview'
          ? 'Interview prep'
          : 'Resignation letter'
    const relink =
      kind === 'cover'
        ? setPipelineCoverDoc
        : kind === 'interview'
          ? setPipelineInterviewDoc
          : setPipelineResignationDoc
    return earlierDocsFor(entry, kind).map((doc) => (
      <p key={doc.id} className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
        <span className="text-muted-foreground">
          {hasLinked ? `Earlier ${noun.toLowerCase()}:` : `${noun} (not linked):`}
        </span>
        <span className="font-medium">{doc.title}</span>
        <button
          type="button"
          className="text-primary underline-offset-2 hover:underline"
          onClick={() => void navigate(`/documents?doc=${doc.id}`)}
        >
          Open
        </button>
        {!hasLinked && (
          <button
            type="button"
            className="text-primary underline-offset-2 hover:underline"
            onClick={() => applyPipeline(relink(entry.job.id, doc.id))}
          >
            Use for this job
          </button>
        )}
      </p>
    ))
  }

  /** A saved copy already targeted at this job that no tracked job links to (e.g. left behind by untracking). */
  const orphanTargetedCopy = (job: JobListing) => {
    const linked = new Set(listPipeline().map((e) => e.resumeVersionId))
    return listResumeVersions().find((v) => !linked.has(v.id) && copyTargetsJob(v.data, job))
  }

  /** The job's linked copy, or an orphan copy already targeted at it. */
  const targetedCopyOf = (job: JobListing) => linkedVersion(job.id) ?? orphanTargetedCopy(job)

  /** The editor holds a standalone draft (synced to no copy) with content, and this job already has a
   * copy that would open over it — the one case where work is lost rather than cloned or re-aimed. */
  const draftAtRisk = (job: JobListing) =>
    getActiveVersionId() === null &&
    resumeHasContent(loadResume() ?? emptyResume()) &&
    targetedCopyOf(job) !== undefined

  const keepDraftAsCopy = (): boolean => {
    const draft = loadResume()
    if (!draft) return true
    if (saveResumeVersion(draft.targetRole || draft.contact.fullName || 'Untitled copy', draft))
      return true
    setStorageError(true)
    return false
  }

  /** Link this job to its existing targeted copy, or save a new copy of the current draft targeted at it. */
  const prepareTargetedCopy = (job: JobListing) => {
    const draft = loadResume() ?? emptyResume()
    const version =
      orphanTargetedCopy(job) ??
      createResumeVersion(
        `${job.title} — ${job.company}`,
        {
          ...draft,
          targetRole: job.title,
          targetCompany: job.company,
          jobDescription: job.description,
        },
        'Job applications'
      )
    if (!version) {
      setStorageError(true)
      return null
    }
    if (
      !listPipeline().some((e) => e.job.id === job.id) &&
      !applyPipeline(upsertPipeline(job, 'saved'))
    )
      return null
    if (!applyPipeline(setPipelineVersion(job.id, version.id))) return null
    return version
  }

  const setStatus = (job: JobListing, status: JobStatus | 'none') => {
    if (status === 'none') {
      const entry = pipeline.find((e) => e.job.id === job.id)
      if (
        entry &&
        (entry.notes?.trim() ||
          timelineOf(entry).length > 1 ||
          linkedDocCount(entry) > 0 ||
          linkedVersion(job.id))
      ) {
        setConfirmUntrack(job)
        return
      }
      untrack([job.id])
      return
    }
    if (!applyPipeline(upsertPipeline(job, status))) return
    if (
      !linkedVersion(job.id) &&
      (orphanTargetedCopy(job) ||
        (status === 'saved' && resumeHasContent(loadResume() ?? emptyResume())))
    )
      prepareTargetedCopy(job)
  }

  const targetResume = (
    job: JobListing,
    intent: 'target' | 'cover' | 'keywords' | 'interview'
  ) => {
    if (intent === 'interview') {
      openInterviewPrep(job)
      return
    }
    if (intent !== 'cover') {
      const dest = intent === 'keywords' ? '/builder?jump=target' : '/builder'
      if (
        !linkedVersion(job.id) &&
        !orphanTargetedCopy(job) &&
        !resumeHasContent(loadResume() ?? emptyResume())
      ) {
        const draft = loadResume() ?? emptyResume()
        const next = {
          ...draft,
          targetRole: job.title,
          targetCompany: job.company,
          jobDescription: job.description,
        }
        saveResume(next)
        syncActiveVersion(next)
        void navigate(dest)
        return
      }
      const version = linkedVersion(job.id) ?? prepareTargetedCopy(job)
      if (!version) return
      saveResume(version.data)
      setActiveVersionId(version.id)
      void navigate(dest)
      return
    }
    const draft = loadResume() ?? emptyResume()
    const version =
      targetedCopyOf(job) ?? (resumeHasContent(draft) ? prepareTargetedCopy(job) : null)
    if (version) {
      saveResume(version.data)
      setActiveVersionId(version.id)
    } else if (!resumeHasContent(draft)) {
      const next = {
        ...draft,
        targetRole: job.title,
        targetCompany: job.company,
        jobDescription: job.description,
      }
      saveResume(next)
      syncActiveVersion(next)
    } else return
    if (
      !listPipeline().some((e) => e.job.id === job.id) &&
      !applyPipeline(upsertPipeline(job, 'saved'))
    )
      return
    if (
      version &&
      !linkedVersion(job.id) &&
      !applyPipeline(setPipelineVersion(job.id, version.id))
    )
      return
    void navigate(
      `/builder?doc=cover&company=${encodeURIComponent(job.company)}&job=${encodeURIComponent(job.id)}`
    )
  }

  /** Open the job's targeted copy (or aim the draft at the job) and open interview prep. */
  const openInterviewPrep = (job: JobListing) => {
    const draft = loadResume() ?? emptyResume()
    const version =
      targetedCopyOf(job) ?? (resumeHasContent(draft) ? prepareTargetedCopy(job) : null)
    if (version) {
      saveResume(version.data)
      setActiveVersionId(version.id)
      if (!linkedVersion(job.id) && listPipeline().some((e) => e.job.id === job.id))
        applyPipeline(setPipelineVersion(job.id, version.id))
    } else if (!resumeHasContent(draft)) {
      const next = {
        ...draft,
        targetRole: job.title,
        targetCompany: job.company,
        jobDescription: job.description,
      }
      saveResume(next)
      syncActiveVersion(next)
    }
    void navigate(`/builder?doc=interview&job=${encodeURIComponent(job.id)}`)
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
        onClick: () =>
          void navigate(`/builder?doc=resignation&job=${encodeURIComponent(job.id)}`),
      }
    if (entry.status === 'applied' || entry.status === 'interviewing')
      return {
        text:
          entry.status === 'applied'
            ? 'Prepare for the interview while the application is fresh.'
            : 'Practice interview questions before the next round.',
        label: 'Open interview prep',
        onClick: () =>
          draftAtRisk(job)
            ? setConfirmTarget({ job, intent: 'interview' })
            : openInterviewPrep(job),
      }
    if (!linkedVersion(job.id)) {
      const orphan = orphanTargetedCopy(job)
      if (orphan)
        return {
          text: `Reconnect the copy you already targeted at this job — “${orphan.name}”.`,
          label: 'Reconnect targeted copy',
          onClick: () => setConfirmTarget({ job, intent: 'target' }),
        }
      return {
        text: 'Create a resume targeted at this job.',
        label: 'Target my resume',
        onClick: () => setConfirmTarget({ job, intent: 'target' }),
      }
    }
    const match = tailoredMatchOf.get(job.id)
    if (match !== undefined && match < 80)
      return {
        text:
          match === 0
            ? "Your targeted copy doesn't use any of this job's keywords yet — open it and add a few."
            : `Improve your targeted copy — ${match}% keyword match.`,
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
            <Link to="/dashboard">My resumes</Link>
          </Button>
        }
      />
      <main id="main" tabIndex={-1} className="mx-auto flex w-full max-w-6xl flex-1 items-start gap-8 px-4 py-8">
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

        {pipelineUnreadable && (
          <div
            role="alert"
            className="border-destructive/50 bg-destructive/10 mt-4 flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
          >
            <span>
              Your application pipeline couldn&apos;t be read, so tracking started fresh.
              The unreadable copy was kept in your browser storage as a backup.
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPipelineUnreadable(false)}
            >
              Dismiss
            </Button>
          </div>
        )}

        {linkedJobNotice && linkedJob && selectedId === linkedJob.id && (
          <div
            role="status"
            className="border-primary/40 bg-primary/10 mt-4 flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
          >
            <span>
              Showing {linkedJob.title} at {linkedJob.company} from your link — it doesn&apos;t
              match your current search.
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setLinkedJobNotice(false)}
            >
              Dismiss
            </Button>
          </div>
        )}

        {jobLinkNotFound && (
          <div
            role="alert"
            className="border-destructive/50 bg-destructive/10 mt-4 flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
          >
            <span>The job in that link wasn&apos;t found — it may have expired or been removed.</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setJobLinkNotFound(false)}
            >
              Dismiss
            </Button>
          </div>
        )}

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
            {[86, 70, 89, 78, 86, 100, 77, 94].map((w, i) => (
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
            <input
              type="search"
              value={trackedFilter}
              onChange={(e) => setTrackedFilter(e.target.value)}
              placeholder="Filter by title or company"
              aria-label="Filter tracked jobs by title or company"
              className="border-input bg-background min-h-10 w-52 rounded-md border px-3 py-1 text-xs sm:min-h-8"
            />
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
            {bulkMode && visibleBulkIds.size > 0 && (
              <>
                <span className="text-muted-foreground text-xs font-medium">
                  {visibleBulkIds.size} selected
                </span>
                <select
                  value=""
                  onChange={(e) => {
                    const status = e.target.value as JobStatus
                    if (!status) return
                    if (!applyPipeline(updateStatuses([...visibleBulkIds], status))) return
                    setBulkIds((prev) => new Set([...prev].filter((id) => !visibleBulkIds.has(id))))
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
                  Untrack {visibleBulkIds.size}
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
            {tab === 'all' && !error && (
              <p
                role="status"
                className="text-muted-foreground border-b px-4 py-1.5 text-xs font-medium"
              >
                {loading
                  ? 'Loading jobs…'
                  : `${shown.length} ${shown.length === 1 ? 'job' : 'jobs'} found`}
              </p>
            )}
            {loading ? (
              <div aria-busy="true" className="animate-pulse">
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
            ) : error && tab === 'all' ? (
              <div
                role="alert"
                className="border-destructive/50 bg-destructive/10 m-4 rounded-md border p-4 text-sm"
              >
                <p>{error}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => runSearch(query)}
                >
                  Try again
                </Button>
              </div>
            ) : shown.length === 0 ? (
              tab === 'all' &&
              (query.trim() || category || locationFilter || typeFilter || skillsFilter) ? (
                <div className="p-4 text-sm">
                  <p className="text-muted-foreground">
                    No jobs found — try another search term.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => {
                      setQuery('')
                      setCategory('')
                      setLocationFilter('')
                      setTypeFilter('')
                      setSkillsFilter('')
                      runSearch('', '')
                    }}
                  >
                    Clear search & filters
                  </Button>
                </div>
              ) : tab === 'tracked' && trackedFilter.trim() ? (
                <div className="p-4 text-sm">
                  <p className="text-muted-foreground">
                    No tracked jobs match &ldquo;{trackedFilter.trim()}&rdquo;.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => setTrackedFilter('')}
                  >
                    Clear filter
                  </Button>
                </div>
              ) : (
              <p className="text-muted-foreground p-4 text-sm">
                {tab === 'all'
                  ? 'No jobs found — try another search term.'
                  : tab === 'tracked'
                    ? followUpOnly
                      ? 'No applications need a follow-up right now.'
                      : 'Nothing tracked yet — use the status buttons on a job to track it.'
                    : `Nothing ${JOB_STATUS_LABELS[tab].toLowerCase()} yet — use the status buttons on a job to track it.`}
              </p>
              )
            ) : (
              <ul>
                {shown.map((j, i) => {
                  const status = statusOf.get(j.id)
                  const updated = statusChangedAtOf.get(j.id)
                  return (
                    <li key={j.id} className="border-b last:border-b-0">
                      {i === anywhereStart && (
                        <p className="bg-muted/60 text-muted-foreground border-b px-4 py-1.5 text-xs font-medium">
                          Open to any location ({sortedAnywhere.length})
                        </p>
                      )}
                      {tab === 'tracked' && status && status !== statusOf.get(shown[i - 1]?.id ?? '') && (
                        <p className="bg-muted/60 text-muted-foreground border-b px-4 py-1.5 text-xs font-medium">
                          {JOB_STATUS_LABELS[status]} ({shownCounts[status]})
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
                            explicitSelection.current = true
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
                                  {entry?.remindOn !== undefined && !due && (
                                    <span className="text-muted-foreground ml-2 rounded-full border px-1.5 py-0.5 text-[11px] font-medium">
                                      Follow-up {shortDay(entry.remindOn)}
                                    </span>
                                  )}
                                  {entry?.followedUpAt !== undefined &&
                                    stale === null &&
                                    !due &&
                                    entry.followedUpAt >
                                      timelineOf(entry)[timelineOf(entry).length - 1].at && (
                                      <span className="text-muted-foreground ml-2 rounded-full border px-1.5 py-0.5 text-[11px] font-medium">
                                        Followed up {shortDate(entry.followedUpAt)}
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
                {!selectedReport && !resumeText.trim() && !tailoredMatchOf.has(selected.id) && (
                  <p className="text-muted-foreground mt-2 text-xs">
                    <Link
                      to="/builder"
                      className="text-primary font-medium underline-offset-2 hover:underline"
                    >
                      Add your resume
                    </Link>{' '}
                    to see how it matches this job&apos;s keywords.
                  </p>
                )}
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
                                {(reportKwExpandedId === selected.id
                                  ? selectedReport.highPriorityMissing
                                  : selectedReport.highPriorityMissing.slice(0, 10)
                                ).map((kw) => (
                                  <span
                                    key={kw}
                                    className="rounded-full bg-amber-100 px-1.5 py-0.5 text-amber-800 dark:bg-amber-950"
                                  >
                                    {kw}
                                  </span>
                                ))}
                                {selectedReport.highPriorityMissing.length > 10 &&
                                  reportKwExpandedId !== selected.id && (
                                    <button
                                      type="button"
                                      onClick={() => setReportKwExpandedId(selected.id)}
                                      className="text-primary underline-offset-2 hover:underline"
                                    >
                                      +{selectedReport.highPriorityMissing.length - 10} more
                                    </button>
                                  )}
                              </div>
                            )}
                            {selectedReport.missing.length >
                              selectedReport.highPriorityMissing.length && (
                              <div className="mt-1.5 flex flex-wrap items-center gap-1">
                                <span className="text-muted-foreground font-medium">
                                  Also missing:
                                </span>
                                {(reportKwExpandedId === selected.id
                                  ? selectedReport.missing.filter(
                                      (kw) => !selectedReport.highPriorityMissing.includes(kw)
                                    )
                                  : selectedReport.missing
                                      .filter(
                                        (kw) => !selectedReport.highPriorityMissing.includes(kw)
                                      )
                                      .slice(0, 10)
                                ).map((kw) => (
                                    <span
                                      key={kw}
                                      className="bg-muted text-muted-foreground rounded-full px-1.5 py-0.5"
                                    >
                                      {kw}
                                    </span>
                                  ))}
                                {selectedReport.missing.length -
                                  selectedReport.highPriorityMissing.length >
                                  10 &&
                                  reportKwExpandedId !== selected.id && (
                                    <button
                                      type="button"
                                      onClick={() => setReportKwExpandedId(selected.id)}
                                      className="text-primary underline-offset-2 hover:underline"
                                    >
                                      +
                                      {selectedReport.missing.length -
                                        selectedReport.highPriorityMissing.length -
                                        10}{' '}
                                      more
                                    </button>
                                  )}
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => setConfirmTarget({ job: selected, intent: 'keywords' })}
                              className="text-primary mt-1.5 block font-medium underline-offset-2 hover:underline"
                            >
                              Add these keywords in the editor →
                            </button>
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
                    {linkedVersion(selected.id)
                      ? 'Open targeted resume'
                      : orphanTargetedCopy(selected)
                        ? 'Reconnect targeted copy'
                        : 'Target my resume'}
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
                        if (!coverDoc) return earlierDocRows(entry, 'cover', false)
                        return (
                          <>
                            <p className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                              <span className="text-muted-foreground">Cover letter:</span>
                              <span className="font-medium">{coverDoc.title}</span>
                              {countLetterPlaceholders(coverDoc.text) > 0 && (
                                <span className="text-amber-700 dark:text-amber-400">
                                  {countLetterPlaceholders(coverDoc.text)} to fill
                                </span>
                              )}
                              <button
                                type="button"
                                className="text-primary underline-offset-2 hover:underline"
                                onClick={() => void navigate(`/documents?doc=${coverDoc.id}`)}
                              >
                                Open
                              </button>
                            </p>
                            {earlierDocRows(entry, 'cover', true)}
                          </>
                        )
                      })()}
                      {(() => {
                        const resignationDoc = entry.resignationDocId
                          ? listCareerDocs().find((d) => d.id === entry.resignationDocId)
                          : undefined
                        if (!resignationDoc) return earlierDocRows(entry, 'resignation', false)
                        return (
                          <>
                            <p className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                              <span className="text-muted-foreground">Resignation letter:</span>
                              <span className="font-medium">{resignationDoc.title}</span>
                              {countLetterPlaceholders(resignationDoc.text) > 0 && (
                                <span className="text-amber-700 dark:text-amber-400">
                                  {countLetterPlaceholders(resignationDoc.text)} to fill
                                </span>
                              )}
                              <button
                                type="button"
                                className="text-primary underline-offset-2 hover:underline"
                                onClick={() => void navigate(`/documents?doc=${resignationDoc.id}`)}
                              >
                                Open
                              </button>
                            </p>
                            {earlierDocRows(entry, 'resignation', true)}
                          </>
                        )
                      })()}
                      {(() => {
                        const prepDoc = entry.interviewDocId
                          ? listCareerDocs().find((d) => d.id === entry.interviewDocId)
                          : undefined
                        if (!prepDoc) return earlierDocRows(entry, 'interview', false)
                        return (
                          <>
                            <p className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                              <span className="text-muted-foreground">Interview prep:</span>
                              <span className="font-medium">{prepDoc.title}</span>
                              <button
                                type="button"
                                className="text-primary underline-offset-2 hover:underline"
                                onClick={() => void navigate(`/documents?doc=${prepDoc.id}`)}
                              >
                                Open
                              </button>
                            </p>
                            {earlierDocRows(entry, 'interview', true)}
                          </>
                        )
                      })()}
                      <p className="text-sm font-medium">Application timeline</p>
                      <ol className="mt-1.5 flex flex-wrap items-center gap-y-1 text-xs">
                        {(() => {
                          const events = [
                            ...steps.map((s) => ({
                              label: JOB_STATUS_LABELS[s.status],
                              at: s.at,
                            })),
                            ...(entry.followedUpAt !== undefined
                              ? [{ label: 'Followed up', at: entry.followedUpAt }]
                              : []),
                          ].sort((a, b) => a.at - b.at)
                          return events.map((ev, i) => (
                            <li key={`${ev.label}-${ev.at}`} className="flex items-center">
                              {i > 0 && (
                                <span aria-hidden className="text-muted-foreground mx-1.5">
                                  →
                                </span>
                              )}
                              <span
                                className={
                                  i === events.length - 1
                                    ? 'bg-primary/10 text-primary rounded-full px-2 py-0.5 font-medium'
                                    : 'text-muted-foreground'
                                }
                              >
                                {ev.label} · {shortDate(ev.at)}
                              </span>
                            </li>
                          ))
                        })()}
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
                                  setFollowUpDraft({
                                    jobId: entry.job.id,
                                    ...followUpEmail(entry, loadResume()?.contact.fullName),
                                  })
                                }}
                              >
                                {entry.status === 'offer'
                                  ? 'Draft thank-you email'
                                  : 'Draft follow-up email'}
                              </button>
                              <button
                                type="button"
                                className="min-h-8 rounded-md border px-2 py-0.5 text-xs font-medium transition hover:border-muted-foreground/40"
                                onClick={() => applyPipeline(markFollowedUp(entry.job.id))}
                              >
                                Mark as followed up
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
                            applyPipeline(
                              setPipelineReminder(selected.id, e.target.value || null)
                            )
                          }
                          className="border-input bg-background min-h-8 rounded-md border px-2.5 py-1 text-sm"
                        />
                        {entry.remindOn !== undefined && (
                          <button
                            type="button"
                            className="min-h-8 rounded-md border px-2 py-0.5 text-xs font-medium transition hover:border-muted-foreground/40"
                            onClick={() => applyPipeline(setPipelineReminder(selected.id, null))}
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
                          if (!applyPipeline(setPipelineNotes(selected.id, notesDraft.text)))
                            return
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
                  {selected.descriptionTruncated && (
                    <p className="text-muted-foreground mt-4 text-sm">
                      Description shortened —{' '}
                      <a
                        href={selected.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-foreground underline underline-offset-2"
                      >
                        read the full posting on the original site
                        <ExternalLink className="ml-1 inline size-3.5 align-[-2px]" />
                      </a>
                    </p>
                  )}
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
                : confirmTarget?.intent === 'interview'
                  ? `Open interview prep for "${confirmTarget.job.title}"?`
                  : `Open a resume targeted at "${confirmTarget?.job.title}"?`}
            </DialogTitle>
            <DialogDescription>
              {confirmTarget &&
                (confirmTarget.intent === 'cover' || confirmTarget.intent === 'interview') &&
                (() => {
                  const doc = linkedDoc(confirmTarget.job.id, confirmTarget.intent)
                  if (!doc) return null
                  const noun = confirmTarget.intent === 'cover' ? 'cover letter' : 'interview brief'
                  return `This job already has the saved ${noun} “${doc.title}” — a ${confirmTarget.intent === 'cover' ? 'letter' : 'brief'} you save from the tool becomes its ${noun} instead; the current one stays in your documents. `
                })()}
              {confirmTarget?.intent === 'interview'
                ? linkedVersion(confirmTarget.job.id)
                  ? 'This opens the resume copy targeted at this job in the editor, then opens interview prep for it.'
                  : 'This opens the resume copy you already targeted at this job in the editor and links it to this job again, then opens interview prep for it.'
                : confirmTarget?.intent === 'cover'
                ? confirmTarget && linkedVersion(confirmTarget.job.id)
                  ? 'This opens the resume copy targeted at this job in the editor, then opens the cover letter tool pre-filled for this company. Your other resumes keep their own target jobs.'
                  : confirmTarget && orphanTargetedCopy(confirmTarget.job)
                    ? 'This opens the resume copy you already targeted at this job in the editor and links it to this job again, then opens the cover letter tool pre-filled for this company. Your other resumes keep their own target jobs.'
                    : confirmTarget && resumeHasContent(loadResume() ?? emptyResume())
                      ? 'This saves a copy of your resume targeted at this posting (filed under “Job applications” on your dashboard), opens it in the editor, then opens the cover letter tool pre-filled for this company. Your other resumes keep their own target jobs.'
                      : "This sets the job title and description on your current draft so the ATS score and AI tailoring in the editor aim at this posting, then opens the cover letter tool pre-filled for this company. It replaces the draft's current target job, if any. The job is saved to your tracked applications so the letter stays linked to it."
                : confirmTarget && linkedVersion(confirmTarget.job.id)
                  ? 'This job already has a targeted copy of your resume — the editor opens that copy. Your other resumes keep their own target jobs.'
                  : confirmTarget && orphanTargetedCopy(confirmTarget.job)
                    ? 'You already saved a copy of your resume targeted at this job — the editor opens that copy and links it to this job again. Your other resumes keep their own target jobs.'
                    : confirmTarget && !resumeHasContent(loadResume() ?? emptyResume())
                    ? "Your resume is still empty, so there's nothing to copy yet. This aims your draft at this posting and opens the editor so you can start writing — target the job again once your resume has content to save a copy."
                    : 'This saves a copy of your resume targeted at this posting (filed under “Job applications” on your dashboard) and opens it in the editor. Your current draft keeps its own target job.'}
              {confirmTarget && draftAtRisk(confirmTarget.job)
                ? " Your current draft isn't saved as a copy, so opening that copy replaces it."
                : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setConfirmTarget(null)}>
              Cancel
            </Button>
            {confirmTarget &&
              (confirmTarget.intent === 'cover' || confirmTarget.intent === 'interview') &&
              (() => {
                const doc = linkedDoc(confirmTarget.job.id, confirmTarget.intent)
                if (!doc) return null
                return (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setConfirmTarget(null)
                      void navigate(`/documents?doc=${encodeURIComponent(doc.id)}`)
                    }}
                  >
                    {confirmTarget.intent === 'cover' ? 'Open saved letter' : 'Open saved brief'}
                  </Button>
                )
              })()}
            {confirmTarget && draftAtRisk(confirmTarget.job) && (
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  keepDraftAsCopy() && targetResume(confirmTarget.job, confirmTarget.intent)
                }
              >
                Save draft as copy, then open
              </Button>
            )}
            <Button
              type="button"
              onClick={() => confirmTarget && targetResume(confirmTarget.job, confirmTarget.intent)}
            >
              {confirmTarget?.intent === 'cover'
                ? 'Open cover letter tool'
                : confirmTarget?.intent === 'interview'
                  ? 'Open interview prep'
                  : confirmTarget && linkedVersion(confirmTarget.job.id)
                  ? 'Open targeted copy'
                  : confirmTarget && orphanTargetedCopy(confirmTarget.job)
                    ? 'Reconnect targeted copy'
                    : confirmTarget && !resumeHasContent(loadResume() ?? emptyResume())
                    ? 'Start my resume for this job'
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
                const docs = entry ? linkedDocCount(entry) : 0
                const copy = confirmUntrack ? linkedVersion(confirmUntrack.id) : undefined
                const parts = [
                  steps > 1 ? `its application timeline (${steps} status changes)` : '',
                  entry?.notes?.trim() ? 'your notes' : '',
                  docs > 0
                    ? `its link${docs > 1 ? 's' : ''} to ${docs} saved document${docs > 1 ? 's' : ''}`
                    : '',
                  copy ? `its link to the targeted copy "${copy.name}"` : '',
                ].filter(Boolean)
                const tail = copy
                  ? docs > 0
                    ? 'The copy and saved documents stay, but lose their link to this job; saving it again reconnects the copy.'
                    : 'The copy stays on your dashboard and reconnects if you save this job again.'
                  : 'Targeted resume copies and saved documents stay, but documents lose their link to this job.'
                return `This removes the job from your pipeline and deletes ${parts.join(', ')}. ${tail}`
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
                if (confirmUntrack && !untrack([confirmUntrack.id])) return
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
            {followUpDraft && (
              <Button
                type="button"
                variant="outline"
                className="min-h-10"
                onClick={() => {
                  applyPipeline(markFollowedUp(followUpDraft.jobId))
                  setFollowUpDraft(null)
                }}
              >
                Mark as followed up
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
            <DialogTitle>{`Stop tracking ${visibleBulkIds.size} job${visibleBulkIds.size === 1 ? '' : 's'}?`}</DialogTitle>
            <DialogDescription>
              {(() => {
                const selected = pipeline.filter((e) => visibleBulkIds.has(e.job.id))
                const docs = selected.reduce((n, e) => n + linkedDocCount(e), 0)
                const copies = selected.filter((e) => linkedVersion(e.job.id)).length
                const links = [
                  docs > 0
                    ? `their link${docs > 1 ? 's' : ''} to ${docs} saved document${docs > 1 ? 's' : ''}`
                    : '',
                  copies > 0
                    ? `their link${copies > 1 ? 's' : ''} to ${copies} targeted resume cop${copies > 1 ? 'ies' : 'y'}`
                    : '',
                ].filter(Boolean)
                const tail =
                  copies > 0
                    ? `${
                        docs > 0
                          ? 'Copies and saved documents stay on your dashboard, but lose their link'
                          : copies > 1
                            ? 'The copies stay on your dashboard, but lose their link'
                            : 'The copy stays on your dashboard, but loses its link'
                      } to these jobs; saving a job again reconnects its copy.`
                    : docs > 0
                      ? 'Targeted resume copies and saved documents stay, but documents lose their link to these jobs.'
                      : 'Targeted resume copies stay on your dashboard.'
                return `This removes the selected jobs from your pipeline and deletes their application timelines and notes${links.length > 0 ? `, plus ${links.join(' and ')}` : ''}. ${tail}`
              })()}
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
                if (!untrack([...visibleBulkIds])) return
                setBulkIds((prev) => new Set([...prev].filter((id) => !visibleBulkIds.has(id))))
                setConfirmBulkUntrack(false)
              }}
            >
              Stop tracking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bottom status bars stack so concurrent notices stay readable */}
      <div className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-center gap-2">
        {undoUntrack && (
          <div
            role="status"
            className="bg-background pointer-events-auto flex w-fit min-w-0 max-w-full items-center gap-3 rounded-lg border p-3 text-sm shadow-lg"
          >
            <span className="min-w-0 flex-1 truncate">
              {undoUntrack.length === 1
                ? `Stopped tracking "${undoUntrack[0].entry.job.title}"`
                : `Stopped tracking ${undoUntrack.length} jobs`}
            </span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                if (!applyPipeline(restorePipelineEntries(undoUntrack))) return
                setUndoUntrack(null)
              }}
            >
              <Undo2 className="size-4" />
              Undo
            </Button>
            <button
              type="button"
              aria-label="Dismiss"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => setUndoUntrack(null)}
            >
              <X className="size-4" />
            </button>
          </div>
        )}
        {storageError && (
          <div
            role="alert"
            className="bg-background pointer-events-auto flex w-fit max-w-full items-center gap-3 rounded-lg border p-3 text-sm shadow-lg"
          >
            <span className="text-destructive min-w-0">
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
      </div>
    </div>
  )
}
