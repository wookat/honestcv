/**
 * Job search API helper plus the local application pipeline. Pipeline state
 * (saved / applied / interviewing / offer / rejected, including the job's JD text)
 * lives in localStorage only, like resumes and career documents.
 */

import { latestDocsFor } from '@/lib/documents'
import { jobTitleRank, parseJobQuery } from '../../worker/jobQuery'
import {
  rememberVersionJobs,
  setVersionJob,
  type ResumeVersion,
  type VersionJobRef,
} from '@/lib/resume'

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
  /** True when the description was cut to the server-side length cap */
  descriptionTruncated?: boolean
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
  /** Saved interview prep brief written for this job (career document id) */
  interviewDocId?: string
  /** Saved resignation letter written when this job reached the offer stage (career document id) */
  resignationDocId?: string
  /** Status changes in chronological order (entries saved before R190 have none) */
  history?: StatusChange[]
  /** Free-form notes: recruiter names, interview dates, follow-ups */
  notes?: string
  /** User-set follow-up reminder as a calendar day (yyyy-mm-dd, no timezone) */
  remindOn?: string
  /** When the user last marked this application as followed up (ms epoch) */
  followedUpAt?: number
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
  const last = Math.max(steps[steps.length - 1].at, entry.followedUpAt ?? 0)
  const days = Math.floor((Date.now() - last) / 86_400_000)
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
  const followedUpOn =
    entry.followedUpAt !== undefined && entry.followedUpAt > steps[steps.length - 1].at
      ? new Date(entry.followedUpAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : null
  const opener = offer
    ? `Thank you again for the offer for the ${title} position. I wanted to follow up on the next steps and the timeline for my decision.`
    : interviewing
      ? followedUpOn
        ? `We last spoke about the ${title} position on ${spokeOn} and I followed up on ${followedUpOn}; I wanted to check in again on where things stand.`
        : days < 2
          ? `We spoke about the ${title} position on ${spokeOn}, and I wanted to follow up on where things stand.`
          : `It has been ${days} days since we last spoke about the ${title} position on ${spokeOn}, and I wanted to follow up on where things stand.`
      : followedUpOn
        ? `I applied for the ${title} position ${when} and followed up on ${followedUpOn}; I wanted to check in again on the status of my application.`
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
 * Country → the names the feeds use for it (Remotive/Jobicy geo labels and the
 * city-board wording seen in Arbeitnow). Keys are the display labels.
 */
const COUNTRY_ALIASES: Record<string, string[]> = {
  UK: ['uk', 'united kingdom', 'great britain', 'britain', 'england', 'scotland', 'wales', 'royaume-uni'],
  USA: ['usa', 'united states', 'u.s.', 'us only', 'usa timezones'],
  Canada: ['canada'],
  France: ['france', 'île-de-france', 'ile-de-france', 'auvergne-rhône-alpes'],
  Germany: ['germany', 'deutschland', 'remote de'],
  Spain: ['spain', 'españa'],
  Netherlands: ['netherlands', 'the netherlands', 'holland'],
  Switzerland: ['switzerland', 'schweiz', 'suisse'],
  Ireland: ['ireland'],
  Italy: ['italy', 'italia'],
  Poland: ['poland', 'polska'],
  Portugal: ['portugal'],
  Sweden: ['sweden'],
  Norway: ['norway'],
  Austria: ['austria', 'österreich'],
  Czechia: ['czechia', 'czech republic'],
  Hungary: ['hungary'],
  Romania: ['romania'],
  Bulgaria: ['bulgaria'],
  Croatia: ['croatia'],
  Ukraine: ['ukraine'],
  Israel: ['israel'],
  UAE: ['uae', 'united arab emirates', 'dubai'],
  Mexico: ['mexico', 'méxico'],
  Brazil: ['brazil', 'brasil'],
  Argentina: ['argentina'],
  'Costa Rica': ['costa rica'],
  Australia: ['australia'],
  'New Zealand': ['new zealand'],
  Singapore: ['singapore'],
  Japan: ['japan'],
  'South Korea': ['south korea', 'korea'],
  China: ['china'],
  'Hong Kong': ['hong kong'],
  Philippines: ['philippines'],
  Thailand: ['thailand'],
  Vietnam: ['vietnam'],
  India: ['india'],
}

/** Regions a posting may name instead of a country — a candidate in the country still qualifies. */
const REGION_ALIASES: Record<string, string[]> = {
  Europe: ['europe', 'eu', 'european timezones', 'european union'],
  EMEA: ['emea'],
  Americas: ['americas', 'north america'],
  LATAM: ['latam', 'latin america', 'south america'],
  APAC: ['apac', 'asia', 'asia pacific', 'asia-pacific'],
}

const EUROPE = [
  'UK', 'France', 'Germany', 'Spain', 'Netherlands', 'Switzerland', 'Ireland', 'Italy', 'Poland',
  'Portugal', 'Sweden', 'Norway', 'Austria', 'Czechia', 'Hungary', 'Romania', 'Bulgaria', 'Croatia',
  'Ukraine',
]
const REGIONS_OF_COUNTRY: Record<string, string[]> = Object.fromEntries([
  ...EUROPE.map((c) => [c, ['Europe', 'EMEA']]),
  ['Israel', ['EMEA']],
  ['UAE', ['EMEA']],
  ['USA', ['Americas']],
  ['Canada', ['Americas']],
  ...['Mexico', 'Brazil', 'Argentina', 'Costa Rica'].map((c) => [c, ['LATAM', 'Americas']]),
  ...[
    'Australia', 'New Zealand', 'Singapore', 'Japan', 'South Korea', 'China', 'Hong Kong',
    'Philippines', 'Thailand', 'Vietnam', 'India',
  ].map((c) => [c, ['APAC']]),
])

/** City → country, for the cities the feeds actually publish. */
const CITY_COUNTRY: Record<string, string> = {
  london: 'UK', londres: 'UK', 'greater london': 'UK', manchester: 'UK', bristol: 'UK',
  edinburgh: 'UK', cambridge: 'UK', leeds: 'UK', birmingham: 'UK', glasgow: 'UK', watford: 'UK',
  lincoln: 'UK', 'milton keynes': 'UK', oxford: 'UK', bath: 'UK', sheffield: 'UK', liverpool: 'UK',
  newcastle: 'UK', nottingham: 'UK', leicester: 'UK', cardiff: 'UK', belfast: 'UK', brighton: 'UK',
  reading: 'UK', southampton: 'UK', aberdeen: 'UK',
  paris: 'France', lyon: 'France', bordeaux: 'France', 'la défense': 'France', toulouse: 'France',
  nantes: 'France', lille: 'France', marseille: 'France',
  berlin: 'Germany', münchen: 'Germany', munich: 'Germany', hamburg: 'Germany', köln: 'Germany',
  cologne: 'Germany', frankfurt: 'Germany', 'frankfurt am main': 'Germany', stuttgart: 'Germany',
  karlsruhe: 'Germany', aachen: 'Germany', düsseldorf: 'Germany', leipzig: 'Germany',
  madrid: 'Spain', barcelona: 'Spain', amsterdam: 'Netherlands', zurich: 'Switzerland',
  zürich: 'Switzerland', geneva: 'Switzerland', dublin: 'Ireland', milan: 'Italy', rome: 'Italy',
  warsaw: 'Poland', lisbon: 'Portugal', stockholm: 'Sweden', vienna: 'Austria', prague: 'Czechia',
  budapest: 'Hungary', 'tel aviv': 'Israel', dubai: 'UAE',
  'new york': 'USA', nyc: 'USA', 'san francisco': 'USA', sf: 'USA', 'los angeles': 'USA',
  chicago: 'USA', boston: 'USA', seattle: 'USA', austin: 'USA', denver: 'USA', atlanta: 'USA',
  dallas: 'USA', houston: 'USA', miami: 'USA', washington: 'USA', 'washington dc': 'USA', dc: 'USA',
  philadelphia: 'USA', phoenix: 'USA', 'san diego': 'USA', minneapolis: 'USA', portland: 'USA',
  charlotte: 'USA', nashville: 'USA', detroit: 'USA', 'salt lake city': 'USA', pittsburgh: 'USA',
  raleigh: 'USA', 'san jose': 'USA', columbus: 'USA', indianapolis: 'USA', 'kansas city': 'USA',
  'st. louis': 'USA', 'st louis': 'USA', tampa: 'USA', orlando: 'USA', 'las vegas': 'USA',
  baltimore: 'USA', sacramento: 'USA', cincinnati: 'USA', cleveland: 'USA', milwaukee: 'USA',
  'san antonio': 'USA', toronto: 'Canada', vancouver: 'Canada', ottawa: 'Canada', calgary: 'Canada',
  montreal: 'Canada', 'mexico city': 'Mexico', 'são paulo': 'Brazil', 'sao paulo': 'Brazil',
  'buenos aires': 'Argentina', sydney: 'Australia', melbourne: 'Australia', tokyo: 'Japan',
  bangalore: 'India', bengaluru: 'India', mumbai: 'India', wien: 'Austria', praha: 'Czechia',
  lisboa: 'Portugal', milano: 'Italy', roma: 'Italy', 'genève': 'Switzerland',
}

/** Other spellings of a city the feeds use (Remotive publishes French city labels). */
const CITY_SYNONYMS: string[][] = [
  ['london', 'londres'],
  ['new york', 'nyc'],
  ['san francisco', 'sf'],
  ['washington', 'washington dc', 'dc'],
  ['munich', 'münchen'],
  ['cologne', 'köln'],
  ['zurich', 'zürich'],
  ['vienna', 'wien'],
  ['prague', 'praha'],
  ['lisbon', 'lisboa'],
  ['milan', 'milano'],
  ['rome', 'roma'],
  ['geneva', 'genève'],
]

const norm = (s: string) => s.trim().toLowerCase()
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
/** Word match, so `uk` / `eu` / `usa` never hit inside another word ("Ukraine"). */
const mentions = (haystack: string, term: string) =>
  new RegExp(`(^|[^a-z])${escapeRe(term)}(?![a-z])`).test(haystack)
/** What the user typed: a whole word, except that a longer prefix may still be mid-typing ("Lond"). */
const typedMatch = (haystack: string, term: string) =>
  term.length <= 3 ? mentions(haystack, term) : new RegExp(`(^|[^a-z])${escapeRe(term)}`).test(haystack)

const cityCountry = (p: string): string | null =>
  Object.hasOwn(CITY_COUNTRY, p) ? CITY_COUNTRY[p] : null

const countryOf = (place: string): string | null => {
  const p = norm(place)
  const viaCity = cityCountry(p)
  if (viaCity) return viaCity
  for (const [country, aliases] of Object.entries(COUNTRY_ALIASES)) {
    if (country.toLowerCase() === p || aliases.includes(p)) return country
  }
  return null
}

/**
 * Wider areas a posting may be open to that still include `place`: the
 * country when `place` is a city, then the regions containing that country
 * ("London" → ["UK", "Europe", "EMEA"]; "UK" → ["Europe", "EMEA"]; "Europe" → []).
 */
export function widerAreasOf(place: string): string[] {
  const country = countryOf(place)
  if (!country) return []
  const isCity = cityCountry(norm(place)) !== null
  return [...(isCity ? [country] : []), ...(REGIONS_OF_COUNTRY[country] ?? [])]
}

/**
 * Whether the filter names a place whose country / region the tiers know, so
 * "wider" rows can exist for it. Unknown places ("Atlantis", a small town)
 * only ever match postings that spell them out.
 */
export function isKnownPlace(place: string): boolean {
  const p = norm(place)
  if (!p) return false
  if (countryOf(p)) return true
  return Object.values(REGION_ALIASES).some((aliases) => aliases.includes(p))
}

/**
 * The API's relevance tier, recomputed client-side with the same parser the
 * Worker uses: 2 = every role word is in the title, 1 = some are, 0 = the query
 * only appears in the body, tags, company or location ("free barista coffee"
 * for a barista search). Grade words and bracketed qualifiers never count.
 */
export function queryTitleRank(query: string, title: string): 0 | 1 | 2 {
  return jobTitleRank(parseJobQuery(query), title)
}

/**
 * What the search actually matched on, when that differs from what was typed:
 * `searched` is the role words, `ranking` the words that only order results
 * ("senior", "(react)"), `dropped` the connector / arrangement words.
 */
export function describeJobQuery(
  query: string
): { searched: string; ranking: string[]; dropped: string[] } | null {
  const parsed = parseJobQuery(query)
  if (parsed.ranking.length === 0 && parsed.dropped.length === 0) return null
  return { searched: parsed.upstream, ranking: parsed.ranking, dropped: parsed.dropped }
}

export type LocationTier = 'direct' | 'wider' | 'anywhere'

/**
 * How a posting's location relates to the user's location filter:
 * `direct` — names the place (or the same country under another name),
 * `wider` — names the place's country or a region containing it,
 * `anywhere` — open to any location, `null` — somewhere else.
 */
export function locationTier(location: string, filter: string): LocationTier | null {
  const l = norm(location)
  const f = norm(filter)
  if (!f) return 'direct'
  if (typedMatch(l, f)) return 'direct'
  const sameCity = CITY_SYNONYMS.find((names) => names.includes(f)) ?? []
  if (sameCity.some((name) => name !== f && mentions(l, name))) return 'direct'
  const country = countryOf(f)
  if (country && !cityCountry(f)) {
    if (COUNTRY_ALIASES[country].some((a) => mentions(l, a))) return 'direct'
  }
  for (const aliases of Object.values(REGION_ALIASES)) {
    if (aliases.includes(f) && aliases.some((a) => mentions(l, a))) return 'direct'
  }
  for (const area of widerAreasOf(f)) {
    const aliases = COUNTRY_ALIASES[area] ?? REGION_ALIASES[area] ?? [area.toLowerCase()]
    if (aliases.some((a) => mentions(l, a))) return 'wider'
  }
  if (isLocationAgnostic(location)) return 'anywhere'
  return null
}

/**
 * Distinct candidate regions across listings with posting counts, most
 * common first (ties alphabetical). Compound locations ("LATAM, Europe, USA")
 * count once toward each listed region. Location-agnostic postings are
 * skipped — they match any location filter anyway.
 */
export function locationFacets(
  locations: readonly string[],
  cap = 8
): { label: string; count: number }[] {
  const byKey = new Map<string, { label: string; count: number }>()
  for (const raw of locations) {
    if (isLocationAgnostic(raw)) continue
    for (const part of raw.split(',')) {
      const label = part.trim()
      if (label === '' || isLocationAgnostic(label)) continue
      const key = label.toLowerCase()
      const entry = byKey.get(key)
      if (entry) entry.count++
      else byKey.set(key, { label, count: 1 })
    }
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

/** A broader query the API found more complete title matches for, with its real counts. */
export interface JobBroaden {
  query: string
  jobs: number
  titled: number
}

export interface JobSearchResult {
  jobs: JobListing[]
  /** Present only when the typed query has few complete title matches. */
  broaden: JobBroaden[]
}

/** `location` lets the API add on-site postings for that place (The Muse) to the remote feeds. */
export async function searchJobsWithMeta(
  q: string,
  category = '',
  location = ''
): Promise<JobSearchResult> {
  const params = new URLSearchParams({ q })
  if (category) params.set('category', category)
  if (location.trim()) params.set('location', location.trim())
  let res: Response
  try {
    res = await fetch(`/api/jobs/search?${params}`)
  } catch {
    throw new Error('Loading jobs failed — check your connection and try again.')
  }
  const data = (await res.json().catch(() => ({}))) as {
    jobs?: JobListing[]
    broaden?: JobBroaden[]
    error?: string
  }
  if (!res.ok) throw new Error(data.error || `Job search failed (${res.status})`)
  return {
    // Upstream company/title strings can carry stray whitespace (e.g. Remotive)
    jobs: (data.jobs ?? []).map((j) => ({
      ...j,
      title: (j.title ?? '').trim(),
      company: (j.company ?? '').trim(),
    })),
    broaden: Array.isArray(data.broaden) ? data.broaden : [],
  }
}

export async function searchJobs(q: string, category = '', location = ''): Promise<JobListing[]> {
  return (await searchJobsWithMeta(q, category, location)).jobs
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
  if (j.descriptionTruncated === true) job.descriptionTruncated = true
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
  if (typeof e.interviewDocId === 'string') entry.interviewDocId = e.interviewDocId
    if (typeof e.resignationDocId === 'string') entry.resignationDocId = e.resignationDocId
  if (typeof e.notes === 'string') entry.notes = e.notes
  if (typeof e.followedUpAt === 'number' && Number.isFinite(e.followedUpAt))
    entry.followedUpAt = e.followedUpAt
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
  // A job tracked again picks its documents back up, like its targeted copy.
  const written = prev ? {} : latestDocsFor(job.id)
  return savePipeline([
    {
      job,
      status,
      updatedAt: now,
      history,
      ...(prev?.resumeVersionId ? { resumeVersionId: prev.resumeVersionId } : {}),
      ...(prev?.coverDocId
        ? { coverDocId: prev.coverDocId }
        : written.cover
          ? { coverDocId: written.cover.id }
          : {}),
      ...(prev?.interviewDocId
        ? { interviewDocId: prev.interviewDocId }
        : written.interview
          ? { interviewDocId: written.interview.id }
          : {}),
      ...(prev?.resignationDocId
        ? { resignationDocId: prev.resignationDocId }
        : written.resignation
          ? { resignationDocId: written.resignation.id }
          : {}),
      ...(prev?.notes ? { notes: prev.notes } : {}),
      ...(prev?.remindOn !== undefined ? { remindOn: prev.remindOn } : {}),
      ...(prev?.followedUpAt !== undefined ? { followedUpAt: prev.followedUpAt } : {}),
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

/** Record that the user followed up on a job now: resets staleness and clears the reminder. */
export function markFollowedUp(jobId: string): PipelineEntry[] | null {
  return savePipeline(
    listPipeline().map((e) =>
      e.job.id === jobId ? { ...e, followedUpAt: Date.now(), remindOn: undefined } : e
    )
  )
}

/** Link the pipeline entry for a job to the cover letter written for it. */
export function setPipelineCoverDoc(jobId: string, coverDocId: string): PipelineEntry[] | null {
  return savePipeline(
    listPipeline().map((e) => (e.job.id === jobId ? { ...e, coverDocId } : e))
  )
}

/** Link the pipeline entry for a job to the resignation letter written at its offer stage. */
export function setPipelineResignationDoc(
  jobId: string,
  resignationDocId: string
): PipelineEntry[] | null {
  return savePipeline(
    listPipeline().map((e) => (e.job.id === jobId ? { ...e, resignationDocId } : e))
  )
}

/** Link the pipeline entry for a job to the interview prep brief written for it. */
export function setPipelineInterviewDoc(
  jobId: string,
  interviewDocId: string
): PipelineEntry[] | null {
  return savePipeline(
    listPipeline().map((e) => (e.job.id === jobId ? { ...e, interviewDocId } : e))
  )
}

/** Whether a resume's target (as written by Save / Target my resume) is this job: same company,
 * and the same title or the same posting text (the title may have been edited in the builder). */
export function copyTargetsJob(
  data: { targetRole: string; targetCompany?: string; jobDescription: string },
  job: JobListing
): boolean {
  const description = job.description.trim()
  return (
    (data.targetCompany ?? '').trim() === job.company.trim() &&
    (data.targetRole.trim() === job.title.trim() ||
      (description !== '' && data.jobDescription.trim() === description))
  )
}

interface CopyAim {
  data: { targetRole: string; targetCompany?: string; jobDescription: string }
  forJob?: VersionJobRef
}

/** Whether the job a copy was created for (forJob) still describes where it is aimed: yes while its
 * target matches that job, or when only the role/description changed within the same company and no
 * other tracked job matches; no once it was re-aimed at another company or another tracked job. */
export function copyKeepsProvenance(copy: CopyAim, pipeline: readonly PipelineEntry[]): boolean {
  const ref = copy.forJob
  if (!ref) return false
  const own = pipeline.find((e) => e.job.id === ref.id)
  if (own && copyTargetsJob(copy.data, own.job)) return true
  const company = (copy.data.targetCompany ?? '').trim()
  if (company !== '' && company !== ref.company.trim()) return false
  return !pipeline.some((e) => e.job.id !== ref.id && copyTargetsJob(copy.data, e.job))
}

/** The tracked job a copy is aimed at: the job it was created for while it still targets it, else the
 * job its target fields match. */
export function trackedJobOfCopy(
  copy: CopyAim,
  pipeline: readonly PipelineEntry[]
): PipelineEntry | undefined {
  const ref = copy.forJob
  return (
    (ref && copyKeepsProvenance(copy, pipeline)
      ? pipeline.find((e) => e.job.id === ref.id)
      : undefined) ?? pipeline.find((e) => copyTargetsJob(copy.data, e.job))
  )
}

/** Stamp forJob on copies a tracked job links but that never recorded their job (saved before forJob existed). */
export function rememberLinkedCopyJobs(pipeline: readonly PipelineEntry[]): ResumeVersion[] {
  const jobByVersion = new Map<string, VersionJobRef>()
  for (const e of pipeline)
    if (e.resumeVersionId)
      jobByVersion.set(e.resumeVersionId, {
        id: e.job.id,
        title: e.job.title,
        company: e.job.company,
      })
  return rememberVersionJobs(jobByVersion)
}

/** Whether the tracked job's copy link still points at an existing copy. */
export function jobLinksLiveCopy(
  entry: PipelineEntry,
  versions: readonly { id: string }[]
): boolean {
  return (
    entry.resumeVersionId !== undefined && versions.some((v) => v.id === entry.resumeVersionId)
  )
}

/** Link the pipeline entry for a job to its targeted resume copy; the copy records that job as its own. */
export function setPipelineVersion(
  jobId: string,
  resumeVersionId: string
): PipelineEntry[] | null {
  const all = listPipeline()
  const saved = savePipeline(
    all.map((e) => (e.job.id === jobId ? { ...e, resumeVersionId } : e))
  )
  const job = saved ? all.find((e) => e.job.id === jobId)?.job : undefined
  if (job) setVersionJob(resumeVersionId, { id: job.id, title: job.title, company: job.company })
  return saved
}

export function removeFromPipeline(id: string): PipelineEntry[] | null {
  return savePipeline(listPipeline().filter((e) => e.job.id !== id))
}

export interface RemovedPipelineEntry {
  entry: PipelineEntry
  index: number
}

/** Put untracked entries back where they were (Undo); a job tracked again meanwhile is skipped. */
export function restorePipelineEntries(
  removed: readonly RemovedPipelineEntry[]
): PipelineEntry[] | null {
  const next = listPipeline()
  const present = new Set(next.map((e) => e.job.id))
  for (const { entry, index } of [...removed].sort((a, b) => a.index - b.index)) {
    if (present.has(entry.job.id)) continue
    next.splice(Math.min(index, next.length), 0, entry)
    present.add(entry.job.id)
  }
  return savePipeline(next)
}
