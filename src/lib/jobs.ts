/**
 * Job search API helper plus the local application pipeline. Pipeline state
 * (saved / applied / interviewing / offer / rejected, including the job's JD text)
 * lives in localStorage only, like resumes and career documents.
 */

export interface JobListing {
  id: string
  title: string
  company: string
  /** Company logo URL (may be missing on entries saved before it existed) */
  logo?: string
  category: string
  type: string
  location: string
  postedAt: string
  salary: string
  url: string
  description: string
  /** Upstream skill tags (may be missing on entries saved before it existed) */
  tags?: string[]
}

export type JobStatus = 'saved' | 'applied' | 'interviewing' | 'offer' | 'rejected'

export const JOB_STATUSES: JobStatus[] = ['saved', 'applied', 'interviewing', 'offer', 'rejected']

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  saved: 'Saved',
  applied: 'Applied',
  interviewing: 'Interviewing',
  offer: 'Offer',
  rejected: 'Rejected',
}

/** One status change on an application, oldest first in the entry's history. */
export interface StatusChange {
  status: JobStatus
  at: number
}

export interface PipelineEntry {
  job: JobListing
  status: JobStatus
  updatedAt: number
  /** Saved resume copy targeted at this job, prepared when the job is saved */
  resumeVersionId?: string
  /** Saved cover letter written for this job (career document id) */
  coverDocId?: string
  /** Status changes in chronological order (entries saved before R190 have none) */
  history?: StatusChange[]
  /** Free-form notes: recruiter names, interview dates, follow-ups */
  notes?: string
  /** User-set follow-up reminder as a calendar day (yyyy-mm-dd, no timezone) */
  remindOn?: string
}

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/

/** ms epoch → yyyy-mm-dd in the user's local calendar. */
export function localDayOf(ms: number): string {
  const d = new Date(ms)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

/** The entry's status timeline, synthesizing one step for pre-history entries. */
export function timelineOf(entry: PipelineEntry): StatusChange[] {
  return entry.history && entry.history.length > 0
    ? entry.history
    : [{ status: entry.status, at: entry.updatedAt }]
}

/** Days since the last status change when a pending application has gone quiet (≥7d). */
export function staleDays(entry: PipelineEntry): number | null {
  if (entry.status !== 'applied' && entry.status !== 'interviewing') return null
  const steps = timelineOf(entry)
  const days = Math.floor((Date.now() - steps[steps.length - 1].at) / 86_400_000)
  return days >= 7 ? days : null
}

/** True when the entry's user-set follow-up reminder day has arrived (local calendar). */
export function reminderDue(entry: PipelineEntry): boolean {
  return entry.remindOn !== undefined && localDayOf(Date.now()) >= entry.remindOn
}

/** Tracked applications gone quiet for 7+ days or with a due follow-up reminder. */
export function attentionCount(pipeline: PipelineEntry[] = listPipeline()): number {
  return pipeline.filter((e) => staleDays(e) !== null || reminderDue(e)).length
}

/** Whole days since the entry's last status change, regardless of the stale threshold. */
export function daysSinceLastStep(entry: PipelineEntry): number {
  const steps = timelineOf(entry)
  return Math.max(0, Math.floor((Date.now() - steps[steps.length - 1].at) / 86_400_000))
}

/** Recruiter name written explicitly in the entry's notes ("Recruiter: Dana Smith"), if any. */
export function recruiterNameFromNotes(notes?: string): string | null {
  const m = notes?.match(
    /recruiters?(?:['\u2019]s)?(?:\s+name)?\s*(?:[:\-\u2013\u2014]|\bis\b)\s*([^\n,;.(]{2,60})/i
  )
  if (!m) return null
  const words = m[1].trim().split(/\s+/).slice(0, 3)
  return words.every((w) => /^[A-Z][A-Za-z'\u2019.-]*$/.test(w)) ? words.join(' ') : null
}

/** Deterministic follow-up (or offer thank-you) email draft for a tracked application. */
export function followUpEmail(
  entry: PipelineEntry,
  senderName?: string
): { subject: string; body: string } {
  const days = daysSinceLastStep(entry)
  const title = entry.job.title.trim()
  const company = entry.job.company.trim()
  const interviewing = entry.status === 'interviewing'
  const offer = entry.status === 'offer'
  const subject = offer
    ? `Thank you for the ${title} offer at ${company}`
    : interviewing
      ? `Following up on my ${title} interview at ${company}`
      : `Following up on my ${title} application at ${company}`
  const steps = timelineOf(entry)
  const spokeOn = new Date(steps[steps.length - 1].at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
  const when = days === 0 ? 'today' : days === 1 ? 'yesterday' : `${days} days ago`
  const opener = offer
    ? `Thank you again for the offer for the ${title} position. I wanted to follow up on the next steps and the timeline for my decision.`
    : interviewing
      ? days < 2
        ? `We spoke about the ${title} position on ${spokeOn}, and I wanted to follow up on where things stand.`
        : `It has been ${days} days since we last spoke about the ${title} position on ${spokeOn}, and I wanted to follow up on where things stand.`
      : `I applied for the ${title} position ${when} and wanted to follow up on the status of my application.`
  const recruiter = recruiterNameFromNotes(entry.notes)
  const body = [
    recruiter ? `Hi ${recruiter.split(' ')[0]},` : `Hi ${company} hiring team,`,
    '',
    opener,
    '',
    offer
      ? 'I am very excited about the opportunity and would be glad to discuss any remaining details.'
      : entry.resumeVersionId
        ? 'I remain very interested in the role — my resume was tailored specifically to this position, and I would be glad to share an updated copy or any additional information that would be helpful.'
        : 'I remain very interested in the role and would be glad to share any additional information that would be helpful.',
    '',
    'Thank you for your time and consideration.',
    '',
    'Best regards,',
    senderName?.trim() || '[Your name]',
  ].join('\n')
  return { subject, body }
}

/** A posting anyone can apply to regardless of where they live. */
export function isLocationAgnostic(location: string): boolean {
  const l = location.trim().toLowerCase()
  return l === '' || l === 'remote' || /\b(worldwide|anywhere|global)\b/.test(l)
}

/**
 * Distinct candidate locations across listings with posting counts, most
 * common first (ties alphabetical). Location-agnostic postings are skipped —
 * they match any location filter anyway.
 */
export function locationFacets(
  locations: readonly string[],
  cap = 8
): { label: string; count: number }[] {
  const byKey = new Map<string, { label: string; count: number }>()
  for (const raw of locations) {
    const label = raw.trim()
    if (isLocationAgnostic(label)) continue
    const key = label.toLowerCase()
    const entry = byKey.get(key)
    if (entry) entry.count++
    else byKey.set(key, { label, count: 1 })
  }
  return [...byKey.values()]
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, cap)
}

const PIPELINE_KEY = 'honestcv.jobPipeline'
const PIPELINE_BACKUP_KEY = 'honestcv.jobPipeline.unreadable'

/**
 * When the stored pipeline exists but cannot be read at all (corrupted JSON or
 * not an array), preserve the raw value under a backup key before any write
 * can overwrite it. Returns true when the stored pipeline is unreadable.
 */
export function stashUnreadablePipeline(): boolean {
  try {
    const raw = localStorage.getItem(PIPELINE_KEY)
    if (raw === null) return false
    try {
      if (Array.isArray(JSON.parse(raw))) return false
    } catch {
      // fall through — raw is unreadable
    }
    if (localStorage.getItem(PIPELINE_BACKUP_KEY) === null) {
      localStorage.setItem(PIPELINE_BACKUP_KEY, raw)
    }
    return true
  } catch {
    return false
  }
}

/** Category slugs accepted by the jobs API (Remotive's fixed list). */
export const JOB_CATEGORIES: [slug: string, label: string][] = [
  ['software-dev', 'Software Development'],
  ['customer-support', 'Customer Service'],
  ['design', 'Design'],
  ['marketing', 'Marketing'],
  ['sales-business', 'Sales / Business'],
  ['product', 'Product'],
  ['project-management', 'Project Management'],
  ['data', 'Data Analysis'],
  ['devops', 'DevOps / Sysadmin'],
  ['finance-legal', 'Finance / Legal'],
  ['hr', 'Human Resources'],
  ['qa', 'QA'],
  ['writing', 'Writing'],
  ['all-others', 'All others'],
]

export async function searchJobs(q: string, category = ''): Promise<JobListing[]> {
  const params = new URLSearchParams({ q })
  if (category) params.set('category', category)
  let res: Response
  try {
    res = await fetch(`/api/jobs/search?${params}`)
  } catch {
    throw new Error('Loading jobs failed — check your connection and try again.')
  }
  const data = (await res.json().catch(() => ({}))) as {
    jobs?: JobListing[]
    error?: string
  }
  if (!res.ok) throw new Error(data.error || `Job search failed (${res.status})`)
  // Upstream company/title strings can carry stray whitespace (e.g. Remotive)
  return (data.jobs ?? []).map((j) => ({
    ...j,
    title: (j.title ?? '').trim(),
    company: (j.company ?? '').trim(),
  }))
}

/** One section of a structured job description; `heading: null` for the preamble. */
export interface JobDescriptionSection {
  heading: string | null
  body: string
}

const HEADING_KEYWORD =
  /^(about|overview|summary|responsibilit|duties|requirements?|qualifications?|skills?|experience|benefits?|perks?|compensation|salary|what|who|why|nice|preferred|bonus|how|your|our|the role|key|location|equal)/i

/** True when a description line reads like a section heading rather than content. */
function isHeadingLine(line: string): boolean {
  if (!line || line.startsWith('•') || /^\d/.test(line) || line.length > 60) return false
  const words = line.split(/\s+/).length
  if (line.endsWith(':')) return words <= 8
  return words <= 5 && HEADING_KEYWORD.test(line) && !/[.!?,;:]$/.test(line)
}

/**
 * Split a plain-text job description into labelled sections using heading-like
 * lines (short, colon-terminated or keyword-led). Returns a single unlabelled
 * section when no headings are found.
 */
export function structureJobDescription(description: string): JobDescriptionSection[] {
  const sections: JobDescriptionSection[] = []
  let heading: string | null = null
  let lines: string[] = []
  const push = () => {
    const body = lines.join('\n').trim()
    if (body || heading !== null) sections.push({ heading, body })
  }
  for (const raw of description.split('\n')) {
    const line = raw.trim()
    if (isHeadingLine(line)) {
      push()
      heading = line.replace(/\s*:$/, '')
      lines = []
    } else {
      lines.push(raw)
    }
  }
  push()
  return sections.length > 0 ? sections : [{ heading: null, body: description }]
}

const asStr = (v: unknown): string => (typeof v === 'string' ? v : '')

/** Coerce one stored pipeline entry to the schema; null when irrecoverable. */
function sanitizeEntry(raw: unknown): PipelineEntry | null {
  if (typeof raw !== 'object' || raw === null) return null
  const e = raw as Record<string, unknown>
  if (typeof e.job !== 'object' || e.job === null) return null
  const j = e.job as Record<string, unknown>
  const title = asStr(j.title).trim()
  const company = asStr(j.company).trim()
  const id = asStr(j.id) || (title ? `${title} @ ${company}` : '')
  if (!id) return null
  const job: JobListing = {
    id,
    title,
    company,
    category: asStr(j.category),
    type: asStr(j.type),
    location: asStr(j.location),
    postedAt: asStr(j.postedAt),
    salary: asStr(j.salary),
    url: asStr(j.url),
    description: asStr(j.description),
  }
  if (typeof j.logo === 'string') job.logo = j.logo
  if (Array.isArray(j.tags)) job.tags = j.tags.filter((t): t is string => typeof t === 'string')
  const status = JOB_STATUSES.includes(e.status as JobStatus)
    ? (e.status as JobStatus)
    : 'saved'
  const updatedAt =
    typeof e.updatedAt === 'number' && Number.isFinite(e.updatedAt) ? e.updatedAt : Date.now()
  const entry: PipelineEntry = { job, status, updatedAt }
  if (Array.isArray(e.history)) {
    const steps = e.history.filter(
      (s): s is StatusChange =>
        typeof s === 'object' &&
        s !== null &&
        JOB_STATUSES.includes((s as StatusChange).status) &&
        typeof (s as StatusChange).at === 'number' &&
        Number.isFinite((s as StatusChange).at)
    )
    if (steps.length > 0) entry.history = steps
  }
  if (typeof e.resumeVersionId === 'string') entry.resumeVersionId = e.resumeVersionId
  if (typeof e.coverDocId === 'string') entry.coverDocId = e.coverDocId
  if (typeof e.notes === 'string') entry.notes = e.notes
  if (typeof e.remindOn === 'string' && DAY_RE.test(e.remindOn)) entry.remindOn = e.remindOn
  // Entries saved before reminders became calendar days stored a local-midnight epoch
  else if (typeof e.remindAt === 'number' && Number.isFinite(e.remindAt))
    entry.remindOn = localDayOf(e.remindAt)
  return entry
}

export function listPipeline(): PipelineEntry[] {
  try {
    const raw = localStorage.getItem(PIPELINE_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    if (!Array.isArray(parsed)) return []
    return parsed.flatMap((e) => {
      const entry = sanitizeEntry(e)
      return entry ? [entry] : []
    })
  } catch {
    return []
  }
}

/** Returns null when nothing was written (storage full / private mode). */
function savePipeline(entries: PipelineEntry[]): PipelineEntry[] | null {
  try {
    stashUnreadablePipeline()
    localStorage.setItem(PIPELINE_KEY, JSON.stringify(entries))
    return entries
  } catch {
    return null
  }
}

export function upsertPipeline(job: JobListing, status: JobStatus): PipelineEntry[] | null {
  const all = listPipeline()
  const prev = all.find((e) => e.job.id === job.id)
  const rest = all.filter((e) => e.job.id !== job.id)
  const now = Date.now()
  const base: StatusChange[] = prev ? timelineOf(prev) : []
  const history =
    base.length > 0 && base[base.length - 1].status === status
      ? base
      : [...base, { status, at: now }]
  return savePipeline([
    {
      job,
      status,
      updatedAt: now,
      history,
      ...(prev?.resumeVersionId ? { resumeVersionId: prev.resumeVersionId } : {}),
      ...(prev?.coverDocId ? { coverDocId: prev.coverDocId } : {}),
      ...(prev?.notes ? { notes: prev.notes } : {}),
      ...(prev?.remindOn !== undefined ? { remindOn: prev.remindOn } : {}),
    },
    ...rest,
  ])
}

/** Move several tracked jobs to a status in one write, appending to each timeline. */
export function updateStatuses(
  ids: readonly string[],
  status: JobStatus
): PipelineEntry[] | null {
  const set = new Set(ids)
  const now = Date.now()
  return savePipeline(
    listPipeline().map((e) => {
      if (!set.has(e.job.id) || e.status === status) return e
      return { ...e, status, updatedAt: now, history: [...timelineOf(e), { status, at: now }] }
    })
  )
}

/** Untrack several jobs in one write. */
export function removeManyFromPipeline(ids: readonly string[]): PipelineEntry[] | null {
  const set = new Set(ids)
  return savePipeline(listPipeline().filter((e) => !set.has(e.job.id)))
}

/** Save free-form notes on the pipeline entry for a job. */
export function setPipelineNotes(jobId: string, notes: string): PipelineEntry[] | null {
  return savePipeline(
    listPipeline().map((e) =>
      e.job.id === jobId ? { ...e, notes: notes.trim() ? notes : undefined } : e
    )
  )
}

/** Set or clear (null) the follow-up reminder day (yyyy-mm-dd) on the entry for a job. */
export function setPipelineReminder(
  jobId: string,
  remindOn: string | null
): PipelineEntry[] | null {
  const day = remindOn !== null && DAY_RE.test(remindOn) ? remindOn : undefined
  return savePipeline(
    listPipeline().map((e) => (e.job.id === jobId ? { ...e, remindOn: day } : e))
  )
}

/** Link the pipeline entry for a job to the cover letter written for it. */
export function setPipelineCoverDoc(jobId: string, coverDocId: string): PipelineEntry[] | null {
  return savePipeline(
    listPipeline().map((e) => (e.job.id === jobId ? { ...e, coverDocId } : e))
  )
}

/** Link the pipeline entry for a job to its targeted resume copy. */
export function setPipelineVersion(
  jobId: string,
  resumeVersionId: string
): PipelineEntry[] | null {
  return savePipeline(
    listPipeline().map((e) => (e.job.id === jobId ? { ...e, resumeVersionId } : e))
  )
}

export function removeFromPipeline(id: string): PipelineEntry[] | null {
  return savePipeline(listPipeline().filter((e) => e.job.id !== id))
}
